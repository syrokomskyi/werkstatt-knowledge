/*
<MODULE_CONTRACT>
<purpose>knowledge-core module — registers the canonical verification and governance commands with the kernel.</purpose>

<non-goals>
  <item>Do not implement full domain logic — delegates to services via manifest.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: rewrite to use KNOWLEDGE_COMMANDS manifest.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { buildModule } from "../commands/knowledge-commands.ts";
import type { ModuleExport } from "@warpgogol/werkstatt-engine/runtime/desired-state";

export function createKnowledgeCoreModule(): ModuleExport {
  return buildModule("knowledge-core", "0.1.0");
}
