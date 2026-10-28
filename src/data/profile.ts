// Single source of truth for every surface: desk documents, OS apps, terminal and /resume.

export const profile = {
  name: 'Dương Việt Hoàng',
  nameAscii: 'Duong Viet Hoang',
  handle: 'hoangduong2k',
  role: 'Frontend Developer',
  stack: 'React · TypeScript',
  location: 'Đại Từ, Hà Nội',
  email: 'hoangblack2000@gmail.com',
  github: 'https://github.com/HoangDuong2k',
  linkedin: 'https://linkedin.com/in/hoangduong2k',
  years: 3,
  summary:
    'Frontend Developer with 3 years of experience, including a year building a production micro-frontend low-code CRM with React and TypeScript. Sole frontend owner of four customer-facing modules, core contributor to a shared component library, and a strong advocate of automated testing. I also build open-source desktop apps and a React UI library, and work daily with AI coding agents.',
  goal: 'Growing from frontend into full-stack engineering, and longer term, solution architecture.',
}

export const stats = [
  { value: '300+', label: 'unit-test files added' },
  { value: '5% → 56%', label: 'UI-library commits with tests' },
  { value: '200+', label: 'tickets across 16 repos' },
  { value: '4', label: 'production modules owned' },
]

export const skills: Record<string, string[]> = {
  Languages: ['TypeScript', 'JavaScript (ES6+)', 'HTML5', 'CSS3/SASS'],
  Frontend: ['React 18/19', 'Next.js', 'Astro', 'Vue/Nuxt', 'Tailwind v4', 'Radix UI', 'Redux Toolkit', 'Zustand', 'TanStack Query', 'React Hook Form', 'Zod'],
  Architecture: ['Micro-frontends (Module Federation)', 'Design systems', 'Real-time UI (WebSocket)', 'Electron', 'Browser extensions (MV3)'],
  'Graphics & media': ['React Three Fiber', 'Web Audio API', 'Canvas/Skia', 'FFmpeg', 'Monaco Editor'],
  Testing: ['Vitest', 'React Testing Library', 'MSW', 'Playwright', 'GitHub Actions', 'Jenkins', 'Docker'],
  AI: ['Claude Code', 'Agent Skills', 'MCP servers', 'Whisper / ONNX Runtime', 'UI for AI features'],
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
    product: 'Cogover — low-code CRM & business platform',
    role: 'Frontend Developer',
    period: '10/2025 – now',
    hash: 'a1f9c3e',
    stack: ['React 18', 'TypeScript', 'Module Federation', 'Redux Toolkit', 'TanStack Query', 'WebSocket', 'Vitest + MSW'],
    points: [
      'Sole frontend owner of SLA Management, Goal Management (OKR/KPI), Data Library (knowledge base for AI Agents) and Zalo/WhatsApp template messaging.',
      'Core contributor to the shared UI library consumed by ~10 micro-frontends; re-architected the Form Builder Layout Rule engine with revision-tracked run state.',
      'Real-time call supervision: snapshot + delta sync over WebSocket with sequence numbers, tombstones and a reconciliation window.',
      'Live SLA countdowns pushed over WebSocket straight into the React Query cache.',
      'Schema-change safety: async field-type conversion with cross-app progress and impact analysis with deep links.',
      'Added 300+ unit-test files across 9 repos; UI-library commits shipping with tests went from ~5% to ~56%.',
    ],
  },
  {
    company: 'HUST Digital Transformation Center',
    product: 'University systems: LMS, facilities, dormitory',
    role: 'Frontend Developer',
    period: '10/2023 – 09/2025',
    hash: '7be20d4',
    stack: ['React', 'Next.js', 'Nuxt', 'Moodle/PHP', 'Tailwind', 'OAuth2'],
    points: [
      'Upgraded the university LMS from Moodle 3.8 to 4.5 with a custom theme, plus a Next.js admin system.',
      'Facility Management System: business processes with stakeholders, JWT/OAuth2, large tables tuned for scale.',
      'Dormitory & Medical Training Center: registration and online payments via FPT and BIDV gateways.',
    ],
  },
  {
    company: 'Viettel High Tech · Techvico',
    product: 'Internships',
    role: 'Intern',
    period: '05 – 07/2023',
    hash: '02c4a19',
    stack: ['C++', 'SQL', 'Visual SLAM'],
    points: ['Data structures, SQL and visual SLAM research.'],
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
    tagline: '3D desktop task manager that Claude can drive',
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
    tagline: 'Desktop editor for music-playlist videos',
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
    tagline: 'React component library — this site uses it',
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
  {
    id: 'pip',
    name: 'PiP Anywhere',
    tagline: 'Keep any browser window on top, and see-through',
    color: '#FFB020',
    stack: ['Browser extension', 'Native host', 'Windows', 'GNOME'],
    highlights: [
      'Picture-in-picture for a whole browser window: tabs, extensions and typing keep working.',
      'Real transparency (20–100%) with clear-on-hover, bridging what extensions cannot do through a native host.',
    ],
    metric: { value: '20–100%', label: 'real opacity' },
    repo: 'https://github.com/HoangDuong2k/pip-anywhere',
  },
  {
    id: 'ticket2h',
    name: 'Ticket2h',
    tagline: 'Event ticketing on microservices — my full-stack playground',
    color: '#3E8BFF',
    stack: ['Spring Boot', 'Java', 'PostgreSQL', 'Kafka', 'React 19', 'momi-ui'],
    highlights: [
      'Seat maps, holds, orders, QR tickets, check-in and transfers in a core service; identity and notifications split into their own services.',
      'React SPA with API types generated from each service’s OpenAPI.',
    ],
    metric: { value: '3+', label: 'services' },
    repo: 'https://github.com/ticket2h',
  },
]
