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
import { Activity, ArrowDown, ArrowLeft, ArrowUp, Cpu, Fingerprint, HardDrive, MemoryStick } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchAgents, fetchAggregatedMetrics, fetchRawMetrics } from "../api/api"
import type { AggregatedMetric } from "../types/aggregated-metric"
import type { Agent } from "../types/agent"
import type { ProcessSnapshot } from "../types/process"
import { bytes, bytesPerSecond, bytesToGB } from "../util/format"
import { historyPresets, historyRange } from "../util/history"
import type { HistoryPreset } from "../util/history"
import { osIcon } from "../util/os"
import { mergeProcessMetrics } from "../util/processes"

export default function AgentDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [metrics, setMetrics] = useState<Record<string, AggregatedMetric[]>>({
        "cpu.used_percent": [],
        "mem.used_percent": [],
        "disk.used_percent": [],
        "net.bytes_sent_per_second": [],
        "net.bytes_recv_per_second": [],
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [agent, setAgent] = useState<Agent | null>(null)
    const [preset, setPreset] = useState<HistoryPreset>("1h")
    const [processes, setProcesses] = useState<ProcessSnapshot>({ processes: [] })
    const [processLoading, setProcessLoading] = useState(true)
    const [processError, setProcessError] = useState<string | null>(null)
    const [processSort, setProcessSort] = useState<{ field: "cpuPercent" | "memoryRssBytes"; ascending: boolean }>({ field: "cpuPercent", ascending: false })

    const loadAllMetrics = useCallback(async () => {
        if (!id) return
        try {
            const metricNames = ["cpu.used_percent", "mem.used_percent", "disk.used_percent", "net.bytes_sent_per_second", "net.bytes_recv_per_second"]
            const range = historyRange(preset)
            const [agents, results] = await Promise.all([
                fetchAgents(),
                Promise.all(metricNames.map(async (name) => {
                    const data = await fetchAggregatedMetrics(id, name, historyPresets[preset].interval, range.from, range.to)
                    return {
                        name,
                        data: data.map(m => ({
                            ...m,
                            bucket: new Date(m.bucket).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
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
    }, [id, preset])

    const loadProcesses = useCallback(async () => {
        if (!id) return
        const to = new Date()
        const from = new Date(to.getTime() - 60 * 60 * 1000)
        try {
            const [cpu, memory, count] = await Promise.all([
                fetchRawMetrics(id, "process.cpu_percent", from.toISOString(), to.toISOString()),
                fetchRawMetrics(id, "process.memory_rss_bytes", from.toISOString(), to.toISOString()),
                fetchRawMetrics(id, "process.count", from.toISOString(), to.toISOString()),
            ])
            setProcesses(mergeProcessMetrics(cpu, memory, count))
            setProcessError(null)
        } catch (err) {
            console.error(err)
            setProcessError("Failed to load process metrics")
        } finally {
            setProcessLoading(false)
        }
    }, [id])

    useEffect(() => {
        loadAllMetrics()
        const interval = setInterval(loadAllMetrics, 5000)
        return () => clearInterval(interval)
    }, [loadAllMetrics])

    useEffect(() => {
        loadProcesses()
        const interval = setInterval(loadProcesses, 5000)
        return () => clearInterval(interval)
    }, [loadProcesses])

    const sortedProcesses = [...processes.processes].sort((a, b) => {
        const difference = (a[processSort.field] ?? -1) - (b[processSort.field] ?? -1)
        return processSort.ascending ? difference : -difference
    })

    const changeProcessSort = (field: "cpuPercent" | "memoryRssBytes") => {
        setProcessSort(current => ({ field, ascending: current.field === field ? !current.ascending : false }))
    }

    const renderChart = (title: string, data: AggregatedMetric[], network = false) => {
        const latestValue = data.length > 0 ? data[data.length - 1].avgValue : null

        return (
            <div className="border-b border-border p-4 last:border-b-0 lg:border-b-0 lg:border-r lg:p-6 lg:last:border-r-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                    {latestValue !== null && (
                        <div className="text-xl font-bold">{network ? bytesPerSecond(latestValue) : `${latestValue.toFixed(1)}%`}</div>
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
                                        domain={network ? undefined : [0, 100]}
                                        stroke="var(--muted-foreground)" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(value) => network ? bytesPerSecond(value) : `${value}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: "var(--card)", 
                                            borderColor: "var(--border)",
                                            color: "var(--card-foreground)",
                                            fontSize: '12px'
                                        }}
                                        formatter={(value) => network ? bytesPerSecond(Number(value)) : `${Number(value).toFixed(1)}%`}
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

                <div className="flex justify-end border-b border-border px-4 py-3 sm:px-6">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        History
                        <select className="rounded-md border border-border bg-background px-3 py-2 text-foreground" value={preset} onChange={event => setPreset(event.target.value as HistoryPreset)}>
                            {Object.keys(historyPresets).map(value => <option key={value}>{value}</option>)}
                        </select>
                    </label>
                </div>

                {loading && Object.values(metrics).every(m => m.length === 0) ? (
                    <div className="h-96 animate-pulse bg-muted/40" role="status" aria-label="Loading metrics" />
                ) : error && Object.values(metrics).every(m => m.length === 0) ? (
                    <div className="grid min-h-96 place-items-center text-destructive">{error}</div>
                ) : (
                    <div className="grid lg:grid-cols-2">
                        {renderChart("CPU usage", metrics["cpu.used_percent"])}
                        {renderChart("Memory usage", metrics["mem.used_percent"])}
                        {renderChart("Disk usage", metrics["disk.used_percent"])}
                        {renderChart("Network send", metrics["net.bytes_sent_per_second"], true)}
                        {renderChart("Network receive", metrics["net.bytes_recv_per_second"], true)}
                    </div>
                )}

                <div className="border-t border-border">
                    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-4 py-4 sm:px-6">
                        <div>
                            <h2 className="font-semibold">Processes</h2>
                            <p className="text-sm text-muted-foreground">{processes.count === undefined ? "Process count unavailable" : `${processes.count.toLocaleString()} running`}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                            {processError && processes.processes.length > 0 && <p className="text-destructive">Refresh failed, showing the last sample</p>}
                            {processes.sampledAt && <p>Sampled {new Date(processes.sampledAt).toLocaleString()}</p>}
                        </div>
                    </div>
                    {processLoading && processes.processes.length === 0 ? (
                        <div className="h-40 animate-pulse bg-muted/40" role="status" aria-label="Loading processes" />
                    ) : processError && processes.processes.length === 0 ? (
                        <div className="grid min-h-40 place-items-center text-destructive">{processError}</div>
                    ) : processes.processes.length === 0 ? (
                        <div className="grid min-h-40 place-items-center px-4 text-center text-sm text-muted-foreground">
                            Process telemetry is off or has not reported yet. Set KANSHI_PROCESS_METRICS=true on this agent to opt in.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <caption className="sr-only">Newest process CPU and resident-memory metrics</caption>
                                <thead className="text-xs text-muted-foreground">
                                    <tr className="border-b border-border">
                                        <th className="px-4 py-3 font-medium sm:px-6">Process</th>
                                        <th className="px-4 py-3 font-medium">PID</th>
                                        <SortableHeading label="CPU" active={processSort.field === "cpuPercent"} ascending={processSort.ascending} onClick={() => changeProcessSort("cpuPercent")} />
                                        <SortableHeading label="RSS" active={processSort.field === "memoryRssBytes"} ascending={processSort.ascending} onClick={() => changeProcessSort("memoryRssBytes")} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedProcesses.map(process => (
                                        <tr key={`${process.pid}:${process.process}`} className="border-b border-border last:border-0">
                                            <td className="max-w-80 truncate px-4 py-3 font-medium sm:px-6">{process.process}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{process.pid}</td>
                                            <td className="px-4 py-3 tabular-nums">{process.cpuPercent === undefined ? "Unavailable" : `${process.cpuPercent.toFixed(1)}%`}</td>
                                            <td className="px-4 py-3 tabular-nums">{process.memoryRssBytes === undefined ? "Unavailable" : bytes(process.memoryRssBytes)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

function SortableHeading({ label, active, ascending, onClick }: { label: string; active: boolean; ascending: boolean; onClick: () => void }) {
    return (
        <th className="px-4 py-3 font-medium" aria-sort={active ? (ascending ? "ascending" : "descending") : "none"}>
            <button type="button" className="flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={onClick}>
                {label}
                {active && (ascending ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
            </button>
        </th>
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
