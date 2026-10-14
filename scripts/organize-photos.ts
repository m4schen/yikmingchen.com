// The one way to add photos: drop JPG/PNG files into photos/ and run
//   pnpm organize-photos
// Safe to re-run. For every photo it:
//   1. renames new files to p-YYYY-MM-DD-HH-MM-SS-000-N.<ext> (EXIF capture time, else mtime)
//   2. compresses to <=1440px (q80) when that saves >10%, and always strips metadata (incl. GPS)
//   3. writes a .json sidecar ({ text, lang, blurhash }) and fills in a missing blurhash
// Then edit each sidecar's "text" (the caption). See ORGANIZE_PHOTOS.md.
import type { Buffer } from 'node:buffer'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import { encode as blurhashEncode } from 'blurhash'
import ExifReader from 'exifreader'
import { basename, extname, join, resolve } from 'pathe'
import sharp from 'sharp'
import { compressSharp } from './img-compress'

const PHOTOS_DIR = resolve('photos')
const ORGANIZED = /^p-\d{4}(?:-\d{2}){5}-\d{3}-\d+\.(?:jpg|png)$/i
const IMAGE = /\.(?:jpe?g|png)$/i

function captureTime(buffer: Buffer, mtime: Date): Date {
  try {
    const tags = ExifReader.load(buffer)
    const raw = (tags.DateTimeOriginal?.description || tags.DateTime?.description || '').trim()
    // "2025:04:04 06:04:06" -> local time
    const m = raw.match(/^(\d{4})\D(\d{2})\D(\d{2})\D(\d{2})\D(\d{2})\D(\d{2})/)
    if (m)
      return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
  }
  catch {}
  return mtime
}

function timestamp(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
}

async function readSidecar(file: string): Promise<Record<string, any>> {
  return existsSync(file) ? JSON.parse(await fs.readFile(file, 'utf-8')) : {}
}

const files = (await fs.readdir(PHOTOS_DIR)).filter(f => IMAGE.test(f)).sort()
let renamed = 0
let compressed = 0
let hashed = 0

for (const file of files) {
  let path = join(PHOTOS_DIR, file)
  const original = await fs.readFile(path)

  // 1. Rename
  if (!ORGANIZED.test(file)) {
    const ext = extname(file).toLowerCase().replace('.jpeg', '.jpg')
    const base = `p-${timestamp(captureTime(original, (await fs.stat(path)).mtime))}-000`
    let n = 1
    while (existsSync(join(PHOTOS_DIR, `${base}-${n}${ext}`)))
      n++
    const target = join(PHOTOS_DIR, `${base}-${n}${ext}`)
    await fs.rename(path, target)
    const sidecar = await readSidecar(target.replace(IMAGE, '.json'))
    sidecar.text ??= `Photo from ${basename(file, extname(file))}`
    sidecar.lang ??= 'en'
    await fs.writeFile(target.replace(IMAGE, '.json'), `${JSON.stringify(sidecar, null, 2)}\n`)
    console.log(`renamed     ${file} -> ${basename(target)}`)
    path = target
    renamed++
  }

  // 2. Compress
  const { outBuffer, percent, size, outSize, hasMetadata } = await compressSharp(sharp(original), original, path, path)
  if (percent < -0.1 || hasMetadata) {
    await fs.writeFile(path, outBuffer)
    console.log(`compressed  ${basename(path)} ${Math.round(size / 1000)} kB -> ${Math.round(outSize / 1000)} kB${hasMetadata ? ' (metadata stripped)' : ''}`)
    compressed++
  }

  // 3. Blurhash placeholder
  const sidecarPath = path.replace(IMAGE, '.json')
  const sidecar = await readSidecar(sidecarPath)
  if (!sidecar.blurhash) {
    const { data, info } = await sharp(await fs.readFile(path))
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'cover' })
      .toBuffer({ resolveWithObject: true })
    sidecar.blurhash = blurhashEncode(new Uint8ClampedArray(data), info.width, info.height, 4, 4)
    await fs.writeFile(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`)
    hashed++
  }
}

for (const json of (await fs.readdir(PHOTOS_DIR)).filter(f => f.endsWith('.json'))) {
  const stem = json.replace(/\.json$/, '')
  if (!['.jpg', '.png'].some(ext => existsSync(join(PHOTOS_DIR, stem + ext))))
    console.warn(`warning     ${json} has no matching photo`)
}

console.log(`organize-photos: ${files.length} photos, ${renamed} renamed, ${compressed} compressed, ${hashed} blurhashes added`)
