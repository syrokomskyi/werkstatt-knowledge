/*
<MODULE_CONTRACT>
<purpose>knowledge-release module — registers release check, evidence, and manifest commands.</purpose>

<non-goals>
  <item>Do not implement full domain logic — delegates to services via manifest.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: rewrite to use KNOWLEDGE_COMMANDS manifest.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import { buildModule } from "../commands/knowledge-commands.ts";
import type { ModuleExport } from "@warpgogol/werkstatt-engine/runtime/desired-state";

export function createKnowledgeReleaseModule(): ModuleExport {
  return buildModule("knowledge-release", "0.1.0");
}
