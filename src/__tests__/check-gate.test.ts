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
    expect(data.unimplemented).toContain("knowledge.verify");
    expect(data.unimplemented).toContain("knowledge.audit");
    expect(data.unimplemented).toContain("knowledge.coverage");
    expect(data.unimplemented).toContain("knowledge.materialize.verify");
    expect(data.unimplemented).toContain("knowledge.release.check");
    expect(data.perCheck["knowledge.verify"]).toBe("pending");
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
