import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { verificationService } from "../services/verification.ts";
import { resolveKnowledgeContext } from "../services/context.ts";
import { makeKbWorkspace, writeEntity, writeEvidence, writeYaml, sha256 } from "./kb-fixture.ts";

let tmpDir: string;
let workspaceDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "knowledge-verify-"));
  workspaceDir = join(tmpDir, "my-kb");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const ruleIds = (vs: { ruleId: string }[]) => vs.map((v) => v.ruleId);

describe("verificationService.verify (canonical)", () => {
  it("clean workspace produces no error violations", async () => {
    makeKbWorkspace(workspaceDir);
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx);
    expect(ruleIds(violations.filter((v) => v.severity === "error"))).toEqual([]);
  });

  it("missing manifest → KNO-001", async () => {
    makeKbWorkspace(workspaceDir);
    rmSync(join(workspaceDir, "knowledge", "manifest.yaml"));
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx);
    expect(ruleIds(violations)).toContain("KNO-001");
  });

  it("schema-invalid record → KNO-007 (AC-1)", async () => {
    makeKbWorkspace(workspaceDir);
    writeYaml(
      join(workspaceDir, "knowledge", "entities"),
      "broken.yaml",
      'schema: "knowledge/entity@1"\nid: 42\n',
    );
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx);
    expect(ruleIds(violations)).toContain("KNO-007");
  });

  it("duplicate record ids → KNO-008", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "alpha");
    writeYaml(
      join(workspaceDir, "knowledge", "entities"),
      "alpha-copy.yaml",
      [
        'schema: "knowledge/entity@1"',
        'id: "entity:alpha"',
        'kind: "concept"',
        'title: "alpha copy"',
        "aliases: []",
        "claims: []",
        "",
      ].join("\n"),
    );
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx);
    expect(ruleIds(violations)).toContain("KNO-008");
  });

  it("external claim without evidence → KNO-010", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "alpha", {
      claims:
        '[{ id: "c1", field: "f", value: "v", provenance: "external", epistemicStatus: "supported", evidence: [] }]',
    });
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx);
    expect(ruleIds(violations)).toContain("KNO-010");
  });

  it("unregistered relation type → KNO-011", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "alpha");
    writeYaml(
      join(workspaceDir, "knowledge", "relations"),
      "rel.yaml",
      [
        'schema: "knowledge/relation@1"',
        'id: "relation:r1"',
        'type: "unregistered-type"',
        'from: "entity:alpha"',
        'to: "entity:alpha"',
        'epistemicStatus: "supported"',
        "evidence: []",
        "",
      ].join("\n"),
    );
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx);
    expect(ruleIds(violations)).toContain("KNO-011");
  });

  it("canonical draft claim → KNO-012", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "alpha", {
      claims:
        '[{ id: "c1", field: "f", value: "v", provenance: "asserted", epistemicStatus: "draft", evidence: [] }]',
    });
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx);
    expect(ruleIds(violations)).toContain("KNO-012");
  });

  it("Cyrillic title → KNO-013", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "alpha", { title: "Кириллица" });
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx);
    expect(ruleIds(violations)).toContain("KNO-013");
  });

  it("canonical record referencing staging id → KNO-014", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "alpha");
    writeEntity(workspaceDir, "ghost", { layer: "staging" });
    writeYaml(
      join(workspaceDir, "knowledge", "relations"),
      "rel.yaml",
      [
        'schema: "knowledge/relation@1"',
        'id: "relation:r1"',
        'type: "related-to"',
        'from: "entity:alpha"',
        'to: "entity:ghost"',
        'epistemicStatus: "supported"',
        "evidence: []",
        "",
      ].join("\n"),
    );
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx);
    expect(ruleIds(violations)).toContain("KNO-014");
  });

  it("missing kernel.config.ts → KNO-024", async () => {
    makeKbWorkspace(workspaceDir);
    rmSync(join(workspaceDir, "tools", "kernel.config.ts"));
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx);
    expect(ruleIds(violations)).toContain("KNO-024");
  });

  it("generated claim without decisionRef → KNO-023", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "alpha", {
      claims:
        '[{ id: "c1", field: "f", value: "v", provenance: "generated", epistemicStatus: "supported", evidence: [] }]',
    });
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx);
    expect(ruleIds(violations)).toContain("KNO-023");
  });
});

