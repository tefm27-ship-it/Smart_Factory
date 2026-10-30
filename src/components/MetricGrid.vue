<script setup lang="ts">
import type { MetricItem } from './types'

defineProps<{ items: MetricItem[] }>()
</script>

<template>
  <div class="rows">
    <div v-for="item in items" :key="item.label" class="cell">
      <div class="k"><i v-if="item.dot !== undefined" class="d" :class="item.dot"></i>{{ item.label }}</div>
      <div class="val">{{ item.value }}</div>
    </div>
  </div>
</template>
