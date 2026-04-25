import { describe, expect, it, vi } from "vitest";
import type { ChannelPlugin } from "../channels/plugins/types.public.js";
import type { OpenClawConfig } from "../config/config.js";
import { createPulsecheckTypingCallbacks } from "./pulsecheck-typing.js";

async function withFakeTimers(run: () => Promise<void>) {
  vi.useFakeTimers();
  try {
    await run();
  } finally {
    vi.useRealTimers();
  }
}

describe("createPulsecheckTypingCallbacks", () => {
  it("uses the normal 6s typing cadence by default", async () => {
    await withFakeTimers(async () => {
      const sendTyping = vi.fn(async () => undefined);
      const plugin = {
        pulsecheck: {
          sendTyping,
        },
      } satisfies Pick<ChannelPlugin, "pulsecheck">;

      const callbacks = createPulsecheckTypingCallbacks({
        cfg: {} as OpenClawConfig,
        target: {
          channel: "telegram",
          to: "123",
        },
        plugin,
      });

      expect(callbacks).toBeDefined();
      await callbacks?.onReplyStart();
      expect(sendTyping).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(5_999);
      expect(sendTyping).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(sendTyping).toHaveBeenCalledTimes(2);

      callbacks?.onCleanup?.();
    });
  });
});
