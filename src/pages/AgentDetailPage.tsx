import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
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

export default function AgentDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState<AggregatedMetric[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return

        const load = async () => {
            try {
                const metrics = await fetchAggregatedMetrics(
                    id,
                    "cpu.used_percent"
                )

                // Format timestamps for chart display
                const formatted = metrics.map(m => ({
                    ...m,
                    bucket: new Date(m.bucket).toLocaleTimeString(),
                }))

                setData(formatted)
                setError(null)
            } catch (err) {
                console.error(err)
                setError("Failed to load metrics")
            } finally {
                setLoading(false)
            }
        }

        load()

        const interval = setInterval(load, 5000)

        return () => clearInterval(interval)
    }, [id])

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
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

            {loading ? (
                <div className="flex items-center justify-center min-h-100 text-muted-foreground border rounded-lg bg-card">
                    Loading metrics...
                </div>
            ) : error ? (
                <div className="flex items-center justify-center min-h-100 text-destructive border rounded-lg bg-card">
                    {error}
                </div>
            ) : data.length === 0 ? (
                <div className="flex items-center justify-center min-h-100 text-muted-foreground border-2 border-dashed rounded-lg">
                    No data available
                </div>
            ) : (
                <div className="rounded-lg border bg-card p-4">
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis 
                                dataKey="bucket" 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <YAxis 
                                domain={[0, 100]} 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: "hsl(var(--card))", 
                                    borderColor: "hsl(var(--border))",
                                    color: "hsl(var(--card-foreground))"
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="avgValue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}