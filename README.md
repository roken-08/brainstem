# brainstem

One brain, every agent.

Write your agent's rules and project context once. brainstem compiles them into every
harness's native format — `AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, Copilot instructions,
skill manifests — and serves the same context live over MCP.

```sh
npx brainstem build          # compile brain.toml into instruction files
npx brainstem build --check  # fail if any of them drifted
npx brainstem serve          # MCP server over stdio
```

Static artefacts for behaviour, a live pipe for knowledge, one source of truth for both.

Read-only by design. No telemetry, no network, no secrets.

Work in progress.
