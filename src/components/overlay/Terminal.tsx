import { useEffect, useRef, useState, type ReactNode } from 'react'
import { experience, profile, projects, skills, stats } from '@/data/profile'

export interface TerminalApi {
  openProject: (id: string) => void
  openApp: (id: string) => void
  exit: () => void
}

type Line = { id: number; node: ReactNode }

const PROMPT = (
  <span>
    <span className="text-emerald-300">{profile.handle}</span>
    <span className="text-white/40">@</span>
    <span className="text-violet-300">hoang.os</span>
    <span className="text-white/40"> ~ $ </span>
  </span>
)

const FILES: Record<string, string> = {
  'about.txt': profile.summary,
  'goal.txt': profile.goal,
  'contact.txt': `${profile.email}\n${profile.github}\n${profile.linkedin}`,
}

const COMMANDS = ['help', 'whoami', 'neofetch', 'ls', 'cat', 'projects', 'open', 'git', 'skills', 'stats', 'contact', 'clear', 'date', 'echo', 'sudo', 'exit']

function Neofetch() {
  const art = String.raw`
   _   _
  | | | |
  | |_| |
  |  _  |
  |_| |_|
   h.os  `
  const rows: [string, string][] = [
    ['OS', 'hoang.os 2026 (React Three Fiber kernel)'],
    ['Role', `${profile.role} @ Stringee`],
    ['Uptime', `${profile.years} years in production`],
    ['Shell', 'TypeScript, strict mode'],
    ['UI', 'momi-ui · Tailwind v4 · Radix'],
    ['Tests', '300+ files · 1,021 green in CI'],
    ['Pair', 'Claude Code + MCP'],
  ]
  return (
    <div className="flex flex-wrap gap-6">
      <pre className="text-violet-300">{art}</pre>
      <div className="space-y-0.5">
        <div className="text-emerald-300">
          {profile.handle}@hoang.os
        </div>
        <div className="text-white/30">-------------------</div>
        {rows.map(([k, v]) => (
          <div key={k}>
            <span className="text-pink-300">{k}</span>: {v}
          </div>
        ))}
        <div className="mt-1 flex gap-1">
          {['#7C6CFF', '#FF6B8B', '#2BB89A', '#FFB020', '#3E8BFF', '#ffffff'].map((c) => (
            <span key={c} className="h-3 w-5" style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function Terminal({ api }: { api: TerminalApi }) {
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const history = useRef<string[]>([])
  const cursor = useRef(-1)
  const seq = useRef(0)
  const scroller = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const print = (...nodes: ReactNode[]) =>
    setLines((ls) => [...ls, ...nodes.map((node) => ({ id: seq.current++, node }))])

  useEffect(() => {
    print(
      <span className="text-white/50">hoang.os v2026.10 — type <b className="text-white">help</b> to see what I can do.</span>,
      <span className="text-white/50">tip: try <b className="text-white">neofetch</b>, <b className="text-white">git log</b> or <b className="text-white">open budkin</b></span>,
    )
  }, [])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [lines])

  const run = (raw: string) => {
    const cmd = raw.trim()
    print(
      <span>
        {PROMPT}
        {cmd}
      </span>,
    )
    if (!cmd) return
    history.current.unshift(cmd)
    cursor.current = -1
    const [name, ...args] = cmd.split(/\s+/)
    const arg = args.join(' ')

    switch (name.toLowerCase()) {
      case 'help':
        print(
          <div className="grid grid-cols-[9rem_1fr] gap-x-4 text-white/80">
            {[
              ['whoami', 'who is behind this desk'],
              ['neofetch', 'system info, dev edition'],
              ['ls / cat <file>', 'read files'],
              ['projects', 'list side projects'],
              ['open <project>', 'open a project window'],
              ['git log', 'career history'],
              ['skills', 'tech stack'],
              ['stats', 'numbers I am proud of'],
              ['contact', 'how to reach me'],
              ['clear', 'clear the screen'],
              ['exit', 'back to the desk'],
            ].map(([c, d]) => (
              <div key={c} className="contents">
                <span className="text-emerald-300">{c}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>,
        )
        break
      case 'whoami':
        print(
          <span>
            <b className="text-white">{profile.name}</b> — {profile.role} ({profile.stack}), {profile.location}.
          </span>,
          <span className="text-white/70">{profile.summary}</span>,
        )
        break
      case 'neofetch':
        print(<Neofetch />)
        break
      case 'ls':
        print(
          <span className="space-x-4">
            {Object.keys(FILES).map((f) => (
              <span key={f}>{f}</span>
            ))}
            <span className="text-violet-300">projects/</span>
          </span>,
        )
        break
      case 'cat': {
        if (arg.startsWith('projects')) {
          print(<span className="text-white/70">cat: projects/: is a directory — try `projects`</span>)
          break
        }
        const content = FILES[arg]
        print(
          content ? (
            <span className="whitespace-pre-wrap text-white/85">{content}</span>
          ) : (
            <span className="text-pink-300">cat: {arg || '<file>'}: no such file. try `ls`</span>
          ),
        )
        break
      }
      case 'projects':
        print(
          <div className="space-y-0.5">
            {projects.map((p) => (
              <div key={p.id}>
                <span style={{ color: p.color }} className="inline-block w-24">
                  {p.id}
                </span>
                <span className="text-white/75">{p.tagline}</span>
              </div>
            ))}
            <div className="text-white/45">→ open &lt;id&gt;</div>
          </div>,
        )
        break
      case 'open': {
        const p = projects.find((x) => x.id === arg.toLowerCase() || x.name.toLowerCase() === arg.toLowerCase())
        if (p) {
          print(<span className="text-white/60">opening {p.name}…</span>)
          api.openProject(p.id)
        } else if (['about', 'mail', 'projects'].includes(arg)) {
          api.openApp(arg)
        } else print(<span className="text-pink-300">open: unknown project "{arg}". try `projects`</span>)
        break
      }
      case 'git':
        if (args[0] !== 'log') {
          print(<span className="text-white/70">only `git log` is wired up here 🙂</span>)
          break
        }
        print(
          <div className="space-y-3">
            {experience.map((j, i) => (
              <div key={j.hash}>
                <div>
                  <span className="text-amber-300">commit {j.hash}</span>
                  {i === 0 && <span className="text-emerald-300"> (HEAD -&gt; main)</span>}
                </div>
                <div className="text-white/55">Date: {j.period}</div>
                <div className="pl-4">
                  <b className="text-white">
                    {j.role} @ {j.company}
                  </b>{' '}
                  <span className="text-white/60">— {j.product}</span>
                </div>
                {j.points.slice(0, 3).map((p) => (
                  <div key={p} className="pl-4 text-white/70">
                    + {p}
                  </div>
                ))}
              </div>
            ))}
          </div>,
        )
        break
      case 'skills':
        print(
          <div className="space-y-1">
            {Object.entries(skills).map(([g, l]) => (
              <div key={g}>
                <span className="inline-block w-36 text-violet-300">{g}</span>
                <span className="text-white/80">{l.join(', ')}</span>
              </div>
            ))}
          </div>,
        )
        break
      case 'stats':
        print(
          <div className="space-y-0.5">
            {stats.map((s) => (
              <div key={s.label}>
                <span className="inline-block w-24 font-bold text-emerald-300">{s.value}</span>
                {s.label}
              </div>
            ))}
          </div>,
        )
        break
      case 'contact':
        print(<span className="whitespace-pre-wrap">{FILES['contact.txt']}</span>)
        break
      case 'date':
        print(<span>{new Date().toString()}</span>)
        break
      case 'echo':
        print(<span>{arg}</span>)
        break
      case 'sudo':
        print(
          arg.replace(/\s/g, '') === 'hire-me' || arg === 'hire hoang' ? (
            <span className="text-emerald-300">
              [sudo] permission granted ✓ — sending you to {profile.email} …
            </span>
          ) : (
            <span className="text-pink-300">
              {profile.handle} is not in the sudoers file. This incident will be reported. (try `sudo hire-me`)
            </span>
          ),
        )
        if (arg.replace(/\s/g, '') === 'hire-me' || arg === 'hire hoang') {
          setTimeout(() => api.openApp('mail'), 600)
        }
        break
      case 'rm':
        print(<span className="text-pink-300">nice try. this desk is covered by 1,021 tests.</span>)
        break
      case 'clear':
        setLines([])
        break
      case 'exit':
        api.exit()
        break
      default:
        print(<span className="text-pink-300">command not found: {name}. type `help`</span>)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(cursor.current + 1, history.current.length - 1)
      if (next >= 0) {
        cursor.current = next
        setInput(history.current[next])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      cursor.current = Math.max(cursor.current - 1, -1)
      setInput(cursor.current === -1 ? '' : history.current[cursor.current])
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const match = COMMANDS.find((c) => c.startsWith(input.trim()))
      if (match && input.trim()) setInput(match + ' ')
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  return (
    <div
      ref={scroller}
      className="h-full overflow-y-auto bg-[#141226] p-4 font-mono text-[13px] leading-relaxed text-white/90"
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((l) => (
        <div key={l.id} className="mb-1 break-words">
          {l.node}
        </div>
      ))}
      <label className="flex items-center">
        {PROMPT}
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal input"
          className="ml-1 flex-1 bg-transparent caret-emerald-300 outline-none"
        />
      </label>
    </div>
  )
}
