export type HistoryPreset = "1h" | "6h" | "24h" | "7d"

export const historyPresets: Record<HistoryPreset, { durationMs: number; interval: string }> = {
    "1h": { durationMs: 60 * 60 * 1000, interval: "30s" },
    "6h": { durationMs: 6 * 60 * 60 * 1000, interval: "5m" },
    "24h": { durationMs: 24 * 60 * 60 * 1000, interval: "15m" },
    "7d": { durationMs: 7 * 24 * 60 * 60 * 1000, interval: "1h" },
}

export function historyRange(preset: HistoryPreset, now = new Date()) {
    const to = new Date(now.getTime() - 1000)
    return { from: new Date(to.getTime() - historyPresets[preset].durationMs).toISOString(), to: to.toISOString() }
}
