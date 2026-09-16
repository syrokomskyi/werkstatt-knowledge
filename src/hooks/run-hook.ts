/*
<MODULE_CONTRACT>
<purpose>runHook — shared hook runner that calls services directly and wraps results.</purpose>


<non-goals>
  <item>Does not route through kernel command execution — calls services directly.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial runHook helper for service-delegating hooks.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
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
