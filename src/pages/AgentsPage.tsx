import { useEffect, useState } from "react"
import { fetchAgents } from "../api/api"
import type { Agent } from "../types/agent"
import AgentView from "../components/AgentView"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchAgents()
            .then(setAgents)
            .finally(() => setLoading(false))
    }, [])

    const filteredAgents = agents.filter(agent => 
        agent.hostName.toLowerCase().includes(search.toLowerCase()) ||
        agent.agentId.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search agents..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                    Loading agents...
                </div>
            ) : filteredAgents.length === 0 ? (
                <div className="flex items-center justify-center min-h-[200px] text-muted-foreground border-2 border-dashed rounded-lg">
                    {search ? "No agents matching your search" : "No agents found"}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredAgents.map((agent) => (
                        <AgentView key={agent.agentId} agent={agent} />
                    ))}
                </div>
            )}
        </div>
    )
}