<template>
  <div class="preview-container">
开始
<p>
  <AnimateNumber :to="targetNumber" :duration="0.5" />
</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 目标数值，后续从接口获取
const targetNumber = ref(3000)
</script>

<style scoped>
.preview-container {
  width: 100%;
  height: 100vh;
  background-color: #b1bbc5;
}
</style>
