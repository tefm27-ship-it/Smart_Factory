/**
 * 车间工位数据 mock（联调前的数据源）。
 *
 * 只放业务数据，三维坐标见 scene/workshop.ts 的 STATION_GEOMETRY，两边靠 id 关联。
 * 视图永远不直接 import 本文件，统一走 stations.source.ts。
 *
 * 数据口径：白班 07:00–19:00，当前约 15:00；节拍 30–35 s / 件，
 * 达成率 96–97%，合格率 97–99.9%，13 个单元合计 49 个工位。
 */

import type { StationDTO } from './stations.contract'

/** 车间级元数据：不属于任何单个工位，但界面要展示 */
export const WORKSHOP_META = {
  /** 所属厂房 */
  campusId: 'A-03',
  /** 车间名称 */
  name: '缝制一车间',
  /** 建筑面积（平方米） */
  areaSqm: 3860,
  /** 在运行的 AGV 数量（与场景 AGV_DEFS 对应） */
  agvCount: 3,
  /** AGV 总数 */
  agvTotal: 4,
  /** 吊挂系统挂位数 */
  hangerCount: 86,
}

export const MOCK_STATIONS: StationDTO[] = [
  /* ---------------- 面料 / 裁剪 ---------------- */
  {
    id: 'FB-01', name: '面料暂存', type: '面料仓储区', short: '面料', line: '面料库 01',
    load: 92, oee: 96.1, stations: 4, stationUnit: '组', mode: '半自动 · 平库',
    tactNowSec: 0, tactTargetSec: 0, order: 'WO-2601 · 面料备料',
    donePcs: 14200, planPcs: 16000, qtyUnit: '米', remainMin: 130,
    batch: 'COT-40S · 藏青 0×52', yieldPct: 99.2,
  },
  {
    id: 'CT-01', name: '智能裁床 1', type: '自动裁剪单元', short: '裁剪', line: '裁剪 C1',
    load: 88, oee: 94.6, stations: 1, stationUnit: '台', mode: '自动 · 裁床',
    tactNowSec: 31.9, tactTargetSec: 31, order: 'WO-2602 · 夹克裁片',
    donePcs: 612, planPcs: 800, qtyUnit: '层', remainMin: 125,
    batch: 'COT-40S · 藏青 0×52', yieldPct: 98.4,
  },
  {
    id: 'CT-02', name: '智能裁床 2', type: '自动裁剪单元', short: '裁剪', line: '裁剪 C2',
    load: 84, oee: 93.8, stations: 1, stationUnit: '台', mode: '自动 · 裁床',
    tactNowSec: 32.2, tactTargetSec: 31, order: 'WO-2602 · 夹克裁片',
    donePcs: 608, planPcs: 800, qtyUnit: '层', remainMin: 132,
    batch: 'COT-40S · 藏青 0×52', yieldPct: 98.1,
  },
  {
    id: 'CT-03', name: '智能裁床 3', type: '自动裁剪单元', short: '裁剪', line: '裁剪 C3',
    load: 90, oee: 94.2, stations: 1, stationUnit: '台', mode: '自动 · 裁床',
    tactNowSec: 31.8, tactTargetSec: 31, order: 'WO-2602 · 夹克裁片',
    donePcs: 620, planPcs: 800, qtyUnit: '层', remainMin: 118,
    batch: 'COT-40S · 藏青 0×52', yieldPct: 98.6,
  },
  {
    id: 'CT-04', name: '智能裁床 4', type: '自动裁剪单元', short: '裁剪', line: '裁剪 C4',
    load: 82, oee: 93.1, stations: 1, stationUnit: '台', mode: '自动 · 裁床',
    tactNowSec: 32.4, tactTargetSec: 31, order: 'WO-2603 · 风衣裁片',
    donePcs: 596, planPcs: 800, qtyUnit: '层', remainMin: 140,
    batch: 'COT-32S · 米白 0×48', yieldPct: 97.9,
  },
  {
    id: 'CT-05', name: '智能裁床 5', type: '自动裁剪单元', short: '裁剪', line: '裁剪 C5',
    load: 86, oee: 94.8, stations: 1, stationUnit: '台', mode: '自动 · 裁床',
    tactNowSec: 32.0, tactTargetSec: 31, order: 'WO-2603 · 风衣裁片',
    donePcs: 624, planPcs: 800, qtyUnit: '层', remainMin: 116,
    batch: 'COT-32S · 米白 0×48', yieldPct: 98.5,
  },

  /* ---------------- 缝制 ---------------- */
  {
    id: 'ST-01', name: '缝制 A 线', type: '吊挂缝制线', short: '缝制', line: '吊挂线 A',
    load: 86, oee: 92.4, stations: 12, stationUnit: '工位', mode: '自动 · 悬挂',
    tactNowSec: 33.2, tactTargetSec: 32, order: 'WO-2601 · 男装夹克',
    donePcs: 8640, planPcs: 12000, qtyUnit: '件', remainMin: 252,
    batch: 'COT-40S · 藏青 0×52', yieldPct: 97.6,
  },
  {
    id: 'ST-02', name: '缝制 B 线', type: '吊挂缝制线', short: '缝制', line: '吊挂线 B',
    load: 84, oee: 91.2, stations: 12, stationUnit: '工位', mode: '自动 · 悬挂',
    tactNowSec: 33.4, tactTargetSec: 32, order: 'WO-2603 · 女装风衣',
    donePcs: 7920, planPcs: 11000, qtyUnit: '件', remainMin: 268,
    batch: 'COT-32S · 米白 0×48', yieldPct: 97.1,
  },

  /* ---------------- 后道 ---------------- */
  {
    id: 'QC-01', name: '质检扫描', type: '视觉质检工位', short: '质检', line: '质检 Q1',
    load: 76, oee: 95.0, stations: 2, stationUnit: '工位', mode: '自动 · 视觉检测',
    tactNowSec: 34.1, tactTargetSec: 33, order: 'WO-2601 · 男装夹克',
    donePcs: 3180, planPcs: 3600, qtyUnit: '件', remainMin: 100,
    batch: 'COT-40S · 藏青 0×52', yieldPct: 98.2,
  },
  {
    id: 'PK-01', name: '后道包装', type: '包装输送线', short: '包装', line: '后道 P1',
    load: 68, oee: 89.6, stations: 5, stationUnit: '工位', mode: '半自动 · 装箱',
    tactNowSec: 35.3, tactTargetSec: 34, order: 'WO-2598 · 成衣包装',
    donePcs: 2940, planPcs: 3600, qtyUnit: '件', remainMin: 210,
    batch: '混纺 · 藏青 0×52', yieldPct: 99.1,
  },
  {
    id: 'FG-01', name: '成品缓存', type: '挂装成品库', short: '成品', line: '成品库 F1',
    load: 74, oee: 94.0, stations: 3, stationUnit: '巷道', mode: '自动 · 立库',
    tactNowSec: 0, tactTargetSec: 0, order: 'WO-2597 · 成品入库',
    donePcs: 2586, planPcs: 3000, qtyUnit: '件', remainMin: 310,
    batch: '混纺 · 藏青 0×52', yieldPct: 99.4,
  },

  /* ---------------- 中控 / 发运 ---------------- */
  {
    id: 'CR-01', name: '控制中心', type: '车间中控室', short: '中控', line: 'MES 中控',
    load: 42, oee: 99.1, stations: 4, stationUnit: '席位', mode: 'MES · 实时采集',
    tactNowSec: 0, tactTargetSec: 0, order: '全车间 · 排产监控',
    donePcs: 12, planPcs: 12, qtyUnit: '线体', remainMin: 0,
    batch: 'MES · 实时采集', yieldPct: 99.9,
  },
  {
    id: 'LD-01', name: '装卸月台', type: '成品发运口', short: '发运', line: '发运 D1',
    load: 56, oee: 97.4, stations: 2, stationUnit: '月台', mode: '人工 · 装卸',
    tactNowSec: 0, tactTargetSec: 0, order: 'WO-2596 · 发运计划',
    donePcs: 6, planPcs: 9, qtyUnit: '车', remainMin: 180,
    batch: '扫箱码 · 车载同步', yieldPct: 99.6,
  },
]
