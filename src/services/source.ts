/*
<MODULE_CONTRACT>
<purpose>SourceService — domain operations for source root resolution, scanning, and fingerprinting.</purpose>


<non-goals>
  <item>Does not write or mutate source — read-only (KNO-004).</item>
  <item>Does not return KernelCommandResult — domain types only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1108: fingerprintAt (located-content hashing for KNO-009) + real compareBindings reading knowledge/bindings/*.yaml.</item>
  <item>RFC-1098: initial SourceService implementation (resolveRoot, scanUnits, fingerprint, compareBindings).</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { createHash } from "node:crypto";
import type { KnowledgeContext } from "./context.ts";

export interface SourceUnit {
  id: string;
  path: string;
  fingerprint: string;
  metadata: { name?: string; version?: string };
}

export interface SourceDrift {
  unitId: string;
  currentFingerprint: string;
  boundFingerprint: string | null;
  drift: boolean;
}

export interface SourceLocator {
  path: string;
  lines?: [number, number];
}

export interface SourceService {
  resolveRoot(ctx: KnowledgeContext): string | null;
  scanUnits(ctx: KnowledgeContext): SourceUnit[];
  fingerprint(ctx: KnowledgeContext, unit: SourceUnit): string;
  fingerprintAt(ctx: KnowledgeContext, unit: SourceUnit, locator: SourceLocator): string | null;
  compareBindings(ctx: KnowledgeContext): Promise<SourceDrift[]>;
}

function findSourceRoot(workspaceRoot: string): string | null {
  const parent = dirname(workspaceRoot);
  const workspaceName = basename(workspaceRoot);
  const sourceDir = join(parent, `${workspaceName}-source`);
  if (existsSync(sourceDir) && statSync(sourceDir).isDirectory()) {
    return sourceDir;
  }
  return null;
}

function computeFingerprint(filePath: string): string {
  const content = readFileSync(filePath);
  const hash = createHash("sha256").update(content).digest("hex");
  return `sha256:${hash}`;
}

function readUnitMetadata(unitDir: string): { name?: string; version?: string } {
  const pkgJsonPath = join(unitDir, "package.json");
  try {
    const content = readFileSync(pkgJsonPath, "utf-8");
    const pkg = JSON.parse(content) as { name?: string; version?: string };
    return { name: pkg.name, version: pkg.version };
  } catch {
    return {};
  }
}

export const sourceService: SourceService = {
  resolveRoot(ctx: KnowledgeContext): string | null {
    if (ctx.config.sourceRoot) {
      const candidate = join(ctx.workspaceRoot, ctx.config.sourceRoot);
      if (existsSync(candidate) && statSync(candidate).isDirectory()) {
        return candidate;
      }
    }
    return findSourceRoot(ctx.workspaceRoot);
  },

  scanUnits(ctx: KnowledgeContext): SourceUnit[] {
    const root = sourceService.resolveRoot(ctx);
    if (!root) return [];

    const entries = readdirSync(root, { withFileTypes: true });
    const units: SourceUnit[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue;

      const unitDir = join(root, entry.name);
      const unit: SourceUnit = {
        id: entry.name,
        path: unitDir,
        fingerprint: computeFingerprint(join(unitDir, "README.md")),
        metadata: readUnitMetadata(unitDir),
      };
      units.push(unit);
    }

    return units;
  },

  fingerprint(_ctx: KnowledgeContext, unit: SourceUnit): string {
    return computeFingerprint(join(unit.path, "README.md"));
  },

  fingerprintAt(_ctx: KnowledgeContext, unit: SourceUnit, locator: SourceLocator): string | null {
    const filePath = join(unit.path, locator.path);
    let content: string;
    try {
      content = readFileSync(filePath, "utf-8");
    } catch {
      return null;
    }
    if (locator.lines) {
      const [start, end] = locator.lines;
      const lines = content.split("\n");
      content = lines.slice(start - 1, end).join("\n");
    }
    const hash = createHash("sha256").update(content).digest("hex");
    return `sha256:${hash}`;
  },

  async compareBindings(ctx: KnowledgeContext): Promise<SourceDrift[]> {
    const units = sourceService.scanUnits(ctx);
    const bound = new Map<string, string>();

    const bindingsDir = join(ctx.workspaceRoot, "knowledge", "bindings");
    if (existsSync(bindingsDir)) {
      const { loadRecordFile } = await import("../schemas/record-io.ts");
      for (const entry of readdirSync(bindingsDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(".yaml")) continue;
        const result = await loadRecordFile(join(bindingsDir, entry.name), "binding", "canonical");
        if (!result.ok) continue;
        const record = result.record as { sourceUnit: string; fingerprint: string };
        bound.set(record.sourceUnit, record.fingerprint);
      }
    }

    return units.map((unit) => {
      const boundFingerprint = bound.get(unit.id) ?? null;
      return {
        unitId: unit.id,
        currentFingerprint: unit.fingerprint,
        boundFingerprint,
        drift: boundFingerprint !== null && boundFingerprint !== unit.fingerprint,
      };
    });
  },
};
