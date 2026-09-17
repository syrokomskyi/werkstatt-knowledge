/*
<MODULE_CONTRACT>
<purpose>VerificationService — the skeleton service for canonical structural and evidence validation.</purpose>

<non-goals>
  <item>Skeleton — throws NotImplementedError when called.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial VerificationService skeleton.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import type { KnowledgeContext } from "./context.ts";
import { loadRecordFile, loadRegistry } from "../schemas/record-io.ts";
import { knowledgeManifestSchema } from "../schemas/canonical-records.ts";
import type { SchemaRegistry } from "../schemas/ontology-registry.ts";
import { sourceService, type SourceDrift, type SourceUnit } from "./source.ts";
import { KNOWLEDGE_PATHS } from "../paths/knowledge-paths.ts";

export interface VerificationViolation {
  ruleId: string;
  severity: "error" | "warning";
  message: string;
  path?: string;
}

export type VerificationScope = "canonical" | "candidates";

export interface KnowledgeStatus {
  recordCounts: Record<string, number>;
  layerCounts: Record<string, number>;
  registry: { relationTypes: number; entityKinds: number } | null;
  sourceDrift: SourceDrift[];
  pendingCandidates: number;
}

export interface VerificationService {
  verify(ctx: KnowledgeContext, scope?: VerificationScope): Promise<VerificationViolation[]>;
  checkEvidence(ctx: KnowledgeContext, scope?: VerificationScope): Promise<VerificationViolation[]>;
  checkRelations(
    ctx: KnowledgeContext,
    scope?: VerificationScope,
  ): Promise<VerificationViolation[]>;
  status(ctx: KnowledgeContext): Promise<KnowledgeStatus>;
}

const RECORD_DIRS: Record<string, string> = {
  entity: "entities",
  relation: "relations",
  evidence: "evidence",
  binding: "bindings",
  coverage: "coverage",
};

const NON_ASCII_LANGUAGE_PATTERN = /[\u0400-\u04FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/;

interface LoadedRecord {
  type: string;
  layerDir: string;
  relPath: string;
  record: Record<string, unknown>;
}

interface LayerScan {
  records: LoadedRecord[];
  violations: VerificationViolation[];
}

async function scanLayer(
  ctx: KnowledgeContext,
  layerDir: string,
): Promise<{ records: LoadedRecord[]; violations: VerificationViolation[] }> {
  const records: LoadedRecord[] = [];
  const violations: VerificationViolation[] = [];
  const layerRoot = join(ctx.workspaceRoot, layerDir);
  for (const [type, subdir] of Object.entries(RECORD_DIRS)) {
    const dir = join(layerRoot, subdir);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".yaml")) continue;
      const filePath = join(dir, entry.name);
      // Always load with the nonCanonical schema set so draft/speculative parse;
      // canonical epistemic violations surface as KNO-012, not KNO-007.
      const result = await loadRecordFile(
        filePath,
        type as Parameters<typeof loadRecordFile>[1],
        "nonCanonical",
      );
      const relPath = relative(ctx.workspaceRoot, filePath);
      if (!result.ok) {
        for (const d of result.diagnostics) {
          violations.push({
            ruleId: d.ruleId,
            severity: "error",
            message: d.message,
            path: relPath,
          });
        }
        continue;
      }
      records.push({
        type,
        layerDir,
        relPath,
        record: result.record as Record<string, unknown>,
      });
    }
  }
  return { records, violations };
}

interface AllLayerScans {
  canonical: LayerScan;
  staging: LayerScan;
  laboratory: LayerScan;
}

async function scanAllLayers(ctx: KnowledgeContext): Promise<AllLayerScans> {
  const canonical = await scanLayer(ctx, KNOWLEDGE_PATHS.contentDir);
  const staging = await scanLayer(ctx, KNOWLEDGE_PATHS.stagingDir);
  const laboratory = await scanLayer(ctx, KNOWLEDGE_PATHS.laboratoryDir);
  return { canonical, staging, laboratory };
}

/**
 * Subject = records under check; pool = records available for reference
 * resolution. Candidates may legitimately reference canonical records, so the
 * candidates pool includes all three layers; the canonical pool is canonical
 * only (staging/laboratory references surface as KNO-014/015).
 */
