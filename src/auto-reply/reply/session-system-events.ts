import { resolveUserTimezone } from "../../agents/date-time.js";
import type { CarlitoConfig } from "../../config/types.carlito.js";
import { buildChannelSummary } from "../../infra/channel-summary.js";
import {
  formatUtcTimestamp,
  formatZonedTimestamp,
  resolveTimezone,
} from "../../infra/format-time/format-datetime.ts";
import { drainSystemEventEntries } from "../../infra/system-events.js";
import {
  normalizeLowercaseStringOrEmpty,
  normalizeOptionalString,
} from "../../shared/string-coerce.js";

/** Drain queued system events, format as `System:` lines, return the block (or undefined). */
export async function drainFormattedSystemEvents(params: {
  cfg: CarlitoConfig;
  sessionKey: string;
  isMainSession: boolean;
  isNewSession: boolean;
}): Promise<string | undefined> {
  const compactSystemEvent = (line: string): string | null => {
    const trimmed = line.trim();
    if (!trimmed) {
      return null;
    }
    const lower = normalizeLowercaseStringOrEmpty(trimmed);
    if (lower.includes("reason periodic")) {
      return null;
    }
    // Filter out the actual pulsecheck prompt, but not cron jobs that mention "pulsecheck".
    // The pulsecheck prompt starts with "Read PULSECHECK.md" - cron payloads won't match this.
    if (lower.startsWith("read pulsecheck.md")) {
      return null;
    }
    if (lower.includes("pulsecheck poll") || lower.includes("pulsecheck wake")) {
      return null;
    }
    if (trimmed.startsWith("Node:")) {
      return trimmed.replace(/ · last input [^·]+/i, "").trim();
    }
    return trimmed;
  };

  const resolveSystemEventTimezone = (cfg: CarlitoConfig) => {
    const raw = normalizeOptionalString(cfg.agents?.defaults?.envelopeTimezone);
    if (!raw) {
      return { mode: "local" as const };
    }
    const lowered = normalizeLowercaseStringOrEmpty(raw);
    if (lowered === "utc" || lowered === "gmt") {
      return { mode: "utc" as const };
    }
    if (lowered === "local" || lowered === "host") {
      return { mode: "local" as const };
    }
    if (lowered === "user") {
      return {
        mode: "iana" as const,
        timeZone: resolveUserTimezone(cfg.agents?.defaults?.userTimezone),
      };
    }
    const explicit = resolveTimezone(raw);
    return explicit ? { mode: "iana" as const, timeZone: explicit } : { mode: "local" as const };
  };

  const formatSystemEventTimestamp = (ts: number, cfg: CarlitoConfig) => {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) {
      return "unknown-time";
    }
    const zone = resolveSystemEventTimezone(cfg);
    if (zone.mode === "utc") {
      return formatUtcTimestamp(date, { displaySeconds: true });
    }
    if (zone.mode === "local") {
      return formatZonedTimestamp(date, { displaySeconds: true }) ?? "unknown-time";
    }
    return (
      formatZonedTimestamp(date, { timeZone: zone.timeZone, displaySeconds: true }) ??
      "unknown-time"
    );
  };

  const systemLines: string[] = [];
  const queued = drainSystemEventEntries(params.sessionKey);
  systemLines.push(
    ...queued.flatMap((event) => {
      const compacted = compactSystemEvent(event.text);
      if (!compacted) {
        return [];
      }
      const prefix = event.trusted === false ? "System (untrusted)" : "System";
      const timestamp = `[${formatSystemEventTimestamp(event.ts, params.cfg)}]`;
      return compacted
        .split("\n")
        .map((subline, index) => `${prefix}: ${index === 0 ? `${timestamp} ` : ""}${subline}`);
    }),
  );
  if (params.isMainSession && params.isNewSession) {
    const summary = await buildChannelSummary(params.cfg);
    if (summary.length > 0) {
      systemLines.unshift(
        ...summary.flatMap((line) => line.split("\n").map((subline) => `System: ${subline}`)),
      );
    }
  }
  if (systemLines.length === 0) {
    return undefined;
  }

  // Each sub-line gets its own prefix so continuation lines can't be mistaken
  // for regular user content.
  return systemLines.join("\n");
}
