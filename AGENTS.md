# AGENTS.md

Personal site of Mason (Yiming) Chen, live at https://yikmingchen.com. It is a Vue 3 +
vite-ssg static site whose content is mostly Markdown in `pages/`. It deploys to GitHub
Pages from `.github/workflows/ci.yml` on every push to `main`. It started as a fork of
[antfu.me](https://github.com/antfu/antfu.me); the template's unused parts have been removed.

## Commands

```sh
pnpm install          # Node 24 LTS (.nvmrc); pnpm version pinned by "packageManager"
pnpm dev              # http://localhost:3333 with hot reload
pnpm check            # everything CI runs: lint -> build -> typecheck -> verify -> test:e2e
pnpm lint --fix       # ESLint (@antfu/eslint-config) also formats; there is no Prettier
pnpm build            # -> dist/, byte-for-byte what gets deployed
pnpm typecheck        # vue-tsc; needs the .d.ts files a build or dev run generates
pnpm verify           # checks dist/: every page rendered, links, og images, size budgets
pnpm test:e2e         # Playwright against dist/ served with GitHub Pages rules
pnpm serve:dist       # browse the real artifact at http://127.0.0.1:4173
pnpm perf [routes]    # CPU / fps / bytes per page (--mobile, --cpu 4); before and after perf work
```

One-time setup for e2e: `pnpm exec playwright install chromium`.

## Definition of done

A change is done when `pnpm check` passes. A clean compile is not enough. If the
change is visible, also look at it on `pnpm serve:dist` (light and dark, desktop and
~375px wide). If the change could affect speed, paste `pnpm perf` numbers from before
and after. `.claude/skills/verify-site/SKILL.md` has the full procedure.

When a check fails, fix the cause. Don't loosen a size budget in
`scripts/verify-dist.ts` unless the growth is intended, and if you do, say why in the
commit.

## Where things live

- `pages/` holds the routes, file-based: `pages/foo.md` -> `/foo`, `pages/posts/x.md` -> `/posts/x`.
  Markdown pages are wrapped by `src/components/WrapperPost.vue`, which reads the frontmatter.
- `src/components/` are auto-registered, so use `<ListPosts />` in any `.md`/`.vue`
  without an import. Vue, vue-router and `@vueuse/core` APIs are auto-imported too.
- `src/logics/index.ts` holds shared state (`isDark`, `englishOnly`) and `formatDate`.
- `data/*.ts` is typed data for `/media` and `/sports`. `photos/` holds the gallery
  images plus `.json` sidecars.
- `vite.config.ts` configures the markdown pipeline and OG image generation.
- `scripts/` holds build steps (`rss.ts`, `copy-fonts.ts`) and the verification tooling
  (`verify-dist.ts`, `serve-dist.ts`, `perf.ts`). `tests/e2e/` holds the browser tests.
- `docs/feature-map.md` covers every page and site-wide feature: source, how to
  reach it, how to verify it, and traps. **Read it before changing behavior.**

## Paved roads

**New post or note.** Add `pages/posts/<kebab-slug>.md`. No brackets in the filename.

```yaml
---
title: My Post # plain text: write "&", never "&amp;"
date: 2026-10-14T00:00:00Z
type: blog # blog -> /posts, note -> /notes
lang: en # zh for Chinese posts, so the "English only" filter and RSS treat them right
duration: 5min
art: random # optional background: plum | dots | random
draft: true # optional: dev-only, never deployed (but still public on GitHub)
---
```

Copy markdown features from `pages/posts/[TEMPLATE]-blog-example.md`. The first build
generates `public/og/<slug>.png`; commit it.

**New page.** Add `pages/<name>.md` with `title` (plus optional `display`, `subtitle`,
`description`, `art`). Link it from somewhere; `pnpm verify` warns about orphans. Add
a row to `docs/feature-map.md`.

**New component.** Add `src/components/<PascalName>.vue` using `<script setup lang="ts">`
and UnoCSS utilities (attributify is on: `<div flex gap-2>`). Look at `ListPosts.vue`
or `PhotoGrid.vue` for the house style.

**Photos.** Put JPG/PNG files in `photos/` and run `pnpm organize-photos`. It renames
them to `p-<capture time>-000-N.jpg`, compresses them to 1440px with metadata (GPS)
stripped, and writes a `.json` sidecar with a blurhash. Then edit the sidecar's `text`.
Re-running it is safe. Details are in `ORGANIZE_PHOTOS.md`.

**Internal links.** Use `/genki`, never `/genki/`; GitHub Pages returns 404 for the
trailing slash.

## Guardrails

These are enforced; you don't have to remember them, but don't work around them:

- **The repo and its whole git history are public.** Don't commit anything that
  shouldn't be on the site; deleting a file later doesn't remove it from history.
  Keep private, unfinished writing in `drafts/`, which is gitignored.
- `pnpm verify` fails on plain-text email addresses, machine paths, source maps,
  dot-directories, deployed drafts, and identifying image metadata (GPS, camera,
  author, XMP). `pnpm organize-photos` and `pnpm compress` strip metadata. Images
  exported from design tools (the old Canva avatar carried account IDs) need it too.

- Size budgets in `scripts/verify-dist.ts`: the entry bundle, every lazy library chunk,
  CSS, HTML and images. The site used to ship ~490 kB of pixi.js and 2 MB of photos.
- No third-party `<script src>` on any page (`pnpm verify`). Load an embed on demand,
  inside the component that needs it.
- `no-restricted-imports` in `eslint.config.js` blocks the removed heavy libraries,
  and its error message says what to use instead.
- Animated backgrounds must stay cheap: plain 2D canvas, a capped frame rate, and a
  still frame under `prefers-reduced-motion`. The e2e test checks the last one.
