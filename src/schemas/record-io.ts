/*
<MODULE_CONTRACT>
<purpose>YAML load/parse helpers for werkstatt-knowledge canonical records — read a record or registry file, return typed data or canonical Diagnostics; never throws (RFC-1107).</purpose>

<non-goals>
  <item>Does not write files — canonical mutation goes through the transaction pathway (KNO-026).</item>
  <item>Does not enforce cross-record invariants — verification services consume the parsed records.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1107: initial loaders — loadRecordFile/loadRegistry with distinct YAML-parse vs KNO-007 schema Diagnostics, fail-closed missing registry.</item>
</CHANGE_SUMMARY>
*/

import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import {
  safeWorkspaceRelativePathSchema,
  type Diagnostic,
} from "@warpgogol/werkstatt-engine/schemas";
import type { z } from "zod";
import {
  recordSchemasFor,
  type KnowledgeLayer,
  type KnowledgeRecordType,
} from "./canonical-records.ts";
import { schemaRegistrySchema, type SchemaRegistry } from "./ontology-registry.ts";

export interface RecordLoadSuccess<T> {
  ok: true;
  record: T;
  diagnostics: [];
}

export interface RecordLoadFailure {
  ok: false;
  record: null;
  diagnostics: Diagnostic[];
}

export type RecordLoadResult<T> = RecordLoadSuccess<T> | RecordLoadFailure;

function makeDiagnostic(ruleId: string, filePath: string, message: string): Diagnostic {
  const diagnostic: Diagnostic = {
    severity: "error",
    ruleId,
    message: `${filePath}: ${message}`,
  };
  if (safeWorkspaceRelativePathSchema.safeParse(filePath).success) {
    diagnostic.file = filePath;
    diagnostic.evidence = [{ kind: "source", file: filePath }];
  }
  return diagnostic;
}

async function readYamlFile(
  filePath: string,
): Promise<{ ok: true; data: unknown } | RecordLoadFailure> {
  let text: string;
  try {
    text = await readFile(filePath, "utf8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      record: null,
      diagnostics: [makeDiagnostic("KNO-IO-READ", filePath, `cannot read file: ${message}`)],
    };
  }
  try {
    return { ok: true, data: parseYaml(text) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      record: null,
      diagnostics: [makeDiagnostic("KNO-IO-YAML", filePath, `YAML parse error: ${message}`)],
    };
  }
}

function schemaDiagnostics(
  ruleId: string,
  filePath: string,
  issues: z.core.$ZodIssue[],
): Diagnostic[] {
  return issues.map((issue) =>
    makeDiagnostic(ruleId, filePath, `${issue.path.join(".") || "(root)"}: ${issue.message}`),
  );
}

/**
 * Load a single canonical record file. `type` selects the expected record
 * schema; `layer` controls the epistemic vocabulary (canonical rejects
 * draft/speculative — KNO-012). YAML syntax errors produce KNO-IO-YAML,
 * schema violations produce KNO-007 Diagnostics.
 */
export async function loadRecordFile(
  filePath: string,
  type: KnowledgeRecordType,
  layer: KnowledgeLayer,
): Promise<RecordLoadResult<unknown>> {
  const read = await readYamlFile(filePath);
  if (!read.ok) return read;
  const schema = recordSchemasFor(layer)[type];
  const result = schema.safeParse(read.data);
  if (!result.success) {
    return {
      ok: false,
      record: null,
      diagnostics: schemaDiagnostics("KNO-007", filePath, result.error.issues),
    };
  }
  return { ok: true, record: result.data, diagnostics: [] };
}

/**
 * Load the ontology registry. Fails closed: a missing or invalid registry
 * yields an error Diagnostic — nothing parses against an absent registry.
 */
export async function loadRegistry(filePath: string): Promise<RecordLoadResult<SchemaRegistry>> {
  const read = await readYamlFile(filePath);
  if (!read.ok) return read;
  const result = schemaRegistrySchema.safeParse(read.data);
  if (!result.success) {
    return {
      ok: false,
      record: null,
      diagnostics: schemaDiagnostics("KNO-011", filePath, result.error.issues),
    };
  }
  return { ok: true, record: result.data, diagnostics: [] };
}
