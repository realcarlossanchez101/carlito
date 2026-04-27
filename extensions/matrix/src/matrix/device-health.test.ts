import { describe, expect, it } from "vitest";
import { isCarlitoManagedMatrixDevice, summarizeMatrixDeviceHealth } from "./device-health.js";

describe("matrix device health", () => {
  it("detects Carlito-managed device names", () => {
    expect(isCarlitoManagedMatrixDevice("Carlito Gateway")).toBe(true);
    expect(isCarlitoManagedMatrixDevice("Carlito Debug")).toBe(true);
    expect(isCarlitoManagedMatrixDevice("Element iPhone")).toBe(false);
    expect(isCarlitoManagedMatrixDevice(null)).toBe(false);
  });

  it("summarizes stale Carlito-managed devices separately from the current device", () => {
    const summary = summarizeMatrixDeviceHealth([
      {
        deviceId: "du314Zpw3A",
        displayName: "Carlito Gateway",
        current: true,
      },
      {
        deviceId: "BritdXC6iL",
        displayName: "Carlito Gateway",
        current: false,
      },
      {
        deviceId: "G6NJU9cTgs",
        displayName: "Carlito Debug",
        current: false,
      },
      {
        deviceId: "phone123",
        displayName: "Element iPhone",
        current: false,
      },
    ]);

    expect(summary.currentDeviceId).toBe("du314Zpw3A");
    expect(summary.currentCarlitoDevices).toEqual([
      expect.objectContaining({ deviceId: "du314Zpw3A" }),
    ]);
    expect(summary.staleCarlitoDevices).toEqual([
      expect.objectContaining({ deviceId: "BritdXC6iL" }),
      expect.objectContaining({ deviceId: "G6NJU9cTgs" }),
    ]);
  });
});
