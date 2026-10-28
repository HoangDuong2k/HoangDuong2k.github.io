import { useSyncExternalStore } from 'react'
import type { Tier } from './quality'

export type DocId = 'resume' | 'projects' | 'contact' | 'note'
export type Focus = null | 'computer' | DocId

interface State {
  focus: Focus
  /** True once the camera has arrived at the focus pose — overlays wait for it. */
  arrived: boolean
  hovered: string | null
  paletteOpen: boolean
  /** Graphics quality; set on boot, lowered at runtime if FPS drops. */
  tier: Tier
}

let state: State = { focus: null, arrived: false, hovered: null, paletteOpen: false, tier: 'high' }
const listeners = new Set<() => void>()

export function setState(patch: Partial<State>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function getState() {
  return state
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => select(state),
    () => select(state),
  )
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__store = { getState, setState }
}

export function focusOn(focus: Focus) {
  setState({ focus, arrived: false, hovered: null })
}
