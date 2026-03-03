import { useEffect, useState } from "react"
import { fetchAgents } from "../api/api.ts"
import {type Agent } from "../types/agent"
import AgentView from "../components/AgentView.tsx";

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAgents()
            .then(setAgents)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div>Loading...</div>

    return (
        <div>
            <h1>Server List</h1>
                {agents.map(a => (
                    <AgentView key={a.agentId} agent={a} />
                ))}
        </div>
    )
}