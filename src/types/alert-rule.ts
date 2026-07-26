export interface AlertRule {
    id: number
    name: string
    metric: string
    comparator: string
    threshold: number
    agentId: string | null
    enabled: boolean
    createdAt: string
    updatedAt: string
}

export interface AlertRuleInput {
    name: string
    metric: string
    comparator: string
    threshold: number
    agentId: string | null
    enabled: boolean
}
