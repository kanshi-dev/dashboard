import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChevronDown, Search } from "lucide-react"
import { fetchAgents, fetchAggregatedMetrics } from "../api/api"
import type { Agent } from "../types/agent"
import type { AggregatedMetric } from "../types/aggregated-metric"
import AgentView from "../components/AgentView"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { averageSeries } from "../util/fleet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SystemResource = "cpu" | "memory" | "disk"
type MetricInterval = "30s" | "1m" | "5m" | "15m"

const resources: Record<SystemResource, { label: string; metric: string }> = {
    cpu: { label: "CPU", metric: "cpu.used_percent" },
    memory: { label: "Memory", metric: "mem.used_percent" },
    disk: { label: "Disk", metric: "disk.used_percent" },
}
const intervals: MetricInterval[] = ["30s", "1m", "5m", "15m"]

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [metricsByAgent, setMetricsByAgent] = useState<Record<string, AggregatedMetric[]>>({})
    const [resource, setResource] = useState<SystemResource>("cpu")
    const [selectedInterval, setSelectedInterval] = useState<MetricInterval>("30s")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        let active = true
        const refresh = async () => {
            try {
                const nextAgents = await fetchAgents()
                const metrics = Object.fromEntries(await Promise.all(nextAgents.map(async agent => [
                    agent.agentId,
                    await fetchAggregatedMetrics(agent.agentId, resources[resource].metric, selectedInterval),
                ])))
                if (active) {
                    setAgents(nextAgents)
                    setMetricsByAgent(metrics)
                    setError("")
                }
            } catch {
                if (active) setError("Could not refresh fleet data")
            } finally {
                if (active) setLoading(false)
            }
        }
        refresh()
        const timer = setInterval(refresh, 5000)
        return () => { active = false; clearInterval(timer) }
    }, [retry, resource, selectedInterval])

    const filteredAgents = agents.filter(agent =>
        agent.hostName.toLowerCase().includes(search.toLowerCase()) ||
        agent.agentId.toLowerCase().includes(search.toLowerCase())
    )
    const fleetMetrics = averageSeries(Object.values(metricsByAgent))
    const fleetAverage = fleetMetrics.at(-1)?.avgValue
    const chartData = fleetMetrics.map(metric => ({
        ...metric,
        label: new Date(metric.bucket).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }))

    return (
        <div className="mx-auto max-w-6xl p-3 sm:p-6 lg:py-10">
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-14 items-center gap-3 border-b border-border px-4 sm:px-6">
                    <span className="font-mono text-sm tracking-wider text-muted-foreground">kanshi · overview</span>
                </div>

                <div className="grid grid-cols-3 border-b border-border">
                    <Summary label="Agents" value={String(agents.length)} suffix={`${agents.filter(agent => agent.status === "online").length} online`} />
                    <Summary label={`Avg ${resources[resource].label}`} value={fleetAverage === undefined ? "—" : `${fleetAverage.toFixed(0)}%`} />
                    <div className="min-w-0 p-4 sm:p-6">
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Interval</p>
                        <Dropdown value={selectedInterval} options={intervals} onChange={value => setSelectedInterval(value as MetricInterval)} />
                    </div>
                </div>

                {error && (
                    <div role="alert" className="flex items-center justify-between border-b border-border bg-destructive/10 px-5 py-3 text-sm">
                        <span>{error}</span>
                        <Button variant="outline" size="sm" onClick={() => setRetry(value => value + 1)}>Retry</Button>
                    </div>
                )}

                <div className="border-b border-border p-4 sm:p-6">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Dropdown
                            value={resource}
                            options={Object.keys(resources)}
                            labels={Object.fromEntries(Object.entries(resources).map(([key, value]) => [key, value.label]))}
                            onChange={value => setResource(value as SystemResource)}
                            suffix="utilization · all agents"
                        />
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Search agents..." className="h-9 pl-9" value={search} onChange={event => setSearch(event.target.value)} />
                        </div>
                    </div>
                    <div className="h-64 sm:h-80">
                        {loading && chartData.length === 0 ? (
                            <div className="h-full animate-pulse rounded-md bg-muted/60" role="status" aria-label="Loading fleet metrics" />
                        ) : chartData.length === 0 ? (
                            <div className="grid h-full place-items-center text-sm text-muted-foreground">Waiting for {resources[resource].label.toLowerCase()} metrics</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="fleet-cpu" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={11} minTickGap={28} />
                                    <YAxis domain={[0, 100]} hide />
                                    <Tooltip contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", borderRadius: 8 }} formatter={(value) => [`${Number(value).toFixed(1)}%`, `Fleet ${resources[resource].label}`]} />
                                    <Area type="monotone" dataKey="avgValue" stroke="var(--chart-1)" strokeWidth={3} fill="url(#fleet-cpu)" dot={false} activeDot={{ r: 4 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div>
                    {loading && agents.length === 0 ? (
                        [0, 1, 2].map(item => <div key={item} className="h-16 animate-pulse border-b border-border bg-muted/40 last:border-0" />)
                    ) : filteredAgents.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">{search ? "No agents matching your search" : "No agents found"}</div>
                    ) : filteredAgents.map(agent => (
                        <AgentView key={agent.agentId} agent={agent} resourceValue={metricsByAgent[agent.agentId]?.at(-1)?.avgValue} />
                    ))}
                </div>
            </section>
        </div>
    )
}

function Dropdown({ value, options, labels = {}, onChange, suffix }: {
    value: string
    options: string[]
    labels?: Record<string, string>
    onChange: (value: string) => void
    suffix?: string
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="-ml-3 mt-1 h-auto gap-1 px-3 py-1 text-xl font-bold sm:text-3xl">
                    {labels[value] ?? value}
                    {suffix && <span className="ml-1 text-base font-medium text-muted-foreground">{suffix}</span>}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                    {options.map(option => (
                        <DropdownMenuRadioItem key={option} value={option}>{labels[option] ?? option}</DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function Summary({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
    return (
        <div className="min-w-0 border-r border-border p-4 last:border-r-0 sm:p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className="mt-2 truncate text-xl font-bold tabular-nums sm:text-3xl">{value} {suffix && <span className="text-xs font-medium text-chart-2 sm:text-base">{suffix}</span>}</p>
        </div>
    )
}
