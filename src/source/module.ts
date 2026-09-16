/*
<MODULE_CONTRACT>
<purpose>knowledge-source module — registers source scan, status, bind, and verify commands.</purpose>
<keywords>source, scan, knowledge</keywords>
<non-goals>
  <item>Do not implement full domain logic — delegates to services via manifest.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: rewrite to use KNOWLEDGE_COMMANDS manifest.</item>
</CHANGE_SUMMARY>
*/

import { buildModule } from "../commands/knowledge-commands.ts";
import type { ModuleExport } from "@warpgogol/werkstatt-engine/runtime/desired-state";

export function createKnowledgeSourceModule(): ModuleExport {
  return buildModule("knowledge-source", "0.1.0");
}
