/*
<MODULE_CONTRACT>
<purpose>Barrel export for knowledge plugin hooks.</purpose>

<non-goals>
  <item>Do not re-export Node-only modules — this barrel is imported by the plugin entry.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

export { runKnowledgeMaterializeHook } from "./materialize.ts";
export { runKnowledgeBuildHook } from "./build.ts";
export { runKnowledgeCheckGate } from "./check-gate.ts";
export { runKnowledgeReleaseEvidenceHook } from "./release-evidence.ts";
export { runKnowledgeScaffoldProject } from "./scaffold-project.ts";
export { runHook } from "./run-hook.ts";
