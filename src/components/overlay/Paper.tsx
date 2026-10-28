import { useEffect, type ReactNode } from 'react'
import { focusOn, type DocId } from '@/lib/store'
import { education, experience, profile, projects, skills, stats } from '@/data/profile'

function Tag({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex rounded-full border px-2 py-0.5 font-mono text-[11px]"
      style={{ borderColor: color ? `${color}55` : 'rgb(0 0 0 / 0.12)', color: color ?? 'rgb(0 0 0 / 0.65)' }}
    >
      {children}
    </span>
  )
}

function H({ children }: { children: ReactNode }) {
  return <h3 className="mt-7 mb-3 text-xs font-bold tracking-[0.18em] text-[#7C6CFF] uppercase">{children}</h3>
}

function ResumeDoc() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{profile.name}</h2>
          <p className="mt-1 text-[#7C6CFF]">
            {profile.role} · {profile.stack}
          </p>
        </div>
        <a href="/resume" className="font-mono text-xs underline underline-offset-4 opacity-70 hover:opacity-100">
          plain version ↗
        </a>
      </div>
      <p className="mt-4 leading-relaxed text-black/75">{profile.summary}</p>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-[#7C6CFF]/8 p-3">
            <div className="text-lg font-bold">{s.value}</div>
            <div className="text-[11px] leading-tight text-black/60">{s.label}</div>
          </div>
        ))}
      </div>

      <H>Experience</H>
      <div className="space-y-6">
        {experience.map((job) => (
          <div key={job.company}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-semibold">
                {job.company} <span className="font-normal text-black/55">· {job.role}</span>
              </div>
              <div className="font-mono text-xs text-black/50">{job.period}</div>
            </div>
            <div className="text-sm text-black/60">{job.product}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-black/75 marker:text-[#FF6B8B]">
              {job.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <H>Skills</H>
      <div className="space-y-2">
        {Object.entries(skills).map(([group, list]) => (
          <div key={group} className="flex flex-wrap items-center gap-1.5">
            <span className="w-32 shrink-0 text-xs font-semibold text-black/55">{group}</span>
            {list.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </div>
        ))}
      </div>

      <H>Education</H>
      <p className="text-sm">
        <span className="font-semibold">{education.school}</span> — {education.degree}{' '}
        <span className="font-mono text-xs text-black/50">{education.period}</span>
      </p>
    </>
  )
}

function ProjectsDoc() {
  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight">Case studies</h2>
      <p className="mt-1 text-black/60">
        Built with Claude Code as a pair programmer — I own scope, architecture, specs and review. Each ships with unit tests,
        Playwright E2E and CI.
      </p>
      <div className="mt-6 space-y-5">
        {projects.map((p) => (
          <article key={p.id} className="rounded-2xl border border-black/8 bg-white/70 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold" style={{ color: p.color }}>
                  {p.name}
                </h3>
                <p className="text-sm text-black/65">{p.tagline}</p>
              </div>
              <div className="rounded-xl px-3 py-2 text-right" style={{ background: `${p.color}14` }}>
                <div className="text-lg leading-none font-bold" style={{ color: p.color }}>
                  {p.metric.value}
                </div>
                <div className="mt-1 text-[11px] text-black/55">{p.metric.label}</div>
              </div>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-black/75">
              {p.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {p.stack.map((s) => (
                <Tag key={s} color={p.color}>
                  {s}
                </Tag>
              ))}
              <span className="ml-auto flex gap-3 font-mono text-xs">
                {p.demo && (
                  <a href={p.demo} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    demo ↗
                  </a>
                )}
                <a href={p.repo} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  code ↗
                </a>
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function ContactDoc() {
  const rows = [
    ['email', profile.email, `mailto:${profile.email}`],
    ['github', `github.com/${profile.handle}`, profile.github],
    ['linkedin', `linkedin.com/in/${profile.handle}`, profile.linkedin],
    ['based in', profile.location, ''],
  ]
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#1d1b2e] to-[#3b2f73] p-7 text-white">
      <div className="flex items-center gap-2 text-xs text-emerald-300">
        <span className="size-2 rounded-full bg-emerald-400" /> open to interesting work
      </div>
      <h2 className="mt-3 text-3xl font-bold">{profile.name}</h2>
      <p className="text-violet-300">{profile.role}</p>
      <dl className="mt-6 space-y-3 font-mono text-sm">
        {rows.map(([k, v, href]) => (
          <div key={k} className="flex gap-4">
            <dt className="w-20 text-white/45">{k}</dt>
            <dd>
              {href ? (
                <a href={href} target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-4 hover:decoration-white">
                  {v}
                </a>
              ) : (
                v
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function NoteDoc() {
  return (
    <div className="-rotate-1 bg-[#FFE066] p-7 text-[#4a3b00] shadow-xl">
      <p className="font-mono text-xs opacity-70">note to self</p>
      <p className="mt-3 text-2xl font-bold">Next goal: full-stack → solution architect.</p>
      <p className="mt-3 text-sm leading-relaxed">
        Frontend is home. Ticket2h (Spring Boot, Kafka, PostgreSQL) is where I practise the other half: service boundaries,
        events, contracts generated from OpenAPI.
      </p>
    </div>
  )
}

const DOCS: Record<DocId, { node: ReactNode; width: string; plain?: boolean }> = {
  resume: { node: <ResumeDoc />, width: 'max-w-3xl' },
  projects: { node: <ProjectsDoc />, width: 'max-w-3xl' },
  contact: { node: <ContactDoc />, width: 'max-w-lg', plain: true },
  note: { node: <NoteDoc />, width: 'max-w-sm', plain: true },
}

export function Paper({ id }: { id: DocId }) {
  const close = () => focusOn(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const doc = DOCS[id]
  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-[#07060d]/55 backdrop-blur-[3px]" onClick={close}>
      <div className="flex min-h-full items-start justify-center px-4 py-16 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          className={`anim-rise relative w-full ${doc.width} ${doc.plain ? '' : 'paper rounded-md p-7 sm:p-10'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {doc.node}
          <button
            onClick={close}
            className="absolute -top-11 right-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium shadow-md hover:bg-white/90"
          >
            put it back <kbd className="ml-1 opacity-50">Esc</kbd>
          </button>
        </div>
      </div>
    </div>
  )
}
