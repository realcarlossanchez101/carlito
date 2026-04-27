// Narrow plugin-sdk surface for the bundled diffs plugin.
// Keep this list additive and scoped to the bundled diffs surface.

export { definePluginEntry } from "./plugin-entry.js";
export type { CarlitoConfig } from "../config/config.js";
export { resolvePreferredCarlitoTmpDir } from "../infra/tmp-carlito-dir.js";
export type {
  AnyAgentTool,
  CarlitoPluginApi,
  CarlitoPluginConfigSchema,
  CarlitoPluginToolContext,
  PluginLogger,
} from "../plugins/types.js";
