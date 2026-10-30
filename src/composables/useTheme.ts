import { ref, watch } from 'vue'

const STORAGE_KEY = 'fv-theme'

/** 无历史选择时默认夜班（dark）；用户手动切换过则沿用其选择 */
function stored(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === null ? true : saved === 'dark'
  } catch {
    return true
  }
}

const dark = ref(stored())

watch(dark, (v) => {
  try {
    localStorage.setItem(STORAGE_KEY, v ? 'dark' : 'light')
  } catch {
    /* storage disabled */
  }
})

export function useTheme() {
  return {
    dark,
    toggle() {
      dark.value = !dark.value
    },
  }
}
