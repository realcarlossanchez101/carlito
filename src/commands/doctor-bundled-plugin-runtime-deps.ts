import { formatCliCommand } from "../cli/command-format.js";
import type { CarlitoConfig } from "../config/types.carlito.js";
import { resolveCarlitoPackageRootSync } from "../infra/carlito-root.js";
import {
  installBundledRuntimeDeps,
  resolveBundledRuntimeDependencyPackageInstallRoot,
  scanBundledPluginRuntimeDeps,
} from "../plugins/bundled-runtime-deps.js";
import type { RuntimeEnv } from "../runtime.js";
import { note } from "../terminal/note.js";
import type { DoctorPrompter } from "./doctor-prompter.js";

export async function maybeRepairBundledPluginRuntimeDeps(params: {
  runtime: RuntimeEnv;
  prompter: DoctorPrompter;
  config?: CarlitoConfig;
  env?: NodeJS.ProcessEnv;
  packageRoot?: string | null;
  includeConfiguredChannels?: boolean;
  installDeps?: (params: {
    installRoot: string;
    missingSpecs: string[];
    installSpecs: string[];
  }) => void;
}): Promise<void> {
  const packageRoot =
    params.packageRoot ??
    resolveCarlitoPackageRootSync({
      argv1: process.argv[1],
      cwd: process.cwd(),
      moduleUrl: import.meta.url,
    });
  if (!packageRoot) {
    return;
  }

  const { deps, missing, conflicts } = scanBundledPluginRuntimeDeps({
    packageRoot,
    config: params.config,
    includeConfiguredChannels: params.includeConfiguredChannels,
    env: params.env ?? process.env,
  });
  if (conflicts.length > 0) {
    const conflictLines = conflicts.flatMap((conflict) =>
      [`- ${conflict.name}: ${conflict.versions.join(", ")}`].concat(
        conflict.versions.flatMap((version) => {
          const pluginIds = conflict.pluginIdsByVersion.get(version) ?? [];
          return pluginIds.length > 0 ? [`  - ${version}: ${pluginIds.join(", ")}`] : [];
        }),
      ),
    );
    note(
      [
        "Bundled plugin runtime deps use conflicting versions.",
        ...conflictLines,
        `Update bundled plugins and rerun ${formatCliCommand("carlito doctor")}.`,
      ].join("\n"),
      "Bundled plugins",
    );
  }

  if (missing.length === 0) {
    return;
  }

  const missingSpecs = missing.map((dep) => `${dep.name}@${dep.version}`);
  const installSpecs = deps.map((dep) => `${dep.name}@${dep.version}`);
  note(
    [
      "Bundled plugin runtime deps are missing.",
      ...missing.map((dep) => `- ${dep.name}@${dep.version} (used by ${dep.pluginIds.join(", ")})`),
      `Fix: run ${formatCliCommand("carlito doctor --fix")} to install them.`,
    ].join("\n"),
    "Bundled plugins",
  );

  const shouldRepair =
    params.prompter.shouldRepair ||
    params.prompter.repairMode.nonInteractive ||
    (await params.prompter.confirmAutoFix({
      message: "Install missing bundled plugin runtime deps now?",
      initialValue: true,
    }));
  if (!shouldRepair) {
    return;
  }

  try {
    const installRoot = resolveBundledRuntimeDependencyPackageInstallRoot(packageRoot, {
      env: params.env ?? process.env,
    });
    const install =
      params.installDeps ??
      ((installParams) =>
        installBundledRuntimeDeps({
          installRoot: installParams.installRoot,
          missingSpecs: installParams.installSpecs,
          env: params.env ?? process.env,
        }));
    install({ installRoot, missingSpecs, installSpecs });
    note(`Installed bundled plugin deps: ${installSpecs.join(", ")}`, "Bundled plugins");
  } catch (error) {
    params.runtime.error(`Failed to install bundled plugin runtime deps: ${String(error)}`);
  }
}
