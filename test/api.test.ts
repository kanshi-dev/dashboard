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

test("API requests send and clear the dashboard key", async () => {
    const values = new Map([["kanshi.dashboardKey", "dashboard-secret"]])
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
    } })
    const { fetchAgents } = await import("../src/api/api.ts")
    let authorization = ""
    globalThis.fetch = async (_input, init) => {
        authorization = new Headers(init?.headers).get("Authorization") ?? ""
        return new Response(null, { status: 401 })
    }

    await assert.rejects(fetchAgents, /Invalid dashboard key/)
    assert.equal(authorization, "Bearer dashboard-secret")
    assert.equal(values.has("kanshi.dashboardKey"), false)
})
