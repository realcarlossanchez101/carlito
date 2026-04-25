import type { StreamFn } from "@mariozechner/pi-agent-core";
import { streamWithPayloadPatch } from "./pi-embedded-runner/stream-payload-utils.js";

const OPENCLAW_PATTERN = /openclaw/gi;
const OPENCLAW_TEST_PATTERN = /openclaw/i;

export function replaceOpenclawPreservingCase(input: string): string {
  if (!input.includes("o") && !input.includes("O")) {
    return input;
  }
  return input.replace(OPENCLAW_PATTERN, (match) => {
    if (match === match.toUpperCase()) {
      return "CARLITO";
    }
    if (match[0] === match[0].toUpperCase()) {
      return "Carlito";
    }
    return "carlito";
  });
}

export function rewriteOpenclawInPayload(payload: unknown): void {
  if (Array.isArray(payload)) {
    for (let i = 0; i < payload.length; i++) {
      const value = payload[i];
      if (typeof value === "string") {
        payload[i] = replaceOpenclawPreservingCase(value);
      } else if (value !== null && typeof value === "object") {
        rewriteOpenclawInPayload(value);
      }
    }
    return;
  }
  if (payload !== null && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const rewrittenKey = OPENCLAW_TEST_PATTERN.test(key)
        ? replaceOpenclawPreservingCase(key)
        : key;
      if (rewrittenKey !== key) {
        delete obj[key];
      }
      if (typeof value === "string") {
        obj[rewrittenKey] = replaceOpenclawPreservingCase(value);
      } else if (value !== null && typeof value === "object") {
        rewriteOpenclawInPayload(value);
        obj[rewrittenKey] = value;
      } else if (rewrittenKey !== key) {
        obj[rewrittenKey] = value;
      }
    }
  }
}

export function wrapStreamFnWithCarlitoRewriter(underlying: StreamFn): StreamFn {
  return (model, context, options) =>
    streamWithPayloadPatch(underlying, model, context, options, (payload) => {
      rewriteOpenclawInPayload(payload);
    });
}
