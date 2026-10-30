<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  values: number[]
  color?: string
  title: string
  trend: string
  padLo?: number
  padHi?: number
}>(), { color: '#4a56d8', padLo: 0, padHi: 0 })

const W = 268
const H = 56
const PAD = 5
const uid = 'sg' + Math.random().toString(36).slice(2, 9)

const geometry = computed(() => {
  const vals = props.values
  if (!vals.length) return { line: '', area: '', last: [0, 0] as [number, number] }
  const lo = Math.min(...vals) - props.padLo
  const hi = Math.max(...vals) + props.padHi
  const span = hi - lo || 1
  const pts = vals.map((v, i) => [
    PAD + i * (W - PAD * 2) / (vals.length - 1),
    H - PAD - ((v - lo) / span) * (H - PAD * 2),
  ])
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = line + ' L' + (W - PAD) + ' ' + H + ' L' + PAD + ' ' + H + ' Z'
  const last = pts[pts.length - 1] as [number, number]
  return { line, area, last }
})
</script>

<template>
  <div class="sparkwrap">
    <div class="st"><b>{{ title }}</b><span>{{ trend }}</span></div>
    <svg id="spark" viewBox="0 0 268 56" preserveAspectRatio="none">
      <defs>
        <linearGradient :id="uid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" :stop-color="color" stop-opacity=".22" />
          <stop offset="1" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path :d="geometry.area" :fill="`url(#${uid})`" />
      <path
        class="spark-line"
        :d="geometry.line"
        fill="none"
        :stroke="color"
        stroke-width="1.6"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <circle :cx="geometry.last[0]" :cy="geometry.last[1]" r="2.6" :fill="color" stroke="var(--card)" stroke-width="1.6" />
    </svg>
  </div>
</template>
