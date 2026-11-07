import { useRef, type ReactNode } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { focusOn, getState, setState, useStore, type Focus } from '@/lib/store'

interface Props {
  id: Exclude<Focus, null>
  label: string
  hint?: string
  labelOffset?: [number, number, number]
  children: ReactNode
  position?: [number, number, number]
  rotation?: [number, number, number]
  /** Keep the object in place on hover (heavy, "furniture" objects like the monitor). */
  still?: boolean
}

const probe = new THREE.Raycaster()

/** Opaque, visible geometry. Light pools, steam and sprites don't depth-write, so they never block. */
function solid(o: THREE.Object3D) {
  if (!(o as THREE.Mesh).isMesh) return false
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false
  const m = (o as THREE.Mesh).material
  return ([] as THREE.Material[]).concat(m).every((mat) => mat.depthWrite !== false)
}

/** Hover lift + label + click-to-focus. Clicks that were really drags are ignored. */
export function Clickable({ id, label, hint, labelOffset = [0, 0.25, 0], children, position, rotation, still = false }: Props) {
  const group = useRef<THREE.Group>(null)
  const hovered = useStore((s) => s.hovered === id)
  const idle = useStore((s) => s.focus === null)
  const scene = useThree((s) => s.scene)

  /**
   * R3F only raycasts objects that have handlers, so a keyboard or headset in front of the screen
   * would not block it. Only count the pointer when the nearest solid surface under it is ours.
   */
  const inFront = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const g = group.current
    if (!g) return false
    probe.ray.copy(e.ray)
    probe.camera = e.camera
    const hit = probe.intersectObject(scene, true).find((h) => solid(h.object))
    for (let o: THREE.Object3D | null = hit?.object ?? null; o; o = o.parent) if (o === g) return true
    return false
  }

  useFrame((_, dt) => {
    const g = group.current
    if (!g || still) return
    const lift = hovered && idle ? 1 : 0
    const k = 1 - Math.exp(-dt * 12)
    g.position.y = THREE.MathUtils.lerp(g.position.y, lift * 0.03, k)
    const s = THREE.MathUtils.lerp(g.scale.x, 1 + lift * 0.04, k)
    g.scale.setScalar(s)
  })

  const move = (e: ThreeEvent<PointerEvent>) => {
    const on = inFront(e)
    if (on) e.stopPropagation()
    if (on === (getState().hovered === id)) return
    setState({ hovered: on ? id : null })
    document.body.style.cursor = on ? 'pointer' : ''
  }
  const out = () => {
    if (getState().hovered === id) setState({ hovered: null })
    document.body.style.cursor = ''
  }
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6 || !inFront(e)) return
    e.stopPropagation()
    document.body.style.cursor = ''
    focusOn(id)
  }

  return (
    <group position={position} rotation={rotation}>
      <group ref={group} onPointerMove={idle ? move : undefined} onPointerOut={out} onClick={idle ? click : undefined}>
        {children}
      </group>
      {hovered && idle && (
        <Html position={labelOffset} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="anim-rise whitespace-nowrap rounded-full bg-[#1d1b2e] px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            {label}
            {hint && <span className="ml-1.5 text-white/60">{hint}</span>}
          </div>
        </Html>
      )}
    </group>
  )
}
