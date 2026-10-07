import { useEffect, useId, useState, type FormEvent } from "react";
import { api, type RegistryEntity, type RuleVersion } from "./api.ts";
import { comparisonChoiceError, comparisonLabels, comparisonParams, comparisonValue, comparisonVersions, initialComparison, selectionLabel, type ComparisonChoice, type ComparisonResult, type ComparisonStatus } from "./comparison.ts";
import { obligationLabel } from "./obligation.ts";
import { CataloguingScope } from "./CataloguingScope.tsx";

const text = (value: Record<string, string | undefined> | undefined) => value?.cs ?? value?.en ?? "—";
const ruleHref = (rule: RuleVersion) => `/registry/rules/${encodeURIComponent(rule.rule_id)}?version=${encodeURIComponent(rule.version)}`;

function Choice({ side, choice, standards, onChange }: { side: string; choice: ComparisonChoice; standards: RegistryEntity[]; onChange: (choice: ComparisonChoice) => void }) {
  const helpId = useId();
  const versions = comparisonVersions(standards.find((item) => item.id === choice.national_standard));
  return <fieldset className="comparison-choice"><legend>{side}</legend>
    <label>Standard NDK<select value={choice.national_standard} onChange={(event) => {
      const id = event.target.value;
      onChange({ ...choice, national_standard: id, version: comparisonVersions(standards.find((item) => item.id === id))[0] ?? "" });
    }}>{!standards.some((item) => item.id === choice.national_standard) ? <option value={choice.national_standard}>{choice.national_standard || "Vyberte standard"} — nenalezen</option> : null}{standards.map((item) => <option key={item.id} value={item.id}>{text(item.title)}</option>)}</select></label>
    <label>Verze standardu<select value={choice.version} onChange={(event) => onChange({ ...choice, version: event.target.value })}>{!versions.includes(choice.version) ? <option value={choice.version}>{choice.version || "Vyberte verzi"} — nenalezena</option> : null}{versions.map((version) => <option key={version}>{version}</option>)}</select></label>
    <label>Katalogizační pravidla<select aria-describedby={helpId} value={choice.cataloguing} onChange={(event) => onChange({ ...choice, cataloguing: event.target.value })}><option value="">Bez omezení (všechny varianty)</option><option value="aacr2">AACR2</option><option value="rda">RDA</option>{!["", "aacr2", "rda"].includes(choice.cataloguing) ? <option value={choice.cataloguing}>{choice.cataloguing} — neznámý režim</option> : null}</select></label>
    <p id={helpId}>Omezuje pouze pravidla s relevantním katalogizačním rozsahem. Nezávislé technické a strukturální požadavky zůstávají zahrnuté.</p>
  </fieldset>;
}

function RuleSide({ side, rules }: { side: string; rules: RuleVersion[] }) {
  return <section className="comparison-side"><h4>{side}</h4>{rules.length ? rules.map((rule) => {
    const url = typeof rule.source.url === "string" && /^https?:\/\//i.test(rule.source.url) ? rule.source.url : undefined;
    return <article key={`${rule.rule_id}@${rule.version}`}><h5><a href={ruleHref(rule)}>{text(rule.title)}</a></h5><code>{rule.rule_id}</code>
      <p><strong>{obligationLabel(rule)}</strong></p><p>{text(rule.normative_requirement)}</p>
      <CataloguingScope rule={rule} />
      {rule.comparison ? <details><summary>Proč jsou pravidla porovnávána</summary><p>{text(rule.comparison.note)}</p></details> : null}
      {rule.non_use ? <p className="comparison-caution">{rule.non_use.basis === "explicit" ? "Výslovné nepoužití ve zdroji. " : "Nepoužití je výklad omezení zdroje. "}{rule.non_use.note.cs ?? rule.non_use.note.en}</p> : null}
      <div className="comparison-source"><strong>Pramen</strong><p>{String(rule.source.document ?? "Neuveden")}{rule.source.version ? ` · verze ${rule.source.version}` : ""}{rule.source.page ? ` · s. ${rule.source.page}` : ""}</p>{rule.source.section ? <p>{String(rule.source.section)}</p> : null}{url ? <a href={url} target="_blank" rel="noopener noreferrer">Otevřít pramen</a> : <p>Odkaz na pramen neuveden.</p>}</div>
      <details><summary>Podmínky a strojový požadavek</summary><h6>Podmínky platnosti</h6><pre>{comparisonValue(rule.condition)}</pre><h6>Požadavek</h6><pre>{comparisonValue(rule.requirement)}</pre><h6>Ověření přepisu</h6><p>{rule.verification.status} · {rule.verification.date ?? "Datum neuvedeno"}</p><p>{rule.verification.reference}</p></details>
    </article>;
  }) : <p>Protějšek v tomto výběru nenalezen. Nejde o důkaz, že standard požadavek neobsahuje.</p>}</section>;
}

