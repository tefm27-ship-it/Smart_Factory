export interface KpiItem {
  label: string
  value: number
  decimals?: number
  unit: string
  trend?: string
  sub?: string
  bar: number
  barColor?: string
}

export type RoundAction = 'locate' | 'call' | 'stop' | 'trace'

export interface MetricItem {
  label: string
  value: string
  dot?: '' | 'b' | 'a'
}

export interface KvRow {
  k: string
  v: string
  mono?: boolean
}

export interface ProcStation {
  id: string
  name: string
  short: string
  load: number
  halted: boolean
}
