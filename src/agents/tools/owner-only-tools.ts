export const CARLITO_OWNER_ONLY_CORE_TOOL_NAMES = ["cron", "gateway", "nodes"] as const;

const CARLITO_OWNER_ONLY_CORE_TOOL_NAME_SET: ReadonlySet<string> = new Set(
  CARLITO_OWNER_ONLY_CORE_TOOL_NAMES,
);

export function isCarlitoOwnerOnlyCoreToolName(toolName: string): boolean {
  return CARLITO_OWNER_ONLY_CORE_TOOL_NAME_SET.has(toolName);
}
