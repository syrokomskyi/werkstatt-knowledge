/*
<MODULE_CONTRACT>
<purpose>KNOWLEDGE_COMMANDS manifest — single source of truth for all knowledge kernel command metadata.</purpose>


<non-goals>
  <item>Does not implement command logic — loaders point at handler files that delegate to services.</item>
  <item>Does not export Data interfaces for unimplemented commands.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial KNOWLEDGE_COMMANDS manifest + declareKnowledgeCommand helper.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import type {
  KernelCommandResult,
  KernelCommandInput,
  KernelRuntimeContext,
} from "@warpgogol/werkstatt-engine/kernel/types";
import type {
  CommandDeclaration,
  ModuleExport,
} from "@warpgogol/werkstatt-engine/runtime/desired-state";
import type { KnowledgeContext } from "../services/context.ts";
import { resolveKnowledgeContext } from "../services/context.ts";

export interface KnowledgeCommandEntry {
  name: string;
  module: string;
  purpose: string;
  description: string;
  scope: "workspace";
  cacheable: false;
  reads?: string[];
  writes?: string[];
  contract?: string;
  rules?: string[];
  invariants: string[];
  loader?: () => Promise<{
    run: (ctx: KnowledgeContext, input: KernelCommandInput) => Promise<KernelCommandResult>;
  }>;
}

export const KNOWLEDGE_COMMANDS: KnowledgeCommandEntry[] = [
  {
    name: "knowledge.source.scan",
    module: "knowledge-source",
    purpose: "Resolve fixed sibling source root and list source units",
    description: "Resolve fixed sibling source root and list source units (KNO-002, KNO-025)",
    scope: "workspace",
    cacheable: false,
    reads: ["../*-source/**"],
    invariants: ["KNO-002", "KNO-025"],
    loader: () => import("../source/scan.ts").then((m) => m),
  },
  {
    name: "knowledge.source.status",
    module: "knowledge-source",
    purpose: "Check current source fingerprint drift against canonical bindings",
    description: "Check source fingerprint drift against canonical bindings (KNO-005)",
    scope: "workspace",
    cacheable: false,
    reads: ["../*-source/**", "knowledge/**"],
    invariants: ["KNO-005"],
    loader: () => import("../source/status.ts").then((m) => m),
  },
  {
    name: "knowledge.source.bind",
    module: "knowledge-source",
    purpose: "Bind source units to canonical knowledge records",
    description: "Bind source units to canonical knowledge records",
    scope: "workspace",
    cacheable: false,
    reads: ["../*-source/**"],
    writes: ["knowledge/**"],
    invariants: [],
    loader: () => import("../source/bind.ts").then((m) => m),
  },
  {
    name: "knowledge.source.verify",
    module: "knowledge-source",
    purpose: "Verify source unit metadata and immutability",
    description: "Verify source unit metadata and no source writes (KNO-003, KNO-004, KNO-028)",
    scope: "workspace",
    cacheable: false,
    reads: ["../*-source/**"],
    contract: "knowledge",
    rules: ["KNO-003", "KNO-004", "KNO-028"],
    invariants: ["KNO-003", "KNO-004", "KNO-028"],
    loader: () => import("../source/verify.ts").then((m) => m),
  },
  {
    name: "knowledge.verify",
    module: "knowledge-core",
    purpose: "Full canonical structural, evidence, and governance validation",
    description:
      "Full canonical verification: schema, ids, evidence, claims, relations, epistemic status (KNO-001, KNO-007..015, KNO-023..024)",
    scope: "workspace",
    cacheable: false,
    reads: ["knowledge/**", "staging/**", "laboratory/**"],
    contract: "knowledge",
    rules: [
      "KNO-001",
      "KNO-007",
      "KNO-008",
      "KNO-009",
      "KNO-010",
      "KNO-011",
      "KNO-012",
      "KNO-013",
      "KNO-014",
      "KNO-015",
      "KNO-023",
      "KNO-024",
    ],
    invariants: [
      "KNO-001",
      "KNO-007",
      "KNO-008",
      "KNO-009",
      "KNO-010",
      "KNO-011",
      "KNO-012",
      "KNO-013",
      "KNO-014",
      "KNO-015",
      "KNO-023",
      "KNO-024",
    ],
  },
  {
    name: "knowledge.status",
    module: "knowledge-core",
    purpose: "Report overall knowledge system status",
    description: "Report overall knowledge system status",
    scope: "workspace",
    cacheable: false,
    reads: ["knowledge/**"],
    invariants: [],
  },
  {
    name: "knowledge.coverage",
    module: "knowledge-core",
    purpose: "Check coverage claims against denominator and verifier rules",
    description: "Check coverage claims satisfy denominator and verifier rules (KNO-018)",
    scope: "workspace",
    cacheable: false,
    reads: ["knowledge/**"],
    invariants: ["KNO-018"],
  },
  {
    name: "knowledge.audit",
    module: "knowledge-core",
    purpose: "Audit ontology changes and detect secrets",
    description: "Audit ontology normative changes and detect secrets (KNO-016, KNO-017, KNO-020)",
    scope: "workspace",
    cacheable: false,
    reads: ["knowledge/**"],
    invariants: ["KNO-016", "KNO-017", "KNO-020"],
  },
  {
    name: "knowledge.candidate.validate",
    module: "knowledge-core",
    purpose: "Validate staging and laboratory candidates before promotion",
    description: "Validate staging and laboratory candidates before promotion",
    scope: "workspace",
    cacheable: false,
    reads: ["staging/**", "laboratory/**", "knowledge/**"],
    contract: "knowledge",
    rules: ["KNO-014", "KNO-015"],
    invariants: ["KNO-014", "KNO-015"],
  },
  {
    name: "knowledge.promote",
    module: "knowledge-core",
    purpose: "Promote a validated candidate to canonical via transaction",
    description: "Promote a validated candidate to canonical via transaction pathway (KNO-026)",
    scope: "workspace",
    cacheable: false,
    reads: ["staging/**", "laboratory/**"],
    writes: ["knowledge/**"],
    invariants: ["KNO-026"],
  },
  {
    name: "knowledge.transaction.status",
    module: "knowledge-core",
    purpose: "Report status of a canonical mutation transaction",
    description: "Report status of a canonical mutation transaction",
    scope: "workspace",
    cacheable: false,
    reads: ["knowledge/**"],
    invariants: [],
  },
  {
    name: "knowledge.extract.list",
    module: "knowledge-extract",
    purpose: "List registered extractors",
    description: "List registered extractors",
    scope: "workspace",
    cacheable: false,
    reads: ["knowledge.config.yaml"],
    invariants: [],
  },
  {
    name: "knowledge.extract.run",
    module: "knowledge-extract",
    purpose: "Run an extractor on source units",
    description: "Run an extractor on source units (KNO-006)",
    scope: "workspace",
    cacheable: false,
    reads: ["../*-source/**", "knowledge.config.yaml"],
    writes: ["staging/**"],
    invariants: ["KNO-006"],
  },
  {
    name: "knowledge.extract.verify",
    module: "knowledge-extract",
    purpose: "Verify extractor outputs against source bindings",
    description: "Verify extractor outputs against source bindings",
    scope: "workspace",
    cacheable: false,
    reads: ["staging/**", "../*-source/**"],
    contract: "knowledge",
    rules: ["KNO-009"],
    invariants: ["KNO-009"],
  },
  {
    name: "knowledge.refresh.prepare",
    module: "knowledge-extract",
    purpose: "Prepare a source refresh operation",
    description: "Prepare a source refresh operation",
    scope: "workspace",
    cacheable: false,
    reads: ["../*-source/**"],
    invariants: [],
  },
  {
    name: "knowledge.refresh.apply",
    module: "knowledge-extract",
    purpose: "Apply a prepared source refresh",
    description: "Apply a prepared source refresh",
    scope: "workspace",
    cacheable: false,
    reads: ["../*-source/**"],
    writes: ["staging/**"],
    invariants: [],
  },
  {
    name: "knowledge.materialize",
    module: "knowledge-materialize",
    purpose: "Compile verified canonical knowledge into materialized dataset",
    description: "Compile verified canonical knowledge into materialized dataset",
    scope: "workspace",
    cacheable: false,
    reads: ["knowledge/**"],
    writes: [".generated/knowledge/**"],
    invariants: [],
  },
  {
    name: "knowledge.materialize.verify",
    module: "knowledge-materialize",
    purpose: "Verify materialization hash matches current canonical state",
    description: "Verify materialization hash and determinism (KNO-019, KNO-027)",
    scope: "workspace",
    cacheable: false,
    reads: ["knowledge/**", ".generated/knowledge/**"],
    contract: "knowledge",
    rules: ["KNO-019", "KNO-027"],
    invariants: ["KNO-019", "KNO-027"],
  },
  {
    name: "knowledge.projection.status",
    module: "knowledge-materialize",
    purpose: "Report projection build status",
    description: "Report projection build status",
    scope: "workspace",
    cacheable: false,
    reads: [".generated/knowledge/**"],
    invariants: [],
  },
  {
    name: "knowledge.projection.build",
    module: "knowledge-materialize",
    purpose: "Build configured projection packages from materialization",
    description: "Build configured projection packages from materialization",
    scope: "workspace",
    cacheable: false,
    reads: [".generated/knowledge/**"],
    writes: [".generated/knowledge/projections/**"],
    invariants: [],
  },
  {
    name: "knowledge.release.check",
    module: "knowledge-release",
    purpose: "Check publication policy, license metadata, and evidence excerpt policy",
    description:
      "Check publication policy, license metadata, and evidence excerpt policy (KNO-021, KNO-022)",
    scope: "workspace",
    cacheable: false,
    reads: ["knowledge/**", "knowledge.config.yaml"],
    contract: "knowledge",
    rules: ["KNO-021", "KNO-022"],
    invariants: ["KNO-021", "KNO-022"],
  },
  {
    name: "knowledge.release.evidence",
    module: "knowledge-release",
    purpose: "Emit knowledge release evidence packet",
    description: "Emit knowledge release evidence packet",
    scope: "workspace",
    cacheable: false,
    reads: ["knowledge/**", ".generated/knowledge/**"],
    writes: [".generated/knowledge/evidence/**"],
    invariants: [],
  },
  {
    name: "knowledge.release.manifest",
    module: "knowledge-release",
    purpose: "Produce release manifest with dataset id and canonical hash",
    description: "Produce release manifest with dataset id and canonical hash",
    scope: "workspace",
    cacheable: false,
    reads: ["knowledge/**", ".generated/knowledge/**"],
    writes: [".generated/knowledge/manifest/**"],
    invariants: [],
  },
];

export function declareKnowledgeCommand(entry: KnowledgeCommandEntry): CommandDeclaration {
  return {
    name: entry.name,
    description: entry.description,
    scope: entry.scope,
    cacheable: entry.cacheable,
    reads: entry.reads,
    writes: entry.writes,
    contract: entry.contract,
    rules: entry.rules,
    async execute(_input: KernelCommandInput, context: KernelRuntimeContext) {
      const kctx = resolveKnowledgeContext(context.workspaceRoot, {
        info: (msg: string) => context.logger.info(msg),
        warn: (msg: string) => context.logger.warn(msg),
        error: (msg: string) => context.logger.error(msg),
      });

      if (!entry.loader) {
        return {
          data: {
            command: entry.name,
            status: "pending",
            message: `${entry.name} not yet implemented`,
          },
          exitCode: 1,
          summary: `${entry.name}: pending (unimplemented)`,
          nextSteps: [
            {
              action: `Add a loader to the KNOWLEDGE_COMMANDS entry for ${entry.name} in src/commands/knowledge-commands.ts`,
              kind: "required",
            },
          ],
        } satisfies KernelCommandResult;
      }

      const mod = await entry.loader();
      return mod.run(kctx, _input);
    },
  };
}

export function buildModule(moduleName: string, version: string): ModuleExport {
  const entries = KNOWLEDGE_COMMANDS.filter((e) => e.module === moduleName);
  return {
    name: moduleName,
    version,
    declarations: [],
    commands: entries.map((e) => declareKnowledgeCommand(e)),
    pipelines: [],
  };
}
