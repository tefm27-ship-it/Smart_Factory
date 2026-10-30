<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '../components/TopBar.vue'
import KpiStack from '../components/KpiStack.vue'
import PopupShell from '../components/PopupShell.vue'
import StatusRing from '../components/StatusRing.vue'
import FloorLine from '../components/FloorLine.vue'
import ViewControls from '../components/ViewControls.vue'
import ToastHost from '../components/ToastHost.vue'
// import ActionRounds from '../components/ActionRounds.vue'
import MetricGrid from '../components/MetricGrid.vue'
import WorkOrderCard from '../components/WorkOrderCard.vue'
import SparkLine from '../components/SparkLine.vue'
import type { KpiItem, KvRow, MetricItem, RoundAction } from '../components/types'
import type { CampusBuildingVM, CampusSceneApi } from '../scene/types'
import { createCampusScene } from '../scene/campus'
import { CAMPUS_SHIFT, PLANT_MACHINES } from '../data/campusShift'
import { getBuildingVM } from '../data/campus/buildings.source'
import { formatMinutes, formatNumber } from '../data/campus/buildings.utils'
import { useTheme } from '../composables/useTheme'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { dark, toggle } = useTheme()
const { show: toast } = useToast()

const canvasEl = ref<HTMLElement>()
const glEl = ref<HTMLElement>()
const tipEl = ref<HTMLElement>()
const popupShell = ref<any>()

let scene: CampusSceneApi | null = null

const shift = computed(() => CAMPUS_SHIFT[dark.value ? 'night' : 'day'])
const selected = ref<CampusBuildingVM | null>(null)
/** 首屏默认聚焦 A-03，与三维场景初始选中一致；数值经数据源取回 */
const panelB = ref<CampusBuildingVM>(getBuildingVM('A-03'))
const auto = ref(false)
const tracing = ref(false)
const pulse = ref<RoundAction | null>(null)
const leaving = ref(false)

const kpis = computed<KpiItem[]>(() => {
  const d = shift.value
  return [
    { label: d.outK, value: d.out, unit: '件', trend: d.trend, sub: '较昨日同班次', bar: d.bar },
    { label: '设备综合效率 OEE', value: d.oee, decimals: 1, unit: '%', sub: d.oeeSub, bar: d.oeeBar, barColor: '#d79a3a' },
    { label: '在线机台', value: d.dev, unit: '/ ' + formatNumber(PLANT_MACHINES), trend: d.devTrend, sub: '· ' + d.devStop, bar: d.devBar },
  ]
})

const panelStatus = computed(() => (panelB.value.halted ? '已停线' : panelB.value.lines ? '运行中' : '待机'))

const activeKeys = computed<RoundAction[]>(() => {
  const keys: RoundAction[] = []
  if (panelB.value.halted) keys.push('stop')
  if (tracing.value) keys.push('trace')
  return keys
})

const metrics = computed<MetricItem[]>(() => {
  const b = panelB.value
  return [
    { label: '流水线负载', value: b.load + '%', dot: '' },
    { label: '运行模式', value: b.mode },
    { label: '稼动率', value: b.oee.toFixed(1) + '%', dot: 'b' },
    { label: '在制工单', value: b.lines ? b.lines + ' 条' : '—', dot: 'a' },
  ]
})

/** 该楼是否有在制工单：仓储 / 办公 / 公用工程为 false */
const hasOrders = computed(() => panelB.value.lines > 0)

const orderRows = computed<KvRow[]>(() => {
  const b = panelB.value
  if (!hasOrders.value) {
    return [
      { k: '计划节拍', v: '—' },
      { k: '完成 / 目标', v: '—' },
      { k: '剩余工时', v: '—' },
      { k: '在库批次', v: b.batch, mono: true },
      { k: '一次合格率', v: '—' },
    ]
  }
  return [
    { k: '计划节拍', v: b.tactSec + ' s / 件' },
    { k: '完成 / 目标', v: formatNumber(b.donePcs) + ' / ' + formatNumber(b.planPcs) + ' 件' },
    { k: '剩余工时', v: formatMinutes(b.remainMin) },
    { k: '面料批次', v: b.batch, mono: true },
    { k: '一次合格率', v: b.yieldPct.toFixed(1) + '%' },
  ]
})

/** 当前工单完成度，无工单时为 0 */
const orderProgress = computed(() => {
  const b = panelB.value
  return b.planPcs ? Math.round((b.donePcs / b.planPcs) * 100) : 0
})

