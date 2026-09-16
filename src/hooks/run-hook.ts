/*
<MODULE_CONTRACT>
<purpose>runHook — shared hook runner that calls services directly and wraps results.</purpose>
<keywords>hook, runner, knowledge, service</keywords>
<responsibilities>
  <item>Resolves KnowledgeContext from PluginHookContext.</item>
  <item>Calls a service function and maps result to HookResult.</item>
  <item>Catches errors and returns HookResult with success: false.</item>
</responsibilities>
<non-goals>
  <item>Does not route through kernel command execution — calls services directly.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial runHook helper for service-delegating hooks.</item>
</CHANGE_SUMMARY>
*/

import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";
import { resolveKnowledgeContext } from "../services/context.ts";
import type { KnowledgeContext } from "../services/context.ts";

export async function runHook(
  label: string,
  ctx: PluginHookContext,
  fn: (kctx: KnowledgeContext) => Promise<{ success: boolean; data?: unknown; errors?: string[] }>,
): Promise<HookResult> {
  const projectRoot = ctx.workpiecePath ?? ctx.workspaceRoot;
  const kctx = resolveKnowledgeContext(projectRoot, {
    info: (msg: string) => ctx.logger.info(msg),
    warn: (msg: string) => ctx.logger.warn(msg),
    error: (msg: string) => ctx.logger.error(msg),
  });

  try {
    const result = await fn(kctx);
    if (!result.success) {
      return {
        success: false,
        errors: result.errors ?? [`${label} failed`],
      };
    }
    ctx.logger.info(`${label}: ${result.data ? JSON.stringify(result.data) : "ok"}`);
    return { success: true, data: result.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx.logger.error(`${label} failed: ${message}`);
    return {
      success: false,
      errors: [`${label} failed: ${message}`],
    };
  }
}
