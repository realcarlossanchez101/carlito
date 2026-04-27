import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { syncPluginVersions } from "../../scripts/sync-plugin-versions.js";
import { cleanupTempDirs, makeTempDir } from "../../test/helpers/temp-dir.js";

const tempDirs: string[] = [];

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

describe("syncPluginVersions", () => {
  afterEach(() => {
    cleanupTempDirs(tempDirs);
  });

  it("preserves workspace carlito devDependencies and plugin host floors", () => {
    const rootDir = makeTempDir(tempDirs, "carlito-sync-plugin-versions-");

    writeJson(path.join(rootDir, "package.json"), {
      name: "carlito",
      version: "2026.4.1",
    });
    writeJson(path.join(rootDir, "extensions/bluebubbles/package.json"), {
      name: "@realcarlossanchez101/bluebubbles",
      version: "2026.3.30",
      devDependencies: {
        carlito: "workspace:*",
      },
      peerDependencies: {
        carlito: ">=2026.3.30",
      },
      carlito: {
        install: {
          minHostVersion: ">=2026.3.30",
        },
        compat: {
          pluginApi: ">=2026.3.30",
        },
        build: {
          carlitoVersion: "2026.3.30",
        },
      },
    });

    const summary = syncPluginVersions(rootDir);
    const updatedPackage = JSON.parse(
      fs.readFileSync(path.join(rootDir, "extensions/bluebubbles/package.json"), "utf8"),
    ) as {
      version?: string;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      carlito?: {
        install?: {
          minHostVersion?: string;
        };
        compat?: {
          pluginApi?: string;
        };
        build?: {
          carlitoVersion?: string;
        };
      };
    };

    expect(summary.updated).toContain("@realcarlossanchez101/bluebubbles");
    expect(updatedPackage.version).toBe("2026.4.1");
    expect(updatedPackage.devDependencies?.carlito).toBe("workspace:*");
    expect(updatedPackage.peerDependencies?.carlito).toBe(">=2026.4.1");
    expect(updatedPackage.carlito?.install?.minHostVersion).toBe(">=2026.3.30");
    expect(updatedPackage.carlito?.compat?.pluginApi).toBe(">=2026.4.1");
    expect(updatedPackage.carlito?.build?.carlitoVersion).toBe("2026.4.1");
  });
});
