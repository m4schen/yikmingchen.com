// Enforces the mechanical rules of docs/style-guide.md on the source.
// Usage: pnpm lint:style   (part of `pnpm check` and CI)
//
//   - color: no hue utilities (text-blue-500, btn-rose...) and no chromatic hex
//     colors in pages and components; greys are fine
//   - weight: nothing above 600 (only 400/500/600 ship)
//   - fonts: only sans / mono / condensed, and condensed only for magic links
//   - Chinese: full-width punctuation, and a space between Chinese and Latin/digits
import { readFileSync } from 'node:fs'
import process from 'node:process'
import fg from 'fast-glob'

// Places where color carries meaning (docs/style-guide.md#color). Keep this short.
const COLOR_ALLOWED: Record<string, string> = {
  'src/components/WrapperPost.vue': 'the dev-only draft banner works like an alert',
}
const CONDENSED_ALLOWED = ['src/styles/markdown.css'] // magic-link chips

const HUE = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const HUE_UTILITY = new RegExp(`(?<![\\w-])(?:text|bg|border|ring|fill|stroke|from|via|to|decoration|outline|divide|accent|caret|shadow|btn)-(?:${HUE})(?![a-z])`, 'g')
const HUE_ATTR = new RegExp(`(?<![\\w-])(?:text|bg|border|ring|fill|stroke|decoration|outline|shadow)="[^"]*\\b(?:${HUE})\\b[^"]*"`, 'g')
const HEX = /(?:(?<=[\s"'(:[,])#|hex-)([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi
const HEAVY = /(?<![\w-])font-(?:bold|extrabold|black|[789]00)(?![\w-])|font-weight:\s*(?:bold|[789]00)/g
// font-<family> utilities; skips CSS properties (font-size...) and weights (checked above)
const FONT_UTILITY = /(?<![\w-])font-(?!sans|mono|condensed|normal|light|medium|semibold|thin|bold|extrabold|black|italic|size|weight|family|style|feature|display|variant|stretch|synthesis|kerning|optical|\d|\[)([a-z]+)(?![\w:-])/g
const CJK = '\\u4E00-\\u9FFF'
// In a Chinese sentence: a half-width mark right after a character, or "(" before one.
// English sentences that gloss a Chinese term keep English punctuation: Knapsack (背包问题)
const HALF_WIDTH = new RegExp(`[${CJK}][ \\t]*[,;:!?)]|\\([ \\t]*[${CJK}]`, 'g')
const CJK_CHAR = new RegExp(`[${CJK}]`, 'g')
const NO_SPACE = new RegExp(`[${CJK}][a-z0-9]|[a-z0-9][${CJK}]`, 'gi')

const errors: string[] = []

function isChromatic(hex: string) {
  const h = hex.length <= 4 ? [...hex.slice(0, 3)].map(c => c + c).join('') : hex.slice(0, 6)
  const [r, g, b] = [0, 2, 4].map(i => Number.parseInt(h.slice(i, i + 2), 16))
  return Math.max(r, g, b) - Math.min(r, g, b) > 8
}

// Markdown minus the parts that aren't prose or markup: frontmatter, code, ruby notes
function markdownSource(text: string) {
  return text
    .replace(/^---\n[\s\S]*?\n---\n/, m => '\n'.repeat(m.split('\n').length - 1))
    .replace(/```[\s\S]*?```/g, m => '\n'.repeat(m.split('\n').length - 1))
    .replace(/`[^`\n]*`/g, '')
}

function report(file: string, text: string, index: number, message: string) {
  const line = text.slice(0, index).split('\n').length
  errors.push(`${file}:${line}  ${message}`)
}

const files = await fg(['pages/**/*.md', 'src/**/*.{vue,css,ts}', 'index.html'], { ignore: ['**/*.d.ts'] })
for (const file of files) {
  const raw = readFileSync(file, 'utf-8')
  const text = file.endsWith('.md') ? markdownSource(raw) : raw

  if (!COLOR_ALLOWED[file] && !file.startsWith('src/styles/')) {
    for (const m of text.matchAll(HUE_UTILITY))
      report(file, text, m.index!, `color "${m[0]}" -- the site is monochrome; emphasize with font-semibold and full-contrast text`)
    for (const m of text.matchAll(HUE_ATTR))
      report(file, text, m.index!, `color "${m[0]}" -- the site is monochrome`)
    for (const m of text.matchAll(HEX)) {
      if (isChromatic(m[1]) && !/(?:href|to)=["']$/.test(text.slice(Math.max(0, m.index! - 6), m.index!)))
        report(file, text, m.index!, `chromatic color "${m[0]}" -- use a grey (equal R, G and B)`)
    }
  }

  for (const m of text.matchAll(HEAVY))
    report(file, text, m.index!, `"${m[0]}" -- only weights 400/500/600 ship; use font-semibold (600)`)

  for (const m of text.matchAll(FONT_UTILITY))
    report(file, text, m.index!, `font "${m[0]}" -- only font-sans, font-mono and (for magic links) font-condensed`)
  if (/font-condensed/.test(text) && !CONDENSED_ALLOWED.includes(file))
    report(file, text, text.indexOf('font-condensed'), '"font-condensed" is only for magic-link chips (src/styles/markdown.css)')

  if (file.endsWith('.md')) {
    // Chinese typography, on prose only: drop tags, ruby parentheses, links' URLs
    const prose = text
      .replace(/<rp>[^<]*<\/rp>/g, '')
      // tags become a separator, so text on either side of a tag isn't "adjacent"
      .replace(/<[^>\n]+>/g, m => '\u0001'.repeat(m.length))
      .replace(/\]\([^)\n]*\)/g, m => ` ${' '.repeat(m.length - 1)}`)
      .replace(/https?:\/\/\S+/g, m => ' '.repeat(m.length))
    let offset = 0
    for (const line of prose.split('\n')) {
      const isChinese = (line.match(CJK_CHAR)?.length ?? 0) >= (line.match(/[a-z]/gi)?.length ?? 0)
      if (isChinese) {
        for (const m of line.matchAll(HALF_WIDTH))
          report(file, prose, offset + m.index!, `"${m[0]}" -- use full-width punctuation in Chinese text (，。：；！？（）)`)
      }
      offset += line.length + 1
    }
    for (const m of prose.matchAll(NO_SPACE))
      report(file, prose, m.index!, `"${m[0]}" -- put a space between Chinese and Latin letters or digits`)
  }
}

const fonts = readFileSync('unocss.config.ts', 'utf-8').match(/fonts: *\{((?:[^{}]|\{[^{}]*\})*)\}/)?.[1] ?? ''
const families = [...fonts.matchAll(/^\s*(\w+):/gm)].map(m => m[1])
for (const family of families.filter(f => !['sans', 'mono', 'condensed'].includes(f)))
  errors.push(`unocss.config.ts  font family "${family}" -- the guide allows sans, mono and condensed only`)

for (const e of errors)
  console.log(`  ERROR ${e}`)
console.log(`style: ${files.length} files, ${errors.length} error(s) -- rules in docs/style-guide.md`)
process.exit(errors.length ? 1 : 0)
