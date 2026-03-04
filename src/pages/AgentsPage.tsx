import { useEffect, useState } from "react"
import { fetchAgents } from "../api/api"
import type { Agent } from "../types/agent"
import AgentView from "../components/AgentView"

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAgents()
            .then(setAgents)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Agents</h1>


            {loading ? (
                <div className="text-muted-foreground">Loading agents...</div>
            ) : agents.length === 0 ? (
                <div className="text-muted-foreground">No agents found</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {agents.map((agent) => (
                        <AgentView key={agent.agentId} agent={agent} />
                    ))}
                </div>
            )}
        </div>
    )
}