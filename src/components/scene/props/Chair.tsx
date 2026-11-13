import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createLogoPatchTexture } from '../textures'
import { getBrushedNormal, getLeatherColor, getLeatherNormal } from '../surfaces'
import { C, Mat, curveAroundY, loftGeometry, roundedRectShape, useReflections } from '../kit'
import { ROOM } from '../layout'

/**
 * Racing-style gaming chair, built like the real thing: five-star aluminium base on twin-wheel
 * casters, gas lift with a telescopic cover, tilt mechanism, quilted PU-leather seat and backrest
 * with violet side panels, 4D armrests. Faces -Z (towards the desk); the camera mostly sees its back.
 */

const LEATHER = '#1b1a21'
const ACCENT = '#3b2275'

/** Leather material set: front panels quilted, sides in the accent colour. */
function useLeather() {
  const reflections = useReflections()
  return useMemo(() => {
    const quiltN = getLeatherNormal(true).clone()
    quiltN.repeat.set(1.6, 1.6)
    quiltN.needsUpdate = true
    const quiltC = getLeatherColor(LEATHER, '#7c5cff', true).clone()
    quiltC.repeat.set(1.6, 1.6)
    quiltC.needsUpdate = true
    const grainN = getLeatherNormal(false).clone()
    grainN.repeat.set(3, 3)
    grainN.needsUpdate = true
    const sheen = reflections ? 0.42 : 0.5
    const quilted = new THREE.MeshStandardMaterial({ map: quiltC, normalMap: quiltN, normalScale: new THREE.Vector2(0.55, 0.55), roughness: sheen })
    const plain = new THREE.MeshStandardMaterial({ color: LEATHER, normalMap: grainN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: sheen + 0.05 })
    const accent = new THREE.MeshStandardMaterial({ color: ACCENT, normalMap: grainN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: sheen })
    return { quilted, plain, accent, maps: [quiltN, quiltC, grainN] }
  }, [reflections])
}

/** Outline of the backrest seen from the front: lumbar waist, shoulder wings, headrest. */
function backrestShape() {
  const s = new THREE.Shape()
  s.moveTo(-0.24, 0)
  s.bezierCurveTo(-0.25, 0.12, -0.22, 0.24, -0.225, 0.34) // lumbar waist
  s.bezierCurveTo(-0.23, 0.46, -0.29, 0.56, -0.285, 0.64) // flaring shoulder wing
  s.bezierCurveTo(-0.28, 0.7, -0.24, 0.72, -0.18, 0.73) // shoulder top
  s.bezierCurveTo(-0.17, 0.78, -0.17, 0.86, -0.15, 0.9) // headrest neck
  s.bezierCurveTo(-0.12, 0.96, 0.12, 0.96, 0.15, 0.9) // rounded top
  s.bezierCurveTo(0.17, 0.86, 0.17, 0.78, 0.18, 0.73)
  s.bezierCurveTo(0.24, 0.72, 0.28, 0.7, 0.285, 0.64)
  s.bezierCurveTo(0.29, 0.56, 0.23, 0.46, 0.225, 0.34)
  s.bezierCurveTo(0.22, 0.24, 0.25, 0.12, 0.24, 0)
  s.lineTo(-0.24, 0)
  // Harness slots below the headrest.
  for (const x of [-0.085, 0.085]) {
    const h = new THREE.Path()
    h.absellipse(x, 0.78, 0.03, 0.055, 0, Math.PI * 2, false, 0)
    s.holes.push(h)
  }
  return s
}

function useChairGeometry() {
  return useMemo(() => {
    const back = backrestShape()
    const backrest = curveAroundY(
      new THREE.ExtrudeGeometry(back, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.028, bevelSegments: 5, curveSegments: 28 }).translate(0, 0, -0.035),
      0.9,
    )
    // Back cover: the same outline, slightly inset, sitting on the rear face.
    const cover = curveAroundY(new THREE.ShapeGeometry(backrestShape(), 28).scale(0.94, 0.97, 1).translate(0, 0.012, 0), 0.9)
    const seatShape = roundedRectShape(0.5, 0.5, 0.09)
    const seat = new THREE.ExtrudeGeometry(seatShape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 5, curveSegments: 16 })
      .rotateX(-Math.PI / 2)
      .translate(0, 0.0, 0)
    // Raised side bolsters, higher towards the front like a bucket seat.
    const bolster = (side: number) =>
      loftGeometry(
        [
          { p: [side * 0.24, 0.07, 0.22], w: 0.055, h: 0.04 },
          { p: [side * 0.25, 0.085, 0.05], w: 0.062, h: 0.048 },
          { p: [side * 0.25, 0.09, -0.13], w: 0.062, h: 0.05 },
          { p: [side * 0.24, 0.075, -0.24], w: 0.055, h: 0.042 },
        ],
        { segments: 32, radial: 20, capStart: 0.12, capEnd: 0.14 },
      )
    // One star leg: thick at the hub, slim and slightly arched at the tip.
    const leg = loftGeometry(
      [
        { p: [0, 0.085, 0.04], w: 0.034, h: 0.034 },
        { p: [0, 0.088, 0.16], w: 0.028, h: 0.026 },
        { p: [0, 0.075, 0.3], w: 0.022, h: 0.02 },
        { p: [0, 0.062, 0.36], w: 0.02, h: 0.018 },
      ],
      { segments: 24, radial: 16, capStart: 0.02, capEnd: 0.08 },
    )
    return { backrest, cover, seat, bolsterL: bolster(-1), bolsterR: bolster(1), leg }
  }, [])
}

