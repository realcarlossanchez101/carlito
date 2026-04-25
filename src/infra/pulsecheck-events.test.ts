import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  emitPulsecheckEvent,
  getLastPulsecheckEvent,
  onPulsecheckEvent,
  resetPulsecheckEventsForTest,
  resolveIndicatorType,
} from "./pulsecheck-events.js";

type PulsecheckEventsModule = typeof import("./pulsecheck-events.js");

const pulsecheckEventsModuleUrl = new URL("./pulsecheck-events.ts", import.meta.url).href;

async function importPulsecheckEventsModule(cacheBust: string): Promise<PulsecheckEventsModule> {
  return (await import(`${pulsecheckEventsModuleUrl}?t=${cacheBust}`)) as PulsecheckEventsModule;
}

describe("resolveIndicatorType", () => {
  it("maps pulsecheck statuses to indicator types", () => {
    expect(resolveIndicatorType("ok-empty")).toBe("ok");
    expect(resolveIndicatorType("ok-token")).toBe("ok");
    expect(resolveIndicatorType("sent")).toBe("alert");
    expect(resolveIndicatorType("failed")).toBe("error");
    expect(resolveIndicatorType("skipped")).toBeUndefined();
  });
});

describe("pulsecheck events", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-09T12:00:00Z"));
  });

  afterEach(() => {
    resetPulsecheckEventsForTest();
    vi.useRealTimers();
  });

  it("stores the last event and timestamps emitted payloads", () => {
    emitPulsecheckEvent({ status: "sent", to: "+123", preview: "ping" });

    expect(getLastPulsecheckEvent()).toEqual({
      ts: 1767960000000,
      status: "sent",
      to: "+123",
      preview: "ping",
    });
  });

  it("delivers events to listeners, isolates listener failures, and supports unsubscribe", () => {
    const seen: string[] = [];
    const unsubscribeFirst = onPulsecheckEvent((evt) => {
      seen.push(`first:${evt.status}`);
    });
    onPulsecheckEvent(() => {
      throw new Error("boom");
    });
    const unsubscribeThird = onPulsecheckEvent((evt) => {
      seen.push(`third:${evt.status}`);
    });

    emitPulsecheckEvent({ status: "ok-empty" });
    unsubscribeFirst();
    unsubscribeThird();
    emitPulsecheckEvent({ status: "failed" });

    expect(seen).toEqual(["first:ok-empty", "third:ok-empty"]);
  });

  it("shares pulsecheck state across duplicate module instances", async () => {
    const first = await importPulsecheckEventsModule(`first-${Date.now()}`);
    const second = await importPulsecheckEventsModule(`second-${Date.now()}`);

    first.resetPulsecheckEventsForTest();

    const seen: string[] = [];
    const stop = first.onPulsecheckEvent((evt) => {
      seen.push(evt.status);
    });

    second.emitPulsecheckEvent({ status: "ok-token", preview: "pong" });

    expect(first.getLastPulsecheckEvent()).toEqual({
      ts: 1767960000000,
      status: "ok-token",
      preview: "pong",
    });
    expect(seen).toEqual(["ok-token"]);

    stop();
    first.resetPulsecheckEventsForTest();
  });
});
