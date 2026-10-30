<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { text, warn, on } = useToast()
</script>

<template>
  <div class="toast" :class="{ on, warn }"><i class="td"></i><span v-html="text"></span></div>
</template>
