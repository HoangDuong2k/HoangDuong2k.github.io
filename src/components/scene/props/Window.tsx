import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createCityLayerTexture, createNightSkyTexture } from '../textures'
import { getGlassStreakTexture, getWeaveNormal } from '../surfaces'
import { Mat, sculpt } from '../kit'
import { ROOM } from '../layout'

/**
 * Left wall with a real window: an opening with depth, recessed black aluminium frame, glass,
 * an interior sill with a succulent, floor-length curtains on a rod, and a night city outside
 * built from parallax layers so it shifts with the camera like a real view.
 */

const OPEN_W = 1.8 // along the wall
const OPEN_H = 1.6
const DEPTH = 0.2 // wall thickness
const CENTER = { y: 0.75, z: 0.6 }
const WALL = '#17151f'

function WallWithHole() {
  const { backZ, leftX, floorY } = ROOM
  const D = 5
  const H = 4.4
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-D / 2, -H / 2)
    s.lineTo(D / 2, -H / 2)
    s.lineTo(D / 2, H / 2)
    s.lineTo(-D / 2, H / 2)
    s.lineTo(-D / 2, -H / 2)
    // Wall-local x runs towards -z in the world.
    const hx = -(CENTER.z - (backZ + D / 2))
    const hy = CENTER.y - (floorY + H / 2)
    const hole = new THREE.Path()
    hole.moveTo(hx - OPEN_W / 2, hy - OPEN_H / 2)
    hole.lineTo(hx - OPEN_W / 2, hy + OPEN_H / 2)
    hole.lineTo(hx + OPEN_W / 2, hy + OPEN_H / 2)
    hole.lineTo(hx + OPEN_W / 2, hy - OPEN_H / 2)
    hole.lineTo(hx - OPEN_W / 2, hy - OPEN_H / 2)
    s.holes.push(hole)
    return new THREE.ShapeGeometry(s)
  }, [backZ, floorY])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo} position={[leftX, floorY + H / 2, backZ + D / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
      <Mat color={WALL} rough={0.95} />
    </mesh>
  )
}

