<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  visible: boolean
  halt?: boolean
}>()

const el = ref<HTMLElement>()
defineExpose({ el })
</script>

<template>
  <div ref="el" class="popup" :class="{ halt: !!halt }" :style="{ opacity: visible ? 1 : 0 }">
    <slot />
  </div>
</template>
