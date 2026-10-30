/**
 * 展示层共用的格式化函数。
 *
 * 厂区与车间共用同一套数字 / 工时 / 面积写法，避免两个模块各写一份后不一致。
 * 只做展示，不参与任何计算。
 */

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

/** 分钟 → `4 h 12 m` */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} m`
  return m ? `${h} h ${m} m` : `${h} h`
}

/** 平方米 → `7,800 m²` */
export function formatArea(sqm: number): string {
  return `${formatNumber(sqm)} m²`
}

/** 秒 / 件 → `33.2 s` */
export function formatTact(sec: number): string {
  return `${sec.toFixed(1)} s`
}
