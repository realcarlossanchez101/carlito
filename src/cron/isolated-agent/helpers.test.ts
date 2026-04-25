import { describe, expect, it } from "vitest";
import {
  isPulsecheckOnlyResponse,
  pickDeliverablePayloads,
  pickLastDeliverablePayload,
  pickLastNonEmptyTextFromPayloads,
  pickSummaryFromPayloads,
} from "./helpers.js";

describe("pickSummaryFromPayloads", () => {
  it("picks real text over error payload", () => {
    const payloads = [
      { text: "Here is your summary" },
      { text: "Tool error: rate limited", isError: true },
    ];
    expect(pickSummaryFromPayloads(payloads)).toBe("Here is your summary");
  });

  it("falls back to error payload when no real text exists", () => {
    const payloads = [{ text: "Tool error: rate limited", isError: true }];
    expect(pickSummaryFromPayloads(payloads)).toBe("Tool error: rate limited");
  });

  it("returns undefined for empty payloads", () => {
    expect(pickSummaryFromPayloads([])).toBeUndefined();
  });

  it("treats isError: undefined as non-error", () => {
    const payloads = [
      { text: "normal text", isError: undefined },
      { text: "error text", isError: true },
    ];
    expect(pickSummaryFromPayloads(payloads)).toBe("normal text");
  });
});

describe("pickLastNonEmptyTextFromPayloads", () => {
  it("picks real text over error payload", () => {
    const payloads = [{ text: "Real output" }, { text: "Service error", isError: true }];
    expect(pickLastNonEmptyTextFromPayloads(payloads)).toBe("Real output");
  });

  it("falls back to error payload when no real text exists", () => {
    const payloads = [{ text: "Service error", isError: true }];
    expect(pickLastNonEmptyTextFromPayloads(payloads)).toBe("Service error");
  });

  it("returns undefined for empty payloads", () => {
    expect(pickLastNonEmptyTextFromPayloads([])).toBeUndefined();
  });

  it("treats isError: undefined as non-error", () => {
    const payloads = [
      { text: "good", isError: undefined },
      { text: "bad", isError: true },
    ];
    expect(pickLastNonEmptyTextFromPayloads(payloads)).toBe("good");
  });
});

describe("pickLastDeliverablePayload", () => {
  it("picks real payload over error payload", () => {
    const real = { text: "Delivered content" };
    const error = { text: "Error warning", isError: true as const };
    expect(pickLastDeliverablePayload([real, error])).toBe(real);
  });

  it("falls back to error payload when no real payload exists", () => {
    const error = { text: "Error warning", isError: true as const };
    expect(pickLastDeliverablePayload([error])).toBe(error);
  });

  it("returns undefined for empty payloads", () => {
    expect(pickLastDeliverablePayload([])).toBeUndefined();
  });

  it("picks media payload over error text payload", () => {
    const media = { mediaUrl: "https://example.com/img.png" };
    const error = { text: "Error warning", isError: true as const };
    expect(pickLastDeliverablePayload([media, error])).toBe(media);
  });

  it("treats isError: undefined as non-error", () => {
    const normal = { text: "ok", isError: undefined };
    const error = { text: "bad", isError: true as const };
    expect(pickLastDeliverablePayload([normal, error])).toBe(normal);
  });
});

describe("pickDeliverablePayloads", () => {
  it("preserves all successful deliverable payloads", () => {
    const payloads = [
      { text: "line 1" },
      { text: "temporary error", isError: true as const },
      { text: "line 2" },
    ];

    expect(pickDeliverablePayloads(payloads)).toEqual([{ text: "line 1" }, { text: "line 2" }]);
  });

  it("returns only the last error payload when all payloads are errors", () => {
    const payloads = [
      { text: "first error", isError: true as const },
      { text: "last error", isError: true as const },
    ];

    expect(pickDeliverablePayloads(payloads)).toEqual([{ text: "last error", isError: true }]);
  });
});

describe("isPulsecheckOnlyResponse", () => {
  const ACK_MAX = 300;

  it("returns true for empty payloads", () => {
    expect(isPulsecheckOnlyResponse([], ACK_MAX)).toBe(true);
  });

  it("returns true for a single PULSECHECK_OK payload", () => {
    expect(isPulsecheckOnlyResponse([{ text: "PULSECHECK_OK" }], ACK_MAX)).toBe(true);
  });

  it("returns false for a single non-pulsecheck payload", () => {
    expect(isPulsecheckOnlyResponse([{ text: "Something important happened" }], ACK_MAX)).toBe(
      false,
    );
  });

  it("returns true when multiple payloads include narration followed by PULSECHECK_OK", () => {
    // Agent narrates its work then signals nothing needs attention.
    expect(
      isPulsecheckOnlyResponse(
        [
          { text: "It's 12:49 AM — quiet hours. Let me run the checks quickly." },
          { text: "Emails: Just 2 calendar invites. Not urgent." },
          { text: "PULSECHECK_OK" },
        ],
        ACK_MAX,
      ),
    ).toBe(true);
  });

  it("returns false when media is present even with PULSECHECK_OK text", () => {
    expect(
      isPulsecheckOnlyResponse(
        [{ text: "PULSECHECK_OK", mediaUrl: "https://example.com/img.png" }],
        ACK_MAX,
      ),
    ).toBe(false);
  });

  it("returns false when media is in a different payload than PULSECHECK_OK", () => {
    expect(
      isPulsecheckOnlyResponse(
        [
          { text: "PULSECHECK_OK" },
          { text: "Here's an image", mediaUrl: "https://example.com/img.png" },
        ],
        ACK_MAX,
      ),
    ).toBe(false);
  });

  it("returns false when no payload contains PULSECHECK_OK", () => {
    expect(
      isPulsecheckOnlyResponse(
        [{ text: "Checked emails — found 3 urgent messages from your manager." }],
        ACK_MAX,
      ),
    ).toBe(false);
  });
});
