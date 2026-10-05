import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { api, type KnowledgeGraphNode, type KnowledgeGraphResponse, type RegistryEntity, type RuleDetailResponse, type RuleVersion } from "./api.ts";
import { filterRules, sourceIds, type Relation } from "./explore.ts";

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

function LoadingState({ state }: { state: { loading: boolean; error?: string } }) {
  if (state.loading) return <div className="state">Načítám data registru…</div>;
  if (state.error) return <div role="alert" className="state state--error"><strong>Záznam se nepodařilo načíst.</strong><p>{state.error}</p><button onClick={() => window.location.reload()}>Zkusit znovu</button></div>;
  return null;
}

function Rules() {
  const state = useAsync(async () => {
    const [rules, sources, national, relations] = await Promise.all([api.rules(), api.standards(), api.nationalStandards(), api.relations()]);
    return { ...rules, sources: sources.data, national: national.data, relations: relations.data };
  }, []);
  const initial = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(initial.get("q") ?? "");
  const [filters, setFilters] = useState<Record<string, string>>(Object.fromEntries(["severity", "source", "national", "version", "category", "verification", "status", "object"].map((key) => [key, initial.get(key) ?? ""])));
  const rules = useMemo(() => filterRules(state.data?.data ?? [], query, filters, state.data?.relations ?? []), [state.data, query, filters]);
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
    <header className="page-header"><div><p className="eyebrow">Databáze standardů</p><h1>Pravidla NDK</h1><p>Požadavek, jeho význam a původní zdroj na jednom místě.</p></div><div className="count-label"><strong>{state.data?.data.length ?? "—"}</strong><span>verze pravidel</span></div></header>
    <LoadingState state={state} />
    {state.data && <>
      <label className="search-label">Hledat v celé databázi pravidel<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Název, element, požadavek, interpretace nebo zdroj…" /></label>
      <div className="explorer-layout"><aside className="filter-panel"><div className="filter-heading"><h2>Filtry</h2><button className="text-button" onClick={clear}>Vymazat</button></div>
        {filter("national", "Standard NDK", state.data.national.map((item) => [item.id, localized(item.title)]))}
        {filter("version", "Verze NDK", values("version"))}
        {filter("source", "Zdrojový standard", state.data.sources.map((item) => [item.id, item.id]))}
        {filter("category", "Kategorie", values("category"))}
        {filter("object", "Typ dokumentu", [...new Set(state.data.data.flatMap((rule) => rule.object_types?.values ?? []))].map((item) => [item, labels[item] ?? item]))}
        {filter("severity", "Závažnost", [["error", "Chyba"], ["warning", "Varování"], ["info", "Informace"]])}
        {filter("verification", "Ověření přepisu", [["verified", "Ověřeno"], ["unverified", "Neověřeno"], ["disputed", "Sporné"]])}
        {filter("status", "Stav požadavku", values("status"))}
      </aside><section className="results"><div className="results-heading"><p role="status" aria-live="polite">Nalezeno <strong>{rules.length}</strong> z {state.data.pagination.total} verzí pravidel</p><span>Řazeno podle ID</span></div>
        {!rules.length && <div className="state"><h2>Žádné pravidlo neodpovídá</h2><p>Zkuste kratší dotaz nebo uvolněte některý filtr.</p><button onClick={clear}>Vymazat hledání a filtry</button></div>}
        {rules.map((rule) => <RuleCard key={`${rule.rule_id}@${rule.version}`} rule={rule} relations={state.data!.relations} />)}
        <p className="coverage">Pokrytí MVP: ICC profily v DMF Monografie 2.3. Registr zatím neobsahuje všechna pravidla NDK.</p>
      </section></div>
    </>}
  </main>;
}

const labels: Record<string, string> = { normative: "Normativní", disputed: "Sporný požadavek", draft: "Částečné pokrytí", verified: "Ověřeno", unverified: "Neověřeno", deprecated: "Historické", ambiguous: "Nejednoznačné", error: "Chyba", warning: "Varování", info: "Informace", monograph: "Monografie", "technical/icc": "Technická metadata · ICC", related_to: "souvisí s", defined_by: "je definováno v", restricts: "omezuje", clarifies: "upřesňuje", generated_by: "je generováno v", validated_by: "je kontrolováno v", derived_from: "vychází z", extends: "rozšiřuje" };

