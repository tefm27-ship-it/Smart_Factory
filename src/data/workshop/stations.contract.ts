/**
 * 车间工位业务数据契约（DTO）。
 *
 * 与厂区楼栋同一套做法：字段名、类型、单位与接口对齐，
 * 接真实数据时只换 stations.source.ts 的实现，视图与场景不动。
 *
 * 单位约定（避免 "33.2 s / 件" 这类字符串进入数据层）：
 *   load / oee / yieldPct   0–100 的百分比数值
 *   tactNowSec              当前实际节拍，秒 / 件，0 表示不按节拍生产
 *   tactTargetSec           计划节拍，秒 / 件，0 表示不按节拍生产
 *   remainMin               剩余工时，分钟，0 显示为「—」
 *   stations                该单元的工位 / 设备数量
 *   qtyUnit                 产量单位：件 / 米 / 层 / 车 / 线体
 */

export interface StationDTO {
  /** 工位编号，与三维几何的 id 一一对应 */
  id: string
  name: string
  /** 单元类型，悬停浮标与面板副标题 */
  type: string
  /** 徽标短名：面料 / 缝制 / 裁剪 / 质检 / 包装 / 成品 / 中控 / 发运 */
  short: string
  /** 所属线体标签，如「吊挂线 A」 */
  line: string
  /** 负载 % */
  load: number
  /** 稼动率 % */
  oee: number
  /** 工位 / 设备数量 */
  stations: number
  /** 计量单位：工位 / 台 / 组 / 巷道 / 席位 / 月台 */
  stationUnit: string
  /** 运行模式，如「自动 · 悬挂」 */
  mode: string
  /** 当前实际节拍（秒 / 件），0 表示不按节拍生产 */
  tactNowSec: number
  /** 计划节拍（秒 / 件），0 表示不按节拍生产 */
  tactTargetSec: number
  /** 在制工单号 */
  order: string
  /** 已完成量 */
  donePcs: number
  /** 本班目标量 */
  planPcs: number
  /** 产量单位：件 / 米 / 层 / 车 / 线体 */
  qtyUnit: string
  /** 剩余工时（分钟），0 显示为「—」 */
  remainMin: number
  /** 面料 / 成品批次 */
  batch: string
  /** 一次合格率 % */
  yieldPct: number
}
