import { useEffect, useState } from "react"
import { fetchAgents } from "../api/agents"
import {type Agent } from "../types/agent"
import { Link } from "react-router-dom"

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
            <h1>Agents</h1>
            <ul>
                {agents.map(a => (
                    <li key={a.agentId}>
                        <Link to={`/agents/${a.agentId}`}>
                            {a.agentId} - {a.status}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}