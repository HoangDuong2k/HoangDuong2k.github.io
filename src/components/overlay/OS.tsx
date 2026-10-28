import { useEffect, useRef, useState, type ReactNode } from 'react'
import { focusOn } from '@/lib/store'
import { profile, projects, stats } from '@/data/profile'
import { Terminal } from './Terminal'

type AppId = 'terminal' | 'projects' | 'about' | 'mail'

interface Win {
  id: AppId
  x: number
  y: number
  z: number
  min?: boolean
  max?: boolean
}

const APPS: Record<AppId, { title: string; color: string; glyph: string; w: number; h: number }> = {
  terminal: { title: 'Terminal', color: '#1d1b2e', glyph: '>_', w: 680, h: 440 },
  projects: { title: 'Projects', color: '#FF6B8B', glyph: '◆', w: 760, h: 500 },
  about: { title: 'About me', color: '#7C6CFF', glyph: '☺', w: 520, h: 440 },
  mail: { title: 'Mail', color: '#3E8BFF', glyph: '✉', w: 480, h: 360 },
}

function AppIcon({ id, size = 'md' }: { id: AppId; size?: 'md' | 'lg' }) {
  const a = APPS[id]
  const cls = size === 'lg' ? 'size-14 text-xl' : 'size-11 text-base'
  return (
    <span
      className={`${cls} grid place-items-center rounded-2xl font-mono font-bold text-white shadow-lg ring-1 ring-white/20`}
      style={{ background: `linear-gradient(145deg, ${a.color}, ${a.color}cc)` }}
    >
      {a.glyph}
    </span>
  )
}

/* ---------------------------------------------------------------------------------------------- */

