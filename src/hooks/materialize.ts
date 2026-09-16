/*
<MODULE_CONTRACT>
<purpose>hooks.materialize — compiles verified canonical knowledge into materialized dataset.</purpose>
<keywords>hook, materialize, knowledge</keywords>
<responsibilities>
  <item>Calls materializerService.materialize via runHook.</item>
  <item>Produces materialization manifest with canonical hash and model version.</item>
</responsibilities>
<non-goals>
  <item>Does not write canonical data — writes only .generated/ outputs.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: rewrite via runHook calling materializerService directly.</item>
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
