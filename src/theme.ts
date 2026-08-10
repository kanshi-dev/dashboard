export type Theme = "light" | "dark"

const storageKey = "kanshi-theme"
type ThemeRoot = { classList: Pick<DOMTokenList, "toggle">, style: Pick<CSSStyleDeclaration, "colorScheme"> }

export function getTheme(storage: Pick<Storage, "getItem"> = localStorage): Theme {
    return storage.getItem(storageKey) === "light" ? "light" : "dark"
}

export function applyTheme(theme: Theme, root: ThemeRoot = document.documentElement) {
    root.classList.toggle("dark", theme === "dark")
    root.style.colorScheme = theme
}

export function saveTheme(theme: Theme, storage: Pick<Storage, "setItem"> = localStorage, root: ThemeRoot = document.documentElement) {
    storage.setItem(storageKey, theme)
    applyTheme(theme, root)
}
