/*
<MODULE_CONTRACT>
<purpose>Knowledge path conventions for the werkstatt-knowledge plugin.</purpose>
<keywords>knowledge, paths, plugin, evidence</keywords>
<non-goals>
  <item>Do not import from any @warpgogol/* package — pure path constants only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial knowledge path conventions per SPEC-v1.0 section 3.</item>
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
