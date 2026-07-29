import assert from "node:assert/strict"
import test from "node:test"
import { orderSpans } from "../src/util/telemetry.ts"
import type { Span } from "../src/types/telemetry.ts"

const span = (spanId: string, parentSpanId: string): Span => ({
    traceId: "trace", spanId, parentSpanId, serviceName: "checkout", operation: spanId,
    spanKind: 2, statusCode: 1, statusMessage: "", startTime: "", endTime: "",
    durationMs: 1, attributes: {},
})

test("orderSpans produces an accessible parent-child waterfall order", () => {
    const ordered = orderSpans([span("grandchild", "child"), span("root", ""), span("child", "root")])
    assert.deepEqual(ordered.map(item => [item.span.spanId, item.depth]), [
        ["root", 0], ["child", 1], ["grandchild", 2],
    ])
})
