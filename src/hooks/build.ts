/*
<MODULE_CONTRACT>
<purpose>hooks.build — builds configured projection packages from current materialization.</purpose>
<keywords>hook, build, projections, knowledge</keywords>
<responsibilities>
  <item>Calls materializerService.projectionBuild via runHook.</item>
  <item>May invoke Turborepo tasks for apps/web, apps/mcp, and other projections.</item>
</responsibilities>
<non-goals>
  <item>Does not register a second stack plugin for projection apps.</item>
  <item>Does not write canonical data.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: rewrite via runHook calling materializerService directly.</item>
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
