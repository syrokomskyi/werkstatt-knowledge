# AGENTS.md

## Project

`@warpgogol/werkstatt-knowledge` — Werkstatt plugin for evidence-backed knowledge systems. Implements `werkstatt/plugin@1` with `profileId: "knowledge-typescript-turborepo"`. Provides 5 kernel modules (source, core, extract, materialize, release), 5 lifecycle hooks (materialize, build, checkGate, releaseEvidence, scaffoldProject), and KNO-001..028 stack invariants.

Priorities when modifying:

1. Preserve plugin contract compliance (`werkstatt/plugin@1`).
2. Keep knowledge domain logic isolated from plugin entry object for future certification migration.
3. Make small, typed, and testable changes.
4. Do not break invariants KNO-001..028 or existing commands.

## Stack

- TypeScript (strict)
- Turborepo (workspace orchestration)
- pnpm

Use existing versions from `package.json`. Do not add dependencies if the task can be solved with TypeScript or already-installed packages.

## Commands

```bash
pnpm install
pnpm run lint
pnpm run typecheck
pnpm run test
```

Before finishing a change, always run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
```

If commands fail due to environment, state this explicitly — do not claim verification passed.

## Structure

```text
src/
  index.ts                          # Plugin entry — werkstattKnowledgePlugin
  commands/
    knowledge-commands.ts           # KNOWLEDGE_COMMANDS manifest + declareKnowledgeCommand + buildModule
  schemas/
    canonical-records.ts            # RFC-1107 — Zod schemas for 5 record types + Claim + knowledge/manifest@1, recordSchemasFor(layer)
    ontology-registry.ts            # RFC-1107 — knowledge/schema-registry@1 schema incl. inverse-pair consistency
    record-io.ts                    # RFC-1107 — YAML load/parse helpers returning Diagnostics, never throws
  services/
    context.ts                      # KnowledgeContext, resolveKnowledgeContext, KnowledgeConfigError, NotImplementedError
    source.ts                       # SourceService — resolveRoot, scanUnits, fingerprint, fingerprintAt, compareBindings (implemented)
    verification.ts                 # VerificationService — verify/checkEvidence/checkRelations/status (implemented, RFC-1108)
    audit.ts                        # AuditService — decisionRef resolution + secret scan (implemented, RFC-1108)
    coverage.ts                     # CoverageService — denominator/verifier rules (implemented, RFC-1108)
    transaction.ts                  # TransactionService — skeleton (NotImplementedError)
    extractor-registry.ts           # ExtractorRegistryService — skeleton (NotImplementedError)
    materializer.ts                 # MaterializerService — skeleton (NotImplementedError)
    release-evidence.ts             # ReleaseEvidenceService — skeleton (NotImplementedError)
  paths/
    knowledge-paths.ts              # KNOWLEDGE_PATHS + derived knowledgePathConventions
  invariants/
    knowledge-invariants.ts         # KNO-001..028 stack invariant declarations
  source/
    module.ts                       # knowledge-source module registration (manifest-driven)
    scan.ts                         # knowledge.source.scan handler (delegates to SourceService)
    status.ts                       # knowledge.source.status handler (delegates to SourceService)
    bind.ts                         # knowledge.source.bind handler (delegates to SourceService)
    verify.ts                       # knowledge.source.verify handler (delegates to SourceService)
  core/
    module.ts                       # knowledge-core module registration (manifest-driven)
    verify.ts                       # knowledge.verify handler (delegates to VerificationService)
    status.ts                       # knowledge.status handler (delegates to VerificationService)
    coverage.ts                     # knowledge.coverage handler (delegates to CoverageService)
    audit.ts                        # knowledge.audit handler (delegates to AuditService)
    candidate-validate.ts           # knowledge.candidate.validate handler (candidates scope)
  extract/
    module.ts                       # knowledge-extract module registration (manifest-driven)
  materialize/
    module.ts                       # knowledge-materialize module registration (manifest-driven)
  release/
    module.ts                       # knowledge-release module registration (manifest-driven)
  hooks/
    index.ts                        # Hooks barrel export
    run-hook.ts                     # runHook helper — calls services directly
    materialize.ts                  # hooks.materialize
    build.ts                        # hooks.build
    check-gate.ts                   # hooks.checkGate (fail-closed pending, --allow-pending)
    release-evidence.ts             # hooks.releaseEvidence
    scaffold-project.ts             # hooks.scaffoldProject
