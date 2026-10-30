/**
 * 楼栋业务数据 mock（联调前的数据源）。
 *
 * 这里只是 buildings.source.ts 的默认实现，视图永远不直接 import 本文件。
 * 接入真实接口后，本文件可以整体删除，或挪到 public/mock/ 供联调使用。
 *
 * 三维坐标不在这里，见 scene/campus.ts 的 BUILDING_GEOMETRY，两边靠 id 关联。
 * 数据口径（白班 07:00–19:00，12 小时）见 buildings.contract.ts。
 */

import type { CampusBuildingDTO } from './buildings.contract'

export const MOCK_BUILDINGS: CampusBuildingDTO[] = [
  /* ---------------- 西北：面料 / 裁剪簇 ---------------- */
  {
    id: 'W-11', name: '面料仓 A', type: '卷布立库', areaSqm: 7800,
    machines: 6, load: 62, oee: 88.3, lines: 0, mode: '自动 · 立库',
    tactSec: 0, planPcs: 4800, donePcs: 3120, remainMin: 0, yieldPct: 99.5,
    batch: 'COT-40S · 0×52…2974', order: 'RK-3182', startAt: '07:00',
  },
  {
    id: 'W-12', name: '面料仓 B', type: '卷布立库', areaSqm: 9600,
    machines: 6, load: 58, oee: 90.3, lines: 0, mode: '自动 · 立库',
    tactSec: 0, planPcs: 4200, donePcs: 2604, remainMin: 0, yieldPct: 99.4,
    batch: 'COT-40S · 0×52…2981', order: 'RK-3185', startAt: '07:00',
  },
  {
    id: 'W-13', name: '裁剪一车间', type: '自动裁剪', areaSqm: 6400,
    machines: 40, load: 71, oee: 89.6, lines: 4, mode: '自动 · 裁床',
    tactSec: 18, planPcs: 9600, donePcs: 6240, remainMin: 250, yieldPct: 98.2,
    batch: 'COT-40S · 0×52…2974', order: 'WO-8834-A', startAt: '07:10',
  },
  {
    id: 'W-14', name: '纸样库', type: '纸样 / 样板', areaSqm: 4200,
    machines: 2, load: 37, oee: 84.0, lines: 0, mode: '人工 · 借还',
    tactSec: 0, planPcs: 600, donePcs: 402, remainMin: 0, yieldPct: 99.0,
    batch: '纸样 · 秋季版', order: 'RK-3190', startAt: '08:00',
  },
  {
    id: 'S-01', name: '辅料库', type: '辅料仓储', areaSqm: 4600,
    machines: 4, load: 41, oee: 86.5, lines: 0, mode: '自动 · 立库',
    tactSec: 0, planPcs: 3600, donePcs: 2148, remainMin: 0, yieldPct: 99.2,
    batch: 'ACC-22 · 拉链 / 衬布', order: 'RK-3195', startAt: '07:00',
  },
  {
    id: 'S-02', name: '验布车间', type: '验布 / 测试', areaSqm: 4100,
    machines: 6, load: 55, oee: 87.8, lines: 2, mode: '半自动 · 验布机',
    tactSec: 40, planPcs: 4200, donePcs: 2730, remainMin: 250, yieldPct: 99.1,
    batch: 'COT-40S · 染色批 B', order: 'WO-8802-Q', startAt: '07:30',
  },
  {
    id: 'W-15', name: '面料二库', type: '面料仓储', areaSqm: 6900,
    machines: 5, load: 49, oee: 87.6, lines: 0, mode: '自动 · 立库',
    tactSec: 0, planPcs: 5400, donePcs: 3306, remainMin: 0, yieldPct: 99.3,
    batch: 'COT-32S · 0×48…1180', order: 'RK-3198', startAt: '07:00',
  },

  /* ---------------- 西侧缝制带 ---------------- */
  {
    id: 'W-21', name: '缝制一车间', type: '车缝流水线', areaSqm: 10400,
    machines: 96, load: 78, oee: 90.8, lines: 8, mode: '自动 · 吊挂',
    tactSec: 32, planPcs: 9600, donePcs: 6720, remainMin: 215, yieldPct: 97.4,
    batch: 'COT-40S · 0×52…2974', order: 'WO-8821-B', startAt: '07:15',
  },
  {
    id: 'W-22', name: '缝制二车间', type: '车缝流水线', areaSqm: 9600,
    machines: 88, load: 74, oee: 89.5, lines: 8, mode: '自动 · 吊挂',
    tactSec: 34, planPcs: 9000, donePcs: 5760, remainMin: 260, yieldPct: 96.9,
    batch: 'COT-40S · 0×52…2981', order: 'WO-8822-A', startAt: '07:15',
  },
  {
    id: 'W-23', name: '缝制三车间', type: '车缝流水线', areaSqm: 11800,
    machines: 80, load: 69, oee: 88.2, lines: 6, mode: '混合 · 吊挂',
    tactSec: 36, planPcs: 8400, donePcs: 5040, remainMin: 290, yieldPct: 96.5,
    batch: 'COT-32S · 0×48…1180', order: 'WO-8823-B', startAt: '07:20',
  },
  {
    id: 'W-25', name: '整烫中心', type: '整烫 / 定型', areaSqm: 5600,
    machines: 48, load: 83, oee: 87.2, lines: 5, mode: '自动 · 定型',
    tactSec: 22, planPcs: 10800, donePcs: 8100, remainMin: 180, yieldPct: 98.6,
    batch: 'COT-40S · 0×52…2974', order: 'WO-8825-A', startAt: '07:05',
  },
  {
    id: 'W-26', name: '水洗车间', type: '洗水 / 后整', areaSqm: 4900,
    machines: 36, load: 76, oee: 88.9, lines: 4, mode: '半自动 · 洗水',
    tactSec: 45, planPcs: 6000, donePcs: 3900, remainMin: 250, yieldPct: 95.8,
    batch: 'COT-32S · 0×48…1180', order: 'WO-8826-C', startAt: '07:40',
  },
  {
    id: 'W-27', name: '成品仓 A', type: '成衣仓储', areaSqm: 18400,
    machines: 4, load: 46, oee: 93.1, lines: 0, mode: '自动 · 立库',
    tactSec: 0, planPcs: 9600, donePcs: 5856, remainMin: 0, yieldPct: 99.4,
    batch: 'FG-26A · 秋季', order: 'RK-3210', startAt: '07:00',
  },

  /* ---------------- 中央：缝制 / 后整 ---------------- */
  {
    id: 'C-01', name: '中央缝制车间', type: '吊挂流水线', areaSqm: 8600,
    machines: 180, load: 81, oee: 91.6, lines: 10, mode: '自动 · 吊挂',
    tactSec: 30, planPcs: 12000, donePcs: 8400, remainMin: 215, yieldPct: 97.8,
    batch: 'COT-40S · 0×52…2974', order: 'WO-8840-A', startAt: '07:00',
  },
  {
    id: 'C-07', name: '锁钉车间', type: '锁钉 / 套结', areaSqm: 4100,
    machines: 52, load: 73, oee: 88.6, lines: 5, mode: '自动 · 套结',
    tactSec: 14, planPcs: 12000, donePcs: 7920, remainMin: 245, yieldPct: 98.9,
    batch: 'COT-40S · 0×52…2981', order: 'WO-8847-B', startAt: '07:10',
  },
  {
    id: 'C-08', name: '制版中心', type: '制版 / 打样', areaSqm: 2600,
    machines: 18, load: 57, oee: 90.8, lines: 3, mode: '手动 · 打样',
    tactSec: 120, planPcs: 480, donePcs: 336, remainMin: 215, yieldPct: 99.2,
    batch: '纸样 · 秋季版', order: 'WO-8851-P', startAt: '08:00',
  },
  {
    id: 'C-02', name: '绣印车间', type: '绣花 / 印花', areaSqm: 4300,
    machines: 40, load: 75, oee: 87.9, lines: 6, mode: '自动 · 绣印',
    tactSec: 26, planPcs: 9000, donePcs: 6120, remainMin: 230, yieldPct: 96.4,
    batch: 'COT-40S · 0×52…2974', order: 'WO-8852-A', startAt: '07:05',
  },
  {
    id: 'C-03', name: '质检中心', type: '成衣检验', areaSqm: 3100,
    machines: 28, load: 52, oee: 90.2, lines: 4, mode: '人工 · 检验',
    tactSec: 12, planPcs: 14400, donePcs: 10800, remainMin: 180, yieldPct: 99.4,
    batch: 'FG-26A · 秋季', order: 'WO-8853-Q', startAt: '07:00',
  },
  {
    id: 'C-04', name: '印花车间', type: '印花 / 绣花', areaSqm: 5800,
    machines: 34, load: 66, oee: 89.0, lines: 3, mode: '半自动 · 印花',
    tactSec: 28, planPcs: 8400, donePcs: 5040, remainMin: 290, yieldPct: 95.9,
    batch: 'COT-32S · 0×48…1180', order: 'WO-8854-C', startAt: '07:20',
  },
  {
    id: 'C-05', name: '辅料配送', type: '辅料配送', areaSqm: 4400,
    machines: 22, load: 61, oee: 90.1, lines: 4, mode: '自动 · AGV',
    tactSec: 20, planPcs: 7200, donePcs: 5040, remainMin: 215, yieldPct: 99.0,
    batch: 'ACC-22 · 拉链 / 衬布', order: 'WO-8855-D', startAt: '07:10',
  },
  {
    id: 'C-06', name: '包装车间', type: '包装 / 发运', areaSqm: 3900,
    machines: 30, load: 68, oee: 89.4, lines: 5, mode: '自动 · 装箱',
    tactSec: 16, planPcs: 12000, donePcs: 8160, remainMin: 230, yieldPct: 99.1,
    batch: 'FG-26A · 秋季', order: 'WO-8856-E', startAt: '07:15',
  },
  {
    id: 'C-09', name: '缝制四车间', type: '车缝流水线', areaSqm: 6800,
    machines: 64, load: 72, oee: 90.9, lines: 7, mode: '自动 · 吊挂',
    tactSec: 33, planPcs: 7200, donePcs: 4680, remainMin: 250, yieldPct: 97.1,
    batch: 'COT-40S · 0×52…2981', order: 'WO-8824-D', startAt: '07:15',
  },

  /* ---------------- 东北：智能裁剪 / 仓储 ---------------- */
  {
    id: 'E-01', name: '智能裁剪一', type: '自动裁床', areaSqm: 7800,
    machines: 36, load: 72, oee: 92.4, lines: 6, mode: '自动 · 裁床',
    tactSec: 15, planPcs: 10800, donePcs: 7560, remainMin: 215, yieldPct: 98.8,
    batch: 'COT-40S · 0×52…2974', order: 'WO-8860-A', startAt: '07:00',
  },
  {
    id: 'E-02', name: '智能裁剪二', type: '自动裁床', areaSqm: 8200,
    machines: 36, load: 70, oee: 91.7, lines: 6, mode: '自动 · 裁床',
    tactSec: 15, planPcs: 10800, donePcs: 7020, remainMin: 250, yieldPct: 98.6,
    batch: 'COT-40S · 0×52…2981', order: 'WO-8861-B', startAt: '07:05',
  },
  {
    id: 'E-03', name: '裁剪准备', type: '拉布 / 验片', areaSqm: 2700,
    machines: 12, load: 64, oee: 90.4, lines: 4, mode: '半自动 · 拉布',
    tactSec: 24, planPcs: 4800, donePcs: 2880, remainMin: 290, yieldPct: 98.0,
    batch: 'COT-32S · 0×48…1180', order: 'WO-8862-C', startAt: '07:10',
  },
  {
    id: 'E-04', name: '成品仓三区', type: '成衣仓储', areaSqm: 5100,
    machines: 4, load: 44, oee: 90.6, lines: 0, mode: '自动 · 立库',
    tactSec: 0, planPcs: 7200, donePcs: 3960, remainMin: 0, yieldPct: 99.3,
    batch: 'FG-26A · 秋季', order: 'RK-3225', startAt: '07:00',
  },
  {
    id: 'E-05', name: '动力站', type: '动力 / 空压', areaSqm: 3000,
    machines: 6, load: 68, oee: 94.2, lines: 0, mode: '自动 · 无人值守',
    tactSec: 0, planPcs: 0, donePcs: 0, remainMin: 0, yieldPct: 99.9,
    batch: '—', order: '—', startAt: '—',
  },
  {
    id: 'E-06', name: '门卫房', type: '门卫 / 计量', areaSqm: 900,
    machines: 1, load: 31, oee: 94.6, lines: 0, mode: '人工 · 值守',
    tactSec: 0, planPcs: 240, donePcs: 156, remainMin: 0, yieldPct: 99.0,
    batch: '—', order: 'GT-0096', startAt: '07:00',
  },

  /* ---------------- 南侧：成衣联合厂房 ---------------- */
  {
    id: 'A-03', name: '成衣制造联合车间', type: '缝制 / 整烫综合', areaSqm: 62400,
    machines: 420, load: 87, oee: 90.4, lines: 16, mode: '自动 · 连续流',
    tactSec: 45, planPcs: 18000, donePcs: 12960, remainMin: 200, yieldPct: 97.6,
    batch: 'COT-40S · 0×52…2974', order: 'WO-8821-A', startAt: '07:00',
  },

  /* ---------------- 东南：物流 / 研发 / 办公 ---------------- */
  {
    id: 'R-01', name: '物流中心', type: '成衣物流', areaSqm: 4600,
    machines: 10, load: 55, oee: 88.7, lines: 2, mode: '自动 · AGV',
    tactSec: 60, planPcs: 3600, donePcs: 2160, remainMin: 290, yieldPct: 99.6,
    batch: 'FG-26A · 秋季', order: 'TO-2210-A', startAt: '07:30',
  },
  {
    id: 'R-02', name: '分拣配货', type: '分拣 / 配送', areaSqm: 2800,
    machines: 14, load: 58, oee: 89.2, lines: 3, mode: '自动 · 分拣',
    tactSec: 48, planPcs: 4200, donePcs: 2730, remainMin: 250, yieldPct: 99.4,
    batch: 'FG-26A · 秋季', order: 'TO-2211-B', startAt: '07:30',
  },
  {
    id: 'R-03', name: '样衣中心', type: '样衣 / 研发', areaSqm: 1900,
    machines: 3, load: 43, oee: 96.0, lines: 0, mode: '手动 · 打样',
    tactSec: 0, planPcs: 60, donePcs: 42, remainMin: 0, yieldPct: 99.8,
    batch: '纸样 · 秋季版', order: '—', startAt: '—',
  },
  {
    id: 'B-01', name: '辅料仓', type: '辅料仓储', areaSqm: 4700,
    machines: 3, load: 38, oee: 87.3, lines: 0, mode: '自动 · 立库',
    tactSec: 0, planPcs: 3600, donePcs: 2052, remainMin: 0, yieldPct: 99.2,
    batch: 'ACC-22 · 拉链 / 衬布', order: 'RK-3230', startAt: '07:00',
  },
  {
    id: 'O-01', name: '设计研发中心', type: '设计 / 研发', areaSqm: 3600,
    machines: 2, load: 41, oee: 96.4, lines: 0, mode: '—',
    tactSec: 0, planPcs: 0, donePcs: 0, remainMin: 0, yieldPct: 0,
    batch: '—', order: '—', startAt: '—',
  },
  {
    id: 'O-02', name: '行政楼', type: '办公', areaSqm: 2400,
    machines: 1, load: 35, oee: 97.2, lines: 0, mode: '—',
    tactSec: 0, planPcs: 0, donePcs: 0, remainMin: 0, yieldPct: 0,
    batch: '—', order: '—', startAt: '—',
  },
  {
    id: 'R-06', name: '成品仓四区', type: '成衣仓储', areaSqm: 7600,
    machines: 4, load: 45, oee: 89.8, lines: 0, mode: '自动 · 立库',
    tactSec: 0, planPcs: 6000, donePcs: 3300, remainMin: 0, yieldPct: 99.1,
    batch: 'FG-26A · 秋季', order: 'RK-3233', startAt: '07:00',
  },
  {
    id: 'R-07', name: '包装二车间', type: '包装 / 发运', areaSqm: 3400,
    machines: 24, load: 63, oee: 89.1, lines: 4, mode: '自动 · 装箱',
    tactSec: 18, planPcs: 7200, donePcs: 4320, remainMin: 290, yieldPct: 98.9,
    batch: 'FG-26A · 秋季', order: 'WO-8872-P', startAt: '07:20',
  },
  {
    id: 'W-18', name: '面料三库', type: '面料仓储', areaSqm: 3600,
    machines: 3, load: 42, oee: 86.1, lines: 0, mode: '人工 · 库位',
    tactSec: 0, planPcs: 2400, donePcs: 1392, remainMin: 0, yieldPct: 98.9,
    batch: 'COT-32S · 0×48…1180', order: 'RK-3236', startAt: '08:00',
  },
  {
    id: 'R-04', name: '东部成品仓', type: '成衣仓储', areaSqm: 7200,
    machines: 4, load: 47, oee: 90.1, lines: 0, mode: '自动 · 立库',
    tactSec: 0, planPcs: 8400, donePcs: 4740, remainMin: 0, yieldPct: 99.4,
    batch: 'FG-26A · 秋季', order: 'RK-3240', startAt: '07:00',
  },
  {
    id: 'R-05', name: '发运中心', type: '包装 / 发运', areaSqm: 3400,
    machines: 8, load: 51, oee: 88.5, lines: 3, mode: '自动 · 装车',
    tactSec: 55, planPcs: 4800, donePcs: 2880, remainMin: 290, yieldPct: 99.3,
    batch: 'FG-26A · 秋季', order: 'TO-2215-F', startAt: '07:40',
  },
]
