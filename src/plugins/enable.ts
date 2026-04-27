import { normalizeChatChannelId } from "../channels/ids.js";
import type { CarlitoConfig } from "../config/types.carlito.js";
import { setPluginEnabledInConfig } from "./toggle-config.js";

export type PluginEnableResult = {
  config: CarlitoConfig;
  enabled: boolean;
  reason?: string;
};

export function enablePluginInConfig(cfg: CarlitoConfig, pluginId: string): PluginEnableResult {
  const builtInChannelId = normalizeChatChannelId(pluginId);
  const resolvedId = builtInChannelId ?? pluginId;
  if (cfg.plugins?.enabled === false) {
    return { config: cfg, enabled: false, reason: "plugins disabled" };
  }
  if (cfg.plugins?.deny?.includes(pluginId) || cfg.plugins?.deny?.includes(resolvedId)) {
    return { config: cfg, enabled: false, reason: "blocked by denylist" };
  }
  const allow = cfg.plugins?.allow;
  if (
    Array.isArray(allow) &&
    allow.length > 0 &&
    !allow.includes(pluginId) &&
    !allow.includes(resolvedId)
  ) {
    return { config: cfg, enabled: false, reason: "blocked by allowlist" };
  }
  return { config: setPluginEnabledInConfig(cfg, resolvedId, true), enabled: true };
}
