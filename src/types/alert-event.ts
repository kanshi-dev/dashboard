export interface AlertEvent {
    id: number
    ruleId: number
    ruleName: string
    metric: string
    agentId: string
    state: string // firing | resolved
    value: number
    createdAt: string
    webhookStatus: string // pending | delivered | failed | skipped
    webhookError?: string
}
