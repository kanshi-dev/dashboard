import { Link } from "react-router-dom"
import type { Agent } from "../types/agent"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "./ui/card"

interface AgentViewProps {
    agent: Agent
}

export default function AgentView({ agent }: AgentViewProps) {
    const isOnline = agent.status === "online"

    return (
        <Link to={`/agents/${agent.agentId}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">
                        {agent.agentId}
                    </CardTitle>
                    <CardDescription>
            <span
                className={`inline-block h-2 w-2 rounded-full mr-2 ${
                    isOnline ? "bg-green-500" : "bg-red-500"
                }`}
            />
                        {agent.status}
                    </CardDescription>
                </CardHeader>
            </Card>
        </Link>
    )
}