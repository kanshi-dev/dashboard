import type { Agent } from "../types/agent"
import type { AggregatedMetric } from "../types/aggregated-metric"
import type { AlertRule, AlertRuleInput } from "../types/alert-rule"
import type { AlertEvent } from "../types/alert-event"
import type { LogRecord, ServiceSummary, TraceDetail, TraceFilters, TraceSummary } from "../types/telemetry"
import type { RawMetric } from "../types/process"
import type { Flamegraph, ProfileCapture, ProfileType } from "../types/profile"

const API_URL =
    import.meta.env?.VITE_API_URL ||
    (globalThis as { process?: { env: { VITE_API_URL?: string } } }).process?.env
        .VITE_API_URL ||
    "/api/v1"

interface ApiResponse<T> {
    code: number
    message: string
    data: T
}

export const DASHBOARD_KEY = "kanshi.dashboardKey"
export const AUTH_REQUIRED_EVENT = "kanshi:auth-required"

export function clearDashboardKey() {
	if (typeof globalThis.localStorage?.removeItem === "function") globalThis.localStorage.removeItem(DASHBOARD_KEY)
    globalThis.dispatchEvent?.(new Event(AUTH_REQUIRED_EVENT))
}

async function request<T>(path: string, init?: RequestInit, credentials = false): Promise<T> {
	const key = typeof globalThis.localStorage?.getItem === "function" ? globalThis.localStorage.getItem(DASHBOARD_KEY) : null
    const headers: Record<string, string> = {}
    if (key) headers.Authorization = `Bearer ${key}`
    if (init?.body) headers["Content-Type"] = "application/json"
    const res = await fetch(`${API_URL}${path}`, { ...init, headers, ...(credentials ? { credentials: "include" as RequestCredentials } : {}) })
    if (res.status === 401) clearDashboardKey()
    if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid dashboard key")
        const message = await res.json().then((body: ApiResponse<unknown>) => body?.data).catch(() => null)
        throw new Error(typeof message === "string" && message ? message : "Request failed")
    }
    const json: ApiResponse<T> = await res.json()
    return json.data
}

async function requestRaw(path: string): Promise<Response> {
	const key = typeof globalThis.localStorage?.getItem === "function" ? globalThis.localStorage.getItem(DASHBOARD_KEY) : null
	const res = await fetch(`${API_URL}${path}`, { headers: key ? { Authorization: `Bearer ${key}` } : {} })
	if (res.status === 401) clearDashboardKey()
	if (!res.ok) throw new Error(res.status === 401 ? "Invalid dashboard key" : "Request failed")
	return res
}

export async function fetchAgents(): Promise<Agent[]> {
    return (await request<Agent[]>("/agents")) || []
}

export async function fetchAggregatedMetrics(
    agentId: string,
    name: string,
    interval: string,
    from: string,
    to: string,
): Promise<AggregatedMetric[]> {
    const params = new URLSearchParams({ agentId, name, interval, from, to })
    return (await request<AggregatedMetric[]>(`/metrics/aggregate?${params}`)) || []
}

export async function fetchRawMetrics(agentId: string, name: string, from: string, to: string): Promise<RawMetric[]> {
    const params = new URLSearchParams({ agentId, name, from, to })
    return (await request<RawMetric[]>(`/metrics?${params}`)) || []
}

export async function fetchAlertRules(): Promise<AlertRule[]> {
    return (await request<AlertRule[]>("/alerts/rules")) || []
}

export async function createAlertRule(input: AlertRuleInput): Promise<AlertRule> {
    return request<AlertRule>("/alerts/rules", { method: "POST", body: JSON.stringify(input) })
}

export async function updateAlertRule(id: number, input: AlertRuleInput): Promise<AlertRule> {
    return request<AlertRule>(`/alerts/rules/${id}`, { method: "PUT", body: JSON.stringify(input) })
}

export async function deleteAlertRule(id: number): Promise<void> {
    await request<null>(`/alerts/rules/${id}`, { method: "DELETE" })
}

export async function fetchActiveAlerts(): Promise<AlertEvent[]> {
    return (await request<AlertEvent[]>("/alerts/active")) || []
}

export async function fetchAlertHistory(limit = 100): Promise<AlertEvent[]> {
    const params = new URLSearchParams({ limit: String(limit) })
    return (await request<AlertEvent[]>(`/alerts/events?${params}`)) || []
}

export async function fetchServices(): Promise<ServiceSummary[]> {
    return (await request<ServiceSummary[]>("/services")) || []
}

export async function fetchTraces(filters: TraceFilters = {}): Promise<TraceSummary[]> {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== "") params.set(key, String(value))
    }
    return (await request<TraceSummary[]>(`/traces?${params}`)) || []
}

export async function fetchTrace(traceId: string): Promise<TraceDetail> {
    return request<TraceDetail>(`/traces/${encodeURIComponent(traceId)}`)
}

export async function fetchLogs(filters: Pick<TraceFilters, "service" | "traceId" | "from" | "to" | "limit"> & { spanId?: string }): Promise<LogRecord[]> {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== "") params.set(key, String(value))
    }
    return (await request<LogRecord[]>(`/logs?${params}`)) || []
}

export function createProfile(agentId: string, input: { targetName: string; profileType: ProfileType; durationSeconds: number }): Promise<ProfileCapture> {
    return request<ProfileCapture>(`/agents/${encodeURIComponent(agentId)}/profiles`, { method: "POST", body: JSON.stringify(input) })
}

export async function fetchProfiles(agentId: string, limit = 50): Promise<ProfileCapture[]> {
    const params = new URLSearchParams({ limit: String(limit) })
    return (await request<ProfileCapture[]>(`/agents/${encodeURIComponent(agentId)}/profiles?${params}`)) || []
}

export function fetchProfile(id: string): Promise<ProfileCapture> {
    return request<ProfileCapture>(`/profiles/${encodeURIComponent(id)}`)
}

export function fetchProfileFlamegraph(id: string, sampleType = ""): Promise<Flamegraph> {
    const params = new URLSearchParams()
    if (sampleType) params.set("sampleType", sampleType)
    return request<Flamegraph>(`/profiles/${encodeURIComponent(id)}/flamegraph${params.size ? `?${params}` : ""}`)
}

export async function downloadProfile(id: string): Promise<{ blob: Blob; filename: string }> {
    const res = await requestRaw(`/profiles/${encodeURIComponent(id)}/download`)
    const disposition = res.headers.get("Content-Disposition") ?? ""
    const filename = disposition.match(/filename="?([^";]+)"?/)?.[1] ?? `kanshi-profile-${id}`
    return { blob: await res.blob(), filename }
}

export function createTraceViewerSession(id: string): Promise<{ url: string }> {
    return request<{ url: string }>(`/profiles/${encodeURIComponent(id)}/trace/session`, { method: "POST" }, true)
}
