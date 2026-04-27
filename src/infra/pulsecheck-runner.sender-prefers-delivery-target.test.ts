import { describe, expect, it, vi } from "vitest";
import type { CarlitoConfig } from "../config/config.js";
import { runPulsecheckOnce } from "./pulsecheck-runner.js";
import { installPulsecheckRunnerTestRuntime } from "./pulsecheck-runner.test-harness.js";
import { seedMainSessionStore, withTempPulsecheckSandbox } from "./pulsecheck-runner.test-utils.js";

installPulsecheckRunnerTestRuntime({ includeSlack: true });

describe("runPulsecheckOnce", () => {
  it("uses the delivery target as sender when lastTo differs", async () => {
    await withTempPulsecheckSandbox(
      async ({ tmpDir, storePath, replySpy }) => {
        const cfg: CarlitoConfig = {
          agents: {
            defaults: {
              workspace: tmpDir,
              pulsecheck: {
                every: "5m",
                target: "slack",
                to: "C0A9P2N8QHY",
              },
            },
          },
          session: { store: storePath },
        };

        await seedMainSessionStore(storePath, cfg, {
          lastChannel: "telegram",
          lastProvider: "telegram",
          lastTo: "1644620762",
        });

        replySpy.mockImplementation(async (ctx: { To?: string; From?: string }) => {
          expect(ctx.To).toBe("C0A9P2N8QHY");
          expect(ctx.From).toBe("C0A9P2N8QHY");
          return { text: "ok" };
        });

        const sendSlack = vi.fn().mockResolvedValue({
          messageId: "m1",
          channelId: "C0A9P2N8QHY",
        });

        await runPulsecheckOnce({
          cfg,
          deps: {
            getReplyFromConfig: replySpy,
            slack: sendSlack,
            getQueueSize: () => 0,
            nowMs: () => 0,
          },
        });

        expect(sendSlack).toHaveBeenCalled();
      },
      { prefix: "carlito-hb-" },
    );
  });
});
