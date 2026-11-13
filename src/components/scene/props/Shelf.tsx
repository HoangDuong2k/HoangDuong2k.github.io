import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { C, LightPool, Mat, glow, sculpt } from '../kit'
import { ROOM } from '../layout'

/** Floating wall shelf: snake plant in a ceramic pot, books, a little robot and a gamepad. */

function SnakePlant() {
  const leaf = useMemo(
    () =>
      sculpt(new THREE.PlaneGeometry(0.05, 0.34, 6, 16).translate(0, 0.17, 0), (v) => {
        const k = v.y / 0.34
        // Sword-shaped blade: widest low down, pointed tip, folded along the midrib, slight twist.
        const width = Math.sin(Math.min(1, k * 1.25) * Math.PI * 0.95) * (1 - k * 0.35) + 0.08
        v.x *= width
        v.z += Math.abs(v.x) * 0.5
        const tw = k * 0.8
        const x = v.x
        v.x = x * Math.cos(tw) - v.z * Math.sin(tw)
        v.z = x * Math.sin(tw) + v.z * Math.cos(tw)
      }),
    [],
  )
  const pot = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0, 0],
          [0.06, 0],
          [0.075, 0.03],
          [0.082, 0.13],
          [0.085, 0.15],
          [0.078, 0.15],
          [0.075, 0.135],
          [0, 0.13],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        40,
      ),
    [],
  )
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 256
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#2f5d3a'
    ctx.fillRect(0, 0, 64, 256)
    // Horizontal light-green banding and yellow margins, like Sansevieria.
    for (let y = 0; y < 256; y += 9) {
      ctx.fillStyle = `rgba(150,200,140,${0.15 + ((y * 7) % 10) / 60})`
      ctx.fillRect(0, y, 64, 3 + ((y * 13) % 4))
    }
    ctx.fillStyle = '#d9c96a'
    ctx.fillRect(0, 0, 5, 256)
    ctx.fillRect(59, 0, 5, 256)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useEffect(
    () => () => {
      leaf.dispose()
      pot.dispose()
      tex.dispose()
    },
    [leaf, pot, tex],
  )
  const blades: [number, number, number][] = [
    [0, 0.05, 1],
    [1.3, 0.2, 0.85],
    [2.5, 0.16, 0.95],
    [3.6, 0.22, 0.75],
    [4.6, 0.12, 0.9],
    [5.6, 0.25, 0.7],
    [0.7, 0.3, 0.6],
  ]
  return (
    <group>
      <mesh geometry={pot} castShadow receiveShadow>
        <Mat color="#e8e4dc" rough={0.35} />
      </mesh>
      <mesh position={[0, 0.132, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.074, 32]} />
        <Mat color="#2a1d16" rough={1} />
      </mesh>
      {blades.map(([a, tilt, s], i) => (
        <group key={i} position={[Math.cos(a) * 0.02, 0.13, Math.sin(a) * 0.02]} rotation={[0, -a, tilt]}>
          <mesh geometry={leaf} scale={[1, s, 1]} castShadow>
            <meshStandardMaterial map={tex} roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Book({ color, h, w, pos, tilt = 0 }: { color: string; h: number; w: number; pos: [number, number, number]; tilt?: number }) {
  const d = 0.17
  return (
    <group position={pos} rotation={[0, 0, tilt]}>
      {/* Hard cover wrapping a cream page block */}
      <RoundedBox args={[w, h, d]} radius={0.004} position={[0, h / 2, 0]} castShadow>
        <Mat color={color} rough={0.65} />
      </RoundedBox>
      <mesh position={[0, h / 2, 0.006]}>
        <boxGeometry args={[w - 0.008, h - 0.012, d - 0.004]} />
        <Mat color="#ece4d2" rough={0.95} />
      </mesh>
      {/* Spine bands */}
      {[0.18, 0.82].map((k) => (
        <mesh key={k} position={[0, h * k, d / 2 + 0.0005]}>
          <planeGeometry args={[w - 0.004, 0.006]} />
          <meshStandardMaterial color="#e6d39a" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function Gamepad() {
  const grip = useMemo(() => new THREE.CapsuleGeometry(0.026, 0.05, 6, 16), [])
  useEffect(() => () => grip.dispose(), [grip])
  return (
    <group>
      <RoundedBox args={[0.15, 0.03, 0.075]} radius={0.014} smoothness={4} position={[0, 0.03, 0]} castShadow>
        <Mat color={C.black} rough={0.45} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={grip} position={[s * 0.06, 0.024, 0.03]} rotation={[Math.PI / 2 - 0.3, 0, s * 0.35]} castShadow>
          <Mat color={C.black} rough={0.45} />
        </mesh>
      ))}
      {/* Thumbsticks */}
      {[
        [-0.04, -0.012],
        [0.025, 0.018],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.047, z]}>
          <mesh>
            <cylinderGeometry args={[0.009, 0.007, 0.012, 16]} />
            <Mat color="#1d1d24" rough={0.5} />
          </mesh>
          <mesh position={[0, 0.007, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.004, 20]} />
            <Mat color="#26262e" rough={0.8} />
          </mesh>
        </group>
      ))}
      {/* Face buttons */}
      {[
        [0.055, -0.022, C.cyan],
        [0.07, -0.01, C.pink],
        [0.04, -0.01, C.lime],
        [0.055, 0.002, C.amber],
      ].map(([x, z, c]) => (
        <mesh key={c as string} position={[x as number, 0.046, z as number]}>
          <sphereGeometry args={[0.0055, 12, 8]} />
          <meshBasicMaterial color={glow(c as string, 1.4)} toneMapped={false} />
        </mesh>
      ))}
      {/* D-pad */}
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} position={[-0.02, 0.046, 0.018]} rotation={[0, r, 0]}>
          <boxGeometry args={[0.024, 0.004, 0.008]} />
          <Mat color="#1d1d24" rough={0.5} />
        </mesh>
      ))}
    </group>
  )
}

