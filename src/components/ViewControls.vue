<script setup lang="ts">
defineProps<{ auto: boolean }>()

const emit = defineEmits<{
  auto: []
  reset: []
  zoomIn: []
  zoomOut: []
}>()
</script>

<template>
  <div class="viewctl">
    <div class="vgroup row">
      <button :class="{ on: auto }" title="自动巡览" @click="emit('auto')">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
        </svg>
        <span>{{ auto ? '巡览中' : '巡览' }}</span>
      </button>
      <button title="重置视角" @click="emit('reset')">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h6v6" /><path d="M20 20h-6v-6" /><path d="M20 8a8 8 0 0 0-14-2" /><path d="M4 16a8 8 0 0 0 14 2" />
        </svg>
        <span>复位</span>
      </button>
    </div>
    <div class="vgroup">
      <button aria-label="放大" @click="emit('zoomIn')">+</button>
      <button aria-label="缩小" @click="emit('zoomOut')">−</button>
    </div>
  </div>
</template>
