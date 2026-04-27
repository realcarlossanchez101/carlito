import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { withTempHome } from "../../test/helpers/temp-home.js";
import { resetAutoMigrateLegacyStateDirForTest } from "../infra/state-migrations.js";
import { setupCommand } from "./setup.js";

function createSetupDeps(home: string) {
  const configPath = path.join(home, ".carlito", "carlito.json");
  return {
    createConfigIO: () => ({ configPath }),
    ensureAgentWorkspace: vi.fn(async (params?: { dir?: string }) => ({
      dir: params?.dir ?? path.join(home, ".carlito", "workspace"),
    })),
    formatConfigPath: (value: string) => value,
    logConfigUpdated: vi.fn(
      (runtime: { log: (message: string) => void }, opts: { path?: string; suffix?: string }) => {
        const suffix = opts.suffix ? ` ${opts.suffix}` : "";
        runtime.log(`Updated ${opts.path}${suffix}`);
      },
    ),
    mkdir: vi.fn(async () => {}),
    resolveSessionTranscriptsDir: vi.fn(() => path.join(home, ".carlito", "sessions")),
    writeConfigFile: vi.fn(async (config: unknown) => {
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    }),
  };
}

describe("setupCommand", () => {
  afterEach(() => {
    resetAutoMigrateLegacyStateDirForTest();
  });

  it("migrates legacy ~/.openclaw to ~/.carlito before resolving paths", async () => {
    resetAutoMigrateLegacyStateDirForTest();
    // Clear CARLITO_STATE_DIR (set by withTempHome by default) so the
    // migration's "explicit override" skip doesn't kick in.
    await withTempHome(
      async (home) => {
        // withTempHome seeds ~/.carlito for general session-state tests; for
        // the upgrade scenario we need a clean slate where only the legacy
        // dir exists, otherwise the migration treats the new dir as already
        // present and skips.
        await fs.rm(path.join(home, ".carlito"), { recursive: true, force: true });

        const legacyDir = path.join(home, ".openclaw");
        await fs.mkdir(path.join(legacyDir, "logs"), { recursive: true });
        await fs.writeFile(path.join(legacyDir, "logs", "marker.txt"), "ok", "utf-8");

        const runtime = {
          log: vi.fn(),
          error: vi.fn(),
          exit: vi.fn(),
        };
        const deps = createSetupDeps(home);
        const workspace = path.join(home, ".carlito", "workspace");

        await setupCommand({ workspace }, runtime, deps);

        const carlitoDir = path.join(home, ".carlito");
        expect(runtime.error).not.toHaveBeenCalled();
        expect(fsSync.existsSync(carlitoDir)).toBe(true);
        expect(fsSync.existsSync(path.join(carlitoDir, "logs", "marker.txt"))).toBe(true);

        // Legacy path is left as a symlink to the new dir so hardcoded readers
        // of `~/.openclaw/...` continue to resolve correctly.
        const legacyStat = fsSync.lstatSync(legacyDir);
        expect(legacyStat.isSymbolicLink()).toBe(true);
        expect(fsSync.readFileSync(path.join(legacyDir, "logs", "marker.txt"), "utf-8")).toBe("ok");
      },
      { env: { CARLITO_STATE_DIR: undefined, OPENCLAW_STATE_DIR: undefined } },
    );
  });

  it("writes gateway.mode=local on first run", async () => {
    await withTempHome(async (home) => {
      const runtime = {
        log: vi.fn(),
        error: vi.fn(),
        exit: vi.fn(),
      };
      const deps = createSetupDeps(home);
      const workspace = path.join(home, ".carlito", "workspace");

      await setupCommand({ workspace }, runtime, deps);

      const configPath = path.join(home, ".carlito", "carlito.json");
      const raw = await fs.readFile(configPath, "utf-8");

      expect(raw).toContain('"mode": "local"');
      expect(raw).toContain('"workspace"');
    });
  });

  it("adds gateway.mode=local to an existing config without overwriting workspace", async () => {
    await withTempHome(async (home) => {
      const runtime = {
        log: vi.fn(),
        error: vi.fn(),
        exit: vi.fn(),
      };
      const configDir = path.join(home, ".carlito");
      const configPath = path.join(configDir, "carlito.json");
      const workspace = path.join(home, "custom-workspace");
      const deps = createSetupDeps(home);

      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        configPath,
        JSON.stringify({
          agents: {
            defaults: {
              workspace,
            },
          },
        }),
      );

      await setupCommand(undefined, runtime, deps);

      const raw = JSON.parse(await fs.readFile(configPath, "utf-8")) as {
        agents?: { defaults?: { workspace?: string } };
        gateway?: { mode?: string };
      };

      expect(raw.agents?.defaults?.workspace).toBe(workspace);
      expect(raw.gateway?.mode).toBe("local");
    });
  });

  it("treats non-object config roots as empty config", async () => {
    await withTempHome(async (home) => {
      const runtime = {
        log: vi.fn(),
        error: vi.fn(),
        exit: vi.fn(),
      };
      const configDir = path.join(home, ".carlito");
      const configPath = path.join(configDir, "carlito.json");
      const deps = createSetupDeps(home);
      const workspace = path.join(home, ".carlito", "workspace");

      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(configPath, '"not-an-object"', "utf-8");

      await setupCommand({ workspace }, runtime, deps);

      const raw = JSON.parse(await fs.readFile(configPath, "utf-8")) as {
        agents?: { defaults?: { workspace?: string } };
        gateway?: { mode?: string };
      };

      expect(raw.agents?.defaults?.workspace).toBeTruthy();
      expect(raw.gateway?.mode).toBe("local");
    });
  });
});
