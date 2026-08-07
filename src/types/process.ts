export interface RawMetric {
    agentId: string
    name: string
    value: number
    timestamp: string
    tags: string[]
}

export interface ProcessMetric {
    pid: number
    process: string
    cpuPercent?: number
    memoryRssBytes?: number
}

export interface ProcessSnapshot {
    count?: number
    sampledAt?: string
    processes: ProcessMetric[]
}
