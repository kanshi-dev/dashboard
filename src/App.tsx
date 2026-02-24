import { BrowserRouter, Routes, Route } from "react-router-dom"
import AgentsPage from "./pages/AgentsPage"
import AgentDetailPage from "./pages/AgentDetailPage"

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AgentsPage />} />
                <Route path="/agents/:id" element={<AgentDetailPage />} />
            </Routes>
        </BrowserRouter>
    )
}