import type { RuleVersion } from "./api.ts";
import type { Relation } from "./explore.ts";
import { ruleCounts } from "./explore.ts";
import { metadataAreas, metadataStandards, targetStandardId } from "../../../packages/registry-core/src/metadata-taxonomy.ts";
import { obligationOptions } from "./obligation.ts";

export function summarizeRules(rules: RuleVersion[]) {
  return { ...ruleCounts(rules), obligations: obligationOptions.map(([value, label]) => ({
    value, label, count: rules.filter((rule) => rule.obligation === value).length,
  })).filter(({ count }) => count > 0) };
}

export function buildRegistryMap(rules: RuleVersion[], relations: Relation[]) {
  const owners = new Map(rules.map((rule) => [rule.target.entity, targetStandardId(rule.target.entity, relations)]));
  const known = new Set(metadataStandards.map(({ id }) => id));
  const standards = metadataStandards.map((standard) => {
    const records = rules.filter((rule) => owners.get(rule.target.entity) === standard.id);
    const topics = [...new Set(records.map((rule) => rule.category))].sort().map((category) => ({
      category, ...summarizeRules(records.filter((rule) => rule.category === category)),
    }));
    return { ...standard, ...summarizeRules(records), topics };
  });
  return {
    ...summarizeRules(rules),
    areas: metadataAreas.map((area) => ({ ...area, standards: standards.filter((standard) => standard.area === area.id) })),
    // Do not silently lose targets whose owners have not yet entered the navigation taxonomy.
    unclassified: rules.filter((rule) => !known.has(owners.get(rule.target.entity) ?? "")),
  };
}

export function mapRulesUrl(filters: Record<string, string>): string {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  return `/registry/rules${params.size ? `?${params}` : ""}`;
}
