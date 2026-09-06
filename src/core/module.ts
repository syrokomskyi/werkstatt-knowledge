/*
<MODULE_CONTRACT>
<purpose>knowledge-core module — registers canonical verification and governance commands.</purpose>
<keywords>core, verify, promote, transaction, knowledge</keywords>
<non-goals>
  <item>Do not implement full domain logic — Phase 1 stubs only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial knowledge-core module per SPEC-v1.0 section 4.</item>
</CHANGE_SUMMARY>
*/


import { createVerifyCommand } from "./verify.ts";
import { createStatusCommand } from "./status.ts";
import { createCoverageCommand } from "./coverage.ts";
import { createAuditCommand } from "./audit.ts";
import { createCandidateValidateCommand } from "./candidate-validate.ts";
import { createPromoteCommand } from "./promote.ts";
import { createTransactionStatusCommand } from "./transaction-status.ts";
import type { ModuleExport } from "@warpgogol/werkstatt-engine/runtime/desired-state";

export function createKnowledgeCoreModule(): ModuleExport {
  return {
    name: "knowledge-core",
    version: "0.1.0",
      declarations: [],
  commands: [
      createVerifyCommand(),
      createStatusCommand(),
      createCoverageCommand(),
      createAuditCommand(),
      createCandidateValidateCommand(),
      createPromoteCommand(),
      createTransactionStatusCommand(),
    ],
  pipelines: [

  ]};
}
