import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { sourceService } from "../services/source.ts";
import { resolveKnowledgeContext } from "../services/context.ts";

let tmpDir: string;
let workspaceDir: string;
let sourceDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "knowledge-test-"));
  workspaceDir = join(tmpDir, "my-kb");
  sourceDir = join(tmpDir, "my-kb-source");
  mkdirSync(workspaceDir, { recursive: true });
  mkdirSync(sourceDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("sourceService.resolveRoot", () => {
  it("resolves ../<kb-id>-source sibling directory", () => {
    const ctx = resolveKnowledgeContext(workspaceDir);
    const root = sourceService.resolveRoot(ctx);
    expect(root).toBe(sourceDir);
  });

  it("returns null when no source root exists", () => {
    const ctx = resolveKnowledgeContext(join(tmpDir, "no-source"));
    const root = sourceService.resolveRoot(ctx);
    expect(root).toBeNull();
  });

  it("uses config.sourceRoot when set", () => {
    writeFileSync(join(workspaceDir, "knowledge.config.yaml"), "sourceRoot: custom-source\n");
    mkdirSync(join(workspaceDir, "custom-source"), { recursive: true });
    const ctx = resolveKnowledgeContext(workspaceDir);
    const root = sourceService.resolveRoot(ctx);
    expect(root).toBe(join(workspaceDir, "custom-source"));
  });
});

describe("sourceService.scanUnits", () => {
  it("returns empty array when no source root", () => {
    const ctx = resolveKnowledgeContext(join(tmpDir, "no-source"));
    const units = sourceService.scanUnits(ctx);
    expect(units).toEqual([]);
  });

  it("lists source units with metadata", () => {
    const unitDir = join(sourceDir, "unit-a");
    mkdirSync(unitDir, { recursive: true });
    writeFileSync(join(unitDir, "README.md"), "# Unit A\n");
    writeFileSync(
      join(unitDir, "package.json"),
      JSON.stringify({ name: "unit-a", version: "1.0.0" }),
    );

    const ctx = resolveKnowledgeContext(workspaceDir);
    const units = sourceService.scanUnits(ctx);
    expect(units).toHaveLength(1);
    expect(units[0].id).toBe("unit-a");
    expect(units[0].metadata.name).toBe("unit-a");
    expect(units[0].metadata.version).toBe("1.0.0");
    expect(units[0].fingerprint).toMatch(/^sha256:/);
  });

  it("skips hidden directories", () => {
    mkdirSync(join(sourceDir, ".hidden"), { recursive: true });
    const ctx = resolveKnowledgeContext(workspaceDir);
    const units = sourceService.scanUnits(ctx);
    expect(units).toEqual([]);
  });
});

describe("sourceService.fingerprint", () => {
  it("computes sha256 fingerprint of README.md", () => {
    const unitDir = join(sourceDir, "unit-a");
    mkdirSync(unitDir, { recursive: true });
    writeFileSync(join(unitDir, "README.md"), "# Test\n");

    const ctx = resolveKnowledgeContext(workspaceDir);
    const units = sourceService.scanUnits(ctx);
    const fp = sourceService.fingerprint(ctx, units[0]);
    expect(fp).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});

describe("sourceService.compareBindings", () => {
  it("returns drift entries for all units", () => {
    const unitDir = join(sourceDir, "unit-a");
    mkdirSync(unitDir, { recursive: true });
    writeFileSync(join(unitDir, "README.md"), "# Test\n");

    const ctx = resolveKnowledgeContext(workspaceDir);
    const drift = sourceService.compareBindings(ctx);
    expect(drift).toHaveLength(1);
    expect(drift[0].unitId).toBe("unit-a");
    expect(drift[0].drift).toBe(false);
    expect(drift[0].boundFingerprint).toBeNull();
  });
});
