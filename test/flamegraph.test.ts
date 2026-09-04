import assert from "node:assert/strict"
import test from "node:test"
import { layoutFlamegraph, profileSampleTypes, topFunctions } from "../src/util/flamegraph.ts"

const root = { name: "root", value: 100, children: [
    { name: "main.work", value: 70, children: [{ name: "main.hash", value: 40, children: [] }] },
    { name: "main.wait", value: 30, children: [{ name: "main.hash", value: 10, children: [] }] },
] }

test("lays out flamegraph frames proportionally", () => {
    const frames = layoutFlamegraph(root, 1000)
    assert.equal(frames[0].width, 1000)
    assert.equal(frames[1].width, 700)
    assert.equal(frames[3].x, 700)
    assert.equal(frames[3].width, 300)
})

test("aggregates an accessible top-functions table", () => {
    assert.deepEqual(topFunctions(root), [
        { name: "main.work", value: 70 }, { name: "main.hash", value: 50 }, { name: "main.wait", value: 30 },
    ])
})

test("offers valid sample types by profile kind", () => {
    assert.deepEqual(profileSampleTypes("cpu"), ["cpu", "samples"])
    assert.deepEqual(profileSampleTypes("mutex"), ["delay", "contentions"])
    assert.deepEqual(profileSampleTypes("trace"), [])
})
