import type { AggregatedMetric } from "../types/aggregated-metric"

export function averageSeries(series: AggregatedMetric[][]): AggregatedMetric[] {
    const buckets = new Map<string, AggregatedMetric[]>()
    series.flat().forEach(metric => buckets.set(metric.bucket, [...(buckets.get(metric.bucket) ?? []), metric]))
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([bucket, metrics]) => ({
        bucket,
        avgValue: metrics.reduce((sum, metric) => sum + metric.avgValue, 0) / metrics.length,
        minValue: Math.min(...metrics.map(metric => metric.minValue)),
        maxValue: Math.max(...metrics.map(metric => metric.maxValue)),
        p95Value: metrics.reduce((sum, metric) => sum + metric.p95Value, 0) / metrics.length,
    }))
}
