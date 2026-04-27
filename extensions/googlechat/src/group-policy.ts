import { resolveChannelGroupRequireMention } from "carlito/plugin-sdk/channel-policy";
import type { CarlitoConfig } from "carlito/plugin-sdk/core";

type GoogleChatGroupContext = {
  cfg: CarlitoConfig;
  accountId?: string | null;
  groupId?: string | null;
};

export function resolveGoogleChatGroupRequireMention(params: GoogleChatGroupContext): boolean {
  return resolveChannelGroupRequireMention({
    cfg: params.cfg,
    channel: "googlechat",
    groupId: params.groupId,
    accountId: params.accountId,
  });
}
