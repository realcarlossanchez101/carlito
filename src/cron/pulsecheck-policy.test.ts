import { describe, expect, it } from "vitest";
import {
  shouldEnqueueCronMainSummary,
  shouldSkipPulsecheckOnlyDelivery,
} from "./pulsecheck-policy.js";

describe("shouldSkipPulsecheckOnlyDelivery", () => {
  it("suppresses empty payloads", () => {
    expect(shouldSkipPulsecheckOnlyDelivery([], 300)).toBe(true);
  });

  it("suppresses when any payload is a pulsecheck ack and no media is present", () => {
    expect(
      shouldSkipPulsecheckOnlyDelivery(
        [{ text: "Checked inbox and calendar." }, { text: "PULSECHECK_OK" }],
        300,
      ),
    ).toBe(true);
  });

  it("does not suppress when media is present", () => {
    expect(
      shouldSkipPulsecheckOnlyDelivery(
        [{ text: "PULSECHECK_OK", mediaUrl: "https://example.com/image.png" }],
        300,
      ),
    ).toBe(false);
  });
});

describe("shouldEnqueueCronMainSummary", () => {
  const isSystemEvent = (text: string) => text.includes("PULSECHECK_OK");

  it("enqueues only when delivery was requested but did not run", () => {
    expect(
      shouldEnqueueCronMainSummary({
        summaryText: "PULSECHECK_OK",
        deliveryRequested: true,
        delivered: false,
        deliveryAttempted: false,
        suppressMainSummary: false,
        isCronSystemEvent: isSystemEvent,
      }),
    ).toBe(true);
  });

  it("does not enqueue after attempted outbound delivery", () => {
    expect(
      shouldEnqueueCronMainSummary({
        summaryText: "PULSECHECK_OK",
        deliveryRequested: true,
        delivered: false,
        deliveryAttempted: true,
        suppressMainSummary: false,
        isCronSystemEvent: isSystemEvent,
      }),
    ).toBe(false);
  });
});
