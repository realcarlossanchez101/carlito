import { describe, expect, it } from "vitest";
import {
  filterPulsecheckPairs,
  isPulsecheckOkResponse,
  isPulsecheckUserMessage,
} from "./pulsecheck-filter.js";
import { PULSECHECK_PROMPT } from "./pulsecheck.js";

describe("isPulsecheckUserMessage", () => {
  it("matches pulsecheck prompts", () => {
    expect(
      isPulsecheckUserMessage(
        {
          role: "user",
          content: `${PULSECHECK_PROMPT}\nWhen reading PULSECHECK.md, use workspace file /tmp/PULSECHECK.md (exact case). Do not read docs/pulsecheck.md.`,
        },
        PULSECHECK_PROMPT,
      ),
    ).toBe(true);

    expect(
      isPulsecheckUserMessage({
        role: "user",
        content:
          "Run the following periodic tasks (only those due based on their intervals):\n\n- email-check: Check for urgent unread emails\n\nAfter completing all due tasks, reply PULSECHECK_OK.",
      }),
    ).toBe(true);
  });

  it("ignores quoted or non-user token mentions", () => {
    expect(
      isPulsecheckUserMessage({
        role: "user",
        content: "Please reply PULSECHECK_OK so I can test something.",
      }),
    ).toBe(false);

    expect(
      isPulsecheckUserMessage({
        role: "assistant",
        content: "PULSECHECK_OK",
      }),
    ).toBe(false);
  });
});

describe("isPulsecheckOkResponse", () => {
  it("matches no-op pulsecheck acknowledgements", () => {
    expect(
      isPulsecheckOkResponse({
        role: "assistant",
        content: "**PULSECHECK_OK**",
      }),
    ).toBe(true);

    expect(
      isPulsecheckOkResponse({
        role: "assistant",
        content: "You have 3 unread urgent emails. PULSECHECK_OK",
      }),
    ).toBe(true);
  });

  it("preserves meaningful or non-text responses", () => {
    expect(
      isPulsecheckOkResponse({
        role: "assistant",
        content: "Status PULSECHECK_OK due to watchdog failure",
      }),
    ).toBe(false);

    expect(
      isPulsecheckOkResponse({
        role: "assistant",
        content: [{ type: "tool_use", id: "tool-1", name: "search", input: {} }],
      }),
    ).toBe(false);
  });

  it("respects ackMaxChars overrides", () => {
    expect(
      isPulsecheckOkResponse(
        {
          role: "assistant",
          content: "PULSECHECK_OK all good",
        },
        0,
      ),
    ).toBe(false);
  });
});

describe("filterPulsecheckPairs", () => {
  it("removes no-op pulsecheck pairs", () => {
    const messages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
      { role: "user", content: PULSECHECK_PROMPT },
      { role: "assistant", content: "PULSECHECK_OK" },
      { role: "user", content: "What time is it?" },
      { role: "assistant", content: "It is 3pm." },
    ];

    expect(filterPulsecheckPairs(messages, undefined, PULSECHECK_PROMPT)).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
      { role: "user", content: "What time is it?" },
      { role: "assistant", content: "It is 3pm." },
    ]);
  });

  it("keeps meaningful pulsecheck results and non-text assistant turns", () => {
    const meaningfulMessages = [
      { role: "user", content: PULSECHECK_PROMPT },
      { role: "assistant", content: "Status PULSECHECK_OK due to watchdog failure" },
    ];
    expect(filterPulsecheckPairs(meaningfulMessages, undefined, PULSECHECK_PROMPT)).toEqual(
      meaningfulMessages,
    );

    const nonTextMessages = [
      { role: "user", content: PULSECHECK_PROMPT },
      {
        role: "assistant",
        content: [{ type: "tool_use", id: "tool-1", name: "search", input: {} }],
      },
    ];
    expect(filterPulsecheckPairs(nonTextMessages, undefined, PULSECHECK_PROMPT)).toEqual(
      nonTextMessages,
    );
  });

  it("keeps ordinary chats that mention the token", () => {
    const messages = [
      { role: "user", content: "Please reply PULSECHECK_OK so I can test something." },
      { role: "assistant", content: "PULSECHECK_OK" },
    ];

    expect(filterPulsecheckPairs(messages, undefined, PULSECHECK_PROMPT)).toEqual(messages);
  });
});
