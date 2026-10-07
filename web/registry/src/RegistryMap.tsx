import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import type { RegistryEntity, RuleVersion } from "./api.ts";
import type { Relation } from "./explore.ts";
import { buildRegistryMap, mapRulesUrl, type summarizeRules } from "./registry-map.ts";

const shortObligations: Record<string, string> = { mandatory: "M", mandatory_if_available: "MA", recommended: "R", recommended_if_available: "RA", optional: "O", forbidden: "Nepoužívá se", unspecified: "Neurčeno" };
type Summary = ReturnType<typeof summarizeRules>;
const ruleWord = (count: number) => count === 1 ? "pravidlo" : count >= 2 && count <= 4 ? "pravidla" : "pravidel";
const recordWord = (count: number) => count === 1 ? "záznam" : count >= 2 && count <= 4 ? "záznamy" : "záznamů";
function ObligationBar({ summary }: { summary: Summary }) {
  return <><div className="map-obligation-bar" aria-hidden="true">{summary.obligations.map(({ value, count }) =>
    <span key={value} className={`map-obligation--${value}`} style={{ flex: count } as CSSProperties} />)}</div>
    <ul className="map-obligations" aria-label="Rozložení povinností ve verzovaných záznamech">{summary.obligations.map(({ value, label, count }) =>
      <li key={value} title={label}><span className={`map-swatch map-obligation--${value}`} aria-hidden="true" /><span>{shortObligations[value] ?? label}</span><strong>{count}</strong></li>)}</ul></>;
}

export function RegistryMap({ rules, relations, nationalStandards, topicLabels, onNavigate }: {
  rules: RuleVersion[]; relations: Relation[]; nationalStandards: RegistryEntity[]; topicLabels: Record<string, string>;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [national, setNational] = useState("");
  const [version, setVersion] = useState("");
  const versions = [...new Set(rules.filter((rule) => !national || rule.national_standard_id === national).map((rule) => rule.version))].sort();
  const selected = useMemo(() => rules.filter((rule) => (!national || rule.national_standard_id === national) && (!version || rule.version === version)), [rules, national, version]);
  const model = useMemo(() => buildRegistryMap(selected, relations), [selected, relations]);
  const href = (extra: Record<string, string> = {}) => mapRulesUrl({ national, version, ...extra });
  const populated = model.areas.filter((area) => area.standards.some((standard) => standard.records));
  const empty = model.areas.flatMap((area) => area.standards.filter((standard) => !standard.records).map((standard) => ({ ...standard, areaLabel: area.label })));
  return <>
    <div className="map-toolbar"><label>Standard NDK<select value={national} onChange={(event) => { setNational(event.target.value); setVersion(""); }}><option value="">Všechny standardy NDK</option>{nationalStandards.map((standard) => <option key={standard.id} value={standard.id}>{standard.title.cs ?? standard.title.en ?? standard.id}</option>)}</select></label>
      <label>Verze NDK<select value={version} onChange={(event) => setVersion(event.target.value)}><option value="">Všechny verze</option>{versions.map((item) => <option key={item}>{item}</option>)}</select></label>
      <a className="button" href={href()} onClick={onNavigate}>Otevřít seznam pravidel</a></div>
    <p className="map-summary" role="status"><strong>{model.rules}</strong> {ruleWord(model.rules)} · <strong>{model.records}</strong> {model.records === 1 ? "verzovaný záznam" : model.records >= 2 && model.records <= 4 ? "verzované záznamy" : "verzovaných záznamů"} ve vybraném rozsahu</p>
    <p className="muted">Mapa obsahu podle cílových prvků, nikoli citovaných pramenů. Barevné pruhy ukazují rozložení povinností ve vložených záznamech, ne úplnost standardu nebo závažnost chyb.</p>
    <details className="map-legend"><summary>Legenda povinností a počítání</summary><p>M — povinné; MA — povinné, pokud je údaj dostupný; R — doporučené; RA — doporučené, pokud je údaj dostupný; O — volitelné. „Nepoužívá se“ znamená nepoužití pouze v kontextu daného pravidla NDK, nikoli obecný zákaz v mezinárodním standardu. Podmínky, zdůvodnění a neurčené povinnosti jsou v detailu pravidla.</p><p>Počet pravidel označuje unikátní ID; jeden záznam patří ke konkrétní verzi NDK. Při výběru všech verzí se povinnosti počítají za každou verzi zvlášť, bez automatického převodu historických kódů.</p></details>
    {populated.map((area) => <section className="map-area" key={area.id}><h2>{area.label}</h2>{area.standards.filter((standard) => standard.records).map((standard) =>
      <div className="map-standard" key={standard.id}><div className="map-standard-heading"><h3><a href={href({ standard: standard.id })} onClick={onNavigate}>{standard.label}</a></h3><span>{standard.rules} {ruleWord(standard.rules)} · {standard.records} {recordWord(standard.records)}</span></div>
        <div className="map-tiles">{standard.topics.map((topic) => <a className="map-tile" key={topic.category} href={href({ standard: standard.id, category: topic.category })} onClick={onNavigate}>
          <h4>{topicLabels[topic.category] ?? topic.category}</h4><p><strong>{topic.rules}</strong> {ruleWord(topic.rules)} <span>· {topic.records} {recordWord(topic.records)}</span></p><ObligationBar summary={topic} /><span className="map-tile-action">Zobrazit pravidla →</span>
        </a>)}</div>
      </div>)}</section>)}
    {model.unclassified.length > 0 && <section className="map-area"><h2>Ostatní / nezařazené cíle</h2><p>Tyto záznamy nemají zařazení ve společném katalogu metadat.</p><ul>{model.unclassified.map((rule) => <li key={`${rule.rule_id}@${rule.version}`}><a href={`/registry/rules/${encodeURIComponent(rule.rule_id)}?version=${encodeURIComponent(rule.version)}`} onClick={onNavigate}>{rule.title.cs ?? rule.rule_id} · {rule.version}</a></li>)}</ul></section>}
    {empty.length > 0 && <section className="map-area"><h2>Další metadatové standardy</h2><p className="muted">Bez vložených pravidel ve vybraném rozsahu. Nula neznamená, že standard nemá požadavky.</p><div className="map-empty-grid">{empty.map((standard) => <a className="map-empty" key={standard.id} href={href({ standard: standard.id })} onClick={onNavigate}><strong>{standard.label}</strong><span>{standard.areaLabel}</span><small>0 záznamů</small></a>)}</div></section>}
  </>;
}
