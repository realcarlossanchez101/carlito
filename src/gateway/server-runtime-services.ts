import type { CarlitoConfig } from "../config/types.carlito.js";
import { isVitestRuntimeEnv } from "../infra/env.js";
import { startPulsecheckRunner, type PulsecheckRunner } from "../infra/pulsecheck-runner.js";
import type { ChannelHealthMonitor } from "./channel-health-monitor.js";
import { startChannelHealthMonitor } from "./channel-health-monitor.js";
import { startGatewayModelPricingRefresh } from "./model-pricing-cache.js";

type GatewayRuntimeServiceLogger = {
  child: (name: string) => {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
  error: (message: string) => void;
};

export type GatewayChannelManager = Parameters<
  typeof startChannelHealthMonitor
>[0]["channelManager"];

function createNoopPulsecheckRunner(): PulsecheckRunner {
  return {
    stop: () => {},
    updateConfig: (_cfg: CarlitoConfig) => {},
  };
}

export function startGatewayChannelHealthMonitor(params: {
  cfg: CarlitoConfig;
  channelManager: GatewayChannelManager;
}): ChannelHealthMonitor | null {
  const healthCheckMinutes = params.cfg.gateway?.channelHealthCheckMinutes;
  if (healthCheckMinutes === 0) {
    return null;
  }
  const staleEventThresholdMinutes = params.cfg.gateway?.channelStaleEventThresholdMinutes;
  const maxRestartsPerHour = params.cfg.gateway?.channelMaxRestartsPerHour;
  return startChannelHealthMonitor({
    channelManager: params.channelManager,
    checkIntervalMs: (healthCheckMinutes ?? 5) * 60_000,
    ...(staleEventThresholdMinutes != null && {
      staleEventThresholdMs: staleEventThresholdMinutes * 60_000,
    }),
    ...(maxRestartsPerHour != null && { maxRestartsPerHour }),
  });
}

export function startGatewayCronWithLogging(params: {
  cron: { start: () => Promise<void> };
  logCron: { error: (message: string) => void };
}): void {
  void params.cron.start().catch((err) => params.logCron.error(`failed to start: ${String(err)}`));
}

function recoverPendingOutboundDeliveries(params: {
  cfg: CarlitoConfig;
  log: GatewayRuntimeServiceLogger;
}): void {
  void (async () => {
    const { recoverPendingDeliveries } = await import("../infra/outbound/delivery-queue.js");
    const { deliverOutboundPayloads } = await import("../infra/outbound/deliver.js");
    const logRecovery = params.log.child("delivery-recovery");
    await recoverPendingDeliveries({
      deliver: deliverOutboundPayloads,
      log: logRecovery,
      cfg: params.cfg,
    });
  })().catch((err) => params.log.error(`Delivery recovery failed: ${String(err)}`));
}

export function startGatewayRuntimeServices(params: {
  minimalTestGateway: boolean;
  cfgAtStart: CarlitoConfig;
  channelManager: GatewayChannelManager;
  log: GatewayRuntimeServiceLogger;
}): {
  pulsecheckRunner: PulsecheckRunner;
  channelHealthMonitor: ChannelHealthMonitor | null;
  stopModelPricingRefresh: () => void;
} {
  // Keep scheduled work inert until post-attach sidecars finish.
  const channelHealthMonitor = startGatewayChannelHealthMonitor({
    cfg: params.cfgAtStart,
    channelManager: params.channelManager,
  });

  return {
    pulsecheckRunner: createNoopPulsecheckRunner(),
    channelHealthMonitor,
    stopModelPricingRefresh:
      !params.minimalTestGateway && !isVitestRuntimeEnv()
        ? startGatewayModelPricingRefresh({ config: params.cfgAtStart })
        : () => {},
  };
}

/**
 * Activate cron scheduler, pulsecheck runner, and pending delivery recovery
 * after gateway sidecars are fully started and chat.history is available.
 */
export function activateGatewayScheduledServices(params: {
  minimalTestGateway: boolean;
  cfgAtStart: CarlitoConfig;
  cron: { start: () => Promise<void> };
  logCron: { error: (message: string) => void };
  log: GatewayRuntimeServiceLogger;
}): { pulsecheckRunner: PulsecheckRunner } {
  if (params.minimalTestGateway) {
    return { pulsecheckRunner: createNoopPulsecheckRunner() };
  }
  const pulsecheckRunner = startPulsecheckRunner({ cfg: params.cfgAtStart });
  startGatewayCronWithLogging({
    cron: params.cron,
    logCron: params.logCron,
  });
  recoverPendingOutboundDeliveries({
    cfg: params.cfgAtStart,
    log: params.log,
  });
  return { pulsecheckRunner };
}