const orderStartText = computed(() => (hasOrders.value ? panelB.value.startAt + ' 开始' : '—'))
const orderEtaText = computed(() =>
  hasOrders.value ? '进行中 · 剩余 ' + formatMinutes(panelB.value.remainMin) : '无在制工单',
)
const orderDoneText = computed(() =>
  hasOrders.value ? formatNumber(panelB.value.donePcs) + ' 件' : '—',
)
const orderPlanText = computed(() =>
  hasOrders.value ? formatNumber(panelB.value.planPcs) + ' 件' : '—',
)

const sparkTitle = computed(
  () => panelB.value.name + (hasOrders.value ? ' · 本班逐小时产出' : ' · 本班逐小时吞吐'),
)

/** 最近一小时对比上一小时的环比，避免拿首尾点算出夸张涨幅 */
const sparkTrend = computed(() => {
  const values = panelB.value.spark
  if (values.length < 2) return '—'
  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  if (!prev) return '—'
  const delta = ((last - prev) / prev) * 100
  return (delta >= 0 ? '▲ ' : '▼ ') + Math.abs(delta).toFixed(1) + '%'
})

const floorItems = computed(() => [
  { label: '厂区', value: 'A-01' },
  { label: '建筑面积', value: '28.6 万 m²' },
  { label: '在线机台', value: shift.value.foot },
])

const sparkColor = computed(() => (dark.value ? '#8b95ff' : '#4a56d8'))

function onSelect(vm: CampusBuildingVM | null) {
  selected.value = vm
  if (vm) panelB.value = vm
}

function flashPulse(key: RoundAction) {
  pulse.value = key
  window.setTimeout(() => {
    if (pulse.value === key) pulse.value = null
  }, 1100)
}

function enterWorkshop() {
  if (leaving.value) return
  leaving.value = true
  window.setTimeout(() => router.push('/workshop'), 150)
}

function toggleTheme() {
  toggle()
  toast(dark.value ? '已切换至 <b>夜班</b> · 厂区照明与面板数据同步更新' : '已切换至 <b>白班</b> · 厂区照明与面板数据同步更新')
}

function onAction(action: RoundAction) {
  const b = selected.value
  if (!b) return
  if (action === 'locate') {
    scene?.focusSelected()
    toast('已定位到 <b>' + b.id + ' ' + b.name + '</b>')
  } else if (action === 'call') {
    flashPulse('call')
    toast('已呼叫 <b>' + b.id + '</b> 值班 · 预计 2 分钟内响应')
  } else if (action === 'stop') {
    scene?.toggleHalt()
    toast(
      selected.value?.halted
        ? '<b>' + b.id + '</b> 已停线，工单转入待产'
        : '<b>' + b.id + '</b> 已恢复生产',
      !!selected.value?.halted,
    )
  } else {
    const on = scene?.toggleRoute() ?? false
    tracing.value = on
    toast(on ? '已开启 <b>物流追踪</b> · 面料仓 → 裁剪 → 缝制 → 整烫 → 成品仓' : '已关闭物流追踪')
  }
}

/* ActionRounds 已注释隐藏，保留交互逻辑与状态引用，便于后续恢复 */
void activeKeys
void onAction

function closePanel() {
  scene?.clearSelection()
  toast('已取消选中')
}

function toggleAuto() {
  scene?.setAuto(!auto.value)
}

function resetView() {
  scene?.reset()
}

function zoomIn() {
  scene?.zoom(0.84)
}

function zoomOut() {
  scene?.zoom(1.18)
}

watch(dark, (v) => scene?.applyTheme(v))

onMounted(() => {
  if (!canvasEl.value || !glEl.value || !tipEl.value || !popupShell.value?.el) return
  scene = createCampusScene({
    host: glEl.value,
    canvasEl: canvasEl.value,
    tip: tipEl.value,
    popup: popupShell.value.el as HTMLElement,
    dark: dark.value,
    onSelect,
    onAuto: (on) => (auto.value = on),
    onEnterWorkshop: enterWorkshop,
  })
})

onBeforeUnmount(() => {
  scene?.dispose()
  scene = null
})
</script>

