export type AgentTab = "overview" | "processes"

export function agentTabFromHash(hash: string): AgentTab {
    return hash === "#processes" ? "processes" : "overview"
}
