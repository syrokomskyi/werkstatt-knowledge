import { describe, it, expect } from "vitest";
import { readdir, readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  KNOWLEDGE_RECORD_TYPES,
  recordSchemasFor,
  knowledgeManifestSchema,
  fingerprintSchema,
  decisionRefSchema,
} from "../schemas/canonical-records.ts";
import { schemaRegistrySchema } from "../schemas/ontology-registry.ts";
import { loadRecordFile, loadRegistry } from "../schemas/record-io.ts";

const SHA = `sha256:${"a".repeat(64)}`;

const validEntity = {
  schema: "knowledge/entity@1",
  id: "entity:permadeath",
  kind: "mechanic",
  title: "Permadeath",
  aliases: ["permanent death"],
  claims: [
    {
      id: "claim-1",
      field: "title",
      value: "Permadeath",
      provenance: "external",
      epistemicStatus: "verified",
      evidence: ["evidence:rogue-1980-source"],
      decisionRef: "RFC-1107",
    },
  ],
};

const validRelation = {
  schema: "knowledge/relation@1",
  id: "relation:roguelike-has-mechanic-permadeath",
  type: "has-mechanic",
  from: "entity:roguelike",
  to: "entity:permadeath",
  epistemicStatus: "supported",
  evidence: ["evidence:rogue-1980-source"],
};

const validEvidence = {
  schema: "knowledge/evidence@1",
  id: "evidence:rogue-1980-source",
  sourceUnit: "rogue-source",
  locator: { path: "README.md", lines: [1, 20], commit: "abc1234" },
  fingerprint: SHA,
  excerptPolicy: "public",
};

const validBinding = {
  schema: "knowledge/binding@1",
  id: "binding:rogue-source",
  sourceUnit: "rogue-source",
  fingerprint: SHA,
  boundAt: "2026-09-17T00:00:00Z",
};

const validCoverage = {
  schema: "knowledge/coverage@1",
  id: "coverage:mechanics",
  scope: "kind:mechanic",
  denominator: 100,
  verified: 42,
  verifier: "knowledge.verify",
};

const validRegistry = {
  schema: "knowledge/schema-registry@1",
  relationTypes: [
    { id: "has-mechanic", domain: ["game"], range: ["mechanic"], inverse: "mechanic-of" },
    { id: "mechanic-of", domain: ["mechanic"], range: ["game"], inverse: "has-mechanic" },
  ],
  entityKinds: ["game", "mechanic", "concept", "person"],
  epistemicVocabulary: {
    canonical: ["verified", "supported", "contested", "deprecated"],
    nonCanonical: ["draft", "speculative"],
  },
  governanceLog: [
    { decisionRef: "RFC-1107", appliedAt: "2026-09-17", summary: "Initial registry" },
  ],
};

