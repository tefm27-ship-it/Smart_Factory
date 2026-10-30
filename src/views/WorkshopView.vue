<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import LiveCard from '../components/LiveCard.vue'
import ProcessFlow from '../components/ProcessFlow.vue'
import type { KpiItem, KvRow, MetricItem, ProcStation, RoundAction } from '../components/types'
import type { SelectMeta, StationVM, WorkshopSceneApi } from '../scene/types'
import { createWorkshopScene } from '../scene/workshop'
import { WORKSHOP_SHIFT } from '../data/workshopShift'
import { getStationVM, WORKSHOP_META } from '../data/workshop/stations.source'
import { formatArea, formatNumber } from '../data/format'
import { useTheme } from '../composables/useTheme'
import { useToast } from '../composables/useToast'

const { dark, toggle } = useTheme()
const { show: toast } = useToast()

const canvasEl = ref<HTMLElement>()
const glEl = ref<HTMLElement>()
const tipEl = ref<HTMLElement>()
const popupShell = ref<any>()

let scene: WorkshopSceneApi | null = null

const shift = computed(() => WORKSHOP_SHIFT[dark.value ? 'night' : 'day'])
const selected = ref<StationVM | null>(null)
/** 首屏默认聚焦 ST-01，与三维场景初始选中一致；数值经数据源取回 */
const panelS = ref<StationVM>(getStationVM('ST-01'))
const stations = ref<ProcStation[]>([])
const auto = ref(false)
const tracing = ref(false)
const pulse = ref<RoundAction | null>(null)
const popupVisible = ref(false)

const kpis = computed<KpiItem[]>(() => {
  const d = shift.value
  return [
    { label: '当班产量 / Output', value: d.out, unit: '件', trend: d.outTrend, sub: '较上一班次', bar: d.outBar },
    { label: '节拍达成 / Tact', value: d.tact, decimals: 1, unit: '%', sub: d.tactSub, bar: d.tactBar, barColor: '#d79a3a' },
    { label: '在线工位 / Stations', value: d.dev, unit: '/ ' + formatNumber(d.stationsTotal), trend: d.devTrend, sub: '· ' + d.devStop, bar: d.devBar },
  ]
})

const panelStatus = computed(() => (panelS.value.halted ? '已停线' : '运行中'))

const activeKeys = computed<RoundAction[]>(() => {
  const keys: RoundAction[] = []
  if (panelS.value.halted) keys.push('stop')
  if (tracing.value) keys.push('trace')
  return keys
})

const metrics = computed<MetricItem[]>(() => [
  { label: '线体负载', value: panelS.value.load + '%', dot: '' },
  { label: '运行模式', value: panelS.value.mode },
  { label: '稼动率', value: panelS.value.oee.toFixed(1) + '%', dot: 'b' },
  { label: '在制工位', value: panelS.value.count + ' ' + panelS.value.unit, dot: 'a' },
])

const orderRows = computed<KvRow[]>(() => {
  const s = panelS.value
  return [
    { k: '计划节拍', v: s.tactTargetSec ? s.tactTargetSec + ' s / 件' : '—' },
    { k: '完成 / 目标', v: s.done },
    { k: '剩余工时', v: s.remain },
    { k: '面料批次', v: s.batch, mono: true },
    { k: '一次合格率', v: s.yieldPct.toFixed(1) + '%' },
  ]
})

const floorItems = computed(() => [
  { label: '车间', value: WORKSHOP_META.campusId },
  { label: '面积', value: formatArea(WORKSHOP_META.areaSqm) },
  { label: '在线工位', value: shift.value.foot },
])

const sparkColor = computed(() => (dark.value ? '#8b95ff' : '#4a56d8'))

const FLOW_IDS = ['FB-01', 'CT-02', 'ST-01', 'QC-01', 'PK-01', 'FG-01']
const FLOW_LABEL: Record<string, string> = {
  'FB-01': '面料',
  'CT-02': '裁剪',
  'ST-01': '缝制',
  'QC-01': '质检',
  'PK-01': '包装',
  'FG-01': '入库',
}

function refreshStations() {
  const all = scene?.getStations() ?? []
  stations.value = FLOW_IDS.flatMap((id) => {
    const s = all.find((x) => x.id === id)
    return s ? [{ ...s, short: FLOW_LABEL[id] ?? s.short }] : []
  })
}

function onSelect(vm: StationVM | null, meta: SelectMeta) {
  selected.value = vm
  if (vm) {
    panelS.value = vm
    if (meta.user || auto.value) popupVisible.value = true
  } else {
    popupVisible.value = false
  }
}

function flashPulse(key: RoundAction) {
  pulse.value = key
  window.setTimeout(() => {
    if (pulse.value === key) pulse.value = null
  }, 1100)
}

function toggleTheme() {
  toggle()
  toast(dark.value ? '已切换至 <b>夜班</b> · 车间照明与面板数据同步更新' : '已切换至 <b>白班</b> · 车间照明与面板数据同步更新')
}

