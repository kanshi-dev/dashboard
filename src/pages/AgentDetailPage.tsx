import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchAggregatedMetrics } from "../api/api"
import type { AggregatedMetric } from "../types/aggregated-metric"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

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

    const loadAllMetrics = useCallback(async () => {
        if (!id) return
        try {
            const metricNames = ["cpu.used_percent", "mem.used_percent", "disk.used_percent"]
            const results = await Promise.all(
                metricNames.map(async (name) => {
                    const data = await fetchAggregatedMetrics(id, name)
                    return {
                        name,
                        data: data.map(m => ({
                            ...m,
                            bucket: new Date(m.bucket).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                        }))
                    }
                })
            )

            const newMetrics: Record<string, AggregatedMetric[]> = {}
            results.forEach(res => {
                newMetrics[res.name] = res.data
            })

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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">{title}</CardTitle>
                    {latestValue !== null && (
                        <div className="text-xl font-bold">{latestValue.toFixed(1)}%</div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="h-64 w-full mt-4">
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
                                        stroke="var(--primary)"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate(-1)}
                    className="-ml-2"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back</span>
                </Button>
                <h2 className="text-2xl font-bold tracking-tight">Agent: {id}</h2>
            </div>

            {loading && Object.values(metrics).every(m => m.length === 0) ? (
                <div className="flex items-center justify-center min-h-100 text-muted-foreground border rounded-lg bg-card">
                    Loading metrics...
                </div>
            ) : error && Object.values(metrics).every(m => m.length === 0) ? (
                <div className="flex items-center justify-center min-h-100 text-destructive border rounded-lg bg-card">
                    {error}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {renderChart("CPU Usage (%)", metrics["cpu.used_percent"])}
                    {renderChart("Memory Usage (%)", metrics["mem.used_percent"])}
                    {renderChart("Disk Usage (%)", metrics["disk.used_percent"])}
                </div>
            )}
        </div>
    )
}