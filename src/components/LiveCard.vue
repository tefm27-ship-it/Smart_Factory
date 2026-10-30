<script setup lang="ts">
import type { WorkshopShift } from '../data/workshopShift'

defineProps<{ data: WorkshopShift }>()
</script>

<template>
  <div class="livecard">
    <div class="lh"><i class="ldot"></i>实时 · 缝制一车间<span class="lv">LIVE</span></div>
    <div class="livegrid">
      <div><div class="k">在制数量</div><div class="v">{{ data.wip }}<i>件</i></div></div>
      <div><div class="k">一次良品率</div><div class="v">{{ data.yieldP }}<i>%</i></div></div>
      <div><div class="k">AGV 在线</div><div class="v">{{ data.agv }}<i>/ {{ data.agvTotal }} 台</i></div></div>
      <div><div class="k">吊挂在制</div><div class="v">{{ data.hang }}<i>件</i></div></div>
    </div>
    <div class="lfoot"><span>{{ data.liveOrder }}</span><b>{{ data.liveTact }}</b></div>
  </div>
</template>
