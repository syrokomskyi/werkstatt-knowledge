/*
<MODULE_CONTRACT>
<purpose>ExtractorRegistryService — skeleton for extractor listing and refresh operations.</purpose>

<non-goals>
  <item>Skeleton — throws NotImplementedError when called.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial ExtractorRegistryService skeleton.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
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
