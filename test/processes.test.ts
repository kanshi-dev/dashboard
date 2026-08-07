import assert from "node:assert/strict"
import test from "node:test"
import { mergeProcessMetrics } from "../src/util/processes.ts"
import type { RawMetric } from "../src/types/process.ts"

const point = (name: string, value: number, timestamp: string, tags: string[] = []): RawMetric => ({ agentId: "agent", name, value, timestamp, tags })

test("process metrics select newest snapshots and merge tags", () => {
    const older = "2026-08-06T10:00:00Z"
    const newer = "2026-08-06T10:00:05Z"
    const snapshot = mergeProcessMetrics(
        [point("process.cpu_percent", 99, older, ["pid=7", "process=old"]), point("process.cpu_percent", 12, newer, ["pid=7", "process=worker=one"])],
        [point("process.memory_rss_bytes", 2048, newer, ["process=worker=one", "pid=7"])],
        [point("process.count", 4, newer)],
    )
    assert.deepEqual(snapshot, { count: 4, sampledAt: newer, processes: [{ pid: 7, process: "worker=one", cpuPercent: 12, memoryRssBytes: 2048 }] })
})

test("process metrics preserve missing CPU values", () => {
    const timestamp = "2026-08-06T10:00:00Z"
    assert.deepEqual(mergeProcessMetrics([], [point("process.memory_rss_bytes", 1024, timestamp, ["pid=8", "process=first sample"])], []), {
        count: undefined,
        sampledAt: timestamp,
        processes: [{ pid: 8, process: "first sample", memoryRssBytes: 1024 }],
    })
})

test("process metrics compare timestamps chronologically", () => {
    const snapshot = mergeProcessMetrics([
        point("process.cpu_percent", 2, "2026-08-06T10:00:00Z", ["pid=1", "process=older"]),
        point("process.cpu_percent", 1, "2026-08-06T10:00:00.500Z", ["pid=1", "process=newer"]),
    ], [], [])
    assert.equal(snapshot.processes[0].process, "newer")
    assert.equal(snapshot.sampledAt, "2026-08-06T10:00:00.500Z")
})
