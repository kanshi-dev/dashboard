export type AgentTab = "overview" | "processes" | "profiles"

export function agentTabFromHash(hash: string): AgentTab {
    return hash === "#processes" ? "processes" : hash === "#profiles" ? "profiles" : "overview"
}

export function agentTabHash(tab: AgentTab): string {
    return tab === "overview" ? "" : `#${tab}`
}
