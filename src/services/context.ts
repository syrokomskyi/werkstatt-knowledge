/*
<MODULE_CONTRACT>
<purpose>KnowledgeContext service context — built once per invocation by adapters and hooks.</purpose>


<non-goals>
  <item>Does not enforce invariants — enforcement lives in validators.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial KnowledgeContext + resolveKnowledgeContext + KnowledgeConfigError.</item>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface KnowledgeConfig {
  sourceRoot?: string;
  defaultExtractor?: string;
  publicationPolicy?: string;
  license?: string;
}

export interface KnowledgeContext {
  workspaceRoot: string;
  config: KnowledgeConfig;
  logger: {
    info(msg: string): void;
    warn(msg: string): void;
    error(msg: string): void;
  };
}

export class KnowledgeConfigError extends Error {
  constructor(
    message: string,
    readonly path: string,
  ) {
    super(message);
    this.name = "KnowledgeConfigError";
  }
}

export class NotImplementedError extends Error {
  constructor(method: string) {
    super(`Not implemented: ${method}`);
    this.name = "NotImplementedError";
  }
}

function parseYaml(content: string): Record<string, unknown> {
  const lines = content.split("\n");
  const result: Record<string, unknown> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    let value: unknown = trimmed.slice(colonIdx + 1).trim();
    if (value === "") value = "";
    if (typeof value === "string") {
      if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (/^\d+$/.test(value)) value = Number(value);
      else value = value.replace(/^["']|["']$/g, "");
    }
    result[key] = value;
  }
  return result;
}

export function resolveKnowledgeContext(
  workspaceRoot: string,
  logger?: { info(msg: string): void; warn(msg: string): void; error(msg: string): void },
): KnowledgeContext {
  const configPath = join(workspaceRoot, "knowledge.config.yaml");
  let config: KnowledgeConfig = {};

  try {
    const content = readFileSync(configPath, "utf-8");
    const parsed = parseYaml(content) as Partial<KnowledgeConfig>;
    if (typeof parsed.sourceRoot === "string" || parsed.sourceRoot === undefined) {
      config = {
        sourceRoot: parsed.sourceRoot,
        defaultExtractor: typeof parsed.defaultExtractor === "string" ? parsed.defaultExtractor : undefined,
        publicationPolicy: typeof parsed.publicationPolicy === "string" ? parsed.publicationPolicy : undefined,
        license: typeof parsed.license === "string" ? parsed.license : undefined,
      };
    } else {
      throw new KnowledgeConfigError(
        `sourceRoot must be a string in ${configPath}`,
        configPath,
      );
    }
  } catch (err) {
    if (err instanceof KnowledgeConfigError) throw err;
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code !== "ENOENT") {
      throw new KnowledgeConfigError(
        `Failed to read ${configPath}: ${nodeErr.message}`,
        configPath,
      );
    }
  }

  return {
    workspaceRoot,
    config,
    logger: logger ?? {
      info: () => {},
      warn: () => {},
      error: () => {},
    },
  };
}
