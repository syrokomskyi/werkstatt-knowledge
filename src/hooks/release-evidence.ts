/*
<MODULE_CONTRACT>
<purpose>hooks.releaseEvidence — emits knowledge-specific evidence packet.</purpose>


<non-goals>
  <item>Does not verify hashes — that is the integrity module's job.</item>
  <item>Does not modify canonical data.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: rewrite via runHook calling releaseEvidenceService directly.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
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