function scopeSets(
  scans: AllLayerScans,
  scope: VerificationScope,
): { subject: LoadedRecord[]; pool: LoadedRecord[] } {
  if (scope === "canonical") {
    return { subject: scans.canonical.records, pool: scans.canonical.records };
  }
  return {
    subject: [...scans.staging.records, ...scans.laboratory.records],
    pool: [...scans.canonical.records, ...scans.staging.records, ...scans.laboratory.records],
  };
}

function violation(
  ruleId: string,
  message: string,
  path?: string,
  severity: "error" | "warning" = "error",
): VerificationViolation {
  return { ruleId, severity, message, path };
}

function collectRefs(record: Record<string, unknown>): string[] {
  const refs: string[] = [];
  const claims = record.claims as { evidence?: string[] }[] | undefined;
  if (Array.isArray(claims)) {
    for (const c of claims) {
      if (Array.isArray(c.evidence)) refs.push(...c.evidence);
    }
  }
  if (Array.isArray(record.evidence)) refs.push(...(record.evidence as string[]));
  if (typeof record.from === "string") refs.push(record.from);
  if (typeof record.to === "string") refs.push(record.to);
  return refs;
}

function checkEpistemic(records: LoadedRecord[]): VerificationViolation[] {
  const violations: VerificationViolation[] = [];
  const checkStatus = (status: unknown, where: string, path: string) => {
    if (status === "draft" || status === "speculative") {
      violations.push(
        violation("KNO-012", `${where}: canonical epistemic status excludes "${status}"`, path),
      );
    }
  };
  for (const r of records) {
    checkStatus(r.record.epistemicStatus, `${r.record.id}`, r.relPath);
    const claims = r.record.claims as { id?: string; epistemicStatus?: string }[] | undefined;
    if (Array.isArray(claims)) {
      for (const c of claims) {
        checkStatus(c.epistemicStatus, `${r.record.id} claim ${c.id}`, r.relPath);
      }
    }
  }
  return violations;
}

function checkEnglish(records: LoadedRecord[]): VerificationViolation[] {
  const violations: VerificationViolation[] = [];
  for (const r of records) {
    if (r.type !== "entity") continue;
    const title = r.record.title;
    if (typeof title === "string" && NON_ASCII_LANGUAGE_PATTERN.test(title)) {
      violations.push(
        violation(
          "KNO-013",
          `${r.record.id}: title is not English (non-ASCII language block detected)`,
          r.relPath,
        ),
      );
    }
    const claims = r.record.claims as { id?: string; value?: unknown }[] | undefined;
    if (Array.isArray(claims)) {
      for (const c of claims) {
        if (typeof c.value === "string" && NON_ASCII_LANGUAGE_PATTERN.test(c.value)) {
          violations.push(
            violation("KNO-013", `${r.record.id} claim ${c.id}: value is not English`, r.relPath),
          );
        }
      }
    }
  }
  return violations;
}

