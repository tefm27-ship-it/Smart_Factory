/**
 * 车间工位数据的派生与格式化工具（纯函数）。
 *
 * 与厂区同一套原则：节拍文案、完成量文案、节拍曲线都是「算出来的」，
 * 数据层只存秒 / 分钟 / 件这些原始数值。
 */

import type { StationDTO } from './stations.contract'
import type { StationVM } from '../../scene/types'
import { formatMinutes, formatNumber } from '../format'

/** 14 个采样点的节拍形状：开头偏慢，末点等于当前节拍（1.0） */
const TACT_SHAPE = [
  1.062, 1.048, 1.055, 1.036, 1.042, 1.028, 1.031,
  1.02, 1.026, 1.014, 1.018, 1.009, 1.02, 1.0,
]

/** 按工位 id 生成固定相位扰动，避免各单元曲线完全一样（±0.8%） */
function wobble(id: string, index: number): number {
  let seed = 0
  for (let i = 0; i < id.length; i++) seed += id.charCodeAt(i)
  return Math.sin(seed % 13 + index * 1.9) * 0.008
}

/**
 * 车间节拍曲线：以当前实际节拍为末点，向前回溯 14 个采样点。
 * TODO(接接口): 后端能给逐小时节拍时直接替换。
 */
export function buildTactSpark(baseSec: number, id: string): number[] {
  if (!baseSec) return []
  const last = TACT_SHAPE.length - 1
  return TACT_SHAPE.map((k, i) => {
    // 末点严格对齐当前节拍，避免末两点环形算出 0.0%
    const w = i === last ? 0 : wobble(id, i)
    return Math.round(baseSec * (k + w) * 10) / 10
  })
}

/** 秒 / 件 → `33.2 s / 件`；0 表示不按节拍生产 */
export function formatTactText(sec: number): string {
  return sec ? `${sec.toFixed(1)} s / 件` : '—'
}

/** `8,640 / 12,000 件` */
export function formatDone(done: number, plan: number, unit: string): string {
  return `${formatNumber(done)} / ${formatNumber(plan)} ${unit}`
}

/** DTO → 面板 ViewModel，halted 由场景补运行时状态 */
export function toStationVM(dto: StationDTO): StationVM {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    short: dto.short,
    load: dto.load,
    oee: dto.oee,
    count: dto.stations,
    unit: dto.stationUnit,
    line: dto.line,
    mode: dto.mode,
    tact: formatTactText(dto.tactNowSec),
    tactTargetSec: dto.tactTargetSec,
    order: dto.order,
    done: formatDone(dto.donePcs, dto.planPcs, dto.qtyUnit),
    remain: dto.remainMin ? formatMinutes(dto.remainMin) : '—',
    batch: dto.batch,
    yieldPct: dto.yieldPct,
    halted: false,
  }
}
