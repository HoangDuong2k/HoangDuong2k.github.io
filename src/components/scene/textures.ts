import * as THREE from 'three'
import { profile } from '@/data/profile'

const SANS = '"Geist Variable", system-ui, sans-serif'
const MONO = '"Geist Mono Variable", ui-monospace, monospace'

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d')! }
}

function toTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Faint text lines that read as "a document" from a distance. */
function lines(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, count: number, gap = 22) {
  ctx.fillStyle = 'rgba(40,30,70,0.16)'
  for (let i = 0; i < count; i++) {
    const len = w * (0.55 + ((i * 37) % 45) / 100)
    roundRect(ctx, x, y + i * gap, len, 8, 4)
    ctx.fill()
  }
}

/* -------------------------------------------------------------------------------------------------
 * Monitor: lock screen of hoang.os, redrawn every second for the clock and caret.
 * -----------------------------------------------------------------------------------------------*/

export function createScreenTexture() {
  const W = 1024
  const H = 596
  const { canvas, ctx } = makeCanvas(W, H)
  const tex = toTexture(canvas)

  const draw = () => {
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#2a1f5c')
    bg.addColorStop(1, '#1b1733')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    const blob = (x: number, y: number, r: number, c: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, c)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
    }
    blob(160, 120, 420, 'rgba(167,139,250,0.85)')
    blob(880, 170, 380, 'rgba(251,113,133,0.75)')
    blob(600, 620, 420, 'rgba(52,211,153,0.6)')

    const now = new Date()
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.font = `600 132px ${SANS}`
    ctx.fillText(time, W / 2, 260)
    ctx.font = `500 30px ${SANS}`
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillText(now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }), W / 2, 312)

    // "Log in" pill with a blinking caret.
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    roundRect(ctx, W / 2 - 170, 380, 340, 64, 32)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `500 28px ${MONO}`
    const caret = now.getSeconds() % 2 === 0 ? '▍' : ' '
    ctx.fillText(`click to log in ${caret}`, W / 2, 422)

    ctx.font = `500 22px ${MONO}`
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillText(`${profile.handle}@hoang.os`, W / 2, 540)
    tex.needsUpdate = true
  }

  draw()
  document.fonts?.ready.then(draw)
  // Skip redraw + GPU upload while the tab is hidden.
  const timer = window.setInterval(() => !document.hidden && draw(), 1000)
  return { texture: tex, dispose: () => window.clearInterval(timer) }
}

/* -------------------------------------------------------------------------------------------------
 * Desk documents: the top face of each paper object.
 * -----------------------------------------------------------------------------------------------*/

export function createResumeTexture() {
  const W = 512
  const H = 724
  const { canvas, ctx } = makeCanvas(W, H)
  const tex = toTexture(canvas)
  const draw = () => {
    ctx.fillStyle = '#fffdf8'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#7C6CFF'
    ctx.fillRect(0, 0, W, 16)
    ctx.fillStyle = '#1d1b2e'
    ctx.font = `700 40px ${SANS}`
    ctx.fillText(profile.nameAscii, 44, 92)
    ctx.font = `500 22px ${SANS}`
    ctx.fillStyle = '#7C6CFF'
    ctx.fillText(`${profile.role} · ${profile.stack}`, 44, 128)
    const section = (title: string, y: number, n: number) => {
      ctx.fillStyle = '#1d1b2e'
      ctx.font = `700 18px ${SANS}`
      ctx.fillText(title.toUpperCase(), 44, y)
      lines(ctx, 44, y + 18, W - 88, n)
    }
    section('Summary', 186, 4)
    section('Experience', 312, 8)
    section('Projects', 520, 6)
    ctx.fillStyle = '#FF6B8B'
    ctx.font = `700 20px ${MONO}`
    ctx.save()
    ctx.translate(W - 110, H - 70)
    ctx.rotate(0.25)
    ctx.strokeStyle = '#FF6B8B'
    ctx.lineWidth = 3
    roundRect(ctx, -60, -26, 120, 44, 10)
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillText('2026', 0, 4)
    ctx.restore()
    tex.needsUpdate = true
  }
  draw()
  document.fonts?.ready.then(draw)
  return tex
}

