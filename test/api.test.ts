import assert from "node:assert/strict"
import test from "node:test"

import { fetchAggregatedMetrics } from "../src/api/api.ts"

test("fetchAggregatedMetrics encodes query parameters", async () => {
    let requested = ""
    globalThis.fetch = async (input) => {
        requested = String(input)
        return new Response(JSON.stringify({ code: 200, message: "ok", data: [] }))
    }

    await fetchAggregatedMetrics("host&group=東京", "disk used=50%")

    const url = new URL(requested, "http://localhost")
    assert.equal(url.searchParams.get("agentId"), "host&group=東京")
    assert.equal(url.searchParams.get("name"), "disk used=50%")
    assert.equal(url.searchParams.get("interval"), "30s")
})
