import { execFileSync } from "node:child_process";
import type {
  GraphRelation,
  NormalizedRegistry,
  NationalStandardDocument,
  RegistryDocument,
  RuleDocument,
  StandardDocument,
  VocabularyDocument,
} from "./model.ts";

function gitValue(args: string[], fallback: string): string {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function stableSort<T extends { id: string }>(values: T[]): T[] {
  return [...values].sort((a, b) => a.id.localeCompare(b.id));
}

export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, canonicalize(child)]));
  }
  return value;
}

export function compileRegistry(documents: RegistryDocument[]): NormalizedRegistry {
  const gitCommit = process.env.REGISTRY_GIT_SHA || gitValue(["rev-parse", "HEAD"], "local");
  const generatedAt = process.env.REGISTRY_BUILD_TIME
    || (process.env.SOURCE_DATE_EPOCH
      ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
      : gitValue(["show", "-s", "--format=%cI", "HEAD"], "1970-01-01T00:00:00.000Z"));
  const standards = stableSort(documents.filter((item): item is StandardDocument => item.kind === "standard"));
  const nationalStandards = stableSort(documents.filter((item): item is NationalStandardDocument => item.kind === "national_standard"));
  const rules = stableSort(documents.filter((item): item is RuleDocument => item.kind === "rule"));
  const vocabularies = stableSort(documents.filter((item): item is VocabularyDocument => item.kind === "vocabulary"));
  const standardEntities = standards.flatMap((standard) => standard.entities.map((entity) => ({ ...entity, standard_id: standard.id })))
    .sort((a, b) => a.id.localeCompare(b.id));
  const ruleVersions = rules.flatMap((rule) => rule.versions.map((version) => ({
    ...version,
    rule_id: rule.id,
    national_standard_id: rule.national_standard.id,
    title: rule.title,
    ...(rule.description ? { description: rule.description } : {}),
    ...(rule.source_file ? { source_file: rule.source_file } : {}),
  }))).sort((a, b) => `${a.rule_id}@${a.version}`.localeCompare(`${b.rule_id}@${b.version}`));

  const relations: GraphRelation[] = [];
  for (const standard of standards) {
    for (const entity of standard.entities) {
      relations.push({ id: `${entity.id}|defined_by|${standard.id}`, from: entity.id, to: standard.id, type: "defined_by" });
    }
    for (const relation of standard.relations ?? []) {
      relations.push({ id: `${standard.id}|${relation.type}|${relation.target}`, from: standard.id, to: relation.target, type: relation.type, ...(relation.note ? { note: relation.note } : {}) });
    }
  }
  for (const nationalStandard of nationalStandards) {
    for (const parent of nationalStandard.inherits ?? []) {
      relations.push({ id: `${nationalStandard.id}|extends|${parent.national_standard}`, from: nationalStandard.id, to: parent.national_standard, type: "extends" });
    }
  }
  for (const rule of rules) {
    for (const version of rule.versions) {
      relations.push({
        id: `${rule.id}@${version.version}|${version.relation_to_target.type}|${version.target.entity}`,
        from: rule.id,
        to: version.target.entity,
        type: version.relation_to_target.type,
        rule_version: version.version,
      });
      relations.push({ id: `${rule.id}@${version.version}|defined_by|${rule.national_standard.id}`, from: rule.id, to: rule.national_standard.id, type: "defined_by", rule_version: version.version });
      for (const implementation of version.implementations ?? []) {
        const type = implementation.role === "generator" ? "generated_by" : "validated_by";
        relations.push({ id: `${rule.id}@${version.version}|${type}|${implementation.id}`, from: rule.id, to: implementation.id, type, rule_version: version.version });
      }
    }
    for (const relation of rule.relations ?? []) {
      relations.push({ id: `${rule.id}|${relation.type}|${relation.target}`, from: rule.id, to: relation.target, type: relation.type, ...(relation.note ? { note: relation.note } : {}) });
    }
  }
  relations.sort((a, b) => a.id.localeCompare(b.id));

  const implementations = ruleVersions.flatMap((version) => (version.implementations ?? []).map((implementation) => ({
    ...implementation,
    rule_id: version.rule_id,
    rule_version: version.version,
  }))).sort((a, b) => `${a.rule_id}@${a.rule_version}:${a.id}`.localeCompare(`${b.rule_id}@${b.rule_version}:${b.id}`));

  return {
    meta: {
      dataset_version: `git-${gitCommit}`,
      git_commit: gitCommit,
      generated_at: generatedAt,
      schema_version: "1.0",
    },
    standards,
    standard_entities: standardEntities,
    national_standards: nationalStandards,
    rules,
    rule_versions: ruleVersions,
    relations,
    implementations,
    vocabularies,
  };
}
