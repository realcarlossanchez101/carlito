import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";
import { resolveStateDir } from "carlito/plugin-sdk/state-paths";
import {
  resolveMatrixCredentialsDir,
  resolveMatrixCredentialsFilename,
} from "./src/storage-paths.js";

type MatrixAuthPresenceParams =
  | {
      cfg: CarlitoConfig;
      env?: NodeJS.ProcessEnv;
    }
  | CarlitoConfig;

function listMatrixCredentialPaths(
  _cfg: CarlitoConfig,
  env: NodeJS.ProcessEnv = process.env,
): readonly string[] {
  const credentialsDir = resolveMatrixCredentialsDir(resolveStateDir(env, os.homedir));
  const paths = new Set<string>([
    resolveMatrixCredentialsFilename(),
    resolveMatrixCredentialsFilename("default"),
  ]);

  try {
    const entries = fs.readdirSync(credentialsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && /^credentials(?:-[a-z0-9._-]+)?\.json$/i.test(entry.name)) {
        paths.add(entry.name);
      }
    }
  } catch {
    // Missing credentials directories mean no persisted Matrix auth state.
  }

  return [...paths].map((filename) => path.join(credentialsDir, filename));
}

export function hasAnyMatrixAuth(
  params: MatrixAuthPresenceParams,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const cfg = params && typeof params === "object" && "cfg" in params ? params.cfg : params;
  const resolvedEnv =
    params && typeof params === "object" && "cfg" in params ? (params.env ?? env) : env;
  return listMatrixCredentialPaths(cfg, resolvedEnv).some((filePath) => {
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  });
}
