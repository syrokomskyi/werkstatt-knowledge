/*
<MODULE_CONTRACT>
<purpose>AuditService — governance decisionRef resolution (KNO-016, KNO-017) and secret-pattern scan (KNO-020) for werkstatt-knowledge.</purpose>

<non-goals>
  <item>Does not write or mutate records — read-only audit.</item>
  <item>Does not return KernelCommandResult — domain types only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1108: initial AuditService — decisionRef resolution against docs/rfcs + docs/adrs frontmatter, regex secret scan with per-layer severity.</item>
</CHANGE_SUMMARY>
*/

import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { collectFiles } from "@warpgogol/werkstatt-shared/node/fs";
import type { KnowledgeContext } from "./context.ts";
import { loadRegistry } from "../schemas/record-io.ts";
import { KNOWLEDGE_PATHS } from "../paths/knowledge-paths.ts";
import type { VerificationViolation } from "./verification.ts";

export interface AuditService {
  audit(ctx: KnowledgeContext): Promise<VerificationViolation[]>;
}

const SECRET_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: "private key block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "GitHub token", pattern: /ghp_[A-Za-z0-9]{36}/ },
  { name: "OpenAI-style key", pattern: /sk-[A-Za-z0-9]{20,}/ },
  { name: "password assignment", pattern: /password\s*[:=]\s*\S+/i },
  { name: "api key assignment", pattern: /api[_-]?key\s*[:=]\s*\S+/i },
];

const DECISION_REF_PATTERN = /^(RFC|ADR)-(\d+)$/;

function violation(
  ruleId: string,
  message: string,
  path?: string,
  severity: "error" | "warning" = "error",
): VerificationViolation {
  return { ruleId, severity, message, path };
}

/**
 * Build a map of decisionRef → status by scanning docs/rfcs and docs/adrs
 * frontmatter. Only `accepted` and `implemented` statuses satisfy KNO-016/017.
 */
async function buildDecisionIndex(workspaceRoot: string): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  for (const base of ["docs/rfcs", "docs/adrs"]) {
    for (const file of await collectFiles(join(workspaceRoot, base), {
      extensions: [".md"],
    })) {
      const name = file.split("/").pop() ?? "";
      const m = name.match(/^(rfc|adr)-(\d+)-.*\.md$/);
      if (!m) continue;
      const id = `${m[1].toUpperCase()}-${m[2]}`;
      const head = readFileSync(file, "utf-8").split("\n").slice(0, 60).join("\n");
      const statusMatch = head.match(/^status:\s*(\S+)/m);
      if (statusMatch) index.set(id, statusMatch[1]);
    }
  }
  return index;
}

function resolveDecisionRef(
  ref: string,
  index: Map<string, string>,
): { ok: boolean; reason?: string } {
  if (!DECISION_REF_PATTERN.test(ref)) {
    return { ok: false, reason: `malformed decisionRef "${ref}"` };
  }
  const status = index.get(ref);
  if (status === undefined) {
    return { ok: false, reason: `decisionRef "${ref}" not found in docs/rfcs or docs/adrs` };
  }
  if (status !== "accepted" && status !== "implemented") {
    return {
      ok: false,
      reason: `decisionRef "${ref}" has status "${status}" (need accepted/implemented)`,
    };
  }
  return { ok: true };
}

/** Collect all YAML files under <workspaceRoot>/<layerDir>. */
async function layerYamlFiles(ctx: KnowledgeContext, layerDir: string): Promise<string[]> {
  return collectFiles(join(ctx.workspaceRoot, layerDir), { extensions: [".yaml"] });
}

export const auditService: AuditService = {
  async audit(ctx: KnowledgeContext): Promise<VerificationViolation[]> {
    const violations: VerificationViolation[] = [];
    const decisionIndex = await buildDecisionIndex(ctx.workspaceRoot);

    // KNO-016 — governanceLog decisionRefs resolve to accepted/implemented decisions
    const registryPath = join(ctx.workspaceRoot, KNOWLEDGE_PATHS.schemaRegistry);
    const regResult = await loadRegistry(registryPath);
    if (!regResult.ok) {
      for (const d of regResult.diagnostics) {
        violations.push(violation(d.ruleId, d.message, KNOWLEDGE_PATHS.schemaRegistry));
      }
    } else {
      for (const entry of regResult.record.governanceLog) {
        const res = resolveDecisionRef(entry.decisionRef, decisionIndex);
        if (!res.ok) {
          violations.push(
            violation("KNO-016", `governanceLog: ${res.reason}`, KNOWLEDGE_PATHS.schemaRegistry),
          );
        }
      }
    }

    // KNO-017 — record-level decisionRefs resolve the same way.
    // decisionRef is a simple scalar field; a regex scan over canonical YAML
    // is sufficient and avoids re-parsing records already loaded by verify.
    if (existsSync(join(ctx.workspaceRoot, KNOWLEDGE_PATHS.contentDir))) {
      for (const file of await layerYamlFiles(ctx, KNOWLEDGE_PATHS.contentDir)) {
        const relPath = relative(ctx.workspaceRoot, file);
        const text = readFileSync(file, "utf-8");
        for (const m of text.matchAll(/decisionRef:\s*["']?([A-Z]+-\d+)["']?/g)) {
          const res = resolveDecisionRef(m[1], decisionIndex);
          if (!res.ok) {
            violations.push(violation("KNO-017", `${res.reason}`, relPath));
          }
        }
      }
    }

    // KNO-020 — secret scan: knowledge/ + staging/ → error, laboratory/ → warning
    for (const [layerDir, severity] of [
      [KNOWLEDGE_PATHS.contentDir, "error"],
      [KNOWLEDGE_PATHS.stagingDir, "error"],
      [KNOWLEDGE_PATHS.laboratoryDir, "warning"],
    ] as const) {
      for (const file of await layerYamlFiles(ctx, layerDir)) {
        const relPath = relative(ctx.workspaceRoot, file);
        const text = readFileSync(file, "utf-8");
        for (const { name, pattern } of SECRET_PATTERNS) {
          if (pattern.test(text)) {
            violations.push(
              violation("KNO-020", `secret pattern detected: ${name}`, relPath, severity),
            );
          }
        }
      }
    }

    return violations;
  },
};
