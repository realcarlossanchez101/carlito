import { replaceConfigFile } from "../config/config.js";
import type { CarlitoConfig } from "../config/types.carlito.js";
import { type HookInstallUpdate, recordHookInstall } from "../hooks/installs.js";
import { enablePluginInConfig } from "../plugins/enable.js";
import { type PluginInstallUpdate, recordPluginInstall } from "../plugins/installs.js";
import { defaultRuntime } from "../runtime.js";
import { theme } from "../terminal/theme.js";
import {
  applySlotSelectionForPlugin,
  enableInternalHookEntries,
  logHookPackRestartHint,
  logSlotWarnings,
} from "./plugins-command-helpers.js";

function addInstalledPluginToAllowlist(cfg: CarlitoConfig, pluginId: string): CarlitoConfig {
  const allow = cfg.plugins?.allow;
  if (!Array.isArray(allow) || allow.length === 0 || allow.includes(pluginId)) {
    return cfg;
  }
  return {
    ...cfg,
    plugins: {
      ...cfg.plugins,
      allow: [...allow, pluginId].toSorted(),
    },
  };
}

export async function persistPluginInstall(params: {
  config: CarlitoConfig;
  baseHash?: string;
  pluginId: string;
  install: Omit<PluginInstallUpdate, "pluginId">;
  successMessage?: string;
  warningMessage?: string;
}): Promise<CarlitoConfig> {
  let next = enablePluginInConfig(
    addInstalledPluginToAllowlist(params.config, params.pluginId),
    params.pluginId,
  ).config;
  next = recordPluginInstall(next, {
    pluginId: params.pluginId,
    ...params.install,
  });
  const slotResult = applySlotSelectionForPlugin(next, params.pluginId);
  next = slotResult.config;
  await replaceConfigFile({
    nextConfig: next,
    ...(params.baseHash !== undefined ? { baseHash: params.baseHash } : {}),
  });
  logSlotWarnings(slotResult.warnings);
  if (params.warningMessage) {
    defaultRuntime.log(theme.warn(params.warningMessage));
  }
  defaultRuntime.log(params.successMessage ?? `Installed plugin: ${params.pluginId}`);
  defaultRuntime.log("Restart the gateway to load plugins.");
  return next;
}

export async function persistHookPackInstall(params: {
  config: CarlitoConfig;
  baseHash?: string;
  hookPackId: string;
  hooks: string[];
  install: Omit<HookInstallUpdate, "hookId" | "hooks">;
  successMessage?: string;
}): Promise<CarlitoConfig> {
  let next = enableInternalHookEntries(params.config, params.hooks);
  next = recordHookInstall(next, {
    hookId: params.hookPackId,
    hooks: params.hooks,
    ...params.install,
  });
  await replaceConfigFile({
    nextConfig: next,
    ...(params.baseHash !== undefined ? { baseHash: params.baseHash } : {}),
  });
  defaultRuntime.log(params.successMessage ?? `Installed hook pack: ${params.hookPackId}`);
  logHookPackRestartHint();
  return next;
}
