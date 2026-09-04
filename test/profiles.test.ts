import assert from "node:assert/strict"
import test from "node:test"
import { profileDurations } from "../src/util/profiles.ts"

test("profile durations match capture type", () => {
    assert.deepEqual(profileDurations("cpu"), [5, 10, 30])
    assert.deepEqual(profileDurations("trace"), [1, 5])
    for (const type of ["heap", "allocs", "goroutine", "mutex", "block", "threadcreate"] as const) {
        assert.deepEqual(profileDurations(type), [0])
    }
})