describe("canonical record schemas (RFC-1107)", () => {
  it("AC-1: entity schema accepts a conforming record", () => {
    const result = recordSchemasFor("canonical").entity.safeParse(validEntity);
    expect(result.success, "valid entity must parse — check entityRecordSchema fields").toBe(true);
  });

  it("AC-1: entity schema rejects non-conforming records", () => {
    const schemas = recordSchemasFor("canonical");
    expect(schemas.entity.safeParse({ ...validEntity, id: "permadeath" }).success).toBe(false);
    expect(schemas.entity.safeParse({ ...validEntity, schema: "knowledge/entity@2" }).success).toBe(
      false,
    );
    expect(schemas.entity.safeParse({ ...validEntity, extra: 1 }).success).toBe(false);
    expect(schemas.entity.safeParse({ ...validEntity, title: "" }).success).toBe(false);
  });

  it("AC-2: exactly five record types with schema discriminators", () => {
    expect(KNOWLEDGE_RECORD_TYPES).toEqual([
      "entity",
      "relation",
      "evidence",
      "binding",
      "coverage",
    ]);
    const schemas = recordSchemasFor("canonical");
    const fixtures = [validEntity, validRelation, validEvidence, validBinding, validCoverage];
    for (const type of KNOWLEDGE_RECORD_TYPES) {
      const fixture = fixtures.find((f) => f.id.startsWith(`${type}:`));
      expect(fixture, `fixture missing for ${type}`).toBeDefined();
      const result = schemas[type].safeParse(fixture);
      expect(result.success, `${type} fixture must parse`).toBe(true);
      if (result.success) {
        expect(result.data.schema).toBe(`knowledge/${type}@1`);
      }
    }
  });

  it("AC-3: canonical layer rejects draft/speculative, nonCanonical accepts", () => {
    const draftEntity = {
      ...validEntity,
      claims: [{ ...validEntity.claims[0], epistemicStatus: "draft" }],
    };
    expect(
      recordSchemasFor("canonical").entity.safeParse(draftEntity).success,
      "canonical layer must reject draft claim status (KNO-012)",
    ).toBe(false);
    expect(recordSchemasFor("nonCanonical").entity.safeParse(draftEntity).success).toBe(true);

    const speculativeRelation = { ...validRelation, epistemicStatus: "speculative" };
    expect(recordSchemasFor("canonical").relation.safeParse(speculativeRelation).success).toBe(
      false,
    );
    expect(recordSchemasFor("nonCanonical").relation.safeParse(speculativeRelation).success).toBe(
      true,
    );
  });

  it("AC-4: registry requires domain/range/inverse and enforces inverse-pair consistency", () => {
    expect(schemaRegistrySchema.safeParse(validRegistry).success).toBe(true);

    const missingInverse = {
      ...validRegistry,
      relationTypes: [{ id: "has-mechanic", domain: ["game"], range: ["mechanic"] }],
    };
    expect(schemaRegistrySchema.safeParse(missingInverse).success).toBe(false);

    const danglingInverse = {
      ...validRegistry,
      relationTypes: [
        { id: "has-mechanic", domain: ["game"], range: ["mechanic"], inverse: "nonexistent" },
      ],
    };
    expect(schemaRegistrySchema.safeParse(danglingInverse).success).toBe(false);

    const brokenPair = {
      ...validRegistry,
      relationTypes: [
        { id: "has-mechanic", domain: ["game"], range: ["mechanic"], inverse: "mechanic-of" },
        { id: "mechanic-of", domain: ["mechanic"], range: ["game"], inverse: "other" },
      ],
    };
    expect(schemaRegistrySchema.safeParse(brokenPair).success).toBe(false);
  });

  it("AC-5: package sources never import werkstatt-shared/knowledge or site-content modules", async () => {
    const srcDir = join(import.meta.dirname, "..");
    const forbidden =
      /(?:from|import)\s*\(?\s*["'][^"']*(?:werkstatt-shared\/knowledge|werkstatt-site|site-content)/;
    async function scan(dir: string): Promise<string[]> {
      const entries = await readdir(dir, { withFileTypes: true });
      const hits: string[] = [];
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          hits.push(...(await scan(full)));
        } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
          const content = await readFile(full, "utf8");
          if (forbidden.test(content)) hits.push(full);
        }
      }
      return hits;
    }
    const violations = await scan(srcDir);
    expect(violations, `import boundary violated: ${violations.join(", ")}`).toEqual([]);
  });

  it("refines: fingerprint, decisionRef, coverage denominator", () => {
    expect(fingerprintSchema.safeParse(SHA).success).toBe(true);
    expect(fingerprintSchema.safeParse("sha256:xyz").success).toBe(false);
    expect(decisionRefSchema.safeParse("ADR-0061").success).toBe(true);
    expect(decisionRefSchema.safeParse("issue-12").success).toBe(false);

    const schemas = recordSchemasFor("canonical");
    expect(
      schemas.coverage.safeParse({ ...validCoverage, verified: 101 }).success,
      "verified > denominator must be rejected (KNO-018)",
    ).toBe(false);
    expect(schemas.coverage.safeParse({ ...validCoverage, denominator: 0 }).success).toBe(false);
  });

  it("manifest schema validates knowledge/manifest@1", () => {
    const manifest = {
      schema: "knowledge/manifest@1",
      id: "roguelike-games-kb",
      name: "Roguelike Games KB",
      modelVersion: "1.0.0",
    };
    expect(knowledgeManifestSchema.safeParse(manifest).success).toBe(true);
    expect(knowledgeManifestSchema.safeParse({ ...manifest, id: "Bad Id" }).success).toBe(false);
    expect(knowledgeManifestSchema.safeParse({ ...manifest, modelVersion: "1.0" }).success).toBe(
      false,
    );
  });
});

describe("record-io loaders (RFC-1107)", () => {
  it("loadRecordFile returns typed record for valid YAML", async () => {
    const dir = await mkdtemp(join(tmpdir(), "knowledge-io-"));
    try {
      const file = join(dir, "permadeath.yaml");
      await writeFile(file, toYaml(validEntity), "utf8");
      const result = await loadRecordFile(file, "entity", "canonical");
      expect(result.ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("loadRecordFile distinguishes YAML parse errors from KNO-007 schema violations", async () => {
    const dir = await mkdtemp(join(tmpdir(), "knowledge-io-"));
    try {
      const badYaml = join(dir, "bad.yaml");
      await writeFile(badYaml, "key: [unclosed\n  - broken", "utf8");
      const yamlResult = await loadRecordFile(badYaml, "entity", "canonical");
      expect(yamlResult.ok).toBe(false);
      expect(yamlResult.diagnostics[0].ruleId).toBe("KNO-IO-YAML");

      const badSchema = join(dir, "wrong.yaml");
      await writeFile(badSchema, toYaml({ schema: "knowledge/entity@1", id: "wrong" }), "utf8");
      const schemaResult = await loadRecordFile(badSchema, "entity", "canonical");
      expect(schemaResult.ok).toBe(false);
      expect(schemaResult.diagnostics[0].ruleId).toBe("KNO-007");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("loadRegistry fails closed on missing file and validates a real registry", async () => {
    const dir = await mkdtemp(join(tmpdir(), "knowledge-io-"));
    try {
      const missing = await loadRegistry(join(dir, "absent.yaml"));
      expect(missing.ok).toBe(false);
      expect(missing.diagnostics[0].severity).toBe("error");

      const file = join(dir, "schema-registry.yaml");
      await writeFile(file, toYaml(validRegistry), "utf8");
      const loaded = await loadRegistry(file);
      expect(loaded.ok).toBe(true);
      if (loaded.ok) expect(loaded.record.relationTypes).toHaveLength(2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

function toYaml(value: unknown): string {
  // minimal YAML emitter for test fixtures — JSON is valid YAML 1.2
  return JSON.stringify(value, null, 2);
}
