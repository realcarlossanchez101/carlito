import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#carlito",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#carlito",
      rawTarget: "#carlito",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "carlito-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "carlito-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "carlito-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "carlito-bot",
      rawTarget: "carlito-bot",
    });
  });
});
