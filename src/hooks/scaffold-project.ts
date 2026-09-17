/*
<MODULE_CONTRACT>
<purpose>hooks.scaffoldProject — creates the KB-side Turborepo skeleton for a new knowledge project.</purpose>


<non-goals>
  <item>Does not populate, update, clone, or mutate the sibling source bundle.</item>
  <item>Does not install dependencies — the consumer runs pnpm install after scaffold.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { writeFileIfChanged } from "@warpgogol/werkstatt-engine/kernel";
import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";

const MANIFEST_YAML = `# Knowledge manifest — canonical dataset identity (knowledge/manifest@1)
schema: knowledge/manifest@1
id: my-knowledge-base
name: My Knowledge Base
modelVersion: 1.0.0
description: ""
license: ""
`;

const SCHEMA_REGISTRY_YAML = `# Ontology schema registry (knowledge/schema-registry@1)
# relationTypes is a closed vocabulary: every entry needs domain, range, and a
# registered inverse pair. entityKinds is open — extend per project.
schema: knowledge/schema-registry@1
relationTypes: []
entityKinds: []
epistemicVocabulary:
  canonical: [verified, supported, contested, deprecated]
  nonCanonical: [draft, speculative]
governanceLog: []
`;

const CONFIG_YAML = `# Knowledge operational configuration
# See docs/specs/werkstatt-knowledge-plugin/SPEC-v1.0.md for configuration reference
source:
  rootPattern: "../<kb-id>-source"
extractors: []
projections:
  - name: web
    path: apps/web
  - name: mcp
    path: apps/mcp
`;

const TURBO_JSON = `{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".generated/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
`;

const PNPM_WORKSPACE_YAML = `packages:
  - "apps/*"
  - "packages/*"
`;

const GITIGNORE = `node_modules/
dist/
.generated/
.turbo/
.cache/
`;

export async function runKnowledgeScaffoldProject(ctx: PluginHookContext): Promise<HookResult> {
  const projectPath = ctx.workpiecePath ?? ctx.workspaceRoot;
  const projectId =
    (ctx as PluginHookContext & { projectId?: string }).projectId ?? "my-knowledge-base";

  ctx.logger.info(`scaffold-project: creating knowledge project at ${projectPath}`);

  try {
    await mkdir(join(projectPath, "knowledge", "ontology"), { recursive: true });
    await mkdir(join(projectPath, "staging"), { recursive: true });
    await mkdir(join(projectPath, "laboratory"), { recursive: true });
    await mkdir(join(projectPath, "projections"), { recursive: true });
    await mkdir(join(projectPath, "apps"), { recursive: true });
    await mkdir(join(projectPath, "packages"), { recursive: true });
    await mkdir(join(projectPath, "docs", "rfc"), { recursive: true });
    await mkdir(join(projectPath, "docs", "adr"), { recursive: true });

    await writeFileIfChanged(join(projectPath, "knowledge", "manifest.yaml"), MANIFEST_YAML);
    await writeFileIfChanged(
      join(projectPath, "knowledge", "ontology", "schema-registry.yaml"),
      SCHEMA_REGISTRY_YAML,
    );
    await writeFileIfChanged(join(projectPath, "knowledge.config.yaml"), CONFIG_YAML);
    await writeFileIfChanged(join(projectPath, "turbo.json"), TURBO_JSON);
    await writeFileIfChanged(join(projectPath, "pnpm-workspace.yaml"), PNPM_WORKSPACE_YAML);
    await writeFileIfChanged(join(projectPath, ".gitignore"), GITIGNORE);

    ctx.logger.info("scaffold-project: project created successfully");
    return {
      success: true,
      data: {
        projectPath,
        projectId,
        filesCreated: [
          "knowledge/manifest.yaml",
          "knowledge/ontology/schema-registry.yaml",
          "knowledge.config.yaml",
          "turbo.json",
          "pnpm-workspace.yaml",
          ".gitignore",
        ],
        directoriesCreated: [
          "knowledge/",
          "staging/",
          "laboratory/",
          "projections/",
          "apps/",
          "packages/",
          "docs/rfc/",
          "docs/adr/",
        ],
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx.logger.error(`scaffold-project: failed: ${message}`);
    return {
      success: false,
      errors: [`scaffoldProject failed: ${message}`],
    };
  }
}
