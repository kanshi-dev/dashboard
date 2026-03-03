import { useParams } from "react-router-dom"
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
import { fetchAggregatedMetrics } from "../api/api"
import type { AggregatedMetric } from "../types/aggregated-metric"

export default function AgentDetailPage() {
    const { id } = useParams()
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

    if (loading) {
        return <div style={{ padding: "2rem" }}>Loading metrics...</div>
    }

    if (error) {
        return <div style={{ padding: "2rem", color: "red" }}>{error}</div>
    }

    return (
        <div style={{ padding: "2rem" }}>
            <h2>Agent: {id}</h2>

            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="avgValue"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}