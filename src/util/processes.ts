import type { ProcessMetric, ProcessSnapshot, RawMetric } from "../types/process"

function newest(points: RawMetric[]): RawMetric[] {
    const timestamp = points.reduce((latest, point) => point.timestamp > latest ? point.timestamp : latest, "")
    return points.filter(point => point.timestamp === timestamp)
}

function processIdentity(tags: string[]): Pick<ProcessMetric, "pid" | "process"> | null {
    const values = Object.fromEntries(tags.map(tag => {
        const separator = tag.indexOf("=")
        return separator < 0 ? [tag, ""] : [tag.slice(0, separator), tag.slice(separator + 1)]
    }))
    const pid = Number(values.pid)
    return Number.isInteger(pid) && values.process ? { pid, process: values.process } : null
}

export function mergeProcessMetrics(cpu: RawMetric[], memory: RawMetric[], count: RawMetric[]): ProcessSnapshot {
    const processes = new Map<string, ProcessMetric>()
    for (const [points, field] of [[newest(cpu), "cpuPercent"], [newest(memory), "memoryRssBytes"]] as const) {
        for (const point of points) {
            const identity = processIdentity(point.tags)
            if (!identity) continue
            const key = `${identity.pid}\0${identity.process}`
            processes.set(key, { ...identity, ...processes.get(key), [field]: point.value })
        }
    }
    const sampledAt = [...cpu, ...memory, ...count].reduce((latest, point) => point.timestamp > latest ? point.timestamp : latest, "")
    return {
        count: newest(count)[0]?.value,
        sampledAt: sampledAt || undefined,
        processes: [...processes.values()],
    }
}
