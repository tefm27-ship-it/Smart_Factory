<script setup lang="ts">
import type { KpiItem } from './types'

withDefaults(defineProps<KpiItem>(), { decimals: 0, trend: '', sub: '', barColor: '' })
</script>

<template>
  <div class="kpi">
    <div class="k">{{ label }}</div>
    <div class="v">
      <b><AnimateNumber :to="value" :decimal-places="decimals" :duration="0.9" /></b><i>{{ unit }}</i>
    </div>
    <div class="sub">
      <span v-if="trend" class="trend">{{ trend }}</span>
      <span v-if="sub">{{ sub }}</span>
    </div>
    <div class="micro-bar"><i :style="{ width: bar + '%', background: barColor || undefined }"></i></div>
  </div>
</template>
