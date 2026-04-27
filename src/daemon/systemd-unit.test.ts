import { describe, expect, it } from "vitest";
import { buildSystemdUnit } from "./systemd-unit.js";

describe("buildSystemdUnit", () => {
  it("quotes arguments with whitespace", () => {
    const unit = buildSystemdUnit({
      description: "Carlito Gateway",
      programArguments: ["/usr/bin/carlito", "gateway", "--name", "My Bot"],
      environment: {},
    });
    const execStart = unit.split("\n").find((line) => line.startsWith("ExecStart="));
    expect(execStart).toBe('ExecStart=/usr/bin/carlito gateway --name "My Bot"');
  });

  it("renders control-group kill mode for child-process cleanup", () => {
    const unit = buildSystemdUnit({
      description: "Carlito Gateway",
      programArguments: ["/usr/bin/carlito", "gateway", "run"],
      environment: {},
    });
    expect(unit).toContain("KillMode=control-group");
    expect(unit).toContain("TimeoutStopSec=30");
    expect(unit).toContain("TimeoutStartSec=30");
    expect(unit).toContain("SuccessExitStatus=0 143");
    expect(unit).toContain("StartLimitBurst=5");
    expect(unit).toContain("StartLimitIntervalSec=60");
    expect(unit).toContain("RestartPreventExitStatus=78");
  });

  it("rejects environment values with line breaks", () => {
    expect(() =>
      buildSystemdUnit({
        description: "Carlito Gateway",
        programArguments: ["/usr/bin/carlito", "gateway", "start"],
        environment: {
          INJECT: "ok\nExecStartPre=/bin/touch /tmp/oc15789_rce",
        },
      }),
    ).toThrow(/CR or LF/);
  });

  it("renders EnvironmentFile entries before inline Environment values", () => {
    const unit = buildSystemdUnit({
      description: "Carlito Gateway",
      programArguments: ["/usr/bin/carlito", "gateway", "run"],
      environmentFiles: ["/home/test/.carlito/.env"],
      environment: {
        CARLITO_GATEWAY_PORT: "18789",
      },
    });
    expect(unit).toContain("EnvironmentFile=-/home/test/.carlito/.env");
    expect(unit).toContain("Environment=CARLITO_GATEWAY_PORT=18789");
    expect(unit.indexOf("EnvironmentFile=-/home/test/.carlito/.env")).toBeLessThan(
      unit.indexOf("Environment=CARLITO_GATEWAY_PORT=18789"),
    );
  });
});
