/*
<MODULE_CONTRACT>
<purpose>knowledge-release module — registers release check, evidence, and manifest commands.</purpose>
<keywords>release, evidence, manifest, knowledge</keywords>
<non-goals>
  <item>Do not implement full domain logic — Phase 1 stubs only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial knowledge-release module per SPEC-v1.0 section 4.</item>
</CHANGE_SUMMARY>
*/


import { createReleaseCheckCommand } from "./check.ts";
import { createReleaseEvidenceCommand } from "./evidence.ts";
import { createReleaseManifestCommand } from "./manifest.ts";
import type { ModuleExport } from "@warpgogol/werkstatt-engine/runtime/desired-state";

export function createKnowledgeReleaseModule(): ModuleExport {
  return {
    name: "knowledge-release",
    version: "0.1.0",
      declarations: [],
  commands: [
      createReleaseCheckCommand(),
      createReleaseEvidenceCommand(),
      createReleaseManifestCommand(),
    ],
  pipelines: [

  ]};
}
