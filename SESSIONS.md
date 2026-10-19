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
