import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { getBrushedNormal } from '../surfaces'
import { C, Mat, bump, glow, sculpt } from '../kit'
import { getGlowTexture } from '../textures'

/* ---------------------------------------------------------------------------------------------- */
/* Keyboard: tenkeyless layout, sculpted keycaps, two-tone set                                     */
/* ---------------------------------------------------------------------------------------------- */

const U = 0.057 // one key unit
type Key = { w: number; tone: -1 | 0 | 1 | 2 } // -1 gap, 0 alpha, 1 modifier, 2 accent

const ROWS: Key[][] = (() => {
  const keys = (n: number, tone: Key['tone'] = 0): Key[] => Array.from({ length: n }, () => ({ w: 1, tone }))
  const m = (w: number): Key => ({ w, tone: 1 })
  const gap = (w: number): Key => ({ w, tone: -1 })
  return [
    [{ w: 1, tone: 2 }, gap(0.6), ...keys(4, 1), gap(0.4), ...keys(4), gap(0.4), ...keys(4, 1)],
    [...keys(13), m(2)],
    [m(1.5), ...keys(12), m(1.5)],
    [m(1.75), ...keys(11), { w: 2.25, tone: 2 }],
    [m(2.25), ...keys(10), m(2.75)],
    [m(1.25), m(1.25), m(1.25), { w: 6.25, tone: 0 }, m(1.25), m(1.25), m(1.25), m(1.25)],
  ]
})()

const TONES = ['#eeeef3', '#c9c8d6', '#a78bfa'].map((c) => new THREE.Color(c))

export function Keyboard() {
  const keys = useRef<THREE.InstancedMesh>(null)
  const layout = useMemo(() => {
    const out: { x: number; z: number; w: number; tone: number }[] = []
    ROWS.forEach((row, r) => {
      let x = -7.5 * U
      const z = -0.15 + r * U + (r > 0 ? 0.012 : 0)
      for (const k of row) {
        if (k.tone >= 0) out.push({ x: x + (k.w * U) / 2, z, w: k.w, tone: k.tone })
        x += k.w * U
      }
    })
    return out
  }, [])
  const cap = useMemo(
    () =>
      sculpt(new RoundedBoxGeometry(0.05, 0.022, 0.05, 2, 0.006), (v) => {
        // Sculpted cap: narrower top with a shallow cylindrical dish.
        const top = (v.y + 0.011) / 0.022
        v.x *= 1 - 0.18 * top
        v.z *= 1 - 0.2 * top
        if (v.y > 0.008) v.y -= 0.0018 * (1 - (v.x / 0.02) ** 2)
      }),
    [],
  )
  useEffect(() => () => cap.dispose(), [cap])
  useLayoutEffect(() => {
    const mesh = keys.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const s = new THREE.Vector3()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    layout.forEach((k, i) => {
      // Wide keys keep the same edge gap as 1u keys.
      s.set((k.w * U - 0.007) / 0.05, 1, 1)
      p.set(k.x, 0.041, k.z)
      m.compose(p, q, s)
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, TONES[k.tone])
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [layout])
  const caseGeo = useMemo(() => new RoundedBoxGeometry(0.93, 0.03, 0.39, 4, 0.012), [])
  useEffect(() => () => caseGeo.dispose(), [caseGeo])
  return (
    <group position={[0, 0, 0.24]} rotation={[0.035, 0, 0]}>
      <mesh geometry={caseGeo} position={[0, 0.017, -0.01]} castShadow receiveShadow>
        <Mat color="#121218" rough={0.3} metal={0.5} normalMap={getBrushedNormal()} normalScale={0.15} />
      </mesh>
      {/* Plate between the keys */}
      <mesh position={[0, 0.0325, -0.01]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.37]} />
        <Mat color="#0a0a0e" rough={0.6} />
      </mesh>
      <instancedMesh ref={keys} args={[cap, undefined, layout.length]} castShadow>
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>
      {/* Volume knob */}
      <mesh position={[0.4, 0.046, -0.175]}>
        <cylinderGeometry args={[0.013, 0.013, 0.02, 24]} />
        <Mat color="#b8bac4" rough={0.25} metal={0.9} />
      </mesh>
    </group>
  )
}

/* ---------------------------------------------------------------------------------------------- */
/* Mouse                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

export function Mouse() {
  const shell = useMemo(
    () =>
      sculpt(new THREE.SphereGeometry(1, 48, 32), (v) => {
        const z = v.z // -1 back .. 1 front
        // Hump towards the back, low nose, flat underside.
        const hump = 0.75 + 0.35 * bump(z + 0.25, 0.9)
        v.y = v.y > 0 ? v.y * 0.024 * hump : v.y * 0.006
        v.x *= 0.032 * (1 - 0.12 * Math.max(0, z)) * (1 + 0.08 * bump(z + 0.3, 0.6))
        v.z *= 0.062
      }),
    [],
  )
  useEffect(() => () => shell.dispose(), [shell])
  return (
    <group position={[0.85, 0.008, 0.3]} rotation={[0, -0.15, 0]}>
      <mesh geometry={shell} castShadow>
        <Mat color="#15151c" rough={0.42} metal={0.2} />
      </mesh>
      {/* Button split and scroll wheel */}
      <mesh position={[0, 0.0225, 0.032]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.0012, 0.004, 0.05]} />
        <meshBasicMaterial color="#050507" />
      </mesh>
      <mesh position={[0, 0.024, 0.03]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.007, 0.007, 0.006, 20]} />
        <Mat color="#2a2a33" rough={0.7} />
      </mesh>
      {/* Side buttons */}
      {[0.006, 0.026].map((z) => (
        <mesh key={z} position={[-0.031, 0.012, z]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.0035, 0.012, 4, 8]} />
          <Mat color="#24242c" rough={0.4} />
        </mesh>
      ))}
      {/* Logo light on the palm rest */}
      <mesh position={[0, 0.0245, -0.022]} rotation={[-Math.PI / 2 + 0.15, 0, 0]}>
        <circleGeometry args={[0.007, 20]} />
        <meshBasicMaterial color={glow(C.violet, 2.4)} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------------------------------------------------------------------------------------------- */
