import { resolveSendableOutboundReplyParts } from "carlito/plugin-sdk/reply-payload";
import { stripPulsecheckToken } from "../auto-reply/pulsecheck.js";

export type PulsecheckDeliveryPayload = {
  text?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
};

export function shouldSkipPulsecheckOnlyDelivery(
  payloads: PulsecheckDeliveryPayload[],
  ackMaxChars: number,
): boolean {
  if (payloads.length === 0) {
    return true;
  }
  const hasAnyMedia = payloads.some(
    (payload) => resolveSendableOutboundReplyParts(payload).hasMedia,
  );
  if (hasAnyMedia) {
    return false;
  }
  return payloads.some((payload) => {
    const result = stripPulsecheckToken(payload.text, {
      mode: "pulsecheck",
      maxAckChars: ackMaxChars,
    });
    return result.shouldSkip;
  });
}

export function shouldEnqueueCronMainSummary(params: {
  summaryText: string | undefined;
  deliveryRequested: boolean;
  delivered: boolean | undefined;
  deliveryAttempted: boolean | undefined;
  suppressMainSummary: boolean;
  isCronSystemEvent: (text: string) => boolean;
}): boolean {
  const summaryText = params.summaryText?.trim();
  return Boolean(
    summaryText &&
    params.isCronSystemEvent(summaryText) &&
    params.deliveryRequested &&
    !params.delivered &&
    params.deliveryAttempted !== true &&
    !params.suppressMainSummary,
  );
}
