import type { NormalizedRegistry } from "./model.ts";

function sqlText(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function json(value: unknown): string {
  return sqlText(JSON.stringify(value));
}

function nullable(value: string | undefined): string {
  return value === undefined ? "NULL" : sqlText(value);
}

export function registryImportSql(registry: NormalizedRegistry): string {
  const statements = [
    "PRAGMA foreign_keys = ON;",
    "DELETE FROM relations;",
    "DELETE FROM implementations;",
    "DELETE FROM rule_versions;",
    "DELETE FROM rules;",
    "DELETE FROM standard_entities;",
    "DELETE FROM standards;",
    "DELETE FROM profiles;",
    "DELETE FROM vocabularies;",
    "DELETE FROM registry_meta;",
  ];
  for (const [key, value] of Object.entries(registry.meta)) {
    statements.push(`INSERT INTO registry_meta (key, value) VALUES (${sqlText(key)}, ${sqlText(value)});`);
  }
  for (const standard of registry.standards) {
    statements.push(`INSERT INTO standards (id, title_cs, status, data_json) VALUES (${sqlText(standard.id)}, ${nullable(standard.title.cs)}, ${sqlText(standard.status)}, ${json(standard)});`);
  }
  for (const entity of registry.standard_entities) {
    statements.push(`INSERT INTO standard_entities (id, standard_id, standard_version, name, namespace, entity_type, status, data_json) VALUES (${sqlText(entity.id)}, ${sqlText(entity.standard_id)}, ${sqlText(entity.version)}, ${sqlText(entity.name)}, ${nullable(entity.namespace)}, ${sqlText(entity.type)}, ${sqlText(entity.status)}, ${json(entity)});`);
  }
  for (const profile of registry.profiles) {
    statements.push(`INSERT INTO profiles (id, title_cs, status, data_json) VALUES (${sqlText(profile.id)}, ${nullable(profile.title.cs)}, ${sqlText(profile.status)}, ${json(profile)});`);
  }
  for (const vocabulary of registry.vocabularies) {
    statements.push(`INSERT INTO vocabularies (id, title_cs, status, data_json) VALUES (${sqlText(vocabulary.id)}, ${nullable(vocabulary.title.cs)}, ${sqlText(vocabulary.status)}, ${json(vocabulary)});`);
  }
  for (const rule of registry.rules) {
    statements.push(`INSERT INTO rules (id, profile_id, title_cs, source_file, data_json) VALUES (${sqlText(rule.id)}, ${sqlText(rule.profile.id)}, ${nullable(rule.title.cs)}, ${nullable(rule.source_file)}, ${json(rule)});`);
  }
  for (const version of registry.rule_versions) {
    const standardId = registry.standard_entities.find((entity) => entity.id === version.target.entity)?.standard_id;
    statements.push(`INSERT INTO rule_versions (rule_id, version, profile_id, standard_id, target_id, category, severity, status, verification_status, search_text, data_json) VALUES (${sqlText(version.rule_id)}, ${sqlText(version.version)}, ${sqlText(version.profile_id)}, ${nullable(standardId)}, ${sqlText(version.target.entity)}, ${sqlText(version.category)}, ${sqlText(version.severity)}, ${sqlText(version.status)}, ${sqlText(version.verification.status)}, ${sqlText([version.rule_id, version.title.cs, version.description?.cs, version.target.entity, JSON.stringify(version.requirement), version.interpretation?.cs, JSON.stringify(version.source), JSON.stringify(version.implementations)].filter(Boolean).join(" "))}, ${json(version)});`);
  }
  for (const relation of registry.relations) {
    statements.push(`INSERT INTO relations (id, from_id, to_id, relation_type, rule_version, data_json) VALUES (${sqlText(relation.id)}, ${sqlText(relation.from)}, ${sqlText(relation.to)}, ${sqlText(relation.type)}, ${nullable(relation.rule_version)}, ${json(relation)});`);
  }
  for (const implementation of registry.implementations) {
    statements.push(`INSERT INTO implementations (id, rule_id, rule_version, application, role, status, verification_status, data_json) VALUES (${sqlText(`${implementation.rule_id}@${implementation.rule_version}:${implementation.id}`)}, ${sqlText(implementation.rule_id)}, ${sqlText(implementation.rule_version)}, ${sqlText(implementation.application)}, ${sqlText(implementation.role)}, ${sqlText(implementation.status)}, ${sqlText(implementation.verification)}, ${json(implementation)});`);
  }
  statements.push("");
  return statements.join("\n");
}
