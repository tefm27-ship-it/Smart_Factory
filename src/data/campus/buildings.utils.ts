/**
 * 楼栋数据的派生与格式化工具（纯函数，无状态）。
 *
 * 这些逻辑刻意不进 mock 数据文件：
 *   - 曲线、面积文案、工时文案都是「由数据算出来的展示结果」，
 *     接真实接口后依然需要，不能随 mock 一起删掉。
 */

import type { CampusBuildingDTO } from './buildings.contract'
import type { CampusBuildingVM } from '../../scene/types'
import { formatArea } from '../format'

/* 格式化函数放在 data/format.ts，与车间页共用；此处转出以保持既有 import 路径 */
export { formatArea, formatMinutes, formatNumber } from '../format'

/** 14 个采样点（07:00–20:00 每小时一档）的产量分布形状，合计为 1 */
const SPARK_SHAPE = [
  0.045, 0.062, 0.07, 0.074, 0.07, 0.074, 0.076,
  0.08, 0.078, 0.076, 0.074, 0.072, 0.07, 0.079,
]

/** 按楼栋 id 生成固定相位扰动，让每栋楼的曲线形状略有差异（±6%） */
function wobble(id: string, index: number): number {
  let seed = 0
  for (let i = 0; i < id.length; i++) seed += id.charCodeAt(i)
  return 1 + Math.sin(seed % 17 + index * 1.7) * 0.06
}

/**
 * 把本班完成量摊到 14 个采样点，曲线合计≈完成量。
 * TODO(接接口): 后端能直接给出逐小时时序时，改用接口数据，本函数只作兜底。
 */
export function buildSpark(id: string, total: number): number[] {
  if (total <= 0) return []
  const raw = SPARK_SHAPE.map((share, index) => share * wobble(id, index))
  const sum = raw.reduce((acc, v) => acc + v, 0)
  return raw.map((v) => Math.round((v / sum) * total))
}

/** DTO → 面板 ViewModel，halted 由调用方补运行时状态 */
export function toBuildingVM(dto: CampusBuildingDTO): CampusBuildingVM {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    area: formatArea(dto.areaSqm),
    machines: dto.machines,
    load: dto.load,
    oee: dto.oee,
    lines: dto.lines,
    mode: dto.mode,
    tactSec: dto.tactSec,
    planPcs: dto.planPcs,
    donePcs: dto.donePcs,
    remainMin: dto.remainMin,
    yieldPct: dto.yieldPct,
    batch: dto.batch,
    order: dto.order,
    startAt: dto.startAt,
    spark: buildSpark(dto.id, dto.donePcs),
    halted: false,
    canEnter: dto.id === 'A-03',
  }
}
