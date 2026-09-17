import { describe, it, expect } from "vitest";
import {
  KNOWLEDGE_COMMANDS,
  declareKnowledgeCommand,
  buildModule,
} from "../commands/knowledge-commands.ts";
import { KNOWLEDGE_INVARIANTS } from "../invariants/knowledge-invariants.ts";

describe("KNOWLEDGE_COMMANDS manifest", () => {
  it("declares all 23 commands", () => {
    expect(KNOWLEDGE_COMMANDS).toHaveLength(23);
  });

  it("all commands have unique names", () => {
    const names = KNOWLEDGE_COMMANDS.map((c) => c.name);
    const unique = new Set(names);
    expect(unique.size).toBe(23);
  });

  it("all commands are workspace-scoped and non-cacheable", () => {
    for (const cmd of KNOWLEDGE_COMMANDS) {
      expect(cmd.scope).toBe("workspace");
      expect(cmd.cacheable).toBe(false);
    }
  });

  it("all commands declare invariants array", () => {
    for (const cmd of KNOWLEDGE_COMMANDS) {
      expect(Array.isArray(cmd.invariants)).toBe(true);
    }
  });

  it("validator commands declare contract and rules (DNA-91)", () => {
    const validators = KNOWLEDGE_COMMANDS.filter(
      (c) =>
        c.name.endsWith(".validate") || c.name.endsWith(".check") || c.name.endsWith(".verify"),
    );
    expect(validators).toHaveLength(6);
    for (const v of validators) {
      expect(v.contract).toBe("knowledge");
      expect(v.rules).toBeDefined();
      expect(v.rules!.length).toBeGreaterThan(0);
    }
  });

  it("no command writes to source bundle (KNO-004)", () => {
    for (const cmd of KNOWLEDGE_COMMANDS) {
      expect(cmd.writes ?? []).not.toContain("../*-source/**");
    }
  });

  it("all invariant check references map to manifest commands", () => {
    const commandNames = new Set(KNOWLEDGE_COMMANDS.map((c) => c.name));
    for (const inv of KNOWLEDGE_INVARIANTS) {
      if (inv.check) {
        expect(commandNames.has(inv.check)).toBe(true);
      }
    }
  });

  it("gate validator list equals unique invariant checks", () => {
    const invariantChecks = [...new Set(KNOWLEDGE_INVARIANTS.map((i) => i.check).filter(Boolean))];
    const gateValidators = [
      "knowledge.source.scan",
      "knowledge.source.status",
      "knowledge.source.verify",
      "knowledge.verify",
      "knowledge.audit",
      "knowledge.coverage",
      "knowledge.extract.run",
      "knowledge.materialize.verify",
      "knowledge.release.check",
      "knowledge.promote",
    ];
    expect(gateValidators.sort()).toEqual(invariantChecks.sort());
  });
});

describe("declareKnowledgeCommand", () => {
  it("returns pending result for commands without loader", async () => {
    const entry = KNOWLEDGE_COMMANDS.find((c) => c.name === "knowledge.promote")!;
    const cmd = declareKnowledgeCommand(entry);
    expect(cmd.name).toBe("knowledge.promote");
    expect(cmd.scope).toBe("workspace");
    expect(cmd.cacheable).toBe(false);
    expect(entry.invariants).toContain("KNO-026");

    const result = await cmd.execute({ argv: [], flags: {} }, {
      workspaceRoot: "/tmp/test",
      logger: { info: () => {}, warn: () => {}, error: () => {} },
    } as unknown as Parameters<typeof cmd.execute>[1]);
    if (!result) throw new Error("expected result");
    expect(result.exitCode).toBe(1);
    expect((result.data as Record<string, unknown>)?.status).toBe("pending");
    expect(result.nextSteps).toBeDefined();
    expect(result.nextSteps![0].kind).toBe("required");
  });

  it("returns real result for commands with loader", async () => {
    const entry = KNOWLEDGE_COMMANDS.find((c) => c.name === "knowledge.source.scan")!;
    const cmd = declareKnowledgeCommand(entry);
    expect(cmd.name).toBe("knowledge.source.scan");
    expect(cmd.reads).toContain("../*-source/**");
  });
});

describe("buildModule", () => {
  it("builds knowledge-source module with 4 commands", () => {
    const mod = buildModule("knowledge-source", "0.1.0");
    expect(mod.name).toBe("knowledge-source");
    expect(mod.version).toBe("0.1.0");
    expect(mod.commands).toHaveLength(4);
    const names = mod.commands.map((c) => c.name);
    expect(names).toContain("knowledge.source.scan");
    expect(names).toContain("knowledge.source.status");
    expect(names).toContain("knowledge.source.bind");
    expect(names).toContain("knowledge.source.verify");
  });

  it("builds knowledge-core module with 7 commands", () => {
    const mod = buildModule("knowledge-core", "0.1.0");
    expect(mod.commands).toHaveLength(7);
  });

  it("builds knowledge-extract module with 5 commands", () => {
    const mod = buildModule("knowledge-extract", "0.1.0");
    expect(mod.commands).toHaveLength(5);
  });

  it("builds knowledge-materialize module with 4 commands", () => {
    const mod = buildModule("knowledge-materialize", "0.1.0");
    expect(mod.commands).toHaveLength(4);
  });

  it("builds knowledge-release module with 3 commands", () => {
    const mod = buildModule("knowledge-release", "0.1.0");
    expect(mod.commands).toHaveLength(3);
  });
});
