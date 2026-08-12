import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, CircleAlert, FileText } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { fetchLogs, fetchTrace } from "@/api/api"
import { Button } from "@/components/ui/button"
import type { LogRecord, TraceDetail } from "@/types/telemetry"
import { agentProcessPath, orderSpans } from "@/util/telemetry"
import { duration } from "@/util/format"

export default function TraceDetailPage() {
    const { id = "" } = useParams()
    const [trace, setTrace] = useState<TraceDetail | null>(null)
    const [logs, setLogs] = useState<LogRecord[]>([])
    const [selectedSpan, setSelectedSpan] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [nextTrace, nextLogs] = await Promise.all([fetchTrace(id), fetchLogs({ traceId: id, limit: 500 })])
            setTrace(nextTrace)
            setLogs(nextLogs)
            setError("")
        } catch {
            setError("Could not load this trace")
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => { load() }, [load])

    const orderedSpans = useMemo(() => trace ? orderSpans(trace.spans) : [], [trace])
    const visibleLogs = selectedSpan ? logs.filter(record => record.spanId === selectedSpan) : logs
    const start = trace ? Math.min(...trace.spans.map(span => Date.parse(span.startTime))) : 0
    const end = trace ? Math.max(...trace.spans.map(span => Date.parse(span.endTime))) : 0
    const total = Math.max(end - start, 1)

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6 lg:py-10">
            <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" size="sm" asChild><Link to="/services"><ArrowLeft className="h-4 w-4" /> Services</Link></Button>
                {trace && <span className="truncate font-mono text-xs text-muted-foreground">{trace.traceId}</span>}
            </div>

            {error && (
                <div role="alert" className="flex items-center justify-between rounded-xl border border-border bg-destructive/10 px-4 py-3 text-sm">
                    <span>{error}</span><Button variant="outline" size="sm" onClick={load}>Retry</Button>
                </div>
            )}

            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
                    <div>
                        <h1 className="font-medium">{trace?.spans[0]?.operation ?? "Trace waterfall"}</h1>
                        <p className="text-xs text-muted-foreground">{trace ? `${trace.spans.length} spans · ${duration(total)}` : "Parent-child request timing"}</p>
                    </div>
                    {trace && <Status code={Math.max(...trace.spans.map(span => span.statusCode))} />}
                </div>

                {loading && !trace ? (
                    <div className="space-y-px bg-border">
                        {[0, 1, 2, 3].map(item => <div key={item} className="h-16 animate-pulse bg-muted" role="status" aria-label="Loading trace" />)}
                    </div>
                ) : !trace ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">Trace detail is unavailable.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[44rem]">
                            <div className="grid grid-cols-[minmax(14rem,1fr)_minmax(18rem,2fr)_6rem] gap-4 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground sm:px-6">
                                <span>Span</span><span>Timeline</span><span className="text-right">Duration</span>
                            </div>
                            {orderedSpans.map(({ span, depth }) => {
                                const left = ((Date.parse(span.startTime) - start) / total) * 100
                                const width = Math.max((span.durationMs / total) * 100, 0.6)
                                return (
                                    <div key={span.spanId} className="border-b border-border last:border-0">
                                        <button onClick={() => setSelectedSpan(current => current === span.spanId ? "" : span.spanId)} aria-pressed={selectedSpan === span.spanId} className="grid w-full grid-cols-[minmax(14rem,1fr)_minmax(18rem,2fr)_6rem] items-center gap-4 px-4 py-3 text-left text-sm hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-6">
                                        <span className="min-w-0" style={{ paddingLeft: Math.min(depth, 5) * 16 }}>
                                            <span className="flex items-center gap-2">
                                                {span.statusCode === 2 && <CircleAlert className="h-3.5 w-3.5 shrink-0 text-destructive" />}
                                                <span className="truncate font-medium">{span.operation}</span>
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">{span.serviceName} · {span.spanId}</span>
                                        </span>
                                        <span className="relative h-5 rounded bg-muted" aria-label={`Starts ${duration(Date.parse(span.startTime) - start)} into trace`}>
                                            <span className={`absolute top-1 h-3 min-w-px rounded-sm ${span.statusCode === 2 ? "bg-destructive" : "bg-chart-2"}`} style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }} />
                                        </span>
                                        <span className="text-right tabular-nums">{duration(span.durationMs)}</span>
                                        </button>
                                        {span.host && <div className="px-4 pb-2 pl-6 text-xs text-muted-foreground sm:px-6 sm:pl-8">
                                            {agentProcessPath(span.host) ? <Link to={agentProcessPath(span.host)!} className="underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Host: {span.host.hostName}</Link> : <span>Host: {span.host.hostName}</span>}
                                        </div>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </section>

            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
                    <div>
                        <h2 className="font-medium">Correlated logs</h2>
                        <p className="text-xs text-muted-foreground">{selectedSpan ? `Selected span ${selectedSpan}` : "All logs linked to this trace"}</p>
                    </div>
                    {selectedSpan && <Button variant="ghost" size="sm" onClick={() => setSelectedSpan("")}>Show all</Button>}
                </div>
                {loading && logs.length === 0 ? (
                    <div className="h-24 animate-pulse bg-muted/50" role="status" aria-label="Loading correlated logs" />
                ) : visibleLogs.length === 0 ? (
                    <div className="grid min-h-36 place-items-center p-6 text-center text-sm text-muted-foreground">
                        <span><FileText className="mx-auto mb-2 h-5 w-5" />No logs are correlated with {selectedSpan ? "this span" : "this trace"}.</span>
                    </div>
                ) : (
                    <div className="divide-y divide-border font-mono text-xs">
                        {visibleLogs.map((record, index) => (
                            <div key={`${record.timestamp}-${record.spanId}-${index}`} className="grid gap-1 px-4 py-3 sm:grid-cols-[7rem_13rem_minmax(0,1fr)] sm:gap-3 sm:px-6">
                                <time className="text-muted-foreground">{new Date(record.timestamp).toLocaleTimeString()}</time>
                                <span className={severityClass(record.severity)}>{record.severity || "UNSET"}</span>
                                <span className="min-w-0 break-words">{record.body}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

function Status({ code }: { code: number }) {
    const failed = code === 2
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${failed ? "bg-destructive/10 text-destructive" : "bg-chart-2/15 text-chart-2"}`}>{failed ? "error" : "ok"}</span>
}

function severityClass(severity: string) {
    return /error|fatal/i.test(severity) ? "text-destructive" : /warn/i.test(severity) ? "text-chart-1" : "text-muted-foreground"
}
