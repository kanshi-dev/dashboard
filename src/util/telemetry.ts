import type { Host, Span } from "@/types/telemetry"

export function agentProcessPath(host?: Host) {
    return host?.agentId ? `/agents/${encodeURIComponent(host.agentId)}#processes` : undefined
}

export function orderSpans(spans: Span[]) {
    const children = new Map<string, Span[]>()
    for (const span of spans) children.set(span.parentSpanId, [...(children.get(span.parentSpanId) ?? []), span])
    const out: { span: Span; depth: number }[] = []
    const seen = new Set<string>()
    function visit(span: Span, depth: number) {
        if (seen.has(span.spanId)) return
        seen.add(span.spanId)
        out.push({ span, depth })
        for (const child of children.get(span.spanId) ?? []) visit(child, depth + 1)
    }
    for (const span of spans.filter(item => !spans.some(parent => parent.spanId === item.parentSpanId))) visit(span, 0)
    for (const span of spans) visit(span, 0)
    return out
}
