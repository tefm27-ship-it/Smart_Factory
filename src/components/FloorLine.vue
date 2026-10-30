<script setup lang="ts">
defineProps<{
  tag: string
  items: { label: string; value: string }[]
  hint: string
}>()
</script>

<template>
  <div class="floorline">
    <span class="tag">▦ {{ tag }}</span>
    <span v-for="item in items" :key="item.label">{{ item.label }}: <b>{{ item.value }}</b></span>
    <span class="hint">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M4 12a8 8 0 1 1 2.5 5.8" /><path d="M4 20v-4h4" />
      </svg>
      {{ hint }}
    </span>
  </div>
</template>
