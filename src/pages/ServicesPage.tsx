import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Activity, ChevronRight, RefreshCw, Search } from "lucide-react"
import { Link } from "react-router-dom"
import { fetchServices, fetchTraces } from "@/api/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ServiceSummary, TraceFilters, TraceSummary } from "@/types/telemetry"

export default function ServicesPage() {
    const [services, setServices] = useState<ServiceSummary[]>([])
    const [traces, setTraces] = useState<TraceSummary[]>([])
    const [filters, setFilters] = useState<TraceFilters>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const load = useCallback(async (nextFilters: TraceFilters) => {
        setLoading(true)
        try {
            const [nextServices, nextTraces] = await Promise.all([fetchServices(), fetchTraces(nextFilters)])
            setServices(nextServices)
            setTraces(nextTraces)
            setError("")
        } catch {
            setError("Could not load application telemetry")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load({}) }, [load])

    function submit(event: FormEvent) {
        event.preventDefault()
        load(filters)
    }

    function selectService(service: string) {
        const next = { ...filters, service }
        setFilters(next)
        load(next)
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6 lg:py-10">
            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
                    <div>
                        <p className="font-mono text-sm tracking-wider text-muted-foreground">kanshi · services</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Last hour from sampled server and root spans</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => load(filters)} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {error && (
                    <div role="alert" className="flex items-center justify-between border-b border-border bg-destructive/10 px-4 py-3 text-sm sm:px-6">
                        <span>{error}</span>
                        <Button variant="outline" size="sm" onClick={() => load(filters)}>Retry</Button>
                    </div>
                )}

                {loading && services.length === 0 ? (
                    <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2].map(item => <div key={item} className="h-32 animate-pulse bg-muted" role="status" aria-label="Loading services" />)}
                    </div>
                ) : services.length === 0 ? (
                    <div className="grid min-h-48 place-items-center p-8 text-center">
                        <div className="max-w-md">
                            <Activity className="mx-auto h-6 w-6 text-muted-foreground" />
                            <h1 className="mt-3 font-medium">No application telemetry yet</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Connect an OpenTelemetry Collector and send a request through an instrumented service. Host monitoring continues independently.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                        {services.map(service => (
                            <button key={service.serviceName} onClick={() => selectService(service.serviceName)} className="bg-card p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:p-5">
                                <span className="flex items-center justify-between gap-2">
                                    <span className="truncate font-medium">{service.serviceName}</span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                </span>
                                <span className="mt-5 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                                    <Metric label="Requests" value={service.requestCount.toLocaleString()} />
                                    <Metric label="Errors" value={`${(service.errorRate * 100).toFixed(1)}%`} danger={service.errorCount > 0} />
                                    <Metric label="P95" value={formatDuration(service.p95DurationMs)} />
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <section className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="border-b border-border p-4 sm:p-6">
                    <div className="mb-4">
                        <h2 className="font-medium">Trace search</h2>
                        <p className="text-sm text-muted-foreground">Find slow or failed requests from the last hour.</p>
                    </div>
                    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_9rem_10rem_1fr_auto]">
                        <label className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Service</span>
                            <Input value={filters.service ?? ""} onChange={event => setFilters({ ...filters, service: event.target.value })} placeholder="checkout" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Status</span>
                            <select value={filters.status ?? ""} onChange={event => setFilters({ ...filters, status: event.target.value as TraceFilters["status"] || undefined })} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <option value="">Any</option>
                                <option value="error">Error</option>
                                <option value="ok">OK</option>
                            </select>
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Minimum duration</span>
                            <Input type="number" min={0} value={filters.minDurationMs ?? ""} onChange={event => setFilters({ ...filters, minDurationMs: event.target.value ? Number(event.target.value) : undefined })} placeholder="ms" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Trace ID</span>
                            <Input value={filters.traceId ?? ""} onChange={event => setFilters({ ...filters, traceId: event.target.value })} placeholder="32 hex characters" className="font-mono" />
                        </label>
                        <Button className="self-end"><Search className="h-4 w-4" /> Search</Button>
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[42rem]">
                        <div className="grid grid-cols-[minmax(12rem,1fr)_8rem_7rem_6rem_2rem] gap-3 border-b border-border px-5 py-2 text-xs font-medium text-muted-foreground">
                            <span>Request</span><span>Service</span><span>Duration</span><span>Status</span><span />
                        </div>
                        {loading && traces.length === 0 ? (
                            [0, 1, 2].map(item => <div key={item} className="h-16 animate-pulse border-b border-border bg-muted/40" />)
                        ) : traces.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">No traces match this search. Broaden the filters or send a new request.</div>
                        ) : traces.map(trace => (
                            <Link key={`${trace.traceId}-${trace.serviceName}`} to={`/traces/${trace.traceId}`} className="grid grid-cols-[minmax(12rem,1fr)_8rem_7rem_6rem_2rem] items-center gap-3 border-b border-border px-5 py-3 text-sm last:border-0 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                                <span className="min-w-0">
                                    <span className="block truncate font-medium">{trace.rootOperation}</span>
                                    <span className="block truncate font-mono text-xs text-muted-foreground">{trace.traceId}</span>
                                </span>
                                <span className="truncate text-muted-foreground">{trace.serviceName}</span>
                                <span className="tabular-nums">{formatDuration(trace.durationMs)}</span>
                                <Status code={trace.statusCode} />
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

function Metric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
    return <span><span className="block">{label}</span><span className={`mt-1 block text-base font-semibold tabular-nums ${danger ? "text-destructive" : "text-foreground"}`}>{value}</span></span>
}

function Status({ code }: { code: number }) {
    const failed = code === 2
    return <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${failed ? "bg-destructive/10 text-destructive" : "bg-chart-2/15 text-chart-2"}`}>{failed ? "error" : "ok"}</span>
}

function formatDuration(value: number) {
    return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${value.toFixed(value < 10 ? 1 : 0)}ms`
}
