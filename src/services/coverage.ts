/*
<MODULE_CONTRACT>
<purpose>CoverageService — denominator/verifier rules for coverage claims (KNO-018) for werkstatt-knowledge.</purpose>

<non-goals>
  <item>Does not write or mutate records — read-only check.</item>
  <item>Does not return KernelCommandResult — domain types only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1108: initial CoverageService — KNO-018 denominator/verifier checks; schema refine failures on denominator/verified/verifier relabeled KNO-018 so the invariant's own ruleId surfaces.</item>
</CHANGE_SUMMARY>
*/

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import type { KnowledgeContext } from "./context.ts";
import { coverageRecordSchema } from "../schemas/canonical-records.ts";
import { KNOWLEDGE_PATHS } from "../paths/knowledge-paths.ts";
import { KNOWLEDGE_COMMANDS } from "../commands/knowledge-commands.ts";
import type { VerificationViolation } from "./verification.ts";

export interface CoverageService {
  checkCoverage(ctx: KnowledgeContext): Promise<VerificationViolation[]>;
}

const PROCESS_NAME_PATTERN = /^[a-z][a-z0-9.-]*$/;

function violation(
  ruleId: string,
  message: string,
  path?: string,
  severity: "error" | "warning" = "error",
): VerificationViolation {
  return { ruleId, severity, message, path };
}

/** Fields owned by KNO-018 — schema issues on them are relabeled. */
const KNO_018_FIELDS = new Set(["denominator", "verified", "verifier"]);

export const coverageService: CoverageService = {
  async checkCoverage(ctx: KnowledgeContext): Promise<VerificationViolation[]> {
    const violations: VerificationViolation[] = [];
    const dir = join(ctx.workspaceRoot, KNOWLEDGE_PATHS.contentDir, "coverage");
    if (!existsSync(dir)) return violations;

    const commandNames = new Set(KNOWLEDGE_COMMANDS.map((c) => c.name));

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".yaml")) continue;
      const filePath = join(dir, entry.name);
      const relPath = relative(ctx.workspaceRoot, filePath);

      let data: unknown;
      try {
        data = parseYaml(readFileSync(filePath, "utf-8"));
      } catch (err) {
        violations.push(
          violation(
            "KNO-007",
            `YAML parse error: ${err instanceof Error ? err.message : String(err)}`,
            relPath,
          ),
        );
        continue;
      }

      const result = coverageRecordSchema.safeParse(data);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0];
          const isKno018 =
            (typeof field === "string" && KNO_018_FIELDS.has(field)) ||
            issue.message.includes("KNO-018");
          violations.push(
            violation(
              isKno018 ? "KNO-018" : "KNO-007",
              `${issue.path.join(".") || "(root)"}: ${issue.message}`,
              relPath,
            ),
          );
        }
        continue;
      }

      const record = result.data;
      // Semantic KNO-018 checks on the parsed record.
      if (record.denominator <= 0) {
        violations.push(
          violation("KNO-018", `${record.id}: denominator must be > 0`, relPath),
        );
      }
      if (record.verified > record.denominator) {
        violations.push(
          violation(
            "KNO-018",
            `${record.id}: verified (${record.verified}) exceeds denominator (${record.denominator})`,
            relPath,
          ),
        );
      }
      if (!commandNames.has(record.verifier) && !PROCESS_NAME_PATTERN.test(record.verifier)) {
        violations.push(
          violation(
            "KNO-018",
            `${record.id}: verifier "${record.verifier}" is neither a knowledge command nor a named process`,
            relPath,
            "warning",
          ),
        );
      }
    }
    return violations;
  },
};
