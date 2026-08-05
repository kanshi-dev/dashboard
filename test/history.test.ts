import assert from "node:assert/strict"
import test from "node:test"
import { historyPresets, historyRange } from "../src/util/history.ts"

test("history presets use bounded aggregate intervals", () => {
    assert.deepEqual(Object.fromEntries(Object.entries(historyPresets).map(([key, value]) => [key, value.interval])), {
        "1h": "30s", "6h": "5m", "24h": "15m", "7d": "1h",
    })
    assert.deepEqual(historyRange("6h", new Date("2026-08-05T12:00:00Z")), {
        from: "2026-08-05T06:00:00.000Z", to: "2026-08-05T12:00:00.000Z",
    })
})
