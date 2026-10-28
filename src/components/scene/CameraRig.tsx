import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { getState, setState, useStore } from '@/lib/store'
import { HOME, poseFor } from './layout'

const DURATION = 1.1 // seconds

interface Tween {
  fromPos: THREE.Vector3
  fromTarget: THREE.Vector3
  toPos: THREE.Vector3
  toTarget: THREE.Vector3
  start: number
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** On narrow screens pull the overview camera back so the whole desk fits. */
function homePos(aspect: number) {
  const k = aspect < 1 ? 1 + (1 - aspect) * 1.7 : 1
  return new THREE.Vector3(...HOME.pos).sub(new THREE.Vector3(...HOME.target)).multiplyScalar(k).add(new THREE.Vector3(...HOME.target))
}

/**
 * Free orbit (drag) while nothing is focused; a timed fly-to when something is.
 * The orbit pose is remembered so "back" returns to where the visitor left off.
 */
export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera)
  const aspect = useThree((s) => s.size.width / s.size.height)
  const focus = useStore((s) => s.focus)
  const tween = useRef<Tween | null>(null)
  const saved = useRef({ pos: homePos(aspect), target: new THREE.Vector3(...HOME.target) })

  useEffect(() => {
    camera.position.copy(homePos(aspect))
    saved.current.pos.copy(camera.position)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial framing only
  }, [camera])

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let to: { pos: THREE.Vector3; target: THREE.Vector3 }
    if (focus) {
      if (c.enabled) {
        saved.current.pos.copy(camera.position)
        saved.current.target.copy(c.target)
      }
      c.enabled = false
      const p = poseFor(focus)
      to = { pos: new THREE.Vector3(...p.pos), target: new THREE.Vector3(...p.target) }
    } else {
      to = { pos: saved.current.pos.clone(), target: saved.current.target.clone() }
    }
    tween.current = {
      fromPos: camera.position.clone(),
      fromTarget: c.target.clone(),
      toPos: to.pos,
      toTarget: to.target,
      start: reduce ? -Infinity : performance.now(),
    }
    // Overlays must not depend on the render loop (it pauses in background tabs).
    const timer = window.setTimeout(() => finish(), reduce ? 0 : DURATION * 1000 + 150)
    return () => window.clearTimeout(timer)
  }, [focus, camera])

  const finish = () => {
    const c = controls.current
    const t = tween.current
    if (!c) return
    if (t) {
      camera.position.copy(t.toPos)
      c.target.copy(t.toTarget)
      camera.lookAt(c.target)
      tween.current = null
    }
    if (getState().focus) {
      if (!getState().arrived) setState({ arrived: true })
    } else if (!c.enabled) {
      c.enabled = true
      c.update()
    }
  }

  useFrame(() => {
    const c = controls.current
    const t = tween.current
    if (!c || !t) return
    const p = Math.min((performance.now() - t.start) / (DURATION * 1000), 1)
    const k = ease(p)
    camera.position.lerpVectors(t.fromPos, t.toPos, k)
    c.target.lerpVectors(t.fromTarget, t.toTarget, k)
    camera.lookAt(c.target)
    if (p >= 1) finish()
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={HOME.target}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      minDistance={2.6}
      maxDistance={7.2}
      minPolarAngle={0.55}
      maxPolarAngle={1.4}
      minAzimuthAngle={-0.3}
      maxAzimuthAngle={1.15}
    />
  )
}
