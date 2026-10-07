import type { RuleVersion } from "./api.ts";

export function cataloguingLabel(rule: Pick<RuleVersion, "cataloguing_scope" | "cataloguing_rules">): string {
  if (rule.cataloguing_scope?.applicability === "independent") return "Nezávislé na katalogizačních pravidlech";
  if (rule.cataloguing_scope?.applicability !== "applicable" || !rule.cataloguing_rules?.length) return "Katalogizační rozsah dosud neurčen";
  return rule.cataloguing_rules.length === 2 ? "Společný předpis pro AACR2 a RDA"
    : rule.cataloguing_rules[0] === "aacr2" ? "Pouze AACR2" : "Pouze RDA";
}

export function CataloguingScope({ rule }: { rule: Pick<RuleVersion, "cataloguing_scope" | "cataloguing_rules"> }) {
  const scope = rule.cataloguing_scope;
  // Independent requirements do not need a prominent AACR2/RDA warning on every detail.
  return <details className="cataloguing-scope"><summary>{cataloguingLabel(rule)}</summary>
    {scope ? <><p>{scope.note.cs ?? scope.note.en}</p><p>Posouzeno: {scope.reviewed_on}. Jde o rozsah tohoto požadavku, nikoli o posouzení celého katalogizačního záznamu.</p>
      <ul>{scope.sources.map((source, index) => <li key={index}>{source.document}{source.version ? ` · verze ${source.version}` : ""}{source.page !== null ? ` · s. ${source.page}` : ""}{source.section ? ` · ${source.section}` : ""}{source.url && /^https?:\/\//i.test(source.url) ? <> · <a href={source.url} target="_blank" rel="noopener noreferrer">Pramen posouzení</a></> : null}</li>)}</ul>
    </> : <p>Chybějící posouzení neprokazuje nezávislost ani společnou platnost pro AACR2 a RDA.</p>}
  </details>;
}