/* Headset on its stand                                                                           */
/* ---------------------------------------------------------------------------------------------- */

export function Headset() {
  const cup = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0, -0.022],
          [0.042, -0.022],
          [0.05, -0.016],
          [0.054, 0],
          [0.05, 0.016],
          [0.044, 0.02],
          [0, 0.02],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        40,
      ).rotateZ(Math.PI / 2),
    [],
  )
  const mic = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.02, 0.02), new THREE.Vector3(0.02, -0.07, 0.06), new THREE.Vector3(0.05, -0.1, 0.085)]),
        20,
        0.003,
        8,
      ),
    [],
  )
  useEffect(
    () => () => {
      cup.dispose()
      mic.dispose()
    },
    [cup, mic],
  )
  const alu = { color: '#3a3b45', rough: 0.3, metal: 0.85, normalMap: getBrushedNormal(), normalScale: 0.25 }
  return (
    <group position={[-0.62, 0, -0.28]} rotation={[0, 0.4, 0]}>
      {/* Weighted base, post and cradle */}
      <mesh position={[0, 0.008, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.075, 0.08, 0.016, 40]} />
        <Mat {...alu} />
      </mesh>
      <mesh position={[0, 0.0165, 0]}>
        <cylinderGeometry args={[0.068, 0.068, 0.002, 40]} />
        <Mat color="#0e0e13" rough={0.9} />
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.009, 0.011, 0.3, 16]} />
        <Mat {...alu} />
      </mesh>
      <mesh position={[0, 0.32, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.04, 0.008, 10, 24, Math.PI]} />
        <Mat color="#121218" rough={0.5} />
      </mesh>
      {/* Headband: steel band with a padded cushion underneath */}
      <group position={[0, 0.3, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.1, 0.006, 8, 40, Math.PI]} />
          <Mat color="#9fa3ad" rough={0.3} metal={0.9} />
        </mesh>
        <mesh position={[0, -0.006, 0]} scale={[1, 1, 2.2]} castShadow>
          <torusGeometry args={[0.092, 0.011, 10, 40, Math.PI]} />
          <Mat color="#17161d" rough={0.85} />
        </mesh>
      </group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.105, 0.255, 0]}>
          {/* Slider */}
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.008, 0.05, 0.016]} />
            <Mat color="#9fa3ad" rough={0.3} metal={0.9} />
          </mesh>
          {/* Cup, leatherette cushion facing in, light ring facing out */}
          <mesh geometry={cup} castShadow>
            <Mat color="#15151b" rough={0.4} metal={0.3} />
          </mesh>
          <mesh position={[-s * 0.022, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.038, 0.013, 12, 32]} />
            <Mat color="#0f0f14" rough={0.8} />
          </mesh>
          <mesh position={[s * 0.0205, 0, 0]} rotation={[0, s * (Math.PI / 2), 0]}>
            <ringGeometry args={[0.03, 0.036, 40]} />
            <meshBasicMaterial color={glow(C.cyan, 2)} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
          {s < 0 && (
            <group position={[s * 0.02, 0, 0]}>
              <mesh geometry={mic}>
                <Mat color="#15151b" rough={0.5} />
              </mesh>
              <mesh position={[0.05, -0.1, 0.085]}>
                <capsuleGeometry args={[0.007, 0.012, 6, 12]} />
                <Mat color="#0c0c10" rough={0.95} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

/* ---------------------------------------------------------------------------------------------- */
/* Mug                                                                                            */
/* ---------------------------------------------------------------------------------------------- */

export function Mug() {
  const body = useMemo(
    () =>
      new THREE.LatheGeometry(
        // Outer wall up, over the rim, and down the inside: a real wall thickness.
        [
          [0, 0.004],
          [0.052, 0],
          [0.058, 0.006],
          [0.06, 0.03],
          [0.061, 0.14],
          [0.0605, 0.15],
          [0.056, 0.15],
          [0.055, 0.14],
          [0.054, 0.02],
          [0, 0.014],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        48,
      ),
    [],
  )
  const handle = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.056, 0.125, 0),
          new THREE.Vector3(0.09, 0.122, 0),
          new THREE.Vector3(0.1, 0.085, 0),
          new THREE.Vector3(0.088, 0.045, 0),
          new THREE.Vector3(0.056, 0.04, 0),
        ]),
        32,
        0.008,
        12,
      ).scale(1, 1, 1.4),
    [],
  )
  useEffect(
    () => () => {
      body.dispose()
      handle.dispose()
    },
    [body, handle],
  )
  const steam = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    steam.current?.children.forEach((s, i) => {
      const t = (clock.elapsedTime * 0.35 + i / 3) % 1
      s.position.y = 0.16 + t * 0.2
      s.position.x = Math.sin(t * 5 + i) * 0.012
      s.scale.set(0.03 + t * 0.04, 0.05 + t * 0.07, 1)
      ;((s as THREE.Sprite).material as THREE.SpriteMaterial).opacity = 0.07 * Math.sin(t * Math.PI)
    })
  })
  return (
    <group position={[1.45, 0, 0.45]}>
      <mesh geometry={body} castShadow receiveShadow>
        <meshStandardMaterial color="#ece9f5" roughness={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={handle} castShadow>
        <meshStandardMaterial color="#ece9f5" roughness={0.18} />
      </mesh>
      {/* Coffee with a little crema at the edge */}
      <mesh position={[0, 0.128, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.0545, 40]} />
        <meshStandardMaterial color="#2a170c" roughness={0.12} />
      </mesh>
      <mesh position={[0, 0.1285, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.046, 0.0545, 40]} />
        <meshStandardMaterial color="#7a4a26" roughness={0.4} transparent opacity={0.6} />
      </mesh>
      <group ref={steam}>
        {[0, 1, 2].map((i) => (
          <sprite key={i} raycast={() => null}>
            <spriteMaterial map={getGlowTexture()} color="#ffffff" transparent depthWrite={false} />
          </sprite>
        ))}
      </group>
    </group>
  )
}
