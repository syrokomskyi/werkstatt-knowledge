/*
<MODULE_CONTRACT>
<purpose>knowledge-source module — registers source boundary commands.</purpose>
<keywords>source, scan, bind, verify, knowledge</keywords>
<non-goals>
  <item>Do not implement full domain logic — Phase 1 stubs only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial knowledge-source module per SPEC-v1.0 section 4.</item>
</CHANGE_SUMMARY>
*/


import { createSourceScanCommand } from "./scan.ts";
import { createSourceStatusCommand } from "./status.ts";
import { createSourceBindCommand } from "./bind.ts";
import { createSourceVerifyCommand } from "./verify.ts";
import type { ModuleExport } from "@warpgogol/werkstatt-engine/runtime/desired-state";

export function createKnowledgeSourceModule(): ModuleExport {
  return {
    name: "knowledge-source",
    version: "0.1.0",
      declarations: [],
  commands: [
      createSourceScanCommand(),
      createSourceStatusCommand(),
      createSourceBindCommand(),
      createSourceVerifyCommand(),
    ],
  pipelines: [

  ]};
}