function onAction(action: RoundAction) {
  const b = selected.value
  if (!b) return
  if (action === 'locate') {
    scene?.focusSelected()
    toast('已定位到 <b>' + b.id + ' ' + b.name + '</b>')
  } else if (action === 'call') {
    flashPulse('call')
    toast('已呼叫 <b>' + b.id + '</b> 当班组长 · 预计 2 分钟内响应')
  } else if (action === 'stop') {
    scene?.toggleHalt()
    refreshStations()
    toast(
      selected.value?.halted
        ? '<b>' + b.id + '</b> 已停线，工单转入待产'
        : '<b>' + b.id + '</b> 已恢复生产',
      !!selected.value?.halted,
    )
  } else {
    const on = scene?.toggleRoute() ?? false
    tracing.value = on
    toast(on ? '已开启 <b>物料追踪</b> · 面料 → 裁剪 → 缝制 → 质检 → 包装 → 成品' : '已关闭物料追踪')
  }
}

/* ActionRounds 已注释隐藏，保留交互逻辑与状态引用，便于后续恢复 */
void activeKeys
void onAction

function locateStation(id: string) {
  if (!scene?.selectById(id, true)) return
  const b = selected.value
  if (b) toast('已定位到 <b>' + b.id + ' ' + b.name + '</b>')
}

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
  scene = createWorkshopScene({
    host: glEl.value,
    canvasEl: canvasEl.value,
    tip: tipEl.value,
    popup: popupShell.value.el as HTMLElement,
    dark: dark.value,
    onSelect,
    onAuto: (on) => (auto.value = on),
  })
  refreshStations()
})

onBeforeUnmount(() => {
  scene?.dispose()
  scene = null
})
</script>

<template>
  <div class="fv fv--ws" :class="{ dark }">
    <div class="stage">
      <div class="window">
        <TopBar
          subtitle="车间 · 生产可视化"
          active="workshop"
          search-placeholder="搜索工位、工序、工单、设备…"
          context-label="车间:"
          :context-value="WORKSHOP_META.campusId + ' · ' + WORKSHOP_META.name"
          :shift-text="shift.shift"
          @toggle-theme="toggleTheme"
        />

        <div class="bodyarea">
          <section ref="canvasEl" class="canvas">
            <div id="gl" ref="glEl"></div>
            <div class="tip" ref="tipEl"></div>

            <KpiStack :items="kpis" />

            <LiveCard :data="shift" />

            <PopupShell ref="popupShell" :visible="popupVisible" :halt="!!selected?.halted">
              <div class="pp-head">
                <div class="pp-ico">{{ selected?.short }}</div>
                <div class="pp-title"><span>{{ selected ? selected.id + ' ' + selected.name : '' }}</span><span class="caret">▾</span></div>
                <StatusRing />
              </div>
              <div class="pp-sub mono">
                {{ selected ? selected.type + ' · ' + selected.count + ' ' + selected.unit + ' · ' + WORKSHOP_META.campusId : '' }}
              </div>
              <div class="pp-route">
                <div class="l"><b>{{ selected?.load }}%</b><span>线体负载</span></div>
                <div class="r"><b>{{ selected?.tact }}</b><span>当前节拍</span></div>
              </div>
              <div class="pp-chips">
                <div class="pill"><i class="dot"></i><span>{{ selected?.short }}</span></div>
                <div class="pill n">{{ selected ? selected.oee.toFixed(1) + '%' : '' }}</div>
                <div class="pill n">{{ selected?.count }}</div>
                <div class="pp-go">
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </PopupShell>

            <FloorLine tag="车间三维" :items="floorItems" hint="拖拽旋转 · 滚轮缩放 · 点击工位查看" />
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
              <div class="ph-title"><span>{{ panelS.id }}</span> <em>· {{ panelS.name }}</em></div>
              <div class="ph-x" title="取消选中" @click="closePanel">×</div>
              <div class="ph-chips">
                <span><i class="d" :class="{ r: panelS.halted }"></i><span>{{ panelStatus }}</span></span>
                <span><i class="d b"></i><span>{{ panelS.line }}</span></span>
                <span><i class="d m"></i><span>{{ panelS.count }} {{ panelS.unit }}</span></span>
              </div>
            </div>

            <!-- <ActionRounds :active="activeKeys" :red="panelS.halted" :pulse="pulse" @action="onAction" /> -->

            <MetricGrid :items="metrics" />

            <WorkOrderCard :title="panelS.order" :mode="panelS.mode" :rows="orderRows" />

            <ProcessFlow :stations="stations" :selected-id="selected?.id ?? null" @select="locateStation" />

            <SparkLine
              :values="shift.spark"
              :color="sparkColor"
              :title="shift.sparkTitle"
              :trend="shift.sparkTrend"
              :pad-lo="6"
              :pad-hi="3"
            />
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>
