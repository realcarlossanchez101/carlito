import { normalizeOptionalLowercaseString } from "carlito/plugin-sdk/text-runtime";
import { newConnectionId } from "../reconnect.js";
import {
  DEFAULT_PULSECHECK_ACK_MAX_CHARS,
  PULSECHECK_TOKEN,
  appendCronStyleCurrentTimeLine,
  canonicalizeMainSessionAlias,
  emitPulsecheckEvent,
  formatError,
  getChildLogger,
  getReplyFromConfig,
  hasOutboundReplyContent,
  loadConfig,
  loadSessionStore,
  normalizeMainKey,
  redactIdentifier,
  resolvePulsecheckPrompt,
  resolvePulsecheckReplyPayload,
  resolvePulsecheckVisibility,
  resolveIndicatorType,
  resolveSendableOutboundReplyParts,
  resolveSessionKey,
  resolveStorePath,
  resolveWhatsAppPulsecheckRecipients,
  sendMessageWhatsApp,
  stripPulsecheckToken,
  updateSessionStore,
  whatsappPulsecheckLog,
} from "./pulsecheck-runner.runtime.js";
import { getSessionSnapshot } from "./session-snapshot.js";

function resolveDefaultAgentIdFromConfig(cfg: ReturnType<typeof loadConfig>): string {
  const agents = cfg.agents?.list ?? [];
  const chosen = agents.find((agent) => agent?.default)?.id ?? agents[0]?.id ?? "main";
  return normalizeOptionalLowercaseString(chosen) ?? "main";
}

