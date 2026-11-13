import * as THREE from 'three'

/**
 * Procedural surface detail: fur strands, leather grain, fabric weave, wood, perforated metal.
 * Everything is painted on a canvas once at start-up, so the site downloads no image files.
 * Height fields become normal maps (Sobel), which is where most of the "real material" look comes from.
 */

let seed = 1
function rand() {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}
function reseed(s: number) {
  seed = s
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { c, ctx: c.getContext('2d', { willReadFrequently: true })! }
}

function finish(c: HTMLCanvasElement, { color = false, repeat = [1, 1] as [number, number] } = {}) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat[0], repeat[1])
  t.anisotropy = 8
  return t
}

/** Height canvas (grey = height) to a tangent-space normal map. */
function toNormal(src: HTMLCanvasElement, strength: number, repeat: [number, number] = [1, 1]) {
  const w = src.width
  const h = src.height
  const sctx = src.getContext('2d', { willReadFrequently: true })!
  const hd = sctx.getImageData(0, 0, w, h).data
  const { c, ctx } = canvas(w, h)
  const out = ctx.createImageData(w, h)
  const H = (x: number, y: number) => hd[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (H(x + 1, y - 1) + 2 * H(x + 1, y) + H(x + 1, y + 1) - H(x - 1, y - 1) - 2 * H(x - 1, y) - H(x - 1, y + 1)) * strength
      const dy = (H(x - 1, y + 1) + 2 * H(x, y + 1) + H(x + 1, y + 1) - H(x - 1, y - 1) - 2 * H(x, y - 1) - H(x + 1, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * w + x) * 4
      out.data[i] = (-dx / len) * 127.5 + 127.5
      out.data[i + 1] = (dy / len) * 127.5 + 127.5
      out.data[i + 2] = (1 / len) * 127.5 + 127.5
      out.data[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  return finish(c, { repeat })
}

/** Fill a canvas with soft value noise: random cells, smoothed by scaling up. */
function noise(ctx: CanvasRenderingContext2D, w: number, h: number, cell: number, alpha: number) {
  const { c: small, ctx: s } = canvas(Math.max(1, Math.ceil(w / cell)), Math.max(1, Math.ceil(h / cell)))
  const img = s.createImageData(small.width, small.height)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rand() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  s.putImageData(img, 0, 0)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(small, 0, 0, w, h)
  ctx.restore()
}

const cache = new Map<string, unknown>()
function once<T>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key) as T
}

/* ---------------------------------------------------------------------------------------------- */

/**
 * PU leather for the chair. `channels` adds the horizontal quilted grooves of a racing-seat
 * centre panel; without it the map is plain grain (bolsters, armrests).
 */
export function getLeatherNormal(channels: boolean) {
  return once(`leather-${channels}`, () => {
    reseed(channels ? 21 : 22)
    const W = 512
    const H = 512
    const { c, ctx } = canvas(W, H)
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, W, H)
    noise(ctx, W, H, 3, 0.1)
    noise(ctx, W, H, 8, 0.08)
    if (channels) {
      const rows = 6
      for (let r = 0; r < rows; r++) {
        const y = (r + 0.5) * (H / rows)
        // Puffed cushion between grooves.
        const g = ctx.createLinearGradient(0, y - H / rows / 2, 0, y + H / rows / 2)
        g.addColorStop(0, 'rgba(0,0,0,0.55)')
        g.addColorStop(0.18, 'rgba(255,255,255,0.12)')
        g.addColorStop(0.5, 'rgba(255,255,255,0.3)')
        g.addColorStop(0.82, 'rgba(255,255,255,0.12)')
        g.addColorStop(1, 'rgba(0,0,0,0.55)')
        ctx.fillStyle = g
        ctx.fillRect(0, y - H / rows / 2, W, H / rows)
      }
    }
    return toNormal(c, channels ? 3 : 1.6)
  })
}

/** Leather colour: near-black with faint mottling, plus optional stitch rows in an accent colour. */
export function getLeatherColor(base: string, stitch: string | null, channels: boolean) {
  return once(`leather-col-${base}-${stitch}-${channels}`, () => {
    reseed(31)
    const W = 512
    const H = 512
    const { c, ctx } = canvas(W, H)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'soft-light'
    noise(ctx, W, H, 16, 0.08)
    ctx.globalCompositeOperation = 'source-over'
    if (stitch && channels) {
      ctx.strokeStyle = stitch
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 1.5
      ctx.setLineDash([7, 6])
      const rows = 6
      for (let r = 0; r <= rows; r++) {
        const y = r * (H / rows)
        for (const off of [-5, 5]) {
          ctx.beginPath()
          ctx.moveTo(0, y + off)
          ctx.lineTo(W, y + off)
          ctx.stroke()
        }
      }
    }
    return finish(c, { color: true })
  })
}

