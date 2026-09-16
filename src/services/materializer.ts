/*
<MODULE_CONTRACT>
<purpose>MaterializerService — skeleton for materialization and projection operations.</purpose>

<non-goals>
  <item>Skeleton — throws NotImplementedError when called.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial MaterializerService skeleton.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import { NotImplementedError } from "./context.ts";
import type { KnowledgeContext } from "./context.ts";

export interface MaterializationResult {
  canonicalHash: string;
  modelVersion: string;
  outputDir: string;
}

export interface MaterializerService {
  materialize(ctx: KnowledgeContext): MaterializationResult;
  verify(ctx: KnowledgeContext): unknown[];
  projectionStatus(ctx: KnowledgeContext): unknown;
  projectionBuild(ctx: KnowledgeContext): unknown;
}

export const materializerService: MaterializerService = {
  materialize(_ctx: KnowledgeContext): MaterializationResult {
    throw new NotImplementedError("materializerService.materialize");
  },
  verify(_ctx: KnowledgeContext): unknown[] {
    throw new NotImplementedError("materializerService.verify");
  },
  projectionStatus(_ctx: KnowledgeContext): unknown {
    throw new NotImplementedError("materializerService.projectionStatus");
  },
  projectionBuild(_ctx: KnowledgeContext): unknown {
    throw new NotImplementedError("materializerService.projectionBuild");
  },
};
