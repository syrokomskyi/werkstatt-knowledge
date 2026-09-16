/*
<MODULE_CONTRACT>
<purpose>KnowledgeContext — built once per invocation by adapters and hooks.</purpose>
<keywords>context, config, knowledge, service</keywords>
<responsibilities>
  <item>Resolves and parses knowledge.config.yaml into KnowledgeConfig.</item>
  <item>Provides logger and workspaceRoot to all services.</item>
</responsibilities>
<non-goals>
  <item>Does not enforce invariants — enforcement lives in validators.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1098: initial KnowledgeContext + resolveKnowledgeContext + KnowledgeConfigError.</item>
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
