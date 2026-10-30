export interface SelectMeta {
  user: boolean
}

export interface CampusBuildingVM {
  id: string
  name: string
  type: string
  /** 建筑面积，如 62,400 m² */
  area: string
  /** 机台 / 工位数 */
  machines: number
  /** 流水线负载 % */
  load: number
  /** 稼动率 % */
  oee: number
  /** 在制工单条数，0 表示无在制 */
  lines: number
  /** 运行模式，如「自动 · 吊挂」 */
  mode: string
  /** 计划节拍（秒 / 件），0 表示不按节拍生产 */
  tactSec: number
  /** 本班计划量 */
  planPcs: number
  /** 本班已完成量 */
  donePcs: number
  /** 剩余工时（分钟） */
  remainMin: number
  /** 一次合格率 % */
  yieldPct: number
  /** 面料 / 成品批次号 */
  batch: string
  /** 当前工单号，仓储为入库单号 */
  order: string
  /** 开工时刻，如 07:15 */
  startAt: string
  /** 本班逐小时产出曲线 */
  spark: number[]
  halted: boolean
  canEnter: boolean
}

export interface CampusSceneOptions {
  host: HTMLElement
  canvasEl: HTMLElement
  tip: HTMLElement
  popup: HTMLElement
  dark: boolean
  onSelect: (vm: CampusBuildingVM | null, meta: SelectMeta) => void
  onAuto: (on: boolean) => void
  onEnterWorkshop: () => void
}

export interface CampusSceneApi {
  selectById(id: string, focus?: boolean): boolean
  clearSelection(): void
  focusSelected(): void
  toggleHalt(): CampusBuildingVM | null
  toggleRoute(): boolean
  setAuto(on: boolean): void
  zoom(factor: number): void
  reset(): void
  applyTheme(dark: boolean): void
  dispose(): void
}

export interface StationVM {
  id: string
  name: string
  type: string
  short: string
  /** 工位 / 设备负载 % */
  load: number
  /** 稼动率 % */
  oee: number
  /** 在线工位数 */
  count: number
  /** 工位计量单位：工位 / 台 / 组 / 巷道 / 席位 / 月台 */
  unit: string
  /** 所属线体，如「吊挂线 A」 */
  line: string
  /** 运行模式，如「自动 · 悬挂」 */
  mode: string
  /** 当前实际节拍文案，如「33.2 s / 件」，不按节拍生产为「—」 */
  tact: string
  /** 计划节拍（秒 / 件），0 表示不按节拍生产 */
  tactTargetSec: number
  /** 在制工单号 */
  order: string
  /** 完成 / 目标文案，如「8,640 / 12,000 件」 */
  done: string
  /** 剩余工时文案，如「4 h 12 m」 */
  remain: string
  /** 面料 / 成品批次 */
  batch: string
  /** 一次合格率 % */
  yieldPct: number
  halted: boolean
}

export interface StationBrief {
  id: string
  name: string
  short: string
  load: number
  halted: boolean
}

export interface WorkshopSceneOptions {
  host: HTMLElement
  canvasEl: HTMLElement
  tip: HTMLElement
  popup: HTMLElement
  dark: boolean
  onSelect: (vm: StationVM | null, meta: SelectMeta) => void
  onAuto: (on: boolean) => void
}

export interface WorkshopSceneApi {
  selectById(id: string, focus?: boolean): boolean
  clearSelection(): void
  focusSelected(): void
  toggleHalt(): StationVM | null
  toggleRoute(): boolean
  setAuto(on: boolean): void
  zoom(factor: number): void
  reset(): void
  applyTheme(dark: boolean): void
  getStations(): StationBrief[]
  dispose(): void
}
