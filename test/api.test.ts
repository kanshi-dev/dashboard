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

    for (const interval of ["30s", "5m", "15m", "1h"]) {
        await fetchAggregatedMetrics("host&group=東京", "disk used=50%", interval, "2026-08-01T00:00:00.000Z", "2026-08-01T01:00:00.000Z")

        const url = new URL(requested, "http://localhost")
        assert.equal(url.origin, "http://127.0.0.1:8080")
        assert.equal(url.pathname, "/test-api/metrics/aggregate")
        assert.equal(url.searchParams.get("agentId"), "host&group=東京")
        assert.equal(url.searchParams.get("name"), "disk used=50%")
        assert.equal(url.searchParams.get("interval"), interval)
        assert.equal(url.searchParams.get("from"), "2026-08-01T00:00:00.000Z")
        assert.equal(url.searchParams.get("to"), "2026-08-01T01:00:00.000Z")
    }
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

test("createAlertRule posts a JSON body", async () => {
    const { createAlertRule } = await import("../src/api/api.ts")
    let method = "", body = "", url = "", contentType = ""
    globalThis.fetch = async (input, init) => {
        url = String(input)
        method = init?.method ?? "GET"
        body = String(init?.body ?? "")
        contentType = new Headers(init?.headers).get("Content-Type") ?? ""
        return new Response(JSON.stringify({ code: 201, message: "ok", data: { id: 1 } }))
    }
    const input = { name: "cpu", metric: "cpu.used_percent", comparator: "gt", threshold: 90, agentId: null, enabled: true }
    const rule = await createAlertRule(input)
    assert.equal(method, "POST")
    assert.ok(url.endsWith("/alerts/rules"))
    assert.equal(contentType, "application/json")
    assert.deepEqual(JSON.parse(body), input)
    assert.equal(rule.id, 1)
})

test("updateAlertRule puts to the rule id", async () => {
    const { updateAlertRule } = await import("../src/api/api.ts")
    let method = "", url = ""
    globalThis.fetch = async (input, init) => {
        url = String(input)
        method = init?.method ?? "GET"
        return new Response(JSON.stringify({ code: 200, message: "ok", data: {} }))
    }
    await updateAlertRule(7, { name: "x", metric: "mem.used_percent", comparator: "lt", threshold: 10, agentId: "agent-a", enabled: false })
    assert.equal(method, "PUT")
    assert.ok(url.endsWith("/alerts/rules/7"))
})

test("deleteAlertRule deletes the rule id", async () => {
    const { deleteAlertRule } = await import("../src/api/api.ts")
    let method = "", url = ""
    globalThis.fetch = async (input, init) => {
        url = String(input)
        method = init?.method ?? "GET"
        return new Response(JSON.stringify({ code: 200, message: "ok", data: null }))
    }
    await deleteAlertRule(9)
    assert.equal(method, "DELETE")
    assert.ok(url.endsWith("/alerts/rules/9"))
})

test("fetchAlertHistory encodes the limit", async () => {
    const { fetchAlertHistory } = await import("../src/api/api.ts")
    let requested = ""
    globalThis.fetch = async (input) => {
        requested = String(input)
        return new Response(JSON.stringify({ code: 200, message: "ok", data: [] }))
    }
    await fetchAlertHistory(25)
    const url = new URL(requested, "http://localhost")
    assert.ok(url.pathname.endsWith("/alerts/events"))
    assert.equal(url.searchParams.get("limit"), "25")
})

test("fetchTraces encodes application telemetry filters", async () => {
    const { fetchTraces } = await import("../src/api/api.ts")
    let requested = ""
    globalThis.fetch = async (input) => {
        requested = String(input)
        return new Response(JSON.stringify({ code: 200, message: "ok", data: [] }))
    }
    await fetchTraces({ service: "checkout & pay", status: "error", minDurationMs: 250, traceId: "a".repeat(32) })
    const url = new URL(requested, "http://localhost")
    assert.ok(url.pathname.endsWith("/traces"))
    assert.equal(url.searchParams.get("service"), "checkout & pay")
    assert.equal(url.searchParams.get("status"), "error")
    assert.equal(url.searchParams.get("minDurationMs"), "250")
    assert.equal(url.searchParams.get("traceId"), "a".repeat(32))
})
