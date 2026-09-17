import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  canonicalize,
  compileRegistry,
  loadRegistry,
  registryImportSql,
  validateRegistry,
} from "../packages/registry-core/src/index.ts";

const root = path.resolve(import.meta.dirname, "..");
const documents = await loadRegistry(root);
const issues = await validateRegistry(root, documents);
if (issues.length) {
  for (const issue of issues) console.error(`${issue.file ?? "registry"}: ${issue.message}`);
  throw new Error(`Registry build stopped: ${issues.length} validation issue(s).`);
}

const registry = compileRegistry(documents);
const outputDirectory = path.join(root, "dist", "registry");
const publicDirectory = path.join(root, "site", "data");
await Promise.all([
  rm(outputDirectory, { recursive: true, force: true }),
  rm(publicDirectory, { recursive: true, force: true }),
]);
await Promise.all([mkdir(outputDirectory, { recursive: true }), mkdir(publicDirectory, { recursive: true })]);

function serialize(value: unknown): string {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

const exports: Record<string, unknown> = {
  "meta.json": registry.meta,
  "rules.json": registry.rule_versions,
  "standards.json": registry.standards,
  "standard-entities.json": registry.standard_entities,
  "national-standards.json": registry.national_standards,
  "relations.json": registry.relations,
  "implementations.json": registry.implementations,
  "vocabularies.json": registry.vocabularies,
};

await Promise.all([
  writeFile(path.join(outputDirectory, "registry.json"), serialize(registry)),
  writeFile(path.join(outputDirectory, "search-index.json"), serialize(registry.rule_versions.map((rule) => ({
    id: rule.rule_id,
    version: rule.version,
    text: [rule.rule_id, rule.title.cs, rule.description?.cs, rule.target.entity, JSON.stringify(rule.requirement), rule.interpretation?.cs, JSON.stringify(rule.source), JSON.stringify(rule.implementations)].filter(Boolean).join(" "),
  })))),
  writeFile(path.join(outputDirectory, "import.sql"), registryImportSql(registry)),
  ...Object.entries(exports).flatMap(([file, data]) => [
    writeFile(path.join(outputDirectory, file), serialize(data)),
    writeFile(path.join(publicDirectory, file), serialize(data)),
  ]),
]);

console.log(`Built ${registry.rule_versions.length} rule version(s), ${registry.standard_entities.length} standard entity record(s), and ${registry.relations.length} relation(s).`);
console.log(`Dataset: ${registry.meta.dataset_version}`);
