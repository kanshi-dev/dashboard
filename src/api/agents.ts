import type {Agent} from "../types/agent"

export async function fetchAgents(): Promise<Agent[]> {
    const res = await fetch("http://localhost:8080/api/v1/agents")
    if (!res.ok) throw new Error("Failed to fetch agents")
    const data = await res.json()
    return data.data
}