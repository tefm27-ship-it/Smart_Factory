<script setup lang="ts">
import type { RoundAction } from './types'

const props = defineProps<{
  active?: RoundAction | RoundAction[] | null
  red?: boolean
  pulse?: RoundAction | null
}>()

const emit = defineEmits<{ action: [RoundAction] }>()

function isActive(key: RoundAction) {
  return Array.isArray(props.active) ? props.active.includes(key) : props.active === key
}

const items: { key: RoundAction; label: string; title: string }[] = [
  { key: 'locate', label: '定位', title: '将镜头定位到目标' },
  { key: 'call', label: '呼叫', title: '呼叫当班人员' },
  { key: 'stop', label: '停线', title: '停线 / 恢复' },
  { key: 'trace', label: '追踪', title: '显示物流追踪路径' },
]
</script>

<template>
  <div class="rounds">
    <button
      v-for="it in items"
      :key="it.key"
      class="round"
      :class="{ act: isActive(it.key) || pulse === it.key, red: red && it.key === 'stop' }"
      type="button"
      :title="it.title"
      @click="emit('action', it.key)"
    >
      <div class="c">
        <svg v-if="it.key === 'locate'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
          <circle cx="12" cy="12" r="6.4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        <svg v-else-if="it.key === 'call'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 12h3l2-5 3 10 2-5h6" />
        </svg>
        <svg v-else-if="it.key === 'stop'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
          <path d="M8 6v12M16 6v12" />
        </svg>
        <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 12a8 8 0 1 1 2.6 5.9" /><path d="M4 20v-4h4" />
        </svg>
      </div>
      <span>{{ it.label }}</span>
    </button>
  </div>
</template>
