/*
<MODULE_CONTRACT>
<purpose>TransactionService — the skeleton service for canonical mutation transactions and promotion.</purpose>

<non-goals>
  <item>Skeleton — throws NotImplementedError when called.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial TransactionService skeleton.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { NotImplementedError } from "./context.ts";
import type { KnowledgeContext } from "./context.ts";

export interface TransactionResult {
  transactionId: string;
  status: "committed" | "rolled-back";
}

export interface TransactionService {
  begin(ctx: KnowledgeContext): string;
  commit(ctx: KnowledgeContext, transactionId: string): TransactionResult;
  rollback(ctx: KnowledgeContext, transactionId: string): TransactionResult;
  promote(ctx: KnowledgeContext, transactionId: string): TransactionResult;
}

export const transactionService: TransactionService = {
  begin(_ctx: KnowledgeContext): string {
    throw new NotImplementedError("transactionService.begin");
  },
  commit(_ctx: KnowledgeContext, _transactionId: string): TransactionResult {
    throw new NotImplementedError("transactionService.commit");
  },
  rollback(_ctx: KnowledgeContext, _transactionId: string): TransactionResult {
    throw new NotImplementedError("transactionService.rollback");
  },
  promote(_ctx: KnowledgeContext, _transactionId: string): TransactionResult {
    throw new NotImplementedError("transactionService.promote");
  },
};
