import { ref, watch } from 'vue'

const STORAGE_KEY = 'fv-theme'

function stored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark'
  } catch {
    return false
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
