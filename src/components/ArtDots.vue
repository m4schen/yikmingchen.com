<script setup lang="ts">
import { createNoise3D } from 'simplex-noise'

// A grid of dots drifting on 3D simplex noise, drawn on a plain 2D canvas.
// Kept cheap on purpose (see docs/feature-map.md#performance): no WebGL library,
// 2px squares instead of arcs (half the raster cost, same look at this size),
// dots batched into a few fill() calls by opacity, 20fps (they drift <0.5px per
// frame), and a single still frame when the visitor prefers reduced motion.
const SCALE = 200
const LENGTH = 5
const SPACING = 15
const FPS = 20
const ALPHA_STEPS = 16

const el = useTemplateRef<HTMLCanvasElement>('el')
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const noise3d = createNoise3D()

let ctx: CanvasRenderingContext2D | undefined
let width = 0
let height = 0
let dots: { x: number, y: number, opacity: number }[] = []
// Flat [x0, y0, x1, y1, ...] positions per opacity step, reused every frame
const buckets: number[][] = Array.from({ length: ALPHA_STEPS }, () => [])

function layout() {
  const canvas = el.value
  if (!canvas)
    return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = window.innerWidth
  height = window.innerHeight
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#ccc'

  dots = []
  for (let x = -SPACING / 2; x < width + SPACING; x += SPACING) {
    for (let y = -SPACING / 2; y < height + SPACING; y += SPACING)
      dots.push({ x, y, opacity: Math.random() * 0.5 + 0.5 })
  }
}

function draw() {
  if (!ctx)
    return
  const t = Date.now() / 10000
  for (const bucket of buckets)
    bucket.length = 0

  for (const { x, y, opacity } of dots) {
    const rad = (noise3d(x / SCALE, y / SCALE, t) - 0.5) * 2 * Math.PI
    const len = (noise3d(x / SCALE, y / SCALE, t * 2) + 0.5) * LENGTH
    const alpha = (Math.abs(Math.cos(rad)) * 0.8 + 0.2) * opacity
    buckets[Math.min(ALPHA_STEPS - 1, Math.floor(alpha * ALPHA_STEPS))]
      .push(x + Math.cos(rad) * len, y + Math.sin(rad) * len)
  }

  ctx.clearRect(0, 0, width, height)
  for (let i = 0; i < ALPHA_STEPS; i++) {
    const bucket = buckets[i]
    if (!bucket.length)
      continue
    ctx.globalAlpha = (i + 0.5) / ALPHA_STEPS
    ctx.beginPath()
    for (let j = 0; j < bucket.length; j += 2)
      ctx.rect(bucket[j] - 1, bucket[j + 1] - 1, 2, 2)
    ctx.fill()
  }
}

const loop = useRafFn(draw, { fpsLimit: FPS, immediate: false })

function start() {
  layout()
  draw()
  if (reducedMotion.value)
    loop.pause()
  else
    loop.resume()
}

onMounted(start)
watch(reducedMotion, start)
useEventListener('resize', useDebounceFn(start, 200))
</script>

<template>
  <div z--1 fixed inset-0 pointer-events-none dark:invert print:hidden>
    <canvas ref="el" />
  </div>
</template>
