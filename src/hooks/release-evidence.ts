/*
<MODULE_CONTRACT>
<purpose>hooks.releaseEvidence — emits knowledge-specific evidence packet.</purpose>
<keywords>hook, release, evidence, knowledge</keywords>
<responsibilities>
  <item>Calls releaseEvidenceService.produceEvidence via runHook.</item>
  <item>Returns evidence with dataset id, model version, canonical hash, counts.</item>
</responsibilities>
<non-goals>
  <item>Does not verify hashes — that is the integrity module's job.</item>
  <item>Does not modify canonical data.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: rewrite via runHook calling releaseEvidenceService directly.</item>
</CHANGE_SUMMARY>
*/

import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";
import { runHook } from "./run-hook.ts";
import { releaseEvidenceService } from "../services/release-evidence.ts";

export async function runKnowledgeReleaseEvidenceHook(ctx: PluginHookContext): Promise<HookResult> {
  return runHook("release-evidence", ctx, async (kctx) => {
    const result = releaseEvidenceService.produceEvidence(kctx);
    return { success: true, data: result };
  });
}
