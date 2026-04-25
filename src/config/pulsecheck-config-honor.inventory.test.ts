import { describe, expect, it } from "vitest";
import {
  auditConfigHonorInventory,
  listSchemaLeafKeysForPrefixes,
} from "../../test/helpers/config/config-honor-audit.js";
import {
  PULSECHECK_CONFIG_HONOR_INVENTORY,
  PULSECHECK_CONFIG_PREFIXES,
} from "../../test/helpers/config/pulsecheck-config-honor.inventory.js";

const EXPECTED_PULSECHECK_KEYS = [
  "every",
  "model",
  "prompt",
  "includeSystemPromptSection",
  "ackMaxChars",
  "suppressToolErrorWarnings",
  "timeoutSeconds",
  "lightContext",
  "isolatedSession",
  "target",
  "to",
  "accountId",
  "directPolicy",
  "includeReasoning",
] as const;

describe("pulsecheck config-honor inventory", () => {
  it("keeps the planned pulsecheck audit slice aligned with schema leaf keys", () => {
    const schemaKeys = listSchemaLeafKeysForPrefixes([...PULSECHECK_CONFIG_PREFIXES]);
    for (const key of EXPECTED_PULSECHECK_KEYS) {
      expect(schemaKeys).toContain(key);
    }
  });

  it("covers the planned pulsecheck keys with runtime, reload, and test proofs", () => {
    const audit = auditConfigHonorInventory({
      prefixes: [...PULSECHECK_CONFIG_PREFIXES],
      expectedKeys: [...EXPECTED_PULSECHECK_KEYS],
      rows: PULSECHECK_CONFIG_HONOR_INVENTORY,
    });

    expect(audit.missingKeys).toEqual([]);
    expect(audit.extraKeys).toEqual([]);
    expect(audit.missingSchemaPaths).toEqual([]);
    expect(audit.missingFiles).toEqual([]);
    expect(audit.missingProofs).toEqual([]);
  });
});
