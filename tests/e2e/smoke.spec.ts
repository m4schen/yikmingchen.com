import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import fg from 'fast-glob'

// Every pre-rendered page in dist/, as a URL path
const pages = fg.sync('**/*.html', { cwd: 'dist', ignore: ['admin/**', '404.html'] })
  .map(file => `/${file.replace(/(?:^|\/)index\.html$/, '').replace(/\.html$/, '')}`)

if (!pages.length)
  throw new Error('dist/ is empty -- run `pnpm build` before `pnpm test:e2e`')

// Collects uncaught exceptions and console errors. (vite-ssg re-renders on the
// client instead of hydrating, so this catches runtime errors, not mismatches.)
// Third-party requests are stubbed so tests are deterministic and offline-safe.
async function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
  page.on('console', (msg) => {
    if (msg.type() !== 'error')
      return
    // Chromium logs the document's own 404 status; that is the point of the 404 test
    if (msg.text().startsWith('Failed to load resource') && msg.location().url === page.url())
      return
    errors.push(`console.error: ${msg.text()}`)
  })
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.fulfill({ status: 200, body: '' }))
  return errors
}

// Navigate and wait until Vue has mounted (it sets #app.__vue_app__),
// so clicks don't land on inert server-rendered HTML.
async function visit(page: Page, path: string, errors: string[] = []) {
  const response = await page.goto(path)
  await page.waitForFunction(() => (document.querySelector('#app') as any)?.__vue_app__, undefined, { timeout: 10_000 })
    .catch(() => {
      throw new Error(`Vue never mounted on ${path}\n${errors.join('\n')}`)
    })
  return response
}

for (const path of pages) {
  test(`${path} renders on the client without errors`, async ({ page }) => {
    const errors = await watchErrors(page)
    const response = await visit(page, path, errors)
    expect(response?.status()).toBe(200)
    await expect(page.locator('#app header nav')).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])
  })
}

test('unknown URLs get the site 404 page with status 404', async ({ page }) => {
  const errors = await watchErrors(page)
  const response = await visit(page, '/this/page/does-not-exist', errors)
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
})

test('[TEMPLATE] posts are not deployed', async ({ page }) => {
  // In dev, pages/posts/[TEMPLATE]-blog-example.md would match this URL
  const response = await visit(page, '/posts/anything-blog-example')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText('[TEMPLATE]')
})

test('nav bar reaches the blog and a post', async ({ page }) => {
  const errors = await watchErrors(page)
  await visit(page, '/', errors)
  await page.getByRole('link', { name: 'Blog' }).first().click()
  await expect(page).toHaveURL(/\/posts$/)
  const firstPost = page.locator('a.item').first()
  const href = await firstPost.getAttribute('href')
  await firstPost.click()
  await expect(page).toHaveURL(href!)
  await expect(page.locator('article')).not.toBeEmpty()
  expect(errors).toEqual([])
})

test('theme toggle switches dark mode and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await visit(page, '/')
  const html = page.locator('html')
  await expect(html).not.toHaveClass(/dark/)
  await page.getByTitle('Toggle Color Scheme').click()
  await expect(html).toHaveClass(/dark/)
  await page.reload()
  await expect(html).toHaveClass(/dark/)
})

test('photos open in a preview and close on Escape', async ({ page }) => {
  const errors = await watchErrors(page)
  await visit(page, '/photos', errors)
  const photo = page.locator('.photos img').first()
  await expect(photo).toBeVisible()
  await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  await photo.click()
  const preview = page.locator('div[backdrop-blur-7] > img') // App.vue image preview
  await expect(preview).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(preview).toBeHidden()
  expect(errors).toEqual([])
})

test('dots background animates, and holds still under reduced motion', async ({ page }) => {
  // Cheap checksum of the ArtDots canvas (src/components/ArtDots.vue)
  const frame = () => page.locator('[dark\\:invert] canvas').evaluate((canvas: HTMLCanvasElement) => {
    const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
    let sum = 0
    for (let i = 3; i < data.length; i += 4)
      sum = (sum + data[i] * (i % 9973)) % 2147483647
    return sum
  })
  await visit(page, '/projects')
  const first = await frame()
  await page.waitForTimeout(600)
  expect(await frame()).not.toBe(first)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(300)
  const still = await frame()
  await page.waitForTimeout(600)
  expect(await frame()).toBe(still)
})
