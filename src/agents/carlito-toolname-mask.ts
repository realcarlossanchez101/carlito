import type { StreamFn } from "@mariozechner/pi-agent-core";
import { streamWithPayloadPatch } from "./pi-embedded-runner/stream-payload-utils.js";

export const TOOL_NAME_ALIAS_MAP: Record<string, string> = {
  sessions_spawn: "helper_start",
  sessions_yield: "helper_yield",
  sessions_list: "helper_list",
  sessions_history: "helper_history",
  sessions_send: "helper_send",
  session_status: "runtime_info",
  subagents: "helper_manage",
  agents_list: "helper_catalog",
  nodes: "paired_devices",
  canvas: "display_panel",
  gateway: "runtime_control",
};

const TOOL_NAME_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TOOL_NAME_ALIAS_MAP).map(([canonical, alias]) => [alias, canonical]),
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TOOL_NAME_REPLACE_PATTERNS = Object.entries(TOOL_NAME_ALIAS_MAP)
  .sort(([a], [b]) => b.length - a.length)
  .map(([canonical, alias]) => ({
    pattern: new RegExp(`\\b${escapeRegex(canonical)}\\b`, "g"),
    alias,
  }));

export function applyToolNameAliasToString(input: string): string {
  let result = input;
  for (const { pattern, alias } of TOOL_NAME_REPLACE_PATTERNS) {
    result = result.replace(pattern, alias);
  }
  return result;
}

export function canonicalFromAlias(name: string): string | undefined {
  return TOOL_NAME_REVERSE_MAP[name];
}

export function applyToolNameAliasInPayload(payload: unknown): void {
  if (Array.isArray(payload)) {
    for (let i = 0; i < payload.length; i++) {
      const value = payload[i];
      if (typeof value === "string") {
        payload[i] = applyToolNameAliasToString(value);
      } else if (value !== null && typeof value === "object") {
        applyToolNameAliasInPayload(value);
      }
    }
    return;
  }
  if (payload !== null && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (typeof value === "string") {
        obj[key] = applyToolNameAliasToString(value);
      } else if (value !== null && typeof value === "object") {
        applyToolNameAliasInPayload(value);
      }
    }
  }
}

export function wrapStreamFnWithToolNameMask(underlying: StreamFn): StreamFn {
  return (model, context, options) =>
    streamWithPayloadPatch(underlying, model, context, options, (payload) => {
      applyToolNameAliasInPayload(payload);
    });
}
