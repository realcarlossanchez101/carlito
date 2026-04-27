import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GATEWAY_PORT,
  resolveConfigPathCandidate,
  resolveGatewayPort,
  resolveIsNixMode,
  resolveStateDir,
} from "./config.js";
import { withTempHome } from "./test-helpers.js";

vi.unmock("../version.js");

function envWith(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  // Hermetic env: don't inherit process.env because other tests may mutate it.
  return { ...overrides };
}

describe("Nix integration (U3, U5, U9)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("U3: isNixMode env var detection", () => {
    it("isNixMode is false when CARLITO_NIX_MODE is not set", () => {
      expect(resolveIsNixMode(envWith({ CARLITO_NIX_MODE: undefined }))).toBe(false);
    });

    it("isNixMode is false when CARLITO_NIX_MODE is empty", () => {
      expect(resolveIsNixMode(envWith({ CARLITO_NIX_MODE: "" }))).toBe(false);
    });

    it("isNixMode is false when CARLITO_NIX_MODE is not '1'", () => {
      expect(resolveIsNixMode(envWith({ CARLITO_NIX_MODE: "true" }))).toBe(false);
    });

    it("isNixMode is true when CARLITO_NIX_MODE=1", () => {
      expect(resolveIsNixMode(envWith({ CARLITO_NIX_MODE: "1" }))).toBe(true);
    });
  });

  describe("U5: CONFIG_PATH and STATE_DIR env var overrides", () => {
    it("STATE_DIR defaults to ~/.carlito when env not set", () => {
      expect(resolveStateDir(envWith({ CARLITO_STATE_DIR: undefined }))).toMatch(/\.carlito$/);
    });

    it("STATE_DIR respects CARLITO_STATE_DIR override", () => {
      expect(resolveStateDir(envWith({ CARLITO_STATE_DIR: "/custom/state/dir" }))).toBe(
        path.resolve("/custom/state/dir"),
      );
    });

    it("STATE_DIR respects CARLITO_HOME when state override is unset", () => {
      const customHome = path.join(path.sep, "custom", "home");
      expect(
        resolveStateDir(envWith({ CARLITO_HOME: customHome, CARLITO_STATE_DIR: undefined })),
      ).toBe(path.join(path.resolve(customHome), ".carlito"));
    });

    it("CONFIG_PATH defaults to CARLITO_HOME/.carlito/carlito.json", () => {
      const customHome = path.join(path.sep, "custom", "home");
      expect(
        resolveConfigPathCandidate(
          envWith({
            CARLITO_HOME: customHome,
            CARLITO_CONFIG_PATH: undefined,
            CARLITO_STATE_DIR: undefined,
          }),
        ),
      ).toBe(path.join(path.resolve(customHome), ".carlito", "carlito.json"));
    });

    it("CONFIG_PATH defaults to ~/.carlito/carlito.json when env not set", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ CARLITO_CONFIG_PATH: undefined, CARLITO_STATE_DIR: undefined }),
        ),
      ).toMatch(/\.carlito[\\/]carlito\.json$/);
    });

    it("CONFIG_PATH respects CARLITO_CONFIG_PATH override", () => {
      expect(
        resolveConfigPathCandidate(envWith({ CARLITO_CONFIG_PATH: "/nix/store/abc/carlito.json" })),
      ).toBe(path.resolve("/nix/store/abc/carlito.json"));
    });

    it("CONFIG_PATH expands ~ in CARLITO_CONFIG_PATH override", async () => {
      await withTempHome(async (home) => {
        expect(
          resolveConfigPathCandidate(
            envWith({ CARLITO_HOME: home, CARLITO_CONFIG_PATH: "~/.carlito/custom.json" }),
            () => home,
          ),
        ).toBe(path.join(home, ".carlito", "custom.json"));
      });
    });

    it("CONFIG_PATH uses STATE_DIR when only state dir is overridden", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ CARLITO_STATE_DIR: "/custom/state", CARLITO_TEST_FAST: "1" }),
          () => path.join(path.sep, "tmp", "carlito-config-home"),
        ),
      ).toBe(path.join(path.resolve("/custom/state"), "carlito.json"));
    });
  });

  describe("U6: gateway port resolution", () => {
    it("uses default when env and config are unset", () => {
      expect(resolveGatewayPort({}, envWith({ CARLITO_GATEWAY_PORT: undefined }))).toBe(
        DEFAULT_GATEWAY_PORT,
      );
    });

    it("prefers CARLITO_GATEWAY_PORT over config", () => {
      expect(
        resolveGatewayPort(
          { gateway: { port: 19002 } },
          envWith({ CARLITO_GATEWAY_PORT: "19001" }),
        ),
      ).toBe(19001);
    });

    it("falls back to config when env is invalid", () => {
      expect(
        resolveGatewayPort({ gateway: { port: 19003 } }, envWith({ CARLITO_GATEWAY_PORT: "nope" })),
      ).toBe(19003);
    });
  });
});
