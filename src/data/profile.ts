// Single source of truth for every surface: desk documents, OS apps, terminal and /resume.

export const profile = {
  name: 'Dương Việt Hoàng',
  nameAscii: 'Duong Viet Hoang',
  handle: 'hoangduong2k',
  role: 'Software Developer',
  stack: 'Java · Spring Boot · PHP · Laravel · React',
  location: 'Hanoi, Vietnam',
  email: 'hoangblack2000@gmail.com',
  github: 'https://github.com/HoangDuong2k',
  linkedin: 'https://linkedin.com/in/hoangduong2k',
  years: 3,
  summary:
    'Full-stack developer with 3 years of experience building web applications with React/TypeScript on the frontend and Java/Spring Boot and PHP/Laravel on the backend. I own features end to end on a multi-tenant SaaS platform, from REST APIs, transactions and integrations to UI, tests and release, and I build microservices with Spring Boot, PostgreSQL and Kafka. I use AI coding tools daily and review every change they produce.',
  goal: 'Keep owning features end to end, and grow into designing the systems around them: solution architecture.',
}

export const skills: Record<string, string[]> = {
  Languages: ['Java', 'TypeScript', 'JavaScript', 'PHP', 'SQL', 'HTML', 'CSS'],
  Backend: ['Spring Boot', 'Spring Security', 'Spring Data JPA/Hibernate', 'JDBC', 'REST API', 'Laravel', 'Queues', 'Node.js', 'Moodle'],
  Frontend: ['React', 'Next.js', 'Redux Toolkit', 'Zustand', 'TanStack Query', 'Tailwind CSS', 'Radix UI', 'Vue/Nuxt'],
  'Database & messaging': ['PostgreSQL', 'MySQL', 'MongoDB', 'Elasticsearch', 'Redis', 'Kafka', 'Flyway'],
  Architecture: ['Microservices', 'Transactional outbox', 'Idempotency', 'Micro-frontends', 'JWT/OAuth2'],
  'DevOps & Testing': ['Git', 'Maven', 'Docker', 'Kubernetes', 'Linux', 'CI/CD (Jenkins, GitHub Actions)', 'JUnit', 'Testcontainers', 'PHPUnit', 'Vitest', 'React Testing Library', 'MSW', 'Playwright'],
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
    stack: ['Java', 'PHP 8', 'Laravel 11', 'React 18', 'TypeScript', 'MySQL', 'Elasticsearch', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'Jenkins'],
    points: [
      'Own 4 production modules of a multi-tenant SaaS platform (SLA, OKR/KPI, AI knowledge base, Zalo/WhatsApp messaging), from requirements to production.',
      'Contribute to migrating part of the PHP APIs to Java services in a microservices system (REST between services, Kafka events).',
      'Build Laravel REST APIs with validation, role-based authorization and per-workspace data scoping; integrate the Zalo and WhatsApp Business APIs.',
      'Build a bulk Excel import (preview, column mapping, validation) processed in the background on queue jobs.',
      'Build real-time UIs over WebSocket: SLA countdowns and call-center supervision with snapshot + delta state sync; large data lists with cursor-based pagination.',
      "Contribute to the shared React component library used by ~10 micro-frontends (Redux Toolkit, Zustand, TanStack Query); re-architect the Form Builder's rule engine.",
      'Add PHPUnit tests and 300+ frontend test files, raising commits shipped with tests from ~5% to ~56%; review code and deliver 200+ tickets.',
      'Ship through Jenkins CI/CD pipelines (tests, Docker images, Kubernetes deploys); investigate production issues using request-ID logs and tracing.',
    ],
  },
  {
    company: 'Digital Transformation Center, HUST',
    product: 'Hanoi University of Science and Technology · Hanoi, Vietnam',
    role: 'Web Developer',
    period: '10/2023 – 09/2025',
    hash: '7be20d4',
    stack: ['Java', 'Spring Boot', 'PostgreSQL', 'MySQL', 'React', 'Next.js', 'Nuxt.js', 'TypeScript', 'PHP', 'Laravel', 'Moodle', 'Docker'],
    points: [
      'Built the Spring Boot backend (REST APIs, Spring Data JPA, PostgreSQL) and the Nuxt frontend for the Hanoi Medical University training-center system: courses, admission programs, registration and FPT payment-gateway checkout.',
      'Built a facility management system with React, JWT/OAuth2 and role-based access; optimized large tables; gathered requirements with stakeholders.',
      'Built the Next.js frontend of an AI research-assistant (RAG) platform: paper search, chat with cited answers, personal library; co-designed the PostgreSQL schema (23 tables); deployed with Docker Compose.',
      'Built the Laravel backend and React frontend for the dormitory system, with the BIDV payment gateway (signed IPN callbacks, reconciliation, queued emails).',
      'Upgraded the university LMS from Moodle 3.8 to 4.5 (PHP 7.4 to 8.1); built a custom theme from Figma designs and a web-service plugin for a Next.js admin system.',
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
    id: 'ticket2h',
    name: 'Ticket2h',
    tagline: 'Event ticketing on Spring Boot microservices',
    color: '#3E8BFF',
    stack: ['Java 25', 'Spring Boot 4', 'Spring Security', 'Spring Data JPA', 'PostgreSQL', 'Kafka', 'Flyway', 'Docker', 'React'],
    highlights: [
      'Split the system into Spring Boot services (ticketing, identity, notification, mock payment gateway), each with its own repo, PostgreSQL database, Flyway migrations and CI pipeline.',
      'Kept inventory correct under load with row locking inside transactions: 200 concurrent requests for one seat give exactly 1 winner; 10,000 orders for 1,000 tickets sell exactly 1,000.',
      'Made orders and payment webhooks idempotent (a webhook delivered 3 times records one payment); published events to Kafka through a transactional outbox.',
      'Identity service signs RS256 JWTs; other services verify them via JWKS with Spring Security, without shared secrets.',
      '180+ tests with JUnit and Testcontainers against real PostgreSQL and Kafka; GitHub Actions builds Docker images; OpenAPI specs generate the React app’s TypeScript types.',
    ],
    metric: { value: '180+', label: 'tests' },
    repo: 'https://github.com/ticket2h',
  },
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
