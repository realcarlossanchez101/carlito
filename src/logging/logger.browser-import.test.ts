import { afterEach, describe, expect, it, vi } from "vitest";
import { importFreshModule } from "../../test/helpers/import-fresh.js";

type LoggerModule = typeof import("./logger.js");

const originalGetBuiltinModule = (
  process as NodeJS.Process & { getBuiltinModule?: (id: string) => unknown }
).getBuiltinModule;

async function importBrowserSafeLogger(params?: {
  resolvePreferredCarlitoTmpDir?: ReturnType<typeof vi.fn>;
}): Promise<{
  module: LoggerModule;
  resolvePreferredCarlitoTmpDir: ReturnType<typeof vi.fn>;
}> {
  const resolvePreferredCarlitoTmpDir =
    params?.resolvePreferredCarlitoTmpDir ??
    vi.fn(() => {
      throw new Error("resolvePreferredCarlitoTmpDir should not run during browser-safe import");
    });

  vi.doMock("../infra/tmp-carlito-dir.js", async () => {
    const actual = await vi.importActual<typeof import("../infra/tmp-carlito-dir.js")>(
      "../infra/tmp-carlito-dir.js",
    );
    return {
      ...actual,
      resolvePreferredCarlitoTmpDir,
    };
  });

  Object.defineProperty(process, "getBuiltinModule", {
    configurable: true,
    value: undefined,
  });

  const module = await importFreshModule<LoggerModule>(
    import.meta.url,
    "./logger.js?scope=browser-safe",
  );
  return { module, resolvePreferredCarlitoTmpDir };
}

describe("logging/logger browser-safe import", () => {
  afterEach(() => {
    vi.doUnmock("../infra/tmp-carlito-dir.js");
    Object.defineProperty(process, "getBuiltinModule", {
      configurable: true,
      value: originalGetBuiltinModule,
    });
  });

  it("does not resolve the preferred temp dir at import time when node fs is unavailable", async () => {
    const { module, resolvePreferredCarlitoTmpDir } = await importBrowserSafeLogger();

    expect(resolvePreferredCarlitoTmpDir).not.toHaveBeenCalled();
    expect(module.DEFAULT_LOG_DIR).toBe("/tmp/carlito");
    expect(module.DEFAULT_LOG_FILE).toBe("/tmp/carlito/carlito.log");
  });

  it("disables file logging when imported in a browser-like environment", async () => {
    const { module, resolvePreferredCarlitoTmpDir } = await importBrowserSafeLogger();

    expect(module.getResolvedLoggerSettings()).toMatchObject({
      level: "silent",
      file: "/tmp/carlito/carlito.log",
    });
    expect(module.isFileLogLevelEnabled("info")).toBe(false);
    expect(() => module.getLogger().info("browser-safe")).not.toThrow();
    expect(resolvePreferredCarlitoTmpDir).not.toHaveBeenCalled();
  });
});
