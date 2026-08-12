import assert from "node:assert/strict"
import test from "node:test"
import { agentTabFromHash } from "../src/util/agent-tabs.ts"

test("selects the agent tab from the route hash", () => {
    assert.equal(agentTabFromHash(""), "overview")
    assert.equal(agentTabFromHash("#processes"), "processes")
    assert.equal(agentTabFromHash("#unknown"), "overview")
})
