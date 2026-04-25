import type { ChannelPulsecheckVisibilityConfig } from "../config/types.channels.js";
import type { OpenClawConfig } from "../config/types.openclaw.js";
import type { GatewayMessageChannel } from "../utils/message-channel.js";

export type ResolvedPulsecheckVisibility = {
  showOk: boolean;
  showAlerts: boolean;
  useIndicator: boolean;
};

const DEFAULT_VISIBILITY: ResolvedPulsecheckVisibility = {
  showOk: false, // Silent by default
  showAlerts: true, // Show content messages
  useIndicator: true, // Emit indicator events
};

/**
 * Resolve pulsecheck visibility settings for a channel.
 * Supports both deliverable channels and webchat.
 * For webchat, uses channels.defaults.pulsecheck since webchat doesn't have per-channel config.
 */
export function resolvePulsecheckVisibility(params: {
  cfg: OpenClawConfig;
  channel: GatewayMessageChannel;
  accountId?: string;
}): ResolvedPulsecheckVisibility {
  const { cfg, channel, accountId } = params;

  // Webchat uses channel defaults only (no per-channel or per-account config)
  if (channel === "webchat") {
    const channelDefaults = cfg.channels?.defaults?.pulsecheck;
    return {
      showOk: channelDefaults?.showOk ?? DEFAULT_VISIBILITY.showOk,
      showAlerts: channelDefaults?.showAlerts ?? DEFAULT_VISIBILITY.showAlerts,
      useIndicator: channelDefaults?.useIndicator ?? DEFAULT_VISIBILITY.useIndicator,
    };
  }

  // Layer 1: Global channel defaults
  const channelDefaults = cfg.channels?.defaults?.pulsecheck;

  // Layer 2: Per-channel config (at channel root level)
  const channelCfg = cfg.channels?.[channel] as
    | {
        pulsecheck?: ChannelPulsecheckVisibilityConfig;
        accounts?: Record<string, { pulsecheck?: ChannelPulsecheckVisibilityConfig }>;
      }
    | undefined;
  const perChannel = channelCfg?.pulsecheck;

  // Layer 3: Per-account config (most specific)
  const accountCfg = accountId ? channelCfg?.accounts?.[accountId] : undefined;
  const perAccount = accountCfg?.pulsecheck;

  // Precedence: per-account > per-channel > channel-defaults > global defaults
  return {
    showOk:
      perAccount?.showOk ??
      perChannel?.showOk ??
      channelDefaults?.showOk ??
      DEFAULT_VISIBILITY.showOk,
    showAlerts:
      perAccount?.showAlerts ??
      perChannel?.showAlerts ??
      channelDefaults?.showAlerts ??
      DEFAULT_VISIBILITY.showAlerts,
    useIndicator:
      perAccount?.useIndicator ??
      perChannel?.useIndicator ??
      channelDefaults?.useIndicator ??
      DEFAULT_VISIBILITY.useIndicator,
  };
}
