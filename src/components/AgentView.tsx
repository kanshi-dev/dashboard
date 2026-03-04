import {Link} from "react-router-dom"
import type {Agent} from "../types/agent"
import {Cpu} from "lucide-react"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription, CardContent,
} from "./ui/card"

interface AgentViewProps {
    agent: Agent
}

export default function AgentView({agent}: AgentViewProps) {
    const isOnline = agent.status === "online"

    return (
        <Link to={`/agents/${agent.agentId}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        {agent.agentId}
                    </CardTitle>

                    <CardDescription className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}/>
                            {agent.status}
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-muted-foreground"/>
                        <span className="text-sm text-muted-foreground">
                            CPU Usage : {agent.cpuCores}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}