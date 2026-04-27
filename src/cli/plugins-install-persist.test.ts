import { beforeEach, describe, expect, it } from "vitest";
import type { CarlitoConfig } from "../config/config.js";
import {
  enablePluginInConfig,
  recordPluginInstall,
  resetPluginsCliTestState,
  writeConfigFile,
} from "./plugins-cli-test-helpers.js";

describe("persistPluginInstall", () => {
  beforeEach(() => {
    resetPluginsCliTestState();
  });

  it("adds installed plugins to restrictive allowlists before enabling", async () => {
    const { persistPluginInstall } = await import("./plugins-install-persist.js");
    const baseConfig = {
      plugins: {
        allow: ["memory-core"],
      },
    } as CarlitoConfig;
    const enabledConfig = {
      plugins: {
        allow: ["alpha", "memory-core"],
        entries: {
          alpha: { enabled: true },
        },
      },
    } as CarlitoConfig;
    const persistedConfig = {
      plugins: {
        ...enabledConfig.plugins,
        installs: {
          alpha: {
            source: "npm",
            spec: "alpha@1.0.0",
            installPath: "/tmp/alpha",
          },
        },
      },
    } as CarlitoConfig;

    enablePluginInConfig.mockImplementation((...args: unknown[]) => {
      const [cfg, pluginId] = args as [CarlitoConfig, string];
      expect(pluginId).toBe("alpha");
      expect(cfg.plugins?.allow).toEqual(["alpha", "memory-core"]);
      return { config: enabledConfig };
    });
    recordPluginInstall.mockReturnValue(persistedConfig);

    const next = await persistPluginInstall({
      config: baseConfig,
      pluginId: "alpha",
      install: {
        source: "npm",
        spec: "alpha@1.0.0",
        installPath: "/tmp/alpha",
      },
    });

    expect(next).toBe(persistedConfig);
    expect(writeConfigFile).toHaveBeenCalledWith(persistedConfig);
  });
});