export const verificationService: VerificationService = {
  async verify(
    ctx: KnowledgeContext,
    scope: VerificationScope = "canonical",
  ): Promise<VerificationViolation[]> {
    const violations: VerificationViolation[] = [];

    const scans = await scanAllLayers(ctx);
    const { subject: scopeRecords } = scopeSets(scans, scope);
    const scopeViolations =
      scope === "canonical"
        ? [...scans.canonical.violations]
        : [...scans.staging.violations, ...scans.laboratory.violations];
    violations.push(...scopeViolations);

    // KNO-001 — manifest (canonical scope only)
    if (scope === "canonical") {
      const manifestPath = join(ctx.workspaceRoot, KNOWLEDGE_PATHS.manifest);
      if (!existsSync(manifestPath)) {
        violations.push(violation("KNO-001", `${KNOWLEDGE_PATHS.manifest}: manifest missing`));
      } else {
        try {
          const data = parseYaml(readFileSync(manifestPath, "utf-8"));
          const parsed = knowledgeManifestSchema.safeParse(data);
          if (!parsed.success) {
            for (const issue of parsed.error.issues) {
              violations.push(
                violation(
                  "KNO-001",
                  `${KNOWLEDGE_PATHS.manifest}: ${issue.path.join(".") || "(root)"}: ${issue.message}`,
                  KNOWLEDGE_PATHS.manifest,
                ),
              );
            }
          }
        } catch (err) {
          violations.push(
            violation(
              "KNO-001",
              `${KNOWLEDGE_PATHS.manifest}: cannot parse: ${err instanceof Error ? err.message : String(err)}`,
              KNOWLEDGE_PATHS.manifest,
            ),
          );
        }
      }
    }

    // KNO-008 — id uniqueness + alias collisions (within scope)
    const idSeen = new Map<string, string>();
    const aliasSeen = new Map<string, string>();
    for (const r of scopeRecords) {
      const id = r.record.id as string;
      const prev = idSeen.get(id);
      if (prev) {
        violations.push(
          violation("KNO-008", `duplicate record id "${id}" (${prev}, ${r.relPath})`, r.relPath),
        );
      } else {
        idSeen.set(id, r.relPath);
      }
      const aliases = r.record.aliases as string[] | undefined;
      if (Array.isArray(aliases)) {
        for (const a of aliases) {
          const prevAlias = aliasSeen.get(a);
          const prevId = idSeen.get(a);
          if (prevAlias || prevId) {
            violations.push(
              violation(
                "KNO-008",
                `alias "${a}" of ${id} collides with ${prevAlias ? `alias of ${prevAlias}` : `id in ${prevId}`}`,
                r.relPath,
              ),
            );
          } else {
            aliasSeen.set(a, id);
          }
        }
      }
    }

    // KNO-009 — evidence resolution + fingerprint re-verification (scope-aware)
    violations.push(...(await evidenceViolations(ctx, scans, scope)));

    // KNO-010 — claim support
    for (const r of scopeRecords) {
      const claims = r.record.claims as
        | { id?: string; provenance?: string; epistemicStatus?: string; evidence?: string[] }[]
        | undefined;
      if (!Array.isArray(claims)) continue;
      for (const c of claims) {
        const hasEvidence = Array.isArray(c.evidence) && c.evidence.length > 0;
        if (c.provenance === "external" && !hasEvidence) {
          violations.push(
            violation(
              "KNO-010",
              `${r.record.id} claim ${c.id}: provenance "external" requires at least one evidence reference`,
              r.relPath,
            ),
          );
        }
        if (c.epistemicStatus === "verified" && !hasEvidence) {
          violations.push(
            violation(
              "KNO-010",
              `${r.record.id} claim ${c.id}: epistemicStatus "verified" requires evidence`,
              r.relPath,
            ),
          );
        }
        // KNO-023 — generated claims must carry decisionRef (reviewed)
        if (c.provenance === "generated" && !(c as { decisionRef?: string }).decisionRef) {
          violations.push(
            violation(
              "KNO-023",
              `${r.record.id} claim ${c.id}: generated claim lacks decisionRef (unreviewed)`,
              r.relPath,
            ),
          );
        }
      }
    }

    // KNO-011 — relation ontology (scope-aware)
    violations.push(...(await relationViolations(ctx, scans, scope)));

    // KNO-012 — epistemic status
    if (scope === "canonical") {
      violations.push(...checkEpistemic(scans.canonical.records));
    } else {
      // candidates scope: draft/speculative allowed but flagged as promotion-blockers
      for (const r of scopeRecords) {
        const statuses: { where: string; status: unknown }[] = [
          { where: `${r.record.id}`, status: r.record.epistemicStatus },
        ];
        const claims = r.record.claims as { id?: string; epistemicStatus?: string }[] | undefined;
        if (Array.isArray(claims)) {
          for (const c of claims) {
            statuses.push({ where: `${r.record.id} claim ${c.id}`, status: c.epistemicStatus });
          }
        }
        for (const s of statuses) {
          if (s.status === "draft" || s.status === "speculative") {
            violations.push(
              violation(
                "KNO-012",
                `${s.where}: "${s.status}" is a promotion-blocker for canonical`,
                r.relPath,
                "warning",
              ),
            );
          }
        }
      }
    }

    // KNO-013 — canonical English (canonical scope only)
    if (scope === "canonical") {
      violations.push(...checkEnglish(scans.canonical.records));
    }

    // KNO-014/015 — canonical records must not reference staging/laboratory ids
    if (scope === "canonical") {
      const stagingIds = new Set(scans.staging.records.map((r) => r.record.id as string));
      const labIds = new Set(scans.laboratory.records.map((r) => r.record.id as string));
      const canonicalIds = new Set(scans.canonical.records.map((r) => r.record.id as string));
      for (const r of scans.canonical.records) {
        for (const ref of collectRefs(r.record)) {
          if (canonicalIds.has(ref)) continue;
          if (stagingIds.has(ref)) {
            violations.push(
              violation(
                "KNO-014",
                `${r.record.id}: references staging record "${ref}" — staging is excluded from canonical`,
                r.relPath,
              ),
            );
          } else if (labIds.has(ref)) {
            violations.push(
              violation(
                "KNO-015",
                `${r.record.id}: references laboratory record "${ref}" — laboratory is non-authoritative`,
                r.relPath,
              ),
            );
          }
        }
      }
    }

    // KNO-024 — sole plugin (canonical scope only)
    if (scope === "canonical") {
      const kernelConfigPath = join(ctx.workspaceRoot, "tools", "kernel.config.ts");
      if (!existsSync(kernelConfigPath)) {
        violations.push(
          violation(
            "KNO-024",
            "tools/kernel.config.ts missing — no registered plugin",
            "tools/kernel.config.ts",
          ),
        );
      } else {
        const content = readFileSync(kernelConfigPath, "utf-8");
        const specifiers = [...content.matchAll(/@warpgogol\/(werkstatt-[a-z-]+)/g)].map(
          (m) => m[1],
        );
        const plugins = specifiers.filter(
          (s) => s !== "werkstatt-engine" && s !== "werkstatt-shared",
        );
        if (!plugins.includes("werkstatt-knowledge")) {
          violations.push(
            violation(
              "KNO-024",
              "tools/kernel.config.ts does not import @warpgogol/werkstatt-knowledge",
              "tools/kernel.config.ts",
            ),
          );
        }
        const foreign = plugins.filter((s) => s !== "werkstatt-knowledge");
        for (const f of foreign) {
          violations.push(
            violation(
              "KNO-024",
              `tools/kernel.config.ts imports foreign plugin @warpgogol/${f} — werkstatt-knowledge must be the sole plugin`,
              "tools/kernel.config.ts",
            ),
          );
        }
      }
    }

    return violations;
  },

  async checkEvidence(
    ctx: KnowledgeContext,
    scope: VerificationScope = "canonical",
  ): Promise<VerificationViolation[]> {
    const scans = await scanAllLayers(ctx);
    return evidenceViolations(ctx, scans, scope);
  },

  async checkRelations(
    ctx: KnowledgeContext,
    scope: VerificationScope = "canonical",
  ): Promise<VerificationViolation[]> {
    const scans = await scanAllLayers(ctx);
    return relationViolations(ctx, scans, scope);
  },

  async status(ctx: KnowledgeContext): Promise<KnowledgeStatus> {
    const scans = await scanAllLayers(ctx);

    const recordCounts: Record<string, number> = {};
    const layerCounts: Record<string, number> = {};
    for (const [layer, scanned] of [
      [KNOWLEDGE_PATHS.contentDir, scans.canonical],
      [KNOWLEDGE_PATHS.stagingDir, scans.staging],
      [KNOWLEDGE_PATHS.laboratoryDir, scans.laboratory],
    ] as const) {
      layerCounts[layer] = scanned.records.length;
      for (const r of scanned.records) {
        recordCounts[r.type] = (recordCounts[r.type] ?? 0) + 1;
      }
    }

    const registryPath = join(ctx.workspaceRoot, KNOWLEDGE_PATHS.schemaRegistry);
    const regResult = await loadRegistry(registryPath);
    const registry = regResult.ok
      ? {
          relationTypes: regResult.record.relationTypes.length,
          entityKinds: regResult.record.entityKinds.length,
        }
      : null;

    const sourceDrift = await sourceService.compareBindings(ctx);

    return {
      recordCounts,
      layerCounts,
      registry,
      sourceDrift,
      pendingCandidates: scans.staging.records.length + scans.laboratory.records.length,
    };
  },
};

