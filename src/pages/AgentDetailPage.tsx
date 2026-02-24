import { useParams } from "react-router-dom"

export default function AgentDetailPage() {
    const { id } = useParams()

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Agent Detail</h1>
            <p>Agent ID: {id}</p>
        </div>
    )
}