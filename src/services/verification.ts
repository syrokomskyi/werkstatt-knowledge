/*
<MODULE_CONTRACT>
<purpose>VerificationService — skeleton for canonical structural and evidence validation.</purpose>
<keywords>verify, canonical, evidence, knowledge, service</keywords>
<non-goals>
  <item>Skeleton — throws NotImplementedError when called.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial VerificationService skeleton.</item>
</CHANGE_SUMMARY>
*/

import { NotImplementedError } from "./context.ts";
import type { KnowledgeContext } from "./context.ts";

export interface VerificationViolation {
  ruleId: string;
  message: string;
  path?: string;
}

export interface VerificationService {
  verify(ctx: KnowledgeContext): VerificationViolation[];
  checkEvidence(ctx: KnowledgeContext): VerificationViolation[];
  checkRelations(ctx: KnowledgeContext): VerificationViolation[];
}

export const verificationService: VerificationService = {
  verify(_ctx: KnowledgeContext): VerificationViolation[] {
    throw new NotImplementedError("verificationService.verify");
  },
  checkEvidence(_ctx: KnowledgeContext): VerificationViolation[] {
    throw new NotImplementedError("verificationService.checkEvidence");
  },
  checkRelations(_ctx: KnowledgeContext): VerificationViolation[] {
    throw new NotImplementedError("verificationService.checkRelations");
  },
};
