/**
 * 车间工位数据源——视图与三维场景唯一的入口。
 *
 * 接真实数据时只改本文件（fetch + adapt），视图与场景不用动：
 *   1. loadStations() 换成 fetch('/api/workshop/A-03/stations')
 *   2. 拿到结果后写入 cache / index
 *   3. 车间级汇总若由后端计算，getWorkshopSummary() 直接返回接口字段
 */

import { MOCK_STATIONS, WORKSHOP_META } from './stations.mock'
import { buildTactSpark, toStationVM } from './stations.utils'
import type { StationDTO } from './stations.contract'
import type { StationVM } from '../../scene/types'

export { WORKSHOP_META }

/** 当班产量取包装完成量（成品产出环节） */
const OUTPUT_ID = 'PK-01'
/** 主导工位：LiveCard 的工单与节拍取自这里 */
const LEAD_ID = 'ST-01'
/** 缝制单元，用于统计在制量 */
const SEWING_IDS = ['ST-01', 'ST-02']

let cache: StationDTO[] = MOCK_STATIONS
let index = new Map<string, StationDTO>(cache.map((s) => [s.id, s]))

export function listStations(): StationDTO[] {
  return cache
}

export function getStation(id: string): StationDTO | undefined {
  return index.get(id)
}

/** 面板 ViewModel，id 不存在直接抛错，避免界面静默空白 */
export function getStationVM(id: string): StationVM {
  const dto = index.get(id)
  if (!dto) throw new Error(`[workshop] 未找到工位数据: ${id}`)
  return toStationVM(dto)
}

/** 异步入口，为接接口预留；现在直接返回本地 mock */
export async function loadStations(): Promise<StationDTO[]> {
  return cache
}

/* ---------------- 车间汇总 ---------------- */

export interface WorkshopSummary {
  /** 当班成品包装完成量 */
  outputPcs: number
  /** 当班包装计划量 */
  outputPlanPcs: number
  /** 节拍达成率 %（按工位数加权） */
  tactAchieve: number
  /** 在线工位数 */
  stationsOn: number
  /** 工位总数 */
  stationsTotal: number
  /** 缝制在制量（件） */
  wipPcs: number
  /** 一次合格率 %（按工位数加权） */
  yieldWeighted: number
  /** 加权实际节拍，作为节拍曲线基线 */
  tactNowSec: number
  /** 加权计划节拍 */
  tactTargetSec: number
  /** 主导工单 */
  leadOrder: string
}

function sumBy<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((acc, row) => acc + pick(row), 0)
}

export function getWorkshopSummary(): WorkshopSummary {
  const output = index.get(OUTPUT_ID)
  const lead = index.get(LEAD_ID)
  const sewing = SEWING_IDS.map((id) => index.get(id)).filter((s): s is StationDTO => !!s)
  const paced = cache.filter((s) => s.tactTargetSec > 0 && s.tactNowSec > 0)
  const pacedWeight = sumBy(paced, (s) => s.stations)
  const yieldWeight = sumBy(cache, (s) => s.stations)

  return {
    outputPcs: output?.donePcs ?? 0,
    outputPlanPcs: output?.planPcs ?? 0,
    tactAchieve: pacedWeight
      ? sumBy(paced, (s) => (s.tactTargetSec / s.tactNowSec) * 100 * s.stations) / pacedWeight
      : 0,
    stationsOn: sumBy(cache, (s) => s.stations),
    stationsTotal: sumBy(cache, (s) => s.stations),
    wipPcs: sumBy(sewing, (s) => Math.max(0, s.planPcs - s.donePcs)),
    yieldWeighted: yieldWeight
      ? sumBy(cache, (s) => s.yieldPct * s.stations) / yieldWeight
      : 0,
    tactNowSec: pacedWeight
      ? sumBy(paced, (s) => s.tactNowSec * s.stations) / pacedWeight
      : 0,
    tactTargetSec: pacedWeight
      ? sumBy(paced, (s) => s.tactTargetSec * s.stations) / pacedWeight
      : 0,
    leadOrder: lead?.order ?? '—',
  }
}

/** 车间节拍曲线，scale 用于夜班折算 */
export function getWorkshopSpark(scale = 1): number[] {
  const { tactNowSec } = getWorkshopSummary()
  return buildTactSpark(tactNowSec, 'workshop').map((v) => Math.round(v * scale * 10) / 10)
}

/** 主导工位（LiveCard 用） */
export function getLeadStation(): StationVM {
  return getStationVM(LEAD_ID)
}
