/*
<MODULE_CONTRACT>
<purpose>Ontology registry Zod schema for werkstatt-knowledge — validates knowledge/ontology/schema-registry.yaml (relation types, entity kinds, epistemic vocabulary, governance log) per RFC-1107.</purpose>

<non-goals>
  <item>Does not check relation records against the registry — domain/range enforcement is a verification concern (KNO-011).</item>
  <item>Does not load files — IO lives in record-io.ts.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1107: initial registry schema — required domain/range/inverse, inverse-pair consistency superRefine, governance log decisionRef pattern.</item>
</CHANGE_SUMMARY>
*/

import { z } from "zod";
import { decisionRefSchema, slugSchema } from "./canonical-records.ts";

const relationTypeSchema = z.strictObject({
  id: slugSchema,
  domain: z.array(z.string().min(1)).min(1),
  range: z.array(z.string().min(1)).min(1),
  inverse: slugSchema,
});

const governanceLogEntrySchema = z.strictObject({
  decisionRef: decisionRefSchema,
  appliedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "appliedAt must be YYYY-MM-DD"),
  summary: z.string().min(1),
});

export const schemaRegistrySchema = z
  .strictObject({
    schema: z.literal("knowledge/schema-registry@1"),
    relationTypes: z.array(relationTypeSchema),
    entityKinds: z.array(z.string().min(1)),
    epistemicVocabulary: z.strictObject({
      canonical: z.array(z.string().min(1)).min(1),
      nonCanonical: z.array(z.string().min(1)),
    }),
    governanceLog: z.array(governanceLogEntrySchema),
  })
  .superRefine((registry, ctx) => {
    const byId = new Map(registry.relationTypes.map((t) => [t.id, t]));
    for (const relType of registry.relationTypes) {
      const inverse = byId.get(relType.inverse);
      if (!inverse) {
        ctx.addIssue({
          code: "custom",
          message: `relationTypes.${relType.id}: inverse "${relType.inverse}" is not a registered relation type`,
          path: ["relationTypes"],
        });
        continue;
      }
      if (inverse.inverse !== relType.id) {
        ctx.addIssue({
          code: "custom",
          message: `relationTypes.${relType.id}: inverse pair broken — "${relType.inverse}".inverse is "${inverse.inverse}", expected "${relType.id}"`,
          path: ["relationTypes"],
        });
      }
    }
    const ids = registry.relationTypes.map((t) => t.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        message: "relationTypes ids must be unique",
        path: ["relationTypes"],
      });
    }
  });

export type RelationType = z.infer<typeof relationTypeSchema>;
export type GovernanceLogEntry = z.infer<typeof governanceLogEntrySchema>;
export type SchemaRegistry = z.infer<typeof schemaRegistrySchema>;
