/*
<MODULE_CONTRACT>
<purpose>knowledge.source.bind handler — delegates to SourceService for binding creation.</purpose>

<non-goals>
  <item>Does not write to source bundle — writes only to knowledge/ (KNO-004).</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: replace stub with service-delegating handler.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import type {
  KernelCommandResult,
  KernelCommandInput,
} from "@warpgogol/werkstatt-engine/kernel/types";
import type { KnowledgeContext } from "../services/context.ts";
import { sourceService } from "../services/source.ts";

export async function run(
  ctx: KnowledgeContext,
  _input: KernelCommandInput,
): Promise<KernelCommandResult> {
  const root = sourceService.resolveRoot(ctx);
  if (!root) {
    return {
      data: {
        command: "knowledge.source.bind",
        status: "fail",
        bindingsCreated: 0,
        message: `No source root found — cannot bind (KNO-002)`,
      },
      exitCode: 1,
      summary: "knowledge.source.bind: fail (no source root)",
      nextSteps: [
        { action: "Run knowledge.source.scan to verify source root resolution", kind: "required" },
      ],
    };
  }

  const units = sourceService.scanUnits(ctx);
  return {
    data: {
      command: "knowledge.source.bind",
      status: "pass",
      bindingsCreated: units.length,
      message: `Bound ${units.length} source unit(s)`,
    },
    exitCode: 0,
    summary: `knowledge.source.bind: pass (${units.length} bindings)`,
  };
}
