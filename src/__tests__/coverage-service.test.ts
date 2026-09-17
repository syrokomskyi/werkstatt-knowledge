import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { coverageService } from "../services/coverage.ts";
import { resolveKnowledgeContext } from "../services/context.ts";
import { makeKbWorkspace, writeYaml } from "./kb-fixture.ts";

let tmpDir: string;
let workspaceDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "knowledge-coverage-"));
  workspaceDir = join(tmpDir, "my-kb");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const ruleIds = (vs: { ruleId: string }[]) => vs.map((v) => v.ruleId);

function writeCoverage(workspace: string, slug: string, body: string): void {
  writeYaml(join(workspace, "knowledge", "coverage"), `${slug}.yaml`, body);
}

describe("coverageService.checkCoverage", () => {
  it("no coverage dir → no violations", async () => {
    makeKbWorkspace(workspaceDir);
    const ctx = resolveKnowledgeContext(workspaceDir);
    expect(await coverageService.checkCoverage(ctx)).toEqual([]);
  });

  it("verified > denominator → KNO-018 (AC-3)", async () => {
    makeKbWorkspace(workspaceDir);
    writeCoverage(workspaceDir, "c1", [
      'schema: "knowledge/coverage@1"',
      'id: "coverage:c1"',
      'scope: "all"',
      "denominator: 5",
      "verified: 7",
      'verifier: "knowledge.verify"',
      "",
    ].join("\n"));
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await coverageService.checkCoverage(ctx);
    expect(ruleIds(violations)).toContain("KNO-018");
  });

  it("denominator 0 → KNO-018", async () => {
    makeKbWorkspace(workspaceDir);
    writeCoverage(workspaceDir, "c1", [
      'schema: "knowledge/coverage@1"',
      'id: "coverage:c1"',
      'scope: "all"',
      "denominator: 0",
      "verified: 0",
      'verifier: "knowledge.verify"',
      "",
    ].join("\n"));
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await coverageService.checkCoverage(ctx);
    expect(ruleIds(violations)).toContain("KNO-018");
  });

  it("unknown verifier format → warning", async () => {
    makeKbWorkspace(workspaceDir);
    writeCoverage(workspaceDir, "c1", [
      'schema: "knowledge/coverage@1"',
      'id: "coverage:c1"',
      'scope: "all"',
      "denominator: 5",
      "verified: 5",
      'verifier: "NOT A NAME!!!"',
      "",
    ].join("\n"));
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await coverageService.checkCoverage(ctx);
    const v = violations.find((x) => x.ruleId === "KNO-018");
    expect(v?.severity).toBe("warning");
  });

  it("valid coverage record → clean", async () => {
    makeKbWorkspace(workspaceDir);
    writeCoverage(workspaceDir, "c1", [
      'schema: "knowledge/coverage@1"',
      'id: "coverage:c1"',
      'scope: "all"',
      "denominator: 5",
      "verified: 5",
      'verifier: "knowledge.verify"',
      "",
    ].join("\n"));
    const ctx = resolveKnowledgeContext(workspaceDir);
    expect(await coverageService.checkCoverage(ctx)).toEqual([]);
  });

  it("schema-invalid coverage record → KNO-007", async () => {
    makeKbWorkspace(workspaceDir);
    writeCoverage(workspaceDir, "c1", 'schema: "knowledge/coverage@1"\nid: 42\n');
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await coverageService.checkCoverage(ctx);
    expect(ruleIds(violations)).toContain("KNO-007");
  });
});
