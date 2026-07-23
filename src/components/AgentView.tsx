import { Link } from "react-router-dom"
import type { Agent } from "../types/agent"
import { bytesToGB } from "../util/format"
import { osIcon } from "../util/os"

export default function AgentView({ agent, resourceValue }: { agent: Agent; resourceValue?: number }) {
    const online = agent.status === "online"
    return (
        <Link
            to={`/agents/${agent.agentId}`}
            className="grid gap-2 border-b border-border px-4 py-4 transition-colors last:border-0 hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_5rem_6rem] sm:items-center sm:px-6"
        >
            <div className="flex min-w-0 items-center gap-3">
                <img src={osIcon(agent.platform)} alt="" className="h-6 w-6 shrink-0" />
                <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium sm:text-base">{agent.hostName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {agent.cpuCores} cores · {bytesToGB(agent.totalMemory)} RAM · {bytesToGB(agent.diskSize)} disk
                    </p>
                </div>
            </div>
            <p className="text-sm text-muted-foreground">{agent.platform} · {agent.arch}</p>
            <p className="text-sm tabular-nums text-muted-foreground">{resourceValue === undefined ? "—" : `${resourceValue.toFixed(0)}%`}</p>
            <p className={`flex items-center gap-2 text-sm ${online ? "text-chart-2" : "text-destructive"}`}>
                <span className={`h-2 w-2 rounded-full ${online ? "bg-chart-2" : "bg-destructive"}`} />
                <span className="capitalize">{agent.status}</span>
            </p>
        </Link>
    )
}
