<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const THREE_URL = 'https://unpkg.com/three@0.179.1/build/three.module.js'

let teardown: (() => void) | null = null

onMounted(async () => {
  const canvas = canvasEl.value
  if (!canvas) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  let THREE: any
  try {
    THREE = await import(/* @vite-ignore */ THREE_URL)
  } catch {
    // Three.js 加载失败时保持静态背景
    return
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.setSize(window.innerWidth, window.innerHeight, false)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 120)
  camera.position.set(0, 0, 16)
  scene.fog = new THREE.Fog(0xd7dee8, 10, 36)
  const root = new THREE.Group()
  scene.add(root)

  const disposers: Array<() => void> = []

  const haloA = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 28, 28),
    new THREE.MeshBasicMaterial({
      color: '#8b9eff',
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  haloA.position.set(-6.6, -4.6, -4.5)

  const haloB = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 26, 26),
    new THREE.MeshBasicMaterial({
      color: '#f4a7d8',
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  haloB.position.set(6.8, 4.5, -5.6)

  const haloC = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 24, 24),
    new THREE.MeshBasicMaterial({
      color: '#7dd3fc',
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  haloC.position.set(-7.6, 5.2, -3.2)
  root.add(haloA, haloB, haloC)

  const randomEdgePoint = (xRange: number, yRange: number, safeX: number, safeY: number) => {
    let x = 0
    let y = 0
    let guard = 0
    do {
      x = (Math.random() - 0.5) * xRange
      y = (Math.random() - 0.5) * yRange
      guard++
    } while (Math.abs(x) < safeX && Math.abs(y) < safeY && guard < 14)
    return { x, y }
  }

  const buildPointCloud = (cfg: {
    count: number
    xRange: number
    yRange: number
    zMin: number
    zMax: number
    safeX: number
    safeY: number
    size: number
    opacity: number
    driftAmp: number
    driftSpeed: number
  }) => {
    const positions = new Float32Array(cfg.count * 3)
    const colors = new Float32Array(cfg.count * 3)
    const baseX = new Float32Array(cfg.count)
    const baseY = new Float32Array(cfg.count)
    const baseZ = new Float32Array(cfg.count)
    const phase = new Float32Array(cfg.count)
    const palette = ['#94a3ff', '#7dd3fc', '#f0abfc', '#c4b5fd']
    const color = new THREE.Color()

    for (let i = 0; i < cfg.count; i++) {
      const p = randomEdgePoint(cfg.xRange, cfg.yRange, cfg.safeX, cfg.safeY)
      const z = cfg.zMin + Math.random() * (cfg.zMax - cfg.zMin)
      const i3 = i * 3

      baseX[i] = p.x
      baseY[i] = p.y
      baseZ[i] = z
      phase[i] = Math.random() * Math.PI * 2

      positions[i3] = p.x
      positions[i3 + 1] = p.y
      positions[i3 + 2] = z

      color.set(palette[i % palette.length] ?? '#94a3ff')
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: cfg.size,
      transparent: true,
      opacity: cfg.opacity,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const points = new THREE.Points(geometry, material)
    root.add(points)

    disposers.push(() => {
      geometry.dispose()
      material.dispose()
    })

    return {
      positions,
      baseX,
      baseY,
      baseZ,
      phase,
      attr: geometry.getAttribute('position'),
      points,
      driftAmp: cfg.driftAmp,
      driftSpeed: cfg.driftSpeed,
    }
  }

  const nearCloud = buildPointCloud({
    count: 860,
    xRange: 22,
    yRange: 14,
    zMin: -2.5,
    zMax: 7.5,
    safeX: 7.2,
    safeY: 4.2,
    size: 0.1,
    opacity: 0.62,
    driftAmp: 0.28,
    driftSpeed: 1.1,
  })

  const farCloud = buildPointCloud({
    count: 640,
    xRange: 26,
    yRange: 17,
    zMin: -20,
    zMax: -7,
    safeX: 7.8,
    safeY: 4.8,
    size: 0.075,
    opacity: 0.36,
    driftAmp: 0.2,
    driftSpeed: 0.78,
  })

  const segmentCount = 220
  const segPositions = new Float32Array(segmentCount * 2 * 3)
  const segBase = new Float32Array(segmentCount * 2 * 3)
  const segPhase = new Float32Array(segmentCount)
  const segGeometry = new THREE.BufferGeometry()

  for (let i = 0; i < segmentCount; i++) {
    const i6 = i * 6
    const p1 = randomEdgePoint(22, 14, 7.8, 4.6)
    const p2 = randomEdgePoint(22, 14, 7.8, 4.6)
    const z1 = -4 + Math.random() * 10
    const z2 = -4 + Math.random() * 10
    segBase[i6] = p1.x
    segBase[i6 + 1] = p1.y
    segBase[i6 + 2] = z1
    segBase[i6 + 3] = p2.x
    segBase[i6 + 4] = p2.y
    segBase[i6 + 5] = z2
    segPositions[i6] = p1.x
    segPositions[i6 + 1] = p1.y
    segPositions[i6 + 2] = z1
    segPositions[i6 + 3] = p2.x
    segPositions[i6 + 4] = p2.y
    segPositions[i6 + 5] = z2
    segPhase[i] = Math.random() * Math.PI * 2
  }

  segGeometry.setAttribute('position', new THREE.BufferAttribute(segPositions, 3))
  const segMaterial = new THREE.LineBasicMaterial({
    color: '#9aa7ff',
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const segments = new THREE.LineSegments(segGeometry, segMaterial)
  root.add(segments)
  disposers.push(() => {
    segGeometry.dispose()
    segMaterial.dispose()
  })

  const wireA = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.28, 0),
    new THREE.MeshBasicMaterial({
      color: '#8ea0ff',
      wireframe: true,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    }),
  )
  wireA.position.set(8.2, -4.8, -2)

  const wireB = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.08, 0),
    new THREE.MeshBasicMaterial({
      color: '#f7a7d2',
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
  )
  wireB.position.set(-8.3, 5.1, -3.4)

  const wireC = new THREE.Mesh(
    new THREE.TetrahedronGeometry(1.22, 0),
    new THREE.MeshBasicMaterial({
      color: '#7dd3fc',
      wireframe: true,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  )
  wireC.position.set(-8.7, -4.9, -1.1)

  root.add(wireA, wireB, wireC)
  disposers.push(() => {
    ;(wireA.geometry as any).dispose?.()
    ;(wireA.material as any).dispose?.()
    ;(wireB.geometry as any).dispose?.()
    ;(wireB.material as any).dispose?.()
    ;(wireC.geometry as any).dispose?.()
    ;(wireC.material as any).dispose?.()
  })
  disposers.push(() => {
    ;(haloA.geometry as any).dispose?.()
    ;(haloA.material as any).dispose?.()
    ;(haloB.geometry as any).dispose?.()
    ;(haloB.material as any).dispose?.()
    ;(haloC.geometry as any).dispose?.()
    ;(haloC.material as any).dispose?.()
  })

  let targetX = 0
  let targetY = 0
  let cameraX = 0
  let cameraY = 0
  let rafId = 0
  let lastTs = 0
  let running = true

  const frameBudget = 1000 / 42

  const onPointerMove = (e: PointerEvent) => {
    const nx = e.clientX / window.innerWidth - 0.5
    const ny = e.clientY / window.innerHeight - 0.5
    targetX = nx * 1.2
    targetY = -ny * 0.92
  }

  const onPointerLeave = () => {
    targetX = 0
    targetY = 0
  }

  const onResize = () => {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  const onVisibility = () => {
    running = document.visibilityState !== 'hidden'
    if (running) {
      lastTs = 0
      rafId = window.requestAnimationFrame(render)
    }
  }

  const render = (ts: number) => {
    if (!running) return
    rafId = window.requestAnimationFrame(render)
    if (lastTs && ts - lastTs < frameBudget) return

    const elapsed = ts * 0.00032
    lastTs = ts

    const updateCloud = (cloud: any, speedMul: number) => {
      for (let i = 0; i < cloud.phase.length; i++) {
        const i3 = i * 3
        const drift = cloud.phase[i]
        cloud.positions[i3] = cloud.baseX[i] + Math.sin(elapsed * cloud.driftSpeed * speedMul + drift) * cloud.driftAmp
        cloud.positions[i3 + 1] =
          cloud.baseY[i] + Math.cos(elapsed * cloud.driftSpeed * 1.19 * speedMul + drift) * cloud.driftAmp * 0.8
        cloud.positions[i3 + 2] =
          cloud.baseZ[i] + Math.sin(elapsed * cloud.driftSpeed * 0.86 * speedMul + drift) * cloud.driftAmp * 0.54
      }
      cloud.attr.needsUpdate = true
    }

    updateCloud(nearCloud, 1)
    updateCloud(farCloud, 0.78)

    const segAttr = segGeometry.getAttribute('position') as any
    for (let i = 0; i < segmentCount; i++) {
      const i6 = i * 6
      const p = segPhase[i]
      const wobble = Math.sin(elapsed * 1.35 + p) * 0.12
      segPositions[i6] = segBase[i6] + wobble
      segPositions[i6 + 1] = segBase[i6 + 1] + Math.cos(elapsed * 1.08 + p) * 0.12
      segPositions[i6 + 2] = segBase[i6 + 2] + Math.sin(elapsed * 0.93 + p) * 0.1
      segPositions[i6 + 3] = segBase[i6 + 3] + Math.cos(elapsed * 1.21 + p) * 0.1
      segPositions[i6 + 4] = segBase[i6 + 4] + wobble
      segPositions[i6 + 5] = segBase[i6 + 5] + Math.cos(elapsed * 0.88 + p) * 0.1
    }
    segAttr.needsUpdate = true

    nearCloud.points.rotation.z = elapsed * 0.34
    farCloud.points.rotation.z = -elapsed * 0.22
    segments.rotation.z = elapsed * 0.14

    wireA.rotation.x = elapsed * 1.8
    wireA.rotation.y = elapsed * 1.1
    wireB.rotation.x = -elapsed * 1.4
    wireB.rotation.z = elapsed * 1.5
    wireC.rotation.y = elapsed * 1.6
    wireC.rotation.z = -elapsed * 1.15

    haloA.position.x = -6.6 + Math.sin(elapsed * 1.28) * 0.3
    haloB.position.y = 4.5 + Math.sin(elapsed * 1.06) * 0.24
    haloC.position.x = -7.6 + Math.cos(elapsed * 0.95) * 0.18

    root.rotation.z = Math.sin(elapsed * 0.35) * 0.03
    root.rotation.x = Math.cos(elapsed * 0.22) * 0.02

    cameraX += (targetX - cameraX) * 0.045
    cameraY += (targetY - cameraY) * 0.045
    camera.position.x = cameraX
    camera.position.y = cameraY
    camera.position.z = 16 + Math.sin(elapsed * 0.8) * 0.45
    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)
  }

  window.addEventListener('resize', onResize)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', onPointerLeave, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)

  rafId = window.requestAnimationFrame(render)

  teardown = () => {
    running = false
    window.cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerleave', onPointerLeave)
    document.removeEventListener('visibilitychange', onVisibility)
    for (const dispose of disposers) dispose()
    renderer.dispose()
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
  filter: saturate(1.05);
}

.ambient-vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 8% 10%, rgba(147, 197, 253, 0.22), transparent 36%),
    radial-gradient(circle at 90% 88%, rgba(244, 114, 182, 0.18), transparent 34%),
    radial-gradient(circle at 78% 14%, rgba(129, 140, 248, 0.14), transparent 30%),
    radial-gradient(circle at 22% 90%, rgba(125, 211, 252, 0.12), transparent 28%);
}
</style>
