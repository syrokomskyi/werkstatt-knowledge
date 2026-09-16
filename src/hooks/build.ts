/*
<MODULE_CONTRACT>
<purpose>hooks.build — builds configured projection packages from current materialization.</purpose>


<non-goals>
  <item>Does not register a second stack plugin for projection apps.</item>
  <item>Does not write canonical data.</item>
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

export async function runKnowledgeBuildHook(ctx: PluginHookContext): Promise<HookResult> {
  return runHook("build", ctx, async (kctx) => {
    const result = materializerService.projectionBuild(kctx);
    return { success: true, data: result };
  });
}