<template>
  <div class="fv fv--campus" :class="{ dark }" :style="{ opacity: leaving ? 0 : 1 }">
    <div class="stage">
      <div class="window">
        <TopBar
          subtitle="厂区 · 生产可视化"
          active="campus"
          search-placeholder="搜索厂房、流水线、工单、机台…"
          context-label="上下文:"
          context-value="厂区 A"
          :shift-text="shift.shift"
          @toggle-theme="toggleTheme"
        />

        <div class="bodyarea">
          <section ref="canvasEl" class="canvas">
            <div class="clouds" aria-hidden="true"><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i></div>
            <div id="gl" ref="glEl"></div>
            <div class="tip" ref="tipEl"></div>

            <KpiStack :items="kpis" />

            <PopupShell ref="popupShell" :visible="!!selected" :halt="!!selected?.halted">
              <div class="pp-head">
                <div class="pp-ico">工</div>
                <div class="pp-title"><span>{{ selected?.name }}</span><span class="caret">▾</span></div>
                <StatusRing />
              </div>
              <div class="pp-sub mono">面料批次 0×52 … 2974</div>
              <div class="pp-route">
                <div class="l"><b>R02262</b><span>准时</span></div>
                <div class="r"><b>15min → SW019</b><span>起点 / 目的地</span></div>
              </div>
              <div class="pp-chips">
                <div class="pill"><i class="dot"></i>{{ selected?.id }}</div>
                <div class="pill n">1/2</div>
                <div class="pill n">2</div>
                <div
                  class="pp-go go"
                  :class="{ hide: !selected?.canEnter }"
                  role="button"
                  title="进入车间"
                  @click="enterWorkshop"
                >
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </PopupShell>

            <FloorLine tag="三维厂区" :items="floorItems" hint="拖拽旋转 · 滚轮缩放 · 点击厂房 / 环节聚焦" />
            <ViewControls
              :auto="auto"
              @auto="toggleAuto"
              @reset="resetView"
              @zoom-in="zoomIn"
              @zoom-out="zoomOut"
            />
            <ToastHost />
          </section>

          <aside class="panel">
            <div class="panel-head">
              <div class="ph-title"><span>{{ panelB.id }}</span> <em>· {{ panelB.name }}</em></div>
              <div class="ph-x" title="取消选中" @click="closePanel">×</div>
              <div class="ph-chips">
                <span><i class="d" :class="{ r: panelB.halted }"></i><span>{{ panelStatus }}</span></span>
                <span><i class="d b"></i>在线</span>
                <span><i class="d m"></i>流水线 A</span>
              </div>
            </div>

            <!-- <ActionRounds :active="activeKeys" :red="panelB.halted" :pulse="pulse" @action="onAction" /> -->

            <MetricGrid :items="metrics" />

            <WorkOrderCard :title="panelB.name" :mode="panelB.mode" :rows="orderRows" />

            <div class="sec-title">相关工单 / Related orders</div>

            <template v-if="hasOrders">
              <div class="order">
                <div class="oh">
                  <i class="ic">工</i><span class="id">{{ panelB.order }}</span><span class="eta">● +15min 预测</span>
                </div>
                <div class="sub">{{ panelB.type }} · 在制工单</div>
                <div class="track"><i :style="{ width: orderProgress + '%' }"></i><b :style="{ left: orderProgress + '%' }"></b></div>
                <div class="track-lbl"><span>{{ orderStartText }}</span><span>{{ orderEtaText }}</span></div>
                <div class="order-foot">
                  <div class="pill n">{{ orderDoneText }}</div>
                  <div class="pill n">{{ orderPlanText }}</div>
                  <div class="pill">{{ panelB.id }}</div>
                  <div class="pp-go" style="margin-left: auto">
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>

              <div class="order">
                <div class="oh">
                  <i class="ic" style="background: #8d8d87">工</i><span class="id">排队 · 待放行</span>
                  <span class="eta" style="color: var(--muted)">● 排队中</span>
                </div>
                <div class="sub">{{ panelB.type }} · 后道周转</div>
                <div class="track"><i style="width: 0%; background: var(--muted-2)"></i><b style="left: 0; border-color: var(--muted-2)"></b></div>
                <div class="track-lbl"><span>等待前道放行</span><span>—</span></div>
              </div>
            </template>

            <div v-else class="order">
              <div class="oh">
                <i class="ic" style="background: #8d8d87">库</i><span class="id">{{ panelB.order }}</span>
                <span class="eta" style="color: var(--muted)">● 无在制工单</span>
              </div>
              <div class="sub">{{ panelB.type }} · 仓储 / 公用环节</div>
              <div class="track-lbl"><span>{{ panelB.batch }}</span><span>—</span></div>
            </div>

            <SparkLine
              v-if="panelB.spark.length"
              :values="panelB.spark"
              :color="sparkColor"
              :title="sparkTitle"
              :trend="sparkTrend"
              :pad-lo="6"
              :pad-hi="3"
            />
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>
