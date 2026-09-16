/*
<MODULE_CONTRACT>
<purpose>knowledge-core module — registers canonical verification and governance commands.</purpose>
<keywords>core, verify, promote, transaction, knowledge</keywords>
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

export function createKnowledgeCoreModule(): ModuleExport {
  return buildModule("knowledge-core", "0.1.0");
}
