import type { CarlitoConfig } from "carlito/plugin-sdk/browser-config-runtime";
import {
  normalizePluginsConfig,
  resolveEffectiveEnableState,
} from "carlito/plugin-sdk/browser-config-runtime";

export function isDefaultBrowserPluginEnabled(cfg: CarlitoConfig): boolean {
  return resolveEffectiveEnableState({
    id: "browser",
    origin: "bundled",
    config: normalizePluginsConfig(cfg.plugins),
    rootConfig: cfg,
    enabledByDefault: true,
  }).enabled;
}
