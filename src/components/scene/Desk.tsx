import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/lib/store'
import { QUALITY } from '@/lib/quality'
import { Clickable } from './Clickable'
import { DOCS, ROOM, SCREEN } from './layout'
import {
  createCardTexture,
  createCodeTexture,
  createDeskMatTexture,
  createFloorTexture,
  createFolderLabelTexture,
  createNeonTexture,
  createNoteTexture,
  createResumeTexture,
  createScreenTexture,
  createSkylineTexture,
} from './textures'

const C = {
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

/** Emissive colour pushed above 1.0 so Bloom (threshold 1) picks it up. */
function glow(hex: string, power = 2.2) {
  return new THREE.Color(hex).multiplyScalar(power)
}

function Mat({ color, rough = 0.6, metal = 0 }: { color: string; rough?: number; metal?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
}

/** Decorative lights only render on tiers that can afford the extra per-pixel cost. */
function Accent({ children }: { children: ReactNode }) {
  const on = useStore((st) => QUALITY[st.tier].accentLights)
  return on ? <>{children}</> : null
}

/** Shared RGB clock so every light strip cycles in sync. */
const rgb = new THREE.Color()
function rgbAt(t: number, offset = 0) {
  return rgb.setHSL((t * 0.06 + offset) % 1, 0.85, 0.55)
}

/* ---------------------------------------------------------------------------------------------- */
/* Room shell                                                                                     */
/* ---------------------------------------------------------------------------------------------- */

function Room() {
  const floor = useMemo(() => createFloorTexture(), [])
  const sky = useMemo(() => createSkylineTexture(), [])
  const { backZ, leftX, floorY } = ROOM
  const W = 6.4
  const D = 5
  const H = 4.4
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[leftX + W / 2, floorY, backZ + D / 2]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floor} roughness={0.55} metalness={0.05} />
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
      {/* Left wall */}
      <mesh position={[leftX, floorY + H / 2, backZ + D / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[D, H]} />
        <Mat color="#17151f" rough={0.95} />
      </mesh>
      {/* Window with city at night */}
      <group position={[leftX + 0.01, 0.75, 0.6]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[1.7, 1.5]} />
          <meshBasicMaterial map={sky} toneMapped={false} />
        </mesh>
        {[
          [0, 0.77, 1.8, 0.06],
          [0, -0.77, 1.8, 0.06],
          [-0.88, 0, 0.06, 1.6],
          [0.88, 0, 0.06, 1.6],
          [0, 0, 0.035, 1.5],
          [0, 0, 1.7, 0.035],
        ].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.02]}>
            <boxGeometry args={[w, h, 0.05]} />
            <Mat color="#0e0e14" rough={0.4} />
          </mesh>
        ))}
        <Accent><pointLight position={[0, 0, 0.6]} color="#ff8fb0" intensity={1.2} distance={3} /></Accent>
      </group>
      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, floorY + 0.006, 1.2]} receiveShadow>
        <circleGeometry args={[1.5, 64]} />
        <Mat color="#232036" rough={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, floorY + 0.008, 1.2]}>
        <ringGeometry args={[1.38, 1.44, 64]} />
        <Mat color={C.violet} rough={1} />
      </mesh>
    </group>
  )
}

/** Hexagon light panels on the back wall, cycling through the RGB wheel. */
function HexPanels() {
  const refs = useRef<THREE.MeshBasicMaterial[]>([])
  const cells: [number, number][] = [
    [0, 0],
    [1, 0],
    [0.5, 0.866],
    [1.5, 0.866],
    [2, 0],
    [1, -0.866],
    [2.5, 0.866],
  ]
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (m) m.color.copy(rgbAt(clock.elapsedTime, i * 0.07)).multiplyScalar(1.6)
    })
  })
  return (
    <group position={[0.55, 1.62, ROOM.backZ + 0.02]} scale={0.22}>
      {cells.map(([x, y], i) => (
        <group key={i} position={[x * 1.08, y * 1.08, 0]}>
          <mesh rotation={[Math.PI / 2, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.6, 0.6, 0.12, 6]} />
            <Mat color={C.black} rough={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.065]} rotation={[0, 0, Math.PI / 6]}>
            <circleGeometry args={[0.5, 6]} />
            <meshBasicMaterial ref={(m) => void (refs.current[i] = m!)} toneMapped={false} />
          </mesh>
        </group>
      ))}
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
      <Accent><pointLight position={[0, 0, 0.4]} color={C.pink} intensity={1.6} distance={2.2} /></Accent>
    </group>
  )
}

