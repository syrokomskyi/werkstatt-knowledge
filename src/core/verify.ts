/*
<MODULE_CONTRACT>
<purpose>knowledge.verify handler — delegates canonical verification to VerificationService.verify (canonical scope).</purpose>

<non-goals>
  <item>Does not implement check logic — delegates to VerificationService.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1108: initial handler — maps VerificationViolation[] to KernelCommandResult with Diagnostic data.</item>
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
  const violations = await verificationService.verify(ctx, "canonical");
  const errors = violations.filter((v) => v.severity === "error");
  const failed = errors.length > 0;
  return {
    data: {
      command: "knowledge.verify",
      status: failed ? "fail" : "pass",
      diagnostics: violations.map((v) => ({
        ruleId: v.ruleId,
        severity: v.severity,
        message: v.message,
        ...(v.path ? { file: v.path } : {}),
      })),
      violations: violations.map((v) => v.message),
      counts: { errors: errors.length, warnings: violations.length - errors.length },
      message: failed
        ? `${errors.length} error(s), ${violations.length - errors.length} warning(s)`
        : `canonical verification clean (${violations.length} warning(s))`,
    },
    exitCode: failed ? 1 : 0,
    summary: `[knowledge.verify] ${failed ? `fail (${errors.length} errors)` : "pass"}`,
    ...(failed
      ? {
          nextSteps: [
            {
              action: "Fix the reported KNO-* violations in knowledge/ records",
              kind: "required" as const,
            },
          ],
        }
      : {}),
  };
}
