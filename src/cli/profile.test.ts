import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "carlito",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "carlito", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("leaves gateway --dev for subcommands after leading root options", () => {
    const res = parseCliProfileArgs([
      "node",
      "carlito",
      "--no-color",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual([
      "node",
      "carlito",
      "--no-color",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "carlito", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "carlito", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "carlito", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "carlito", "status"]);
  });

  it("parses interleaved --profile after the command token", () => {
    const res = parseCliProfileArgs(["node", "carlito", "status", "--profile", "work", "--deep"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "carlito", "status", "--deep"]);
  });

  it("parses interleaved --dev after the command token", () => {
    const res = parseCliProfileArgs(["node", "carlito", "status", "--dev"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "carlito", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "carlito", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "carlito", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "carlito", "--profile", "work", "--dev", "status"]],
    ["interleaved after command", ["node", "carlito", "status", "--profile", "work", "--dev"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".carlito-dev");
    expect(env.CARLITO_PROFILE).toBe("dev");
    expect(env.CARLITO_STATE_DIR).toBe(expectedStateDir);
    expect(env.CARLITO_CONFIG_PATH).toBe(path.join(expectedStateDir, "carlito.json"));
    expect(env.CARLITO_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      CARLITO_STATE_DIR: "/custom",
      CARLITO_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.CARLITO_STATE_DIR).toBe("/custom");
    expect(env.CARLITO_GATEWAY_PORT).toBe("19099");
    expect(env.CARLITO_CONFIG_PATH).toBe(path.join("/custom", "carlito.json"));
  });

  it("uses CARLITO_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      CARLITO_HOME: "/srv/carlito-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/carlito-home");
    expect(env.CARLITO_STATE_DIR).toBe(path.join(resolvedHome, ".carlito-work"));
    expect(env.CARLITO_CONFIG_PATH).toBe(path.join(resolvedHome, ".carlito-work", "carlito.json"));
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "carlito doctor --fix",
      env: {},
      expected: "carlito doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "carlito doctor --fix",
      env: { CARLITO_PROFILE: "default" },
      expected: "carlito doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "carlito doctor --fix",
      env: { CARLITO_PROFILE: "Default" },
      expected: "carlito doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "carlito doctor --fix",
      env: { CARLITO_PROFILE: "bad profile" },
      expected: "carlito doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "carlito --profile work doctor --fix",
      env: { CARLITO_PROFILE: "work" },
      expected: "carlito --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "carlito --dev doctor",
      env: { CARLITO_PROFILE: "dev" },
      expected: "carlito --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("carlito doctor --fix", { CARLITO_PROFILE: "work" })).toBe(
      "carlito --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("carlito doctor --fix", { CARLITO_PROFILE: "  jbcarlito  " })).toBe(
      "carlito --profile jbcarlito doctor --fix",
    );
  });

  it("handles command with no args after carlito", () => {
    expect(formatCliCommand("carlito", { CARLITO_PROFILE: "test" })).toBe("carlito --profile test");
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm carlito doctor", { CARLITO_PROFILE: "work" })).toBe(
      "pnpm carlito --profile work doctor",
    );
  });

  it("inserts --container when a container hint is set", () => {
    expect(
      formatCliCommand("carlito gateway status --deep", { CARLITO_CONTAINER_HINT: "demo" }),
    ).toBe("carlito --container demo gateway status --deep");
  });

  it("ignores unsafe container hints", () => {
    expect(
      formatCliCommand("carlito gateway status --deep", {
        CARLITO_CONTAINER_HINT: "demo; rm -rf /",
      }),
    ).toBe("carlito gateway status --deep");
  });

  it("preserves both --container and --profile hints", () => {
    expect(
      formatCliCommand("carlito doctor", {
        CARLITO_CONTAINER_HINT: "demo",
        CARLITO_PROFILE: "work",
      }),
    ).toBe("carlito --container demo doctor");
  });

  it("does not prepend --container for update commands", () => {
    expect(formatCliCommand("carlito update", { CARLITO_CONTAINER_HINT: "demo" })).toBe(
      "carlito update",
    );
    expect(
      formatCliCommand("pnpm carlito update --channel beta", { CARLITO_CONTAINER_HINT: "demo" }),
    ).toBe("pnpm carlito update --channel beta");
  });
});