function WallShelf() {
  return (
    <group position={[1.75, 1.15, ROOM.backZ + 0.16]}>
      <RoundedBox args={[1.1, 0.04, 0.3]} radius={0.01} castShadow receiveShadow>
        <Mat color={C.deskEdge} rough={0.5} />
      </RoundedBox>
      {/* LED under the shelf */}
      <mesh position={[0, -0.025, 0.12]}>
        <boxGeometry args={[1.0, 0.008, 0.01]} />
        <meshBasicMaterial color={glow(C.cyan, 2.5)} toneMapped={false} />
      </mesh>
      {/* Plant */}
      <group position={[-0.38, 0.02, 0]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.065, 0.16, 24]} />
          <Mat color="#e7e5ee" rough={0.4} />
        </mesh>
        {[
          [0, 0.24, 0, 0.09],
          [-0.06, 0.2, 0.03, 0.07],
          [0.07, 0.21, -0.02, 0.07],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial color={i % 2 ? '#34d399' : '#10b981'} roughness={0.7} flatShading />
          </mesh>
        ))}
      </group>
      {/* Books */}
      {[C.violet, C.pink, '#e7e5ee'].map((c, i) => (
        <RoundedBox key={c} args={[0.05, 0.24 - i * 0.02, 0.18]} radius={0.006} position={[-0.12 + i * 0.055, 0.14 - i * 0.01, 0]} castShadow>
          <Mat color={c} rough={0.7} />
        </RoundedBox>
      ))}
      {/* Little robot figure */}
      <group position={[0.18, 0.02, 0]}>
        <RoundedBox args={[0.1, 0.12, 0.08]} radius={0.02} position={[0, 0.06, 0]} castShadow>
          <Mat color="#e7e5ee" rough={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.13, 0.09, 0.09]} radius={0.025} position={[0, 0.17, 0]} castShadow>
          <Mat color="#e7e5ee" rough={0.3} />
        </RoundedBox>
        {[-0.03, 0.03].map((x) => (
          <mesh key={x} position={[x, 0.175, 0.046]}>
            <circleGeometry args={[0.012, 16]} />
            <meshBasicMaterial color={glow(C.cyan, 3)} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* Gamepad */}
      <group position={[0.4, 0.045, 0]} rotation={[-0.25, -0.4, 0]}>
        <RoundedBox args={[0.18, 0.04, 0.1]} radius={0.018} castShadow>
          <Mat color={C.black} rough={0.45} />
        </RoundedBox>
        {[
          [0.05, C.pink],
          [0.07, C.cyan],
        ].map(([x, c]) => (
          <mesh key={c as string} position={[x as number, 0.022, -0.01]}>
            <sphereGeometry args={[0.009, 12, 12]} />
            <meshBasicMaterial color={glow(c as string, 2)} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ---------------------------------------------------------------------------------------------- */
/* Desk                                                                                           */
/* ---------------------------------------------------------------------------------------------- */

function Table() {
  const strip = useRef<THREE.MeshBasicMaterial>(null)
  const wash = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    const c = rgbAt(clock.elapsedTime, 0.5)
    strip.current?.color.copy(c).multiplyScalar(2.6)
    wash.current?.color.copy(c)
  })
  return (
    <group>
      <RoundedBox args={[3.6, 0.07, 1.5]} radius={0.02} smoothness={4} position={[0, -0.035, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={C.desk} roughness={0.35} metalness={0.15} />
      </RoundedBox>
      {/* Steel frame: T-legs */}
      {[-1.55, 1.55].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, -0.85, 0]} castShadow>
            <boxGeometry args={[0.07, 1.6, 0.07]} />
            <Mat color={C.metal} rough={0.35} metal={0.7} />
          </mesh>
          <RoundedBox args={[0.09, 0.05, 1.3]} radius={0.015} position={[0, ROOM.floorY + 0.025, 0]} castShadow>
            <Mat color={C.metal} rough={0.35} metal={0.7} />
          </RoundedBox>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.07, 0.05, 1.25]} />
            <Mat color={C.metal} rough={0.35} metal={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.12, -0.5]}>
        <boxGeometry args={[3.1, 0.06, 0.05]} />
        <Mat color={C.metal} rough={0.35} metal={0.7} />
      </mesh>
      {/* RGB strip behind the desk washing the wall */}
      <mesh position={[0, -0.08, -0.74]}>
        <boxGeometry args={[3.4, 0.012, 0.012]} />
        <meshBasicMaterial ref={strip} toneMapped={false} />
      </mesh>
      <pointLight ref={wash} position={[0, -0.25, -0.88]} intensity={3} distance={2.6} decay={1.6} />
    </group>
  )
}

function Monitor() {
  const screen = useMemo(() => createScreenTexture(), [])
  useEffect(() => () => screen.dispose(), [screen])
  const [x, y, z] = SCREEN.center
  return (
    <Clickable id="computer" label="Log in to hoang.os" hint="click" labelOffset={[0, 0.66, 0]} still>
      {/* Stand */}
      <RoundedBox args={[0.42, 0.02, 0.26]} radius={0.008} position={[0, 0.01, -0.5]} castShadow>
        <Mat color={C.metal} rough={0.3} metal={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.32, -0.55]} castShadow>
        <boxGeometry args={[0.06, 0.6, 0.03]} />
        <Mat color={C.metal} rough={0.3} metal={0.8} />
      </mesh>
      {/* Body with thin bezel */}
      <RoundedBox args={[SCREEN.width + 0.04, SCREEN.height + 0.05, 0.04]} radius={0.012} position={[x, y, z - 0.021]} castShadow>
        <Mat color={C.black} rough={0.4} />
      </RoundedBox>
      <mesh position={[x, y, z + 0.001]}>
        <planeGeometry args={[SCREEN.width, SCREEN.height]} />
        <meshBasicMaterial map={screen.texture} toneMapped={false} />
      </mesh>
      {/* Bias light behind the monitor */}
      <mesh position={[x, y, z - 0.045]}>
        <planeGeometry args={[SCREEN.width - 0.1, SCREEN.height - 0.1]} />
        <meshBasicMaterial color={glow(C.violet, 1.4)} toneMapped={false} side={THREE.BackSide} />
      </mesh>
      <Accent><pointLight position={[0, 0.8, -0.75]} color={C.violet} intensity={2.5} distance={2} /></Accent>
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
        <Accent><spotLight position={[0, 0, 0.02]} target-position={[0, -0.9, 0.5]} angle={0.75} penumbra={0.8} intensity={4} distance={2} color="#fff1dc" /></Accent>
      </group>
    </Clickable>
  )
}

