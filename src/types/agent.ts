export interface Agent {
    agentId: string
    lastSeen: string
    status: "online" | "offline"
}