function RuleCard({ rule, relations }: { rule: RuleVersion; relations: Relation[] }) {
  return <article className="rule-card"><div className="rule-card-heading"><div><p className="rule-meta">{rule.national_standard_id} · {rule.version} · {labels[rule.category] ?? rule.category}</p><h2><Link to={`/rules/${rule.rule_id}`}>{localized(rule.title)}</Link></h2></div><Status tone={rule.status === "disputed" ? "warn" : "neutral"}>{labels[rule.status] ?? rule.status}</Status></div><p>{localized(rule.description)}</p><div className="rule-card-footer"><code>{rule.target.entity}</code><div className="source-chips">{sourceIds(rule, relations).map((id) => <Link key={id} to={`/standards/${id}`} className="source-chip">{id}</Link>)}</div><span>{labels[rule.verification.status]} · {labels[rule.severity]}</span></div></article>;
}

function SourceCard({ source }: { source: Record<string, unknown> }) {
  const raw = typeof source.url === "string" ? source.url : "";
  const safe = /^https?:\/\//i.test(raw) ? raw : "";
  return <article className="source-card"><h3>{String(source.document ?? "Zdroj")}</h3><p>{source.version ? `Verze ${source.version}` : ""}{source.page ? ` · strana ${source.page}` : ""}</p>{Boolean(source.section) && <p>{String(source.section)}</p>}{safe && <a href={safe} target="_blank" rel="noopener noreferrer">Otevřít původní zdroj</a>}</article>;
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre>{JSON.stringify(value, null, 2)}</pre>;
}

const graphKindLabels: Record<KnowledgeGraphNode["kind"], string> = {
  rule: "pravidlo",
  national_standard: "standard NDK",
  standard_entity: "prvek standardu",
  standard: "standard",
  implementation: "implementace",
};

function graphNodeLabel(node: KnowledgeGraphNode): string {
  return localized(node.data?.title) !== "—"
    ? localized(node.data?.title)
    : node.data?.application ?? node.data?.name ?? node.id;
}

function wrapGraphLabel(value: string, limit = 25): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    const candidate = lines.length ? `${lines.at(-1)} ${word}` : word;
    if (candidate.length <= limit) lines[lines.length ? lines.length - 1 : 0] = candidate;
    else lines.push(word);
  }
  return lines.slice(0, 2);
}

