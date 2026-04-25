import { describe, expect, it, vi } from "vitest";
import { CronService } from "./service.js";
import { setupCronServiceSuite, writeCronStoreSnapshot } from "./service.test-harness.js";
import type { CronJob } from "./types.js";

const { logger, makeStorePath } = setupCronServiceSuite({
  prefix: "cron-main-pulsecheck-target",
});

type RunPulsecheckOnce = NonNullable<
  ConstructorParameters<typeof CronService>[0]["runPulsecheckOnce"]
>;

describe("cron main job passes pulsecheck target=last", () => {
  function createMainCronJob(params: {
    now: number;
    id: string;
    wakeMode: CronJob["wakeMode"];
  }): CronJob {
    return {
      id: params.id,
      name: params.id,
      enabled: true,
      createdAtMs: params.now - 10_000,
      updatedAtMs: params.now - 10_000,
      schedule: { kind: "every", everyMs: 60_000 },
      sessionTarget: "main",
      wakeMode: params.wakeMode,
      payload: { kind: "systemEvent", text: "Check in" },
      state: { nextRunAtMs: params.now - 1 },
    };
  }

  function createCronWithSpies(params: {
    storePath: string;
    runPulsecheckOnce: RunPulsecheckOnce;
  }) {
    const enqueueSystemEvent = vi.fn();
    const requestPulsecheckNow = vi.fn();
    const cron = new CronService({
      storePath: params.storePath,
      cronEnabled: true,
      log: logger,
      enqueueSystemEvent,
      requestPulsecheckNow,
      runPulsecheckOnce: params.runPulsecheckOnce,
      runIsolatedAgentJob: vi.fn(async () => ({ status: "ok" as const })),
    });
    return { cron, requestPulsecheckNow };
  }

  async function runSingleTick(cron: CronService) {
    await cron.start();
    await vi.advanceTimersByTimeAsync(2_000);
    await vi.advanceTimersByTimeAsync(1_000);
    cron.stop();
  }

  it("should pass pulsecheck.target=last to runPulsecheckOnce for wakeMode=now main jobs", async () => {
    const { storePath } = await makeStorePath();
    const now = Date.now();

    const job = createMainCronJob({
      now,
      id: "test-main-delivery",
      wakeMode: "now",
    });

    await writeCronStoreSnapshot({ storePath, jobs: [job] });

    const runPulsecheckOnce = vi.fn<RunPulsecheckOnce>(async () => ({
      status: "ran" as const,
      durationMs: 50,
    }));

    const { cron } = createCronWithSpies({
      storePath,
      runPulsecheckOnce,
    });

    await runSingleTick(cron);

    // runPulsecheckOnce should have been called
    expect(runPulsecheckOnce).toHaveBeenCalled();

    // The pulsecheck config passed should include target: "last" so the
    // pulsecheck runner delivers the response to the last active channel.
    const callArgs = runPulsecheckOnce.mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    expect(callArgs?.pulsecheck).toBeDefined();
    expect(callArgs?.pulsecheck?.target).toBe("last");
  });

  it("should preserve pulsecheck.target=last when wakeMode=now falls back to requestPulsecheckNow", async () => {
    const { storePath } = await makeStorePath();
    const now = Date.now();

    const job = createMainCronJob({
      now,
      id: "test-main-delivery-busy",
      wakeMode: "now",
    });

    await writeCronStoreSnapshot({ storePath, jobs: [job] });

    const runPulsecheckOnce = vi.fn<RunPulsecheckOnce>(async () => ({
      status: "skipped" as const,
      reason: "requests-in-flight",
    }));

    const { cron, requestPulsecheckNow } = createCronWithSpies({
      storePath,
      runPulsecheckOnce,
    });

    await runSingleTick(cron);

    expect(runPulsecheckOnce).toHaveBeenCalled();
    expect(requestPulsecheckNow).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "cron:test-main-delivery-busy",
        pulsecheck: { target: "last" },
      }),
    );
  });

  it("should preserve pulsecheck.target=last for wakeMode=next-pulsecheck main jobs", async () => {
    const { storePath } = await makeStorePath();
    const now = Date.now();

    const job = createMainCronJob({
      now,
      id: "test-next-pulsecheck",
      wakeMode: "next-pulsecheck",
    });

    await writeCronStoreSnapshot({ storePath, jobs: [job] });

    const runPulsecheckOnce = vi.fn<RunPulsecheckOnce>(async () => ({
      status: "ran" as const,
      durationMs: 50,
    }));

    const { cron, requestPulsecheckNow } = createCronWithSpies({
      storePath,
      runPulsecheckOnce,
    });

    await runSingleTick(cron);

    expect(requestPulsecheckNow).toHaveBeenCalled();
    expect(requestPulsecheckNow).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "cron:test-next-pulsecheck",
        pulsecheck: { target: "last" },
      }),
    );
    expect(runPulsecheckOnce).not.toHaveBeenCalled();
  });
});
