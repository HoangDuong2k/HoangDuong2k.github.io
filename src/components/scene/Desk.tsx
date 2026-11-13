import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Clickable } from './Clickable'
import { DOCS, ROOM, SCREEN } from './layout'
import {
  CODE_HEADER_PX,
  CODE_LINE_PX,
  createCardTexture,
  createCodeTexture,
  createDeskReadoutTexture,
  createDeskMatTexture,
  createFolderLabelTexture,
  createNeonTexture,
  createNoteTexture,
  createResumeTexture,
  createScreenTexture,
} from './textures'

import { C, FLAT, LightPool, Mat, glow } from './kit'
import { getBrushedNormal, getFloorMaps, getPileNormal } from './surfaces'
import { Cat } from './props/Cat'
import { Chair } from './props/Chair'
import { LeftWall } from './props/Window'
import { PCTower } from './props/PC'
import { Headset, Keyboard, Mouse, Mug } from './props/Peripherals'
import { WallShelf } from './props/Shelf'

/* ---------------------------------------------------------------------------------------------- */
/* Room shell                                                                                     */
/* ---------------------------------------------------------------------------------------------- */

function Room() {
  const floor = getFloorMaps()
  const pile = useMemo(() => {
    const t = getPileNormal().clone()
    t.repeat.set(6, 6)
    t.needsUpdate = true
    return t
  }, [])
  useEffect(() => () => pile.dispose(), [pile])
  const { backZ, leftX, floorY } = ROOM
  const W = 6.4
  const D = 5
  const H = 4.4
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[leftX + W / 2, floorY, backZ + D / 2]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floor.map} normalMap={floor.normal} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Back wall + trim */}
      <mesh position={[leftX + W / 2, floorY + H / 2, backZ]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <Mat color={C.wall} rough={0.95} />
      </mesh>
      <mesh position={[leftX + W / 2, floorY + 0.06, backZ + 0.01]}>
        <boxGeometry args={[W, 0.12, 0.02]} />
        <Mat color={C.wallTrim} />
      </mesh>
      <LeftWall />
      {/* City glow through the window, on the floor and the side of the desk */}
      <LightPool position={[leftX + 0.9, floorY + 0.012, 0.6]} rotation={FLAT} size={[2.2, 2.4]} color="#ff8fb0" strength={0.22} />
      <LightPool position={[leftX + 0.006, 0.75, 0.6]} rotation={[0, Math.PI / 2, 0]} size={[3, 2.6]} color="#ff8fb0" strength={0.12} />
      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, floorY + 0.006, 1.2]} receiveShadow>
        <circleGeometry args={[1.5, 96]} />
        <Mat color="#262238" rough={1} normalMap={pile} normalScale={1.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, floorY + 0.008, 1.2]}>
        <ringGeometry args={[1.38, 1.44, 64]} />
        <Mat color={C.violet} rough={1} />
      </mesh>
    </group>
  )
}

const HEX_COLORS = ['#22d3ee', '#8b5cf6', '#a3e635', '#22d3ee', '#8b5cf6', '#ff4d8d', '#60a5fa']

/** Hexagon light panels on the back wall. */
function HexPanels() {
  const cells: [number, number][] = [
    [0, 0],
    [1, 0],
    [0.5, 0.866],
    [1.5, 0.866],
    [2, 0],
    [1, -0.866],
    [2.5, 0.866],
  ]
  return (
    <group>
      <LightPool position={[0.82, 1.68, ROOM.backZ + 0.006]} size={[1.6, 1.3]} color="#7c9cff" strength={0.35} />
      <group position={[0.55, 1.62, ROOM.backZ + 0.02]} scale={0.22}>
        {cells.map(([x, y], i) => (
          <group key={i} position={[x * 1.08, y * 1.08, 0]}>
            <mesh rotation={[Math.PI / 2, 0, Math.PI / 6]}>
              <cylinderGeometry args={[0.6, 0.6, 0.12, 6]} />
              <Mat color={C.black} rough={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.065]} rotation={[0, 0, Math.PI / 6]}>
              <circleGeometry args={[0.5, 6]} />
              <meshBasicMaterial color={glow(HEX_COLORS[i], 1.4)} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function NeonSign() {
  const tex = useMemo(() => createNeonTexture('<hoang/>', '#ff4d8d'), [])
  return (
    <group position={[-1.05, 1.42, ROOM.backZ + 0.03]}>
      <mesh>
        <planeGeometry args={[1.5, 0.375]} />
        <meshBasicMaterial map={tex} transparent color={glow('#ffffff', 1.6)} toneMapped={false} depthWrite={false} />
      </mesh>
      <LightPool position={[0, 0, -0.024]} size={[2.6, 1.3]} color={C.pink} strength={0.4} />
    </group>
  )
}

/* ---------------------------------------------------------------------------------------------- */
/* Desk                                                                                           */
/* ---------------------------------------------------------------------------------------------- */

/** A cable carrier ("spine") from the tray down to the floor: a chain of short vertebrae. */
function CableSpine() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = 26
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.05, -0.22, -0.56),
      new THREE.Vector3(1.12, -0.6, -0.6),
      new THREE.Vector3(1.2, -1.2, -0.62),
      new THREE.Vector3(1.32, ROOM.floorY + 0.03, -0.66),
    ])
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    const one = new THREE.Vector3(1, 1, 1)
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1)
      q.setFromUnitVectors(up, curve.getTangentAt(t).negate())
      m.compose(curve.getPointAt(t), q, one)
      mesh.setMatrixAt(i, m)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow>
      <cylinderGeometry args={[0.03, 0.034, 0.05, 12]} />
      <meshStandardMaterial color="#121218" roughness={0.5} />
    </instancedMesh>
  )
}

