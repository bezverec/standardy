import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { ndkObligations } from "./obligation.ts";
import { cataloguingCondition } from "./rule-comparison.ts";
import type { Condition } from "./model.ts";
import type {
  NationalStandardDocument,
  RegistryDocument,
  RuleDocument,
  StandardDocument,
  VocabularyDocument,
} from "./model.ts";

export interface ValidationIssue {
  file?: string | undefined;
  path?: string | undefined;
  message: string;
}

async function schemaValidators(root: string): Promise<Record<string, ValidateFunction>> {
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  const kinds = ["standard", "national_standard", "rule", "vocabulary"] as const;
  const validators: Record<string, ValidateFunction> = {};
  for (const kind of kinds) {
    const schema = JSON.parse(await readFile(path.join(root, "schemas", `${kind}.schema.json`), "utf8"));
    validators[kind] = ajv.compile(schema);
  }
  return validators;
}

function formatSchemaErrors(document: RegistryDocument, errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  return (errors ?? []).map((error) => ({
    file: document.source_file,
    path: error.instancePath || "/",
    message: error.message ?? "schema validation failed",
  }));
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function cataloguingLeaves(condition: Condition | undefined): Array<Extract<Condition, { field: string }>> {
  if (!condition) return [];
  if ("all" in condition) return condition.all.flatMap(cataloguingLeaves);
  if ("any" in condition) return condition.any.flatMap(cataloguingLeaves);
  if ("not" in condition) return cataloguingLeaves(condition.not);
  return condition.field === "cataloguing_rules" ? [condition] : [];
}

export async function validateRegistry(
  root: string,
  documents: RegistryDocument[],
  options: { relationsOnly?: boolean } = {},
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  if (!options.relationsOnly) {
    const validators = await schemaValidators(root);
    for (const document of documents) {
      const validator = validators[document.kind];
      if (!validator) {
        issues.push({ file: document.source_file, message: `Unknown entity kind: ${String(document.kind)}` });
        continue;
      }
      const schemaInput = { ...document };
      delete schemaInput.source_file;
      if (!validator(schemaInput)) issues.push(...formatSchemaErrors(document, validator.errors));
    }
  }

  const standards = documents.filter((item): item is StandardDocument => item.kind === "standard");
  const nationalStandards = documents.filter((item): item is NationalStandardDocument => item.kind === "national_standard");
  const rules = documents.filter((item): item is RuleDocument => item.kind === "rule");
  const vocabularies = documents.filter((item): item is VocabularyDocument => item.kind === "vocabulary");
  const standardEntities = standards.flatMap((standard) => standard.entities ?? []);
  const implementationIds = rules.flatMap((rule) => rule.versions.flatMap((version) => version.implementations ?? []).map((item) => item.id));
  const primaryEntityIds = [
    ...documents.map((document) => document.id),
    ...standardEntities.map((entity) => entity.id),
  ];

  for (const duplicate of duplicateValues(primaryEntityIds)) {
    issues.push({ message: `Duplicate stable ID: ${duplicate}` });
  }

  const primaryIdSet = new Set(primaryEntityIds);
  for (const implementationId of new Set(implementationIds)) {
    if (primaryIdSet.has(implementationId)) {
      issues.push({ message: `Implementation ID collides with a registry entity: ${implementationId}` });
    }
  }

  // One application can participate in many rule versions. Repeated application
  // IDs are therefore valid, unlike duplicated primary registry entity IDs.
  const knownIds = new Set([...primaryEntityIds, ...implementationIds]);
  const nationalStandardById = new Map(nationalStandards.map((nationalStandard) => [nationalStandard.id, nationalStandard]));
  const vocabularyById = new Map(vocabularies.map((vocabulary) => [vocabulary.id, vocabulary]));

  for (const standard of standards) {
    const versions = new Set(standard.versions.map((version) => version.version));
    for (const entity of standard.entities) {
      if (!versions.has(entity.version)) {
        issues.push({ file: standard.source_file, message: `${entity.id} references missing ${standard.id} version ${entity.version}` });
      }
    }
  }

  for (const nationalStandard of nationalStandards) {
    for (const inheritance of nationalStandard.inherits ?? []) {
      const parent = nationalStandardById.get(inheritance.national_standard);
      if (!parent) {
        issues.push({ file: nationalStandard.source_file, message: `${nationalStandard.id} inherits unknown national standard ${inheritance.national_standard}` });
      } else if (!parent.versions.some((version) => version.version === inheritance.version)) {
        issues.push({ file: nationalStandard.source_file, message: `${nationalStandard.id} inherits unknown version ${inheritance.national_standard}@${inheritance.version}` });
      }
    }
  }

  for (const rule of rules) {
    const nationalStandard = nationalStandardById.get(rule.national_standard.id);
    if (!nationalStandard) issues.push({ file: rule.source_file, message: `${rule.id} references unknown national standard ${rule.national_standard.id}` });
    for (const version of rule.versions) {
      if (!options.relationsOnly) {
        const addIssue = (message: string) => issues.push({ file: rule.source_file, message: `${rule.id}@${version.version} ${message}` });
        const leaves = cataloguingLeaves(version.condition);
        if (leaves.length && !version.cataloguing_rules) addIssue("must declare audited cataloguing_rules for its cataloguing condition");
        for (const leaf of leaves) {
          const values = leaf.operator === "equals" ? [leaf.value] : leaf.operator === "in" && Array.isArray(leaf.value) ? leaf.value : [];
          if (!values.length || values.some((value) => value !== "aacr2" && value !== "rda")) addIssue("cataloguing condition must use equals/in with canonical aacr2 or rda values");
        }
        for (const value of version.cataloguing_rules ?? []) {
          if (cataloguingCondition(version.condition, value) === false) addIssue(`cataloguing_rules ${value} contradicts condition`);
        }
        if (version.obligation === "forbidden" && (!version.non_use || version.requirement.presence !== "forbidden")) {
          addIssue("forbidden must document non_use and require absence; a difference between standards is not a prohibition");
        }
        if (version.non_use && version.obligation !== "forbidden") addIssue("non_use requires obligation forbidden");
      }
      const exampleIds = new Set<string>();
      for (const example of version.examples ?? []) {
        if (exampleIds.has(example.id)) issues.push({ file: rule.source_file, message: `${rule.id}@${version.version} has duplicate example ID ${example.id}` });
        exampleIds.add(example.id);
      }
      if (!options.relationsOnly && rule.national_standard.id.startsWith("ndk-")
        && Object.values(ndkObligations).includes(version.obligation) && !version.obligation_code && version.obligation_source !== "prose") {
        issues.push({ file: rule.source_file, message: `${rule.id}@${version.version} must preserve the source NDK obligation_code` });
      }
      if (!options.relationsOnly && version.obligation_source === "prose" && version.obligation_code) {
        issues.push({ file: rule.source_file, message: `${rule.id}@${version.version} prose obligation must not invent an obligation_code` });
      }
      if (!options.relationsOnly && version.obligation_code && version.obligation !== ndkObligations[version.obligation_code]) {
        issues.push({ file: rule.source_file, message: `${rule.id}@${version.version} obligation ${version.obligation} does not match source code ${version.obligation_code}` });
      }
      if (nationalStandard && !nationalStandard.versions.some((candidate) => candidate.version === version.version)) {
        issues.push({ file: rule.source_file, message: `${rule.id}@${version.version} has no matching national standard version` });
      }
      if (!knownIds.has(version.target.entity)) {
        issues.push({ file: rule.source_file, message: `${rule.id}@${version.version} targets unknown entity ${version.target.entity}` });
      }
      if (version.object_types) {
        const vocabulary = vocabularyById.get(version.object_types.vocabulary);
        if (!vocabulary) {
          issues.push({ file: rule.source_file, message: `${rule.id} references unknown vocabulary ${version.object_types.vocabulary}` });
        } else {
          const knownValues = new Set(vocabulary.values.map((value) => value.id));
          for (const value of version.object_types.values) {
            if (!knownValues.has(value)) issues.push({ file: rule.source_file, message: `${rule.id} references unknown vocabulary value ${value}` });
          }
        }
      }
    }
  }

  for (const document of [...standards, ...rules]) {
    for (const relation of document.relations ?? []) {
      if (!knownIds.has(relation.target)) {
        issues.push({ file: document.source_file, message: `${document.id} relation targets unknown entity ${relation.target}` });
      }
    }
  }

  return issues;
}
