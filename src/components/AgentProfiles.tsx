import { cloneElement, useCallback, useEffect, useMemo, useState } from "react"
import type { ReactElement } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createProfile, createTraceViewerSession, downloadProfile, fetchProfiles } from "@/api/api"
import type { ProfileCapture, ProfileTarget, ProfileType } from "@/types/profile"
import { bytes } from "@/util/format"
import { profileDurations } from "@/util/profiles"
import ProfileFlamegraph from "@/components/ProfileFlamegraph"

const types: { value: ProfileType; label: string }[] = [
    { value: "cpu", label: "CPU" }, { value: "trace", label: "Execution trace" },
    { value: "heap", label: "Heap" }, { value: "allocs", label: "Allocations" },
    { value: "goroutine", label: "Goroutines" }, { value: "mutex", label: "Mutex" },
    { value: "block", label: "Block" }, { value: "threadcreate", label: "Thread creation" },
]

export default function AgentProfiles({ agentId, targets }: { agentId: string; targets: ProfileTarget[] }) {
    const [captures, setCaptures] = useState<ProfileCapture[]>([])
    const [targetName, setTargetName] = useState(targets[0]?.name ?? "")
    const [profileType, setProfileType] = useState<ProfileType>("cpu")
    const [duration, setDuration] = useState(5)
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const active = useMemo(() => captures.some(capture => capture.state === "queued" || capture.state === "capturing"), [captures])

    const load = useCallback(async () => {
        try { setCaptures(await fetchProfiles(agentId)); setError(null) }
        catch (err) { setError(err instanceof Error ? err.message : "Failed to load profiles") }
        finally { setLoading(false) }
    }, [agentId])

    useEffect(() => { load() }, [load])
    useEffect(() => {
        if (!active) return
        const timer = setInterval(load, 2000)
        return () => clearInterval(timer)
    }, [active, load])
    useEffect(() => {
        const options = profileDurations(profileType)
        setDuration(options[0])
    }, [profileType])
    useEffect(() => {
        if (!targets.some(target => target.name === targetName)) setTargetName(targets[0]?.name ?? "")
    }, [targetName, targets])

    const start = async () => {
        setCreating(true)
        try {
            const capture = await createProfile(agentId, { targetName, profileType, durationSeconds: duration })
            setCaptures(current => [capture, ...current.filter(item => item.id !== capture.id)])
            setError(null)
        } catch (err) { setError(err instanceof Error ? err.message : "Failed to start profile") }
        finally { setCreating(false) }
    }

    const download = async (capture: ProfileCapture) => {
        try {
            const { blob, filename } = await downloadProfile(capture.id)
            const href = URL.createObjectURL(blob)
            const anchor = document.createElement("a")
            anchor.href = href; anchor.download = filename; anchor.click()
            URL.revokeObjectURL(href)
        } catch (err) { setError(err instanceof Error ? err.message : "Download failed") }
    }

    const openTrace = async (capture: ProfileCapture) => {
        try {
            const { url } = await createTraceViewerSession(capture.id)
            window.open(url, "_blank", "noopener,noreferrer")
        } catch (err) { setError(err instanceof Error ? err.message : "Trace viewer failed to start") }
    }

    return <div>
        <div className="flex flex-wrap items-end gap-3 border-b border-border px-4 py-4 sm:px-6">
            {targets.length === 0 ? <p className="max-w-2xl text-sm text-muted-foreground">Profiling is off for this Agent. Configure KANSHI_PPROF_TARGETS or KANSHI_PPROF_DISCOVERY on the Agent to approve a Go service.</p> : <>
                <Control label="Target"><select value={targetName} onChange={event => setTargetName(event.target.value)}>{targets.map(target => <option key={target.name} value={target.name}>{target.name}{target.discovered ? " (discovered)" : ""}</option>)}</select></Control>
                <Control label="Profile"><select value={profileType} onChange={event => setProfileType(event.target.value as ProfileType)}>{types.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></Control>
                {duration > 0 && <Control label="Duration"><select value={duration} onChange={event => setDuration(Number(event.target.value))}>{profileDurations(profileType).map(seconds => <option key={seconds} value={seconds}>{seconds} seconds</option>)}</select></Control>}
                <Button onClick={start} disabled={creating || active || !targetName}>{creating ? "Starting…" : active ? "Capture active" : "Start capture"}</Button>
            </>}
        </div>
        {error && <p role="alert" className="border-b border-border px-4 py-3 text-sm text-destructive sm:px-6">{error}</p>}
        {loading && captures.length === 0 ? <div className="h-40 animate-pulse bg-muted/40" role="status" aria-label="Loading profiles" /> : captures.length === 0 ? <div className="grid min-h-40 place-items-center px-4 text-center text-sm text-muted-foreground">No captures yet. Choose an approved target and capture only when you need a diagnostic snapshot.</div> : <div className="divide-y divide-border">{captures.map(capture => <article key={capture.id} className="px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div><div className="flex items-center gap-2"><h3 className="font-medium">{types.find(type => type.value === capture.profileType)?.label}</h3><Status state={capture.state} /></div><p className="mt-1 text-sm text-muted-foreground">{capture.targetName}{capture.durationSeconds ? ` · ${capture.durationSeconds}s` : ""} · {new Date(capture.createdAt).toLocaleString()}</p></div>
                {capture.state === "completed" && <div className="flex gap-2">{capture.profileType === "trace" && <Button variant="outline" size="sm" onClick={() => openTrace(capture)}>Open trace viewer</Button>}{capture.profileType !== "trace" && <Button variant="outline" size="sm" aria-expanded={selected === capture.id} onClick={() => setSelected(current => current === capture.id ? null : capture.id)}>{selected === capture.id ? "Hide flamegraph" : "View flamegraph"}</Button>}<Button variant="outline" size="sm" onClick={() => download(capture)}><Download className="h-4 w-4" />Download {capture.size ? bytes(capture.size) : "raw"}</Button></div>}
            </div>
            {capture.error && <p className="mt-3 text-sm text-destructive">{capture.error}</p>}
            {capture.profileType === "trace" && capture.state === "completed" && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">View this execution trace in Kanshi. The raw artifact remains available for export.</p>}
            {selected === capture.id && capture.state === "completed" && capture.profileType !== "trace" && <ProfileFlamegraph capture={capture} />}
        </article>)}</div>}
    </div>
}

function Control({ label, children }: { label: string; children: ReactElement<{ className?: string }> }) {
    return <label className="grid gap-1 text-xs font-medium text-muted-foreground">{label}{cloneElement(children, { className: "min-w-36 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" })}</label>
}

function Status({ state }: { state: ProfileCapture["state"] }) {
    const tone = state === "completed" ? "text-chart-2" : state === "failed" ? "text-destructive" : "text-primary"
    return <span className={`text-xs font-medium ${tone}`}>{state}</span>
}
