/*
<MODULE_CONTRACT>
<purpose>Canonical record Zod schemas for werkstatt-knowledge — five record types (entity, relation, evidence, binding, coverage), embedded Claim model, KB manifest, and the layer-parameterized schema factory (RFC-1107).</purpose>

<non-goals>
  <item>Does not load or write files — IO lives in record-io.ts.</item>
  <item>Does not enforce cross-record invariants (id uniqueness, alias collisions, domain/range) — those are verification concerns (KNO-008, KNO-011).</item>
  <item>Does not import CKL claim primitives from werkstatt-shared/knowledge — the KB subject model differs (RFC-1107).</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1107: initial schema layer — five record types, Claim, manifest, recordSchemasFor(layer) canonical epistemic restriction.</item>
</CHANGE_SUMMARY>
*/

import { z } from "zod";

const SLUG_SOURCE = "[a-z0-9]+(-[a-z0-9]+)*";
const SLUG_PATTERN = new RegExp(`^${SLUG_SOURCE}$`);
const FINGERPRINT_PATTERN = /^sha256:[0-9a-f]{64}$/;
const DECISION_REF_PATTERN = /^(RFC|ADR)-\d+$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

export const KNOWLEDGE_RECORD_TYPES = [
  "entity",
  "relation",
  "evidence",
  "binding",
  "coverage",
] as const;

export type KnowledgeRecordType = (typeof KNOWLEDGE_RECORD_TYPES)[number];

export type KnowledgeLayer = "canonical" | "nonCanonical";

/** Namespaced record id: `<type>:<slug>` (RFC-1107 identifier scheme). */
export function recordIdSchema(type: KnowledgeRecordType) {
  return z
    .string()
    .regex(
      new RegExp(`^${type}:${SLUG_SOURCE}$`),
      `record id must be "${type}:<slug>" (lowercase alphanumerics and hyphens)`,
    );
}

export const slugSchema = z
  .string()
  .regex(SLUG_PATTERN, "slug must be lowercase alphanumerics and hyphens");

export const fingerprintSchema = z
  .string()
  .regex(FINGERPRINT_PATTERN, "fingerprint must be sha256:<64 lowercase hex>");

export const decisionRefSchema = z
  .string()
  .regex(DECISION_REF_PATTERN, "decisionRef must be RFC-<n> or ADR-<n>");

export const provenanceSchema = z.enum(["external", "derived", "asserted", "generated"]);

export const canonicalEpistemicStatusSchema = z.enum([
  "verified",
  "supported",
  "contested",
  "deprecated",
]);

export const nonCanonicalEpistemicStatusSchema = z.enum([
  "verified",
  "supported",
  "contested",
  "deprecated",
  "draft",
  "speculative",
]);

export type CanonicalEpistemicStatus = z.infer<typeof canonicalEpistemicStatusSchema>;
export type NonCanonicalEpistemicStatus = z.infer<typeof nonCanonicalEpistemicStatusSchema>;
export type Provenance = z.infer<typeof provenanceSchema>;

function epistemicStatusFor(layer: KnowledgeLayer) {
  return layer === "canonical" ? canonicalEpistemicStatusSchema : nonCanonicalEpistemicStatusSchema;
}

function claimSchemaFor(layer: KnowledgeLayer) {
  return z.strictObject({
    id: slugSchema,
    field: z.string().min(1),
    value: z.unknown(),
    provenance: provenanceSchema,
    epistemicStatus: epistemicStatusFor(layer),
    evidence: z.array(recordIdSchema("evidence")),
    decisionRef: decisionRefSchema.optional(),
  });
}

export const claimSchema = claimSchemaFor("nonCanonical");
export type Claim = z.infer<typeof claimSchema>;

