## 2026-10-19 — Config schema and first adapter
Goal:
Build the single-config parser, shared renderer, and first static harness adapter.
What changed:
Added strict brain.toml validation, deterministic marked Markdown rendering, the AGENTS.md target, and the initial TypeScript CLI with init/build.
Blocked on:
Nothing.

## 2026-10-19 — Harness adapters and drift detection
Goal:
Compile one document into all five configured harness paths and make generated-file drift fail checks.
What changed:
Added Claude, Cursor, Copilot, and skill adapters; target listing; context-file inclusion; nested output creation; --check drift detection; and hand-written file refusal tests.
Blocked on:
Nothing.

## 2026-10-19 — Read-only MCP server
Goal:
Serve the same configured project context live over stdio MCP without adding a write path.
What changed:
Added brain_context, search, read, list_sources, and declared-script run_script tools with source-bound paths, caps, and an end-to-end stdio client test.
Blocked on:
Nothing.

## 2026-10-19 — Example project and reproducible handoff
Goal:
Make the compiler and live pipe easy to run, inspect, test, and package from a clean checkout.
What changed:
Added examples/minimal, the demo walkthrough, README quickstart and non-goals, Makefile, Dockerfile, package contents, and the init-before-context test.
Blocked on:
Docker was not available in this environment, so the Docker image could not be run locally.
