/*
<MODULE_CONTRACT>
<purpose>knowledge-extract module — registers extractor and refresh commands.</purpose>
<keywords>extract, refresh, knowledge</keywords>
<non-goals>
  <item>Do not implement full domain logic — Phase 1 stubs only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial knowledge-extract module per SPEC-v1.0 section 4.</item>
</CHANGE_SUMMARY>
*/


import { createExtractListCommand } from "./list.ts";
import { createExtractRunCommand } from "./run.ts";
import { createExtractVerifyCommand } from "./verify.ts";
import { createRefreshPrepareCommand } from "./refresh-prepare.ts";
import { createRefreshApplyCommand } from "./refresh-apply.ts";
import type { ModuleExport } from "@warpgogol/werkstatt-engine/runtime/desired-state";

export function createKnowledgeExtractModule(): ModuleExport {
  return {
    name: "knowledge-extract",
    version: "0.1.0",
      declarations: [],
  commands: [
      createExtractListCommand(),
      createExtractRunCommand(),
      createExtractVerifyCommand(),
      createRefreshPrepareCommand(),
      createRefreshApplyCommand(),
    ],
  pipelines: [

  ]};
}
