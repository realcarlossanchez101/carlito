import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { withTempDir } from "./test-helpers/temp-dir.js";
import {
  ensureDir,
  resolveConfigDir,
  resolveHomeDir,
  resolveUserPath,
  shortenHomeInString,
  shortenHomePath,
  sleep,
} from "./utils.js";

describe("ensureDir", () => {
  it("creates nested directory", async () => {
    await withTempDir({ prefix: "carlito-test-" }, async (tmp) => {
      const target = path.join(tmp, "nested", "dir");
      await ensureDir(target);
      expect(fs.existsSync(target)).toBe(true);
    });
  });
});

describe("sleep", () => {
  it("resolves after delay using fake timers", async () => {
    vi.useFakeTimers();
    const promise = sleep(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

describe("resolveConfigDir", () => {
  it("prefers ~/.carlito when legacy dir is missing", async () => {
    await withTempDir({ prefix: "carlito-config-dir-" }, async (root) => {
      const newDir = path.join(root, ".carlito");
      await fs.promises.mkdir(newDir, { recursive: true });
      const resolved = resolveConfigDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(newDir);
    });
  });

  it("expands CARLITO_STATE_DIR using the provided env", () => {
    const env = {
      HOME: "/tmp/carlito-home",
      CARLITO_STATE_DIR: "~/state",
    } as NodeJS.ProcessEnv;

    expect(resolveConfigDir(env)).toBe(path.resolve("/tmp/carlito-home", "state"));
  });

  it("falls back to the config file directory when only CARLITO_CONFIG_PATH is set", () => {
    const env = {
      HOME: "/tmp/carlito-home",
      CARLITO_CONFIG_PATH: "~/profiles/dev/carlito.json",
    } as NodeJS.ProcessEnv;

    expect(resolveConfigDir(env)).toBe(path.resolve("/tmp/carlito-home", "profiles", "dev"));
  });
});

describe("resolveHomeDir", () => {
  it("prefers CARLITO_HOME over HOME", () => {
    vi.stubEnv("CARLITO_HOME", "/srv/carlito-home");
    vi.stubEnv("HOME", "/home/other");

    expect(resolveHomeDir()).toBe(path.resolve("/srv/carlito-home"));

    vi.unstubAllEnvs();
  });
});

describe("shortenHomePath", () => {
  it("uses $CARLITO_HOME prefix when CARLITO_HOME is set", () => {
    vi.stubEnv("CARLITO_HOME", "/srv/carlito-home");
    vi.stubEnv("HOME", "/home/other");

    expect(shortenHomePath(`${path.resolve("/srv/carlito-home")}/.carlito/carlito.json`)).toBe(
      "$CARLITO_HOME/.carlito/carlito.json",
    );

    vi.unstubAllEnvs();
  });
});

describe("shortenHomeInString", () => {
  it("uses $CARLITO_HOME replacement when CARLITO_HOME is set", () => {
    vi.stubEnv("CARLITO_HOME", "/srv/carlito-home");
    vi.stubEnv("HOME", "/home/other");

    expect(
      shortenHomeInString(`config: ${path.resolve("/srv/carlito-home")}/.carlito/carlito.json`),
    ).toBe("config: $CARLITO_HOME/.carlito/carlito.json");

    vi.unstubAllEnvs();
  });
});

describe("resolveUserPath", () => {
  it("expands ~ to home dir", () => {
    expect(resolveUserPath("~", {}, () => "/Users/thoffman")).toBe(path.resolve("/Users/thoffman"));
  });

  it("expands ~/ to home dir", () => {
    expect(resolveUserPath("~/carlito", {}, () => "/Users/thoffman")).toBe(
      path.resolve("/Users/thoffman", "carlito"),
    );
  });

  it("resolves relative paths", () => {
    expect(resolveUserPath("tmp/dir")).toBe(path.resolve("tmp/dir"));
  });

  it("prefers CARLITO_HOME for tilde expansion", () => {
    vi.stubEnv("CARLITO_HOME", "/srv/carlito-home");
    vi.stubEnv("HOME", "/home/other");

    expect(resolveUserPath("~/carlito")).toBe(path.resolve("/srv/carlito-home", "carlito"));

    vi.unstubAllEnvs();
  });

  it("uses the provided env for tilde expansion", () => {
    const env = {
      HOME: "/tmp/carlito-home",
      CARLITO_HOME: "/srv/carlito-home",
    } as NodeJS.ProcessEnv;

    expect(resolveUserPath("~/carlito", env)).toBe(path.resolve("/srv/carlito-home", "carlito"));
  });

  it("keeps blank paths blank", () => {
    expect(resolveUserPath("")).toBe("");
    expect(resolveUserPath("   ")).toBe("");
  });

  it("returns empty string for undefined/null input", () => {
    expect(resolveUserPath(undefined as unknown as string)).toBe("");
    expect(resolveUserPath(null as unknown as string)).toBe("");
  });
});
