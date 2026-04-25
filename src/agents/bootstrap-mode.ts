export type BootstrapMode = "full" | "limited" | "none";

export function resolveBootstrapMode(params: {
  bootstrapPending: boolean;
  runKind?: "default" | "pulsecheck" | "cron";
  isInteractiveUserFacing: boolean;
  isPrimaryRun: boolean;
  isCanonicalWorkspace: boolean;
  hasBootstrapFileAccess: boolean;
}): BootstrapMode {
  if (!params.bootstrapPending) {
    return "none";
  }
  if (params.runKind === "pulsecheck" || params.runKind === "cron") {
    return "none";
  }
  if (!params.isPrimaryRun || !params.isInteractiveUserFacing) {
    return "none";
  }
  if (!params.hasBootstrapFileAccess) {
    return "none";
  }
  return params.isCanonicalWorkspace ? "full" : "limited";
}
