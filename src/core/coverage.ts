/*
<MODULE_CONTRACT>
<purpose>knowledge.coverage handler — delegates coverage checks to CoverageService.checkCoverage (KNO-018).</purpose>

<non-goals>
  <item>Does not implement check logic — delegates to CoverageService.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1108: initial handler — maps violations to KernelCommandResult.</item>
</CHANGE_SUMMARY>
*/

import type {
  KernelCommandResult,
  KernelCommandInput,
} from "@warpgogol/werkstatt-engine/kernel/types";
import type { KnowledgeContext } from "../services/context.ts";
import { coverageService } from "../services/coverage.ts";

export async function run(
  ctx: KnowledgeContext,
  _input: KernelCommandInput,
): Promise<KernelCommandResult> {
  const violations = await coverageService.checkCoverage(ctx);
  const errors = violations.filter((v) => v.severity === "error");
  const failed = errors.length > 0;
  return {
    data: {
      command: "knowledge.coverage",
      status: failed ? "fail" : "pass",
      diagnostics: violations.map((v) => ({
        ruleId: v.ruleId,
        severity: v.severity,
        message: v.message,
        ...(v.path ? { file: v.path } : {}),
      })),
      violations: violations.map((v) => v.message),
      message: failed
        ? `${errors.length} coverage violation(s)`
        : "coverage claims satisfy denominator/verifier rules",
    },
    exitCode: failed ? 1 : 0,
    summary: `[knowledge.coverage] ${failed ? `fail (${errors.length} errors)` : "pass"}`,
    ...(failed
      ? {
          nextSteps: [
            {
              action: "Fix KNO-018 violations in knowledge/coverage/*.yaml",
              kind: "required" as const,
            },
          ],
        }
      : {}),
  };
}
