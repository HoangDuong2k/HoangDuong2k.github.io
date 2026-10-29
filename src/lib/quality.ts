export type Tier = 'low' | 'medium' | 'high'

export interface QualitySettings {
  /** Device-pixel-ratio range handed to the Canvas. */
  dpr: [number, number]
  /** 0 disables shadows entirely. */
  shadowMap: number
  bloom: boolean
  /** MSAA samples on the post-processing buffer. */
  multisampling: number
  envResolution: number
  /** Decorative point lights (neon, window, PC, monitor backlight). The RGB wall wash always stays. */
  accentLights: boolean
}

export const QUALITY: Record<Tier, QualitySettings> = {
  // Every extra light is paid per pixel on every lit surface, and pixels grow with dpr squared, so
  // those two are the main levers. Above ~1.5 dpr the difference is hard to see but costly.
  high: { dpr: [1, 1.5], shadowMap: 2048, bloom: true, multisampling: 2, envResolution: 128, accentLights: true },
  medium: { dpr: [1, 1.25], shadowMap: 1024, bloom: true, multisampling: 0, envResolution: 64, accentLights: false },
  low: { dpr: [0.75, 1], shadowMap: 0, bloom: false, multisampling: 0, envResolution: 32, accentLights: false },
}

const ORDER: Tier[] = ['low', 'medium', 'high']
const KEY = 'hoang.quality'

export function lowerTier(t: Tier): Tier {
  return ORDER[Math.max(0, ORDER.indexOf(t) - 1)]
}

/**
 * First guess from cheap hints; PerformanceMonitor corrects it at runtime.
 * `?quality=low|medium|high` overrides, and a downgrade is remembered for the session.
 */
export function detectTier(): Tier {
  const param = new URLSearchParams(window.location.search).get('quality')
  if (param === 'low' || param === 'medium' || param === 'high') return param
  try {
    const saved = sessionStorage.getItem(KEY)
    if (saved === 'low' || saved === 'medium' || saved === 'high') return saved
  } catch {
    /* storage blocked: fall through to heuristics */
  }
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 8
  const touch = window.matchMedia('(pointer: coarse)').matches
  const small = Math.min(window.innerWidth, window.innerHeight) < 600
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (cores <= 2 || memory <= 2) return 'low'
  if (touch || small || cores <= 4 || memory <= 4 || reduceMotion) return 'medium'
  return 'high'
}

export function rememberTier(t: Tier) {
  try {
    sessionStorage.setItem(KEY, t)
  } catch {
    /* ignore */
  }
}
