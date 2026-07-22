import { Component, type ErrorInfo, type ReactNode } from "react"

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(error, info)
    }

    render() {
        if (this.state.failed) {
            return <main className="min-h-screen grid place-items-center p-6 text-center"><div><h1 className="text-2xl font-bold">Something went wrong</h1><p className="my-3 text-muted-foreground">Reload the dashboard to try again.</p><button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => location.reload()}>Reload</button></div></main>
        }
        return this.props.children
    }
}
