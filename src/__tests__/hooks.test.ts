import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runKnowledgeMaterializeHook } from "../hooks/materialize.ts";
import { runKnowledgeBuildHook } from "../hooks/build.ts";
import { runKnowledgeReleaseEvidenceHook } from "../hooks/release-evidence.ts";
import { runKnowledgeScaffoldProject } from "../hooks/scaffold-project.ts";
import type { PluginHookContext } from "@warpgogol/werkstatt-shared/plugin";

let tmpDir: string;
let workspaceDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "knowledge-hooks-"));
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

describe("runKnowledgeMaterializeHook", () => {
  it("returns success:false when materializerService is not implemented", async () => {
    const result = await runKnowledgeMaterializeHook(makeCtx());
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain("materialize");
  });
});

describe("runKnowledgeBuildHook", () => {
  it("returns success:false when materializerService is not implemented", async () => {
    const result = await runKnowledgeBuildHook(makeCtx());
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain("build");
  });
});

describe("runKnowledgeReleaseEvidenceHook", () => {
  it("returns success:false when releaseEvidenceService is not implemented", async () => {
    const result = await runKnowledgeReleaseEvidenceHook(makeCtx());
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain("release-evidence");
  });
});

describe("runKnowledgeScaffoldProject", () => {
  it("creates project skeleton with all directories and files", async () => {
    const result = await runKnowledgeScaffoldProject(makeCtx());
    expect(result.success).toBe(true);
    const data = result.data as { filesCreated: string[]; directoriesCreated: string[] };
    expect(data.filesCreated).toContain("knowledge/manifest.yaml");
    expect(data.filesCreated).toContain("knowledge.config.yaml");
    expect(data.directoriesCreated).toContain("knowledge/");
    expect(data.directoriesCreated).toContain("staging/");
    expect(data.directoriesCreated).toContain("laboratory/");
  });
});