/** KNO-009 — evidence refs in subject records resolve against pool; subject evidence fingerprints re-verified. */
async function evidenceViolations(
  ctx: KnowledgeContext,
  scans: AllLayerScans,
  scope: VerificationScope,
): Promise<VerificationViolation[]> {
  const violations: VerificationViolation[] = [];
  const { subject, pool } = scopeSets(scans, scope);
  const evidenceById = new Map<string, LoadedRecord>();
  for (const r of pool) {
    if (r.type === "evidence") evidenceById.set(r.record.id as string, r);
  }

  const units = sourceService.scanUnits(ctx);
  const unitById = new Map<string, SourceUnit>(units.map((u) => [u.id, u]));
  const sourceRoot = sourceService.resolveRoot(ctx);

  // every evidence:* reference resolves
  for (const r of subject) {
    for (const ref of collectRefs(r.record)) {
      if (!ref.startsWith("evidence:")) continue;
      if (!evidenceById.has(ref)) {
        violations.push(
          violation(
            "KNO-009",
            `${r.record.id}: evidence reference "${ref}" does not resolve`,
            r.relPath,
          ),
        );
      }
    }
  }

  // each in-scope evidence record's fingerprint re-verified against located content
  for (const r of subject) {
    if (r.type !== "evidence") continue;
    const id = r.record.id as string;
    const rec = r.record as {
      sourceUnit: string;
      locator: { path: string; lines?: [number, number] };
      fingerprint: string;
    };
    const unit = unitById.get(rec.sourceUnit);
    if (!sourceRoot || !unit) {
      violations.push(
        violation(
          "KNO-009",
          `${id}: source unit "${rec.sourceUnit}" not resolvable — evidence unverifiable`,
          r.relPath,
          "warning",
        ),
      );
      continue;
    }
    const actual = sourceService.fingerprintAt(ctx, unit, rec.locator);
    if (actual === null) {
      violations.push(
        violation(
          "KNO-009",
          `${id}: located content "${rec.locator.path}" unreadable in unit "${rec.sourceUnit}"`,
          r.relPath,
          "warning",
        ),
      );
      continue;
    }
    if (actual !== rec.fingerprint) {
      violations.push(
        violation(
          "KNO-009",
          `${id}: fingerprint mismatch — located content changed since binding`,
          r.relPath,
        ),
      );
    }
  }
  return violations;
}

