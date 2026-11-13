import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import * as THREE from 'three'
import { getState, setState, useStore } from '@/lib/store'
import { HOME, poseFor } from './layout'

const DURATION = 1.1 // seconds
const { ACTION } = CameraControlsImpl

/** Orbit limits for free exploring; lifted while flying in to a close-up. */
const LIMITS = {
  minDistance: 2.6,
  maxDistance: 7.2,
  minPolarAngle: 0.55,
  maxPolarAngle: 1.4,
  minAzimuthAngle: -0.3,
  maxAzimuthAngle: 1.15,
}
const UNLIMITED = {
  minDistance: 0,
  maxDistance: Infinity,
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,
}

interface Tween {
  fromPos: THREE.Vector3
  fromTarget: THREE.Vector3
  toPos: THREE.Vector3
  toTarget: THREE.Vector3
  start: number
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** On narrow screens pull the overview camera back so the whole desk fits. */
function homePos(aspect: number) {
  const k = aspect < 1 ? 1 + (1 - aspect) * 1.7 : 1
  return new THREE.Vector3(...HOME.pos).sub(new THREE.Vector3(...HOME.target)).multiplyScalar(k).add(new THREE.Vector3(...HOME.target))
}

const pos = new THREE.Vector3()
const target = new THREE.Vector3()

/** Keyboard orbit: arrows turn around the desk, +/- (or PageUp/PageDown) zoom. Speeds per second. */
const KEY_TURN = 1.1
const KEY_TILT = 0.7
const KEY_ZOOM = 3
const KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_', 'PageUp', 'PageDown'])

function typingInto(t: EventTarget | null) {
  const el = t as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

/** Keys currently held; cleared when the window loses focus so nothing stays "stuck". */
function useHeldKeys() {
  const held = useRef(new Set<string>())
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!KEYS.has(e.key) || e.ctrlKey || e.metaKey || e.altKey || typingInto(e.target) || getState().focus) return
      e.preventDefault() // no page scroll
      held.current.add(e.key)
    }
    const up = (e: KeyboardEvent) => held.current.delete(e.key)
    const clear = () => held.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])
  return held
}

/**
 * Free orbit (drag) while nothing is focused; a timed fly-to when something is.
 * camera-controls smooths by time (smoothTime), not per frame, so drag inertia feels the same at
 * 60, 120 or 144 Hz and through the odd dropped frame.
 * The orbit pose is remembered so "back" returns to where the visitor left off.
 */
export function CameraRig() {
  const controls = useRef<CameraControlsImpl>(null)
  const aspect = useThree((s) => s.size.width / s.size.height)
  const focus = useStore((s) => s.focus)
  const tween = useRef<Tween | null>(null)
  const saved = useRef({ pos: homePos(aspect), target: new THREE.Vector3(...HOME.target) })
  const held = useHeldKeys()

  useEffect(() => {
    const c = controls.current
    if (!c) return
    Object.assign(c, LIMITS)
    c.mouseButtons.left = ACTION.ROTATE
    c.mouseButtons.middle = ACTION.DOLLY
    c.mouseButtons.right = ACTION.NONE
    c.mouseButtons.wheel = ACTION.DOLLY
    c.touches.one = ACTION.TOUCH_ROTATE
    c.touches.two = ACTION.TOUCH_DOLLY
    c.touches.three = ACTION.NONE
    const p = homePos(aspect)
    c.setLookAt(p.x, p.y, p.z, ...HOME.target, false)
    saved.current.pos.copy(p)
    if (import.meta.env.DEV) Object.assign(window, { __controls: c })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial framing only
  }, [])

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let to: { pos: THREE.Vector3; target: THREE.Vector3 }
    if (focus) {
      if (c.enabled) {
        c.getPosition(saved.current.pos)
        c.getTarget(saved.current.target)
      }
      c.enabled = false
      Object.assign(c, UNLIMITED)
      const p = poseFor(focus)
      to = { pos: new THREE.Vector3(...p.pos), target: new THREE.Vector3(...p.target) }
    } else {
      to = { pos: saved.current.pos.clone(), target: saved.current.target.clone() }
    }
    tween.current = {
      fromPos: c.getPosition(new THREE.Vector3()),
      fromTarget: c.getTarget(new THREE.Vector3()),
      toPos: to.pos,
      toTarget: to.target,
      start: reduce ? -Infinity : performance.now(),
    }
    // Overlays must not depend on the render loop (it pauses in background tabs).
    const timer = window.setTimeout(() => finish(), reduce ? 0 : DURATION * 1000 + 150)
    return () => window.clearTimeout(timer)
  }, [focus])

  const place = (c: CameraControlsImpl, p: THREE.Vector3, t: THREE.Vector3) => {
    c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, false)
    c.update(0)
  }

  const finish = () => {
    const c = controls.current
    const t = tween.current
    if (!c) return
    if (t) {
      place(c, t.toPos, t.toTarget)
      tween.current = null
    }
    if (getState().focus) {
      if (!getState().arrived) setState({ arrived: true })
    } else if (!c.enabled) {
      Object.assign(c, LIMITS)
      c.enabled = true
    }
  }

  useFrame((_, dt) => {
    const c = controls.current
    const t = tween.current
    if (c && !t && c.enabled && held.current.size) {
      if (getState().focus) held.current.clear()
      const k = held.current
      const step = Math.min(dt, 0.05)
      const turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0)
      const tilt = (k.has('ArrowDown') ? 1 : 0) - (k.has('ArrowUp') ? 1 : 0)
      const zoom = (k.has('+') || k.has('=') || k.has('PageUp') ? 1 : 0) - (k.has('-') || k.has('_') || k.has('PageDown') ? 1 : 0)
      // Same smoothing as dragging (the controls ease towards the new pose); limits still apply.
      if (turn || tilt) c.rotate(-turn * KEY_TURN * step, tilt * KEY_TILT * step, true)
      if (zoom) c.dolly(zoom * KEY_ZOOM * step, true)
    }
    if (!c || !t) return
    const p = Math.min((performance.now() - t.start) / (DURATION * 1000), 1)
    const k = ease(p)
    place(c, pos.lerpVectors(t.fromPos, t.toPos, k), target.lerpVectors(t.fromTarget, t.toTarget, k))
    if (p >= 1) finish()
  })

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.3}
      draggingSmoothTime={0.16}
      azimuthRotateSpeed={0.6}
      polarRotateSpeed={0.6}
      dollySpeed={0.6}
    />
  )
}
