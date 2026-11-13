import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getBrushedNormal, getGlassStreakTexture, getPcbTexture, getPerforatedMaps } from '../surfaces'
import { C, FLAT, LightPool, Mat, glow, roundedRectShape, sculpt } from '../kit'

/**
 * Mid-tower gaming PC: mesh front with three ARGB intake fans behind it, tempered-glass side
 * (+Z) showing a real build — motherboard, RAM with light bars, AIO pump and radiator, GPU,
 * PSU shroud, braided cables and a rear exhaust fan. Front of the case is +X.
 */

const W = 0.58 // front-to-back
const H = 0.66
const D = 0.3 // side-to-side; glass at +D/2

let fanGeo: { frame: THREE.BufferGeometry; blade: THREE.BufferGeometry } | null = null
function getFanGeometry() {
  if (fanGeo) return fanGeo
  const shape = roundedRectShape(0.14, 0.14, 0.012)
  const hole = new THREE.Path()
  hole.absarc(0, 0, 0.064, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const frame = new THREE.ExtrudeGeometry(shape, { depth: 0.022, bevelEnabled: false, curveSegments: 24 }).translate(0, 0, -0.011)
  // A swept, pitched blade.
  const blade = sculpt(new THREE.BoxGeometry(0.03, 0.05, 0.0025, 4, 6, 1).translate(0, 0.038, 0), (v) => {
    const k = (v.y - 0.013) / 0.05
    v.x += 0.012 * k * k
    v.z += v.x * 0.5
  })
  fanGeo = { frame, blade }
  return fanGeo
}

function Fan({ ring, position, rotation, spin = 1 }: { ring: string; position: [number, number, number]; rotation: [number, number, number]; spin?: number }) {
  const g = getFanGeometry()
  const blades = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z -= dt * 7 * spin
  })
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={g.frame}>
        <Mat color="#15151b" rough={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.02, 20]} />
        <Mat color="#1d1d25" rough={0.4} />
      </mesh>
      <group ref={blades}>
        {[0, 1, 2, 3, 4, 5, 6].map((b) => (
          <mesh key={b} geometry={g.blade} rotation={[0, 0, (b / 7) * Math.PI * 2]}>
            <meshStandardMaterial color="#e9e7f5" transparent opacity={0.55} roughness={0.3} emissive={ring} emissiveIntensity={0.35} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0, 0.012]}>
        <torusGeometry args={[0.064, 0.0035, 8, 48]} />
        <meshBasicMaterial color={glow(ring, 2.2)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.012]}>
        <torusGeometry args={[0.064, 0.0035, 8, 48]} />
        <meshBasicMaterial color={glow(ring, 1.6)} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Tube({ points, radius, color }: { points: [number, number, number][]; radius: number; color: string }) {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 32, radius, 10), [points, radius])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo}>
      <Mat color={color} rough={0.6} />
    </mesh>
  )
}

const PUMP_TUBES: [number, number, number][][] = [
  [
    [-0.12, 0.49, -0.1],
    [-0.04, 0.56, -0.06],
    [0.12, 0.6, -0.05],
    [0.2, 0.58, -0.05],
  ],
  [
    [-0.12, 0.45, -0.1],
    [-0.02, 0.52, -0.03],
    [0.12, 0.56, -0.02],
    [0.2, 0.52, -0.02],
  ],
]
const CABLE_24PIN: [number, number, number][] = [
  [0.07, 0.48, -0.115],
  [0.1, 0.47, -0.08],
  [0.11, 0.3, -0.07],
  [0.1, 0.14, -0.08],
]

