# Contributing to kanshi-dashboard

Kanshi's three main repositories are [Core](https://github.com/kanshi-dev/core), [Agent](https://github.com/kanshi-dev/agent), and [Dashboard](https://github.com/kanshi-dev/dashboard). Product direction lives in the private engineering handbook; GitHub issues and Projects track execution across them. Please pick up (or file) an issue before opening a PR.

## Workflow

1. **Start from an issue.** Use the issue templates; every issue states Overview, why it matters, and checkable acceptance criteria.
2. **Branch from `main`**, named `<type>/<short-description>`, e.g. `fix/url-encoding`, `feat/agents-polling`.
3. **Commit with [Conventional Commits](https://www.conventionalcommits.org/):** `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`. Keep commits scoped and messages in the imperative ("fix param encoding", not "fixed").
4. **Open a PR** using the PR template and link the issue (`Closes #N`).
5. **CI must pass before merge** (typecheck, lint, build). Do not merge red. Do not push directly to `main`.

## Rules of the repo

- **Bug fixes land with a regression test** where practical: it fails before the fix and passes after.
- All calls to the core REST API go through `src/api/api.ts`; build query strings with `URLSearchParams`, never template-literal interpolation.
- UI components come from shadcn/ui (`src/components/ui/`); prefer composing existing components over adding new dependencies.
- The API responds with a `{ code, message, data }` envelope; unwrap it in the API layer, not in components.

## Development

```bash
npm install
npm run dev        # expects core REST API on :8080 (Vite proxies /api)
npm run build      # what CI runs, plus typecheck and lint
```

## Versioning

Semver from v1.0.0: bug fixes ship as patch releases and features as minor releases. No breaking API changes land within a major version.