/** Woven fabric (curtains, rug): a fine over-under weave. */
export function getWeaveNormal(scale = 1) {
  return once(`weave-${scale}`, () => {
    reseed(41)
    const S = 256
    const { c, ctx } = canvas(S, S)
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, S, S)
    const n = 32
    const cell = S / n
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const over = (x + y) % 2 === 0
        const g = over
          ? ctx.createLinearGradient(x * cell, 0, x * cell + cell, 0)
          : ctx.createLinearGradient(0, y * cell, 0, y * cell + cell)
        g.addColorStop(0, '#404040')
        g.addColorStop(0.5, '#c8c8c8')
        g.addColorStop(1, '#404040')
        ctx.fillStyle = g
        ctx.fillRect(x * cell, y * cell, cell, cell)
      }
    }
    noise(ctx, S, S, 3, 0.15)
    return toNormal(c, 1.2 * scale)
  })
}

/** Long-pile rug: soft lumpy noise. */
export function getPileNormal() {
  return once('pile', () => {
    reseed(51)
    const S = 256
    const { c, ctx } = canvas(S, S)
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, S, S)
    noise(ctx, S, S, 1, 0.5)
    noise(ctx, S, S, 4, 0.3)
    return toNormal(c, 2.5)
  })
}

/** Wide oak planks: colour and normal from the same layout. */
export function getFloorMaps() {
  return once('floor', () => {
    reseed(61)
    const W = 1024
    const H = 1024
    const col = canvas(W, H)
    const hgt = canvas(W, H)
    const plank = 128
    hgt.ctx.fillStyle = '#909090'
    hgt.ctx.fillRect(0, 0, W, H)
    for (let y = 0; y < H; y += plank) {
      let x = -rand() * 400
      while (x < W) {
        const len = 340 + rand() * 360
        const l = 13 + rand() * 6
        const hue = 255 + rand() * 12
        col.ctx.fillStyle = `hsl(${hue}, 9%, ${l}%)`
        col.ctx.fillRect(x, y, len, plank)
        // Grain: long wavy lines in colour and a faint relief.
        for (let g = 0; g < 14; g++) {
          const gy = y + 6 + rand() * (plank - 12)
          const amp = 2 + rand() * 6
          const a = 0.02 + rand() * 0.05
          col.ctx.strokeStyle = rand() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 2})`
          col.ctx.lineWidth = 1 + rand() * 2
          col.ctx.beginPath()
          col.ctx.moveTo(x, gy)
          col.ctx.bezierCurveTo(x + len / 3, gy + amp, x + (2 * len) / 3, gy - amp, x + len, gy)
          col.ctx.stroke()
        }
        // A knot now and then.
        if (rand() > 0.7) {
          const kx = x + rand() * len
          const ky = y + plank / 2 + (rand() - 0.5) * plank * 0.5
          for (let r = 14; r > 2; r -= 3) {
            col.ctx.strokeStyle = 'rgba(0,0,0,0.08)'
            col.ctx.beginPath()
            col.ctx.ellipse(kx, ky, r * 2.2, r, 0, 0, Math.PI * 2)
            col.ctx.stroke()
          }
        }
        // Bevelled plank ends.
        col.ctx.fillStyle = 'rgba(0,0,0,0.55)'
        col.ctx.fillRect(x, y, 2, plank)
        hgt.ctx.fillStyle = '#202020'
        hgt.ctx.fillRect(x - 1, y, 3, plank)
        x += len
      }
      col.ctx.fillStyle = 'rgba(0,0,0,0.6)'
      col.ctx.fillRect(0, y, W, 2)
      hgt.ctx.fillStyle = '#202020'
      hgt.ctx.fillRect(0, y - 1, W, 3)
    }
    noise(hgt.ctx, W, H, 2, 0.08)
    const half = canvas(W / 2, H / 2)
    half.ctx.drawImage(hgt.c, 0, 0, W / 2, H / 2)
    return { map: finish(col.c, { color: true, repeat: [3, 3] }), normal: toNormal(half.c, 1.6, [3, 3]) }
  })
}

/** Perforated metal (PC front panel, speaker grilles): staggered round holes. Returns a normal map and an alpha-ish colour. */
export function getPerforatedMaps() {
  return once('perforated', () => {
    const S = 128
    const hgt = canvas(S, S)
    const col = canvas(S, S)
    hgt.ctx.fillStyle = '#b0b0b0'
    hgt.ctx.fillRect(0, 0, S, S)
    col.ctx.fillStyle = '#2a2a33'
    col.ctx.fillRect(0, 0, S, S)
    const step = 16
    for (let y = 0; y < S; y += step) {
      for (let x = 0; x < S; x += step) {
        const ox = (y / step) % 2 ? step / 2 : 0
        for (const [cx, cy] of [
          [x + ox, y],
          [x + ox - S, y],
        ]) {
          hgt.ctx.fillStyle = '#000'
          hgt.ctx.beginPath()
          hgt.ctx.arc(cx + step / 2, cy + step / 2, 5, 0, Math.PI * 2)
          hgt.ctx.fill()
          col.ctx.fillStyle = '#050508'
          col.ctx.beginPath()
          col.ctx.arc(cx + step / 2, cy + step / 2, 5, 0, Math.PI * 2)
          col.ctx.fill()
        }
      }
    }
    return { map: finish(col.c, { color: true }), normal: toNormal(hgt.c, 4) }
  })
}

/** Fine brushed metal (stand, chair base): streaks in one direction. */
export function getBrushedNormal() {
  return once('brushed', () => {
    reseed(71)
    const W = 256
    const H = 256
    const { c, ctx } = canvas(W, H)
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, W, H)
    for (let i = 0; i < 1400; i++) {
      const y = rand() * H
      ctx.strokeStyle = `rgba(${rand() > 0.5 ? '255,255,255' : '0,0,0'},${0.05 + rand() * 0.08})`
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y + (rand() - 0.5) * 2)
      ctx.stroke()
    }
    return toNormal(c, 0.8)
  })
}

/** Motherboard: dark PCB with traces, chips and slots, seen through the case glass. */
export function getPcbTexture() {
  return once('pcb', () => {
    reseed(81)
    const W = 512
    const H = 512
    const { c, ctx } = canvas(W, H)
    ctx.fillStyle = '#16161e'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(140,150,190,0.12)'
    ctx.lineWidth = 1.5
    for (let i = 0; i < 160; i++) {
      let x = rand() * W
      let y = rand() * H
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let s = 0; s < 4; s++) {
        if (rand() > 0.5) x += (rand() - 0.5) * 120
        else y += (rand() - 0.5) * 120
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    // Heatsinks, VRM block, chipset, slots.
    const block = (x: number, y: number, w: number, h: number, fill: string) => {
      ctx.fillStyle = fill
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
    }
    block(40, 30, 300, 40, '#2a2a34')
    block(30, 70, 40, 170, '#2a2a34')
    block(150, 120, 120, 120, '#20202a')
    block(380, 110, 18, 170, '#33333f')
    block(410, 110, 18, 170, '#33333f')
    block(440, 110, 18, 170, '#33333f')
    block(470, 110, 18, 170, '#33333f')
    block(60, 300, 380, 14, '#2e2e38')
    block(60, 400, 380, 10, '#2e2e38')
    block(330, 420, 120, 70, '#24242e')
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    for (let i = 0; i < 40; i++) ctx.fillRect(rand() * W, rand() * H, 4, 2)
    return finish(c, { color: true })
  })
}

/** Soft diagonal sheen for window glass, drawn additively. */
export function getGlassStreakTexture() {
  return once('glass', () => {
    const S = 256
    const { c, ctx } = canvas(S, S)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, S, S)
    for (const [x, w, a] of [
      [70, 46, 0.5],
      [130, 14, 0.35],
      [190, 30, 0.25],
    ]) {
      const g = ctx.createLinearGradient(x - w, 0, x + w, 0)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(0.5, `rgba(200,210,255,${a})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.save()
      ctx.translate(S / 2, S / 2)
      ctx.rotate(-0.6)
      ctx.translate(-S / 2, -S / 2)
      ctx.fillStyle = g
      ctx.fillRect(x - w - S, -S, w * 2, S * 3)
      ctx.restore()
    }
    const t = finish(c, { color: true })
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}