/** KNO-011 — subject relation types registered; from/to resolve to entities in pool with valid domain/range. */
async function relationViolations(
  ctx: KnowledgeContext,
  scans: AllLayerScans,
  scope: VerificationScope,
): Promise<VerificationViolation[]> {
  const violations: VerificationViolation[] = [];
  const { subject, pool } = scopeSets(scans, scope);
  const registryPath = join(ctx.workspaceRoot, KNOWLEDGE_PATHS.schemaRegistry);
  const regResult = await loadRegistry(registryPath);
  if (!regResult.ok) {
    for (const d of regResult.diagnostics) {
      violations.push(violation(d.ruleId, d.message, KNOWLEDGE_PATHS.schemaRegistry));
    }
    return violations;
  }
  const registry: SchemaRegistry = regResult.record;
  const relTypes = new Map(registry.relationTypes.map((t) => [t.id, t]));
  const entityKindById = new Map<string, string>();
  for (const r of pool) {
    if (r.type === "entity") entityKindById.set(r.record.id as string, r.record.kind as string);
  }
  for (const r of subject) {
    if (r.type !== "relation") continue;
    const rec = r.record as { id: string; type: string; from: string; to: string };
    const relType = relTypes.get(rec.type);
    if (!relType) {
      violations.push(
        violation(
          "KNO-011",
          `${rec.id}: relation type "${rec.type}" is not registered in schema-registry.yaml`,
          r.relPath,
        ),
      );
      continue;
    }
    const fromKind = entityKindById.get(rec.from);
    const toKind = entityKindById.get(rec.to);
    if (fromKind === undefined) {
      violations.push(
        violation(
          "KNO-011",
          `${rec.id}: "from" entity "${rec.from}" does not resolve to a canonical entity`,
          r.relPath,
        ),
      );
    } else if (!relType.domain.includes(fromKind)) {
      violations.push(
        violation(
          "KNO-011",
          `${rec.id}: "from" kind "${fromKind}" not in domain of "${rec.type}" (${relType.domain.join(", ")})`,
          r.relPath,
        ),
      );
    }
    if (toKind === undefined) {
      violations.push(
        violation(
          "KNO-011",
          `${rec.id}: "to" entity "${rec.to}" does not resolve to a canonical entity`,
          r.relPath,
        ),
      );
    } else if (!relType.range.includes(toKind)) {
      violations.push(
        violation(
          "KNO-011",
          `${rec.id}: "to" kind "${toKind}" not in range of "${rec.type}" (${relType.range.join(", ")})`,
          r.relPath,
        ),
      );
    }
  }
  return violations;
}
