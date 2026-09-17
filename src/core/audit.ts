/*
<MODULE_CONTRACT>
<purpose>knowledge.audit handler — delegates governance/secret audit to AuditService.audit (KNO-016, KNO-017, KNO-020).</purpose>

<non-goals>
  <item>Does not implement check logic — delegates to AuditService.</item>
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
import { auditService } from "../services/audit.ts";

export async function run(
  ctx: KnowledgeContext,
  _input: KernelCommandInput,
): Promise<KernelCommandResult> {
  const violations = await auditService.audit(ctx);
  const errors = violations.filter((v) => v.severity === "error");
  const failed = errors.length > 0;
  return {
    data: {
      command: "knowledge.audit",
      status: failed ? "fail" : "pass",
      diagnostics: violations.map((v) => ({
        ruleId: v.ruleId,
        severity: v.severity,
        message: v.message,
        ...(v.path ? { file: v.path } : {}),
      })),
      violations: violations.map((v) => v.message),
      message: failed
        ? `${errors.length} audit violation(s)`
        : "audit clean (decisionRefs resolve, no secrets)",
    },
    exitCode: failed ? 1 : 0,
    summary: `[knowledge.audit] ${failed ? `fail (${errors.length} errors)` : "pass"}`,
    ...(failed
      ? {
          nextSteps: [
            {
              action: "Resolve unresolvable decisionRefs or remove secret patterns",
              kind: "required" as const,
            },
          ],
        }
      : {}),
  };
}
