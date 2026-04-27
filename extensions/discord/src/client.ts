import { RequestClient } from "@buape/carbon";
import { requireRuntimeConfig, type CarlitoConfig } from "carlito/plugin-sdk/config-runtime";
import type { RetryConfig, RetryRunner } from "carlito/plugin-sdk/retry-runtime";
import { normalizeAccountId } from "carlito/plugin-sdk/routing";
import type { RuntimeEnv } from "carlito/plugin-sdk/runtime-env";
import { normalizeOptionalString } from "carlito/plugin-sdk/text-runtime";
import {
  mergeDiscordAccountConfig,
  resolveDiscordAccount,
  type ResolvedDiscordAccount,
} from "./accounts.js";
import { resolveDiscordProxyFetchForAccount } from "./proxy-fetch.js";
import { createDiscordRequestClient } from "./proxy-request-client.js";
import { createDiscordRetryRunner } from "./retry.js";
import type { DiscordRuntimeAccountContext } from "./send.types.js";
import { normalizeDiscordToken } from "./token.js";

export type DiscordClientOpts = {
  cfg?: CarlitoConfig;
  token?: string;
  accountId?: string;
  rest?: RequestClient;
  retry?: RetryConfig;
  verbose?: boolean;
};

export function createDiscordRuntimeAccountContext(params: {
  cfg: CarlitoConfig;
  accountId: string;
}): DiscordRuntimeAccountContext {
  return {
    cfg: params.cfg,
    accountId: normalizeAccountId(params.accountId),
  };
}

export function resolveDiscordClientAccountContext(
  opts: Pick<DiscordClientOpts, "cfg" | "accountId">,
  cfg?: CarlitoConfig,
  runtime?: Pick<RuntimeEnv, "error">,
) {
  const config = opts.cfg ?? cfg;
  if (!config) {
    throw new Error(
      "Discord client requires a resolved runtime config. Load and resolve config at the command or gateway boundary, then pass cfg through the runtime path.",
    );
  }
  const resolvedCfg = requireRuntimeConfig(config, "Discord client");
  const account = resolveAccountWithoutToken({
    cfg: resolvedCfg,
    accountId: opts.accountId,
  });
  return {
    cfg: resolvedCfg,
    account,
    proxyFetch: resolveDiscordProxyFetchForAccount(account, resolvedCfg, runtime),
  };
}

function resolveToken(params: { accountId: string; fallbackToken?: string }) {
  const fallback = normalizeDiscordToken(params.fallbackToken, "channels.discord.token");
  if (!fallback) {
    throw new Error(
      `Discord bot token missing for account "${params.accountId}" (set discord.accounts.${params.accountId}.token or DISCORD_BOT_TOKEN for default).`,
    );
  }
  return fallback;
}

export function resolveDiscordProxyFetch(
  opts: Pick<DiscordClientOpts, "cfg" | "accountId">,
  cfg?: CarlitoConfig,
  runtime?: Pick<RuntimeEnv, "error">,
): typeof fetch | undefined {
  return resolveDiscordClientAccountContext(opts, cfg, runtime).proxyFetch;
}

function resolveRest(
  token: string,
  account: ResolvedDiscordAccount,
  cfg: CarlitoConfig,
  rest?: RequestClient,
  proxyFetch?: typeof fetch,
) {
  if (rest) {
    return rest;
  }
  const resolvedProxyFetch = proxyFetch ?? resolveDiscordProxyFetchForAccount(account, cfg);
  return createDiscordRequestClient(
    token,
    resolvedProxyFetch ? { fetch: resolvedProxyFetch } : undefined,
  );
}

function resolveAccountWithoutToken(params: {
  cfg: CarlitoConfig;
  accountId?: string;
}): ResolvedDiscordAccount {
  const accountId = normalizeAccountId(params.accountId);
  const merged = mergeDiscordAccountConfig(params.cfg, accountId);
  const baseEnabled = params.cfg.channels?.discord?.enabled !== false;
  const accountEnabled = merged.enabled !== false;
  return {
    accountId,
    enabled: baseEnabled && accountEnabled,
    name: normalizeOptionalString(merged.name),
    token: "",
    tokenSource: "none",
    config: merged,
  };
}

export function createDiscordRestClient(opts: DiscordClientOpts, cfg?: CarlitoConfig) {
  const explicitToken = normalizeDiscordToken(opts.token, "channels.discord.token");
  const proxyContext = resolveDiscordClientAccountContext(opts, cfg);
  const resolvedCfg = proxyContext.cfg;
  const account = explicitToken
    ? proxyContext.account
    : resolveDiscordAccount({ cfg: resolvedCfg, accountId: opts.accountId });
  const token =
    explicitToken ??
    resolveToken({
      accountId: account.accountId,
      fallbackToken: account.token,
    });
  const rest = resolveRest(token, account, resolvedCfg, opts.rest, proxyContext.proxyFetch);
  return { token, rest, account };
}

export function createDiscordClient(
  opts: DiscordClientOpts,
  cfg?: CarlitoConfig,
): { token: string; rest: RequestClient; request: RetryRunner } {
  const { token, rest, account } = createDiscordRestClient(opts, opts.cfg ?? cfg);
  const request = createDiscordRetryRunner({
    retry: opts.retry,
    configRetry: account.config.retry,
    verbose: opts.verbose,
  });
  return { token, rest, request };
}

export function resolveDiscordRest(opts: DiscordClientOpts) {
  return createDiscordRestClient(opts, opts.cfg).rest;
}
