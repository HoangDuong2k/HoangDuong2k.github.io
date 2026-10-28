# hoangduong2k.github.io

Interactive 3D portfolio of **Dương Việt Hoàng** — Frontend Developer (React · TypeScript).

A gaming-style desk you can orbit by dragging. Click the monitor to log in to **hoang.os** (draggable windows, a terminal with `neofetch`, `git log`, `open budkin`…), or pick up the documents on the desk to read the resume, case studies and contact card. Recruiters in a hurry can use [`/resume`](https://hoangduong2k.github.io/resume).

**Live:** https://hoangduong2k.github.io

## Stack

- [Astro](https://astro.build) + React islands
- [React Three Fiber](https://r3f.docs.pmnd.rs) + drei + postprocessing (bloom, vignette)
- Tailwind CSS v4 + [momi-ui](https://github.com/HoangDuong2k/momi-ui) (command palette, tokens)
- Every 3D prop is modelled in code and textured with `<canvas>` — no model or HDR downloads

## Performance

- Three quality tiers (`low` / `medium` / `high`) guessed from the device, then stepped down at runtime by `PerformanceMonitor` when FPS drops. Force one with `?quality=low`.
- Shadows are rendered once (static scene), not every frame.
- The 3D scene stops rendering while an overlay (OS, document) covers it.
- three.js is lazy-loaded: the HUD and boot screen paint from ~100 KB of JS.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # typecheck + static build to dist/
```

`momi-ui` is installed from `vendor/momi-ui-0.1.0.tgz` until it is published to npm. To refresh it, run `npm pack` in the momi-ui repo and copy the tarball here.

Content (experience, projects, skills) lives in [`src/data/profile.ts`](src/data/profile.ts) and feeds every surface: desk documents, OS apps, terminal and `/resume`.

## Deploy

Pushing to `main` builds and deploys to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