export function createFolderLabelTexture() {
  const W = 512
  const H = 384
  const { canvas, ctx } = makeCanvas(W, H)
  const tex = toTexture(canvas)
  const draw = () => {
    ctx.fillStyle = '#FF6B8B'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#fff'
    roundRect(ctx, 56, 120, 400, 150, 18)
    ctx.fill()
    ctx.fillStyle = '#1d1b2e'
    ctx.font = `700 46px ${SANS}`
    ctx.textAlign = 'center'
    ctx.fillText('PROJECTS', W / 2, 192)
    ctx.font = `500 24px ${MONO}`
    ctx.fillStyle = '#FF6B8B'
    ctx.fillText('case studies · 05', W / 2, 238)
    tex.needsUpdate = true
  }
  draw()
  document.fonts?.ready.then(draw)
  return tex
}

export function createCardTexture() {
  const W = 512
  const H = 300
  const { canvas, ctx } = makeCanvas(W, H)
  const tex = toTexture(canvas)
  const draw = () => {
    const g = ctx.createLinearGradient(0, 0, W, H)
    g.addColorStop(0, '#1d1b2e')
    g.addColorStop(1, '#3b2f73')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#fff'
    ctx.font = `700 36px ${SANS}`
    ctx.fillText(profile.nameAscii, 36, 90)
    ctx.font = `500 22px ${SANS}`
    ctx.fillStyle = '#a78bfa'
    ctx.fillText(profile.role, 36, 126)
    ctx.font = `500 20px ${MONO}`
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.fillText(profile.email, 36, 206)
    ctx.fillText(`github/${profile.handle}`, 36, 240)
    ctx.fillStyle = '#34d399'
    ctx.beginPath()
    ctx.arc(W - 60, 60, 16, 0, Math.PI * 2)
    ctx.fill()
    tex.needsUpdate = true
  }
  draw()
  document.fonts?.ready.then(draw)
  return tex
}

export function createNoteTexture() {
  const W = 256
  const H = 256
  const { canvas, ctx } = makeCanvas(W, H)
  const tex = toTexture(canvas)
  const draw = () => {
    ctx.fillStyle = '#FFE066'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#4a3b00'
    ctx.font = `600 30px ${SANS}`
    ctx.fillText('next goal:', 24, 64)
    ctx.font = `700 34px ${SANS}`
    ctx.fillText('full-stack', 24, 120)
    ctx.fillText('→ architect', 24, 168)
    ctx.font = `500 22px ${MONO}`
    ctx.fillText('— me, 2026', 24, 220)
    tex.needsUpdate = true
  }
  draw()
  document.fonts?.ready.then(draw)
  return tex
}

/* -------------------------------------------------------------------------------------------------
 * Gaming room props
 * -----------------------------------------------------------------------------------------------*/

/** Vertical side monitor: an editor with real-looking code that slowly scrolls. */
export function createCodeTexture() {
  const W = 512
  const H = 880
  const { canvas, ctx } = makeCanvas(W, H)
  const tex = toTexture(canvas)
  const code: [string, string][] = [
    ['#c084fc', 'export function'],
    ['#7dd3fc', '  useRealtimeSync(source) {'],
    ['#94a3b8', '  // snapshot + delta, seq-ordered'],
    ['#f9a8d4', '  const [state, set] = useState()'],
    ['#fde68a', '  socket.on("delta", (d) => {'],
    ['#e2e8f0', '    if (d.seq <= last) return'],
    ['#e2e8f0', '    set((s) => apply(s, d))'],
    ['#fde68a', '  })'],
    ['#c084fc', '  return state'],
    ['#7dd3fc', '}'],
    ['#94a3b8', ''],
    ['#94a3b8', '// render(project, t) is pure'],
    ['#c084fc', 'const frame = render(p, t)'],
    ['#86efac', 'expect(frame).toMatchSnapshot()'],
    ['#94a3b8', ''],
    ['#f9a8d4', 'test("undo AI change", async () =>'],
    ['#e2e8f0', '  await mcp.call("bulk_edit")'],
    ['#e2e8f0', '  await undo.within("15m")'],
    ['#86efac', '  expect(tasks).toEqual(before)'],
    ['#f9a8d4', ')'],
  ]
  let offset = 0
  const draw = () => {
    ctx.fillStyle = '#0d1020'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#151a30'
    ctx.fillRect(0, 0, W, 44)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = `500 18px ${MONO}`
    ctx.fillText('useRealtimeSync.ts', 20, 29)
    ctx.font = `500 19px ${MONO}`
    const lh = 30
    const rows = Math.ceil((H - 60) / lh) + 1
    for (let i = 0; i < rows; i++) {
      const idx = (i + offset) % code.length
      const [color, text] = code[idx]
      const y = 80 + i * lh
      ctx.fillStyle = 'rgba(148,163,184,0.35)'
      ctx.fillText(String(idx + 1).padStart(2, ' '), 14, y)
      ctx.fillStyle = color
      ctx.fillText(text, 56, y)
    }
    tex.needsUpdate = true
  }
  draw()
  document.fonts?.ready.then(draw)
  const timer = window.setInterval(() => {
    if (document.hidden) return
    offset = (offset + 1) % code.length
    draw()
  }, 1400)
  return { texture: tex, dispose: () => window.clearInterval(timer) }
}

