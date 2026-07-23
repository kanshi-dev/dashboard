import { useState, type FormEvent } from "react"
import { clearDashboardKey, fetchAgents, DASHBOARD_KEY } from "../api/api"
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
            clearDashboardKey()
            setError(err instanceof Error ? err.message : "Unable to connect")
        } finally {
            setBusy(false)
        }
    }

    return (
        <main className="grid min-h-screen place-items-center bg-background p-6">
            <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-7" aria-busy={busy}>
                <div>
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">K</div>
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
