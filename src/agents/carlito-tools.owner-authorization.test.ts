import { describe, expect, it } from "vitest";
import {
  isCarlitoOwnerOnlyCoreToolName,
  CARLITO_OWNER_ONLY_CORE_TOOL_NAMES,
} from "./tools/owner-only-tools.js";

describe("createCarlitoTools owner authorization", () => {
  it("marks owner-only core tool names", () => {
    expect(CARLITO_OWNER_ONLY_CORE_TOOL_NAMES).toEqual(["cron", "gateway", "nodes"]);
    expect(isCarlitoOwnerOnlyCoreToolName("cron")).toBe(true);
    expect(isCarlitoOwnerOnlyCoreToolName("gateway")).toBe(true);
    expect(isCarlitoOwnerOnlyCoreToolName("nodes")).toBe(true);
  });

  it("keeps canvas non-owner-only", () => {
    expect(isCarlitoOwnerOnlyCoreToolName("canvas")).toBe(false);
  });
});
