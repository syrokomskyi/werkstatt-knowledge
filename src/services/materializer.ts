/*
<MODULE_CONTRACT>
<purpose>MaterializerService — skeleton for materialization and projection operations.</purpose>
<keywords>materialize, projection, knowledge, service</keywords>
<non-goals>
  <item>Skeleton — throws NotImplementedError when called.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial MaterializerService skeleton.</item>
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
