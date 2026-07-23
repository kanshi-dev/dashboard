import assert from "node:assert/strict"
import test from "node:test"
import { averageSeries } from "../src/util/fleet.ts"

test("averageSeries combines matching fleet CPU buckets", () => {
    const metric = (bucket: string, avgValue: number) => ({ bucket, avgValue, minValue: avgValue, maxValue: avgValue, p95Value: avgValue })
    assert.deepEqual(averageSeries([[metric("b", 20), metric("a", 10)], [metric("b", 40)]]).map(({ bucket, avgValue }) => ({ bucket, avgValue })), [
        { bucket: "a", avgValue: 10 },
        { bucket: "b", avgValue: 30 },
    ])
})
