// Verifies the built site in dist/ -- the exact artifact GitHub Pages serves.
// Run after `pnpm build`. Exits 1 on any error; warnings never fail.
//
// Usage: pnpm verify
//
// Checks:
//   - every static page in pages/ was rendered, plus 404.html, CNAME, feed.xml
//   - internal links/assets resolve under GitHub Pages rules (see serve-dist.ts)
//   - pages reachable from / have no broken links (unreachable pages only warn)
//   - every page has a <title> and its og:image exists
//   - no unresolved Vue components (`<ListPosts>` leaking into HTML)
//   - no [TEMPLATE] posts leaking into rendered pages
//   - no third-party <script src> on any page (load embeds on demand instead)
//   - size budgets for JS / CSS / HTML / images
//   - privacy: drafts not deployed; no email addresses, machine paths, source maps or
//     dot-directories; no identifying image metadata (GPS, camera, author, XMP...)
//   - style (docs/style-guide.md): only Inter / DM Mono / Roboto Condensed at weights
//     <= 600 ship (plus KaTeX's own fonts for math), and the TOC sidebar appears only
//     on pages whose source has [[toc]]
//   - math: no KaTeX errors and no unrendered $...\command...$ LaTeX in page text
import { Buffer } from 'node:buffer'
import { readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'
import { gzipSync } from 'node:zlib'
import ExifReader from 'exifreader'
import fg from 'fast-glob'
import matter from 'gray-matter'
import { resolveRequest } from './serve-dist'

const DIST = resolve('dist')
const DOMAIN = `https://${readFileSync('CNAME', 'utf-8').trim()}`

// Budgets sit ~15% above the current size, so regressions fail loudly.
// Raise one only on purpose, and say why in the commit message.
const BUDGET = {
  entryJsGzip: 70_000, // app-*.js, loaded on every page (60 kB today)
  libraryChunkJs: 50_000, // any lazy chunk that isn't a page (<10 kB today; pixi.js alone was 200 kB)
  pageChunkJs: 400_000, // a page's own chunk, which grows with its content (posts/leetcode-template: 122 kB)
  css: 92_000, // app-*.css, loaded on every page (79 kB today)
  html: 160_000, // largest page (posts/leetcode-template: 109 kB)
  image: 500_000, // any image; `pnpm organize-photos` produces ~150 kB photos
}

const errors: string[] = []
const warnings: string[] = []
const error = (msg: string) => errors.push(msg)
const warn = (msg: string) => warnings.push(msg)
const kb = (n: number) => `${(n / 1000).toFixed(1)} kB`

function urlToPath(file: string) {
  const rel = relative(DIST, file).replace(/\\/g, '/')
  if (rel === 'index.html')
    return '/'
  return `/${rel.replace(/(?:\/index)?\.html$/, '')}`
}

function resolveInternal(href: string) {
  return resolveRequest(DIST, href).status !== 404
}

// Turn an href/src into a site path, or undefined for external/non-http links.
function toInternal(href: string): string | undefined {
  if (href.startsWith(DOMAIN))
    href = href.slice(DOMAIN.length) || '/'
  if (!href.startsWith('/') || href.startsWith('//'))
    return undefined
  return href.split(/[?#]/)[0] || '/'
}

// 1. Required files
for (const file of ['index.html', '404.html', 'CNAME', 'feed.xml']) {
  try {
    statSync(join(DIST, file))
  }
  catch {
    error(`missing dist/${file}`)
  }
}

// 2. Every static page in pages/ was rendered
const pageFiles = await fg('pages/**/*.{md,vue}')
for (const file of pageFiles) {
  if (file.includes('['))
    continue // dynamic route ([...404], [TEMPLATE]-*), not pre-rendered
  const route = file
    .replace(/^pages/, '')
    .replace(/\.(?:md|vue)$/, '')
    .replace(/\/index$/, '') || '/'
  const isDraft = file.endsWith('.md') && matter(readFileSync(file, 'utf-8')).data.draft
  if (isDraft) {
    if (resolveRequest(DIST, route).status === 200)
      error(`${file} is a draft but was deployed (see vite.config.ts extendRoute)`)
  }
  else if (!resolveInternal(route)) {
    error(`${file} was not rendered (expected a file for ${route})`)
  }
}

// 3. Per-page checks + link graph
const htmlFiles = await fg('**/*.html', { cwd: DIST, absolute: true, ignore: ['admin/**'] })
const pages = new Map<string, { anchors: string[], resources: string[] }>()

for (const file of htmlFiles) {
  const path = urlToPath(file)
  const html = readFileSync(file, 'utf-8')
  const attr = (re: RegExp) => [...html.matchAll(re)].map(m => m[1])

  const anchors = attr(/<a\s[^>]*?href="([^"]*)"/g)
  const resources = attr(/<(?:link|script|img|source|video|iframe)\s[^>]*?(?:href|src)="([^"]*)"/g)
  pages.set(path, { anchors, resources })

  if (!/<title>[^<]+<\/title>/.test(html))
    error(`${path}: missing <title>`)

  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
  if (ogImage) {
    const local = toInternal(ogImage)
    if (local && !resolveInternal(local))
      error(`${path}: og:image ${ogImage} does not exist in dist`)
  }

  // Components that failed to resolve render as literal PascalCase tags
  const unresolved = new Set(attr(/<([A-Z][A-Za-z0-9]+)[\s/>]/g).filter(t => t !== 'DOCTYPE'))
  for (const tag of unresolved)
    error(`${path}: unresolved component <${tag}> in HTML (missing file or typo?)`)

  if (html.includes('[TEMPLATE]') && path !== '/404')
    error(`${path}: contains "[TEMPLATE]" -- a template post leaked into a rendered page`)

  // Frontmatter is plain text; `&amp;` in a title shows up literally on the page
  if (/<title>[^<]*&amp;(?:amp|lt|gt|quot|#\d+);/.test(html))
    error(`${path}: double-escaped HTML entity -- write "&" not "&amp;" in frontmatter`)

  if (html.length > BUDGET.html)
    error(`${path}: HTML is ${kb(html.length)} (budget ${kb(BUDGET.html)})`)

  for (const src of resources) {
    const local = toInternal(src)
    if (local && !resolveInternal(local))
      error(`${path}: asset ${src} does not exist`)
  }

  // A site-wide third-party script cost ~135 kB and seconds of load time on every page
  for (const src of attr(/<script\s[^>]*?src="(https?:\/\/[^"]+)"/g)) {
    if (!src.startsWith(DOMAIN))
      error(`${path}: third-party script ${src} -- load it on demand in the component that needs it`)
  }
}

// Crawl from / to tell reachable pages from orphans
const reachable = new Set<string>()
const queue = ['/']
while (queue.length) {
  const path = queue.shift()!
  if (reachable.has(path) || !pages.has(path))
    continue
  reachable.add(path)
  for (const href of pages.get(path)!.anchors) {
    const local = toInternal(href)
    if (local && resolveInternal(local))
      queue.push(local.replace(/\/$/, '') || '/')
  }
}

for (const [path, { anchors }] of pages) {
  const report = reachable.has(path) ? error : warn
  for (const href of anchors) {
    const local = toInternal(href)
    if (local && !resolveInternal(local))
      report(`${path}: broken link ${href}`)
  }
}
const orphans = [...pages.keys()].filter(p => !reachable.has(p) && p !== '/404')
if (orphans.length)
  warn(`deployed but not linked from anywhere: ${orphans.sort().join(', ')}`)

// 4. Size budgets
const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf-8')
const entry = indexHtml.match(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"/)?.[1]
if (!entry) {
  error('could not find the entry <script type="module"> in index.html')
}
else {
  const gz = gzipSync(readFileSync(join(DIST, entry))).length
  if (gz > BUDGET.entryJsGzip)
    error(`entry ${entry} is ${kb(gz)} gzip (budget ${kb(BUDGET.entryJsGzip)})`)
}

// Rollup names a page's chunk after its file ([TEMPLATE]-x.md -> _TEMPLATE_-x-<hash>.js)
const pageChunkNames = new Set(pageFiles.map(f => f.replace(/^.*\//, '').replace(/\.(?:md|vue)$/, '').replace(/[^\w.-]/g, '_')))
const assets = (await fg('**/*', { cwd: DIST, absolute: true }))
  .map(file => ({ file: relative(DIST, file), size: statSync(file).size }))
  .sort((a, b) => b.size - a.size)

for (const { file, size } of assets) {
  if (file.startsWith('assets/') && file.endsWith('.js') && file !== entry?.slice(1)) {
    const isPage = pageChunkNames.has(file.replace(/^assets\//, '').replace(/-[\w-]{8}\.js$/, ''))
    const budget = isPage ? BUDGET.pageChunkJs : BUDGET.libraryChunkJs
    if (size > budget)
      error(`${file} is ${kb(size)} (${isPage ? 'page' : 'library'} chunk budget ${kb(budget)})`)
  }
  if (file.endsWith('.css') && size > BUDGET.css)
    error(`${file} is ${kb(size)} (budget ${kb(BUDGET.css)})`)
  if (/\.(?:jpe?g|png|webp)$/i.test(file) && size > BUDGET.image)
    error(`${file} is ${kb(size)} (budget ${kb(BUDGET.image)}) -- photos: \`pnpm organize-photos\`, other images: \`pnpm compress\``)
}

// 5. Style: the fonts that ship, and the TOC
const FONT_FAMILIES = ['Inter', 'DM Mono', 'Roboto Condensed']
for (const cssFile of await fg('assets/*.css', { cwd: DIST, absolute: true })) {
  const css = readFileSync(cssFile, 'utf-8')
  for (const [, face] of css.matchAll(/@font-face\{([^}]*)\}/g)) {
    const family = face.match(/font-family:"?([^";]+)/)?.[1]
    const weight = Number(face.match(/font-weight:(\d+)/)?.[1] ?? 400)
    if (family?.startsWith('KaTeX_'))
      continue // math fonts: loaded only by pages with math (docs/style-guide.md#math)
    if (family && !FONT_FAMILIES.includes(family))
      error(`${relative(DIST, cssFile)}: ships font "${family}" -- the guide allows ${FONT_FAMILIES.join(', ')}`)
    if (weight > 600)
      error(`${relative(DIST, cssFile)}: ships ${family} ${weight} -- nothing above 600`)
  }
}
// [[toc]] in markdown, or <ListProjects>, which lists its categories the same way
const tocSources = new Set(pageFiles.filter(f => /\[\[toc\]\]|<ListProjects/.test(readFileSync(f, 'utf-8'))).map(f => f
  .replace(/^pages/, '')
  .replace(/\.(?:md|vue)$/, '')
  .replace(/\/index$/, '') || '/'))
for (const file of htmlFiles) {
  const path = urlToPath(file)
  const html = readFileSync(file, 'utf-8')
  if (html.includes('class="table-of-contents"') && !tocSources.has(path))
    error(`${path}: renders a TOC sidebar but its source has no [[toc]]`)
  if (html.includes('katex-error'))
    error(`${path}: KaTeX could not render a formula (look for .katex-error); fix the LaTeX`)
  // Math the parser skipped shows up as raw text such as "$O(n \log n)$"
  const text = html.replace(/<(pre|code|script|annotation)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, '')
  const raw = text.match(/\$[^$\n]{0,80}\\[a-z]+[^$\n]{0,80}\$/i)?.[0]
  if (raw)
    error(`${path}: unrendered LaTeX "${raw}" -- math inside raw HTML isn't rendered; move it into plain markdown`)
}

// 6. Privacy: nothing personal that the author didn't put on a page on purpose
const IDENTIFYING_TAGS = /^(?:Make|Model|LensModel|Software|Artist|Copyright|HostComputer|ImageDescription|UserComment|DateTimeOriginal|DateTimeDigitized|BodySerialNumber|SerialNumber|CameraOwnerName|OwnerName)$/
function imageMetadata(buffer: Buffer): string[] {
  let tags: Record<string, Record<string, any>>
  try {
    tags = ExifReader.load(buffer, { expanded: true }) as any
  }
  catch {
    return []
  }
  const found = Object.keys(tags.gps || {}).length ? ['GPS location'] : []
  for (const group of ['xmp', 'iptc'] as const) {
    if (Object.keys(tags[group] || {}).length)
      found.push(`${group.toUpperCase()} (${Object.keys(tags[group]).slice(0, 3).join(', ')})`)
  }
  for (const key of Object.keys(tags.exif || {})) {
    if (IDENTIFYING_TAGS.test(key))
      found.push(key)
  }
  for (const key of Object.keys(tags.pngText || {})) {
    if (!key.startsWith('date:'))
      found.push(`PNG text "${key}"`)
  }
  return found
}

for (const file of await fg('**/*', { cwd: DIST, dot: true, onlyFiles: false })) {
  const name = file.split('/').pop()!
  if (name.startsWith('.') && name !== '.DS_Store') // .DS_Store: local Finder noise; CI builds never have it
    error(`${file}: dot-file/directory in dist (build internals); remove it in the build script`)
  if (file.endsWith('.map'))
    error(`${file}: source map deployed`)
}

for (const file of await fg('**/*.{html,js,css,xml,atom,json,txt,svg}', { cwd: DIST, absolute: true })) {
  const text = readFileSync(file, 'utf-8')
  const rel = relative(DIST, file)
  const email = text.match(/[\w.%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/i)?.[0]
  if (email)
    error(`${rel}: email address "${email}" in plain text (pages show it obfuscated; scrapers read files)`)
  const machinePath = text.match(/\/(?:Users|home)\/[\w.-]+\//)?.[0]
  if (machinePath)
    error(`${rel}: absolute machine path "${machinePath}"`)
  if (rel.endsWith('.svg')) {
    for (const [, b64] of text.matchAll(/data:image\/(?:png|jpe?g|webp);base64,([A-Z0-9+/=\s]+)/gi)) {
      const found = imageMetadata(Buffer.from(b64.replace(/\s/g, ''), 'base64'))
      if (found.length)
        error(`${rel}: embedded image carries ${found.join(', ')}`)
    }
  }
}

for (const file of await fg('**/*.{jpg,jpeg,png,webp}', { cwd: DIST, absolute: true, caseSensitiveMatch: false })) {
  const found = imageMetadata(readFileSync(file))
  if (found.length)
    error(`${relative(DIST, file)}: image metadata ${found.join(', ')} -- photos: \`pnpm organize-photos\`, other images: re-export without metadata`)
}

// Report
const topJs = assets.filter(a => a.file.endsWith('.js')).slice(0, 5)
console.log(`verify: ${htmlFiles.length} pages, ${reachable.size} reachable from /`)
console.log(`largest JS: ${topJs.map(a => `${a.file.replace(/^assets\//, '')} ${kb(a.size)}`).join(', ')}`)
for (const w of warnings)
  console.log(`  warn  ${w}`)
for (const e of errors)
  console.log(`  ERROR ${e}`)
console.log(`verify: ${errors.length} error(s), ${warnings.length} warning(s)`)
process.exit(errors.length ? 1 : 0)
