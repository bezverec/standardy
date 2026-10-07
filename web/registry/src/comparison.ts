import type { ComparisonSelection, compareRuleContexts } from "../../../packages/registry-core/src/rule-comparison.ts";
import type { FieldChange } from "../../../packages/registry-core/src/semantic-diff.ts";
import type { RegistryEntity, RuleVersion } from "./api.ts";

export type ComparisonStatus = ReturnType<typeof compareRuleContexts>["comparisons"][number]["status"];
export interface ComparisonResult {
  left: ComparisonSelection;
  right: ComparisonSelection;
  comparisons: Array<{ key: string; status: ComparisonStatus; left: RuleVersion[]; right: RuleVersion[]; changes: FieldChange[]; scope_changes: FieldChange[] }>;
  unmapped: { left: RuleVersion[]; right: RuleVersion[] };
  unresolved_context: { left: RuleVersion[]; right: RuleVersion[] };
  excluded_context: { left: RuleVersion[]; right: RuleVersion[] };
  notice: string;
}
export interface ComparisonChoice { national_standard: string; version: string; cataloguing: string }
export const comparisonLabels: Record<ComparisonStatus, string> = {
  same_recorded_requirement: "Shodný požadavek",
  different_context: "Odlišný kontext",
  difference_for_review: "Rozdíl k posouzení",
  no_counterpart: "Bez nalezeného protějšku",
  ambiguous_mapping: "Nejednoznačné přiřazení",
  unverified: "Neověřený nebo sporný požadavek",
};
export function comparisonParams(left: ComparisonChoice, right: ComparisonChoice): URLSearchParams {
  const params = new URLSearchParams();
  for (const [side, choice] of [["a", left], ["b", right]] as const) {
    params.set(`national_standard_${side}`, choice.national_standard);
    params.set(`version_${side}`, choice.version);
    if (choice.cataloguing) params.set(`cataloguing_${side}`, choice.cataloguing);
  }
  return params;
}
export function comparisonVersions(standard: RegistryEntity | undefined): string[] {
  return [...new Set(standard?.versions.flatMap((item) => typeof item.version === "string" ? [item.version] : []) ?? [])];
}
export function initialComparison(search: string, standards: RegistryEntity[]): [ComparisonChoice, ComparisonChoice] {
  const params = new URLSearchParams(search);
  const defaultStandard = standards.find((item) => item.id === "ndk-monograph") ?? standards[0];
  const hasSelection = ["national_standard_a", "version_a", "cataloguing_a", "national_standard_b", "version_b", "cataloguing_b"].some((key) => params.has(key));
  return ["a", "b"].map((side) => {
    const standardId = hasSelection ? params.get(`national_standard_${side}`) ?? "" : defaultStandard?.id ?? "";
    const versions = comparisonVersions(standards.find((item) => item.id === standardId));
    return { national_standard: standardId, version: hasSelection ? params.get(`version_${side}`) ?? "" : versions.includes("2.3") ? "2.3" : versions[0] ?? "",
      cataloguing: hasSelection ? params.get(`cataloguing_${side}`) ?? "" : side === "a" ? "aacr2" : "rda" };
  }) as [ComparisonChoice, ComparisonChoice];
}
export function comparisonChoiceError(choice: ComparisonChoice, standards: RegistryEntity[]): string | undefined {
  const standard = standards.find((item) => item.id === choice.national_standard);
  if (!standard) return "Vyberte existující standard NDK.";
  if (!comparisonVersions(standard).includes(choice.version)) return "Vyberte evidovanou verzi zvoleného standardu.";
  if (!["", "aacr2", "rda"].includes(choice.cataloguing)) return "Katalogizační režim musí být AACR2, RDA nebo bez omezení.";
  return undefined;
}
export function selectionLabel(selection: ComparisonSelection): string {
  return `${selection.national_standard} · ${selection.version} · ${selection.cataloguing_rules === "aacr2" ? "AACR2" : selection.cataloguing_rules === "rda" ? "RDA" : "bez omezení katalogizace"}`;
}
export function comparisonValue(value: unknown): string {
  return value === undefined ? "Neuvedeno" : typeof value === "string" ? value : JSON.stringify(value, null, 2);
}