export function WallShelf() {
  return (
    <group position={[1.75, 1.15, ROOM.backZ + 0.16]}>
      <RoundedBox args={[1.1, 0.04, 0.3]} radius={0.01} castShadow receiveShadow>
        <Mat color="#2b2a33" rough={0.55} />
      </RoundedBox>
      {/* LED under the shelf */}
      <mesh position={[0, -0.025, 0.12]}>
        <boxGeometry args={[1.0, 0.008, 0.01]} />
        <meshBasicMaterial color={glow(C.cyan, 2.5)} toneMapped={false} />
      </mesh>
      <LightPool position={[0, -0.25, -0.15]} size={[1.6, 0.7]} color={C.cyan} strength={0.35} />
      <group position={[-0.38, 0.02, 0]}>
        <SnakePlant />
      </group>
      <Book color={C.violet} w={0.045} h={0.24} pos={[-0.17, 0.02, 0]} />
      <Book color={C.pink} w={0.04} h={0.22} pos={[-0.125, 0.02, 0]} />
      <Book color="#e7e5ee" w={0.05} h={0.2} pos={[-0.08, 0.02, 0]} />
      <Book color="#334155" w={0.035} h={0.215} pos={[-0.03, 0.02, 0]} tilt={-0.18} />
      {/* Little robot figure */}
      <group position={[0.18, 0.02, 0]}>
        <RoundedBox args={[0.1, 0.12, 0.08]} radius={0.02} position={[0, 0.06, 0]} castShadow>
          <Mat color="#e7e5ee" rough={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.13, 0.09, 0.09]} radius={0.025} position={[0, 0.17, 0]} castShadow>
          <Mat color="#e7e5ee" rough={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.17, 0.046]}>
          <planeGeometry args={[0.1, 0.05]} />
          <meshStandardMaterial color="#0c0c12" roughness={0.2} metalness={0.3} />
        </mesh>
        {[-0.03, 0.03].map((x) => (
          <mesh key={x} position={[x, 0.172, 0.047]}>
            <circleGeometry args={[0.011, 16]} />
            <meshBasicMaterial color={glow(C.cyan, 3)} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.05, 8]} />
          <Mat color="#9ca3af" rough={0.3} metal={0.8} />
        </mesh>
        <mesh position={[0, 0.268, 0]}>
          <sphereGeometry args={[0.008, 12, 8]} />
          <meshBasicMaterial color={glow(C.pink, 2.5)} toneMapped={false} />
        </mesh>
      </group>
      <group position={[0.4, 0.02, 0.01]} rotation={[0, -0.4, 0]}>
        <Gamepad />
      </group>
    </group>
  )
}
