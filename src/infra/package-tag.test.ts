import { describe, expect, it } from "vitest";
import { normalizePackageTagInput } from "./package-tag.js";

describe("normalizePackageTagInput", () => {
  const packageNames = ["carlito", "@realcarlossanchez101/plugin"] as const;

  it.each([
    { input: undefined, expected: null },
    { input: "   ", expected: null },
    { input: "carlito@beta", expected: "beta" },
    { input: "@realcarlossanchez101/plugin@2026.2.24", expected: "2026.2.24" },
    { input: "carlito@   ", expected: null },
    { input: "carlito", expected: null },
    { input: " @realcarlossanchez101/plugin ", expected: null },
    { input: " latest ", expected: "latest" },
    { input: "@other/plugin@beta", expected: "@other/plugin@beta" },
    { input: "carlitoer@beta", expected: "carlitoer@beta" },
  ] satisfies ReadonlyArray<{ input: string | undefined; expected: string | null }>)(
    "normalizes %j",
    ({ input, expected }) => {
      expect(normalizePackageTagInput(input, packageNames)).toBe(expected);
    },
  );
});
