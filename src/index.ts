/*
<MODULE_CONTRACT>
<purpose>Plugin index entry for werkstatt-knowledge — the evidence-backed knowledge systems stack.</purpose>


<non-goals>
  <item>Do not import from @warpgogol/werkstatt-site or any other stack plugin.</item>
  <item>Do not import from the engine package beyond plugin contract types.</item>
  <item>Do not add deploy adapters — SPEC-v1.0 section 7 explicitly requires empty.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import type { WerkstattPlugin } from "@warpgogol/werkstatt-shared/plugin";
import { knowledgePathConventions } from "./paths/knowledge-paths.ts";
import { KNOWLEDGE_INVARIANTS } from "./invariants/knowledge-invariants.ts";
import { runKnowledgeMaterializeHook } from "./hooks/materialize.ts";
import { runKnowledgeBuildHook } from "./hooks/build.ts";
import { runKnowledgeCheckGate } from "./hooks/check-gate.ts";
import { runKnowledgeReleaseEvidenceHook } from "./hooks/release-evidence.ts";
import { runKnowledgeScaffoldProject } from "./hooks/scaffold-project.ts";

export const werkstattKnowledgePlugin: WerkstattPlugin = {
  schema: "werkstatt/plugin@1",
  id: "werkstatt-knowledge",
  profileId: "knowledge-typescript-turborepo",
  paths: knowledgePathConventions,
  moduleLoaders: {
    "knowledge-source": () =>
      import("./source/module.ts").then((m) => m.createKnowledgeSourceModule()),
    "knowledge-core": () => import("./core/module.ts").then((m) => m.createKnowledgeCoreModule()),
    "knowledge-extract": () =>
      import("./extract/module.ts").then((m) => m.createKnowledgeExtractModule()),
    "knowledge-materialize": () =>
      import("./materialize/module.ts").then((m) => m.createKnowledgeMaterializeModule()),
    "knowledge-release": () =>
      import("./release/module.ts").then((m) => m.createKnowledgeReleaseModule()),
  },
  hooks: {
    materialize: runKnowledgeMaterializeHook,
    build: runKnowledgeBuildHook,
    checkGate: runKnowledgeCheckGate,
    releaseEvidence: runKnowledgeReleaseEvidenceHook,
    scaffoldProject: runKnowledgeScaffoldProject,
  },
  invariants: KNOWLEDGE_INVARIANTS,
};

export { knowledgePathConventions, KNOWLEDGE_PATHS } from "./paths/knowledge-paths.ts";
export { KNOWLEDGE_INVARIANTS } from "./invariants/knowledge-invariants.ts";
