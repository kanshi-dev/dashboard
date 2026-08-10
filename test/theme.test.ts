import assert from "node:assert/strict"
import test from "node:test"
import { applyTheme, getTheme, saveTheme } from "../src/theme.ts"

test("theme defaults to dark", () => {
    assert.equal(getTheme({ getItem: () => null }), "dark")
    assert.equal(getTheme({ getItem: () => "invalid" }), "dark")
})

test("theme changes the root class and native color scheme", () => {
    const classes = new Set(["dark"])
    const root = {
        classList: { toggle: (name: string, force: boolean) => force ? (classes.add(name), true) : (classes.delete(name), false) },
        style: { colorScheme: "dark" },
    }

    applyTheme("light", root)
    assert.equal(classes.has("dark"), false)
    assert.equal(root.style.colorScheme, "light")
    applyTheme("dark", root)
    assert.equal(classes.has("dark"), true)
})

test("theme persists under the dashboard storage key", () => {
    let saved = ""
    const root = { classList: { toggle: () => false }, style: { colorScheme: "dark" } }
    saveTheme("light", { setItem: (key, value) => { saved = `${key}=${value}` } }, root)
    assert.equal(saved, "kanshi-theme=light")
    assert.equal(root.style.colorScheme, "light")
})
