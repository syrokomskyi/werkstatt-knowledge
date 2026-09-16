/*
<MODULE_CONTRACT>
<purpose>knowledge.source.scan handler — delegates to SourceService.scanUnits.</purpose>
<keywords>source, scan, knowledge, handler</keywords>
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
  const root = sourceService.resolveRoot(ctx);
  if (!root) {
    return {
      data: {
        command: "knowledge.source.scan",
        status: "fail",
        sourceRoot: null,
        sourceUnits: [],
        message: `No source root found — expected ../<kb-id>-source sibling directory (KNO-002)`,
      },
      exitCode: 1,
      summary: "knowledge.source.scan: fail (no source root)",
      nextSteps: [
        {
          action: "Create a sibling directory named <workspace-id>-source with source units",
          kind: "required",
        },
      ],
    };
  }

  const units = sourceService.scanUnits(ctx);
  return {
    data: {
      command: "knowledge.source.scan",
      status: "pass",
      sourceRoot: root,
      sourceUnits: units,
      message: `Scanned ${units.length} source unit(s) from ${root}`,
    },
    exitCode: 0,
    summary: `knowledge.source.scan: pass (${units.length} units)`,
  };
}