function Table() {
  const brushed = getBrushedNormal()
  const readout = useMemo(() => createDeskReadoutTexture(), [])
  useEffect(() => () => readout.dispose(), [readout])
  const frame = { color: '#22212a', rough: 0.35, metal: 0.75, normalMap: brushed, normalScale: 0.2 }
  const fy = ROOM.floorY
  return (
    <group>
      {/* Desktop: matte laminate with a soft rounded edge */}
      <RoundedBox args={[3.6, 0.07, 1.5]} radius={0.025} smoothness={5} position={[0, -0.035, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={C.desk} roughness={0.45} metalness={0.1} />
      </RoundedBox>
      {/* Standing-desk frame: two telescopic columns on long feet, joined under the top */}
      {[-1.5, 1.5].map((x) => (
        <group key={x} position={[x, 0, -0.08]}>
          <RoundedBox args={[0.085, 0.05, 1.22]} radius={0.018} position={[0, fy + 0.04, 0]} castShadow receiveShadow>
            <Mat {...frame} />
          </RoundedBox>
          {[-0.56, 0.56].map((z) => (
            <mesh key={z} position={[0, fy + 0.008, z]}>
              <cylinderGeometry args={[0.022, 0.024, 0.016, 16]} />
              <Mat color={C.black} rough={0.7} />
            </mesh>
          ))}
          {/* Lower outer stage, upper inner stage */}
          <RoundedBox args={[0.11, 0.74, 0.08]} radius={0.012} position={[0, fy + 0.065 + 0.37, 0]} castShadow>
            <Mat {...frame} />
          </RoundedBox>
          <RoundedBox args={[0.092, 0.74, 0.064]} radius={0.01} position={[0, -0.12 - 0.37, 0]} castShadow>
            <Mat {...frame} />
          </RoundedBox>
          {/* Top bracket */}
          <mesh position={[0, -0.095, 0]}>
            <boxGeometry args={[0.07, 0.05, 1.15]} />
            <Mat {...frame} />
          </mesh>
          {/* Motor housing */}
          <RoundedBox args={[0.13, 0.07, 0.11]} radius={0.015} position={[0, -0.13, 0]}>
            <Mat color="#17161d" rough={0.4} metal={0.5} />
          </RoundedBox>
        </group>
      ))}
      <mesh position={[0, -0.1, -0.08]}>
        <boxGeometry args={[3.0, 0.045, 0.07]} />
        <Mat {...frame} />
      </mesh>
      {/* Control panel with the height readout */}
      <group position={[1.12, -0.088, 0.7]}>
        <RoundedBox args={[0.2, 0.034, 0.07]} radius={0.01}>
          <Mat color="#0e0e13" rough={0.35} />
        </RoundedBox>
        <mesh position={[-0.04, 0, 0.0355]}>
          <planeGeometry args={[0.06, 0.019]} />
          <meshBasicMaterial map={readout} toneMapped={false} />
        </mesh>
        {[0.035, 0.07].map((bx) => (
          <mesh key={bx} position={[bx, 0, 0.036]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.004, 16]} />
            <Mat color="#2a2a33" rough={0.5} />
          </mesh>
        ))}
      </group>
      {/* Cable tray under the back edge with a few cables in it, and the spine to the floor */}
      <group position={[0.2, -0.2, -0.55]}>
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[1.8, 0.008, 0.16]} />
          <Mat color="#18171e" rough={0.45} metal={0.6} />
        </mesh>
        {[-0.08, 0.08].map((z) => (
          <mesh key={z} position={[0, 0, z]}>
            <boxGeometry args={[1.8, 0.08, 0.006]} />
            <Mat color="#18171e" rough={0.45} metal={0.6} />
          </mesh>
        ))}
        {[-0.03, 0.0, 0.035].map((z, i) => (
          <mesh key={z} position={[0, -0.025 + i * 0.006, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.01, 0.01, 1.7, 8]} />
            <Mat color="#0d0d12" rough={0.7} />
          </mesh>
        ))}
      </group>
      <CableSpine />
      {/* LED strip behind the desk washing the wall */}
      <mesh position={[0, -0.08, -0.74]}>
        <boxGeometry args={[3.4, 0.012, 0.012]} />
        <meshBasicMaterial color={glow(C.violet, 2.6)} toneMapped={false} />
      </mesh>
      <LightPool position={[0, -0.15, ROOM.backZ + 0.006]} size={[4.6, 1.6]} color={C.violet} strength={0.55} />
      <LightPool position={[0, ROOM.floorY + 0.012, -0.55]} rotation={FLAT} size={[4, 1.4]} color={C.violet} strength={0.2} />
    </group>
  )
}

