import { useMemo } from 'react'
import * as THREE from 'three'
import { useStore } from '@/lib/store'
import { QUALITY } from '@/lib/quality'
import { getGlowTexture } from './textures'

/** Shared building blocks for the room: palette, materials, baked light and geometry helpers. */

export type Vec3 = [number, number, number]

export const C = {
  wall: '#1a1828',
  wallTrim: '#24213a',
  desk: '#1b1b24',
  deskEdge: '#2a2a36',
  metal: '#2f2f3a',
  black: '#101016',
  ink: '#15151d',
  violet: '#8b5cf6',
  pink: '#ff4d8d',
  cyan: '#22d3ee',
  lime: '#a3e635',
  amber: '#fbbf24',
}

export const FLAT: Vec3 = [-Math.PI / 2, 0, 0]

/** Emissive colour pushed above 1.0 so it reads as a light source. */
export function glow(hex: string, power = 2.2) {
  return new THREE.Color(hex).multiplyScalar(power)
}

export function useReflections() {
  return useStore((st) => QUALITY[st.tier].envResolution > 0)
}

/**
 * Metals get their look from reflections. Tiers without an environment map would render them nearly
 * black, so there they fall back to a mostly diffuse finish lit by the hemisphere light.
 */
export function Mat({
  color,
  rough = 0.6,
  metal = 0,
  map,
  normalMap,
  normalScale = 1,
  roughnessMap,
  side,
}: {
  color: string
  rough?: number
  metal?: number
  map?: THREE.Texture
  normalMap?: THREE.Texture
  normalScale?: number
  roughnessMap?: THREE.Texture
  side?: THREE.Side
}) {
  const reflections = useReflections()
  const ns = useMemo(() => new THREE.Vector2(normalScale, normalScale), [normalScale])
  return (
    <meshStandardMaterial
      color={color}
      roughness={rough}
      metalness={reflections ? metal : metal * 0.3}
      map={map}
      normalMap={normalMap}
      normalScale={ns}
      roughnessMap={roughnessMap}
      side={side}
    />
  )
}

/**
 * Baked light, the way hand-made WebGL rooms do it: instead of a real-time light (paid for on every
 * lit pixel, every frame), a soft additive glow painted onto the surface it would light.
 * Floors and desk tops need rotation FLAT; walls face +Z already.
 */
export function LightPool({ position, rotation, size, color, strength = 1 }: { position: Vec3; rotation?: Vec3; size: [number, number]; color: string; strength?: number }) {
  const tint = useMemo(() => new THREE.Color(color).multiplyScalar(strength), [color, strength])
  return (
    <mesh position={position} rotation={rotation} renderOrder={1} raycast={() => null}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={getGlowTexture()}
        color={tint}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  )
}

/* ---------------------------------------------------------------------------------------------- */
/* Geometry helpers                                                                               */
/* ---------------------------------------------------------------------------------------------- */

export interface LoftSection {
  /** Centre of the cross-section. */
  p: Vec3
  /** Half-width (sideways, horizontal) and half-height of the elliptical section. */
  w: number
  h: number
  /** Squash the lower half (0..1): a body resting its weight on a surface. */
  sag?: number
}

/**
 * A smooth organic tube through key sections (spine of a body, a tail, a limb): sections are
 * interpolated with Catmull-Rom, ends are rounded off. UV: u around the section (0 = top), v along.
 * Sections stay upright (their "up" is world Y), which suits bodies lying on a surface.
 */
