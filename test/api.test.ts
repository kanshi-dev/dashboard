import assert from "node:assert/strict"
import test from "node:test"

test("fetchAggregatedMetrics encodes query parameters", async () => {
    process.env.VITE_API_URL = "http://127.0.0.1:8080/test-api"
    const { fetchAggregatedMetrics } = await import("../src/api/api.ts")
    let requested = ""
    globalThis.fetch = async (input) => {
        requested = String(input)
        return new Response(JSON.stringify({ code: 200, message: "ok", data: [] }))
    }

    await fetchAggregatedMetrics("host&group=東京", "disk used=50%")

    const url = new URL(requested, "http://localhost")
    assert.equal(url.origin, "http://127.0.0.1:8080")
    assert.equal(url.pathname, "/test-api/metrics/aggregate")
    assert.equal(url.searchParams.get("agentId"), "host&group=東京")
    assert.equal(url.searchParams.get("name"), "disk used=50%")
    assert.equal(url.searchParams.get("interval"), "30s")
})
