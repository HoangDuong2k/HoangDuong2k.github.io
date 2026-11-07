// Single source of truth for every surface: desk documents, OS apps, terminal and /resume.

export const profile = {
  name: 'Dương Việt Hoàng',
  nameAscii: 'Duong Viet Hoang',
  handle: 'hoangduong2k',
  role: 'Software Developer',
  stack: 'PHP · Laravel · React · TypeScript',
  location: 'Hanoi, Vietnam',
  email: 'hoangblack2000@gmail.com',
  github: 'https://github.com/HoangDuong2k',
  linkedin: 'https://linkedin.com/in/hoangduong2k',
  years: 3,
  summary:
    'Software developer with 3 years of experience building web applications with PHP/Laravel and React/TypeScript. I own features end to end on a multi-tenant SaaS platform, from APIs and third-party integrations to UI, tests and release. I use AI coding tools daily and review every change they produce.',
  goal: 'Keep owning features end to end, and grow into designing the systems around them: solution architecture.',
}

export const skills: Record<string, string[]> = {
  Languages: ['PHP', 'TypeScript', 'JavaScript', 'SQL', 'HTML', 'CSS'],
  Backend: ['Laravel', 'REST API', 'Moodle', 'PHPUnit'],
  Frontend: ['React', 'Next.js', 'Vue/Nuxt', 'Tailwind CSS', 'Redux Toolkit', 'TanStack Query'],
  Database: ['MySQL', 'PostgreSQL', 'MongoDB', 'Elasticsearch', 'Redis', 'Kafka'],
  'DevOps & Testing': ['Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions', 'Vitest', 'Playwright'],
  AI: ['RAG', 'MCP servers', 'Claude Code'],
  'Foreign language': ['English (professional working proficiency)'],
}

export interface Job {
  company: string
  product: string
  role: string
  period: string
  hash: string
  stack: string[]
  points: string[]
}

export const experience: Job[] = [
  {
    company: 'Stringee',
    product: 'Cogover low-code CRM · Hanoi, Vietnam',
    role: 'Software Developer',
    period: '10/2025 – now',
    hash: 'a1f9c3e',
    stack: ['PHP 8', 'Laravel 11', 'React 18', 'TypeScript', 'MySQL', 'Elasticsearch', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'Jenkins'],
    points: [
      'Own 4 production modules of a multi-tenant SaaS platform (SLA, OKR/KPI, AI knowledge base, Zalo/WhatsApp messaging), from requirements to production.',
      'Build Laravel REST APIs (validation, API Resources, Eloquent) and integrate the Zalo and WhatsApp Business APIs; write Artisan commands for data migration.',
      'Build real-time UIs over WebSocket (SLA countdowns, call-center supervision) and large data lists with cursor-based pagination.',
      "Contribute to the shared React component library used by ~10 micro-frontends; re-architect the Form Builder's rule engine.",
      'Extend the Next.js marketing website, blog and docs with the team (server rendering, SEO).',
      'Add PHPUnit tests and 300+ frontend test files, raising commits shipped with tests from ~5% to ~56%; deliver 200+ tickets.',
      'Investigate production issues using request-ID logs and tracing.',
    ],
  },
  {
    company: 'Digital Transformation Center, HUST',
    product: 'Hanoi University of Science and Technology · Hanoi, Vietnam',
    role: 'Web Developer',
    period: '10/2023 – 09/2025',
    hash: '7be20d4',
    stack: ['PHP', 'Laravel', 'Moodle', 'MySQL', 'PostgreSQL', 'React', 'Next.js', 'Nuxt.js', 'TypeScript', 'Docker'],
    points: [
      'Upgraded the university LMS from Moodle 3.8 to 4.5 (PHP 7.4 to 8.1); built a custom PHP theme from Figma designs and a web-service plugin for a Next.js admin system.',
      'Built the Laravel backend and Nuxt/React frontends for dormitory and training-center systems, with FPT and BIDV payment gateways (signed IPN callbacks, reconciliation, queued emails).',
      'Built the Next.js frontend of an AI research-assistant (RAG) platform: paper search, chat with cited answers, personal library; co-designed the PostgreSQL schema (23 tables); deployed with Docker Compose.',
      'Built a facility management system with React, JWT/OAuth2 and role-based access; gathered requirements with stakeholders.',
    ],
  },
]

export const education = {
  school: 'Hanoi University of Science and Technology',
  degree: "Engineer's degree, Control & Automation",
  period: '2018 – 2023',
}

export interface Project {
  id: string
  name: string
  tagline: string
  color: string
  stack: string[]
  highlights: string[]
  metric: { value: string; label: string }
  demo?: string
  repo: string
}

export const projects: Project[] = [
  {
    id: 'budkin',
    name: 'Budkin',
    tagline: '3D desktop task manager with an MCP server that lets Claude manage tasks',
    color: '#7C6CFF',
    stack: ['Electron', 'React 19', 'React Three Fiber', 'MCP SDK', 'SQLite'],
    highlights: [
      'MCP server so Claude Desktop / Claude Code manage tasks in natural language: all-or-nothing bulk edits, 3 permission levels, 15-minute undo for every AI change.',
      '3D desk with a DOM layer pinned to the monitor for crisp text and Vietnamese IME, plus a 2D SVG fallback without a GPU.',
      'Performance budgets enforced by scripts: ≤ 90 draw calls per frame, idle CPU < 2%.',
    ],
    metric: { value: '≤ 90', label: 'draw calls / frame' },
    demo: 'https://hoangduong2k.github.io/Budkin',
    repo: 'https://github.com/HoangDuong2k/Budkin',
  },
  {
    id: 'mpv',
    name: 'Playlist Video Maker',
    tagline: 'Video editor with parallel export and on-device AI lyric sync',
    color: '#FF6B8B',
    stack: ['Electron', 'Web Audio API', 'FFmpeg', 'Skia', 'Whisper + ONNX'],
    highlights: [
      'Deterministic renderer: every frame is a pure function of (project, time), shared by preview and export.',
      'Parallel export across up to 8 resumable workers, ~3× real time at 1080p30.',
      'On-device lyric sync: Whisper transcribes, a DP aligner with a Vietnamese phonetic key matches lines. 89–94% of confident lines land within 0.3 s.',
    ],
    metric: { value: '~3×', label: 'real-time export' },
    demo: 'https://hoangduong2k.github.io/mpv-creator',
    repo: 'https://github.com/HoangDuong2k/mpv-creator',
  },
  {
    id: 'momi',
    name: 'momi-ui',
    tagline: 'React library of ~60 accessible components, shipped with an Agent Skill — this site uses it',
    color: '#2BB89A',
    stack: ['React 19', 'Tailwind v4', 'Radix UI', 'TanStack Virtual'],
    highlights: [
      '~60 accessible components (virtualized DataTable, drag-and-drop calendar, Kanban, Combobox) and 15 landing blocks.',
      'Ships an Agent Skill in the package (npx momi-ui link-skill) so coding agents compose screens from the installed version.',
      'One API contract everywhere: variant / tone / size, controlled + uncontrolled, ARIA wired by FormField.',
    ],
    metric: { value: '~60', label: 'components' },
    demo: 'https://hoangduong2k.github.io/momi-ui',
    repo: 'https://github.com/HoangDuong2k/momi-ui',
  },
]
