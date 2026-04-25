import { describe, expect, test } from "vitest";
import {
  getFreePort,
  installGatewayTestHooks,
  startGatewayServer,
  testState,
} from "./test-helpers.js";

installGatewayTestHooks({ scope: "suite" });

async function expectPulsecheckValidationError(legacyParsed: Record<string, unknown>) {
  testState.legacyIssues = [
    {
      path: "pulsecheck",
      message:
        "top-level pulsecheck is not a valid config path; use agents.defaults.pulsecheck (cadence/target/model settings) or channels.defaults.pulsecheck (showOk/showAlerts/useIndicator).",
    },
  ];
  testState.legacyParsed = legacyParsed;
  testState.migrationConfig = null;
  testState.migrationChanges = [];

  let server: Awaited<ReturnType<typeof startGatewayServer>> | undefined;
  let thrown: unknown;
  try {
    server = await startGatewayServer(await getFreePort());
  } catch (err) {
    thrown = err;
  }

  if (server) {
    await server.close();
  }

  expect(thrown).toBeInstanceOf(Error);
  const message = (thrown as Error).message;
  expect(message).toContain("Invalid config at");
  expect(message).toContain(
    "pulsecheck: top-level pulsecheck is not a valid config path; use agents.defaults.pulsecheck (cadence/target/model settings) or channels.defaults.pulsecheck (showOk/showAlerts/useIndicator).",
  );
  expect(message).not.toContain("Legacy config entries detected but auto-migration failed.");
}

describe("gateway startup legacy migration fallback", () => {
  test("surfaces detailed validation errors when legacy entries have no migration output", async () => {
    await expectPulsecheckValidationError({
      pulsecheck: { model: "anthropic/claude-3-5-haiku-20241022", every: "30m" },
    });
  });

  test("keeps detailed validation errors when pulsecheck comes from include-resolved config", async () => {
    // Simulate a parsed source that only contains include directives, while
    // legacy pulsecheck is surfaced from the resolved config.
    await expectPulsecheckValidationError({
      $include: ["pulsecheck.defaults.json"],
    });
  });
});