function entityRecordSchemaFor(layer: KnowledgeLayer) {
  return z.strictObject({
    schema: z.literal("knowledge/entity@1"),
    id: recordIdSchema("entity"),
    kind: z.string().min(1),
    title: z.string().min(1),
    aliases: z.array(z.string().min(1)),
    claims: z.array(claimSchemaFor(layer)),
  });
}

function relationRecordSchemaFor(layer: KnowledgeLayer) {
  return z.strictObject({
    schema: z.literal("knowledge/relation@1"),
    id: recordIdSchema("relation"),
    type: z.string().min(1),
    from: recordIdSchema("entity"),
    to: recordIdSchema("entity"),
    epistemicStatus: epistemicStatusFor(layer),
    evidence: z.array(recordIdSchema("evidence")),
    decisionRef: decisionRefSchema.optional(),
  });
}

export const evidenceRecordSchema = z.strictObject({
  schema: z.literal("knowledge/evidence@1"),
  id: recordIdSchema("evidence"),
  sourceUnit: z.string().min(1),
  locator: z.strictObject({
    path: z.string().min(1),
    lines: z
      .tuple([z.number().int().positive(), z.number().int().positive()])
      .refine(([start, end]) => start <= end, {
        message: "lines range must be ordered (start <= end)",
      })
      .optional(),
    commit: z
      .string()
      .regex(/^[0-9a-f]{7,40}$/, "commit must be a git sha")
      .optional(),
  }),
  fingerprint: fingerprintSchema,
  excerptPolicy: z.enum(["public", "restricted", "private"]),
});

export const bindingRecordSchema = z.strictObject({
  schema: z.literal("knowledge/binding@1"),
  id: recordIdSchema("binding"),
  sourceUnit: z.string().min(1),
  fingerprint: fingerprintSchema,
  boundAt: z.string().datetime({ offset: true }),
});

export const coverageRecordSchema = z
  .strictObject({
    schema: z.literal("knowledge/coverage@1"),
    id: recordIdSchema("coverage"),
    scope: z.string().min(1),
    denominator: z.number().int().positive(),
    verified: z.number().int().nonnegative(),
    verifier: z.string().min(1),
  })
  .refine((r) => r.verified <= r.denominator, {
    message: "verified must not exceed denominator (KNO-018)",
  });

export const knowledgeManifestSchema = z.strictObject({
  schema: z.literal("knowledge/manifest@1"),
  id: slugSchema,
  name: z.string().min(1),
  modelVersion: z.string().regex(SEMVER_PATTERN, "modelVersion must be semver x.y.z"),
  description: z.string().optional(),
  license: z.string().optional(),
});

export type EntityRecord = z.infer<ReturnType<typeof entityRecordSchemaFor>>;
export type RelationRecord = z.infer<ReturnType<typeof relationRecordSchemaFor>>;
export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;
export type BindingRecord = z.infer<typeof bindingRecordSchema>;
export type CoverageRecord = z.infer<typeof coverageRecordSchema>;
export type KnowledgeManifest = z.infer<typeof knowledgeManifestSchema>;

export interface KnowledgeRecordSchemas {
  entity: ReturnType<typeof entityRecordSchemaFor>;
  relation: ReturnType<typeof relationRecordSchemaFor>;
  evidence: typeof evidenceRecordSchema;
  binding: typeof bindingRecordSchema;
  coverage: typeof coverageRecordSchema;
}

/**
 * Returns the five record schemas for a knowledge layer. Under `"canonical"`
 * every epistemicStatus field is restricted to the canonical vocabulary —
 * `draft`/`speculative` are rejected (KNO-012). Under `"nonCanonical"`
 * (staging/, laboratory/) the wider vocabulary is accepted.
 */
export function recordSchemasFor(layer: KnowledgeLayer): KnowledgeRecordSchemas {
  return {
    entity: entityRecordSchemaFor(layer),
    relation: relationRecordSchemaFor(layer),
    evidence: evidenceRecordSchema,
    binding: bindingRecordSchema,
    coverage: coverageRecordSchema,
  };
}
