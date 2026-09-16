/*
<MODULE_CONTRACT>
<purpose>knowledge.source.status handler — delegates to SourceService.compareBindings.</purpose>

<non-goals>
  <item>Does not write or mutate source — read-only.</item>
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
  const drift = sourceService.compareBindings(ctx);
  const driftDetected = drift.some((d) => d.drift);
  return {
    data: {
      command: "knowledge.source.status",
      status: driftDetected ? "fail" : "pass",
      driftDetected,
      bindings: drift.length,
      message: driftDetected
        ? `${drift.filter((d) => d.drift).length} binding(s) drifted`
        : `All ${drift.length} binding(s) current`,
    },
    exitCode: driftDetected ? 1 : 0,
    summary: `knowledge.source.status: ${driftDetected ? "fail (drift)" : "pass"}`,
  };
}
