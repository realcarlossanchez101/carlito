import { randomUUID } from "node:crypto";
import type { Agent } from "node:http";
import process from "node:process";
import { HttpsProxyAgent } from "https-proxy-agent";
import {
  resolveDebugProxyBlobDir,
  resolveDebugProxyCertDir,
  resolveDebugProxyDbPath,
} from "./paths.js";

export const CARLITO_DEBUG_PROXY_ENABLED = "CARLITO_DEBUG_PROXY_ENABLED";
export const CARLITO_DEBUG_PROXY_URL = "CARLITO_DEBUG_PROXY_URL";
export const CARLITO_DEBUG_PROXY_DB_PATH = "CARLITO_DEBUG_PROXY_DB_PATH";
export const CARLITO_DEBUG_PROXY_BLOB_DIR = "CARLITO_DEBUG_PROXY_BLOB_DIR";
export const CARLITO_DEBUG_PROXY_CERT_DIR = "CARLITO_DEBUG_PROXY_CERT_DIR";
export const CARLITO_DEBUG_PROXY_SESSION_ID = "CARLITO_DEBUG_PROXY_SESSION_ID";
export const CARLITO_DEBUG_PROXY_REQUIRE = "CARLITO_DEBUG_PROXY_REQUIRE";

export type DebugProxySettings = {
  enabled: boolean;
  required: boolean;
  proxyUrl?: string;
  dbPath: string;
  blobDir: string;
  certDir: string;
  sessionId: string;
  sourceProcess: string;
};

let cachedImplicitSessionId: string | undefined;

function isTruthy(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function resolveDebugProxySettings(
  env: NodeJS.ProcessEnv = process.env,
): DebugProxySettings {
  const enabled = isTruthy(env[CARLITO_DEBUG_PROXY_ENABLED]);
  const explicitSessionId = env[CARLITO_DEBUG_PROXY_SESSION_ID]?.trim() || undefined;
  const sessionId = explicitSessionId ?? (cachedImplicitSessionId ??= randomUUID());
  return {
    enabled,
    required: isTruthy(env[CARLITO_DEBUG_PROXY_REQUIRE]),
    proxyUrl: env[CARLITO_DEBUG_PROXY_URL]?.trim() || undefined,
    dbPath: env[CARLITO_DEBUG_PROXY_DB_PATH]?.trim() || resolveDebugProxyDbPath(env),
    blobDir: env[CARLITO_DEBUG_PROXY_BLOB_DIR]?.trim() || resolveDebugProxyBlobDir(env),
    certDir: env[CARLITO_DEBUG_PROXY_CERT_DIR]?.trim() || resolveDebugProxyCertDir(env),
    sessionId,
    sourceProcess: "carlito",
  };
}

export function applyDebugProxyEnv(
  env: NodeJS.ProcessEnv,
  params: {
    proxyUrl: string;
    sessionId: string;
    dbPath?: string;
    blobDir?: string;
    certDir?: string;
  },
): NodeJS.ProcessEnv {
  return {
    ...env,
    [CARLITO_DEBUG_PROXY_ENABLED]: "1",
    [CARLITO_DEBUG_PROXY_REQUIRE]: "1",
    [CARLITO_DEBUG_PROXY_URL]: params.proxyUrl,
    [CARLITO_DEBUG_PROXY_DB_PATH]: params.dbPath ?? resolveDebugProxyDbPath(env),
    [CARLITO_DEBUG_PROXY_BLOB_DIR]: params.blobDir ?? resolveDebugProxyBlobDir(env),
    [CARLITO_DEBUG_PROXY_CERT_DIR]: params.certDir ?? resolveDebugProxyCertDir(env),
    [CARLITO_DEBUG_PROXY_SESSION_ID]: params.sessionId,
    HTTP_PROXY: params.proxyUrl,
    HTTPS_PROXY: params.proxyUrl,
    ALL_PROXY: params.proxyUrl,
  };
}

export function createDebugProxyWebSocketAgent(settings: DebugProxySettings): Agent | undefined {
  if (!settings.enabled || !settings.proxyUrl) {
    return undefined;
  }
  return new HttpsProxyAgent(settings.proxyUrl);
}

export function resolveEffectiveDebugProxyUrl(configuredProxyUrl?: string): string | undefined {
  const explicit = configuredProxyUrl?.trim();
  if (explicit) {
    return explicit;
  }
  const settings = resolveDebugProxySettings();
  return settings.enabled ? settings.proxyUrl : undefined;
}
