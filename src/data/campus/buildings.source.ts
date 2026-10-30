/**
 * 楼栋数据源——视图与三维场景**唯一**的数据入口。
 *
 * 现在的实现读本地 mock；将来接数据库时只改这个文件：
 *
 *   1. 把 loadBuildings() 换成 fetch('/api/campus/buildings')
 *   2. 拿到结果后写入 cache / index
 *   3. 全厂汇总若由后端计算，getPlantSummary() 直接返回接口字段
 *
 * 调用方（CampusView / campus.ts / campusShift）一行都不用改。
 * 唯一需要注意的是：一旦改成异步，场景与 KPI 要等数据到位后再渲染，
 * 几何已独立（BUILDING_GEOMETRY），可以先建楼、后补数据。
 */

import { MOCK_BUILDINGS } from './buildings.mock'
import { buildSpark, toBuildingVM } from './buildings.utils'
import type { CampusBuildingDTO } from './buildings.contract'
import type { CampusBuildingVM } from '../../scene/types'

/** 成品产出环节：联合车间、包装车间、包装二车间、发运中心 */
const FINISHING_IDS = ['A-03', 'C-06', 'R-07', 'R-05']

let cache: CampusBuildingDTO[] = MOCK_BUILDINGS
let index = new Map<string, CampusBuildingDTO>(cache.map((b) => [b.id, b]))

/** 按 mock 定义顺序返回全部楼栋 */
export function listBuildings(): CampusBuildingDTO[] {
  return cache
}

export function getBuilding(id: string): CampusBuildingDTO | undefined {
  return index.get(id)
}

/** 面板 ViewModel，id 不存在直接抛错，避免界面静默显示空白 */
export function getBuildingVM(id: string): CampusBuildingVM {
  const dto = index.get(id)
  if (!dto) throw new Error(`[campus] 未找到楼栋数据: ${id}`)
  return toBuildingVM(dto)
}

/**
 * 异步加载入口，为接接口预留。
 * 现在直接返回本地 mock，接后端时改成真实请求即可。
 */
export async function loadBuildings(): Promise<CampusBuildingDTO[]> {
  return cache
}

/* ---------------- 全厂汇总 ---------------- */

export interface PlantSummary {
  /** 成品环节已完成量 */
  finishedPcs: number
  /** 成品环节计划量 */
  plannedPcs: number
  /** 全厂机台总数 */
  machinesAll: number
  /** 有在制工单楼栋的机台数 */
  machinesOn: number
  /** 生产楼按机台数加权后的 OEE */
  oeeWeighted: number
  /** 生产楼数量 */
  runningBuildings: number
  totalBuildings: number
}

function sumBy<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((acc, row) => acc + pick(row), 0)
}

/** 成品环节的逐小时曲线，scale 用于夜班折算 */
export function finishingSpark(scale: number): number[] {
  const points = new Array<number>(14).fill(0)
  listFinishingBuildings().forEach((b) => {
    buildSpark(b.id, b.donePcs).forEach((v, i) => {
      points[i] += v
    })
  })
  return points.map((v) => Math.round(v * scale))
}

export function listFinishingBuildings(): CampusBuildingDTO[] {
  return cache.filter((b) => FINISHING_IDS.includes(b.id))
}

export function listRunningBuildings(): CampusBuildingDTO[] {
  return cache.filter((b) => b.lines > 0)
}

export function getPlantSummary(): PlantSummary {
  const finishing = listFinishingBuildings()
  const running = listRunningBuildings()
  const machinesAll = sumBy(cache, (b) => b.machines)
  const machinesOn = sumBy(running, (b) => b.machines)
  return {
    finishedPcs: sumBy(finishing, (b) => b.donePcs),
    plannedPcs: sumBy(finishing, (b) => b.planPcs),
    machinesAll,
    machinesOn,
    oeeWeighted: machinesOn ? sumBy(running, (b) => b.oee * b.machines) / machinesOn : 0,
    runningBuildings: running.length,
    totalBuildings: cache.length,
  }
}