function SideMonitor() {
  const code = useMemo(() => createCodeTexture(), [])
  useEffect(() => () => code.dispose(), [code])
  return (
    <group position={[-1.32, 0, -0.42]} rotation={[0, 0.5, 0]}>
      <RoundedBox args={[0.3, 0.02, 0.22]} radius={0.008} position={[0, 0.01, -0.02]} castShadow>
        <Mat color={C.metal} rough={0.3} metal={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.3, -0.06]} castShadow>
        <boxGeometry args={[0.05, 0.56, 0.025]} />
        <Mat color={C.metal} rough={0.3} metal={0.8} />
      </mesh>
      <RoundedBox args={[0.52, 0.88, 0.035]} radius={0.01} position={[0, 0.76, -0.035]} castShadow>
        <Mat color={C.black} rough={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.76, -0.016]}>
        <planeGeometry args={[0.49, 0.845]} />
        <meshBasicMaterial map={code.texture} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Keyboard() {
  const keys = useRef<THREE.InstancedMesh>(null)
  const cols = 15
  const rows = 5
  useLayoutEffect(() => {
    const mesh = keys.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    let i = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        m.makeTranslation(-0.42 + c * 0.06, 0.042, -0.12 + r * 0.058)
        mesh.setMatrixAt(i++, m)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [])
  // Rainbow wave sweeping across the keys.
  const color = useMemo(() => new THREE.Color(), [])
  useFrame(({ clock }) => {
    const mesh = keys.current
    if (!mesh) return
    const t = clock.elapsedTime
    for (let i = 0; i < rows * cols; i++) {
      const c = i % cols
      color.setHSL((c / cols) * 0.5 - t * 0.12 + 10, 0.9, 0.42)
      mesh.setColorAt(i, color)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })
  return (
    <group position={[0, 0, 0.24]}>
      <RoundedBox args={[0.95, 0.03, 0.33]} radius={0.01} position={[0, 0.015, 0]} castShadow receiveShadow>
        <Mat color={C.black} rough={0.35} metal={0.4} />
      </RoundedBox>
      <instancedMesh ref={keys} args={[undefined, undefined, rows * cols]}>
        <boxGeometry args={[0.05, 0.022, 0.048]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

function DeskMat() {
  const tex = useMemo(() => createDeskMatTexture(), [])
  const edge = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => edge.current?.color.copy(rgbAt(clock.elapsedTime, 0.25)).multiplyScalar(2))
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
        <meshBasicMaterial ref={edge} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Mouse() {
  const logo = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => logo.current?.color.copy(rgbAt(clock.elapsedTime, 0.6)).multiplyScalar(2.4))
  return (
    <group position={[0.85, 0, 0.3]} rotation={[0, -0.15, 0]}>
      <mesh position={[0, 0.026, 0]} scale={[0.052, 0.026, 0.085]} castShadow>
        <sphereGeometry args={[1, 32, 16]} />
        <Mat color={C.black} rough={0.35} metal={0.3} />
      </mesh>
      <mesh position={[0, 0.047, 0.03]} rotation={[-Math.PI / 2 + 0.3, 0, 0]}>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial ref={logo} toneMapped={false} />
      </mesh>
    </group>
  )
}

function PCTower() {
  const fans = useRef<THREE.Group>(null)
  const rings = useRef<THREE.MeshBasicMaterial[]>([])
  useFrame(({ clock }, dt) => {
    fans.current?.children.forEach((f) => {
      const blades = f.getObjectByName('blades')
      if (blades) blades.rotation.z -= dt * 6
    })
    rings.current.forEach((m, i) => m?.color.copy(rgbAt(clock.elapsedTime, i * 0.12)).multiplyScalar(2.4))
  })
  const W = 0.58
  const H = 0.66
  const D = 0.3
  return (
    <group position={[1.42, 0, -0.38]} rotation={[0, -0.25, 0]}>
      {/* Chassis frame; the +z side is glass */}
      {[
        [0, H - 0.01, 0, W, 0.02, D],
        [0, 0.01, 0, W, 0.02, D],
        [-W / 2 + 0.01, H / 2, 0, 0.02, H, D],
        [W / 2 - 0.01, H / 2, 0, 0.02, H, D],
        [0, H / 2, -D / 2 + 0.01, W, H, 0.02],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <Mat color={C.ink} rough={0.35} metal={0.6} />
        </mesh>
      ))}
      {/* Tempered glass */}
      <mesh position={[0, H / 2, D / 2]}>
        <planeGeometry args={[W - 0.02, H - 0.02]} />
        <meshPhysicalMaterial color="#9aa4ff" transparent opacity={0.12} roughness={0.05} metalness={0} clearcoat={1} />
      </mesh>
      {/* Motherboard + GPU */}
      <mesh position={[0, H / 2, -D / 2 + 0.03]}>
        <boxGeometry args={[W - 0.08, H - 0.08, 0.01]} />
        <Mat color="#1e1e2a" rough={0.6} />
      </mesh>
      <RoundedBox args={[0.34, 0.06, 0.16]} radius={0.01} position={[-0.06, 0.26, -0.02]}>
        <Mat color="#26262f" rough={0.3} metal={0.6} />
      </RoundedBox>
      <mesh position={[-0.06, 0.26, 0.061]}>
        <boxGeometry args={[0.3, 0.006, 0.002]} />
        <meshBasicMaterial color={glow(C.lime, 2.2)} toneMapped={false} />
      </mesh>
      {/* CPU cooler */}
      <mesh position={[-0.06, 0.48, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 24]} />
        <meshBasicMaterial color={glow(C.cyan, 1.8)} toneMapped={false} />
      </mesh>
      {/* Front intake fans (visible through the glass) */}
      <group ref={fans}>
        {[0.15, 0.33, 0.51].map((fy, i) => (
          <group key={fy} position={[W / 2 - 0.09, fy, 0.04]}>
            <mesh>
              <torusGeometry args={[0.065, 0.007, 8, 32]} />
              <meshBasicMaterial ref={(m) => void (rings.current[i] = m!)} toneMapped={false} />
            </mesh>
            <group name="blades">
              {[0, 1, 2, 3, 4].map((b) => (
                <mesh key={b} rotation={[0, 0, (b / 5) * Math.PI * 2]} position={[0, 0, 0]}>
                  <boxGeometry args={[0.012, 0.11, 0.003]} />
                  <Mat color="#3b3b48" rough={0.5} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
      </group>
      <Accent><pointLight position={[0, H / 2, D / 2 + 0.15]} color={C.violet} intensity={1.2} distance={1.2} /></Accent>
    </group>
  )
}

function Headset() {
  return (
    <group position={[-0.62, 0, -0.28]} rotation={[0, 0.4, 0]}>
      <mesh position={[0, 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.02, 24]} />
        <Mat color={C.metal} rough={0.3} metal={0.7} />
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.01, 0.01, 0.32, 12]} />
        <Mat color={C.metal} rough={0.3} metal={0.7} />
      </mesh>
      {/* Headband */}
      <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.1, 0.014, 12, 32, Math.PI]} />
        <Mat color={C.black} rough={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.105, 0.26, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.04, 24]} />
            <Mat color={C.black} rough={0.5} />
          </mesh>
          <mesh position={[s * 0.021, 0, 0]} rotation={[0, s * Math.PI / 2, 0]}>
            <ringGeometry args={[0.035, 0.045, 24]} />
            <meshBasicMaterial color={glow(C.cyan, 2)} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Mug() {
  const steam = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    steam.current?.children.forEach((s, i) => {
      const t = (clock.elapsedTime * 0.35 + i / 3) % 1
      s.position.y = 0.18 + t * 0.25
      s.scale.setScalar(0.012 + t * 0.03)
      ;((s as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.12 * Math.sin(t * Math.PI)
    })
  })
  return (
    <group position={[1.45, 0, 0.45]}>
      <mesh position={[0, 0.075, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.15, 32]} />
        <Mat color="#ece9f5" rough={0.25} />
      </mesh>
      <mesh position={[0.065, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.03, 0.01, 12, 24, Math.PI]} />
        <Mat color="#ece9f5" rough={0.25} />
      </mesh>
      <mesh position={[0, 0.145, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.054, 32]} />
        <Mat color="#3b2414" rough={0.15} />
      </mesh>
      <group ref={steam}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Chair() {
  const accent = { color: C.violet, rough: 0.6 }
  return (
    <group position={[0.15, ROOM.floorY, 1.4]} rotation={[0, -0.3, 0]}>
      {/* 5-star base */}
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} rotation={[0, (i / 5) * Math.PI * 2, 0]}>
          <mesh position={[0, 0.08, 0.17]} castShadow>
            <boxGeometry args={[0.05, 0.04, 0.34]} />
            <Mat color={C.black} rough={0.4} metal={0.5} />
          </mesh>
          <mesh position={[0, 0.035, 0.33]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <Mat color={C.black} rough={0.4} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 16]} />
        <Mat color="#9ca3af" rough={0.25} metal={0.9} />
      </mesh>
      {/* Seat */}
      <RoundedBox args={[0.6, 0.12, 0.56]} radius={0.05} position={[0, 0.66, 0]} castShadow>
        <Mat color={C.black} rough={0.7} />
      </RoundedBox>
      {/* Seat bolsters */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.08, 0.1, 0.54]} radius={0.035} position={[s * 0.28, 0.74, 0]} castShadow>
          <Mat {...accent} />
        </RoundedBox>
      ))}
      {/* Racing-style back */}
      <group position={[0, 1.1, 0.3]} rotation={[-0.12, 0, 0]}>
        <RoundedBox args={[0.56, 0.86, 0.11]} radius={0.05} castShadow>
          <Mat color={C.black} rough={0.7} />
        </RoundedBox>
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[0.09, 0.8, 0.14]} radius={0.04} position={[s * 0.26, -0.02, -0.01]} castShadow>
            <Mat {...accent} />
          </RoundedBox>
        ))}
        <RoundedBox args={[0.26, 0.1, 0.07]} radius={0.03} position={[0, 0.32, -0.07]} castShadow>
          <Mat {...accent} />
        </RoundedBox>
      </group>
      {/* Armrests */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.36, 0.8, 0.05]}>
          <mesh position={[0, -0.06, 0]}>
            <boxGeometry args={[0.04, 0.16, 0.04]} />
            <Mat color={C.black} rough={0.4} />
          </mesh>
          <RoundedBox args={[0.08, 0.04, 0.26]} radius={0.015} position={[0, 0.03, 0]} castShadow>
            <Mat color={C.black} rough={0.6} />
          </RoundedBox>
        </group>
      ))}
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
      <Resume />
      <ProjectsFolder />
      <ContactCard />
    </group>
  )
}
