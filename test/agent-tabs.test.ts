import assert from "node:assert/strict"
import test from "node:test"
import { agentTabFromHash, agentTabHash } from "../src/util/agent-tabs.ts"

test("selects the agent tab from the route hash", () => {
    assert.equal(agentTabFromHash(""), "overview")
    assert.equal(agentTabFromHash("#processes"), "processes")
    assert.equal(agentTabFromHash("#profiles"), "profiles")
    assert.equal(agentTabFromHash("#unknown"), "overview")
})

test("builds route hashes for agent tabs", () => {
    assert.equal(agentTabHash("overview"), "")
    assert.equal(agentTabHash("processes"), "#processes")
    assert.equal(agentTabHash("profiles"), "#profiles")
})
