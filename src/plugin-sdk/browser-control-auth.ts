import type { CarlitoConfig } from "../config/types.carlito.js";
import { loadBundledPluginPublicSurfaceModuleSync } from "./facade-loader.js";

export type BrowserControlAuth = {
  token?: string;
  password?: string;
};

type EnsureBrowserControlAuthParams = {
  cfg: CarlitoConfig;
  env?: NodeJS.ProcessEnv;
};

type EnsureBrowserControlAuthResult = {
  auth: BrowserControlAuth;
  generatedToken?: string;
};

type BrowserControlAuthSurface = {
  resolveBrowserControlAuth: (cfg?: CarlitoConfig, env?: NodeJS.ProcessEnv) => BrowserControlAuth;
  shouldAutoGenerateBrowserAuth: (env: NodeJS.ProcessEnv) => boolean;
  ensureBrowserControlAuth: (
    params: EnsureBrowserControlAuthParams,
  ) => Promise<EnsureBrowserControlAuthResult>;
};

let cachedBrowserControlAuthSurface: BrowserControlAuthSurface | undefined;

function loadBrowserControlAuthSurface(): BrowserControlAuthSurface {
  cachedBrowserControlAuthSurface ??=
    loadBundledPluginPublicSurfaceModuleSync<BrowserControlAuthSurface>({
      dirName: "browser",
      artifactBasename: "browser-control-auth.js",
    });
  return cachedBrowserControlAuthSurface;
}

export function resolveBrowserControlAuth(
  cfg?: CarlitoConfig,
  env: NodeJS.ProcessEnv = process.env,
): BrowserControlAuth {
  return loadBrowserControlAuthSurface().resolveBrowserControlAuth(cfg, env);
}

export function shouldAutoGenerateBrowserAuth(env: NodeJS.ProcessEnv): boolean {
  return loadBrowserControlAuthSurface().shouldAutoGenerateBrowserAuth(env);
}

export async function ensureBrowserControlAuth(
  params: EnsureBrowserControlAuthParams,
): Promise<EnsureBrowserControlAuthResult> {
  return await loadBrowserControlAuthSurface().ensureBrowserControlAuth(params);
}