function Monitor() {
  const brushed = getBrushedNormal()
  const screen = useMemo(() => createScreenTexture(), [])
  useEffect(() => () => screen.dispose(), [screen])
  const [x, y, z] = SCREEN.center
  const caret = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const m = caret.current
    if (!m) return
    const c = screen.caret
    m.visible = Math.floor(clock.elapsedTime * 1.6) % 2 === 0
    m.position.set(x + (c.u - 0.5) * SCREEN.width, y + (0.5 - c.v - c.h / 2) * SCREEN.height, z + 0.002)
    m.scale.set(c.w * SCREEN.width, c.h * SCREEN.height, 1)
  })
  return (
    <group>
      {/* Stand: brushed aluminium foot, neck with a cable cut-out, hinge block */}
      <RoundedBox args={[0.44, 0.016, 0.26]} radius={0.007} smoothness={4} position={[0, 0.008, -0.5]} castShadow receiveShadow>
        <Mat color="#3b3c46" rough={0.3} metal={0.85} normalMap={brushed} normalScale={0.3} />
      </RoundedBox>
      <RoundedBox args={[0.08, 0.66, 0.03]} radius={0.012} smoothness={4} position={[0, 0.34, -0.585]} rotation={[0.05, 0, 0]} castShadow>
        <Mat color="#3b3c46" rough={0.3} metal={0.85} normalMap={brushed} normalScale={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.2, -0.602]} rotation={[0.05, Math.PI, 0]}>
        <planeGeometry args={[0.04, 0.09]} />
        <meshBasicMaterial color="#07070a" />
      </mesh>
      <RoundedBox args={[0.16, 0.13, 0.06]} radius={0.02} position={[0, y - 0.04, z - 0.11]} castShadow>
        <Mat color="#1a1a21" rough={0.4} metal={0.4} />
      </RoundedBox>
      {/* Rear housing: thicker in the middle, like a real panel's electronics bulge */}
      <RoundedBox args={[SCREEN.width - 0.3, SCREEN.height - 0.22, 0.06]} radius={0.03} smoothness={4} position={[x, y - 0.03, z - 0.065]} castShadow>
        <Mat color="#15151b" rough={0.5} metal={0.2} />
      </RoundedBox>
      {/* Panel with thin bezels and a slightly deeper chin */}
      <RoundedBox args={[SCREEN.width + 0.036, SCREEN.height + 0.06, 0.035]} radius={0.01} smoothness={4} position={[x, y - 0.006, z - 0.019]} castShadow>
        <Mat color={C.black} rough={0.35} metal={0.2} />
      </RoundedBox>
      <mesh position={[x + SCREEN.width / 2 - 0.03, y - SCREEN.height / 2 - 0.024, z + 0.0]}>
        <circleGeometry args={[0.004, 12]} />
        <meshBasicMaterial color={glow('#60a5fa', 2)} toneMapped={false} />
      </mesh>
      {/* Only the screen itself opens the OS; stand, bezel and light bar are just furniture */}
      <Clickable id="computer" label="Log in to hoang.os" hint="click" labelOffset={[0, 0.66, 0]} still>
        <mesh position={[x, y, z + 0.001]}>
          <planeGeometry args={[SCREEN.width, SCREEN.height]} />
          <meshBasicMaterial map={screen.texture} toneMapped={false} />
        </mesh>
        <mesh ref={caret} raycast={() => null}>
          <planeGeometry />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </Clickable>
      {/* Bias light behind the monitor */}
      <mesh position={[x, y, z - 0.045]}>
        <planeGeometry args={[SCREEN.width - 0.1, SCREEN.height - 0.1]} />
        <meshBasicMaterial color={glow(C.violet, 1.4)} toneMapped={false} side={THREE.BackSide} />
      </mesh>
      <LightPool position={[x, y, ROOM.backZ + 0.007]} size={[2.6, 1.9]} color={C.violet} strength={0.45} />
      {/* Monitor light bar */}
      <group position={[0, y + SCREEN.height / 2 + 0.045, z - 0.03]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.5, 16]} />
          <Mat color={C.black} rough={0.3} metal={0.5} />
        </mesh>
        <mesh position={[0, -0.016, 0.006]}>
          <boxGeometry args={[0.46, 0.004, 0.012]} />
          <meshBasicMaterial color={glow('#fff4e0', 2)} toneMapped={false} />
        </mesh>
      </group>
      {/* Light bar pooling warm light on the desk in front of the screen */}
      <LightPool position={[0, 0.0095, 0.05]} rotation={FLAT} size={[1.9, 1.0]} color="#fff1dc" strength={0.16} />
    </group>
  )
}

