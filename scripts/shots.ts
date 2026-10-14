// Screenshots of built pages in light, dark and phone width, for reviewing visual
// changes against docs/style-guide.md. Runs against dist/ served like GitHub Pages.
//
// Usage: pnpm shots [routes...] [--out .perf/shots/<name>] [--full] [--no-art]
//   routes    default: one of each page type
//   --out     output directory (default .perf/shots/latest)
//   --full    full-page screenshots instead of the first screen
//   --no-art  hide the random background art, so before/after shots are comparable
import { mkdirSync } from 'node:fs'
import process from 'node:process'
import { chromium } from '@playwright/test'
import { startServer } from './serve-dist'

const args = process.argv.slice(2)
const outFlag = args.indexOf('--out')
const out = outFlag > -1 ? args.splice(outFlag, 2)[1] : '.perf/shots/latest'
const full = args.includes('--full')
const noArt = args.includes('--no-art')
const routes = args.filter(a => !a.startsWith('--'))
const targets = routes.length
  ? routes
  : ['/', '/index-zh', '/posts', '/posts/cpp-stl-notes', '/posts/note-preference-on-rental', '/projects', '/photos']

const VARIANTS = [
  { name: 'light', colorScheme: 'light', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'dark', colorScheme: 'dark', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'phone', colorScheme: 'light', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
] as const

const PORT = 4175
mkdirSync(out, { recursive: true })
const server = await startServer({ port: PORT })
const browser = await chromium.launch()

for (const variant of VARIANTS) {
  const context = await browser.newContext({ colorScheme: variant.colorScheme, viewport: variant.viewport, deviceScaleFactor: variant.deviceScaleFactor })
  // Third-party requests stubbed, entrance animations off: shots are deterministic
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.fulfill({ status: 200, body: '' }))
  for (const path of targets) {
    const page = await context.newPage()
    await page.goto(`http://127.0.0.1:${PORT}${path}`)
    await page.waitForFunction(() => (document.querySelector('#app') as any)?.__vue_app__)
    await page.evaluate(`document.documentElement.classList.add('no-sliding')`)
    if (noArt)
      await page.addStyleTag({ content: '[dark\\:invert], .fixed.pointer-events-none { display: none !important }' })
    await page.evaluate('document.fonts.ready')
    await page.waitForTimeout(400)
    const file = `${out}/${(path.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home')}.${variant.name}.png`
    await page.screenshot({ path: file, fullPage: full })
    await page.close()
  }
  await context.close()
}

await browser.close()
server.close()
console.log(`shots: ${targets.length} routes x ${VARIANTS.length} variants -> ${out}/`)
