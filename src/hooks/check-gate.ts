/*
<MODULE_CONTRACT>
<purpose>hooks.checkGate — runs the complete knowledge check gate with fail-closed pending semantics.</purpose>


<non-goals>
  <item>Does not implement individual validator logic — orchestrates validators only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: fail-closed pending, --allow-pending, ordered validator list, Diagnostic output.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";
import type { Diagnostic } from "@warpgogol/werkstatt-engine/schemas";
import { KNOWLEDGE_COMMANDS } from "../commands/knowledge-commands.ts";
import { resolveKnowledgeContext } from "../services/context.ts";

export interface GateResult {
  success: boolean;
  violations: Diagnostic[];
  unimplemented: string[];
  perCheck: Record<string, "pass" | "fail" | "pending">;
}

const VALIDATOR_ORDER = [
  "knowledge.source.scan",
  "knowledge.source.status",
  "knowledge.source.verify",
  "knowledge.verify",
  "knowledge.audit",
  "knowledge.coverage",
  "knowledge.extract.run",
  "knowledge.materialize.verify",
  "knowledge.release.check",
  "knowledge.promote",
] as const;

export async function runKnowledgeCheckGate(ctx: PluginHookContext): Promise<HookResult> {
  const projectRoot = ctx.workpiecePath ?? ctx.workspaceRoot;
  const allowPending =
    (ctx as PluginHookContext & { flags?: Record<string, unknown> }).flags?.["allow-pending"] ===
    true;
  const kctx = resolveKnowledgeContext(projectRoot, {
    info: (msg: string) => ctx.logger.info(msg),
    warn: (msg: string) => ctx.logger.warn(msg),
    error: (msg: string) => ctx.logger.error(msg),
  });

  const perCheck: Record<string, "pass" | "fail" | "pending"> = {};
  const unimplemented: string[] = [];
  const violations: Diagnostic[] = [];

  for (const commandName of VALIDATOR_ORDER) {
    const entry = KNOWLEDGE_COMMANDS.find((e) => e.name === commandName);
    if (!entry) {
      perCheck[commandName] = "pending";
      unimplemented.push(commandName);
      continue;
    }

    if (!entry.loader) {
      perCheck[commandName] = "pending";
      unimplemented.push(commandName);
      continue;
    }

    try {
      const mod = await entry.loader();
      const result = await mod.run(kctx, { argv: [], flags: {} });
      const status = (result.data as Record<string, unknown> | undefined)?.status as
        "pass" | "fail" | "pending" | undefined;
      perCheck[commandName] = status ?? (result.exitCode === 0 ? "pass" : "fail");

      if (result.exitCode !== 0) {
        const data = result.data as Record<string, unknown> | undefined;
        const msgs = (data?.violations as string[] | undefined) ?? [
          result.summary ?? "unknown error",
        ];
        for (const msg of msgs) {
          violations.push({
            ruleId: commandName,
            severity: "error",
            message: `${commandName}: ${msg}`,
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      perCheck[commandName] = "fail";
      violations.push({
        ruleId: commandName,
        severity: "error",
        message: `${commandName}: ${message}`,
      });
    }
  }

  const hasPending = unimplemented.length > 0;
  const hasViolations = violations.length > 0;
  const success = !hasViolations && (allowPending || !hasPending);

  ctx.logger.info(
    `checkGate: ${Object.entries(perCheck)
      .map(([k, v]) => `${k.split(".").pop()}=${v}`)
      .join(", ")}`,
  );

  return {
    success,
    errors: violations.length > 0 ? violations.map((v) => v.message) : undefined,
    data: {
      success,
      perCheck,
      unimplemented,
      violations,
    } satisfies GateResult,
  };
}