/** Neon wall sign; the bright core blooms in post. */
export function createNeonTexture(text: string, color: string) {
  const W = 1024
  const H = 256
  const { canvas, ctx } = makeCanvas(W, H)
  const tex = toTexture(canvas)
  const draw = () => {
    ctx.clearRect(0, 0, W, H)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 150px ${MONO}`
    ctx.shadowColor = color
    ctx.shadowBlur = 40
    ctx.fillStyle = color
    ctx.fillText(text, W / 2, H / 2)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#ffffff'
    ctx.globalAlpha = 0.85
    ctx.font = `700 146px ${MONO}`
    ctx.fillText(text, W / 2, H / 2)
    ctx.globalAlpha = 1
    tex.needsUpdate = true
  }
  draw()
  document.fonts?.ready.then(draw)
  return tex
}

/** Night skyline seen through the window. */
export function createSkylineTexture() {
  const W = 512
  const H = 512
  const { canvas, ctx } = makeCanvas(W, H)
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#0b1030')
  sky.addColorStop(0.6, '#3b1d5e')
  sky.addColorStop(1, '#ff7a90')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % W, (i * 53) % 200, 2, 2)
  ctx.fillStyle = '#fde68a'
  ctx.beginPath()
  ctx.arc(390, 110, 34, 0, Math.PI * 2)
  ctx.fill()
  let x = 0
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  while (x < W) {
    const w = 40 + rand() * 60
    const h = 140 + rand() * 230
    ctx.fillStyle = `rgb(${18 + rand() * 12},${14 + rand() * 10},${40 + rand() * 20})`
    ctx.fillRect(x, H - h, w - 4, h)
    for (let wy = H - h + 12; wy < H - 8; wy += 16) {
      for (let wx = x + 6; wx < x + w - 12; wx += 12) {
        if (rand() > 0.55) {
          ctx.fillStyle = rand() > 0.8 ? '#7dd3fc' : '#fcd34d'
          ctx.fillRect(wx, wy, 5, 7)
        }
      }
    }
    x += w
  }
  return toTexture(canvas)
}

/** Dark oak floor planks. */
export function createFloorTexture() {
  const W = 1024
  const H = 1024
  const { canvas, ctx } = makeCanvas(W, H)
  const plank = 128
  let seed = 3
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let y = 0; y < H; y += plank) {
    let x = -rand() * 400
    while (x < W) {
      const len = 300 + rand() * 300
      const l = 14 + rand() * 6
      ctx.fillStyle = `hsl(260, 10%, ${l}%)`
      ctx.fillRect(x, y, len, plank)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      for (let g = 0; g < 6; g++) {
        ctx.beginPath()
        const gy = y + 10 + rand() * (plank - 20)
        ctx.moveTo(x, gy)
        ctx.bezierCurveTo(x + len / 3, gy + 6, x + (2 * len) / 3, gy - 6, x + len, gy)
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(x, y, 2, plank)
      x += len
    }
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, y, W, 2)
  }
  const tex = toTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 3)
  return tex
}

/** Desk mat with a subtle grid and logo. */
export function createDeskMatTexture() {
  const W = 1024
  const H = 352
  const { canvas, ctx } = makeCanvas(W, H)
  const tex = toTexture(canvas)
  const draw = () => {
    ctx.fillStyle = '#121220'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(124,108,255,0.12)'
    for (let x = 0; x < W; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y < H; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = `700 26px ${MONO}`
    ctx.fillText('>_ hoang.os', 36, H - 32)
    tex.needsUpdate = true
  }
  draw()
  document.fonts?.ready.then(draw)
  return tex
}
