export interface ServiceSummary {
    serviceName: string
    requestCount: number
    errorCount: number
    errorRate: number
    avgDurationMs: number
    p95DurationMs: number
    hosts: Host[]
}

export interface Host {
    agentId?: string
    hostName: string
}

export interface TraceSummary {
    traceId: string
    serviceName: string
    rootOperation: string
    startTime: string
    endTime: string
    durationMs: number
    statusCode: number
    spanCount: number
}

export interface Span {
    traceId: string
    spanId: string
    parentSpanId: string
    serviceName: string
    operation: string
    spanKind: number
    statusCode: number
    statusMessage: string
    startTime: string
    endTime: string
    durationMs: number
    attributes: Record<string, unknown>
    host?: Host
}

export interface TraceDetail {
    traceId: string
    spans: Span[]
}

export interface LogRecord {
    timestamp: string
    serviceName: string
    severity: string
    body: string
    traceId: string
    spanId: string
    attributes: Record<string, unknown>
}

export interface TraceFilters {
    service?: string
    status?: "ok" | "error"
    minDurationMs?: number
    traceId?: string
    from?: string
    to?: string
    limit?: number
}
