import { strict as assert } from "node:assert";
import { test } from "node:test";

import { ConfigError, parseConfig } from "../src/config.js";
import { contentHash, documentFromConfig, generatedMarker, renderGeneratedMarkdown } from "../src/render.js";
import { agentsTarget } from "../src/targets/agents.js";

const configText = `
[project]
name = "ledger"
summary = "A small billing service."

[conventions]
rules = ["Run tests first.", "Keep changes focused."]

[scripts]
test = "npm test"

[targets]
`;

test("parses the documented config shape and defaults omitted targets", () => {
  const config = parseConfig(configText);
  assert.deepEqual(config.project, { name: "ledger", summary: "A small billing service." });
  assert.deepEqual(config.conventions, ["Run tests first.", "Keep changes focused."]);
  assert.equal(config.scripts.test, "npm test");
  assert.equal(config.targets.agents, true);
  assert.equal(config.targets.skill, true);
});

test("rejects unknown keys with their config path", () => {
  assert.throws(
    () => parseConfig(`${configText}\n[project.extra]\nvalue = true\n`),
    (error: unknown) => error instanceof ConfigError && error.message.includes('unknown key "extra" at project'),
  );
});

test("renders a stable agents document with a content marker", () => {
  const config = parseConfig(configText);
  const model = documentFromConfig(config);
  const expectedBody = `# ledger

A small billing service.

## Conventions

- Run tests first.
- Keep changes focused.

## Declared scripts
- \`test\`: \`npm test\`
`;
  const expected = `${generatedMarker(expectedBody)}\n\n${expectedBody}`;
  assert.equal(agentsTarget.outputPath, "AGENTS.md");
  assert.equal(renderGeneratedMarkdown(model), expected);
  assert.equal(contentHash(expectedBody).length, 16);
  assert.equal(renderGeneratedMarkdown(model), renderGeneratedMarkdown(model));
});
