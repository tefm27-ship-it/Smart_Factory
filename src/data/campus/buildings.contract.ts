/**
 * 楼栋业务数据契约（DTO）。
 *
 * 前后端共用这一份字段定义：字段名、类型、单位一旦和接口对齐，
 * 之后把 buildings.source.ts 从本地 mock 换成 fetch，视图与场景都不需要改。
 *
 * 单位约定（重要，避免 "62%" 与 62 混用）：
 *   areaSqm   平方米，纯数字，展示时再格式化成 "7,800 m²"
 *   load      0–100 的百分比数值
 *   oee       0–100 的百分比数值
 *   tactSec   秒 / 件
 *   remainMin 分钟
 *   yieldPct  0–100 的百分比数值
 *   lines     条数，0 表示该楼没有在制工单
 */

export interface CampusBuildingDTO {
  /** 楼栋编号，与三维几何的 id 一一对应 */
  id: string
  name: string
  /** 楼型 / 工艺描述，鼠标悬停浮标的副标题 */
  type: string
  /** 建筑面积（平方米） */
  areaSqm: number
  /** 机台 / 工位数 */
  machines: number
  /** 瞬时流水线负载 % */
  load: number
  /** 稼动率 % */
  oee: number
  /** 在制工单条数，0 表示仓储 / 办公 / 公用工程 */
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
  /** 面料 / 成品批次号，无批次时为 '—' */
  batch: string
  /** 当前工单号，仓储为入库单号 */
  order: string
  /** 开工时刻，如 07:15 */
  startAt: string
}
