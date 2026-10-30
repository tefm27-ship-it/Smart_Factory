<script setup lang="ts">
import type { KvRow } from './types'

defineProps<{
  title: string
  mode: string
  rows: KvRow[]
}>()
</script>

<template>
  <div class="card">
    <div class="card-h"><i class="ic">W</i>工单 <span>{{ title }}</span><span class="r">{{ mode }}</span></div>
    <div class="card-body">
      <div v-for="row in rows" :key="row.k" class="kv">
        <span>{{ row.k }}</span><b :class="{ mono: row.mono }">{{ row.v }}</b>
      </div>
    </div>
  </div>
</template>
