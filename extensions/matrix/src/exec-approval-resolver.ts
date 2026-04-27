import { resolveApprovalOverGateway } from "carlito/plugin-sdk/approval-gateway-runtime";
import type { ExecApprovalReplyDecision } from "carlito/plugin-sdk/approval-runtime";
import type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";
import { isApprovalNotFoundError } from "carlito/plugin-sdk/error-runtime";

export { isApprovalNotFoundError };

export async function resolveMatrixApproval(params: {
  cfg: CarlitoConfig;
  approvalId: string;
  decision: ExecApprovalReplyDecision;
  senderId?: string | null;
  gatewayUrl?: string;
}): Promise<void> {
  await resolveApprovalOverGateway({
    cfg: params.cfg,
    approvalId: params.approvalId,
    decision: params.decision,
    senderId: params.senderId,
    gatewayUrl: params.gatewayUrl,
    clientDisplayName: `Matrix approval (${params.senderId?.trim() || "unknown"})`,
  });
}
