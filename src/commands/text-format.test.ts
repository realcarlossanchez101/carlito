import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("carlito", 16)).toBe("carlito");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("carlito-status-output", 10)).toBe("carlito-…");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
