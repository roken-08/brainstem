# brainstem

**Demo:** [run the 60–90 second walkthrough](docs/demo.md) · **one brain, every agent.**

## The thesis

There are exactly two ways to get context into an agent, and real setups need both:

1. **Static artefacts** — generated files a harness reads automatically at startup.
2. **A live pipe** — an MCP server the agent queries while it works.

brainstem owns both from one `brain.toml`. The compiler carries behaviour; the read-only
MCP server carries project knowledge. Change the config once, then rebuild the harness files
and query the same sources live.

## Quickstart

Try it from a clone:

```sh
git clone <repo-url> && cd brainstem
npm install
cd examples/minimal
npx --no-install brainstem build --check   # clean
npx --no-install brainstem build           # regenerate everything
```

Use it in your own project, from the repo root:

```sh
npx --no-install brainstem init       # write a commented brain.toml
npx --no-install brainstem build      # compile every enabled target
npx --no-install brainstem build --check
npx --no-install brainstem targets
```

Then point any MCP host at `npx --no-install brainstem serve --mcp`, launched from that
project's directory.

`npx brainstem build` is also the published-package form once brainstem is installed or
published. `make test` is the single project test command.

## What it builds

The compiler reads `brain.toml` and writes only enabled targets:

| Target | Output |
| --- | --- |
| agents | `AGENTS.md` |
| claude | `CLAUDE.md` |
| cursor | `.cursor/rules/brainstem.mdc` |
| copilot | `.github/copilot-instructions.md` |
| skill | `.skills/brainstem/SKILL.md` |

Every generated file has a schema-versioned content hash marker. `build --check` exits 1
for a missing or stale target, making drift a CI failure. An existing unmarked file is
never silently clobbered; use `--force` only when replacing it intentionally.

The MCP server exposes five read-only tools over stdio:

- `brain_context` — summary, conventions, and configured sources
- `search` — capped regular-expression search over configured source directories
- `read` — capped file reads with an optional line range
- `list_sources` — configured sources with rough file counts and sizes
- `run_script` — runs only a named command explicitly declared in `[scripts]`

## Config

Keep the source of truth small and committed. `brainstem init` writes a commented example;
`examples/minimal/brain.toml` is a complete working project.

```toml
[project]
name = "minimal-service"
summary = "A small documented service."

[conventions]
rules = ["Read before changing.", "Run tests before claiming success."]

[context]
sources = ["docs", "notes"]
files = ["README.md"]

[scripts]
test = "node -e \"console.log('ok')\""

[targets]
agents = true
claude = true
cursor = true
copilot = true
skill = true
```

Unknown keys are errors. Paths are project-relative. Context sources are read-only from
the server's perspective, and no credentials belong in this file.

## Development

```sh
make test
docker build -t brainstem .
docker run --rm brainstem --help
```

The Docker image installs the locked dependencies, compiles TypeScript, and runs the same
CLI. To operate on a project from the image, mount it and set the working directory:

```sh
docker run --rm -i -v "$PWD:/workspace" -w /workspace brainstem build --check
```

## Non-goals and boundaries

- Not a chat UI, agent, or model router.
- No cloud, accounts, telemetry, or network calls beyond the MCP stdio pipe.
- No secret handling; config points at paths and never stores credentials.
- No auto-editing of a user's knowledge base.
- The MCP server has no write tool. `run_script` runs only commands the project owner has
  explicitly declared, so declare safe test/lint commands.

## Layout

```text
src/config.ts       parse and validate brain.toml
src/render.ts       shared document model and markers
src/targets/        one adapter per harness
src/mcp/            stdio server, tools, and source search
tests/              compiler, drift, and real-client MCP tests
examples/minimal/   tiny demo project
```