function SideMonitor() {
  const brushed = getBrushedNormal()
  const code = useMemo(() => createCodeTexture(), [])
  useEffect(() => () => code.dispose(), [code])
  // Same pixel density as the old 512x880 editor texture: header strip + a tiling, scrolling body.
  const PX = 0.845 / 880
  const headerH = CODE_HEADER_PX * PX
  const bodyH = 0.845 - headerH
  useMemo(() => code.body.repeat.set(1, bodyH / PX / (code.lines * CODE_LINE_PX)), [code, bodyH, PX])
  useFrame((_, dt) => {
    // One line every ~1.4 s, as before, but continuous.
    code.body.offset.y -= dt / 1.4 / code.lines
  })
  return (
    <group position={[-1.32, 0, -0.42]} rotation={[0, 0.5, 0]}>
      <mesh position={[0, 0.007, -0.03]} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.135, 0.014, 48]} />
        <Mat color="#3b3c46" rough={0.3} metal={0.85} normalMap={brushed} normalScale={0.3} />
      </mesh>
      <RoundedBox args={[0.06, 0.6, 0.026]} radius={0.01} smoothness={4} position={[0, 0.3, -0.075]} castShadow>
        <Mat color="#3b3c46" rough={0.3} metal={0.85} normalMap={brushed} normalScale={0.3} />
      </RoundedBox>
      <RoundedBox args={[0.12, 0.1, 0.04]} radius={0.015} position={[0, 0.7, -0.07]} castShadow>
        <Mat color="#1a1a21" rough={0.4} metal={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.52, 0.88, 0.032]} radius={0.01} smoothness={4} position={[0, 0.76, -0.034]} castShadow>
        <Mat color={C.black} rough={0.35} metal={0.2} />
      </RoundedBox>
      <mesh position={[0, 0.76 + 0.845 / 2 - headerH / 2, -0.016]}>
        <planeGeometry args={[0.49, headerH]} />
        <meshBasicMaterial map={code.header} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.76 - 0.845 / 2 + bodyH / 2, -0.016]}>
        <planeGeometry args={[0.49, bodyH]} />
        <meshBasicMaterial map={code.body} toneMapped={false} />
      </mesh>
    </group>
  )
}

