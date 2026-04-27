/**
 * Standalone MCP server for selected built-in Carlito tools.
 *
 * Run via: node --import tsx src/mcp/carlito-tools-serve.ts
 * Or: bun src/mcp/carlito-tools-serve.ts
 */
import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { AnyAgentTool } from "../agents/tools/common.js";
import { createCronTool } from "../agents/tools/cron-tool.js";
import { formatErrorMessage } from "../infra/errors.js";
import { connectToolsMcpServerToStdio, createToolsMcpServer } from "./tools-stdio-server.js";

export function resolveCarlitoToolsForMcp(): AnyAgentTool[] {
  return [createCronTool()];
}

export function createCarlitoToolsMcpServer(
  params: {
    tools?: AnyAgentTool[];
  } = {},
): Server {
  const tools = params.tools ?? resolveCarlitoToolsForMcp();
  return createToolsMcpServer({ name: "carlito-tools", tools });
}

export async function serveCarlitoToolsMcp(): Promise<void> {
  const server = createCarlitoToolsMcpServer();
  await connectToolsMcpServerToStdio(server);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  serveCarlitoToolsMcp().catch((err) => {
    process.stderr.write(`carlito-tools-serve: ${formatErrorMessage(err)}\n`);
    process.exit(1);
  });
}
