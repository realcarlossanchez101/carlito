import { createConfigIO, getRuntimeConfigSnapshot, type CarlitoConfig } from "../config/config.js";

export function loadBrowserConfigForRuntimeRefresh(): CarlitoConfig {
  return getRuntimeConfigSnapshot() ?? createConfigIO().loadConfig();
}
