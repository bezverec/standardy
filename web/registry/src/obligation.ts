import type { RuleVersion } from "./api.ts";

export const obligationOptions: Array<[RuleVersion["obligation"], string]> = [
  ["mandatory", "Povinné"],
  ["mandatory_if_available", "Povinné, pokud je údaj dostupný"],
  ["recommended", "Doporučené"],
  ["recommended_if_available", "Doporučené, pokud je údaj dostupný"],
  ["optional", "Volitelné"],
  ["forbidden", "Zakázané"],
  ["unspecified", "Neurčeno"],
];

export function obligationLabel(rule: Pick<RuleVersion, "obligation" | "obligation_code">): string {
  const label = obligationOptions.find(([value]) => value === rule.obligation)?.[1] ?? rule.obligation;
  return rule.obligation_code ? `${label} (${rule.obligation_code})` : label;
}
