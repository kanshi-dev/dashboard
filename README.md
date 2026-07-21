# Kanshi Dashboard

Kanshi provides a comprehensive view into your distributed system by monitoring agents and their metrics in real-time.

## What Kanshi Can Do

### 🖥️ Real-time Agent Monitoring
![Agents Overview](https://raw.githubusercontent.com/kanshi-dev/demo/main/imgs/agents.png)
- **Live Status Tracking**: Instantly view the status of all active agents in your network.
- **Agent Overview**: Get a bird's-eye view of your entire infrastructure from a single, centralized dashboard.

### 📊 Deep Metric Analysis
![Agent Details](https://raw.githubusercontent.com/kanshi-dev/demo/main/imgs/agent-details.png)
- **Detailed Visualizations**: Dive deep into any specific agent to see its historical and real-time performance data.
- **Aggregated Metrics**: View trends and patterns through interactive charts, helping you identify bottlenecks or anomalies quickly.
- **Configurable Intervals**: Analyze data at different time granularities to suit your monitoring needs.

### 📱 Seamless User Experience
- **Anywhere Access**: The dashboard is fully responsive, allowing you to monitor your systems from your desktop, tablet, or smartphone.
- **Intuitive Navigation**: Easily switch between high-level overviews and detailed agent views with a clean, user-friendly interface.

## Test against a local API

`npm run dev` targets `http://127.0.0.1:8080/api/v1` through `.env.development`. Copy `.env.example` to `.env.local` only when you need to override that address. Production defaults to the same-origin `/api/v1` proxy.
