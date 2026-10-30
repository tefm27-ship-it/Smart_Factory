<script setup lang="ts">
defineProps<{
  subtitle: string
  active: 'campus' | 'workshop'
  searchPlaceholder: string
  contextLabel: string
  contextValue: string
  shiftText: string
}>()

const emit = defineEmits<{ toggleTheme: [] }>()
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <svg class="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 18 L11 4 L13.6 9.2" /><path d="M8.6 13 H20" /><circle cx="18.5" cy="17.5" r="2.4" />
      </svg>
      <b>Operations</b><span>{{ subtitle }}</span>
    </div>
    <div class="navtabs">
      <RouterLink :class="{ on: active === 'campus' }" to="/">厂区总览</RouterLink>
      <RouterLink :class="{ on: active === 'workshop' }" to="/workshop">车间内景</RouterLink>
    </div>
    <div class="search">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 21 21" />
      </svg>
      {{ searchPlaceholder }}
    </div>
    <div class="tb-right">
      <div class="ctx"><span class="lbl">{{ contextLabel }}</span><span class="box"><i class="r">A</i>{{ contextValue }}</span></div>
      <div class="shift"><i></i><span>{{ shiftText }}</span></div>
      <button class="tgl" type="button" aria-label="切换明暗主题" @click="emit('toggleTheme')">
        <span class="knob"></span>
        <svg class="s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
        </svg>
        <svg class="m" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.4 8.4 0 1 0 10.6 10.6Z" />
        </svg>
      </button>
      <div class="btn"><span class="plus">+</span>新建工单</div>
      <div class="btn ghost">⋯</div>
    </div>
  </header>
</template>

<script lang="ts">
export default { name: 'TopBar' }
</script>
