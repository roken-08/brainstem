import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "../config.js";
import { registerTools } from "./tools.js";

export async function createMcpServer(root: string): Promise<McpServer> {
  const config = await loadConfig(root);
  const server = new McpServer(
    { name: "brainstem", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );
  registerTools(server, root, config);
  return server;
}

export async function serve(root: string): Promise<void> {
  const server = await createMcpServer(root);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
