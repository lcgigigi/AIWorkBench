<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasEl = ref<HTMLCanvasElement | null>(null)

interface Dot {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  alpha: number
  hue: number
}

let teardown: (() => void) | null = null

function clampPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 1.8)
}

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return

  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  let width = 0
  let height = 0
  let dpr = 1
  let rafId = 0
  let running = true

  const dots: Dot[] = []
  const DOT_COUNT = 90

  function resetCanvasSize() {
    dpr = clampPixelRatio()
    width = window.innerWidth
    height = window.innerHeight

    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function buildDots() {
    dots.length = 0
    for (let i = 0; i < DOT_COUNT; i++) {
      const speed = 0.1 + Math.random() * 0.35
      const angle = Math.random() * Math.PI * 2
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.8 + Math.random() * 2.2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 0.12 + Math.random() * 0.25,
        hue: Math.random() > 0.5 ? 222 : 332,
      })
    }
  }

  function drawBackground(ts: number) {
    ctx.clearRect(0, 0, width, height)

    const t = ts * 0.00015

    const gradA = ctx.createRadialGradient(
      width * 0.15,
      height * 0.2,
      10,
      width * 0.15,
      height * 0.2,
      width * 0.5,
    )
    gradA.addColorStop(0, 'rgba(99, 102, 241, 0.18)')
    gradA.addColorStop(1, 'rgba(99, 102, 241, 0)')

    const gradB = ctx.createRadialGradient(
      width * 0.88,
      height * 0.82,
      10,
      width * 0.88,
      height * 0.82,
      width * 0.52,
    )
    gradB.addColorStop(0, 'rgba(236, 72, 153, 0.16)')
    gradB.addColorStop(1, 'rgba(236, 72, 153, 0)')

    const gradC = ctx.createRadialGradient(
      width * 0.78,
      height * 0.14,
      10,
      width * 0.78,
      height * 0.14,
      width * 0.36,
    )
    gradC.addColorStop(0, 'rgba(56, 189, 248, 0.12)')
    gradC.addColorStop(1, 'rgba(56, 189, 248, 0)')

    ctx.fillStyle = gradA
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = gradB
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = gradC
    ctx.fillRect(0, 0, width, height)

    for (const dot of dots) {
      dot.x += dot.vx
      dot.y += dot.vy

      if (dot.x < -12) dot.x = width + 12
      if (dot.x > width + 12) dot.x = -12
      if (dot.y < -12) dot.y = height + 12
      if (dot.y > height + 12) dot.y = -12

      const pulse = 0.65 + Math.sin(t + dot.x * 0.01 + dot.y * 0.008) * 0.35
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${dot.hue}, 88%, 72%, ${dot.alpha * pulse})`
      ctx.fill()
    }

    ctx.strokeStyle = 'rgba(129, 140, 248, 0.08)'
    ctx.lineWidth = 1
    for (let i = 0; i < dots.length; i += 3) {
      const a = dots[i]
      const b = dots[(i + 17) % dots.length]
      if (!a || !b) continue
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 140) continue
      ctx.globalAlpha = 1 - dist / 140
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  const render = (ts: number) => {
    if (!running) return
    rafId = window.requestAnimationFrame(render)
    drawBackground(ts)
  }

  function startOrStop() {
    if (reduceMotion.matches) {
      if (rafId) window.cancelAnimationFrame(rafId)
      rafId = 0
      drawBackground(0)
      return
    }
    if (!rafId) {
      rafId = window.requestAnimationFrame(render)
    }
  }

  const onResize = () => {
    resetCanvasSize()
    buildDots()
    drawBackground(0)
  }

  const onVisibility = () => {
    running = document.visibilityState !== 'hidden'
    if (!running && rafId) {
      window.cancelAnimationFrame(rafId)
      rafId = 0
      return
    }
    startOrStop()
  }

  resetCanvasSize()
  buildDots()
  drawBackground(0)
  startOrStop()

  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibility)
  reduceMotion.addEventListener('change', startOrStop)

  teardown = () => {
    running = false
    if (rafId) window.cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibility)
    reduceMotion.removeEventListener('change', startOrStop)
  }
})

onBeforeUnmount(() => {
  teardown?.()
  teardown = null
})
</script>

<template>
  <div class="ambient-bg" aria-hidden="true">
    <canvas ref="canvasEl" class="ambient-canvas"></canvas>
    <div class="ambient-vignette"></div>
  </div>
</template>

<style scoped>
.ambient-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.ambient-canvas {
  width: 100%;
  height: 100%;
  display: block;
  filter: saturate(1.04);
}

.ambient-vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 4% 10%, rgba(129, 140, 248, 0.2), transparent 34%),
    radial-gradient(circle at 86% 88%, rgba(244, 114, 182, 0.16), transparent 38%),
    linear-gradient(180deg, rgba(238, 244, 255, 0.2), rgba(238, 244, 255, 0.52));
}
</style>
