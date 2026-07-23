# Kanshi Dashboard

[![CI](https://github.com/kanshi-dev/dashboard/actions/workflows/ci.yaml/badge.svg)](https://github.com/kanshi-dev/dashboard/actions/workflows/ci.yaml)

Kanshi Dashboard is the authenticated React interface for a Kanshi fleet. It shows live agent status, searchable system details, CPU, memory, and disk utilization, and per-agent charts with selectable aggregation intervals.

![Kanshi fleet overview](https://raw.githubusercontent.com/kanshi-dev/demo/main/imgs/agents.png)

![Kanshi agent details](https://raw.githubusercontent.com/kanshi-dev/demo/main/imgs/agent-details.png)

## Behavior

- Polls agents and metrics every five seconds
- Supports CPU, memory, and disk resources
- Supports `30s`, `1m`, `5m`, and `15m` aggregation intervals
- Preserves loaded data during refresh failures and provides retry
- Stores the dashboard key only in browser local storage
- Supports light and dark themes
- Uses a same-origin `/api/v1` Nginx proxy in Docker

## Develop

```sh
npm ci
npm test
npm run lint
npm run build
npm run dev
```

Development targets `http://127.0.0.1:8080/api/v1` through `.env.development`. Use `.env.local` to override it.

## Run the complete stack

Use the [local demo](https://github.com/kanshi-dev/demo) or the [canonical quickstart](https://github.com/kanshi-dev/core/blob/main/QUICKSTART.md).

## Support and security

Use GitHub issues for public support. Report vulnerabilities through [private vulnerability reporting](SECURITY.md). Kanshi follows semantic versioning from `v1.0.0`.