function RelationshipGraph({ graph }: { graph: KnowledgeGraphResponse }) {
  function destination(node: KnowledgeGraphNode): string | undefined {
    if (node.kind === "rule") return `/rules/${node.id}`;
    if (node.kind === "standard") return `/standards/${node.id}`;
    if (node.kind === "national_standard") return `/national-standards/${node.id}`;
    if (node.kind === "standard_entity") {
      const owner = graph.edges.find((edge) => edge.from === node.id && edge.type === "defined_by");
      if (owner) return `/standards/${owner.to}`;
    }
    return undefined;
  }
  const nodes = [...graph.nodes].sort((a, b) => {
    const priority = { rule: 0, standard_entity: 1, national_standard: 2, implementation: 3, standard: 4 };
    return priority[a.kind] - priority[b.kind] || a.id.localeCompare(b.id);
  });
  const root = nodes.find((node) => node.id === graph.root);
  const middle = nodes.filter((node) => node.id !== graph.root && node.kind !== "standard");
  const standards = nodes.filter((node) => node.kind === "standard");
  const rowHeight = 94;
  const height = Math.max(360, middle.length * rowHeight + 36);
  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  if (root) positions.set(root.id, { x: 24, y: height / 2 - 42, width: 258, height: 84 });
  middle.forEach((node, index) => positions.set(node.id, { x: 410, y: 18 + index * rowHeight, width: 270, height: 70 }));
  standards.forEach((node, index) => {
    const definingEdge = graph.edges.find((edge) => edge.to === node.id && positions.has(edge.from));
    const source = definingEdge ? positions.get(definingEdge.from) : undefined;
    positions.set(node.id, { x: 824, y: source?.y ?? height * ((index + 1) / (standards.length + 1)) - 35, width: 270, height: 70 });
  });

  return <div className="graph-scroll" aria-label="Graf vztahů pravidla">
    <svg className="knowledge-graph" viewBox={`0 0 1120 ${height}`} aria-labelledby="graph-title graph-description">
      <title id="graph-title">Vztahy pravidla {graph.root}</title>
      <desc id="graph-description">Orientovaný graf propojující pravidlo s národním standardem NDK, prvky zdrojových standardů, zdrojovými standardy a implementacemi.</desc>
      <defs><marker id="graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
      <g className="graph-edges">{graph.edges.map((edge, index) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;
        const x1 = from.x + from.width;
        const y1 = from.y + from.height / 2;
        const x2 = to.x;
        const y2 = to.y + to.height / 2;
        const sameColumn = Math.abs(x2 - x1) < 100;
        const path = sameColumn
          ? `M ${x1 - 8} ${y1} C ${x1 + 76} ${y1}, ${x2 + 76} ${y2}, ${x2 + 8} ${y2}`
          : `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;
        const labelX = sameColumn ? x1 + 68 : (x1 + x2) / 2;
        const labelY = (y1 + y2) / 2 - 6;
        const implementationEdge = edge.type === "generated_by" || edge.type === "validated_by";
        return <g key={edge.id ?? `${edge.from}-${edge.type}-${edge.to}-${index}`} className={implementationEdge ? "graph-edge graph-edge--implementation" : "graph-edge"}>
          <path d={path} markerEnd="url(#graph-arrow)" />
          <text x={labelX} y={labelY} textAnchor="middle">{labels[edge.type] ?? edge.type}</text>
        </g>;
      })}</g>
      <g className="graph-nodes">{nodes.map((node) => {
        const position = positions.get(node.id);
        if (!position) return null;
        const lines = wrapGraphLabel(graphNodeLabel(node));
        const content = <g className={`graph-node graph-node--${node.kind}`} transform={`translate(${position.x} ${position.y})`}>
          <rect width={position.width} height={position.height} />
          <text className="graph-node-kind" x="16" y="20">{graphKindLabels[node.kind]}</text>
          <text className="graph-node-title" x="16" y="42">{lines.map((line, index) => <tspan x="16" dy={index === 0 ? 0 : 17} key={line}>{line}</tspan>)}</text>
          <title>{graphKindLabels[node.kind]}: {graphNodeLabel(node)} ({node.id})</title>
        </g>;
        const to = destination(node);
        return to ? <Link key={node.id} to={to}>{content}</Link> : <g key={node.id}>{content}</g>;
      })}</g>
    </svg>
  </div>;
}

function RuleDetail({ id }: { id: string }) {
  const state = useAsync<RuleDetailResponse>(() => api.rule(id), [id]);
  const graphState = useAsync<KnowledgeGraphResponse>(() => api.why(id), [id]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const versions = state.data?.versions ?? [];
  const rule = versions.find((item) => item.version === selectedVersion) ?? versions[0];
  useEffect(() => { if (versions[0]) setSelectedVersion(versions[0].version); }, [state.data]);
  return <main>
    <Link to="/rules" className="back">← Všechna pravidla</Link>
    <LoadingState state={state} />
    {rule && <>
      <header className="detail-header"><div><p className="eyebrow">Detail pravidla</p><h1>{localized(rule.title)}</h1><code className="stable-id">{rule.rule_id}</code></div><div className="version-box"><label>Verze standardu NDK<select value={selectedVersion} onChange={(event) => setSelectedVersion(event.target.value)}>{versions.map((item) => <option key={item.version}>{item.version}</option>)}</select></label><Status tone={rule.verification.status === "verified" ? "neutral" : "warn"}>{labels[rule.verification.status]}</Status></div></header>
      <div className="facts"><div><span>Standard NDK</span><Link to={`/national-standards/${rule.national_standard_id}`}>{rule.national_standard_id}</Link></div><div><span>Cíl</span><code>{rule.target.entity}</code></div><div><span>Kategorie</span>{labels[rule.category] ?? rule.category}</div><div><span>Závažnost</span><Status tone={rule.severity === "error" ? "error" : "warn"}>{labels[rule.severity]}</Status></div></div>
      <section className="layer layer--normative"><p className="layer-label">Požadavek NDK · {labels[rule.status] ?? rule.status}</p><h2>Požadavek</h2><p>{localized(rule.normative_requirement)}</p><details><summary>Strojový zápis a podmínky platnosti</summary><JsonBlock value={rule.requirement} />{Boolean(rule.condition) && <><h3>Podmínka</h3><JsonBlock value={rule.condition} /></>}</details></section>
      <section className="detail-grid"><article><p className="layer-label">Výklad registru</p><h2>Interpretace</h2><p>{localized(rule.interpretation)}</p></article><article><p className="layer-label">Ověření přepisu</p><h2>Stav ověření</h2><p>{labels[rule.verification.status]} · {rule.verification.date ?? "Datum neuvedeno"}</p><p>{rule.verification.reference}</p></article></section>
      <section className="graph-section"><p className="layer-label">Prameny</p><h2>NDK a původní zdroje</h2><div className="card-grid"><SourceCard source={rule.source} />{rule.references?.map((source, index) => <SourceCard key={index} source={source} />)}</div></section>
      {Boolean(rule.discrepancies?.length) && <section className="layer layer--discrepancy"><p className="layer-label">Rozpory ve zdrojích</p><h2>Známé rozpory ve zdrojích</h2><ul>{rule.discrepancies?.map((item, index) => <li key={index}>{localized(item)}</li>)}</ul></section>}
      {(rule.validator_behaviour || rule.fix_recommendation) && <section className="detail-grid"><article><p className="layer-label">Návrh kontroly</p><h2>Očekávaná kontrola</h2><p>{localized(rule.validator_behaviour)}</p></article><article><p className="layer-label">Doporučení registru</p><h2>Doporučená oprava</h2><p>{localized(rule.fix_recommendation)}</p></article></section>}
      <section className="layer layer--implementation"><p className="layer-label">Implementace · nenormativní</p><h2>Implementace</h2><div className="implementation-grid">{(rule.implementations ?? []).map((item) => <article key={item.id}><Status tone="warn">{labels[item.verification] ?? item.verification}</Status><h3>{item.application}</h3><p>{item.role === "generator" ? "Generátor" : item.role === "validator" ? "Validátor" : "Externí nástroj"} · {item.status === "unknown" ? "Chování neověřeno" : "Souvisí s pravidlem"}</p><small>{localized(item.notes)}</small></article>)}</div></section>
      <section className="graph-section"><p className="layer-label">Vazby mezi záznamy</p><h2>Graf vztahů</h2><p className="graph-intro">Plné čáry zachycují normativní a významové vazby; přerušované čáry vedou k dosud neověřenému chování implementací.</p><LoadingState state={graphState} />{graphState.data && <RelationshipGraph graph={graphState.data} />}<details className="relation-data"><summary>Textový výpis vztahů</summary><div className="relations">{state.data?.relations.map((relation) => <code key={relation.id}>{relation.from} —{relation.type}→ {relation.to}</code>)}</div></details></section>
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
  if (path === "/" || path === "/rules" || path === "/rules/") page = <Rules key={path} />;
  else if (rule?.[1]) page = <RuleDetail key={rule[1]} id={decodeURIComponent(rule[1])} />;
  else if (path === "/standards" || path === "/standards/") page = <EntityList type="standards" />;
  else if (standard?.[1]) page = <EntityDetail type="standards" id={decodeURIComponent(standard[1])} />;
  else if (path === "/national-standards" || path === "/national-standards/") page = <EntityList type="national-standards" />;
  else if (nationalStandard?.[1]) page = <EntityDetail type="national-standards" id={decodeURIComponent(nationalStandard[1])} />;
  return <div className="app-shell"><header className="topbar"><Link to="/rules" className="brand"><span>NDK</span><div>Pravidla &amp; standardy<small>Standardy digitalizace</small></div></Link><nav aria-label="Hlavní navigace"><Link to="/rules" className={path === "/" || path.startsWith("/rules") ? "active" : ""}>Pravidla</Link><Link to="/standards" className={path.startsWith("/standards") ? "active" : ""}>Zdrojové standardy</Link><Link to="/national-standards" className={path.startsWith("/national-standards") ? "active" : ""}>Standardy NDK</Link></nav></header>{page}<footer><span>Verzovaná data v YAML · Částečné pokrytí NDK</span><a href="https://github.com/bezverec/standardy" target="_blank" rel="noopener noreferrer">Repozitář</a><a href="/api/v1/meta">API v1</a></footer></div>;
}
