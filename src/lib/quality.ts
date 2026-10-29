export type Tier = 'low' | 'medium' | 'high'

export interface QualitySettings {
  /** Device-pixel-ratio range handed to the Canvas. */
  dpr: [number, number]
  /** 0 disables shadows entirely. */
  shadowMap: number
  /** Image-based reflections on every PBR surface; 0 disables them (about a quarter of an iGPU frame). */
  envResolution: number
  /** 4x MSAA on the canvas. Fixed when the WebGL context is created. */
  antialias: boolean
}

export const QUALITY: Record<Tier, QualitySettings> = {
  // Coloured light is baked into textures. Measured on an Intel UHD iGPU at medium (~0.8 MP), per
  // frame: MSAA ~6.7 ms, environment reflections ~6.2 ms, shadow lookups ~2.2 ms. So the iGPU tiers
  // drop the first two and keep the shadows.
  high: { dpr: [1, 1.5], shadowMap: 2048, envResolution: 128, antialias: true },
  medium: { dpr: [1, 1.25], shadowMap: 1024, envResolution: 0, antialias: false },
  low: { dpr: [0.75, 1], shadowMap: 0, envResolution: 0, antialias: false },
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
  if (touch || small || cores <= 4 || memory <= 4 || reduceMotion || integratedGpu()) return 'medium'
  return 'high'
}

/**
 * Laptop iGPUs (Intel UHD/Iris, AMD Vega/Radeon Graphics) share memory bandwidth with the CPU and
 * struggle with high dpr. Apple Silicon is integrated too but is fast enough for "high".
 */
function integratedGpu() {
  try {
    const gl = document.createElement('canvas').getContext('webgl')
    if (!gl) return false
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return /intel|radeon\(tm\) graphics|radeon graphics|vega \d+ graphics|mali|adreno|powervr|swiftshader|llvmpipe/i.test(renderer)
  } catch {
    return false
  }
}

export function rememberTier(t: Tier) {
  try {
    sessionStorage.setItem(KEY, t)
  } catch {
    /* ignore */
  }
}
