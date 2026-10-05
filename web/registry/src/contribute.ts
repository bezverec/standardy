export function changeProposalUrl(rule?: { rule_id: string; version: string }): string {
  const url = new URL("https://github.com/bezverec/standardy/issues/new");
  url.searchParams.set("title", rule ? `Návrh změny: ${rule.rule_id} (NDK ${rule.version})` : "Návrh změny registru");
  const context = rule
    ? `Pravidlo: ${rule.rule_id}\nVerze standardu NDK: ${rule.version}\nOdkaz: https://standardy.digitalizaty.cz/registry/rules/${encodeURIComponent(rule.rule_id)}?version=${encodeURIComponent(rule.version)}`
    : "Registr: https://standardy.digitalizaty.cz/registry/rules";
  url.searchParams.set("body", `${context}\n\n## Navrhovaná změna\n\n\n## Důvod a opora v původním zdroji\n\nUveďte prosím dokument, verzi, stránku nebo odkaz.\n`);
  return url.toString();
}
