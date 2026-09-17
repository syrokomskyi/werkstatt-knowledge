// Shared KB workshop fixture builder for RFC-1108 service tests.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

export function sha256(content: string): string {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export function writeYaml(dir: string, name: string, content: string): string {
  mkdirSync(dir, { recursive: true });
  const p = join(dir, name);
  writeFileSync(p, content);
  return p;
}

/**
 * Build a minimal valid KB workshop at workspaceDir:
 * manifest, schema-registry, kernel.config.ts, one accepted RFC.
 * Optionally a sibling source bundle with one unit.
 */
export function makeKbWorkspace(
  workspaceDir: string,
  opts?: { withSource?: boolean; sourceReadme?: string },
): { sourceDir: string | null; unitDir: string | null } {
  mkdirSync(workspaceDir, { recursive: true });

  writeYaml(
    join(workspaceDir, "knowledge"),
    "manifest.yaml",
    [
      'schema: "knowledge/manifest@1"',
      "id: my-kb",
      'name: "My KB"',
      'modelVersion: "1.0.0"',
      "",
    ].join("\n"),
  );

  writeYaml(
    join(workspaceDir, "knowledge", "ontology"),
    "schema-registry.yaml",
    [
      'schema: "knowledge/schema-registry@1"',
      "relationTypes:",
      "  - id: related-to",
      "    domain: [concept]",
      "    range: [concept]",
      "    inverse: related-to",
      "entityKinds: [concept]",
      "epistemicVocabulary:",
      "  canonical: [verified, supported, contested, deprecated]",
      "  nonCanonical: [draft, speculative]",
      "governanceLog: []",
      "",
    ].join("\n"),
  );

  writeYaml(
    join(workspaceDir, "tools"),
    "kernel.config.ts",
    'import { werkstattKnowledgePlugin } from "@warpgogol/werkstatt-knowledge";\nexport default [werkstattKnowledgePlugin];\n',
  );

  writeYaml(
    join(workspaceDir, "docs", "rfcs"),
    "rfc-0001-test-decision.md",
    "---\nid: RFC-0001\nstatus: accepted\n---\n\n# Test\n",
  );

  if (!opts?.withSource) return { sourceDir: null, unitDir: null };

  const parent = join(workspaceDir, "..");
  const kbName = workspaceDir.split("/").pop() ?? "my-kb";
  const sourceDir = join(parent, `${kbName}-source`);
  const unitDir = join(sourceDir, "unit-a");
  mkdirSync(unitDir, { recursive: true });
  writeFileSync(join(unitDir, "README.md"), opts.sourceReadme ?? "# Unit A\n");
  writeFileSync(
    join(unitDir, "package.json"),
    JSON.stringify({ name: "unit-a", version: "1.0.0" }),
  );
  return { sourceDir, unitDir };
}

export function writeEntity(
  workspaceDir: string,
  slug: string,
  opts?: {
    title?: string;
    claims?: string;
    aliases?: string;
    layer?: "knowledge" | "staging" | "laboratory";
  },
): string {
  const layer = opts?.layer ?? "knowledge";
  return writeYaml(
    join(workspaceDir, layer, "entities"),
    `${slug}.yaml`,
    [
      'schema: "knowledge/entity@1"',
      `id: "entity:${slug}"`,
      'kind: "concept"',
      `title: "${opts?.title ?? slug}"`,
      `aliases: ${opts?.aliases ?? "[]"}`,
      `claims: ${opts?.claims ?? "[]"}`,
      "",
    ].join("\n"),
  );
}

export function writeEvidence(
  workspaceDir: string,
  slug: string,
  sourceUnit: string,
  locatorPath: string,
  fingerprint: string,
  lines?: [number, number],
): string {
  return writeYaml(
    join(workspaceDir, "knowledge", "evidence"),
    `${slug}.yaml`,
    [
      'schema: "knowledge/evidence@1"',
      `id: "evidence:${slug}"`,
      `sourceUnit: "${sourceUnit}"`,
      "locator:",
      `  path: "${locatorPath}"`,
      ...(lines ? [`  lines: [${lines[0]}, ${lines[1]}]`] : []),
      `fingerprint: "${fingerprint}"`,
      'excerptPolicy: "public"',
      "",
    ].join("\n"),
  );
}
