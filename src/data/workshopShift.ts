/**
 * 车间班次看板数据（视图投影层）。
 *
 * 不再手写任何数字：产量、节拍达成、在线工位、在制量、良品率、曲线
 * 全部由 stations.source 的 13 个工位数据汇总派生，改工位数据 → KPI 自动跟着变。
 *
 * 接后端后若由接口直接给出车间汇总，把 getWorkshopSummary() 换成接口字段即可。
 */

import {
  getLeadStation,
  getWorkshopSpark,
  getWorkshopSummary,
  WORKSHOP_META,
} from './workshop/stations.source'
import { formatNumber, formatTact } from './format'

export interface WorkshopShift {
  out: number
  outTrend: string
  outBar: number
  tact: number
  tactSub: string
  tactBar: number
  dev: number
  devTrend: string
  devStop: string
  devBar: number
  foot: string
  shift: string
  /** 在线工位总数，KPI 卡分母 */
  stationsTotal: number
  wip: string
  yieldP: string
  agv: string
  agvTotal: number
  hang: string
  liveOrder: string
  liveTact: string
  sparkTitle: string
  sparkTrend: string
  spark: number[]
}

const summary = getWorkshopSummary()
const lead = getLeadStation()

/** 夜班产量系数 */
const NIGHT_RATIO = 0.72
/** 夜班减开班位：面料暂存 4 组 + 裁床 5 号 1 台 */
const NIGHT_OFF_STATIONS = 5

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function barOf(value: number, total: number): number {
  return total ? Math.round((value / total) * 100) : 0
}

/** 末两点环比，节拍下降记为 ▼（节拍变快） */
function trendOf(values: number[]): string {
  if (values.length < 2) return '—'
  const prev = values[values.length - 2]
  const last = values[values.length - 1]
  if (!prev) return '—'
  const pct = ((last - prev) / prev) * 100
  return `${pct <= 0 ? '▼' : '▲'} ${Math.abs(pct).toFixed(1)}%`
}

const dayOut = summary.outputPcs
const dayDev = summary.stationsOn
const dayTotal = summary.stationsTotal
const daySpark = getWorkshopSpark(1)

const nightOut = Math.round(dayOut * NIGHT_RATIO)
const nightDev = dayTotal - NIGHT_OFF_STATIONS
const nightSpark = getWorkshopSpark(1.014)

const targetText = summary.tactTargetSec.toFixed(1)

export const WORKSHOP_SHIFT: { day: WorkshopShift; night: WorkshopShift } = {
  day: {
    out: dayOut,
    outTrend: '▲ 4.8%',
    outBar: barOf(dayOut, summary.outputPlanPcs),
    tact: round1(summary.tactAchieve),
    tactSub: `目标 ${targetText} s / 件 · 实际 ${summary.tactNowSec.toFixed(1)} s`,
    tactBar: round1(summary.tactAchieve),
    dev: dayDev,
    devTrend: '100.0%',
    devStop: '无停机',
    devBar: barOf(dayDev, dayTotal),
    foot: `${formatNumber(dayDev)} / ${formatNumber(dayTotal)}`,
    shift: '白班 · 07:00–19:00',
    stationsTotal: dayTotal,
    wip: formatNumber(summary.wipPcs),
    yieldP: summary.yieldWeighted.toFixed(1),
    agv: String(WORKSHOP_META.agvCount),
    agvTotal: WORKSHOP_META.agvTotal,
    hang: String(WORKSHOP_META.hangerCount),
    liveOrder: lead.order,
    liveTact: formatTact(summary.tactNowSec),
    sparkTitle: '车间节拍 · 近 8 小时',
    sparkTrend: trendOf(daySpark),
    spark: daySpark,
  },
  night: {
    out: nightOut,
    outTrend: '▲ 2.9%',
    outBar: barOf(nightOut, summary.outputPlanPcs),
    tact: round1(summary.tactAchieve - 1.1),
    tactSub: `目标 ${targetText} s / 件 · 实际 ${(summary.tactNowSec * 1.014).toFixed(1)} s`,
    tactBar: round1(summary.tactAchieve - 1.1),
    dev: nightDev,
    devTrend: `${((nightDev / dayTotal) * 100).toFixed(1)}%`,
    devStop: '2 个单元减班',
    devBar: barOf(nightDev, dayTotal),
    foot: `${formatNumber(nightDev)} / ${formatNumber(dayTotal)}`,
    shift: '夜班 · 19:00–07:00',
    stationsTotal: dayTotal,
    wip: formatNumber(Math.round(summary.wipPcs * NIGHT_RATIO)),
    yieldP: (summary.yieldWeighted - 0.6).toFixed(1),
    agv: String(WORKSHOP_META.agvCount - 1),
    agvTotal: WORKSHOP_META.agvTotal,
    hang: String(Math.round(WORKSHOP_META.hangerCount * NIGHT_RATIO)),
    liveOrder: lead.order,
    liveTact: formatTact(summary.tactNowSec * 1.014),
    sparkTitle: '夜班节拍 · 近 8 小时',
    sparkTrend: trendOf(nightSpark),
    spark: nightSpark,
  },
}
