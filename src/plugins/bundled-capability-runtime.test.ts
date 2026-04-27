import { describe, expect, it } from "vitest";
import { buildVitestCapabilityShimAliasMap } from "./bundled-capability-runtime.js";

describe("buildVitestCapabilityShimAliasMap", () => {
  it("keeps scoped and unscoped capability shim aliases aligned", () => {
    const aliasMap = buildVitestCapabilityShimAliasMap();

    expect(aliasMap["carlito/plugin-sdk/llm-task"]).toBe(
      aliasMap["@realcarlossanchez101/plugin-sdk/llm-task"],
    );
    expect(aliasMap["carlito/plugin-sdk/config-runtime"]).toBe(
      aliasMap["@realcarlossanchez101/plugin-sdk/config-runtime"],
    );
    expect(aliasMap["carlito/plugin-sdk/media-runtime"]).toBe(
      aliasMap["@realcarlossanchez101/plugin-sdk/media-runtime"],
    );
    expect(aliasMap["carlito/plugin-sdk/provider-onboard"]).toBe(
      aliasMap["@realcarlossanchez101/plugin-sdk/provider-onboard"],
    );
    expect(aliasMap["carlito/plugin-sdk/speech-core"]).toBe(
      aliasMap["@realcarlossanchez101/plugin-sdk/speech-core"],
    );
  });
});