function DeskMat() {
  const tex = useMemo(() => createDeskMatTexture(), [])
  return (
    <group position={[0.32, 0, 0.28]}>
      <mesh position={[0, 0.0045, 0]} receiveShadow>
        <boxGeometry args={[2.0, 0.006, 0.68]} />
        <meshStandardMaterial attach="material-0" color="#121220" />
        <meshStandardMaterial attach="material-1" color="#121220" />
        <meshStandardMaterial attach="material-2" map={tex} roughness={0.95} />
        <meshStandardMaterial attach="material-3" color="#121220" />
        <meshStandardMaterial attach="material-4" color="#121220" />
        <meshStandardMaterial attach="material-5" color="#121220" />
      </mesh>
      <mesh position={[0, 0.0025, 0]}>
        <boxGeometry args={[2.02, 0.004, 0.70]} />
        <meshBasicMaterial color={glow(C.cyan, 1.6)} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------------------------------------------------------------------------------------------- */
/* Documents                                                                                      */
/* ---------------------------------------------------------------------------------------------- */

function Resume() {
  const tex = useMemo(() => createResumeTexture(), [])
  const d = DOCS.resume
  return (
    <Clickable id="resume" label="Resume" hint="read" position={d.pos} rotation={[0, d.rotY, 0]} labelOffset={[0, 0.2, 0]}>
      {[0, 1].map((i) => (
        <mesh key={i} position={[0.012 * (i + 1), 0.003 + i * 0.003, 0.008 * (i + 1)]} rotation={[0, 0.05 * (i + 1), 0]} receiveShadow castShadow>
          <boxGeometry args={[0.42, 0.003, 0.594]} />
          <Mat color="#e9e5dc" rough={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.011, 0]} castShadow>
        <boxGeometry args={[0.42, 0.003, 0.594]} />
        <meshStandardMaterial attach="material-0" color="#fffdf8" />
        <meshStandardMaterial attach="material-1" color="#fffdf8" />
        <meshStandardMaterial attach="material-2" map={tex} roughness={0.9} />
        <meshStandardMaterial attach="material-3" color="#fffdf8" />
        <meshStandardMaterial attach="material-4" color="#fffdf8" />
        <meshStandardMaterial attach="material-5" color="#fffdf8" />
      </mesh>
    </Clickable>
  )
}

function ProjectsFolder() {
  const tex = useMemo(() => createFolderLabelTexture(), [])
  const d = DOCS.projects
  const pink = '#FF6B8B'
  return (
    <Clickable id="projects" label="Projects folder" hint="open" position={d.pos} rotation={[0, d.rotY, 0]} labelOffset={[0, 0.2, 0]}>
      <mesh position={[0.03, 0.01, -0.03]} rotation={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.46, 0.004, 0.34]} />
        <Mat color="#fffdf8" rough={0.9} />
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.5, 0.012, 0.36]} />
        <meshStandardMaterial attach="material-0" color={pink} />
        <meshStandardMaterial attach="material-1" color={pink} />
        <meshStandardMaterial attach="material-2" map={tex} roughness={0.7} />
        <meshStandardMaterial attach="material-3" color={pink} />
        <meshStandardMaterial attach="material-4" color={pink} />
        <meshStandardMaterial attach="material-5" color={pink} />
      </mesh>
      <RoundedBox args={[0.16, 0.012, 0.06]} radius={0.004} position={[-0.14, 0.02, -0.2]}>
        <Mat color={pink} rough={0.7} />
      </RoundedBox>
    </Clickable>
  )
}

function ContactCard() {
  const tex = useMemo(() => createCardTexture(), [])
  const d = DOCS.contact
  return (
    <Clickable id="contact" label="Business card" hint="contact" position={d.pos} rotation={[0, d.rotY, 0]} labelOffset={[0, 0.16, 0]}>
      <RoundedBox args={[0.3, 0.02, 0.2]} radius={0.008} position={[0, 0.01, 0]} castShadow>
        <Mat color="#3a3650" rough={0.4} metal={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.0225, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.26, 0.152]} />
        <meshStandardMaterial map={tex} roughness={0.5} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.25} />
      </mesh>
    </Clickable>
  )
}

function StickyNote() {
  const tex = useMemo(() => createNoteTexture(), [])
  const d = DOCS.note
  return (
    <Clickable id="note" label="Sticky note" position={d.pos} rotation={[0, 0, -0.08]} labelOffset={[0, 0.13, 0]}>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[0.15, 0.15]} />
        <meshBasicMaterial map={tex} />
      </mesh>
    </Clickable>
  )
}

export function Desk() {
  return (
    <group>
      <Room />
      {/* Soft contact shadows, rendered once: objects sit on the desk and the floor instead of floating */}
      <ContactShadows frames={1} position={[0, 0.003, 0]} scale={[3.6, 1.5]} resolution={512} far={0.45} blur={2.2} opacity={0.6} />
      <ContactShadows frames={1} position={[0, ROOM.floorY + 0.004, 0.5]} scale={[6, 4]} resolution={512} far={0.9} blur={2.8} opacity={0.55} />
      <HexPanels />
      <NeonSign />
      <WallShelf />
      <Table />
      <Chair />
      <Monitor />
      <SideMonitor />
      <StickyNote />
      <DeskMat />
      <Keyboard />
      <Mouse />
      <PCTower />
      <Headset />
      <Mug />
      <Cat />
      <Resume />
      <ProjectsFolder />
      <ContactCard />
    </group>
  )
}
