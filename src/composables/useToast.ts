import { ref } from 'vue'

const text = ref('')
const warn = ref(false)
const on = ref(false)
let timer = 0

export function useToast() {
  function show(html: string, isWarn = false) {
    text.value = html
    warn.value = isWarn
    on.value = true
    clearTimeout(timer)
    timer = window.setTimeout(() => {
      on.value = false
    }, 3200)
  }
  return { text, warn, on, show }
}
