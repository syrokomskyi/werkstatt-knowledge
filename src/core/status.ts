/*
<MODULE_CONTRACT>
<purpose>knowledge.status handler — delegates status reporting to VerificationService.status.</purpose>

<non-goals>
  <item>Does not validate — reports only; always exitCode 0.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1108: initial handler — KnowledgeStatus report.</item>
</CHANGE_SUMMARY>
*/

import type {
  KernelCommandResult,
  KernelCommandInput,
} from "@warpgogol/werkstatt-engine/kernel/types";
import type { KnowledgeContext } from "../services/context.ts";
import { verificationService } from "../services/verification.ts";

export async function run(
  ctx: KnowledgeContext,
  _input: KernelCommandInput,
): Promise<KernelCommandResult> {
  const status = await verificationService.status(ctx);
  return {
    data: {
      command: "knowledge.status",
      status: "pass",
      ...status,
      message: `${status.layerCounts.knowledge ?? 0} canonical record(s), ${status.pendingCandidates} pending candidate(s), ${status.sourceDrift.filter((d) => d.drift).length} drifted binding(s)`,
    },
    exitCode: 0,
    summary: `[knowledge.status] pass`,
  };
}
