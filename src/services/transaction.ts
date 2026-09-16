/*
<MODULE_CONTRACT>
<purpose>TransactionService — skeleton for canonical mutation transactions and promotion.</purpose>

<non-goals>
  <item>Skeleton — throws NotImplementedError when called.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial TransactionService skeleton.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
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
