import { describe, expect, it } from "vitest";
import {
  ensureCarlitoExecMarkerOnProcess,
  markCarlitoExecEnv,
  CARLITO_CLI_ENV_VALUE,
  CARLITO_CLI_ENV_VAR,
} from "./carlito-exec-env.js";

describe("markCarlitoExecEnv", () => {
  it("returns a cloned env object with the exec marker set", () => {
    const env = { PATH: "/usr/bin", CARLITO_CLI: "0" };
    const marked = markCarlitoExecEnv(env);

    expect(marked).toEqual({
      PATH: "/usr/bin",
      CARLITO_CLI: CARLITO_CLI_ENV_VALUE,
    });
    expect(marked).not.toBe(env);
    expect(env.CARLITO_CLI).toBe("0");
  });
});

describe("ensureCarlitoExecMarkerOnProcess", () => {
  it.each([
    {
      name: "mutates and returns the provided process env",
      env: { PATH: "/usr/bin" } as NodeJS.ProcessEnv,
    },
    {
      name: "overwrites an existing marker on the provided process env",
      env: { PATH: "/usr/bin", [CARLITO_CLI_ENV_VAR]: "0" } as NodeJS.ProcessEnv,
    },
  ])("$name", ({ env }) => {
    expect(ensureCarlitoExecMarkerOnProcess(env)).toBe(env);
    expect(env[CARLITO_CLI_ENV_VAR]).toBe(CARLITO_CLI_ENV_VALUE);
  });

  it("defaults to mutating process.env when no env object is provided", () => {
    const previous = process.env[CARLITO_CLI_ENV_VAR];
    delete process.env[CARLITO_CLI_ENV_VAR];

    try {
      expect(ensureCarlitoExecMarkerOnProcess()).toBe(process.env);
      expect(process.env[CARLITO_CLI_ENV_VAR]).toBe(CARLITO_CLI_ENV_VALUE);
    } finally {
      if (previous === undefined) {
        delete process.env[CARLITO_CLI_ENV_VAR];
      } else {
        process.env[CARLITO_CLI_ENV_VAR] = previous;
      }
    }
  });
});
