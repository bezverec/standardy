import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { api, type KnowledgeGraphResponse, type RegistryEntity, type RuleDetailResponse, type RuleVersion } from "./api.ts";
import { RelationshipGraph } from "./RelationshipGraph.tsx";
import { CodeExamples } from "./CodeExamples.tsx";
import { RegistryMap } from "./RegistryMap.tsx";
import { graphNodeLabel } from "./graph.ts";
import { metadataAreas, metadataStandards, targetStandardId } from "../../../packages/registry-core/src/metadata-taxonomy.ts";
import { filterRules, ruleCounts, sourceIds, type Relation } from "./explore.ts";
import { changeProposalUrl } from "./contribute.ts";
import { issueReferences, linkIssueMentions } from "./evidence.ts";
import { RegistryNavigation } from "./RegistryNavigation.tsx";
import { obligationLabel, obligationOptions } from "./obligation.ts";

function routePath(): string {
  const path = window.location.pathname.replace(/^\/registry\/?/, "/");
  return path === "" ? "/" : path;
}

function navigate(event: MouseEvent<HTMLAnchorElement | SVGAElement>): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const href = event.currentTarget.getAttribute("href");
  if (!href) return;
  event.preventDefault();
  history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Link({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return <a href={`/registry${to === "/" ? "/" : to}`} onClick={navigate} className={className}>{children}</a>;
}

function useAsync<T>(loader: () => Promise<T>, dependencies: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    loader().then((data) => active && setState({ data, loading: false }))
      .catch((error: unknown) => active && setState({ error: error instanceof Error ? error.message : String(error), loading: false }));
    return () => { active = false; };
    // The caller supplies stable primitive dependencies for each request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  return state;
}

function localized(value: Record<string, string> | undefined): string {
  return value?.cs ?? value?.en ?? "—";
}

function Status({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "error" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function ChangeProposal({ rule }: { rule?: { rule_id: string; version: string } }) {
  return <a className="button" href={changeProposalUrl(rule)} target="_blank" rel="noopener noreferrer">Navrhnout změnu</a>;
}

function ObligationHelp() {
  return <details className="obligation-help"><summary>Co znamená úroveň povinnosti?</summary><p>Přebírá se z citované verze standardu, není závažností chyby ani výsledkem validace souboru. Kódy NDK: M — povinné; MA — povinné, pokud je údaj dostupný; R — doporučené; RA — doporučené, pokud je údaj dostupný; O — volitelné. Dostupnost údaje u MA/RA není totéž jako podmínka platnosti pravidla. Povinnost platí jen za uvedených podmínek; sporný význam a ověření se evidují zvlášť.</p><p>Podle <a href="https://github.com/NLCR/Standard_NDK/issues/258" target="_blank" rel="noopener noreferrer">návrhu NDK #258</a> mají nové verze DMF postupně používat M, MA a R; RA/O se v nich sjednotí na R. Starší záznamy zachovávají původní označení. Návrh sám neurčuje povinnost konkrétního pravidla.</p></details>;
}

function LoadingState({ state }: { state: { loading: boolean; error?: string } }) {
  if (state.loading) return <div className="state">Načítám data registru…</div>;
  if (state.error) return <div role="alert" className="state state--error"><strong>Záznam se nepodařilo načíst.</strong><p>{state.error}</p><button onClick={() => window.location.reload()}>Zkusit znovu</button></div>;
  return null;
}

function Rules() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const state = useAsync(async () => {
    const [rules, sources, national, relations] = await Promise.all([api.rules(), api.standards(), api.nationalStandards(), api.relations()]);
    return { ...rules, sources: sources.data, national: national.data, relations: relations.data };
  }, []);
  const initial = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(initial.get("q") ?? "");
  const [filters, setFilters] = useState<Record<string, string>>(Object.fromEntries(["obligation", "source", "standard", "metadata_area", "national", "version", "category", "verification", "status", "object"].map((key) => [key, initial.get(key) ?? ""])));
  const rules = useMemo(() => filterRules(state.data?.data ?? [], query, filters, state.data?.relations ?? []), [state.data, query, filters]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const counts = state.data ? ruleCounts(state.data.data) : undefined;
  const standardCounts = useMemo(() => {
    const result = new Map<string, number>();
    for (const rule of state.data?.data ?? []) {
      const standard = targetStandardId(rule.target.entity, state.data?.relations ?? []);
      if (standard) result.set(standard, (result.get(standard) ?? 0) + 1);
    }
    return result;
  }, [state.data]);
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    const search = params.size ? `?${params.toString()}` : "";
    history.replaceState({}, "", `/registry/rules${search}`);
  }, [query, filters]);
  function filter(key: string, label: string, options: Array<[string, string]>) {
    return <label key={key}>{label}<select value={filters[key] ?? ""} onChange={(event) => setFilters((old) => ({ ...old, [key]: event.target.value }))}><option value="">Vše</option>{options.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label>;
  }
  const values = (field: "version" | "category" | "status") => [...new Set(state.data?.data.map((rule) => rule[field]))].sort().map((value): [string, string] => [value, labels[value] ?? value]);
  const clear = () => { setQuery(""); setFilters(Object.fromEntries(Object.keys(filters).map((key) => [key, ""]))); };
  return <main>
    <header className="page-header"><div><p className="eyebrow">Databáze standardů</p><h1>Pravidla NDK</h1><p>Požadavek, jeho význam a původní zdroj na jednom místě.</p></div><div className="page-actions"><div className="count-label" title="Jedno pravidlo může mít více záznamů pro různé verze standardu NDK."><strong>{counts?.rules ?? "—"}</strong><span>Počet pravidel</span><small>{counts?.records ?? "—"} verzovaných záznamů</small></div><ChangeProposal /></div></header>
    <LoadingState state={state} />
    {state.data && <>
      <label className="search-label">Hledat v celé databázi pravidel<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Název, element, požadavek, interpretace nebo zdroj…" /></label>
      <button className="mobile-filter-toggle" aria-expanded={filtersOpen} aria-controls="rule-filters" onClick={() => setFiltersOpen((value) => !value)}>{filtersOpen ? "Skrýt filtry" : "Zobrazit filtry"}{activeFilterCount > 0 ? ` (${activeFilterCount} aktivní)` : ""}</button>
      <div className="explorer-layout"><aside id="rule-filters" className={`filter-panel${filtersOpen ? " filter-panel--open" : ""}`}><div className="filter-heading"><h2>Filtry</h2><button className="text-button" onClick={clear}>Vymazat</button></div>
        {filter("national", "Standard NDK", state.data.national.map((item) => [item.id, localized(item.title)]))}
        {filter("version", "Verze NDK", values("version"))}
        {filter("metadata_area", "Oblast metadat", metadataAreas.map((area) => [area.id, `${area.label} (${metadataStandards.filter((standard) => standard.area === area.id).reduce((total, standard) => total + (standardCounts.get(standard.id) ?? 0), 0)})`]))}
        {filter("standard", "Metadatový standard", metadataStandards.map((standard) => [standard.id, `${standard.label} (${standardCounts.get(standard.id) ?? 0})`]))}
        {filter("category", "Téma pravidla", values("category"))}
        <details><summary>Jak funguje třídění?</summary><p>Oblast a metadatový standard vycházejí z cílového prvku. Počty označují všechny verzované záznamy před ostatními filtry. Nula znamená, že pravidla pro tuto oblast zatím nejsou vložená.</p><p>Jde o navigační členění rolí v NDK, nikoli výčet všeho, co daný standard umožňuje.</p><ul>{metadataStandards.map((standard) => <li key={standard.id}><a href={standard.url} target="_blank" rel="noopener noreferrer">{standard.label}</a> — {metadataAreas.find((area) => area.id === standard.area)?.label}</li>)}</ul></details>
        {filter("source", "Citovaný zdrojový standard", state.data.sources.map((item) => [item.id, item.id]))}
        {filter("object", "Typ dokumentu", [...new Set(state.data.data.flatMap((rule) => rule.object_types?.values ?? []))].map((item) => [item, labels[item] ?? item]))}
        {filter("obligation", "Úroveň povinnosti", obligationOptions)}
        <ObligationHelp />
        {filter("verification", "Ověření přepisu", [["verified", "Ověřeno"], ["unverified", "Neověřeno"], ["disputed", "Sporné"]])}
        {filter("status", "Stav požadavku", values("status"))}
      </aside><section className="results"><div className="results-heading"><p role="status" aria-live="polite">Nalezeno <strong>{rules.length}</strong> z {state.data.pagination.total} verzovaných záznamů</p><span>Řazeno podle ID</span></div>
        {!rules.length && <div className="state"><h2>Žádné pravidlo neodpovídá</h2><p>Zkuste kratší dotaz nebo uvolněte některý filtr.</p><button onClick={clear}>Vymazat hledání a filtry</button></div>}
        {rules.map((rule) => <RuleCard key={`${rule.rule_id}@${rule.version}`} rule={rule} relations={state.data!.relations} />)}
      </section></div>
    </>}
  </main>;
}

function MapPage() {
  const state = useAsync(async () => {
    const [rules, relations, national] = await Promise.all([api.rules(), api.relations(), api.nationalStandards()]);
    return { rules: rules.data, relations: relations.data, nationalStandards: national.data };
  }, []);
  return <main><header className="page-header"><div><p className="eyebrow">Databáze standardů</p><h1>Mapa registru</h1><p>Od oblastí metadat přes tematické skupiny ke konkrétním pravidlům.</p></div><ChangeProposal /></header><LoadingState state={state} />{state.data && <RegistryMap {...state.data} topicLabels={labels} onNavigate={navigate} />}</main>;
}

const labels: Record<string, string> = { normative: "Normativní", disputed: "Sporný požadavek", draft: "Částečné pokrytí", verified: "Ověřeno", unverified: "Neověřeno", deprecated: "Historické", ambiguous: "Nejednoznačné", error: "Chyba", warning: "Varování", info: "Informace", monograph: "Monografie", "technical/icc": "Technická metadata · ICC", related_to: "souvisí s", defined_by: "je definováno v", restricts: "omezuje", clarifies: "upřesňuje", generated_by: "je generováno v", validated_by: "je kontrolováno v", derived_from: "vychází z", extends: "rozšiřuje" };
Object.assign(labels, {
  "metadata/info": "Informace o balíčku · info.xml",
  "structure/mets-files": "METS · soubory a jejich vazby",
  "structure/mets-header": "METS · kořen a hlavička",
  "structure/mets-physical": "METS · fyzická mapa",
  "structure/mets-logical": "METS · logická mapa a vazby",
  "structure/mets-internal-parts": "METS · kapitoly a obrazy",
  "structure/mets-amd": "METS · vedlejší záznam a technická metadata",
  "technical/premis-object": "PREMIS · identifikace, fixity a formát objektu",
  "technical/premis-provenance": "PREMIS · vznik a ochrana souboru",
  "technical/premis-relationships": "PREMIS · vazby objektů a událostí",
  "technical/premis-events": "PREMIS · události a jejich vazby",
  "technical/premis-agents": "PREMIS · původci událostí",
  "technical/dimensions": "Technická metadata · Rozměry obrazu",
  "technical/sampling": "Technická metadata · Vzorkování",
  "technical/color": "Technická metadata · Barevné kódování",
});

function RuleCard({ rule, relations }: { rule: RuleVersion; relations: Relation[] }) {
  return <article className="rule-card"><div className="rule-card-heading"><div><p className="rule-meta">{rule.national_standard_id} · {rule.version} · {labels[rule.category] ?? rule.category}</p><h2><Link to={`/rules/${rule.rule_id}`}>{localized(rule.title)}</Link></h2></div><Status tone={rule.status === "disputed" ? "warn" : "neutral"}>{labels[rule.status] ?? rule.status}</Status></div><p>{localized(rule.description)}</p><div className="rule-card-footer"><code>{rule.target.entity}</code><div className="source-chips">{sourceIds(rule, relations).map((id) => <Link key={id} to={`/standards/${id}`} className="source-chip">{id}</Link>)}</div><span>{labels[rule.verification.status]} · {obligationLabel(rule)}</span></div></article>;
}

function SourceCard({ source }: { source: Record<string, unknown> }) {
  const raw = typeof source.url === "string" ? source.url : "";
  const safe = /^https?:\/\//i.test(raw) ? raw : "";
  return <article className="source-card"><h3>{String(source.document ?? "Zdroj")}</h3><p>{source.version ? `Verze ${source.version}` : ""}{source.page ? ` · strana ${source.page}` : ""}</p>{Boolean(source.section) && <p>{String(source.section)}</p>}{safe && <a href={safe} target="_blank" rel="noopener noreferrer">Otevřít původní zdroj</a>}</article>;
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre>{JSON.stringify(value, null, 2)}</pre>;
}


function RuleDetail({ id }: { id: string }) {
  const state = useAsync<RuleDetailResponse>(() => api.rule(id), [id]);
  const graphState = useAsync<KnowledgeGraphResponse>(() => api.why(id), [id]);
  const initialVersion = new URLSearchParams(window.location.search).get("version") ?? "";
  const [selectedVersion, setSelectedVersion] = useState(initialVersion);
  const versions = state.data?.versions ?? [];
  const rule = versions.find((item) => item.version === selectedVersion) ?? versions[0];
  const issues = issueReferences(rule?.references ?? []);
  const evidence = (text: string) => linkIssueMentions(text, issues).map((part, index) => part.href ? <a key={index} href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a> : part.text);
  useEffect(() => { if (versions[0]) setSelectedVersion(versions.find((item) => item.version === initialVersion)?.version ?? versions[0].version); }, [state.data]);
  useEffect(() => {
    if (!rule) return;
    const url = new URL(window.location.href);
    url.searchParams.set("version", rule.version);
    history.replaceState({}, "", url);
  }, [rule?.version]);
  return <main>
    <Link to="/rules" className="back">← Všechna pravidla</Link>
    <LoadingState state={state} />
    {rule && <>
      <div className="contribute-action"><ChangeProposal rule={rule} /></div>
      <header className="detail-header"><div><p className="eyebrow">Detail pravidla</p><h1>{localized(rule.title)}</h1><code className="stable-id">{rule.rule_id}</code></div><div className="version-box"><label>Verze standardu NDK<select value={selectedVersion} onChange={(event) => setSelectedVersion(event.target.value)}>{versions.map((item) => <option key={item.version}>{item.version}</option>)}</select></label><Status tone={rule.verification.status === "verified" ? "neutral" : "warn"}>{labels[rule.verification.status]}</Status></div></header>
      <div className="facts"><div><span>Standard NDK</span><Link to={`/national-standards/${rule.national_standard_id}`}>{rule.national_standard_id}</Link></div><div><span>Cíl</span><code>{rule.target.entity}</code></div><div><span>Kategorie</span>{labels[rule.category] ?? rule.category}</div><div><span>Úroveň povinnosti</span><Status>{obligationLabel(rule)}</Status><ObligationHelp /></div></div>
      <section className="layer layer--normative"><p className="layer-label">Požadavek NDK · {labels[rule.status] ?? rule.status}</p><h2>Požadavek</h2><p>{localized(rule.normative_requirement)}</p><details><summary>Strojový zápis a podmínky platnosti</summary><JsonBlock value={rule.requirement} />{Boolean(rule.condition) && <><h3>Podmínka</h3><JsonBlock value={rule.condition} /></>}</details></section>
      {rule.examples && <CodeExamples key={`${id}@${rule.version}`} examples={rule.examples} />}
      {issues.length > 0 && <aside className="layer"><p className="layer-label">Diskuse · nenormativní</p><h2>Související issues</h2>{issues.map((issue) => <p key={issue.url}><a href={issue.url} target="_blank" rel="noopener noreferrer">{issue.title} — otevřít diskusi</a></p>)}</aside>}
      <section className="detail-grid"><article><p className="layer-label">Výklad registru</p><h2>Interpretace</h2><p>{evidence(localized(rule.interpretation))}</p></article><article><p className="layer-label">Ověření přepisu</p><h2>Stav ověření</h2><p>{labels[rule.verification.status]} · {rule.verification.date ?? "Datum neuvedeno"}</p><p>{evidence(rule.verification.reference ?? "")}</p></article></section>
      <section className="graph-section"><p className="layer-label">Prameny</p><h2>NDK a původní zdroje</h2><div className="card-grid"><SourceCard source={rule.source} />{rule.references?.map((source, index) => <SourceCard key={index} source={source} />)}</div></section>
      {Boolean(rule.discrepancies?.length) && <section className="layer layer--discrepancy"><p className="layer-label">Rozpory ve zdrojích</p><h2>Známé rozpory ve zdrojích</h2><ul>{rule.discrepancies?.map((item, index) => <li key={index}>{evidence(localized(item))}</li>)}</ul></section>}
      {(rule.validator_behaviour || rule.fix_recommendation) && <section className="detail-grid"><article><p className="layer-label">Návrh kontroly</p><h2>Očekávaná kontrola</h2><p>{localized(rule.validator_behaviour)}</p></article><article><p className="layer-label">Doporučení registru</p><h2>Doporučená oprava</h2><p>{localized(rule.fix_recommendation)}</p></article></section>}
      <section className="layer layer--implementation"><p className="layer-label">Implementace · nenormativní</p><h2>Implementace</h2><div className="implementation-grid">{(rule.implementations ?? []).map((item) => <article key={item.id}><Status tone={item.verification === "verified" ? "neutral" : "warn"}>{labels[item.verification] ?? item.verification}</Status><h3>{item.application}</h3><p>{item.role === "generator" ? "Generátor" : item.role === "validator" ? "Validátor" : "Externí nástroj"} · {({ implemented: "Implementováno", partial: "Částečně implementováno", not_implemented: "Neimplementováno", unknown: "Chování neověřeno", related: "Souvisí s pravidlem" } as Record<string, string>)[item.status] ?? item.status}</p>{item.behaviour && <p>{localized(item.behaviour)}</p>}<small>{localized(item.notes)}</small></article>)}</div></section>
      <section className="graph-section"><p className="layer-label">Vazby mezi záznamy</p><h2>Graf vztahů</h2><p className="graph-intro">Plné čáry zachycují normativní a významové vazby; přerušované čáry nenormativní vazby na implementace. Stav ověření a rozsah platnosti jsou uvedeny v jejich popisu.</p><LoadingState state={graphState} />{graphState.data && <RelationshipGraph key={id} graph={graphState.data} onNavigate={navigate} topicLabels={labels} />}<details className="relation-data"><summary>Úplný nezfiltrovaný výpis přímých vztahů</summary><div className="relations">{state.data?.relations.map((relation) => <code key={relation.id}>{relation.from} —{relation.type}→ {relation.to}</code>)}</div></details></section>
      <section className="layer"><h2>Související pravidla a standardy</h2><div className="relationship-links">{graphState.data?.nodes.filter((node) => node.kind === "rule" && node.id !== id).map((node) => <Link key={node.id} to={`/rules/${node.id}`}>{graphNodeLabel(node)}</Link>)}{graphState.data?.nodes.filter((node) => node.kind === "standard").map((node) => <Link key={node.id} to={`/standards/${node.id}`}>{graphNodeLabel(node)}</Link>)}</div></section>
      {rule.source_file && <a className="button button--ghost" href={`https://github.com/bezverec/standardy/blob/main/${rule.source_file}`} target="_blank" rel="noopener noreferrer">Otevřít YAML záznam v repozitáři</a>}
    </>}
  </main>;
}

function EntityList({ type }: { type: "standards" | "national-standards" }) {
  const state = useAsync<{ data: RegistryEntity[] }>(() => type === "standards" ? api.standards() : api.nationalStandards(), [type]);
  const label = type === "standards" ? "Zdrojové standardy" : "Národní standardy";
  return <main><header className="page-header"><p className="eyebrow">Registry / {label}</p><h1>{label}</h1></header><LoadingState state={state} /><div className="card-grid">{state.data?.data.map((entity) => <Link to={`/${type}/${entity.id}`} className="entity-card" key={entity.id}><Status tone={entity.status === "draft" ? "warn" : "neutral"}>{entity.status}</Status><h2>{localized(entity.title)}</h2><code>{entity.id}</code><p>{localized(entity.description)}</p></Link>)}</div></main>;
}

function EntityDetail({ type, id }: { type: "standards" | "national-standards"; id: string }) {
  const state = useAsync(async () => {
    const [entity, rules, relations] = await Promise.all([type === "standards" ? api.standard(id) : api.nationalStandard(id), api.rules(), api.relations()]);
    return { entity, relations: relations.data, rules: rules.data.filter((rule) => type === "standards" ? sourceIds(rule, relations.data).includes(id) : rule.national_standard_id === id) };
  }, [type, id]);
  const label = type === "standards" ? "Zdrojový standard" : "Národní standard";
  const entity = state.data?.entity;
  return <main><Link to={`/${type}`} className="back">Všechny standardy</Link><LoadingState state={state} />{entity && <><header className="detail-header"><div><p className="eyebrow">{label}</p><h1>{localized(entity.title)}</h1><code className="stable-id">{entity.id}</code></div><Status tone={entity.status === "draft" ? "warn" : "neutral"}>{labels[entity.status] ?? entity.status}</Status></header><p className="lead">{localized(entity.description)}</p><div className="card-grid">{entity.versions.map((version, index) => <SourceCard key={index} source={version.source as Record<string, unknown>} />)}</div>
    <section className="graph-section"><p className="layer-label">Vazby do NDK</p><h2>Pravidla využívající tento standard <span className="inline-count">{state.data?.rules.length}</span></h2>{state.data?.rules.map((rule) => <RuleCard key={`${rule.rule_id}@${rule.version}`} rule={rule} relations={state.data!.relations} />)}{!state.data?.rules.length && <p>Pro tento standard zatím nejsou vložena pravidla.</p>}</section>
    {Boolean(entity.entities?.length) && <section className="graph-section"><p className="layer-label">Zdrojové prvky</p><h2>Elementy a vlastnosti</h2><div className="card-grid">{entity.entities?.map((item) => <article className="source-card" key={item.id}><code>{item.name}</code><h3>{localized(item.title)}</h3><p>{localized(item.definition)}</p><p className="muted">Verze {item.version}</p>{item.verification && <><Status tone={item.verification.status === "verified" ? "neutral" : "warn"}>{labels[item.verification.status] ?? item.verification.status}</Status><p className="verification-note">{item.verification.reference}</p></>}<SourceCard source={item.source} /></article>)}</div></section>}
    <details><summary>Úplný strojový záznam</summary><JsonBlock value={entity} /></details></>}</main>;
}

function NotFound() {
  return <main className="state"><h1>Stránka nenalezena</h1><Link to="/">Zpět na přehled</Link></main>;
}

export function App() {
  const [path, setPath] = useState(routePath());
  useEffect(() => { const update = () => { setPath(routePath()); window.scrollTo(0, 0); }; window.addEventListener("popstate", update); window.addEventListener("hashchange", update); return () => { window.removeEventListener("popstate", update); window.removeEventListener("hashchange", update); }; }, []);
  let page: ReactNode = <NotFound />;
  const rule = path.match(/^\/rules\/([^/]+)\/?$/);
  const standard = path.match(/^\/standards\/([^/]+)\/?$/);
  const nationalStandard = path.match(/^\/national-standards\/([^/]+)\/?$/);
  if (path === "/" || path === "/map" || path === "/map/") page = <MapPage />;
  else if (path === "/rules" || path === "/rules/") page = <Rules key={path} />;
  else if (rule?.[1]) page = <RuleDetail key={rule[1]} id={decodeURIComponent(rule[1])} />;
  else if (path === "/standards" || path === "/standards/") page = <EntityList type="standards" />;
  else if (standard?.[1]) page = <EntityDetail type="standards" id={decodeURIComponent(standard[1])} />;
  else if (path === "/national-standards" || path === "/national-standards/") page = <EntityList type="national-standards" />;
  else if (nationalStandard?.[1]) page = <EntityDetail type="national-standards" id={decodeURIComponent(nationalStandard[1])} />;
  return <div className="app-shell"><RegistryNavigation key={`navigation:${path}`} path={path} onNavigate={navigate} />{page}<footer><span>Verzovaná data v YAML</span><a href="https://github.com/bezverec/standardy" target="_blank" rel="noopener noreferrer">Repozitář</a><a href="/api-docs/">Swagger / API v1</a></footer></div>;
}
