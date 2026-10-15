# Style guide

The style is **typography-first minimalism**. A developer-minimal base in the spirit
of [antfu.me](https://antfu.me) is combined with the editorial details of
[thinkingmachines.ai](https://thinkingmachines.ai): one quiet column of text, grey
tones instead of color for hierarchy, and playful art kept in the background.

Every rule below has a reason. If a change needs to break one, change this file in
the same PR and say why.

## Principles

1. **Text first.** A page is a column of readable text. Everything else supports it.
2. **Hierarchy from size, weight and grey, not color.** If a page needs color to be
   understood, the structure is wrong.
3. **One way to do each thing.** Use the tokens below, not one-off values.
4. **Decoration stays in the background.** Art and outlined numbers are welcome;
   they never compete with the text.
5. **Quiet and fast.** No third-party embeds by default. Motion respects
   `prefers-reduced-motion`.

## Layout

- **Text column:** `.prose`, at most `65ch` (about 656px), centered. The page gutter
  is `px-7`.
- **Full-width pages** opt in with `<!-- @layout-full-width -->` (Projects, Photos).
- **Table of contents:** only when the article contains `[[toc]]`. It sits in the
  left margin on screens 1280px and wider and is hidden below that. An article
  without `[[toc]]` has no sidebar at all. Projects lists its categories the same
  way, once it has two or more.
- **Tables** keep the column width; below 768px a wide table scrolls sideways inside
  the column instead of being cut off.
- **Wide figures:** a figure with a caption may widen to `52rem` (about 830px),
  centered. While a TOC is showing, it stops 260px short of each viewport edge, so
  it never runs under the TOC.
- **Vertical rhythm:** paragraphs `1.25em` apart, `2.4em` above each h2.

## Typography

Three families, each with one job:

- **Inter** for all text and UI.
- **DM Mono** for code.
- **Roboto Condensed** only for special compact elements, today the magic-link
  chips (`{ARCADE Lab}`, `{JHU}`). Don't use it anywhere else.

Math is the one exception: formulas use KaTeX's own fonts (see Math).

Weights: **400, 500 and 600 only**, plus italic 400 and 500. Nothing ships
heavier, so nothing may ask for more. `<strong>`, `**bold**` and table headers are 600.

| Role                 | Size           | Weight     | Line height | Notes                           |
| -------------------- | -------------- | ---------- | ----------- | ------------------------------- |
| Body                 | 16px           | 400        | 1.75 (28px) | Light `#3d3d3d`, dark `#c8c8c8` |
| Page title (h1)      | 2em (32px)     | 600        | 1.2         | Tracking `-0.015em`             |
| Section (h2)         | 1.375em (22px) | 600        | 1.35        | Tracking `-0.01em`              |
| Subsection (h3)      | 1.125em (18px) | 500 italic | 1.5         |                                 |
| Meta (date, reading) | 1em            | 400        |             | 50% opacity                     |
| Caption              | 13px           | 400        | 1.45        | `--fg-light` (`#888`), centered |
| Inline code          | 0.92em         | 400        |             | DM Mono                         |

- `*emphasis*` is Inter italic, not a serif.
- **Chinese** uses the system font after Inter: PingFang SC, Hiragino Sans GB,
  Noto Sans CJK SC, then Microsoft YaHei, at the same sizes. Never ship a CJK web
  font; they are megabytes.

## Color

- **Monochrome.** Text is black or grey on white (`#fff`), and white or grey on
  near-black (`#050505`) in dark mode. Lower emphasis comes from grey or opacity
  (`op50`, `op75`). Borders use `border-base` (`#8884`).
- **Color is only for meaning:** syntax highlighting (Shiki vitesse themes), diff
  marks, GitHub alerts (`> [!NOTE]`), the dev-only draft banner, and the content of
  photos and images.
- **No hue utilities** (`text-blue-500`, `bg-rose`, `btn-blue`...) in pages or
  components. Emphasize with weight 600 and full-contrast text instead.
- **Both themes, always.** Every visible change is checked in light and dark mode.

## Links and navigation

- **Inline links** use the strong text color and the surrounding weight, with a 1px
  underline at `rgba(125, 125, 125, 0.4)`, offset 3px. On hover the underline turns
  solid. Links styled as tabs or buttons opt out with `no-underline!`.
  External links open in a new tab; markdown does this automatically.
- **People and organizations** use magic links (`{Name}`), defined in
  `vite.config.ts`.
- **Nav bar:** words for site sections (Blog, Projects). Icons only for the photos
  section, external profiles (GitHub) and utilities (theme toggle). At most about 6
  items, no dropdowns.

## Images and figures

- No shadows, no borders, corner radius 4px at most.
- Only a figure with a caption may widen (see Layout). Photos and screenshots
  without a caption stay in the column.
- Captions are short, in sentence case, and centered under the image.
- Every image has `alt` text, or `alt=""` when it's purely decorative.
- Photos go through `pnpm organize-photos` (1440px, metadata stripped). Other
  images go through `pnpm compress`.

## Motion and background art

- **Art is opt-in per page** with `art: plum | dots | random`, and allowed on any
  page, posts included. It must stay low contrast, sit behind the content, never be
  interactive, show a still frame under reduced motion, and stay within the
  `pnpm perf` budget. Write new art in the style of `ArtDots.vue`: 2D canvas,
  capped frame rate.
- **Entrance animation** is the staggered `slide-enter` fade only. Add no other
  page animations.
- **Outlined text decoration** (the large year numbers on the blog list, the
  category names on Projects) stays low contrast, like the art.

## Writing

- **Voice:** first person and conversational. Short sentences, plain words. No
  marketing superlatives ("passionate", "cutting-edge"). No emoji in titles or UI.
- **English titles:** Title Case for page and post titles ("ACM Mode C++ Guide"),
  sentence case for headings inside a post ("How the input is read").
- **Chinese:**
  - Full-width punctuation inside Chinese text: `，。：；！？「」（）`.
  - A space between Chinese and Latin letters or numbers: `使用 Swift 开发`,
    `2026 年`.
  - No space next to full-width punctuation: `我在深圳，欢迎联系。`
- **Dates and reading time:** "Mar 15, 2026" (`formatDate`) and "5min".
- **Frontmatter is plain text:** write `&`, never `&amp;`.

## Math

- Write LaTeX in markdown: `$O(n \log n)$` inline, and `$$` on its own line above
  and below a display formula.
- KaTeX renders it at build time, so pages ship no math JavaScript. Its stylesheet
  and fonts load only on pages that contain math.
- Inline math is 1.1em so it sits evenly with Inter. Long display formulas scroll
  sideways inside the column on phones.
- Use `\text{...}` for words inside a formula, and keep plain prose out of math.
- Math inside raw HTML (`<div>...</div>`) is not rendered. Keep formulas in plain
  markdown.
- A price like `$5 and $10` stays text. In a line that also has math, write `\$` for a
  literal dollar sign.

## Code

- Fenced blocks always name their language. Highlighting uses Shiki's vitesse
  light and dark themes.
- Use `// [!code ++]` and `// [!code highlight]` notation, not screenshots of code.

## Enforcement

The mechanical rules are checked; `pnpm check` and CI fail when one breaks.

- `pnpm lint:style` (`scripts/check-style.ts`) reads the source: no hue color
  utilities and no chromatic hex colors in pages and components, no weight above
  600, only the three font families (condensed only for magic links), and the
  Chinese punctuation and spacing rules. Its exceptions are listed at the top of the
  script, each with a reason.
- `pnpm verify` reads the built site: only Inter, DM Mono and Roboto Condensed at
  weights up to 600 ship (KaTeX's fonts excepted), a TOC sidebar appears only on
  pages that ask for one, KaTeX rendered every formula, and no raw `$...$` LaTeX is
  left in page text.
- `pnpm test:e2e` checks the margin TOC, scrolling tables on phones, math rendering
  (and no KaTeX stylesheet on pages without math), and the reduced-motion still
  frame of the dots background.

## Reference

`docs/style/c-vs-today-light.webp` and `-dark.webp` record how this style was
chosen: the old antfu-template styles (left) against the C prototype (right), on a
real post with a photo and TOC inserted. The site now looks like the right side.

To check a visible change, look at it on `pnpm serve:dist` in light and dark mode
and at about 375px wide, or run `pnpm shots --no-art --out .perf/shots/before`
before the change and `--out .perf/shots/after` after it, and compare the pairs.
