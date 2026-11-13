import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createCatBodyTexture, createCatHeadTexture, createCatTailTexture, createZzzTexture } from '../textures'

/* The sleeping desk cat, exactly as it was before the realism pass (restored on request). */

const BREATH = 2.8 // seconds per breath

/**
 * A white cat curled up asleep on the desk: slow breathing, and "Z"s drifting up.
 * Local space: body along X with the head at +X, belly and tail towards +Z.
 */
export function Cat() {
  const body = useMemo(() => createCatBodyTexture(), [])
  const head = useMemo(() => createCatHeadTexture(), [])
  const tailTex = useMemo(() => createCatTailTexture(), [])
  const zTex = useMemo(() => createZzzTexture(), [])
  const tail = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.2, 0.06, -0.04),
          new THREE.Vector3(-0.25, 0.035, 0.07),
          new THREE.Vector3(-0.15, 0.024, 0.165),
          new THREE.Vector3(0.0, 0.022, 0.185),
          new THREE.Vector3(0.1, 0.022, 0.175),
        ]),
        32,
        0.022,
        10,
      ),
    [],
  )
  useEffect(
    () => () => {
      body.dispose()
      head.dispose()
      tailTex.dispose()
      zTex.dispose()
      tail.dispose()
    },
    [body, head, tailTex, zTex, tail],
  )
  const chest = useRef<THREE.Group>(null)
  const skull = useRef<THREE.Group>(null)
  const zs = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // Inhale is a little quicker than exhale, like a real sleeping animal.
    const phase = (t / BREATH) % 1
    const b = phase < 0.4 ? Math.sin((phase / 0.4) * (Math.PI / 2)) : Math.cos(((phase - 0.4) / 0.6) * (Math.PI / 2))
    chest.current?.scale.set(1 + b * 0.012, 1 + b * 0.05, 1 + b * 0.025)
    if (skull.current) skull.current.position.y = 0.07 + b * 0.003
    zs.current?.children.forEach((z, i) => {
      const k = (t * 0.22 + i / 3) % 1
      const s = 0.035 + k * 0.05
      z.position.set(0.24 + k * 0.1 + Math.sin(k * 6 + i) * 0.015, 0.16 + k * 0.3, 0.05)
      z.scale.set(s, s, s)
      ;((z as THREE.Sprite).material as THREE.SpriteMaterial).opacity = Math.sin(k * Math.PI) * 0.9
    })
  })

  const fur = (map?: THREE.Texture, color = '#ffffff') => <meshStandardMaterial map={map} color={color} roughness={0.95} />

  return (
    <group position={[1.2, 0.0075, 0.03]} rotation={[0, 0.35, 0]} scale={1.2}>
      {/* Body + haunch breathe together, scaled from the desk surface up */}
      <group ref={chest}>
        {/* Poles along the spine (local Y -> world X): belly shading sits underneath */}
        <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.085, 0.19, 0.13]} castShadow>
          <sphereGeometry args={[1, 32, 20]} />
          {fur(body)}
        </mesh>
        <mesh position={[-0.1, 0.082, -0.01]} rotation={[0, 0, Math.PI / 2]} scale={[0.085, 0.12, 0.12]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
          {fur(body)}
        </mesh>
      </group>
      {/* Hind paw tucked in front of the belly */}
      <mesh position={[-0.07, 0.03, 0.115]} scale={[0.065, 0.03, 0.045]} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
        {fur(undefined, '#f4f1ec')}
      </mesh>
      {/* Tail wrapped round the front */}
      <mesh geometry={tail} castShadow>
        {fur(tailTex)}
      </mesh>
      <mesh position={[0.1, 0.022, 0.175]}>
        <sphereGeometry args={[0.022, 12, 10]} />
        {fur(undefined, '#f4f1ec')}
      </mesh>
      {/* Front paws under the chin */}
      {[0.1, 0.145].map((zp) => (
        <mesh key={zp} position={[0.2, 0.02, zp]} rotation={[0, -0.3, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.02, 0.06, 6, 12]} />
          {fur(undefined, '#f4f1ec')}
        </mesh>
      ))}
      {/* Head resting on the paws, face turned to the front of the desk */}
      <group ref={skull} position={[0.18, 0.07, 0.07]} rotation={[0.16, -0.05, -0.08]}>
        <mesh scale={[1, 0.86, 0.95]} castShadow>
          <sphereGeometry args={[0.075, 32, 20]} />
          {fur(head)}
        </mesh>
        {/* Muzzle + nose */}
        <mesh position={[0, -0.024, 0.056]} scale={[0.034, 0.024, 0.024]}>
          <sphereGeometry args={[1, 16, 12]} />
          {fur(undefined, '#fbf8f4')}
        </mesh>
        <mesh position={[0, -0.012, 0.078]} scale={[1.3, 0.8, 1]}>
          <sphereGeometry args={[0.007, 10, 8]} />
          <meshStandardMaterial color="#ee9aa6" roughness={0.6} />
        </mesh>
        {/* Closed eyes: two little downward arcs */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.027, 0.006, 0.064]} rotation={[-0.15, sx * 0.4, Math.PI]}>
            <torusGeometry args={[0.011, 0.0022, 6, 12, Math.PI]} />
            <meshBasicMaterial color="#2a2530" />
          </mesh>
        ))}
        {/* Ears */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.042, 0.055, -0.005]} rotation={[-0.25, 0, -sx * 0.4]}>
            <mesh castShadow>
              <coneGeometry args={[0.027, 0.05, 12]} />
              {fur(undefined, '#f4f1ec')}
            </mesh>
            <mesh position={[0, -0.004, 0.009]} scale={[1, 1, 0.5]}>
              <coneGeometry args={[0.016, 0.032, 10]} />
              <meshStandardMaterial color="#f0b4bd" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Zzz */}
      <group ref={zs}>
        {[0, 1, 2].map((i) => (
          <sprite key={i}>
            <spriteMaterial map={zTex} transparent depthWrite={false} toneMapped={false} />
          </sprite>
        ))}
      </group>
    </group>
  )
}