function UnpairedList({ title, note, sides }: { title: string; note: string; sides: { left: RuleVersion[]; right: RuleVersion[] } }) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(20);
  return <details className="comparison-unpaired" onToggle={(event) => setOpen(event.currentTarget.open)}><summary>{title} — A: {sides.left.length}, B: {sides.right.length}</summary>{open ? <><p>{note}</p><div className="comparison-columns">{([['A', sides.left], ['B', sides.right]] as const).map(([side, rules]) => <section key={side}><h3>Strana {side} ({rules.length})</h3>{rules.length ? <ul>{rules.slice(0, limit).map((rule) => <li key={`${rule.rule_id}@${rule.version}`}><a href={ruleHref(rule)}>{text(rule.title)}</a> <small>{rule.rule_id} · {rule.version}</small></li>)}</ul> : <p>Žádné záznamy.</p>}</section>)}</div>{Math.max(sides.left.length, sides.right.length) > limit ? <button onClick={() => setLimit((value) => value + 20)}>Zobrazit dalších 20 na každé straně</button> : null}</> : null}</details>;
}

export function ComparisonResults({ result }: { result: ComparisonResult }) {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(20);
  const needle = query.trim().toLocaleLowerCase("cs");
  const included = (side: "left" | "right") => [...result.comparisons.flatMap((item) => item[side]), ...result.unmapped[side]];
  const independentCount = (side: "left" | "right") => included(side).filter((rule) => rule.cataloguing_scope?.applicability === "independent").length;
  const commonCount = (side: "left" | "right") => included(side).filter((rule) => rule.cataloguing_scope?.applicability === "applicable" && rule.cataloguing_rules?.length === 2).length;
  const filtered = result.comparisons.filter((item) => (!status || item.status === status) && (!needle || [item.key, ...[...item.left, ...item.right].flatMap((rule) => [rule.rule_id, text(rule.title), text(rule.normative_requirement)])].join(" ").toLocaleLowerCase("cs").includes(needle)));
  return <section aria-labelledby="comparison-results-heading"><h2 id="comparison-results-heading">Výsledek porovnání</h2>
    <div className="comparison-columns comparison-applied"><p><strong>Strana A</strong><br />{selectionLabel(result.left)}</p><p><strong>Strana B</strong><br />{selectionLabel(result.right)}</p></div>
    <p className="comparison-caution">{result.notice}</p>
    <p>Nezávislé požadavky zahrnuté ve výběru — A: {independentCount("left")}, B: {independentCount("right")}. Společné předpisy pro AACR2 a RDA — A: {commonCount("left")}, B: {commonCount("right")}. Tyto počty neznamenají počet spárovaných pravidel.</p>
    <div className="comparison-toolbar"><label>Typ výsledku<select value={status} onChange={(event) => { setStatus(event.target.value); setLimit(20); }}><option value="">Všechny ({result.comparisons.length})</option>{Object.entries(comparisonLabels).map(([key, label]) => <option key={key} value={key}>{label} ({result.comparisons.filter((item) => item.status === key).length})</option>)}</select></label><label>Hledat v porovnaných pravidlech<input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(20); }} placeholder="Název, ID, požadavek nebo významový klíč" /></label></div>
    <p role="status">Zobrazeno {Math.min(limit, filtered.length)} z {filtered.length} výsledků · celkem {result.comparisons.length} významových klíčů.</p>
    {!result.comparisons.length ? <p className="state">Pro tento výběr nejsou evidovány žádné významové klíče k porovnání. Nejde o shodu standardů. Prověřte seznamy níže.</p> : !filtered.length ? <p className="state">Žádný výsledek neodpovídá filtru. <button onClick={() => { setStatus(""); setQuery(""); }}>Zrušit filtry</button></p> : null}
    {filtered.slice(0, limit).map((item) => <article className="comparison-card" key={item.key}><header><p className="layer-label">{comparisonLabels[item.status]}</p><h3>{item.key}</h3></header>
      {item.scope_changes.length ? <div><p>Jiný druh dokumentu, porovnávaný požadavek na stejný prvek. Rozsah platnosti je uveden zvlášť a sám neznamená rozdíl požadavku.</p><details><summary>Rozdílný rozsah dokumentů</summary>{item.scope_changes.map((change) => <section key={change.field}><h4>{change.field}</h4><div className="comparison-columns"><div><strong>A</strong><pre>{comparisonValue(change.old)}</pre></div><div><strong>B</strong><pre>{comparisonValue(change.new)}</pre></div></div></section>)}</details></div> : null}
      {item.status === "different_context" ? <p>Rozdílný kontext sám nepotvrzuje chybu ani záměrnost rozdílu.</p> : null}
      {item.status === "ambiguous_mapping" ? <p>Existuje více kandidátů. Zpřesněte katalogizační režim; žádný kandidát nebyl automaticky vybrán.</p> : null}
      <div className="comparison-columns"><RuleSide side="Strana A" rules={item.left} /><RuleSide side="Strana B" rules={item.right} /></div>
      {item.changes.length ? <details className="comparison-changes"><summary>Rozdíly zaznamenaných polí ({item.changes.length})</summary>{item.changes.map((change) => <section key={change.field}><h4>{change.field}</h4><div className="comparison-columns"><div><strong>A</strong><pre>{comparisonValue(change.old)}</pre></div><div><strong>B</strong><pre>{comparisonValue(change.new)}</pre></div></div></section>)}</details> : null}
    </article>)}
    {filtered.length > limit ? <button onClick={() => setLimit((value) => value + 20)}>Zobrazit dalších 20 výsledků</button> : null}
    <h2 className="comparison-remainder-heading">Záznamy mimo párové porovnání</h2>
    <UnpairedList title="Zahrnutá pravidla bez významového klíče" note="Pravidla vyhovují katalogizačnímu výběru, včetně nezávislých požadavků, ale nemají přiřazený klíč pro párové porovnání. Nejde o neprověřenou katalogizaci; samotná shoda XML názvu nestačí k párování." sides={result.unmapped} />
    <UnpairedList title="Katalogizační rozsah dosud neurčen" note="Chybí doložené určení relevantního rozsahu nebo nezávislosti. Nelze automaticky předpokládat ani oba režimy, ani nezávislost." sides={result.unresolved_context} />
    <UnpairedList title="Mimo zvolený katalogizační režim" note="Pravidla byla z výběru vyřazena podle evidovaného katalogizačního rozsahu nebo podmínky; nejsou tím zrušena." sides={result.excluded_context} />
  </section>;
}

