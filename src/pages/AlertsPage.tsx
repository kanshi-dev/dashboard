import { useEffect, useState, type FormEvent } from "react"
import { Pencil, Trash2, Plus, X } from "lucide-react"
import {
    fetchAgents,
    fetchAlertRules,
    createAlertRule,
    updateAlertRule,
    deleteAlertRule,
    fetchActiveAlerts,
    fetchAlertHistory,
} from "../api/api"
import type { Agent } from "../types/agent"
import type { AlertRule, AlertRuleInput } from "../types/alert-rule"
import type { AlertEvent } from "../types/alert-event"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const METRICS: Record<string, string> = {
    "cpu.used_percent": "CPU used %",
    "mem.used_percent": "Memory used %",
    "disk.used_percent": "Disk used %",
    "agent.offline": "Agent offline (seconds)",
}
const COMPARATORS: Record<string, string> = { gt: "greater than", lt: "less than" }

const emptyForm: AlertRuleInput = {
    name: "",
    metric: "cpu.used_percent",
    comparator: "gt",
    threshold: 90,
    agentId: null,
    enabled: true,
}

export default function AlertsPage() {
    const [rules, setRules] = useState<AlertRule[]>([])
    const [active, setActive] = useState<AlertEvent[]>([])
    const [history, setHistory] = useState<AlertEvent[]>([])
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [retry, setRetry] = useState(0)

    const [form, setForm] = useState<AlertRuleInput>(emptyForm)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [formError, setFormError] = useState("")
    const [busy, setBusy] = useState(false)

    async function refresh() {
        const [nextRules, nextActive, nextHistory, nextAgents] = await Promise.all([
            fetchAlertRules(),
            fetchActiveAlerts(),
            fetchAlertHistory(50),
            fetchAgents(),
        ])
        setRules(nextRules)
        setActive(nextActive)
        setHistory(nextHistory)
        setAgents(nextAgents)
        setError("")
    }

    useEffect(() => {
        let mounted = true
        const run = () => refresh().catch(() => { if (mounted) setError("Could not load alerts") }).finally(() => { if (mounted) setLoading(false) })
        run()
        const timer = setInterval(run, 5000)
        return () => { mounted = false; clearInterval(timer) }
    }, [retry])

    function startCreate() {
        setEditingId(null)
        setForm(emptyForm)
        setFormError("")
        setFormOpen(true)
    }

    function startEdit(rule: AlertRule) {
        setEditingId(rule.id)
        setForm({ name: rule.name, metric: rule.metric, comparator: rule.comparator, threshold: rule.threshold, agentId: rule.agentId, enabled: rule.enabled })
        setFormError("")
        setFormOpen(true)
    }

    async function submit(event: FormEvent) {
        event.preventDefault()
        setBusy(true)
        setFormError("")
        try {
            if (editingId === null) await createAlertRule(form)
            else await updateAlertRule(editingId, form)
            setFormOpen(false)
            await refresh()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Could not save rule")
        } finally {
            setBusy(false)
        }
    }

    async function toggleEnabled(rule: AlertRule) {
        try {
            await updateAlertRule(rule.id, { name: rule.name, metric: rule.metric, comparator: rule.comparator, threshold: rule.threshold, agentId: rule.agentId, enabled: !rule.enabled })
            await refresh()
        } catch {
            setError("Could not update rule")
        }
    }

    async function remove(rule: AlertRule) {
        try {
            await deleteAlertRule(rule.id)
            await refresh()
        } catch {
            setError("Could not delete rule")
        }
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6 lg:py-10">
            {error && (
                <div role="alert" className="flex items-center justify-between rounded-xl border border-border bg-destructive/10 px-5 py-3 text-sm">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={() => setRetry(value => value + 1)}>Retry</Button>
                </div>
            )}

            {/* Rules */}
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
                    <span className="font-mono text-sm tracking-wider text-muted-foreground">kanshi · alert rules</span>
                    {!formOpen && <Button size="sm" onClick={startCreate}><Plus className="h-4 w-4" /> New rule</Button>}
                </div>

                {formOpen && (
                    <form onSubmit={submit} className="grid gap-4 border-b border-border p-4 sm:p-6" aria-busy={busy}>
                        <div className="flex items-center justify-between">
                            <h2 className="font-medium">{editingId === null ? "Create rule" : "Edit rule"}</h2>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen(false)} aria-label="Close form"><X className="h-4 w-4" /></Button>
                        </div>
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium">Name</span>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="High CPU on web tier" required />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-1.5">
                                <span className="text-sm font-medium">Metric</span>
                                <Select value={form.metric} onChange={v => setForm({ ...form, metric: v })} options={METRICS} />
                            </label>
                            <label className="space-y-1.5">
                                <span className="text-sm font-medium">Condition</span>
                                <Select value={form.comparator} onChange={v => setForm({ ...form, comparator: v })} options={COMPARATORS} />
                            </label>
                            <label className="space-y-1.5">
                                <span className="text-sm font-medium">Threshold</span>
                                <Input type="number" min={0} step="any" value={form.threshold} onChange={e => setForm({ ...form, threshold: Number(e.target.value) })} required />
                            </label>
                            <label className="space-y-1.5">
                                <span className="text-sm font-medium">Agent</span>
                                <Select
                                    value={form.agentId ?? ""}
                                    onChange={v => setForm({ ...form, agentId: v || null })}
                                    options={{ "": "All agents (global)", ...Object.fromEntries(agents.map(a => [a.agentId, a.hostName || a.agentId])) }}
                                />
                            </label>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} className="h-4 w-4 accent-primary" />
                            Enabled
                        </label>
                        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
                        <div className="flex gap-2">
                            <Button disabled={busy}>{busy ? "Saving..." : editingId === null ? "Create rule" : "Save changes"}</Button>
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                        </div>
                    </form>
                )}

                <div>
                    {loading && rules.length === 0 ? (
                        [0, 1].map(i => <div key={i} className="h-16 animate-pulse border-b border-border bg-muted/40 last:border-0" role="status" aria-label="Loading rules" />)
                    ) : rules.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">No alert rules yet. Create one to start monitoring.</div>
                    ) : rules.map(rule => (
                        <div key={rule.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 sm:px-6">
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{rule.name}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {METRICS[rule.metric] ?? rule.metric} {COMPARATORS[rule.comparator] ?? rule.comparator} {rule.threshold}
                                    {" · "}{rule.agentId ? rule.agentId : "all agents"}
                                </p>
                            </div>
                            <button
                                onClick={() => toggleEnabled(rule)}
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${rule.enabled ? "bg-chart-2/15 text-chart-2" : "bg-muted text-muted-foreground"}`}
                                aria-pressed={rule.enabled}
                            >
                                {rule.enabled ? "enabled" : "disabled"}
                            </button>
                            <Button variant="ghost" size="icon" onClick={() => startEdit(rule)} aria-label={`Edit ${rule.name}`}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => remove(rule)} aria-label={`Delete ${rule.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Active alerts */}
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-14 items-center gap-3 border-b border-border px-4 sm:px-6">
                    <span className="font-mono text-sm tracking-wider text-muted-foreground">kanshi · active alerts</span>
                    {active.length > 0 && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">{active.length} firing</span>}
                </div>
                {loading && active.length === 0 ? (
                    <div className="h-16 animate-pulse bg-muted/40" role="status" aria-label="Loading active alerts" />
                ) : active.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">All clear. No active alerts.</div>
                ) : active.map(event => (
                    <div key={event.id} className="flex items-center gap-3 border-b border-destructive/20 bg-destructive/5 px-4 py-3 last:border-0 sm:px-6">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" aria-hidden />
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{event.ruleName}</p>
                            <p className="truncate text-xs text-muted-foreground">{event.agentId} · {METRICS[event.metric] ?? event.metric} at {event.value}</p>
                        </div>
                        <time className="shrink-0 text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleTimeString()}</time>
                    </div>
                ))}
            </section>

            {/* History */}
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-14 items-center border-b border-border px-4 sm:px-6">
                    <span className="font-mono text-sm tracking-wider text-muted-foreground">kanshi · alert history</span>
                </div>
                {loading && history.length === 0 ? (
                    <div className="h-16 animate-pulse bg-muted/40" role="status" aria-label="Loading history" />
                ) : history.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">No alert history yet.</div>
                ) : history.map(event => (
                    <div key={event.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 sm:px-6">
                        <StateBadge state={event.state} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{event.ruleName}</p>
                            <p className="truncate text-xs text-muted-foreground">{event.agentId} · {METRICS[event.metric] ?? event.metric} at {event.value}</p>
                        </div>
                        <WebhookBadge status={event.webhookStatus} error={event.webhookError} />
                        <time className="hidden shrink-0 text-xs text-muted-foreground sm:block">{new Date(event.createdAt).toLocaleString()}</time>
                    </div>
                ))}
            </section>
        </div>
    )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Record<string, string> }) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            {Object.entries(options).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
    )
}

function StateBadge({ state }: { state: string }) {
    const firing = state === "firing"
    return (
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${firing ? "bg-destructive/15 text-destructive" : "bg-chart-2/15 text-chart-2"}`}>
            {state}
        </span>
    )
}

function WebhookBadge({ status, error }: { status: string; error?: string }) {
    const tone: Record<string, string> = {
        delivered: "text-chart-2",
        failed: "text-destructive",
        pending: "text-muted-foreground",
        skipped: "text-muted-foreground",
    }
    return <span title={error || undefined} className={`shrink-0 text-xs ${tone[status] ?? "text-muted-foreground"}`}>webhook: {status}</span>
}
