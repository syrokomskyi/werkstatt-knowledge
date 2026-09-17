/*
<MODULE_CONTRACT>
<purpose>knowledge.candidate.validate handler — delegates staging/laboratory validation to VerificationService.verify (candidates scope).</purpose>

<non-goals>
  <item>Does not implement check logic — delegates to VerificationService.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1108: initial handler — candidates scope; warnings (promotion-blockers) do not sink exitCode.</item>
</CHANGE_SUMMARY>
*/

import type {
  KernelCommandResult,
  KernelCommandInput,
} from "@warpgogol/werkstatt-engine/kernel/types";
import type { KnowledgeContext } from "../services/context.ts";
import { verificationService } from "../services/verification.ts";

export async function run(
  ctx: KnowledgeContext,
  _input: KernelCommandInput,
): Promise<KernelCommandResult> {
  const violations = await verificationService.verify(ctx, "candidates");
  const errors = violations.filter((v) => v.severity === "error");
  const warnings = violations.length - errors.length;
  const failed = errors.length > 0;
  return {
    data: {
      command: "knowledge.candidate.validate",
      status: failed ? "fail" : "pass",
      diagnostics: violations.map((v) => ({
        ruleId: v.ruleId,
        severity: v.severity,
        message: v.message,
        ...(v.path ? { file: v.path } : {}),
      })),
      violations: violations.map((v) => v.message),
      counts: { errors: errors.length, warnings },
      message: failed
        ? `${errors.length} error(s), ${warnings} promotion-blocker(s)`
        : `candidates valid (${warnings} promotion-blocker warning(s))`,
    },
    exitCode: failed ? 1 : 0,
    summary: `[knowledge.candidate.validate] ${failed ? `fail (${errors.length} errors)` : "pass"}`,
    ...(failed
      ? {
          nextSteps: [
            {
              action: "Fix error-severity violations in staging/ or laboratory/ before promotion",
              kind: "required" as const,
            },
          ],
        }
      : {}),
  };
}
