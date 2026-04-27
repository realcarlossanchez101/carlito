import fs from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import type { CarlitoConfig } from "../config/config.js";
import { resolveMainSessionKey } from "../config/sessions.js";
import { runPulsecheckOnce } from "./pulsecheck-runner.js";
import { installPulsecheckRunnerTestRuntime } from "./pulsecheck-runner.test-harness.js";
import { withTempPulsecheckSandbox } from "./pulsecheck-runner.test-utils.js";

installPulsecheckRunnerTestRuntime();

describe("runPulsecheckOnce", () => {
  it("falls back to the main session when a subagent session key is forced", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const cfg: CarlitoConfig = {
        agents: {
          defaults: {
            workspace: tmpDir,
            pulsecheck: {
              every: "5m",
              target: "whatsapp",
            },
          },
        },
        channels: {
          whatsapp: {
            allowFrom: ["*"],
          },
        },
        session: { store: storePath },
      };

      const mainSessionKey = resolveMainSessionKey(cfg);
      await fs.writeFile(
        storePath,
        JSON.stringify({
          [mainSessionKey]: {
            sessionId: "sid-main",
            updatedAt: Date.now(),
            lastChannel: "whatsapp",
            lastProvider: "whatsapp",
            lastTo: "120363401234567890@g.us",
          },
          "agent:main:subagent:demo": {
            sessionId: "sid-subagent",
            updatedAt: Date.now(),
            lastChannel: "whatsapp",
            lastProvider: "whatsapp",
            lastTo: "120363409999999999@g.us",
          },
        }),
      );

      replySpy.mockResolvedValue({ text: "Final alert" });
      const sendWhatsApp = vi.fn().mockResolvedValue({
        messageId: "m1",
        toJid: "jid",
      });

      await runPulsecheckOnce({
        cfg,
        sessionKey: "agent:main:subagent:demo",
        deps: {
          getReplyFromConfig: replySpy,
          whatsapp: sendWhatsApp,
          getQueueSize: () => 0,
          nowMs: () => 0,
        },
      });

      expect(replySpy).toHaveBeenCalledTimes(1);
      expect(replySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          SessionKey: mainSessionKey,
          OriginatingChannel: undefined,
          OriginatingTo: undefined,
        }),
        expect.anything(),
        cfg,
      );
    });
  });
});
