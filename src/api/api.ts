import type { Agent } from "../types/agent"
import type { AggregatedMetric } from "../types/aggregated-metric"

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

async function request<T>(path: string): Promise<T> {
	const key = typeof globalThis.localStorage?.getItem === "function" ? globalThis.localStorage.getItem(DASHBOARD_KEY) : null
    const res = await fetch(`${API_URL}${path}`, {
        headers: key ? { Authorization: `Bearer ${key}` } : {},
    })
    if (res.status === 401) clearDashboardKey()
    if (!res.ok) throw new Error(res.status === 401 ? "Invalid dashboard key" : "Request failed")
    const json: ApiResponse<T> = await res.json()
    return json.data
}

export async function fetchAgents(): Promise<Agent[]> {
    return (await request<Agent[]>("/agents")) || []
}

export async function fetchAggregatedMetrics(
    agentId: string,
    name: string,
    interval: string
): Promise<AggregatedMetric[]> {
    const params = new URLSearchParams({ agentId, name, interval })
    return (await request<AggregatedMetric[]>(`/metrics/aggregate?${params}`)) || []
}
