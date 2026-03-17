import type { Agent } from "../types/agent"
import type { AggregatedMetric } from "../types/aggregated-metric"

const API_URL = "/api/v1"

interface ApiResponse<T> {
    code: number
    message: string
    data: T
}

export async function fetchAgents(): Promise<Agent[]> {
    const res = await fetch(`${API_URL}/agents`)
    if (!res.ok) throw new Error("Failed to fetch agents")

    const json: ApiResponse<Agent[]> = await res.json()
    return json.data || []
}

export async function fetchAggregatedMetrics(
    agentId: string,
    name: string
): Promise<AggregatedMetric[]> {
    const res = await fetch(
        `${API_URL}/metrics/aggregate?agentId=${agentId}&name=${name}&interval=30s`
    )

    if (!res.ok) throw new Error("Failed to fetch metrics")

    const json: ApiResponse<AggregatedMetric[]> = await res.json()
    return json.data || []
}