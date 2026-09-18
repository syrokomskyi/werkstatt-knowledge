import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { auditService } from "../services/audit.ts";
import { resolveKnowledgeContext } from "../services/context.ts";
import { makeKbWorkspace, writeEntity, writeYaml } from "./kb-fixture.ts";

let tmpDir: string;
let workspaceDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "knowledge-audit-"));
  workspaceDir = join(tmpDir, "my-kb");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const ruleIds = (vs: { ruleId: string }[]) => vs.map((v) => v.ruleId);

describe("auditService.audit", () => {
  it("clean workspace → no violations", async () => {
    makeKbWorkspace(workspaceDir);
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await auditService.audit(ctx);
    expect(violations).toEqual([]);
  });

  it("governanceLog decisionRef to nonexistent RFC → KNO-016 (AC-2)", async () => {
    makeKbWorkspace(workspaceDir);
    writeYaml(
      join(workspaceDir, "knowledge", "ontology"),
      "schema-registry.yaml",
      [
        'schema: "knowledge/schema-registry@1"',
        "relationTypes:",
        "  - id: related-to",
        "    domain: [concept]",
        "    range: [concept]",
        "    inverse: related-to",
        "entityKinds: [concept]",
        "epistemicVocabulary:",
        "  canonical: [verified]",
        "  nonCanonical: [draft]",
        "governanceLog:",
        '  - decisionRef: "RFC-9999"',
        '    appliedAt: "2026-01-01"',
        '    summary: "phantom"',
        "",
      ].join("\n"),
    );
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await auditService.audit(ctx);
    expect(ruleIds(violations)).toContain("KNO-016");
  });

  it("governanceLog decisionRef to accepted RFC → clean", async () => {
    makeKbWorkspace(workspaceDir);
    writeYaml(
      join(workspaceDir, "knowledge", "ontology"),
      "schema-registry.yaml",
      [
        'schema: "knowledge/schema-registry@1"',
        "relationTypes:",
        "  - id: related-to",
        "    domain: [concept]",
        "    range: [concept]",
        "    inverse: related-to",
        "entityKinds: [concept]",
        "epistemicVocabulary:",
        "  canonical: [verified]",
        "  nonCanonical: [draft]",
        "governanceLog:",
        '  - decisionRef: "RFC-0001"',
        '    appliedAt: "2026-01-01"',
        '    summary: "real"',
        "",
      ].join("\n"),
    );
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await auditService.audit(ctx);
    expect(ruleIds(violations)).not.toContain("KNO-016");
  });

  it("record decisionRef to draft RFC → KNO-017", async () => {
    makeKbWorkspace(workspaceDir);
    writeYaml(
      join(workspaceDir, "docs", "rfcs"),
      "rfc-0002-draft.md",
      "---\nid: RFC-0002\nstatus: draft\n---\n\n# Draft\n",
    );
    writeEntity(workspaceDir, "alpha", {
      claims:
        '[{ id: "c1", field: "f", value: "v", provenance: "asserted", epistemicStatus: "supported", evidence: [], decisionRef: "RFC-0002" }]',
    });
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await auditService.audit(ctx);
    expect(ruleIds(violations)).toContain("KNO-017");
  });

  it("private key in canonical → KNO-020 error", async () => {
    makeKbWorkspace(workspaceDir);
    writeYaml(
      join(workspaceDir, "knowledge", "entities"),
      "leak.yaml",
      [
        'schema: "knowledge/entity@1"',
        'id: "entity:leak"',
        'kind: "concept"',
        'title: "leak"',
        "aliases: []",
        "claims:",
        '  - id: "c1"',
        '    field: "key"',
        '    value: "-----BEGIN' + ' RSA PRIVATE KEY-----"',
        '    provenance: "asserted"',
        '    epistemicStatus: "supported"',
        "    evidence: []",
        "",
      ].join("\n"),
    );
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await auditService.audit(ctx);
    const secrets = violations.filter((v) => v.ruleId === "KNO-020");
    expect(secrets.length).toBeGreaterThan(0);
    expect(secrets.every((v) => v.severity === "error")).toBe(true);
  });

  it("private key in laboratory → KNO-020 warning", async () => {
    makeKbWorkspace(workspaceDir);
    writeYaml(
      join(workspaceDir, "laboratory", "entities"),
      "leak.yaml",
      [
        'schema: "knowledge/entity@1"',
        'id: "entity:leak"',
        'kind: "concept"',
        'title: "leak"',
        "aliases: []",
        'claims: [{ id: "c1", field: "key", value: "-----BEGIN' +
          ' RSA PRIVATE KEY-----", provenance: "asserted", epistemicStatus: "draft", evidence: [] }]',
        "",
      ].join("\n"),
    );
    const ctx = resolveKnowledgeContext(workspaceDir);
    const violations = await auditService.audit(ctx);
    const secrets = violations.filter((v) => v.ruleId === "KNO-020");
    expect(secrets.length).toBeGreaterThan(0);
    expect(secrets.every((v) => v.severity === "warning")).toBe(true);
  });
});
