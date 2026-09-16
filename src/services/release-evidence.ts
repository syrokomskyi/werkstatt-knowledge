/*
<MODULE_CONTRACT>
<purpose>ReleaseEvidenceService — skeleton for release evidence and manifest production.</purpose>

<non-goals>
  <item>Skeleton — throws NotImplementedError when called.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial ReleaseEvidenceService skeleton.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
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
