/*
<MODULE_CONTRACT>
<purpose>knowledge.source.status handler — delegates to SourceService.compareBindings.</purpose>
<keywords>source, status, drift, knowledge, handler</keywords>
<non-goals>
  <item>Does not write or mutate source — read-only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: replace stub with service-delegating handler.</item>
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