export function PCTower() {
  const perf = getPerforatedMaps()
  const pcb = getPcbTexture()
  const streak = getGlassStreakTexture()
  const brushed = getBrushedNormal()
  const frontMesh = useMemo(() => {
    const m = perf.map.clone()
    m.repeat.set(4, 9)
    m.needsUpdate = true
    return m
  }, [perf])
  const topMesh = useMemo(() => {
    const m = perf.map.clone()
    m.repeat.set(8, 4)
    m.needsUpdate = true
    return m
  }, [perf])
  useEffect(
    () => () => {
      frontMesh.dispose()
      topMesh.dispose()
    },
    [frontMesh, topMesh],
  )
  const steel = { color: '#17161e', rough: 0.4, metal: 0.6 }
  const ram = [C.cyan, C.violet, C.pink, C.violet]
  return (
    <group position={[1.42, 0, -0.38]} rotation={[0, -0.25, 0]}>
      {/* Feet */}
      {[
        [-W / 2 + 0.05, -D / 2 + 0.04],
        [-W / 2 + 0.05, D / 2 - 0.04],
        [W / 2 - 0.05, -D / 2 + 0.04],
        [W / 2 - 0.05, D / 2 - 0.04],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.008, z]}>
          <cylinderGeometry args={[0.022, 0.026, 0.016, 16]} />
          <Mat color={C.black} rough={0.6} />
        </mesh>
      ))}
      <group position={[0, 0.016, 0]}>
        {/* Steel shell: bottom, back, far side; top with a perforated vent */}
        <mesh position={[0, 0.005, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, 0.01, D]} />
          <Mat {...steel} />
        </mesh>
        <mesh position={[0, H - 0.005, 0]} castShadow>
          <boxGeometry args={[W, 0.01, D]} />
          <meshStandardMaterial attach="material-0" color="#17161e" />
          <meshStandardMaterial attach="material-1" color="#17161e" />
          <meshStandardMaterial attach="material-2" map={topMesh} roughness={0.5} metalness={0.4} />
          <meshStandardMaterial attach="material-3" color="#17161e" />
          <meshStandardMaterial attach="material-4" color="#17161e" />
          <meshStandardMaterial attach="material-5" color="#17161e" />
        </mesh>
        <mesh position={[-W / 2 + 0.005, H / 2, 0]} castShadow>
          <boxGeometry args={[0.01, H, D]} />
          <Mat {...steel} />
        </mesh>
        <mesh position={[0, H / 2, -D / 2 + 0.005]} castShadow>
          <boxGeometry args={[W, H, 0.01]} />
          <Mat {...steel} />
        </mesh>
        {/* Front: aluminium bezel around a dark mesh the fan light glows through */}
        <group position={[W / 2 - 0.006, H / 2, 0]}>
          {[
            [0, H / 2 - 0.015, D, 0.03],
            [0, -H / 2 + 0.015, D, 0.03],
            [-D / 2 + 0.015, 0, 0.03, H],
            [D / 2 - 0.015, 0, 0.03, H],
          ].map(([z, y, w, h], i) => (
            <mesh key={i} position={[0, y, z]} castShadow>
              <boxGeometry args={[0.014, h, w]} />
              <Mat color="#25242d" rough={0.3} metal={0.85} normalMap={brushed} normalScale={0.25} />
            </mesh>
          ))}
          <mesh position={[0.004, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[D - 0.05, H - 0.05]} />
            <meshStandardMaterial map={frontMesh} transparent opacity={0.72} roughness={0.5} metalness={0.4} depthWrite={false} />
          </mesh>
          {/* Power button and LED */}
          <mesh position={[0.008, H / 2 - 0.015, 0.09]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.004, 16]} />
            <meshBasicMaterial color={glow(C.cyan, 2)} toneMapped={false} />
          </mesh>
        </group>

        {/* Case lighting: an LED strip along the top inside edge washes the motherboard tray */}
        <mesh position={[0, H - 0.03, D / 2 - 0.03]}>
          <boxGeometry args={[W - 0.08, 0.004, 0.004]} />
          <meshBasicMaterial color={glow('#c4b5fd', 2.2)} toneMapped={false} />
        </mesh>
        <LightPool position={[-0.05, H - 0.2, -D / 2 + 0.024]} size={[0.6, 0.55]} color="#a78bfa" strength={0.28} />
        {/* Motherboard and rear I/O cover */}
        <mesh position={[-0.1, 0.4, -D / 2 + 0.022]}>
          <planeGeometry args={[0.32, 0.44]} />
          <meshStandardMaterial map={pcb} roughness={0.6} />
        </mesh>
        <mesh position={[-0.22, 0.54, -D / 2 + 0.04]} castShadow>
          <boxGeometry args={[0.07, 0.14, 0.035]} />
          <Mat color="#22222b" rough={0.35} metal={0.6} />
        </mesh>
        <mesh position={[-0.185, 0.54, -D / 2 + 0.058]}>
          <boxGeometry args={[0.003, 0.12, 0.002]} />
          <meshBasicMaterial color={glow(C.violet, 2)} toneMapped={false} />
        </mesh>
        {/* RAM with light bars */}
        {ram.map((c, i) => (
          <group key={i} position={[0.0 + i * 0.012, 0.5, -D / 2 + 0.042]}>
            <mesh>
              <boxGeometry args={[0.007, 0.14, 0.036]} />
              <Mat color="#26262f" rough={0.35} metal={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.019]}>
              <boxGeometry args={[0.006, 0.135, 0.004]} />
              <meshBasicMaterial color={glow(c, 1.8)} toneMapped={false} />
            </mesh>
          </group>
        ))}
        {/* AIO pump block */}
        <group position={[-0.12, 0.47, -D / 2 + 0.04]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.036, 0.038, 0.032, 32]} />
            <Mat color="#1c1c24" rough={0.3} metal={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.017]}>
            <torusGeometry args={[0.03, 0.0035, 8, 40]} />
            <meshBasicMaterial color={glow(C.cyan, 2.2)} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.0165]}>
            <circleGeometry args={[0.026, 32]} />
            <meshBasicMaterial color="#0b0b12" />
          </mesh>
        </group>
        {PUMP_TUBES.map((p, i) => (
          <Tube key={i} points={p} radius={0.007} color="#141419" />
        ))}
        {/* Radiator behind the front fans */}
        <mesh position={[W / 2 - 0.085, 0.38, 0]} castShadow>
          <boxGeometry args={[0.03, 0.5, 0.13]} />
          <Mat color="#1a1a21" rough={0.5} metal={0.6} normalMap={brushed} normalScale={1} />
        </mesh>
        {/* GPU: card edge with its light strip faces the glass, backplate on top */}
        <group position={[-0.07, 0.27, -D / 2 + 0.095]}>
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.062, 0.13]} />
            <Mat color="#1f1f27" rough={0.35} metal={0.6} />
          </mesh>
          <mesh position={[0, 0.033, 0]}>
            <boxGeometry args={[0.33, 0.004, 0.125]} />
            <Mat color="#3a3a46" rough={0.3} metal={0.85} normalMap={brushed} normalScale={0.3} />
          </mesh>
          <mesh position={[0.02, 0.0, 0.066]}>
            <boxGeometry args={[0.24, 0.006, 0.002]} />
            <meshBasicMaterial color={glow(C.lime, 2)} toneMapped={false} />
          </mesh>
          <mesh position={[-0.13, 0.0, 0.066]}>
            <boxGeometry args={[0.03, 0.03, 0.002]} />
            <Mat color="#2d2d38" rough={0.3} metal={0.7} />
          </mesh>
        </group>
        {/* GPU support bracket */}
        <mesh position={[0.07, 0.19, -0.04]}>
          <boxGeometry args={[0.01, 0.12, 0.01]} />
          <Mat color="#2a2a34" rough={0.3} metal={0.8} />
        </mesh>
        <Tube points={CABLE_24PIN} radius={0.011} color="#2a2834" />
        {/* PSU shroud */}
        <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
          <boxGeometry args={[W - 0.02, 0.12, D - 0.02]} />
          <Mat color="#15141b" rough={0.45} metal={0.5} />
        </mesh>
        <mesh position={[-0.05, 0.07, D / 2 - 0.009]}>
          <planeGeometry args={[0.22, 0.004]} />
          <meshBasicMaterial color={glow(C.violet, 1.6)} toneMapped={false} />
        </mesh>
        {/* Front intake fans (behind the mesh) and rear exhaust */}
        {[0.18, 0.36, 0.54].map((y, i) => (
          <Fan key={y} ring={[C.cyan, C.violet, C.pink][i]} position={[W / 2 - 0.045, y, 0]} rotation={[0, Math.PI / 2, 0]} />
        ))}
        <Fan ring={C.violet} position={[-W / 2 + 0.025, 0.5, 0]} rotation={[0, -Math.PI / 2, 0]} spin={0.8} />
        {/* Tempered glass side with a black print border */}
        <group position={[0, H / 2, D / 2 - 0.004]}>
          <mesh raycast={() => null}>
            <planeGeometry args={[W - 0.02, H - 0.02]} />
            <meshStandardMaterial color="#9aa4ff" transparent opacity={0.08} roughness={0.05} metalness={0.3} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0, 0.001]} raycast={() => null}>
            <planeGeometry args={[W - 0.02, H - 0.02]} />
            <meshBasicMaterial map={streak} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          {[
            [0, H / 2 - 0.02, W - 0.02, 0.025],
            [0, -H / 2 + 0.02, W - 0.02, 0.025],
            [-W / 2 + 0.02, 0, 0.025, H - 0.02],
            [W / 2 - 0.02, 0, 0.025, H - 0.02],
          ].map(([x, y, w, h], i) => (
            <mesh key={i} position={[x, y, 0.0015]}>
              <planeGeometry args={[w, h]} />
              <meshStandardMaterial color="#07070b" roughness={0.1} metalness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
      <LightPool position={[0, 0.0095, D / 2 + 0.2]} rotation={FLAT} size={[0.9, 0.55]} color={C.violet} strength={0.45} />
      <LightPool position={[W / 2 + 0.2, 0.0095, 0]} rotation={FLAT} size={[0.5, 0.6]} color={C.cyan} strength={0.3} />
    </group>
  )
}
