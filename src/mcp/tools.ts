import { exec } from "node:child_process";
import { promisify } from "node:util";

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { BrainConfig } from "../config.js";
import { listSources, readSourceFile, searchSources } from "./search.js";

const execAsync = promisify(exec);
const MAX_SCRIPT_OUTPUT = 64 * 1024;

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function contextText(config: BrainConfig): string {
  const conventions = config.conventions.length > 0
    ? config.conventions.map((rule) => `- ${rule}`).join("\n")
    : "No conventions configured.";
  const sources = config.context.sources.length > 0
    ? config.context.sources.map((source) => `- \`${source}\``).join("\n")
    : "No sources configured.";
  return `# ${config.project.name}\n\n${config.project.summary}\n\n## Conventions\n${conventions}\n\n## Configured sources\n${sources}`;
}

export function registerTools(server: McpServer, root: string, config: BrainConfig): void {
  const readOnlyAnnotations = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

  server.registerTool("brain_context", {
    description: "Return the project's summary, conventions, and configured source directories.",
    annotations: readOnlyAnnotations,
  }, async () => textResult(contextText(config)));

  server.registerTool("search", {
    description: "Search configured source directories and return path:line:match results.",
    inputSchema: {
      query: z.string().min(1).describe("A regular expression to search for"),
      limit: z.number().int().min(1).max(200).optional().describe("Maximum matches to return"),
    },
    annotations: readOnlyAnnotations,
  }, async ({ query, limit }) => {
    const result = await searchSources(root, config, query, limit);
    const lines = result.matches.map((match) => `${match.path}:${match.line}:${match.text}`);
    if (result.missing.length > 0) lines.push(`note: missing sources: ${result.missing.join(", ")}`);
    if (result.truncated) lines.push("note: results truncated; narrow the search or increase limit");
    return textResult(lines.length > 0 ? lines.join("\n") : "No matches.");
  });

  server.registerTool("read", {
    description: "Read a configured source file with an optional line range.",
    inputSchema: {
      path: z.string().min(1).describe("A project-relative path inside a configured source"),
      startLine: z.number().int().min(1).optional(),
      endLine: z.number().int().min(1).optional(),
    },
    annotations: readOnlyAnnotations,
  }, async ({ path, startLine, endLine }) => {
    const result = await readSourceFile(root, config, path, startLine, endLine);
    const note = result.truncated ? "\nnote: file truncated at 65536 bytes" : "";
    return textResult(`${path}:${result.startLine}-${result.endLine}\n${result.text}${note}`);
  });

  server.registerTool("list_sources", {
    description: "List configured source directories and rough file sizes.",
    annotations: readOnlyAnnotations,
  }, async () => {
    const lines = await listSources(root, config);
    return textResult(lines.length > 0 ? lines.join("\n") : "No sources configured.");
  });

  server.registerTool("run_script", {
    description: "Run a script explicitly declared in brain.toml.",
    inputSchema: {
      name: z.string().min(1).describe("The declared script name, such as test or lint"),
    },
    annotations: readOnlyAnnotations,
  }, async ({ name }) => {
    const command = config.scripts[name];
    if (!command) throw new Error(`script "${name}" is not declared in brain.toml`);
    try {
      const result = await execAsync(command, { cwd: root, maxBuffer: MAX_SCRIPT_OUTPUT });
      const output = `${result.stdout}${result.stderr}`.trim();
      return textResult(`script ${name} exited 0${output ? `\n${output}` : ""}`);
    } catch (error) {
      const failure = error as { code?: number | string; stdout?: string; stderr?: string; message?: string };
      const output = `${failure.stdout ?? ""}${failure.stderr ?? ""}`.trim();
      return textResult(`script ${name} failed (exit ${failure.code ?? "unknown"})${output ? `\n${output}` : `\n${failure.message ?? "unknown error"}`}`);
    }
  });
}
