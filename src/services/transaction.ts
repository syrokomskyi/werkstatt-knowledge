/*
<MODULE_CONTRACT>
<purpose>TransactionService — skeleton for canonical mutation transactions and promotion.</purpose>
<keywords>transaction, promote, knowledge, service</keywords>
<non-goals>
  <item>Skeleton — throws NotImplementedError when called.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial TransactionService skeleton.</item>
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
