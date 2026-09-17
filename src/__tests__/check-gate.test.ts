import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runKnowledgeCheckGate } from "../hooks/check-gate.ts";
import type { PluginHookContext } from "@warpgogol/werkstatt-shared/plugin";

let tmpDir: string;
let workspaceDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "knowledge-gate-"));
  workspaceDir = join(tmpDir, "my-kb");
  mkdirSync(workspaceDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function makeCtx(overrides?: Partial<PluginHookContext>): PluginHookContext {
  return {
    workspaceRoot: workspaceDir,
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    ...overrides,
  };
}

describe("runKnowledgeCheckGate", () => {
  it("returns success:false when validators are unimplemented", async () => {
    const result = await runKnowledgeCheckGate(makeCtx());
    expect(result.success).toBe(false);
    const data = result.data as { unimplemented: string[]; perCheck: Record<string, string> };
    expect(data.unimplemented).toContain("knowledge.extract.run");
    expect(data.unimplemented).toContain("knowledge.materialize.verify");
    expect(data.unimplemented).toContain("knowledge.release.check");
    expect(data.unimplemented).toContain("knowledge.promote");
    expect(data.perCheck["knowledge.verify"]).toBe("fail");
  });

  it("returns success:true with --allow-pending when only pending validators exist", async () => {
    const sourceDir = join(tmpDir, "my-kb-source");
    mkdirSync(sourceDir, { recursive: true });
    const unitDir = join(sourceDir, "unit-a");
    mkdirSync(unitDir, { recursive: true });
    writeFileSync(join(unitDir, "README.md"), "# Test\n");
    writeFileSync(
      join(unitDir, "package.json"),
      JSON.stringify({ name: "unit-a", version: "1.0.0" }),
    );
    // Minimal valid KB so implemented validators pass
    mkdirSync(join(workspaceDir, "knowledge", "ontology"), { recursive: true });
    writeFileSync(
      join(workspaceDir, "knowledge", "manifest.yaml"),
      'schema: "knowledge/manifest@1"\nid: my-kb\nname: "My KB"\nmodelVersion: "1.0.0"\n',
    );
    writeFileSync(
      join(workspaceDir, "knowledge", "ontology", "schema-registry.yaml"),
      [
        'schema: "knowledge/schema-registry@1"',
        "relationTypes: []",
        "entityKinds: []",
        "epistemicVocabulary:",
        "  canonical: [verified]",
        "  nonCanonical: [draft]",
        "governanceLog: []",
        "",
      ].join("\n"),
    );
    mkdirSync(join(workspaceDir, "tools"), { recursive: true });
    writeFileSync(
      join(workspaceDir, "tools", "kernel.config.ts"),
      'import { p } from "@warpgogol/werkstatt-knowledge";\nexport default [p];\n',
    );

    const result = await runKnowledgeCheckGate(
      makeCtx({ flags: { "allow-pending": true } } as unknown as PluginHookContext & {
        flags: Record<string, unknown>;
      }),
    );
    expect(result.success).toBe(true);
    const data = result.data as { unimplemented: string[] };
    expect(data.unimplemented.length).toBeGreaterThan(0);
  });

  it("reports perCheck status for all validators", async () => {
    const result = await runKnowledgeCheckGate(makeCtx());
    const data = result.data as { perCheck: Record<string, string> };
    expect(data.perCheck["knowledge.source.status"]).toBeDefined();
    expect(data.perCheck["knowledge.source.verify"]).toBeDefined();
    expect(data.perCheck["knowledge.verify"]).toBeDefined();
    expect(data.perCheck["knowledge.audit"]).toBeDefined();
    expect(data.perCheck["knowledge.coverage"]).toBeDefined();
    expect(data.perCheck["knowledge.materialize.verify"]).toBeDefined();
    expect(data.perCheck["knowledge.release.check"]).toBeDefined();
  });

  it("aggregates diagnostics from implemented validators and fails closed (AC-6)", async () => {
    // KB workshop with a schema-invalid canonical record → knowledge.verify fails
    mkdirSync(join(workspaceDir, "knowledge", "entities"), { recursive: true });
    writeFileSync(
      join(workspaceDir, "knowledge", "entities", "broken.yaml"),
      'schema: "knowledge/entity@1"\nid: 42\n',
    );
    writeFileSync(
      join(workspaceDir, "knowledge", "manifest.yaml"),
      'schema: "knowledge/manifest@1"\nid: my-kb\nname: "My KB"\nmodelVersion: "1.0.0"\n',
    );

    const result = await runKnowledgeCheckGate(
      makeCtx({ flags: { "allow-pending": true } } as unknown as PluginHookContext & {
        flags: Record<string, unknown>;
      }),
    );
    const data = result.data as {
      perCheck: Record<string, string>;
      violations: { message: string }[];
    };
    expect(data.perCheck["knowledge.verify"]).toBe("fail");
    expect(data.perCheck["knowledge.audit"]).toBeDefined();
    expect(data.perCheck["knowledge.coverage"]).toBeDefined();
    expect(data.violations.length).toBeGreaterThan(0);
    expect(result.success).toBe(false);
  });

  it("implemented validators report pass on clean workspace", async () => {
    mkdirSync(join(workspaceDir, "knowledge", "ontology"), { recursive: true });
    writeFileSync(
      join(workspaceDir, "knowledge", "manifest.yaml"),
      'schema: "knowledge/manifest@1"\nid: my-kb\nname: "My KB"\nmodelVersion: "1.0.0"\n',
    );
    writeFileSync(
      join(workspaceDir, "knowledge", "ontology", "schema-registry.yaml"),
      [
        'schema: "knowledge/schema-registry@1"',
        "relationTypes: []",
        "entityKinds: []",
        "epistemicVocabulary:",
        "  canonical: [verified]",
        "  nonCanonical: [draft]",
        "governanceLog: []",
        "",
      ].join("\n"),
    );
    mkdirSync(join(workspaceDir, "tools"), { recursive: true });
    writeFileSync(
      join(workspaceDir, "tools", "kernel.config.ts"),
      'import { p } from "@warpgogol/werkstatt-knowledge";\nexport default [p];\n',
    );

    const result = await runKnowledgeCheckGate(
      makeCtx({ flags: { "allow-pending": true } } as unknown as PluginHookContext & {
        flags: Record<string, unknown>;
      }),
    );
    const data = result.data as { perCheck: Record<string, string> };
    expect(data.perCheck["knowledge.verify"]).toBe("pass");
    expect(data.perCheck["knowledge.audit"]).toBe("pass");
    expect(data.perCheck["knowledge.coverage"]).toBe("pass");
  });

  it("source.verify runs and reports violations for missing metadata", async () => {
    const sourceDir = join(tmpDir, "my-kb-source");
    mkdirSync(sourceDir, { recursive: true });
    const unitDir = join(sourceDir, "unit-a");
    mkdirSync(unitDir, { recursive: true });
    writeFileSync(join(unitDir, "README.md"), "# Test\n");
    // No package.json — missing name/version metadata

    const result = await runKnowledgeCheckGate(makeCtx());
    const data = result.data as {
      perCheck: Record<string, string>;
      violations: { message: string }[];
    };
    expect(data.perCheck["knowledge.source.verify"]).toBe("fail");
    expect(data.violations.length).toBeGreaterThan(0);
  });
});
