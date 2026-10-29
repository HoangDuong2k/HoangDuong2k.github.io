import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { getState, setState, useStore } from '@/lib/store'
import { QUALITY, lowerTier, rememberTier } from '@/lib/quality'
import { CameraRig } from './CameraRig'
import { Desk } from './Desk'
import { HOME } from './layout'

/**
 * The room is static, so the shadow map is rendered once (and again only when
 * its resolution changes) instead of every frame. Saves the whole depth pass.
 */
function ShadowBaker({ size }: { size: number }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    scene.traverse((o) => {
      if ((o as THREE.DirectionalLight).isDirectionalLight && o.castShadow) {
        const light = o as THREE.DirectionalLight
        light.shadow.mapSize.set(size, size)
        light.shadow.map?.dispose()
        light.shadow.map = null
      }
    })
    // A couple of frames later everything (incl. Suspense children) is mounted.
    gl.shadowMap.needsUpdate = true
    const t = window.setTimeout(() => (gl.shadowMap.needsUpdate = true), 300)
    return () => window.clearTimeout(t)
  }, [gl, scene, size])
  return null
}

/** Step quality down when the frame rate can't keep up; never steps back up. */
function AdaptiveQuality({ locked }: { locked: boolean }) {
  const started = useRef(performance.now())
  return (
    <PerformanceMonitor
      flipflops={2}
      onDecline={() => {
        // Ignore shader-compile hitches on load, and frames while an overlay pauses the loop.
        if (locked || performance.now() - started.current < 4000 || getState().focus) return
        const next = lowerTier(getState().tier)
        if (next === getState().tier) return
        rememberTier(next)
        setState({ tier: next })
      }}
    />
  )
}

export function Scene({ lockedTier }: { lockedTier: boolean }) {
  const tier = useStore((s) => s.tier)
  const q = QUALITY[tier]
  // Context attributes can't change after creation, so MSAA follows the tier the visit started on.
  const [antialias] = useState(q.antialias)
  // Once an overlay fully owns the view the 3D scene can stop rendering.
  const covered = useStore((s) => s.focus !== null && s.arrived)

  return (
    <Canvas
      shadows={q.shadowMap > 0 ? 'percentage' : false}
      dpr={q.dpr}
      frameloop={covered ? 'never' : 'always'}
      camera={{ fov: 40, position: HOME.pos, near: 0.05, far: 60 }}
      gl={{
        antialias,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={({ gl, scene, camera }) => {
        if (import.meta.env.DEV) Object.assign(window, { __gl: gl, __scene: scene, __cam: camera })
      }}
    >
      <AdaptiveQuality locked={lockedTier} />
      <color attach="background" args={['#0c0b14']} />
      <fog attach="fog" args={['#0c0b14', 9, 16]} />

      {/* Moody base: low ambient and a cool key light. The coloured light from the gear is baked
          into additive "light pools" (see Desk), so it costs nothing per frame. */}
      <hemisphereLight args={['#b9b4ff', '#1a1626', q.envResolution ? 0.5 : 1.1]} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={0.9}
        color="#dcd8ff"
        castShadow={q.shadowMap > 0}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <pointLight position={[2.6, 1.6, 2.4]} intensity={2} distance={7} color="#7dd3fc" />
      {/* Without reflections dark gloss (chair, desk, case) loses its sheen; a shadowless light
          from the viewer's side gives it back for the cost of one dot product per pixel. */}
      {!q.envResolution && <directionalLight position={[4, 2.5, 6]} intensity={0.9} color="#c7bfff" />}
      {q.shadowMap > 0 && <ShadowBaker size={q.shadowMap} />}

      {/* Procedural studio reflections, no HDR download needed. */}
      {q.envResolution > 0 && (
        <Environment key={q.envResolution} resolution={q.envResolution} frames={1}>
          <Lightformer form="rect" intensity={2} color="#8b5cf6" position={[-3, 2, 2]} scale={[3, 2, 1]} />
          <Lightformer form="rect" intensity={1.5} color="#22d3ee" position={[3, 2, 2]} scale={[3, 2, 1]} />
          <Lightformer form="rect" intensity={1} color="#ffffff" position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[4, 4, 1]} />
        </Environment>
      )}

      <Desk />
      <CameraRig />
    </Canvas>
  )
}
