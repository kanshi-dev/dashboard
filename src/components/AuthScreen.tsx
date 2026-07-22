import { useState, type FormEvent } from "react"
import { fetchAgents, DASHBOARD_KEY } from "../api/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
    const [key, setKey] = useState("")
    const [error, setError] = useState("")
    const [busy, setBusy] = useState(false)

    async function submit(event: FormEvent) {
        event.preventDefault()
        setBusy(true)
        setError("")
        localStorage.setItem(DASHBOARD_KEY, key)
        try {
            await fetchAgents()
            onAuthenticated()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to connect")
        } finally {
            setBusy(false)
        }
    }

    return (
        <main className="min-h-screen grid place-items-center bg-background p-6">
            <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow-sm" aria-busy={busy}>
                <div>
                    <h1 className="text-2xl font-bold">Open Kanshi</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Enter the dashboard key from your server configuration.</p>
                </div>
                <label className="block space-y-2">
                    <span className="text-sm font-medium">Dashboard key</span>
                    <Input type="password" autoComplete="current-password" value={key} onChange={(event) => setKey(event.target.value)} required autoFocus />
                </label>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button className="w-full" disabled={busy}>{busy ? "Checking..." : "Continue"}</Button>
            </form>
        </main>
    )
}
