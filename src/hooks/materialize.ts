/*
<MODULE_CONTRACT>
<purpose>hooks.materialize — compiles verified canonical knowledge into materialized dataset.</purpose>


<non-goals>
  <item>Does not write canonical data — writes only .generated/ outputs.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: rewrite via runHook calling materializerService directly.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";
import { runHook } from "./run-hook.ts";
import { materializerService } from "../services/materializer.ts";

export async function runKnowledgeMaterializeHook(ctx: PluginHookContext): Promise<HookResult> {
  return runHook("materialize", ctx, async (kctx) => {
    const result = materializerService.materialize(kctx);
    return { success: true, data: result };
  });
}
