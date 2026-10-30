/**
 * 全厂班次看板数据（视图投影层）。
 *
 * 这里不再持有任何原始数据，只把 buildings.source 的汇总结果换算成
 * KPI 卡需要的形状（含夜班折算与展示文案）。改楼栋数据 → 顶部 KPI 自动跟着变。
 *
 * 将来后端直接给出全厂汇总时，把 getPlantSummary() 换成接口字段即可，
 * 本文件的其余逻辑保持不变。
 */

import { finishingSpark, getPlantSummary } from './campus/buildings.source'
import { formatNumber } from './campus/buildings.utils'

export interface CampusShift {
  outK: string
  out: number
  trend: string
  bar: number
  oee: number
  oeeSub: string
  oeeBar: number
  dev: number
  devTrend: string
  devStop: string
  devBar: number
  foot: string
  shift: string
  sparkTitle: string
  sparkTrend: string
  spark: number[]
}

const summary = getPlantSummary()

/** 夜班相对白班的产量系数与减班机台数 */
const NIGHT_RATIO = 0.72
const NIGHT_DOWN_MACHINES = 16

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** 全厂机台总数，KPI 卡分母使用 */
export const PLANT_MACHINES = summary.machinesAll

const dayFinished = summary.finishedPcs
const dayBarNum = summary.plannedPcs ? Math.round((dayFinished / summary.plannedPcs) * 100) : 0
const dayOee = round1(summary.oeeWeighted)
const dayDevPct = summary.machinesAll ? (summary.machinesOn / summary.machinesAll) * 100 : 0

const nightFinished = Math.round(summary.finishedPcs * NIGHT_RATIO)
const nightBarNum = summary.plannedPcs ? Math.round((nightFinished / summary.plannedPcs) * 100) : 0
const nightOee = round1(summary.oeeWeighted - 2.4)
const nightMachinesOn = summary.machinesOn - NIGHT_DOWN_MACHINES
const nightDevPct = summary.machinesAll ? (nightMachinesOn / summary.machinesAll) * 100 : 0

export const CAMPUS_SHIFT: { day: CampusShift; night: CampusShift } = {
  day: {
    outK: '成品产量 / Output',
    out: dayFinished,
    trend: '▲ 6.2%',
    bar: dayBarNum,
    oee: dayOee,
    oeeSub: `目标 92.0% · 差 ${(92 - dayOee).toFixed(1)}pt`,
    oeeBar: dayOee,
    dev: summary.machinesOn,
    devTrend: `${dayDevPct.toFixed(1)}%`,
    devStop: `停机 ${summary.machinesAll - summary.machinesOn} 台 · 动力站检修`,
    devBar: round1(dayDevPct),
    foot: `${formatNumber(summary.machinesOn)} / ${formatNumber(summary.machinesAll)}`,
    shift: '白班 · 07:00–19:00',
    sparkTitle: '成品产出 · 近 12 小时',
    sparkTrend: '▲ 4.3%',
    spark: finishingSpark(1),
  },
  night: {
    outK: '成品产量 / Output',
    out: nightFinished,
    trend: '▲ 3.4%',
    bar: nightBarNum,
    oee: nightOee,
    oeeSub: `目标 92.0% · 差 ${(92 - nightOee).toFixed(1)}pt`,
    oeeBar: nightOee,
    dev: nightMachinesOn,
    devTrend: `${nightDevPct.toFixed(1)}%`,
    devStop: `停机 ${summary.machinesAll - nightMachinesOn} 台 · 夜班减班`,
    devBar: round1(nightDevPct),
    foot: `${formatNumber(nightMachinesOn)} / ${formatNumber(summary.machinesAll)}`,
    shift: '夜班 · 19:00–07:00',
    sparkTitle: '成品产出 · 近 12 小时',
    sparkTrend: '▲ 2.7%',
    spark: finishingSpark(NIGHT_RATIO),
  },
}