describe("verificationService.checkEvidence", () => {
  it("fingerprint mismatch after source edit → KNO-009 (AC-5)", async () => {
    const { unitDir } = makeKbWorkspace(workspaceDir, {
      withSource: true,
      sourceReadme: "# Original\n",
    });
    writeEvidence(workspaceDir, "e1", "unit-a", "README.md", sha256("# Original\n"));
    writeFileSync(join(unitDir!, "README.md"), "# Changed\n");

    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.checkEvidence(ctx);
    expect(ruleIds(violations)).toContain("KNO-009");
    const mismatch = violations.find((v) => v.message.includes("fingerprint mismatch"));
    expect(mismatch?.severity).toBe("error");
  });

  it("matching fingerprint → no KNO-009", async () => {
    makeKbWorkspace(workspaceDir, { withSource: true, sourceReadme: "# Same\n" });
    writeEvidence(workspaceDir, "e1", "unit-a", "README.md", sha256("# Same\n"));
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.checkEvidence(ctx);
    expect(ruleIds(violations)).not.toContain("KNO-009");
  });

  it("unresolvable evidence reference → KNO-009", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "alpha", {
      claims:
        '[{ id: "c1", field: "f", value: "v", provenance: "asserted", epistemicStatus: "supported", evidence: ["evidence:missing"] }]',
    });
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.checkEvidence(ctx);
    expect(ruleIds(violations)).toContain("KNO-009");
  });

  it("absent source root → warning, not error", async () => {
    makeKbWorkspace(workspaceDir);
    writeEvidence(workspaceDir, "e1", "unit-a", "README.md", sha256("x"));
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.checkEvidence(ctx);
    const unverifiable = violations.filter((v) => v.ruleId === "KNO-009");
    expect(unverifiable.length).toBeGreaterThan(0);
    expect(unverifiable.every((v) => v.severity === "warning")).toBe(true);
  });
});

describe("verificationService.verify (candidates)", () => {
  it("staging record with unresolvable evidence ref → KNO-009 (scope-aware)", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "cand", {
      layer: "staging",
      claims:
        '[{ id: "c1", field: "f", value: "v", provenance: "asserted", epistemicStatus: "draft", evidence: ["evidence:missing"] }]',
    });
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx, "candidates");
    expect(ruleIds(violations)).toContain("KNO-009");
  });

  it("staging relation with unregistered type → KNO-011 (scope-aware)", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "cand", { layer: "staging" });
    writeYaml(
      join(workspaceDir, "staging", "relations"),
      "rel.yaml",
      [
        'schema: "knowledge/relation@1"',
        'id: "relation:cand-r1"',
        'type: "unregistered-type"',
        'from: "entity:cand"',
        'to: "entity:cand"',
        'epistemicStatus: "draft"',
        "evidence: []",
        "",
      ].join("\n"),
    );
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx, "candidates");
    expect(ruleIds(violations)).toContain("KNO-011");
  });

  it("staging relation to canonical entity resolves (pool includes canonical)", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "alpha");
    writeYaml(
      join(workspaceDir, "staging", "relations"),
      "rel.yaml",
      [
        'schema: "knowledge/relation@1"',
        'id: "relation:cand-r1"',
        'type: "related-to"',
        'from: "entity:alpha"',
        'to: "entity:alpha"',
        'epistemicStatus: "draft"',
        "evidence: []",
        "",
      ].join("\n"),
    );
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx, "candidates");
    expect(ruleIds(violations)).not.toContain("KNO-011");
  });

  it("draft in staging → warning promotion-blocker, not error", async () => {
    makeKbWorkspace(workspaceDir);
    writeEntity(workspaceDir, "cand", {
      layer: "staging",
      claims:
        '[{ id: "c1", field: "f", value: "v", provenance: "asserted", epistemicStatus: "draft", evidence: [] }]',
    });
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await verificationService.verify(ctx, "candidates");
    const kno012 = violations.filter((v) => v.ruleId === "KNO-012");
    expect(kno012.length).toBeGreaterThan(0);
    expect(kno012.every((v) => v.severity === "warning")).toBe(true);
  });
});

describe("verificationService.status", () => {
  it("reports counts, registry summary, drift, pending candidates", async () => {
    makeKbWorkspace(workspaceDir, { withSource: true });
    writeEntity(workspaceDir, "alpha");
    writeEntity(workspaceDir, "cand", { layer: "staging" });
    const ctx = resolveKnowledgeContext(workspaceDir);
    const status = await verificationService.status(ctx);
    expect(status.recordCounts.entity).toBe(2);
    expect(status.layerCounts.knowledge).toBe(1);
    expect(status.layerCounts.staging).toBe(1);
    expect(status.pendingCandidates).toBe(1);
    expect(status.registry?.relationTypes).toBe(1);
    expect(status.sourceDrift).toHaveLength(1);
    expect(status.sourceDrift[0].drift).toBe(false);
  });

  it("reports drift when binding fingerprint differs", async () => {
    makeKbWorkspace(workspaceDir, { withSource: true });
    writeYaml(
      join(workspaceDir, "knowledge", "bindings"),
      "unit-a.yaml",
      [
        'schema: "knowledge/binding@1"',
        'id: "binding:unit-a"',
        'sourceUnit: "unit-a"',
        `fingerprint: "${sha256("stale")}"`,
        'boundAt: "2026-01-01T00:00:00Z"',
        "",
      ].join("\n"),
    );
    const ctx = resolveKnowledgeContext(workspaceDir);
    const status = await verificationService.status(ctx);
    expect(status.sourceDrift[0].drift).toBe(true);
  });
});
