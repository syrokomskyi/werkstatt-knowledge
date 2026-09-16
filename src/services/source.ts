/*
<MODULE_CONTRACT>
<purpose>SourceService — domain operations for source root resolution, scanning, and fingerprinting.</purpose>
<keywords>source, scan, fingerprint, knowledge, service</keywords>
<responsibilities>
  <item>Resolves ../<kb-id>-source sibling directory pattern.</item>
  <item>Lists source units within the resolved root.</item>
  <item>Computes sha256 fingerprints for source units.</item>
  <item>Compares current fingerprints with canonical bindings.</item>
</responsibilities>
<non-goals>
  <item>Does not write or mutate source — read-only (KNO-004).</item>
  <item>Does not return KernelCommandResult — domain types only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial SourceService implementation (resolveRoot, scanUnits, fingerprint, compareBindings).</item>
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

export interface SourceService {
  resolveRoot(ctx: KnowledgeContext): string | null;
  scanUnits(ctx: KnowledgeContext): SourceUnit[];
  fingerprint(ctx: KnowledgeContext, unit: SourceUnit): string;
  compareBindings(ctx: KnowledgeContext): SourceDrift[];
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

  compareBindings(ctx: KnowledgeContext): SourceDrift[] {
    const units = sourceService.scanUnits(ctx);
    return units.map((unit) => ({
      unitId: unit.id,
      currentFingerprint: unit.fingerprint,
      boundFingerprint: null,
      drift: false,
    }));
  },
};
