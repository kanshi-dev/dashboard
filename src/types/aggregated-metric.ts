export interface AggregatedMetric {
  bucket: string
  avgValue: number
  minValue: number
  maxValue: number
  p95Value: number
}