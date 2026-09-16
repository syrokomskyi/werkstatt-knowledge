/*
<MODULE_CONTRACT>
<purpose>hooks.scaffoldProject — creates the KB-side Turborepo skeleton.</purpose>


<non-goals>
  <item>Does not populate, update, clone, or mutate the sibling source bundle.</item>
  <item>Does not install dependencies — the consumer runs pnpm install after scaffold.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { writeFileIfChanged } from "@warpgogol/werkstatt-engine/kernel";
import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";

const MANIFEST_YAML = `# Knowledge manifest — canonical dataset identity
id: ""
name: ""
modelVersion: "1.0.0"
description: ""
license: ""
`;

const SCHEMA_REGISTRY_YAML = `# Ontology schema registry
# Register canonical record schemas here
schemas: []
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
  const projectId = (ctx as PluginHookContext & { projectId?: string }).projectId ?? "my-knowledge-base";

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
    await writeFileIfChanged(join(projectPath, "knowledge", "ontology", "schema-registry.yaml"), SCHEMA_REGISTRY_YAML);
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