export function loftGeometry(sections: LoftSection[], { segments = 48, radial = 24, capStart = 0.12, capEnd = 0.12 } = {}) {
  const centre = new THREE.CatmullRomCurve3(sections.map((s) => new THREE.Vector3(...s.p)), false, 'centripetal')
  const lerpKey = (t: number, key: 'w' | 'h' | 'sag') => {
    const f = t * (sections.length - 1)
    const i = Math.min(Math.floor(f), sections.length - 2)
    const k = f - i
    const a = sections[i][key] ?? 0
    const b = sections[i + 1][key] ?? 0
    const s = k * k * (3 - 2 * k)
    return a + (b - a) * s
  }
  const cap = (t: number) => {
    if (t < capStart) return Math.sqrt(Math.max(0, 1 - ((capStart - t) / capStart) ** 2))
    if (t > 1 - capEnd) return Math.sqrt(Math.max(0, 1 - ((t - (1 - capEnd)) / capEnd) ** 2))
    return 1
  }
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const up = new THREE.Vector3(0, 1, 0)
  const side = new THREE.Vector3()
  const tan = new THREE.Vector3()
  const c = new THREE.Vector3()
  const vUp = new THREE.Vector3()
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    // Sample the cap so the very ends close to a point while keeping the centre-line length.
    centre.getPointAt(t, c)
    centre.getTangentAt(t, tan)
    side.crossVectors(tan, up)
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0)
    side.normalize()
    vUp.crossVectors(side, tan).normalize()
    const k = cap(t)
    const w = lerpKey(t, 'w') * k
    const h = lerpKey(t, 'h') * k
    const sag = lerpKey(t, 'sag')
    // Push the end points along the tangent so caps are domed rather than flat.
    const along = t < capStart ? -(1 - k) * lerpKey(0, 'w') * 0.6 : t > 1 - capEnd ? (1 - k) * lerpKey(1, 'w') * 0.6 : 0
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2
      const sx = Math.sin(a)
      let sy = Math.cos(a)
      if (sy < 0) sy *= 1 - sag
      pos.push(
        c.x + side.x * sx * w + vUp.x * sy * h + tan.x * along,
        c.y + side.y * sx * w + vUp.y * sy * h + tan.y * along,
        c.z + side.z * sx * w + vUp.z * sy * h + tan.z * along,
      )
      uv.push(j / radial, t)
    }
  }
  const row = radial + 1
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * row + j
      const b = a + row
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return weldNormals(g)
}

/** Average normals of vertices that share a position (UV seams, poles), so seams shade smoothly. */
export function weldNormals<G extends THREE.BufferGeometry>(g: G): G {
  const p = g.attributes.position as THREE.BufferAttribute
  const n = g.attributes.normal as THREE.BufferAttribute
  const key = (i: number) => `${Math.round(p.getX(i) * 1e5)},${Math.round(p.getY(i) * 1e5)},${Math.round(p.getZ(i) * 1e5)}`
  const sum = new Map<string, THREE.Vector3>()
  for (let i = 0; i < p.count; i++) {
    const k = key(i)
    const v = sum.get(k) ?? new THREE.Vector3()
    v.x += n.getX(i)
    v.y += n.getY(i)
    v.z += n.getZ(i)
    sum.set(k, v)
  }
  for (let i = 0; i < p.count; i++) {
    const v = sum.get(key(i))!
    const len = v.length() || 1
    n.setXYZ(i, v.x / len, v.y / len, v.z / len)
  }
  n.needsUpdate = true
  return g
}

/** Sculpt a geometry in place: f gets each vertex (mutable) and returns nothing. */
export function sculpt<G extends THREE.BufferGeometry>(g: G, f: (v: THREE.Vector3) => void): G {
  const p = g.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    f(v)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  p.needsUpdate = true
  g.computeVertexNormals()
  return weldNormals(g)
}

/** Smooth bump of height 1 at distance 0 falling to ~0 at distance r. */
export function bump(d: number, r: number) {
  return Math.exp(-((d / r) ** 2) * 2.5)
}

/** Rounded 2D rectangle path, for extruded panels. */
export function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

/** Bend a geometry around the Y axis: points move back in Z with the square of their X offset. */
export function curveAroundY<G extends THREE.BufferGeometry>(g: G, k: number): G {
  return sculpt(g, (v) => {
    v.z -= k * v.x * v.x
  })
}
