/*
<MODULE_CONTRACT>
<purpose>Knowledge path conventions for the werkstatt-knowledge plugin.</purpose>

<non-goals>
  <item>Do not import from any @warpgogol/* package — pure path constants only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import type { StackPathConventions } from "@warpgogol/werkstatt-shared/plugin";

export const KNOWLEDGE_PATHS = {
  contentDir: "knowledge",
  distDir: ".generated/knowledge/dist",
  manifest: "knowledge/manifest.yaml",
  schemaRegistry: "knowledge/ontology/schema-registry.yaml",
  stagingDir: "staging",
  laboratoryDir: "laboratory",
  projectionsDir: "projections",
  generatedDir: ".generated/knowledge",
  configYaml: "knowledge.config.yaml",
} as const;

export const knowledgePathConventions: StackPathConventions = {
  contentDir: KNOWLEDGE_PATHS.contentDir,
  distDir: KNOWLEDGE_PATHS.distDir,
  entryPoints: [KNOWLEDGE_PATHS.manifest, KNOWLEDGE_PATHS.schemaRegistry],
};