function ProjectsApp({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const p = projects.find((x) => x.id === selected) ?? projects[0]
  return (
    <div className="flex h-full bg-white text-[#1d1b2e]">
      <aside className="w-44 shrink-0 space-y-0.5 border-r border-black/8 bg-[#f6f4fb] p-2">
        {projects.map((x) => (
          <button
            key={x.id}
            onClick={() => onSelect(x.id)}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${x.id === p.id ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
          >
            <span className="size-2.5 rounded-full" style={{ background: x.color }} />
            {x.name}
          </button>
        ))}
      </aside>
      <div key={p.id} className="anim-rise flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: p.color }}>
              {p.name}
            </h2>
            <p className="text-sm text-black/60">{p.tagline}</p>
          </div>
          <div className="rounded-xl px-3 py-2 text-right" style={{ background: `${p.color}18` }}>
            <div className="text-xl leading-none font-bold" style={{ color: p.color }}>
              {p.metric.value}
            </div>
            <div className="mt-1 text-[11px] text-black/55">{p.metric.label}</div>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-black/75">
          {p.highlights.map((h) => (
            <li key={h} className="flex gap-2">
              <span style={{ color: p.color }}>▸</span>
              {h}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.stack.map((s) => (
            <span key={s} className="rounded-full px-2 py-0.5 font-mono text-[11px]" style={{ background: `${p.color}14`, color: p.color }}>
              {s}
            </span>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          {p.demo && (
            <a href={p.demo} target="_blank" rel="noreferrer" className="rounded-full px-4 py-1.5 text-sm font-medium text-white" style={{ background: p.color }}>
              Live demo ↗
            </a>
          )}
          <a href={p.repo} target="_blank" rel="noreferrer" className="rounded-full border border-black/15 px-4 py-1.5 text-sm font-medium">
            Source ↗
          </a>
        </div>
      </div>
    </div>
  )
}

function AboutApp() {
  return (
    <div className="h-full overflow-y-auto bg-white p-6 text-[#1d1b2e]">
      <div className="flex items-center gap-4">
        <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#7C6CFF] to-[#FF6B8B] text-2xl font-bold text-white">
          H
        </div>
        <div>
          <h2 className="text-xl font-bold">{profile.name}</h2>
          <p className="text-sm text-black/60">
            {profile.role} · {profile.stack}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-black/75">{profile.summary}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-[#7C6CFF]/8 p-3">
            <div className="font-bold">{s.value}</div>
            <div className="text-[11px] text-black/55">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-xl bg-[#FFE066]/50 p-3 text-sm">🎯 {profile.goal}</p>
    </div>
  )
}

function MailApp() {
  const [subject, setSubject] = useState("Let's work together")
  const [body, setBody] = useState('')
  const href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  return (
    <div className="flex h-full flex-col gap-2 bg-white p-4 text-sm text-[#1d1b2e]">
      <div className="flex gap-2 border-b border-black/8 pb-2">
        <span className="w-14 text-black/50">To</span>
        <span className="font-mono">{profile.email}</span>
      </div>
      <label className="flex gap-2 border-b border-black/8 pb-2">
        <span className="w-14 text-black/50">Subject</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 outline-none" />
      </label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Hi Hoàng, …"
        className="flex-1 resize-none rounded-lg bg-[#f6f4fb] p-3 outline-none"
      />
      <a href={href} className="self-end rounded-full bg-[#3E8BFF] px-4 py-1.5 font-medium text-white">
        Open in mail app ↗
      </a>
    </div>
  )
}

/* ---------------------------------------------------------------------------------------------- */

type WinAction = 'close' | 'minimize' | 'maximize'

function TrafficLight({ color, glyph, label, onClick }: { color: string; glyph: string; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      // 24px hit area around a 13px dot; the glyph shows on header hover like macOS
      className="grid size-6 cursor-pointer place-items-center rounded-full"
    >
      <span
        className="grid size-[13px] place-items-center rounded-full text-[10px] leading-none font-bold text-black/0 group-hover/head:text-black/55"
        style={{ background: color }}
      >
        {glyph}
      </span>
    </button>
  )
}

function Window({
  win,
  active,
  onFocus,
  onMove,
  onAction,
  children,
}: {
  win: Win
  active: boolean
  onFocus: () => void
  onMove: (x: number, y: number) => void
  onAction: (a: WinAction) => void
  children: ReactNode
}) {
  const app = APPS[win.id]
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const w = Math.min(app.w, window.innerWidth - 24)
  const h = Math.min(app.h, window.innerHeight - 140)
  const frame = win.max
    ? { left: 8, top: 40, width: window.innerWidth - 16, height: window.innerHeight - 124 }
    : { left: win.x, top: win.y, width: w, height: h }

  return (
    <section
      role="dialog"
      aria-label={app.title}
      onPointerDown={onFocus}
      aria-hidden={win.min || undefined}
      className={`anim-rise absolute ${win.min ? 'hidden' : 'flex'} flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 transition-[width,height,left,top] duration-200 ${active ? 'ring-white/40' : 'ring-black/20 brightness-95'}`}
      style={{ ...frame, zIndex: win.z, transitionDuration: drag.current ? '0ms' : undefined }}
    >
      <header
        className="group/head flex h-9 shrink-0 cursor-grab touch-none items-center gap-0.5 bg-[#ece9f5] px-1.5 select-none active:cursor-grabbing"
        onDoubleClick={() => onAction('maximize')}
        onPointerDown={(e) => {
          if (win.max) return
          drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          const x = Math.max(-w + 80, Math.min(window.innerWidth - 80, e.clientX - drag.current.dx))
          const y = Math.max(32, Math.min(window.innerHeight - 60, e.clientY - drag.current.dy))
          onMove(x, y)
        }}
        onPointerUp={(e) => {
          drag.current = null
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
        }}
      >
        <TrafficLight color="#ff5f57" glyph="×" label="Close" onClick={() => onAction('close')} />
        <TrafficLight color="#febc2e" glyph="–" label="Minimize" onClick={() => onAction('minimize')} />
        <TrafficLight color="#28c840" glyph="+" label={win.max ? 'Restore' : 'Maximize'} onClick={() => onAction('maximize')} />
        <span className="flex-1 pr-16 text-center text-xs font-medium text-black/60">{app.title}</span>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}

export function OS() {
  const [wins, setWins] = useState<Win[]>([])
  const [selected, setSelected] = useState(projects[0].id)
  const [clock, setClock] = useState(() => new Date())
  const z = useRef(10)

  const open = (id: AppId) =>
    setWins((ws) => {
      z.current++
      const existing = ws.find((w) => w.id === id)
      if (existing) return ws.map((w) => (w.id === id ? { ...w, z: z.current, min: false } : w))
      const n = ws.length
      const app = APPS[id]
      const x = Math.max(12, (window.innerWidth - Math.min(app.w, window.innerWidth - 24)) / 2 + n * 48 - 24)
      const y = Math.max(48, (window.innerHeight - app.h) / 2 - 30 + n * 36)
      return [...ws, { id, x, y, z: z.current }]
    })

  const exit = () => focusOn(null)

  useEffect(() => {
    open('terminal')
    const t = window.setInterval(() => setClock(new Date()), 15000)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearInterval(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const act = (id: AppId, a: WinAction) =>
    setWins((ws) => {
      if (a === 'close') return ws.filter((v) => v.id !== id)
      if (a === 'minimize') return ws.map((v) => (v.id === id ? { ...v, min: true } : v))
      z.current++
      return ws.map((v) => (v.id === id ? { ...v, max: !v.max, z: z.current } : v))
    })

  const visible = wins.filter((w) => !w.min)
  const top = visible.reduce((m, w) => Math.max(m, w.z), 0)
  const order: AppId[] = ['terminal', 'projects', 'about', 'mail']

  return (
    <div className="os-wallpaper anim-power fixed inset-0 z-30 overflow-hidden font-sans text-white">
      {/* Menu bar */}
      <div className="absolute inset-x-0 top-0 z-[1000] flex h-8 items-center gap-4 bg-black/25 px-4 text-xs backdrop-blur-md">
        <span className="font-semibold">◐ hoang.os</span>
        <span className="hidden text-white/70 sm:inline">{visible.find((w) => w.z === top) ? APPS[visible.find((w) => w.z === top)!.id].title : 'Desktop'}</span>
        <span className="ml-auto text-white/80">{clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
        <button onClick={exit} className="rounded-full bg-white/15 px-3 py-0.5 hover:bg-white/25">
          ← back to desk <kbd className="opacity-60">Esc</kbd>
        </button>
      </div>

      {/* Desktop icons */}
      <div className="absolute top-12 left-4 grid gap-4">
        {order.map((id) => (
          <button key={id} onDoubleClick={() => open(id)} onClick={() => open(id)} className="flex w-20 flex-col items-center gap-1.5 rounded-lg p-1 text-[11px] hover:bg-white/10">
            <AppIcon id={id} size="lg" />
            <span className="drop-shadow">{APPS[id].title}</span>
          </button>
        ))}
      </div>

      {wins.map((w) => (
        <Window
          key={w.id}
          win={w}
          active={w.z === top}
          onFocus={() => w.z !== top && open(w.id)}
          onMove={(x, y) => setWins((ws) => ws.map((v) => (v.id === w.id ? { ...v, x, y } : v)))}
          onAction={(a) => act(w.id, a)}
        >
          {w.id === 'terminal' && (
            <Terminal
              api={{
                openProject: (id) => {
                  setSelected(id)
                  open('projects')
                },
                openApp: (id) => open(id as AppId),
                exit,
              }}
            />
          )}
          {w.id === 'projects' && <ProjectsApp selected={selected} onSelect={setSelected} />}
          {w.id === 'about' && <AboutApp />}
          {w.id === 'mail' && <MailApp />}
        </Window>
      ))}

      {/* Dock */}
      <nav className="absolute bottom-3 left-1/2 z-[1000] flex -translate-x-1/2 gap-2 rounded-3xl bg-white/15 p-2 ring-1 ring-white/20 backdrop-blur-xl">
        {order.map((id) => (
          <button key={id} onClick={() => open(id)} title={APPS[id].title} className="relative transition-transform hover:-translate-y-1.5 hover:scale-110">
            <AppIcon id={id} />
            {wins.some((w) => w.id === id) && <span className="absolute -bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-white" />}
          </button>
        ))}
      </nav>
    </div>
  )
}
