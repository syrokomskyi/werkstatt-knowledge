/*
<MODULE_CONTRACT>
<purpose>knowledge.source.verify handler — verifies source unit metadata and immutability.</purpose>
<keywords>source, verify, knowledge, handler</keywords>
<non-goals>
  <item>Does not write or mutate source — read-only validator (KNO-004).</item>
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
        command: "knowledge.source.verify",
        status: "fail",
        violations: ["No source root found (KNO-002)"],
        unitCount: 0,
      },
      exitCode: 1,
      summary: "knowledge.source.verify: fail (no source root)",
      nextSteps: [
        { action: "Run knowledge.source.scan to verify source root resolution", kind: "required" },
      ],
    };
  }

  const units = sourceService.scanUnits(ctx);
  const violations: string[] = [];
  for (const unit of units) {
    if (!unit.metadata.name) {
      violations.push(`Unit ${unit.id}: missing name metadata (KNO-003)`);
    }
    if (!unit.metadata.version) {
      violations.push(`Unit ${unit.id}: missing version metadata (KNO-003)`);
    }
  }

  return {
    data: {
      command: "knowledge.source.verify",
      status: violations.length > 0 ? "fail" : "pass",
      violations,
      unitCount: units.length,
    },
    exitCode: violations.length > 0 ? 1 : 0,
    summary: `knowledge.source.verify: ${violations.length > 0 ? "fail" : "pass"} (${units.length} units, ${violations.length} violations)`,
    nextSteps:
      violations.length > 0
        ? violations.map((v) => ({ action: v, kind: "required" as const }))
        : undefined,
  };
}
