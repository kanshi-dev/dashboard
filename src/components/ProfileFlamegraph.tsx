import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { fetchProfileFlamegraph } from "@/api/api"
import type { Flamegraph, FlamegraphNode, ProfileCapture } from "@/types/profile"
import { layoutFlamegraph, profileSampleTypes, topFunctions } from "@/util/flamegraph"

const frameHeight = 26

export default function ProfileFlamegraph({ capture }: { capture: ProfileCapture }) {
    const sampleTypes = profileSampleTypes(capture.profileType)
    const [sampleType, setSampleType] = useState(sampleTypes[0] ?? "")
    const [graph, setGraph] = useState<Flamegraph | null>(null)
    const [zoom, setZoom] = useState<FlamegraphNode | null>(null)
    const [hovered, setHovered] = useState<FlamegraphNode | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        fetchProfileFlamegraph(capture.id, sampleType).then(value => { if (active) { setGraph(value); setError(null) } }).catch(err => { if (active) setError(err instanceof Error ? err.message : "Failed to build flamegraph") })
        return () => { active = false }
    }, [capture.id, sampleType])

    const root = zoom ?? graph?.root
    const frames = useMemo(() => root ? layoutFlamegraph(root) : [], [root])
    const functions = useMemo(() => graph ? topFunctions(graph.root) : [], [graph])
    const height = (Math.max(0, ...frames.map(frame => frame.depth)) + 1) * 28

    return <div className="mt-4 border-t border-border pt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">Sample type<select className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={sampleType} onChange={event => { setGraph(null); setZoom(null); setError(null); setSampleType(event.target.value) }}>{sampleTypes.map(type => <option key={type}>{type}</option>)}</select></label>
            {zoom && <Button variant="outline" size="sm" onClick={() => setZoom(null)}>Reset zoom</Button>}
        </div>
        {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : !graph ? <div className="mt-4 h-32 animate-pulse bg-muted/40" role="status" aria-label="Loading flamegraph" /> : graph.total === 0 || graph.root.children.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">This profile contains no {graph.sampleType} samples. Mutex and block profiles can be empty when no contention occurred.</p> : <>
            <p aria-live="polite" className="mt-4 truncate font-mono text-xs text-muted-foreground">{hovered ? `${hovered.name} · ${formatValue(hovered.value, graph.unit)}` : `Total · ${formatValue(graph.total, graph.unit)}`}</p>
            <div className="mt-2 overflow-x-auto">
                <svg viewBox={`0 0 1000 ${height}`} className="min-w-[720px]" style={{ width: "100%", height: `${Math.max(160, height)}px` }} role="img" aria-label={`${graph.sampleType} flamegraph. Use the top functions table below for the same data.`}>
                    {frames.map((frame, index) => <g key={`${frame.depth}:${frame.x}:${frame.node.name}`} role="button" tabIndex={0} aria-label={`${frame.node.name}, ${formatValue(frame.node.value, graph.unit)}`} onClick={() => setZoom(frame.node)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setZoom(frame.node) } }} onMouseEnter={() => setHovered(frame.node)} onMouseLeave={() => setHovered(null)} className="cursor-pointer outline-none focus-visible:[&>rect]:stroke-foreground">
                        <rect x={frame.x + 0.5} y={frame.y + 0.5} width={Math.max(0, frame.width - 1)} height={frameHeight} rx="2" fill={`var(--chart-${index % 5 + 1})`} fillOpacity={0.82} stroke="var(--background)" />
                        {frame.width > 70 && <text x={frame.x + 6} y={frame.y + 17} fontSize="11" fill="var(--background)" pointerEvents="none">{truncate(frame.node.name, frame.width)}</text>}
                        <title>{frame.node.name} · {formatValue(frame.node.value, graph.unit)}</title>
                    </g>)}
                </svg>
            </div>
            <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="mb-2 text-left font-medium">Top functions by inclusive {graph.sampleType}</caption><thead className="text-xs text-muted-foreground"><tr className="border-b border-border"><th className="py-2 pr-4 font-medium">Function</th><th className="py-2 text-right font-medium">Value</th></tr></thead><tbody>{functions.map(fn => <tr key={fn.name} className="border-b border-border last:border-0"><td className="max-w-xl truncate py-2 pr-4 font-mono text-xs">{fn.name}</td><td className="py-2 text-right tabular-nums">{formatValue(fn.value, graph.unit)}</td></tr>)}</tbody></table></div>
        </>}
    </div>
}

function truncate(name: string, width: number): string {
    const chars = Math.max(4, Math.floor(width / 7) - 2)
    return name.length > chars ? `${name.slice(0, chars - 1)}…` : name
}

function formatValue(value: number, unit: string): string {
    if (unit === "nanoseconds") return `${(value / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })} ms`
    if (unit === "bytes") return new Intl.NumberFormat(undefined, { notation: "compact", style: "unit", unit: "byte", unitDisplay: "narrow" }).format(value)
    return `${value.toLocaleString()} ${unit}`
}