function Caster({ angle }: { angle: number }) {
  return (
    <group rotation={[0, angle, 0]}>
      {/* Stem + swivel housing */}
      <mesh position={[0, 0.058, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.03, 10]} />
        <Mat color="#8b8f98" rough={0.3} metal={0.9} />
      </mesh>
      <mesh position={[0, 0.042, -0.008]} castShadow>
        <boxGeometry args={[0.03, 0.03, 0.05]} />
        <Mat color={C.black} rough={0.45} />
      </mesh>
      {/* Twin wheels */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.019, 0.028, -0.018]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.013, 24]} />
          <Mat color="#0c0c11" rough={0.55} />
        </mesh>
      ))}
    </group>
  )
}

export function Chair() {
  const g = useChairGeometry()
  const m = useLeather()
  const logo = useMemo(() => createLogoPatchTexture(), [])
  const brushed = getBrushedNormal()
  useEffect(
    () => () => {
      Object.values(g).forEach((x) => x.dispose())
      ;[m.quilted, m.plain, m.accent].forEach((x) => x.dispose())
      m.maps.forEach((t) => t.dispose())
      logo.dispose()
    },
    [g, m, logo],
  )
  const alu = { color: '#3a3b44', rough: 0.32, metal: 0.85, normalMap: brushed, normalScale: 0.3 }
  return (
    <group position={[0.15, ROOM.floorY, 1.45]} rotation={[0, -0.3, 0]} scale={1.36}>
      {/* Five-star base */}
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.065, 0.06, 32]} />
        <Mat {...alu} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.3
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh geometry={g.leg} castShadow>
              <Mat {...alu} />
            </mesh>
            {/* Leg end cap the caster plugs into */}
            <mesh position={[0, 0.07, 0.355]}>
              <cylinderGeometry args={[0.016, 0.018, 0.025, 14]} />
              <Mat color={C.black} rough={0.5} />
            </mesh>
            <group position={[0, 0, 0.355]}>
              <Caster angle={1.3 * i - a} />
            </group>
          </group>
        )
      })}
      {/* Gas lift: chrome piston in a telescopic cover */}
      <mesh position={[0, 0.39, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.3, 20]} />
        <Mat color="#c9ccd4" rough={0.12} metal={1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.15 + i * 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.034 - i * 0.003, 0.036 - i * 0.003, 0.07, 24]} />
          <Mat color="#121218" rough={0.35} />
        </mesh>
      ))}
      {/* Tilt mechanism and its lever */}
      <mesh position={[0, 0.555, 0]} castShadow>
        <boxGeometry args={[0.24, 0.04, 0.3]} />
        <Mat color="#1e1e26" rough={0.4} metal={0.6} />
      </mesh>
      <group position={[0.12, 0.55, -0.06]}>
        <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2 - 0.15]}>
          <cylinderGeometry args={[0.006, 0.006, 0.13, 8]} />
          <Mat color="#9aa0aa" rough={0.3} metal={0.9} />
        </mesh>
        <mesh position={[0.125, 0.01, 0]}>
          <sphereGeometry args={[0.016, 16, 12]} />
          <Mat color={C.black} rough={0.4} />
        </mesh>
      </group>

      {/* Seat: quilted cushion, accent sides, bucket bolsters */}
      <group position={[0, 0.6, 0]}>
        <mesh geometry={g.seat} material={[m.quilted, m.accent]} castShadow receiveShadow />
        <mesh geometry={g.bolsterL} material={m.plain} castShadow />
        <mesh geometry={g.bolsterR} material={m.plain} castShadow />
      </group>

      {/* Recline brackets joining seat and backrest */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.29, 0.69, 0.23]} rotation={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.014, 0.12, 0.06]} />
          <Mat color="#17171d" rough={0.4} metal={0.5} />
        </mesh>
      ))}
      <mesh position={[0.3, 0.67, 0.17]} rotation={[0.9, 0, -0.3]}>
        <capsuleGeometry args={[0.01, 0.07, 4, 8]} />
        <Mat color={C.black} rough={0.4} />
      </mesh>

      {/* Backrest: reclined a little, wings wrap forward */}
      <group position={[0, 0.69, 0.27]} rotation={[-0.14, 0, 0]}>
        <mesh geometry={g.backrest} material={[m.quilted, m.accent]} castShadow receiveShadow />
        {/* Rear cover with an embroidered logo patch (what the room camera mostly sees) */}
        <mesh geometry={g.cover} position={[0, 0, 0.069]}>
          <meshStandardMaterial color={LEATHER} normalMap={m.maps[2]} roughness={0.5} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
        <mesh position={[0, 0.52, 0.073]}>
          <planeGeometry args={[0.16, 0.16]} />
          <meshStandardMaterial map={logo} transparent roughness={0.6} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
        {/* Headrest and lumbar pillows on the front */}
        <mesh position={[0, 0.83, -0.08]} scale={[0.15, 0.065, 0.04]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
          <primitive object={m.plain} attach="material" />
        </mesh>
        <mesh position={[0, 0.2, -0.08]} scale={[0.17, 0.08, 0.05]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
          <primitive object={m.plain} attach="material" />
        </mesh>
      </group>

      {/* 4D armrests: bracket from under the seat, post, padded top */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.31, 0, 0.02]}>
          <mesh position={[-s * 0.06, 0.57, 0]} castShadow>
            <boxGeometry args={[0.12, 0.018, 0.05]} />
            <Mat color="#17171d" rough={0.4} metal={0.5} />
          </mesh>
          <mesh position={[0, 0.69, 0]} castShadow>
            <boxGeometry args={[0.026, 0.24, 0.04]} />
            <Mat color="#121218" rough={0.45} />
          </mesh>
          <mesh position={[0, 0.82, -0.02]} rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 1, 0.55]} castShadow>
            <capsuleGeometry args={[0.035, 0.2, 6, 16]} />
            <primitive object={m.plain} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
