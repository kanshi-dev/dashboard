import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import AgentsPage from "./pages/AgentsPage"
import AgentDetailPage from "./pages/AgentDetailPage"
import AuthScreen from "./components/AuthScreen"
import ErrorBoundary from "./components/ErrorBoundary"
import { AUTH_REQUIRED_EVENT, DASHBOARD_KEY } from "./api/api"

export default function App() {
    const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem(DASHBOARD_KEY)))
    useEffect(() => {
        const requireAuth = () => setAuthenticated(false)
        addEventListener(AUTH_REQUIRED_EVENT, requireAuth)
        return () => removeEventListener(AUTH_REQUIRED_EVENT, requireAuth)
    }, [])

    if (!authenticated) return <AuthScreen onAuthenticated={() => setAuthenticated(true)} />

    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={<AgentsPage />} />
                        <Route path="/agents/:id" element={<AgentDetailPage />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </ErrorBoundary>
    )
}
