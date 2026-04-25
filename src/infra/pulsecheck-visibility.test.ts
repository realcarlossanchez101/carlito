import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import { resolvePulsecheckVisibility } from "./pulsecheck-visibility.js";

describe("resolvePulsecheckVisibility", () => {
  function createChannelDefaultsPulsecheckConfig(pulsecheck: {
    showOk?: boolean;
    showAlerts?: boolean;
    useIndicator?: boolean;
  }): OpenClawConfig {
    return {
      channels: {
        defaults: {
          pulsecheck,
        },
      },
    } as OpenClawConfig;
  }

  function createTelegramAccountPulsecheckConfig(): OpenClawConfig {
    return {
      channels: {
        telegram: {
          pulsecheck: {
            showOk: true,
          },
          accounts: {
            primary: {
              pulsecheck: {
                showOk: false,
              },
            },
          },
        },
      },
    } as OpenClawConfig;
  }

  it("returns default values when no config is provided", () => {
    const cfg = {} as OpenClawConfig;
    const result = resolvePulsecheckVisibility({ cfg, channel: "telegram" });

    expect(result).toEqual({
      showOk: false,
      showAlerts: true,
      useIndicator: true,
    });
  });

  it("uses channel defaults when provided", () => {
    const cfg = createChannelDefaultsPulsecheckConfig({
      showOk: true,
      showAlerts: false,
      useIndicator: false,
    });

    const result = resolvePulsecheckVisibility({ cfg, channel: "telegram" });

    expect(result).toEqual({
      showOk: true,
      showAlerts: false,
      useIndicator: false,
    });
  });

  it("per-channel config overrides channel defaults", () => {
    const cfg = {
      channels: {
        defaults: {
          pulsecheck: {
            showOk: false,
            showAlerts: true,
            useIndicator: true,
          },
        },
        telegram: {
          pulsecheck: {
            showOk: true,
          },
        },
      },
    } as OpenClawConfig;

    const result = resolvePulsecheckVisibility({ cfg, channel: "telegram" });

    expect(result).toEqual({
      showOk: true,
      showAlerts: true,
      useIndicator: true,
    });
  });

  it("per-account config overrides per-channel config", () => {
    const cfg = {
      channels: {
        defaults: {
          pulsecheck: {
            showOk: false,
            showAlerts: true,
            useIndicator: true,
          },
        },
        telegram: {
          pulsecheck: {
            showOk: false,
            showAlerts: false,
          },
          accounts: {
            primary: {
              pulsecheck: {
                showOk: true,
                showAlerts: true,
              },
            },
          },
        },
      },
    } as OpenClawConfig;

    const result = resolvePulsecheckVisibility({
      cfg,
      channel: "telegram",
      accountId: "primary",
    });

    expect(result).toEqual({
      showOk: true,
      showAlerts: true,
      useIndicator: true,
    });
  });

  it("falls through to defaults when account has no pulsecheck config", () => {
    const cfg = {
      channels: {
        defaults: {
          pulsecheck: {
            showOk: false,
          },
        },
        telegram: {
          pulsecheck: {
            showAlerts: false,
          },
          accounts: {
            primary: {},
          },
        },
      },
    } as OpenClawConfig;

    const result = resolvePulsecheckVisibility({
      cfg,
      channel: "telegram",
      accountId: "primary",
    });

    expect(result).toEqual({
      showOk: false,
      showAlerts: false,
      useIndicator: true,
    });
  });

  it("handles missing accountId gracefully", () => {
    const cfg = createTelegramAccountPulsecheckConfig();
    const result = resolvePulsecheckVisibility({ cfg, channel: "telegram" });

    expect(result.showOk).toBe(true);
  });

  it("handles non-existent account gracefully", () => {
    const cfg = createTelegramAccountPulsecheckConfig();
    const result = resolvePulsecheckVisibility({
      cfg,
      channel: "telegram",
      accountId: "nonexistent",
    });

    expect(result.showOk).toBe(true);
  });

  it("works with whatsapp channel", () => {
    const cfg = {
      channels: {
        whatsapp: {
          pulsecheck: {
            showOk: true,
            showAlerts: false,
          },
        },
      },
    } as OpenClawConfig;

    const result = resolvePulsecheckVisibility({ cfg, channel: "whatsapp" });

    expect(result).toEqual({
      showOk: true,
      showAlerts: false,
      useIndicator: true,
    });
  });

  it("works with discord channel", () => {
    const cfg = {
      channels: {
        discord: {
          pulsecheck: {
            useIndicator: false,
          },
        },
      },
    } as OpenClawConfig;

    const result = resolvePulsecheckVisibility({ cfg, channel: "discord" });

    expect(result).toEqual({
      showOk: false,
      showAlerts: true,
      useIndicator: false,
    });
  });

  it("works with slack channel", () => {
    const cfg = {
      channels: {
        slack: {
          pulsecheck: {
            showOk: true,
            showAlerts: true,
            useIndicator: true,
          },
        },
      },
    } as OpenClawConfig;

    const result = resolvePulsecheckVisibility({ cfg, channel: "slack" });

    expect(result).toEqual({
      showOk: true,
      showAlerts: true,
      useIndicator: true,
    });
  });

  it("webchat uses channel defaults only (no per-channel config)", () => {
    const cfg = createChannelDefaultsPulsecheckConfig({
      showOk: true,
      showAlerts: false,
      useIndicator: false,
    });

    const result = resolvePulsecheckVisibility({ cfg, channel: "webchat" });

    expect(result).toEqual({
      showOk: true,
      showAlerts: false,
      useIndicator: false,
    });
  });

  it("webchat returns defaults when no channel defaults configured", () => {
    const cfg = {} as OpenClawConfig;

    const result = resolvePulsecheckVisibility({ cfg, channel: "webchat" });

    expect(result).toEqual({
      showOk: false,
      showAlerts: true,
      useIndicator: true,
    });
  });

  it("webchat ignores accountId (only uses defaults)", () => {
    const cfg = {
      channels: {
        defaults: {
          pulsecheck: {
            showOk: true,
          },
        },
      },
    } as OpenClawConfig;

    const result = resolvePulsecheckVisibility({
      cfg,
      channel: "webchat",
      accountId: "some-account",
    });

    expect(result.showOk).toBe(true);
  });
});