```

**Command registration discipline:** All 23 kernel commands are declared in `src/commands/knowledge-commands.ts` (`KNOWLEDGE_COMMANDS`). Each `*.module.ts` file filters the manifest by module name and maps entries via `declareKnowledgeCommand`. Commands without a `loader` return `status: "pending"` with `exitCode: 1` (fail-closed). To implement a command, add a `loader` thunk pointing at a handler file that delegates to a service in `src/services/`. When wiring a `loader` to a previously pending command, update stale `status: "pending"` assertions: `src/__tests__/manifest.test.ts` (the pending-result test must target a still-unwired command) and `src/__tests__/check-gate.test.ts` (unimplemented list; the `--allow-pending` fixture needs a minimal valid KB — manifest, registry, `tools/kernel.config.ts` — so implemented validators pass).

## Plugin contract

| Field | Value |
| --- | --- |
| `schema` | `werkstatt/plugin@1` |
| `id` | `werkstatt-knowledge` |
| `profileId` | `knowledge-typescript-turborepo` |
| `moduleLoaders` | `knowledge-source`, `knowledge-core`, `knowledge-extract`, `knowledge-materialize`, `knowledge-release` |
| `deployAdapters` | (none — v1 has no deploy adapters) |
| `hooks` | `materialize`, `build`, `checkGate`, `releaseEvidence`, `scaffoldProject` |
| `paths` | `knowledge` (contentDir), `.generated/knowledge/dist` (distDir), `knowledge/manifest.yaml` + `knowledge/ontology/schema-registry.yaml` (entryPoints) |
| `invariants` | KNO-001..028 |

## Architectural constraints

- Do NOT import from `@warpgogol/werkstatt-site` or any other stack plugin.
- Do NOT import from the engine package beyond plugin contract types and kernel types.
- Do NOT add deploy adapters — SPEC-v1.0 section 7 explicitly requires empty.
- Do NOT add new engine hooks — the hook list is closed at five.
- Do NOT add AI orchestration or skills inside the plugin.
- Keep knowledge domain logic isolated from the plugin entry object for future certification migration.

## RFC-0855

All 25 packets (000–240) are completed. The checked-in `werkstatt/plugin@1` entry is a **legacy code fact** — it still loads and functions, but is architecturally superseded. Do not add a plugin compatibility adapter, import this package into the engine, or enable untrusted production artifacts.

## Scripts

| Script        | Command                                   |
| ------------- | ----------------------------------------- |
| `lint`        | `pnpm exec eslint "src/**/*.ts"`          |
| `typecheck`   | `pnpm exec tsc -p tsconfig.json --noEmit` |
| `build`       | `pnpm exec tsc -p tsconfig.json --noEmit` |
| `build:check` | `pnpm exec tsc -p tsconfig.json --noEmit` |
| `test`        | `vitest run`                              |
| `test:watch`  | `vitest`                                  |

## Invariants

| ID | Description | Check |
| --- | --- | --- |
| KNO-001 | Canonical manifest id exists and is valid | `knowledge.verify` |
| KNO-002 | Source root resolves only as ../<kb-id>-source | `knowledge.source.scan` |
| KNO-003 | Registered source unit has valid README/package version metadata | `knowledge.source.verify` |
| KNO-004 | No KB operation writes/mutates source bundle/payload | `knowledge.source.verify` |
| KNO-005 | Current source fingerprint/version matches canonical binding for release | `knowledge.source.status` |
| KNO-006 | Source-controlled code is not executed by default extractor policy | `knowledge.extract.run` |
| KNO-007 | knowledge/ contains only schema-valid canonical record forms | `knowledge.verify` |
| KNO-008 | Canonical record ids are unique and keys/aliases do not collide | `knowledge.verify` |
| KNO-009 | All evidence resolves to current source binding | `knowledge.verify` |
| KNO-010 | Required semantic claims/relations have sufficient evidence/review | `knowledge.verify` |
| KNO-011 | All relation types are registered and domain/range valid | `knowledge.verify` |
| KNO-012 | Canonical epistemic status excludes speculation | `knowledge.verify` |
| KNO-013 | Canonical human-authored semantic language is English | `knowledge.verify` |
| KNO-014 | staging/ records are excluded from canonical export | `knowledge.verify` |
| KNO-015 | laboratory/ records cannot appear as canonical authority | `knowledge.verify` |
| KNO-016 | Global ontology/normative changes reference accepted RFC | `knowledge.audit` |
| KNO-017 | Cross-game concept admission/merge/split references accepted decision | `knowledge.audit` |
| KNO-018 | Coverage claims satisfy denominator/verifier rules | `knowledge.coverage` |
| KNO-019 | Materialized/projection canonical hash matches current canonical state | `knowledge.materialize.verify` |
| KNO-020 | No public/repository secrets detected | `knowledge.audit` |
| KNO-021 | Public release has explicit dataset license/publication metadata | `knowledge.release.check` |
| KNO-022 | Public evidence excerpts obey per-source publication policy | `knowledge.release.check` |
| KNO-023 | Generated similarity does not appear as an unreviewed canonical relation | `knowledge.verify` |
| KNO-024 | Workshop resolves werkstatt-knowledge as the sole current Werkstatt plugin | `knowledge.verify` |
| KNO-025 | Source bundle is outside npm/Turbo workspace globs | `knowledge.source.scan` |
| KNO-026 | Canonical mutation uses transaction/promotion pathway | `knowledge.promote` |
| KNO-027 | Materialization is deterministic for identical canonical input/builder version | `knowledge.materialize.verify` |
| KNO-028 | Open source-unit evidence uses resolvable repo/commit/path metadata when available | `knowledge.source.verify` |