/** Night city: sky far away, then three skyline layers getting closer, darker and more detailed. */
function Outside() {
  const sky = useMemo(() => createNightSkyTexture(), [])
  const layers = useMemo(() => [createCityLayerTexture(0), createCityLayerTexture(1), createCityLayerTexture(2)], [])
  useEffect(
    () => () => {
      sky.dispose()
      layers.forEach((l) => l.dispose())
    },
    [sky, layers],
  )
  const planes: { z: number; w: number; h: number; bottom: number; repeat: number }[] = [
    { z: -4.8, w: 24, h: 4.2, bottom: -3.6, repeat: 2.4 },
    { z: -3.0, w: 18, h: 3.6, bottom: -3.0, repeat: 1.8 },
    { z: -1.5, w: 12, h: 3.1, bottom: -2.5, repeat: 1.3 },
  ]
  layers.forEach((t, i) => t.repeat.set(planes[i].repeat, 1))
  return (
    <group>
      <mesh position={[0, -0.6, -6.6]}>
        <planeGeometry args={[30, 8]} />
        <meshBasicMaterial map={sky} fog={false} toneMapped={false} />
      </mesh>
      {planes.map((p, i) => (
        <mesh key={i} position={[i * 0.7 - 0.5, p.bottom + p.h / 2, p.z]}>
          <planeGeometry args={[p.w, p.h]} />
          <meshBasicMaterial map={layers[i]} transparent fog={false} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Frame() {
  const black = { color: '#121118', rough: 0.35, metal: 0.6 }
  const fz = -0.12 // recessed into the opening
  const bar = 0.07
  const inner = { w: OPEN_W - 2 * bar, h: OPEN_H - 2 * bar }
  const streak = getGlassStreakTexture()
  return (
    <group position={[0, 0, fz]}>
      {/* Outer frame */}
      {[
        [0, OPEN_H / 2 - bar / 2, OPEN_W, bar],
        [0, -OPEN_H / 2 + bar / 2, OPEN_W, bar],
        [-OPEN_W / 2 + bar / 2, 0, bar, OPEN_H],
        [OPEN_W / 2 - bar / 2, 0, bar, OPEN_H],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, h, 0.09]} />
          <Mat {...black} />
        </mesh>
      ))}
      {/* Two casement sashes, each with its own thin frame, split by a transom */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[(sx * inner.w) / 4, 0, 0.012]}>
          {[
            [0, inner.h / 2 - 0.02, inner.w / 2, 0.04],
            [0, -inner.h / 2 + 0.02, inner.w / 2, 0.04],
            [-inner.w / 4 + 0.02, 0, 0.04, inner.h],
            [inner.w / 4 - 0.02, 0, 0.04, inner.h],
            [0, 0.18, inner.w / 2 - 0.06, 0.03],
          ].map(([x, y, w, h], i) => (
            <mesh key={i} position={[x, y, 0]} castShadow>
              <boxGeometry args={[w, h, 0.05]} />
              <Mat {...black} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Handle on the right sash */}
      <group position={[0.06, -0.05, 0.05]}>
        <mesh>
          <boxGeometry args={[0.025, 0.05, 0.012]} />
          <Mat color="#b9bcc6" rough={0.25} metal={0.9} />
        </mesh>
        <mesh position={[0, -0.05, 0.012]}>
          <boxGeometry args={[0.014, 0.1, 0.014]} />
          <Mat color="#b9bcc6" rough={0.25} metal={0.9} />
        </mesh>
      </group>
      {/* Glass: barely tinted, with a faint diagonal reflection */}
      <mesh position={[0, 0, 0.005]} raycast={() => null}>
        <planeGeometry args={[inner.w, inner.h]} />
        <meshStandardMaterial color="#0d1022" transparent opacity={0.16} roughness={0.05} metalness={0.2} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.007]} raycast={() => null}>
        <planeGeometry args={[inner.w, inner.h]} />
        <meshBasicMaterial map={streak} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Reveal: the inside faces of the opening, so the wall has visible thickness. */
function Reveal() {
  const faces: { pos: [number, number, number]; rot: [number, number, number]; size: [number, number] }[] = [
    { pos: [0, OPEN_H / 2, -DEPTH / 2], rot: [Math.PI / 2, 0, 0], size: [OPEN_W, DEPTH] },
    { pos: [0, -OPEN_H / 2, -DEPTH / 2], rot: [-Math.PI / 2, 0, 0], size: [OPEN_W, DEPTH] },
    { pos: [-OPEN_W / 2, 0, -DEPTH / 2], rot: [0, Math.PI / 2, 0], size: [DEPTH, OPEN_H] },
    { pos: [OPEN_W / 2, 0, -DEPTH / 2], rot: [0, -Math.PI / 2, 0], size: [DEPTH, OPEN_H] },
  ]
  return (
    <>
      {faces.map((f, i) => (
        <mesh key={i} position={f.pos} rotation={f.rot} receiveShadow>
          <planeGeometry args={f.size} />
          <Mat color="#1d1a28" rough={0.95} />
        </mesh>
      ))}
    </>
  )
}

function Succulent() {
  const leaves = useMemo(() => {
    const out: { pos: [number, number, number]; rot: [number, number, number]; s: number }[] = []
    const rings = [6, 8, 10]
    rings.forEach((n, r) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r * 0.4
        const tilt = 0.25 + r * 0.38
        out.push({ pos: [Math.cos(a) * 0.006 * r, 0.035 - r * 0.006, Math.sin(a) * 0.006 * r], rot: [0, -a + Math.PI / 2, tilt], s: 0.75 + r * 0.18 })
      }
    })
    return out
  }, [])
  const pot = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0, 0],
          [0.038, 0],
          [0.044, 0.05],
          [0.046, 0.055],
          [0.04, 0.055],
          [0.036, 0.045],
          [0, 0.045],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        32,
      ),
    [],
  )
  const leaf = useMemo(() => sculpt(new THREE.ConeGeometry(0.012, 0.05, 10, 3).translate(0, 0.025, 0), (v) => (v.z *= 0.45)), [])
  useEffect(
    () => () => {
      pot.dispose()
      leaf.dispose()
    },
    [pot, leaf],
  )
  return (
    <group>
      <mesh geometry={pot} castShadow>
        <Mat color="#d9d4cc" rough={0.6} />
      </mesh>
      <group position={[0, 0.045, 0]}>
        {leaves.map((l, i) => (
          <group key={i} position={l.pos} rotation={l.rot}>
            <mesh geometry={leaf} scale={l.s} castShadow>
              <meshStandardMaterial color={i % 3 ? '#7fb59a' : '#94c7ad'} roughness={0.55} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function Curtain({ side }: { side: number }) {
  const H = 3.32
  const geo = useMemo(
    () =>
      sculpt(new THREE.PlaneGeometry(0.62, H, 72, 8), (v) => {
        const u = v.x / 0.62 + 0.5
        const down = 1 - (v.y / H + 0.5)
        // Pleats, gathered at the top and opening out towards the floor.
        const amp = 0.028 + 0.022 * down
        v.z += amp * Math.sin(u * Math.PI * 9 + side) + 0.012 * Math.sin(u * Math.PI * 3.3)
        v.x *= 0.9 + 0.12 * down
      }),
    [side],
  )
  const weave = useMemo(() => {
    const t = getWeaveNormal().clone()
    t.repeat.set(5, 26)
    t.needsUpdate = true
    return t
  }, [])
  useEffect(
    () => () => {
      geo.dispose()
      weave.dispose()
    },
    [geo, weave],
  )
  return (
    <mesh geometry={geo} position={[side * 1.18, 1.0 - H / 2, 0.16]} castShadow receiveShadow>
      <Mat color="#35213f" rough={0.92} normalMap={weave} normalScale={0.35} side={THREE.DoubleSide} />
    </mesh>
  )
}

export function LeftWall() {
  const { leftX } = ROOM
  return (
    <group>
      <WallWithHole />
      <group position={[leftX, CENTER.y, CENTER.z]} rotation={[0, Math.PI / 2, 0]}>
        <Reveal />
        <Frame />
        <Outside />
        {/* Interior sill */}
        <mesh position={[0, -OPEN_H / 2 - 0.02, -0.03]} castShadow receiveShadow>
          <boxGeometry args={[OPEN_W + 0.16, 0.04, DEPTH + 0.14]} />
          <Mat color="#2b2838" rough={0.45} />
        </mesh>
        <group position={[0.55, -OPEN_H / 2, 0.0]}>
          <Succulent />
        </group>
        {/* Curtain rod with brackets and finials */}
        <group position={[0, 1.0, 0.2]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 3.0, 12]} />
            <Mat color="#1a1920" rough={0.3} metal={0.7} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 1.52, 0, 0]}>
                <sphereGeometry args={[0.025, 16, 12]} />
                <Mat color="#1a1920" rough={0.3} metal={0.7} />
              </mesh>
              <mesh position={[s * 1.3, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
                <Mat color="#1a1920" rough={0.3} metal={0.7} />
              </mesh>
            </group>
          ))}
        </group>
        <Curtain side={-1} />
        <Curtain side={1} />
      </group>
    </group>
  )
}

