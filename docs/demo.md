# Demo walkthrough

This is the 60–90 second demo sequence. It keeps the compiler and the live pipe visible
without adding a second source of truth.

```sh
cd examples/minimal
npx --no-install brainstem build
ls AGENTS.md CLAUDE.md .cursor/rules/brainstem.mdc .github/copilot-instructions.md .skills/brainstem/SKILL.md
sed -n '1,24p' AGENTS.md

# Edit one rule in brain.toml, then show drift failing.
npx --no-install brainstem build --check
npx --no-install brainstem build
npx --no-install brainstem build --check

# In a second terminal, point an MCP host at:
npx --no-install brainstem serve --mcp
```

The generated files provide startup behaviour. The MCP host can then call `brain_context`
and `search` to retrieve the project knowledge configured in the same `brain.toml`.
