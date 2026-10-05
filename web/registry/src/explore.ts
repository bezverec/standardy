import type { RuleVersion } from "./api.ts";

export interface Relation { id: string; from: string; to: string; type: string; rule_version?: string }
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("cs");
}
export function matchesQuery(rule: RuleVersion, query: string): boolean {
  const text = normalize(JSON.stringify(rule));
  return normalize(query).trim().split(/\s+/).every((word) => text.includes(word));
}
export function sourceIds(rule: RuleVersion, relations: Relation[]): string[] {
  const ruleIds = new Set(relations.filter((edge) => edge.type === "defined_by" && edge.rule_version).map((edge) => edge.from));
  const targets = new Set([rule.target.entity]);
  for (const edge of relations) {
    if (edge.from === rule.rule_id && (!edge.rule_version || edge.rule_version === rule.version)
      && !["defined_by", "generated_by", "validated_by"].includes(edge.type)
      && !ruleIds.has(edge.to)) targets.add(edge.to);
  }
  const sources = new Set<string>();
  for (const edge of relations) if (edge.type === "defined_by" && targets.has(edge.from)) sources.add(edge.to);
  return [...sources].sort();
}

export function filterRules(rules: RuleVersion[], query: string, filters: Record<string, string>, relations: Relation[]): RuleVersion[] {
  return rules.filter((rule) => matchesQuery(rule, query)
    && (!filters.severity || rule.severity === filters.severity)
    && (!filters.source || sourceIds(rule, relations).includes(filters.source))
    && (!filters.national || rule.national_standard_id === filters.national)
    && (!filters.version || rule.version === filters.version)
    && (!filters.category || rule.category === filters.category)
    && (!filters.verification || rule.verification.status === filters.verification)
    && (!filters.status || rule.status === filters.status)
    && (!filters.object || rule.object_types?.values.includes(filters.object)));
}
