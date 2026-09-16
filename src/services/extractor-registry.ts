/*
<MODULE_CONTRACT>
<purpose>ExtractorRegistryService — skeleton for extractor listing and refresh operations.</purpose>
<keywords>extract, refresh, knowledge, service</keywords>
<non-goals>
  <item>Skeleton — throws NotImplementedError when called.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial ExtractorRegistryService skeleton.</item>
</CHANGE_SUMMARY>
*/

import { NotImplementedError } from "./context.ts";
import type { KnowledgeContext } from "./context.ts";

export interface ExtractorInfo {
  id: string;
  type: string;
  enabled: boolean;
}

export interface ExtractorRegistryService {
  list(ctx: KnowledgeContext): ExtractorInfo[];
  run(ctx: KnowledgeContext, extractorId: string): unknown;
  verify(ctx: KnowledgeContext): unknown[];
  refreshPrepare(ctx: KnowledgeContext): unknown;
  refreshApply(ctx: KnowledgeContext): unknown;
}

export const extractorRegistryService: ExtractorRegistryService = {
  list(_ctx: KnowledgeContext): ExtractorInfo[] {
    throw new NotImplementedError("extractorRegistryService.list");
  },
  run(_ctx: KnowledgeContext, _extractorId: string): unknown {
    throw new NotImplementedError("extractorRegistryService.run");
  },
  verify(_ctx: KnowledgeContext): unknown[] {
    throw new NotImplementedError("extractorRegistryService.verify");
  },
  refreshPrepare(_ctx: KnowledgeContext): unknown {
    throw new NotImplementedError("extractorRegistryService.refreshPrepare");
  },
  refreshApply(_ctx: KnowledgeContext): unknown {
    throw new NotImplementedError("extractorRegistryService.refreshApply");
  },
};
