import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import type { ReactNode } from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts"
import { Activity, ArrowLeft, Cpu, Fingerprint, HardDrive, MemoryStick } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchAgents, fetchAggregatedMetrics } from "../api/api"
import type { AggregatedMetric } from "../types/aggregated-metric"
import type { Agent } from "../types/agent"
import { bytesToGB } from "../util/format"
import { osIcon } from "../util/os"

export default function AgentDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [metrics, setMetrics] = useState<Record<string, AggregatedMetric[]>>({
        "cpu.used_percent": [],
        "mem.used_percent": [],
        "disk.used_percent": [],
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [agent, setAgent] = useState<Agent | null>(null)

    const loadAllMetrics = useCallback(async () => {
        if (!id) return
        try {
            const metricNames = ["cpu.used_percent", "mem.used_percent", "disk.used_percent"]
            const [agents, results] = await Promise.all([
                fetchAgents(),
                Promise.all(metricNames.map(async (name) => {
                    const data = await fetchAggregatedMetrics(id, name, "30s")
                    return {
                        name,
                        data: data.map(m => ({
                            ...m,
                            bucket: new Date(m.bucket).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                        }))
                    }
                })),
            ])

            const newMetrics: Record<string, AggregatedMetric[]> = {}
            results.forEach(res => {
                newMetrics[res.name] = res.data
            })

            setAgent(agents.find(item => item.agentId === id) ?? null)
            setMetrics(newMetrics)
            setError(null)
        } catch (err) {
            console.error(err)
            setError("Failed to load metrics")
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        loadAllMetrics()
        const interval = setInterval(loadAllMetrics, 5000)
        return () => clearInterval(interval)
    }, [loadAllMetrics])

    const renderChart = (title: string, data: AggregatedMetric[]) => {
        const latestValue = data.length > 0 ? data[data.length - 1].avgValue : null

        return (
            <div className="border-b border-border p-4 last:border-b-0 lg:border-b-0 lg:border-r lg:p-6 lg:last:border-r-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                    {latestValue !== null && (
                        <div className="text-xl font-bold">{latestValue.toFixed(1)}%</div>
                    )}
                </div>
                    <div className="mt-4 h-64 w-full">
                        {data.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                No data available
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis 
                                        dataKey="bucket" 
                                        stroke="var(--muted-foreground)" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <YAxis 
                                        domain={[0, 100]} 
                                        stroke="var(--muted-foreground)" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: "var(--card)", 
                                            borderColor: "var(--border)",
                                            color: "var(--card-foreground)",
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="avgValue"
                                        stroke="var(--chart-1)"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl p-3 sm:p-6 lg:py-10">
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex min-h-14 items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div className="min-w-0">
                        <p className="font-mono text-sm tracking-wider text-muted-foreground">kanshi · agent</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{id}</p>
                    </div>
                    <div className="ml-auto min-w-0">
                        <span className="truncate font-mono text-xs sm:text-sm">{agent?.hostName}</span>
                    </div>
                </div>

                {agent && (
                    <div className="grid grid-cols-2 border-b border-border sm:grid-cols-3 lg:grid-cols-6">
                        <SystemInfo icon={<img src={osIcon(agent.platform)} alt="" className="h-4 w-4" />} label="OS" value={`${agent.os || agent.platform} · ${agent.arch}`} />
                        <SystemInfo icon={<Cpu className="h-4 w-4" />} label="CPU" value={`${agent.cpuCores} cores`} />
                        <SystemInfo icon={<MemoryStick className="h-4 w-4" />} label="Memory" value={bytesToGB(agent.totalMemory)} />
                        <SystemInfo icon={<HardDrive className="h-4 w-4" />} label="Disk" value={bytesToGB(agent.diskSize)} />
                        <SystemInfo icon={<Fingerprint className="h-4 w-4" />} label="Agent version" value={agent.version} mono />
                        <SystemInfo icon={<Activity className="h-4 w-4" />} label="Status" value={agent.status} status={agent.status} />
                    </div>
                )}

                {loading && Object.values(metrics).every(m => m.length === 0) ? (
                    <div className="h-96 animate-pulse bg-muted/40" role="status" aria-label="Loading metrics" />
                ) : error && Object.values(metrics).every(m => m.length === 0) ? (
                    <div className="grid min-h-96 place-items-center text-destructive">{error}</div>
                ) : (
                    <div className="grid lg:grid-cols-3">
                        {renderChart("CPU usage", metrics["cpu.used_percent"])}
                        {renderChart("Memory usage", metrics["mem.used_percent"])}
                        {renderChart("Disk usage", metrics["disk.used_percent"])}
                    </div>
                )}
            </section>
        </div>
    )
}

function SystemInfo({ icon, label, value, mono, status }: { icon: ReactNode; label: string; value: string; mono?: boolean; status?: string }) {
    return (
        <div className="min-w-0 border-b border-r border-border p-4 lg:border-b-0">
            <div className="flex items-center gap-2 text-muted-foreground">
                {icon}
                <p className="text-xs font-medium">{label}</p>
            </div>
            <p className={`mt-1 flex items-center gap-2 truncate text-sm ${mono ? "font-mono text-xs" : "font-medium"} ${status === "online" ? "text-chart-2" : ""}`}>
                {status && <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${status === "online" ? "bg-chart-2" : "bg-destructive"}`} />}
                {value}
            </p>
        </div>
    )
}
