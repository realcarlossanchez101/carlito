import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          CARLITO_STATE_DIR: "/tmp/carlito-state",
          CARLITO_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "carlito-gateway",
        windowsTaskName: "Carlito Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /tmp/carlito-state/logs/gateway.log",
      "Launchd stderr (if installed): /tmp/carlito-state/logs/gateway.err.log",
      "Restart attempts: /tmp/carlito-state/logs/gateway-restart.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        env: {
          CARLITO_STATE_DIR: "/tmp/carlito-state",
        },
        systemdServiceName: "carlito-gateway",
        windowsTaskName: "Carlito Gateway",
      }),
    ).toEqual([
      "Logs: journalctl --user -u carlito-gateway.service -n 200 --no-pager",
      "Restart attempts: /tmp/carlito-state/logs/gateway-restart.log",
    ]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        env: {
          CARLITO_STATE_DIR: "/tmp/carlito-state",
        },
        systemdServiceName: "carlito-gateway",
        windowsTaskName: "Carlito Gateway",
      }),
    ).toEqual([
      'Logs: schtasks /Query /TN "Carlito Gateway" /V /FO LIST',
      "Restart attempts: /tmp/carlito-state/logs/gateway-restart.log",
    ]);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "carlito gateway install",
        startCommand: "carlito gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.carlito.gateway.plist",
        systemdServiceName: "carlito-gateway",
        windowsTaskName: "Carlito Gateway",
      }),
    ).toEqual([
      "carlito gateway install",
      "carlito gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.carlito.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "carlito gateway install",
        startCommand: "carlito gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.carlito.gateway.plist",
        systemdServiceName: "carlito-gateway",
        windowsTaskName: "Carlito Gateway",
      }),
    ).toEqual([
      "carlito gateway install",
      "carlito gateway",
      "systemctl --user start carlito-gateway.service",
    ]);
  });
});
