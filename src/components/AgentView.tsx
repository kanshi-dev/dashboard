import {Link} from "react-router-dom"
import type {Agent} from "../types/agent"
import {Cpu, MemoryStick} from "lucide-react"
import {
    Card,
    CardHeader,
    CardContent,
} from "./ui/card"

interface AgentViewProps {
    agent: Agent
}

export default function AgentView({agent}: AgentViewProps) {
    const isOnline = agent.status === "online"

    return (
        <Link to={`/agents/${agent.agentId}`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer border">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">

                        {/* Host + icon */}
                        <div className="flex items-center gap-3">
                            <img src="/images/os-icons/apple-icon.svg" alt="os-icon" className="h-7 w-7"/>
                            <div>
                                <p className="font-medium leading-none">{agent.hostName}</p>
                                <p className="text-xs text-muted-foreground mt-1">{agent.agentId}</p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}/>
                            <span className="text-muted-foreground capitalize">{agent.status}</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-2">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Cpu className="h-4 w-4"/>
                            <span>{agent.cpuCores} cores</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MemoryStick className="h-4 w-4"/>
                            <span>{agent.totalMemory}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}