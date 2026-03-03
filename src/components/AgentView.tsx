import {Link} from "react-router-dom";
import type {Agent} from "../types/agent.ts";


interface AgentViewProps {
    agent: Agent
}


export default function AgentView({agent}: AgentViewProps) {

    return (
        <div>
            <Link to={`/agents/${agent.agentId}`}>
                {agent.agentId} - {agent.status}
            </Link>
        </div>
    )
}