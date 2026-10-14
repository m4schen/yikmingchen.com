# Feature map

How each part of yikmingchen.com works, where its code lives, and how to check it.
The running site is the source of truth; this is an index into it. When you add or
change a feature, update its row in the same change.

Check any page against the real artifact: `pnpm build && pnpm serve:dist`, then open
`http://127.0.0.1:4173<route>`.

## Pages

- `/`: `pages/index.md`. Reached from logo in NavBar. Bio + links. `/index-zh` (`pages/index-zh.md`) is the Chinese copy; keep both in sync by hand.
- `/posts`: `pages/posts/index.md`. Reached from NavBar "Blog". `<SubNav>` + `<ListPosts type="blog">`.
- `/notes`: `pages/notes.md`. Reached from SubNav "Notes". `<ListPosts type="note">`.
- `/posts/<slug>`: `pages/posts/<slug>.md`. Reached from `/posts`, `/notes`. Wrapped by `WrapperPost.vue` (title, date, duration, art, `cd ..`).
- `/projects`: `pages/projects.md`. Reached from NavBar "Projects". Data is the `projects:` frontmatter map (category -> `{ name, link, excerpt, icon }`), rendered by `ListProjects.vue`. `icon` is an UnoCSS icon class such as `i-ph-heartbeat`.
- `/genki`: `pages/genki.md`. Reached from `/projects`. Project detail page.
- `/photos`: `pages/photos.md`. Reached from NavBar camera icon. `PhotoGalleryAll` -> `PhotoGrid`, data from `photos/data.ts`.
- `/media`: `data/media.ts` via `MediaConsumption.vue`. Reached from `/`. Tabs are `?type=anime|book|movie|drama|game|song`. Entries with `state` set are hidden.
- `/sports`: `data/sports.ts` via `SportsConsumption.vue`. Reached from `/`. Tabs are `?type=athlete|team|coach`.
- `/use`: `pages/use.md`. Reached from `/`, `/photos`. `[[toc]]` renders the floating table of contents.
- unknown URL: `pages/[...404].md`. Pre-rendered to `dist/404.html`; GitHub Pages serves it with status 404.
- `/feed.xml` `/feed.atom` `/feed.json`: `scripts/rss.ts` (runs in `pnpm build`). Reached from `<link rel="alternate">` in `index.html`. Posts in `pages/posts/`, minus drafts, templates and `lang` other than `en`. No author email.

Every page is reachable from `/`; `pnpm verify` warns about any page that isn't.

## Site-wide behavior

- **Nav bar** (`src/components/NavBar.vue`): Logo, Blog, Projects, Photos, GitHub, theme toggle. Scroll-to-top button appears after 300px.
- **Dark mode** (`ToggleTheme.vue` -> `toggleDark()` in `src/logics/index.ts`): View Transition circle reveal. Stored in localStorage `vueuse-color-scheme`. The inline script in `index.html` applies it before first paint. e2e: "theme toggle".
- **"English only"** (`SubNav.vue`, `englishOnly` in `src/logics/index.ts`): localStorage `yikmingchen-english-only`. Hides posts whose `lang` isn't `en`; untagged posts count as English.
- **Background art** (frontmatter `art:` -> `WrapperPost.vue`): `plum` -> `ArtPlum.vue` (2D canvas, stops once grown). `dots` -> `ArtDots.vue` (2D canvas, 20 fps; one still frame under reduced motion). `random` picks one per visit. See "Performance" below. e2e: "dots background".
- **Image preview** (`src/App.vue`): Clicking any `<img>` inside `.prose` or `.photos` opens it full-screen; arrow keys move through `data-photo-index`, Esc closes. Add class `no-preview` to opt out. e2e: "photos open in a preview".
- **Footer** (`Footer.vue`): Licence line. Hidden by frontmatter `class: no-copyright`.
- **Page transitions** (`.slide-enter*` in `src/styles/main.css`): Staggered fade-in. Disabled under `prefers-reduced-motion`.
- **Progress bar** (`nprogress` in `src/main.ts`): Shown on route change.

## Build pipeline (`pnpm build`)

1. `vite-ssg build` pre-renders every static route to `dist/<route>.html`. The client
   re-renders on load rather than hydrating (`ViteSSG()` is called without
   `hydration: true`).
2. The markdown pipeline is configured in `vite.config.ts`:
   - Shiki highlighting: vitesse themes, `// [!code ++]`-style diff and highlight notation.
   - Heading anchors (via `scripts/slugify.ts`) and `[[toc]]`.
   - Magic links `{ARCADE Lab}` and `{JHU}`, defined in `linksMap`.
   - GitHub alerts `> [!NOTE]`.
   - `<!-- @layout-full-width -->` removes the prose column.
3. OG images: `frontmatterPreprocess` renders `public/og/<name>.png` from the title,
   using the card in `scripts/og-template.svg` (your "mc" mark + name). It only does
   this when the file is missing, so commit new ones, and delete a png to regenerate
   it after renaming a title or changing the template.
4. Fonts: UnoCSS web fonts (bunny.net) are cached into `public/assets/fonts`, which
   needs network on a clean checkout. `scripts/copy-fonts.ts` copies them into `dist/`.
5. `scripts/rss.ts` writes the feeds, and CNAME is copied into `dist/`.

## Performance

Measured with `pnpm perf` (headless Chromium, 1440x900@2x) before and after the
2026-10-15 cleanup. Re-measure the same way before and after any change that could
affect speed.

|                                     | Before                         | After               |
| ----------------------------------- | ------------------------------ | ------------------- |
| Idle CPU on an `art: dots` page     | 103% (one core pinned), 16 fps | 17%, 60 fps         |
| Same, 4x CPU throttle / phone at 4x | 104%, 12 fps / --              | 60% / 17-19%        |
| JS on a dots page                   | 735 kB (pixi.js)               | 167 kB              |
| Entry bundle (every page)           | 207 kB (77 kB gzip)            | 155 kB (60 kB gzip) |
| CSS (every page)                    | 110 kB                         | 79 kB               |
| `load` event                        | 2.3-5.1 s (Twitter widgets.js) | under 0.2 s         |
| Photos / avatar                     | 2.15 MB / 2.6 MB               | 438 kB / 170 kB     |

What changed: ArtDots moved from pixi.js/WebGL to a 2D canvas (squares, 20 fps,
reduced-motion aware). The unused Twitter script, floating-vue, pinia, shiki-magic-move
and twoslash were removed, and photos now go through `pnpm organize-photos`. The
guardrails that keep it this way are listed in AGENTS.md.

## Traps

- Brackets in a page filename make it a dynamic route. `pages/posts/[TEMPLATE]-blog-example.md`
  becomes `/posts/:TEMPLATE-blog-example`, which matches any `/posts/*-blog-example`
  URL. Use plain kebab-case filenames for real posts.
- `draft: true` pages and `[TEMPLATE]` posts exist only in `pnpm dev`. Production
  builds delete their routes (`extendRoute` in `vite.config.ts`), and `pnpm verify`
  fails if a draft is deployed. They are still visible on GitHub, though.
- Link to `/genki`, not `/genki/`. GitHub Pages returns 404 for a trailing slash on an
  `.html` page.
- Frontmatter is plain text. Writing `&amp;` makes it show up literally (`pnpm verify` catches this).
- `typed-router.d.ts` is generated but tracked, so commit it when routes change.
  `components.d.ts` and `auto-imports.d.ts` are generated and gitignored.
- Images in `public/` are copied as-is and skip the photo pipeline. Run
  `pnpm compress` on them (it works on staged files), or `pnpm verify` fails at 500 kB.
