<script setup lang="ts">
import type { ProcStation } from './types'

defineProps<{
  stations: ProcStation[]
  selectedId?: string | null
}>()

const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="sec-title"><span>工序流 / Process flow</span><span>点击工位定位</span></div>
  <div
    v-for="s in stations"
    :key="s.id"
    class="proc"
    :class="{ on: s.id === selectedId, hold: s.halted }"
    @click="emit('select', s.id)"
  >
    <i class="pd"></i><span class="pn">{{ s.short }}</span>
    <span class="pbar"><i :style="{ width: s.load + '%' }"></i></span>
    <span class="pv">{{ s.load }}%</span>
  </div>
</template>
