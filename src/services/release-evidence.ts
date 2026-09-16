/*
<MODULE_CONTRACT>
<purpose>ReleaseEvidenceService — skeleton for release evidence and manifest production.</purpose>
<keywords>release, evidence, manifest, knowledge, service</keywords>
<non-goals>
  <item>Skeleton — throws NotImplementedError when called.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial ReleaseEvidenceService skeleton.</item>
</CHANGE_SUMMARY>
*/

import { NotImplementedError } from "./context.ts";
import type { KnowledgeContext } from "./context.ts";

export interface ReleaseEvidence {
  datasetId: string;
  modelVersion: string;
  canonicalHash: string;
  recordCount: number;
}

export interface ReleaseEvidenceService {
  check(ctx: KnowledgeContext): unknown[];
  produceEvidence(ctx: KnowledgeContext): ReleaseEvidence;
  produceManifest(ctx: KnowledgeContext): unknown;
}

export const releaseEvidenceService: ReleaseEvidenceService = {
  check(_ctx: KnowledgeContext): unknown[] {
    throw new NotImplementedError("releaseEvidenceService.check");
  },
  produceEvidence(_ctx: KnowledgeContext): ReleaseEvidence {
    throw new NotImplementedError("releaseEvidenceService.produceEvidence");
  },
  produceManifest(_ctx: KnowledgeContext): unknown {
    throw new NotImplementedError("releaseEvidenceService.produceManifest");
  },
};
