export type ProfileType = "cpu" | "trace" | "heap" | "allocs" | "goroutine" | "mutex" | "block" | "threadcreate"

export interface ProfileTarget {
    name: string
    discovered: boolean
}

export interface ProfileCapture {
    id: string
    agentId: string
    targetName: string
    profileType: ProfileType
    durationSeconds: number
    state: "queued" | "capturing" | "completed" | "failed"
    error?: string
    filename?: string
    contentType?: string
    size: number
    createdAt: string
    updatedAt: string
    expiresAt: string
}

export interface FlamegraphNode {
    name: string
    value: number
    children: FlamegraphNode[]
}

export interface Flamegraph {
    sampleType: string
    unit: string
    total: number
    root: FlamegraphNode
}
