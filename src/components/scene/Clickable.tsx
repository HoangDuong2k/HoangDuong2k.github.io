import { useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { focusOn, setState, useStore, type Focus } from '@/lib/store'

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

/** Hover lift + label + click-to-focus. Clicks that were really drags are ignored. */
export function Clickable({ id, label, hint, labelOffset = [0, 0.25, 0], children, position, rotation, still = false }: Props) {
  const group = useRef<THREE.Group>(null)
  const hovered = useStore((s) => s.hovered === id)
  const idle = useStore((s) => s.focus === null)

  useFrame((_, dt) => {
    const g = group.current
    if (!g || still) return
    const lift = hovered && idle ? 1 : 0
    const k = 1 - Math.exp(-dt * 12)
    g.position.y = THREE.MathUtils.lerp(g.position.y, lift * 0.03, k)
    const s = THREE.MathUtils.lerp(g.scale.x, 1 + lift * 0.04, k)
    g.scale.setScalar(s)
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setState({ hovered: id })
    document.body.style.cursor = 'pointer'
  }
  const out = () => {
    setState({ hovered: null })
    document.body.style.cursor = ''
  }
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (e.delta > 6) return
    document.body.style.cursor = ''
    focusOn(id)
  }

  return (
    <group position={position} rotation={rotation}>
      <group ref={group} onPointerOver={idle ? over : undefined} onPointerOut={out} onClick={idle ? click : undefined}>
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
