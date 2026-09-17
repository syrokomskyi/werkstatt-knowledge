import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { KNOWLEDGE_COMMANDS } from "../commands/knowledge-commands.ts";
import { resolveKnowledgeContext } from "../services/context.ts";
import { makeKbWorkspace } from "./kb-fixture.ts";

let tmpDir: string;
let workspaceDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "knowledge-wired-"));
  workspaceDir = join(tmpDir, "my-kb");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const WIRED = [
  "knowledge.verify",
  "knowledge.status",
  "knowledge.coverage",
  "knowledge.audit",
  "knowledge.candidate.validate",
] as const;

describe("KNOWLEDGE_COMMANDS wiring (AC-4, AC-8)", () => {
  it("all five commands declare a loader", () => {
    for (const name of WIRED) {
      const entry = KNOWLEDGE_COMMANDS.find((e) => e.name === name);
      expect(entry, `${name} missing from KNOWLEDGE_COMMANDS`).toBeDefined();
      expect(entry!.loader, `${name} must declare a loader`).toBeDefined();
    }
  });

  it("knowledge.audit and knowledge.coverage declare contract + rules", () => {
    for (const name of ["knowledge.audit", "knowledge.coverage"] as const) {
      const entry = KNOWLEDGE_COMMANDS.find((e) => e.name === name)!;
      expect(entry.contract, `${name} must declare contract`).toBe("knowledge");
      expect(entry.rules?.length, `${name} must declare rules`).toBeGreaterThan(0);
    }
  });

  it("each wired command returns data.status !== pending (AC-8)", async () => {
    makeKbWorkspace(workspaceDir);
    const ctx = resolveKnowledgeContext(workspaceDir);
    for (const name of WIRED) {
      const entry = KNOWLEDGE_COMMANDS.find((e) => e.name === name)!;
      const mod = await entry.loader!();
      const result = await mod.run(ctx, { argv: [], flags: {} });
      const status = (result.data as Record<string, unknown>).status;
      expect(status, `${name} must not return pending`).not.toBe("pending");
      expect(["pass", "fail"]).toContain(status);
    }
  });
});
