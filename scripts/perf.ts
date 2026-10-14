// Measures what each page costs a visitor's machine: bytes shipped, load timing,
// long tasks, and -- most importantly for animated backgrounds -- how busy the
// main thread stays while the visitor is just reading.
// Runs headless Chromium against dist/ served like GitHub Pages. Build first.
//
// Usage: pnpm perf [paths...] [--cpu 4] [--mobile] [--seconds 5] [--block-third-party] [--trace]
//   paths                default: one page per background art mode + the heaviest post
//   --cpu N              throttle the CPU N times (4 ~ mid-range phone). Default 1
//   --mobile             390x844@3x phone viewport instead of 1440x900@2x
//   --seconds N          idle window sampled after load. Default 5
//   --block-third-party  stub every non-local request, to see what third parties cost
//   --trace              write a Chrome trace per page to .perf/ (open in https://ui.perfetto.dev)
//
// Headless Chromium rasterizes canvases in software, so absolute numbers for the
// animated backgrounds are pessimistic. Compare runs against each other.
import { mkdirSync } from 'node:fs'
import process from 'node:process'
import { chromium } from '@playwright/test'
import { startServer } from './serve-dist'

const args = process.argv.slice(2)
function flag(name: string, fallback: number) {
  const i = args.indexOf(`--${name}`)
  return i > -1 ? Number(args.splice(i, 2)[1]) : fallback
}
const cpu = flag('cpu', 1)
const seconds = flag('seconds', 5)
const trace = args.includes('--trace')
const mobile = args.includes('--mobile')
const viewport = mobile
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }
const blockThirdParty = args.includes('--block-third-party')
const paths = args.filter(a => !a.startsWith('--'))
const targets = paths.length
  ? paths
  : ['/photos', '/posts', '/projects', '/', '/posts/leetcode-template']

const PORT = 4174
const server = await startServer({ port: PORT })
const browser = await chromium.launch()
if (trace)
  mkdirSync('.perf', { recursive: true })

interface Row {
  page: string
  art: string
  jsKB: number
  totalKB: number
  thirdPartyKB: number
  loadMs: number
  longTasks: number
  idleCpu: string
  fps: number
  heapMB: number
}
const rows: Row[] = []

for (const path of targets) {
  const context = await browser.newContext(viewport)
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Performance.enable')
  if (cpu > 1)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })

  // Record long tasks from the very first byte
  await page.addInitScript(() => {
    (window as any).__longTasks = 0
    new PerformanceObserver(list => (window as any).__longTasks += list.getEntries().length)
      .observe({ type: 'longtask', buffered: true })
  })

  if (blockThirdParty)
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.fulfill({ status: 200, body: '' }))

  let js = 0
  let total = 0
  let thirdParty = 0
  page.on('requestfinished', async (req) => {
    const size = Math.max(0, (await req.sizes().catch(() => undefined))?.responseBodySize ?? 0)
    total += size
    if (req.resourceType() === 'script')
      js += size
    if (!req.url().startsWith(`http://127.0.0.1:${PORT}`))
      thirdParty += size
  })

  await page.goto(`http://127.0.0.1:${PORT}${path}`, { waitUntil: 'load' })
  await page.waitForFunction(() => (document.querySelector('#app') as any)?.__vue_app__)
  await page.waitForLoadState('networkidle').catch(() => {})
  const loadMs = await page.evaluate(() => Math.round(performance.getEntriesByType('navigation')[0].duration))
  const art = await page.evaluate(() =>
    document.querySelector('[dark\\:invert] canvas')
      ? 'dots'
      : document.querySelector('.fixed.pointer-events-none canvas') ? 'plum' : 'none',
  )

  // Idle window: the visitor is reading, nothing should be burning CPU
  const metric = async (name: string) =>
    (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === name)?.value ?? 0
  if (trace)
    await browser.startTracing(page, { path: `.perf/${path.replace(/\W+/g, '_') || 'index'}.json` })
  const taskBefore = await metric('TaskDuration')
  // A string, not a function: tsx injects `__name()` helpers that don't exist in the page
  const frames: number = await page.evaluate(`new Promise((done) => {
    let n = 0
    const end = performance.now() + ${seconds * 1000}
    const tick = () => performance.now() >= end ? done(n) : (n++, requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })`)
  const taskAfter = await metric('TaskDuration')
  if (trace)
    await browser.stopTracing()

  rows.push({
    page: path,
    art,
    jsKB: Math.round(js / 1000),
    totalKB: Math.round(total / 1000),
    thirdPartyKB: Math.round(thirdParty / 1000),
    loadMs,
    longTasks: await page.evaluate(() => (window as any).__longTasks),
    idleCpu: `${Math.round(((taskAfter - taskBefore) / seconds) * 100)}%`,
    fps: Math.round(frames / seconds),
    heapMB: Math.round(await metric('JSHeapUsedSize') / 1e6),
  })
  await context.close()
}

await browser.close()
server.close()

console.log(`perf: ${mobile ? '390x844@3x' : '1440x900@2x'}, cpu throttle ${cpu}x, ${seconds}s idle window${blockThirdParty ? ', third parties blocked' : ''}`)
console.table(rows)
console.log('idleCpu = main-thread busy time while the page sits idle (100% = one core pinned)')
