import { Suspense, lazy, useEffect, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  useCommandShortcut,
} from 'momi-ui'
import { focusOn, setState, useStore, type Focus } from '@/lib/store'
import { profile, projects } from '@/data/profile'
import { detectTier } from '@/lib/quality'

// three.js is the heavy part of the bundle: the HUD and boot
// screen paint first, the scene streams in behind them. Overlays load on demand.
const Scene = lazy(() => import('./scene/Scene').then((m) => ({ default: m.Scene })))
const Paper = lazy(() => import('./overlay/Paper').then((m) => ({ default: m.Paper })))
const OS = lazy(() => import('./overlay/OS').then((m) => ({ default: m.OS })))

function Loaded({ onLoad }: { onLoad: () => void }) {
  useEffect(onLoad, [onLoad])
  return null
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    const ctx = c.getContext('webgl2') || c.getContext('webgl')
    // Release the probe right away: browsers cap live contexts (~16) and a leaked
    // one per page load eventually makes this check fail on reloads.
    ctx?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!ctx
  } catch {
    return false
  }
}

function Boot({ done }: { done: boolean }) {
  const lines = ['mounting /desk', 'loading coffee.mug', 'compiling personality.ts', 'all 1,021 tests passed ✓']
  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center bg-[#1d1b2e] font-mono text-sm text-white transition-opacity duration-700 ${done ? 'pointer-events-none opacity-0' : ''}`}
    >
      <div className="w-72 space-y-1.5">
        {lines.map((l, i) => (
          <div key={l} className="anim-rise" style={{ animationDelay: `${i * 160}ms` }}>
            <span className="text-emerald-300">›</span> {l}
          </div>
        ))}
      </div>
    </div>
  )
}

function Hud() {
  const focus = useStore((s) => s.focus)
  const idle = focus === null
  return (
    <div className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-500 ${idle ? '' : 'opacity-0'}`}>
      <header className="flex items-start justify-between gap-4 p-5 sm:p-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{profile.name}</h1>
          <p className="mt-0.5 text-sm text-white/55">
            {profile.role} · {profile.stack}
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setState({ paletteOpen: true })}
            className="hidden rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur hover:bg-white/20 sm:inline-flex"
          >
            Jump to… <kbd className="ml-2 font-mono opacity-50">Ctrl K</kbd>
          </button>
          <a href="/resume" className="whitespace-nowrap rounded-full bg-violet-500 px-3 py-1.5 text-xs font-medium text-white shadow-[0_0_24px_-4px] shadow-violet-500 hover:bg-violet-400">
            Recruiter mode
          </a>
        </div>
      </header>
      <footer className="absolute inset-x-0 bottom-0 flex justify-center p-5">
        <div className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/60 ring-1 ring-white/10 backdrop-blur">
          <b className="text-white/90">Drag</b> to look around · <b className="text-white/90">Click</b> the screen or a document
        </div>
      </footer>
    </div>
  )
}

function Palette() {
  const open = useStore((s) => s.paletteOpen)
  const setOpen = (v: boolean) => setState({ paletteOpen: v })
  useCommandShortcut(() => setOpen(!open))
  const go = (f: Focus) => {
    setOpen(false)
    focusOn(f)
  }
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Where to?" />
      <CommandList>
        <CommandEmpty>Nothing on this desk matches.</CommandEmpty>
        <CommandGroup heading="On the desk">
          <CommandItem onSelect={() => go('computer')} keywords={['os', 'terminal', 'computer']}>
            Log in to hoang.os<CommandShortcut>computer</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('resume')} keywords={['cv', 'experience']}>
            Read the resume<CommandShortcut>paper</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('projects')} keywords={projects.map((p) => p.name)}>
            Open the projects folder<CommandShortcut>folder</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('contact')} keywords={['email', 'hire']}>
            Pick up the business card<CommandShortcut>contact</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go(null)} keywords={['home', 'reset']}>
            Back to the overview
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Elsewhere">
          <CommandItem onSelect={() => (window.location.href = '/resume')}>Recruiter mode (plain page)</CommandItem>
          <CommandItem onSelect={() => window.open(profile.github, '_blank')}>GitHub ↗</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export default function App() {
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [booted, setBooted] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [lockedTier, setLockedTier] = useState(false)
  const focus = useStore((s) => s.focus)
  const arrived = useStore((s) => s.arrived)

  useEffect(() => {
    const ok = hasWebGL()
    if (ok) {
      setState({ tier: detectTier() })
      setLockedTier(new URLSearchParams(window.location.search).has('quality'))
    }
    setWebgl(ok)
    if (!ok) window.location.replace('/resume?nowebgl')
    // Warm the overlay chunks while the visitor looks around.
    const idle = window.setTimeout(() => {
      void import('./overlay/OS')
      void import('./overlay/Paper')
    }, 3000)
    const t = window.setTimeout(() => setBooted(true), 1100)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(idle)
    }
  }, [])

  if (webgl === false) return null

  return (
    <>
      <div className="fixed inset-0">
        {webgl && (
          <Suspense fallback={null}>
            <Scene lockedTier={lockedTier} />
            <Loaded onLoad={() => setSceneReady(true)} />
          </Suspense>
        )}
      </div>
      <Hud />
      <Suspense fallback={null}>
        {arrived && focus === 'computer' && <OS />}
        {arrived && focus && focus !== 'computer' && <Paper id={focus} />}
      </Suspense>
      <Palette />
      <Boot done={booted && sceneReady} />
    </>
  )
}
