<script setup lang="ts">
import KpiCard from './KpiCard.vue'
import type { KpiItem } from './types'

defineProps<{ items: KpiItem[] }>()
</script>

<template>
  <div class="kpis">
    <KpiCard v-for="item in items" :key="item.label" v-bind="item" />
  </div>
</template>
