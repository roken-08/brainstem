import { strict as assert } from "node:assert";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { test } from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

function resultText(result: unknown): string {
  const content = (result as { content?: unknown }).content;
  assert.ok(Array.isArray(content));
  const item = content.find((entry): entry is { type: string; text: string } => {
    return typeof entry === "object" && entry !== null && (entry as { type?: unknown }).type === "text" && typeof (entry as { text?: unknown }).text === "string";
  });
  assert.ok(item?.text);
  return item.text;
}

test("an actual MCP client can call every read-only tool", async () => {
  const root = await mkdtemp(join(tmpdir(), "brainstem-mcp-"));
  await mkdir(join(root, "docs"));
  await mkdir(join(root, "notes"));
  await writeFile(join(root, "docs", "guide.md"), "# Guide\nThe billing rule lives here.\n", "utf8");
  await writeFile(join(root, "notes", "decision.md"), "Use the billing rule from the guide.\n", "utf8");
  await writeFile(join(root, "brain.toml"), `
[project]
name = "mcp-demo"
summary = "A project for MCP integration tests."

[conventions]
rules = ["Read before editing."]

[context]
sources = ["docs", "notes"]

[scripts]
test = "node -e \\\"console.log('script ok')\\\""

[targets]
agents = false
claude = false
cursor = false
copilot = false
skill = false
`, "utf8");

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve(process.cwd(), "dist/src/cli.js"), "serve", "--mcp"],
    cwd: root,
    stderr: "pipe",
  });
  const client = new Client({ name: "brainstem-test-client", version: "1.0.0" });

  await client.connect(transport);
  try {
    const tools = await client.listTools();
    assert.deepEqual(
      tools.tools.map((tool) => tool.name).sort(),
      ["brain_context", "list_sources", "read", "run_script", "search"],
    );

    const context = resultText(await client.callTool({ name: "brain_context", arguments: {} }));
    assert.match(context, /A project for MCP integration tests/);
    assert.match(context, /`docs`/);

    const search = resultText(await client.callTool({ name: "search", arguments: { query: "billing" } }));
    assert.match(search, /docs\/guide\.md:2:The billing rule lives here\./);
    assert.match(search, /notes\/decision\.md:1:Use the billing rule/);

    const read = resultText(await client.callTool({
      name: "read",
      arguments: { path: "docs/guide.md", startLine: 2, endLine: 2 },
    }));
    assert.equal(read, "docs/guide.md:2-2\nThe billing rule lives here.");

    const sources = resultText(await client.callTool({ name: "list_sources", arguments: {} }));
    assert.match(sources, /docs\s+1 files\s+\d+ bytes/);
    assert.match(sources, /notes\s+1 files\s+\d+ bytes/);

    const script = resultText(await client.callTool({ name: "run_script", arguments: { name: "test" } }));
    assert.match(script, /script test exited 0/);
    assert.match(script, /script ok/);

    const denied = await client.callTool({ name: "read", arguments: { path: "brain.toml" } });
    assert.equal(denied.isError, true);
  } finally {
    await client.close();
  }
});