function ComparisonWorkspace({ standards, search, onApply }: { standards: RegistryEntity[]; search: string; onApply: (query: string) => void }) {
  const [initial] = useState(() => initialComparison(search, standards));
  const [left, setLeft] = useState(initial[0]);
  const [right, setRight] = useState(initial[1]);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<ComparisonResult>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const initialError = comparisonChoiceError(initial[0], standards) ?? comparisonChoiceError(initial[1], standards);
  const formError = comparisonChoiceError(left, standards) ?? comparisonChoiceError(right, standards);
  const params = comparisonParams(initial[0], initial[1]).toString();
  const draftParams = comparisonParams(left, right).toString();
  useEffect(() => {
    if (initialError) return;
    const controller = new AbortController();
    setLoading(true); setError(""); setResult(undefined);
    api.compare(params, controller.signal).then((data) => { if (!controller.signal.aborted) setResult(data); })
      .catch(() => { if (!controller.signal.aborted) setError("Porovnání se nepodařilo načíst. Zkontrolujte připojení nebo opakujte požadavek."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [params, initialError, retry]);
  function submit(event: FormEvent) { event.preventDefault(); if (!formError) onApply(draftParams); }
  return <><form className="comparison-form" onSubmit={submit}><div className="comparison-columns"><Choice side="Strana A" choice={left} standards={standards} onChange={setLeft} /><Choice side="Strana B" choice={right} standards={standards} onChange={setRight} /></div>
    <div className="comparison-actions"><button type="submit" disabled={Boolean(formError)}>Porovnat</button><button type="button" onClick={() => { setLeft(right); setRight(left); }}>Prohodit strany</button><a href={`/registry/compare?${params}`}>Odkaz na zobrazené porovnání</a></div>
    {formError ? <p role="alert">{formError}</p> : null}{draftParams !== params ? <p role="status">Výběr je změněný. Pro aktualizaci výsledku stiskněte Porovnat.</p> : null}
  </form>
    {initialError ? <p role="alert" className="state state--error">Odkaz neobsahuje platný výběr. {initialError} Opravte jej ve formuláři.</p> : loading ? <p role="status" className="state">Načítám porovnání…</p> : error ? <div role="alert" className="state state--error"><p>{error}</p><button onClick={() => setRetry((value) => value + 1)}>Zkusit znovu</button></div> : result ? <ComparisonResults key={`${params}:${retry}`} result={result} /> : null}
  </>;
}

export function PeriodicalComparisonLink({ standards }: { standards: RegistryEntity[] }) {
  if (!comparisonVersions(standards.find((item) => item.id === "ndk-monograph")).includes("2.3")
    || !comparisonVersions(standards.find((item) => item.id === "ndk-periodical")).includes("2.2")) return null;
  const params = comparisonParams(
    { national_standard: "ndk-monograph", version: "2.3", cataloguing: "" },
    { national_standard: "ndk-periodical", version: "2.2", cataloguing: "" });
  return <p><a href={`/registry/compare?${params}`}>Porovnat Monografie 2.3 a Periodika 2.2</a> — zpracované dvojice MIX pro MC/PS, nezávislých na AACR2/RDA. Pro jejich výběr zadejte do hledání výsledků „mix.mc-ps.“.</p>;
}

export function ComparisonPage() {
  const [search, setSearch] = useState(() => window.location.search);
  const [standards, setStandards] = useState<RegistryEntity[]>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => { const update = () => setSearch(window.location.search); window.addEventListener("popstate", update); return () => window.removeEventListener("popstate", update); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError(false); setStandards(undefined);
    api.nationalStandards(controller.signal).then((data) => { if (!controller.signal.aborted) setStandards(data.data); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [retry]);
  function apply(query: string) { const next = `?${query}`; if (next !== window.location.search) history.pushState({}, "", `/registry/compare${next}`); setSearch(next); }
  return <main className="comparison-page"><header className="page-header"><div><p className="eyebrow">Pravidla v souvislostech</p><h1>Porovnání standardů</h1></div></header><p className="lead">Porovnejte zaznamenané požadavky dvou DMF, verzí nebo katalogizačních režimů. Výsledky závisí na dosud zpracovaném mapování; nalezený rozdíl není automaticky chyba.</p>
    {standards ? <PeriodicalComparisonLink standards={standards} /> : null}
    {error ? <div role="alert" className="state state--error"><p>Seznam standardů se nepodařilo načíst.</p><button onClick={() => setRetry((value) => value + 1)}>Zkusit znovu</button></div> : !standards ? <p role="status">Načítám standardy…</p> : !standards.length ? <p className="state">Dosud nejsou evidovány žádné standardy pro porovnání.</p> : <ComparisonWorkspace key={search} standards={standards} search={search} onApply={apply} />}
  </main>;
}