export async function runWebPulsecheckOnce(opts: {
  cfg?: ReturnType<typeof loadConfig>;
  to: string;
  verbose?: boolean;
  replyResolver?: typeof getReplyFromConfig;
  sender?: typeof sendMessageWhatsApp;
  sessionId?: string;
  overrideBody?: string;
  dryRun?: boolean;
}) {
  const { cfg: cfgOverride, to, verbose = false, sessionId, overrideBody, dryRun = false } = opts;
  const replyResolver = opts.replyResolver ?? getReplyFromConfig;
  const sender = opts.sender ?? sendMessageWhatsApp;
  const runId = newConnectionId();
  const redactedTo = redactIdentifier(to);
  const pulsecheckLogger = getChildLogger({
    module: "web-pulsecheck",
    runId,
    to: redactedTo,
  });

  const cfg = cfgOverride ?? loadConfig();

  // Resolve pulsecheck visibility settings for WhatsApp
  const visibility = resolvePulsecheckVisibility({ cfg, channel: "whatsapp" });
  const pulsecheckOkText = PULSECHECK_TOKEN;

  const maybeSendPulsecheckOk = async (): Promise<boolean> => {
    if (!visibility.showOk) {
      return false;
    }
    if (dryRun) {
      whatsappPulsecheckLog.info(`[dry-run] pulsecheck ok -> ${redactedTo}`);
      return false;
    }
    const sendResult = await sender(to, pulsecheckOkText, { verbose, cfg });
    pulsecheckLogger.info(
      {
        to: redactedTo,
        messageId: sendResult.messageId,
        chars: pulsecheckOkText.length,
        reason: "pulsecheck-ok",
      },
      "pulsecheck ok sent",
    );
    whatsappPulsecheckLog.info(`pulsecheck ok sent to ${redactedTo} (id ${sendResult.messageId})`);
    return true;
  };

  const sessionCfg = cfg.session;
  const sessionScope = sessionCfg?.scope ?? "per-sender";
  const mainKey = normalizeMainKey(sessionCfg?.mainKey);
  // Canonicalize so the written key matches what read paths produce (#29683).
  const rawSessionKey = resolveSessionKey(sessionScope, { From: to }, mainKey);
  const sessionKey = canonicalizeMainSessionAlias({
    cfg,
    agentId: resolveDefaultAgentIdFromConfig(cfg),
    sessionKey: rawSessionKey,
  });
  if (sessionId) {
    const storePath = resolveStorePath(cfg.session?.store);
    const store = loadSessionStore(storePath);
    const current = store[sessionKey] ?? {};
    store[sessionKey] = {
      ...current,
      sessionId,
      updatedAt: Date.now(),
    };
    await updateSessionStore(storePath, (nextStore) => {
      const nextCurrent = nextStore[sessionKey] ?? current;
      nextStore[sessionKey] = {
        ...nextCurrent,
        sessionId,
        updatedAt: Date.now(),
      };
    });
  }
  const sessionSnapshot = getSessionSnapshot(cfg, to, true, { sessionKey });
  if (verbose) {
    pulsecheckLogger.info(
      {
        to: redactedTo,
        sessionKey: sessionSnapshot.key,
        sessionId: sessionId ?? sessionSnapshot.entry?.sessionId ?? null,
        sessionFresh: sessionSnapshot.fresh,
        resetMode: sessionSnapshot.resetPolicy.mode,
        resetAtHour: sessionSnapshot.resetPolicy.atHour,
        idleMinutes: sessionSnapshot.resetPolicy.idleMinutes ?? null,
        dailyResetAt: sessionSnapshot.dailyResetAt ?? null,
        idleExpiresAt: sessionSnapshot.idleExpiresAt ?? null,
      },
      "pulsecheck session snapshot",
    );
  }

  if (overrideBody && overrideBody.trim().length === 0) {
    throw new Error("Override body must be non-empty when provided.");
  }

  try {
    if (overrideBody) {
      if (dryRun) {
        whatsappPulsecheckLog.info(
          `[dry-run] web send -> ${redactedTo} (${overrideBody.trim().length} chars, manual message)`,
        );
        return;
      }
      const sendResult = await sender(to, overrideBody, { verbose, cfg });
      emitPulsecheckEvent({
        status: "sent",
        to,
        preview: overrideBody.slice(0, 160),
        hasMedia: false,
        channel: "whatsapp",
        indicatorType: visibility.useIndicator ? resolveIndicatorType("sent") : undefined,
      });
      pulsecheckLogger.info(
        {
          to: redactedTo,
          messageId: sendResult.messageId,
          chars: overrideBody.length,
          reason: "manual-message",
        },
        "manual pulsecheck message sent",
      );
      whatsappPulsecheckLog.info(
        `manual pulsecheck sent to ${redactedTo} (id ${sendResult.messageId})`,
      );
      return;
    }

    if (!visibility.showAlerts && !visibility.showOk && !visibility.useIndicator) {
      pulsecheckLogger.info({ to: redactedTo, reason: "alerts-disabled" }, "pulsecheck skipped");
      emitPulsecheckEvent({
        status: "skipped",
        to,
        reason: "alerts-disabled",
        channel: "whatsapp",
      });
      return;
    }

    const replyResult = await replyResolver(
      {
        Body: appendCronStyleCurrentTimeLine(
          resolvePulsecheckPrompt(cfg.agents?.defaults?.pulsecheck?.prompt),
          cfg,
          Date.now(),
        ),
        From: to,
        To: to,
        MessageSid: sessionId ?? sessionSnapshot.entry?.sessionId,
      },
      { isPulsecheck: true },
      cfg,
    );
    const replyPayload = resolvePulsecheckReplyPayload(replyResult);

    if (!replyPayload || !hasOutboundReplyContent(replyPayload)) {
      pulsecheckLogger.info(
        {
          to: redactedTo,
          reason: "empty-reply",
          sessionId: sessionSnapshot.entry?.sessionId ?? null,
        },
        "pulsecheck skipped",
      );
      const okSent = await maybeSendPulsecheckOk();
      emitPulsecheckEvent({
        status: "ok-empty",
        to,
        channel: "whatsapp",
        silent: !okSent,
        indicatorType: visibility.useIndicator ? resolveIndicatorType("ok-empty") : undefined,
      });
      return;
    }

    const reply = resolveSendableOutboundReplyParts(replyPayload);
    const hasMedia = reply.hasMedia;
    const ackMaxChars = Math.max(
      0,
      cfg.agents?.defaults?.pulsecheck?.ackMaxChars ?? DEFAULT_PULSECHECK_ACK_MAX_CHARS,
    );
    const stripped = stripPulsecheckToken(replyPayload.text, {
      mode: "pulsecheck",
      maxAckChars: ackMaxChars,
    });
    if (stripped.shouldSkip && !hasMedia) {
      // Don't let pulsechecks keep sessions alive: restore previous updatedAt so idle expiry still works.
      const storePath = resolveStorePath(cfg.session?.store);
      const store = loadSessionStore(storePath);
      if (sessionSnapshot.entry && store[sessionSnapshot.key]) {
        store[sessionSnapshot.key].updatedAt = sessionSnapshot.entry.updatedAt;
        await updateSessionStore(storePath, (nextStore) => {
          const nextEntry = nextStore[sessionSnapshot.key];
          if (!nextEntry) {
            return;
          }
          nextStore[sessionSnapshot.key] = {
            ...nextEntry,
            updatedAt: sessionSnapshot.entry.updatedAt,
          };
        });
      }

      pulsecheckLogger.info(
        { to: redactedTo, reason: "pulsecheck-token", rawLength: replyPayload.text?.length },
        "pulsecheck skipped",
      );
      const okSent = await maybeSendPulsecheckOk();
      emitPulsecheckEvent({
        status: "ok-token",
        to,
        channel: "whatsapp",
        silent: !okSent,
        indicatorType: visibility.useIndicator ? resolveIndicatorType("ok-token") : undefined,
      });
      return;
    }

    if (hasMedia) {
      pulsecheckLogger.warn(
        { to: redactedTo },
        "pulsecheck reply contained media; sending text only",
      );
    }

    const finalText = stripped.text || reply.text;

    // Check if alerts are disabled for WhatsApp
    if (!visibility.showAlerts) {
      pulsecheckLogger.info({ to: redactedTo, reason: "alerts-disabled" }, "pulsecheck skipped");
      emitPulsecheckEvent({
        status: "skipped",
        to,
        reason: "alerts-disabled",
        preview: finalText.slice(0, 200),
        channel: "whatsapp",
        hasMedia,
        indicatorType: visibility.useIndicator ? resolveIndicatorType("sent") : undefined,
      });
      return;
    }

    if (dryRun) {
      pulsecheckLogger.info(
        { to: redactedTo, reason: "dry-run", chars: finalText.length },
        "pulsecheck dry-run",
      );
      whatsappPulsecheckLog.info(
        `[dry-run] pulsecheck -> ${redactedTo} (${finalText.length} chars)`,
      );
      return;
    }

    const sendResult = await sender(to, finalText, { verbose, cfg });
    emitPulsecheckEvent({
      status: "sent",
      to,
      preview: finalText.slice(0, 160),
      hasMedia,
      channel: "whatsapp",
      indicatorType: visibility.useIndicator ? resolveIndicatorType("sent") : undefined,
    });
    pulsecheckLogger.info(
      {
        to: redactedTo,
        messageId: sendResult.messageId,
        chars: finalText.length,
      },
      "pulsecheck sent",
    );
    whatsappPulsecheckLog.info(`pulsecheck alert sent to ${redactedTo}`);
  } catch (err) {
    const reason = formatError(err);
    pulsecheckLogger.warn({ to: redactedTo, error: reason }, "pulsecheck failed");
    whatsappPulsecheckLog.warn(`pulsecheck failed (${reason})`);
    emitPulsecheckEvent({
      status: "failed",
      to,
      reason,
      channel: "whatsapp",
      indicatorType: visibility.useIndicator ? resolveIndicatorType("failed") : undefined,
    });
    throw err;
  }
}

export function resolvePulsecheckRecipients(
  cfg: ReturnType<typeof loadConfig>,
  opts: { to?: string; all?: boolean; accountId?: string } = {},
) {
  return resolveWhatsAppPulsecheckRecipients(cfg, opts);
}
