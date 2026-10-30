<template>
  <span ref="elRef">{{ defaultNumber }}</span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { CountUp } from 'countup.js'

const props = withDefaults(defineProps<{
  to: number
  from?: number
  duration?: number
  separator?: string
  decimalPlaces?: number
  defaultNumber?: number
}>(), {
  from: 0,
  duration: 2,
  separator: ',',
  decimalPlaces: 0,
  defaultNumber: 0,
})

const elRef = ref<HTMLElement>()
let countUpInstance: CountUp | null = null

function startAnimation() {
  if (!elRef.value) return
  countUpInstance = new CountUp(elRef.value, props.to, {
    startVal: props.from,
    duration: props.duration,
    separator: props.separator,
    decimalPlaces: props.decimalPlaces,
    useEasing: true,
  })
  countUpInstance.start()
}

onMounted(() => {
  startAnimation()
})

watch(() => props.to, () => {
  if (countUpInstance) {
    countUpInstance.update(props.to)
  } else {
    startAnimation()
  }
})
</script>
