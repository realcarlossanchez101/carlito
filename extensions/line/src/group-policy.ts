import { resolveChannelGroupRequireMention } from "carlito/plugin-sdk/channel-policy";
import { resolveExactLineGroupConfigKey, type CarlitoConfig } from "./channel-api.js";

type LineGroupContext = {
  cfg: CarlitoConfig;
  accountId?: string | null;
  groupId?: string | null;
};

export function resolveLineGroupRequireMention(params: LineGroupContext): boolean {
  const exactGroupId = resolveExactLineGroupConfigKey({
    cfg: params.cfg,
    accountId: params.accountId,
    groupId: params.groupId,
  });
  return resolveChannelGroupRequireMention({
    cfg: params.cfg,
    channel: "line",
    groupId: exactGroupId ?? params.groupId,
    accountId: params.accountId,
  });
}
