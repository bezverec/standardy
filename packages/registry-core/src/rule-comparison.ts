import type { CataloguingRules, Condition, RuleVersion } from "./model.ts";
import { diffFields } from "./semantic-diff.ts";

export interface ComparisonSelection {
  national_standard: string;
  version: string;
  cataloguing_rules?: CataloguingRules;
}
export type ComparableRule = RuleVersion & { rule_id: string; national_standard_id: string };

/** Partial context evaluation: absence of information is never false. */
export function cataloguingCondition(condition: Condition | undefined, value: CataloguingRules): boolean | undefined {
  if (!condition) return undefined;
  if ("all" in condition) {
    const results = condition.all.map((item) => cataloguingCondition(item, value));
    return results.includes(false) ? false : results.every((item) => item === true) ? true : undefined;
  }
  if ("any" in condition) {
    const results = condition.any.map((item) => cataloguingCondition(item, value));
    return results.includes(true) ? true : results.every((item) => item === false) ? false : undefined;
  }
  if ("not" in condition) {
    const result = cataloguingCondition(condition.not, value);
    return result === undefined ? undefined : !result;
  }
  if (condition.field !== "cataloguing_rules") return undefined;
  if (condition.operator === "equals") return condition.value === value;
  if (condition.operator === "in" && Array.isArray(condition.value)) return condition.value.includes(value);
  return undefined;
}

function select(rules: ComparableRule[], selection: ComparisonSelection) {
  const groups = new Map<string, ComparableRule[]>();
  const unmapped: ComparableRule[] = [];
  const unresolved_context: ComparableRule[] = [];
  const excluded_context: ComparableRule[] = [];
  for (const rule of rules.filter((item) => item.national_standard_id === selection.national_standard && item.version === selection.version)
    .sort((a, b) => a.rule_id.localeCompare(b.rule_id))) {
    if (selection.cataloguing_rules) {
      const applicability = rule.cataloguing_scope?.applicability;
      if (!applicability || applicability === "undetermined" || (applicability === "applicable" && !rule.cataloguing_rules)) { unresolved_context.push(rule); continue; }
      if ((applicability === "applicable" && !rule.cataloguing_rules?.includes(selection.cataloguing_rules))
        || cataloguingCondition(rule.condition, selection.cataloguing_rules) === false) {
        excluded_context.push(rule); continue;
      }
    }
    if (!rule.comparison) { unmapped.push(rule); continue; }
    const group = groups.get(rule.comparison.key) ?? [];
    group.push(rule);
    groups.set(rule.comparison.key, group);
  }
  return { groups, unmapped, unresolved_context, excluded_context };
}

// Compare recorded requirements, not source pagination, examples or editorial verification dates.
// This deliberately does not claim semantic equivalence of XPath or natural-language checks.
function requirements(rule: ComparableRule) {
  return {
    target: rule.target, obligation: rule.obligation, obligation_code: rule.obligation_code,
    normative_requirement: rule.normative_requirement, requirement: rule.requirement,
    condition: rule.condition, object_types: rule.object_types, cataloguing_rules: rule.cataloguing_rules,
    cataloguing_applicability: rule.cataloguing_scope?.applicability,
  };
}

export function compareRuleContexts(rules: ComparableRule[], left: ComparisonSelection, right: ComparisonSelection) {
  const a = select(rules, left);
  const b = select(rules, right);
  const comparisons = [...new Set([...a.groups.keys(), ...b.groups.keys()])].sort().map((key) => {
    const before = a.groups.get(key) ?? [];
    const after = b.groups.get(key) ?? [];
    const base = { key, left: before, right: after };
    if (before.length > 1 || after.length > 1) return { ...base, status: "ambiguous_mapping" as const, changes: [] };
    if (!before[0] || !after[0]) return { ...base, status: "no_counterpart" as const, changes: [] };
    const changes = diffFields(requirements(before[0]), requirements(after[0]));
    if ([before[0], after[0]].some((rule) => rule.verification.status !== "verified" || rule.status !== "normative")) {
      return { ...base, status: "unverified" as const, changes };
    }
    const differentContext = changes.some((change) => ["condition", "object_types", "cataloguing_rules", "cataloguing_applicability"].some((field) => change.field === field || change.field.startsWith(`${field}.`)));
    return { ...base, status: !changes.length ? "same_recorded_requirement" as const
      : differentContext ? "different_context" as const : "difference_for_review" as const, changes };
  });
  return {
    left, right, comparisons,
    unmapped: { left: a.unmapped, right: b.unmapped },
    unresolved_context: { left: a.unresolved_context, right: b.unresolved_context },
    excluded_context: { left: a.excluded_context, right: b.excluded_context },
    notice: "Porovnání evidovaných požadavků, nikoli důkaz ekvivalence nebo chyby standardu. Jiný kontext vyžaduje posouzení. Chybějící protějšek neznamená, že DMF údaj neupravuje, dovoluje nebo zakazuje. Ostatní podmínky nejsou vyhodnoceny; plné prameny a kontexty jsou u obou stran.",
  };
}
