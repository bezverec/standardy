import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { api, type KnowledgeGraphNode, type KnowledgeGraphResponse, type RegistryEntity, type RuleDetailResponse, type RuleVersion } from "./api.ts";

function routePath(): string {
  const path = window.location.pathname.replace(/^\/registry\/?/, "/");
  return path === "" ? "/" : path;
}

function navigate(event: MouseEvent<HTMLAnchorElement>): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.pushState({}, "", event.currentTarget.href);
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
  if (state.error) return <div className="state state--error"><strong>Registr není dostupný.</strong><br />{state.error}<br /><small>Lokálně spusťte migraci a import D1.</small></div>;
  return null;
}

function Dashboard() {
  const meta = useAsync(api.meta, []);
  return <main>
    <section className="hero">
      <p className="eyebrow">Machine-readable knowledge base</p>
      <h1>Pravidla digitalizace,<br />dohledatelná ke zdroji.</h1>
      <p className="lead">První odborně ověřené pravidlo propojuje MIX, hlavičku ICC profilu a DMF NDK — včetně přesně popsané chyby zdrojové dokumentace.</p>
      <div className="actions"><Link to="/rules" className="button">Procházet pravidla</Link><a className="button button--ghost" href="/api/v1/meta">Otevřít API</a></div>
    </section>
    <section className="vertical-flow" aria-label="Vertical slice">
      {["MIX 2.0", "iccProfileVersion", "DMF Monografie 2.3", "Ověřený rozpor", "ProArc · Validátor"].map((label, index) => <div className="flow-step" key={label}><span>0{index + 1}</span>{label}</div>)}
    </section>
    <section className="notice"><Status tone="warn">VERIFIED · KNOWN DISCREPANCY</Status><p><code>iccProfileVersion</code> má obsahovat číselnou verzi formátu (např. 2.4 nebo 4.3), nikoli název či označení profilu. Chování konkrétních implementací zůstává označeno jako neověřené.</p></section>
    <LoadingState state={meta} />
    {meta.data && <dl className="meta-grid">{Object.entries(meta.data).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}
  </main>;
}

function Rules() {
  const state = useAsync(api.rules, []);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("");
  const rules = useMemo(() => (state.data?.data ?? []).filter((rule) => {
    const haystack = `${rule.rule_id} ${localized(rule.title)} ${rule.target.entity}`.toLocaleLowerCase("cs");
    return haystack.includes(query.toLocaleLowerCase("cs")) && (!severity || rule.severity === severity);
  }), [state.data, query, severity]);
  return <main>
    <header className="page-header"><p className="eyebrow">Registry / Rules</p><h1>Pravidla</h1><p>Stabilní identita pravidla je oddělena od jeho verzí.</p></header>
    <LoadingState state={state} />
    {state.data && <>
      <div className="filters"><label>Hledat<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, název, element…" /></label><label>Závažnost<select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="">Všechny</option><option value="error">error</option><option value="warning">warning</option><option value="info">info</option></select></label><span>{rules.length} / {state.data.pagination.total}</span></div>
      <div className="table-wrap"><table><thead><tr><th>ID</th><th>Název</th><th>Profil</th><th>Verze</th><th>Standard</th><th>Kategorie</th><th>Stav</th></tr></thead><tbody>{rules.map((rule) => <tr key={`${rule.rule_id}@${rule.version}`}><td><Link to={`/rules/${rule.rule_id}`}><code>{rule.rule_id}</code></Link></td><td>{localized(rule.title)}</td><td>{rule.profile_id}</td><td>{rule.version}</td><td>{rule.target.entity.split("-")[0]}</td><td>{rule.category}</td><td><Status tone={rule.verification.status === "verified" ? "neutral" : "warn"}>{rule.status}</Status></td></tr>)}</tbody></table></div>
    </>}
  </main>;
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre>{JSON.stringify(value, null, 2)}</pre>;
}

const graphKindLabels: Record<KnowledgeGraphNode["kind"], string> = {
  rule: "pravidlo",
  profile: "profil NDK",
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
  const nodes = [...graph.nodes].sort((a, b) => {
    const priority = { rule: 0, standard_entity: 1, profile: 2, implementation: 3, standard: 4 };
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
    <svg className="knowledge-graph" viewBox={`0 0 1120 ${height}`} role="img" aria-labelledby="graph-title graph-description">
      <title id="graph-title">Vztahy pravidla {graph.root}</title>
      <desc id="graph-description">Orientovaný graf propojující pravidlo s profilem, prvky standardů, standardy a implementacemi.</desc>
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
          <text x={labelX} y={labelY} textAnchor="middle">{edge.type}</text>
        </g>;
      })}</g>
      <g className="graph-nodes">{nodes.map((node) => {
        const position = positions.get(node.id);
        if (!position) return null;
        const lines = wrapGraphLabel(graphNodeLabel(node));
        return <g key={node.id} className={`graph-node graph-node--${node.kind}`} transform={`translate(${position.x} ${position.y})`}>
          <rect width={position.width} height={position.height} rx="3" />
          <text className="graph-node-kind" x="16" y="20">{graphKindLabels[node.kind]}</text>
          <text className="graph-node-title" x="16" y="42">{lines.map((line, index) => <tspan x="16" dy={index === 0 ? 0 : 17} key={line}>{line}</tspan>)}</text>
          <title>{graphKindLabels[node.kind]}: {graphNodeLabel(node)} ({node.id})</title>
        </g>;
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
      <header className="detail-header"><div><p className="eyebrow">Rule</p><h1>{localized(rule.title)}</h1><code className="stable-id">{rule.rule_id}</code></div><div className="version-box"><label>Verze profilu<select value={selectedVersion} onChange={(event) => setSelectedVersion(event.target.value)}>{versions.map((item) => <option key={item.version}>{item.version}</option>)}</select></label><Status tone={rule.verification.status === "verified" ? "neutral" : "warn"}>{rule.verification.status}</Status></div></header>
      <div className="facts"><div><span>Profil</span><Link to={`/profiles/${rule.profile_id}`}>{rule.profile_id}</Link></div><div><span>Cíl</span><code>{rule.target.entity}</code></div><div><span>Kategorie</span>{rule.category}</div><div><span>Závažnost</span><Status tone="error">{rule.severity}</Status></div></div>
      <section className="layer layer--normative"><p className="layer-label">NORMATIVE REQUIREMENT · {rule.status}</p><h2>Požadavek</h2><p>{localized(rule.normative_requirement)}</p><JsonBlock value={rule.requirement} />{Boolean(rule.condition) && <><h3>Strojová podmínka</h3><JsonBlock value={rule.condition} /></>}</section>
      <section className="detail-grid"><article><p className="layer-label">INTERPRETATION</p><h2>Interpretace</h2><p>{localized(rule.interpretation)}</p></article><article><p className="layer-label">PROVENANCE</p><h2>Zdroj a ověření</h2><JsonBlock value={{ source: rule.source, references: rule.references, verification: rule.verification }} /></article></section>
      {Boolean(rule.discrepancies?.length) && <section className="layer layer--discrepancy"><p className="layer-label">KNOWN DISCREPANCIES</p><h2>Známé rozpory ve zdrojích</h2><ul>{rule.discrepancies?.map((item, index) => <li key={index}>{localized(item)}</li>)}</ul></section>}
      {(rule.validator_behaviour || rule.fix_recommendation) && <section className="detail-grid"><article><p className="layer-label">VALIDATOR BEHAVIOUR</p><h2>Očekávaná kontrola</h2><p>{localized(rule.validator_behaviour)}</p></article><article><p className="layer-label">FIX RECOMMENDATION</p><h2>Doporučená oprava</h2><p>{localized(rule.fix_recommendation)}</p></article></section>}
      <section className="layer layer--implementation"><p className="layer-label">IMPLEMENTATION · NON-NORMATIVE</p><h2>Implementace</h2><div className="implementation-grid">{(rule.implementations ?? []).map((item) => <article key={item.id}><Status tone="warn">{item.verification}</Status><h3>{item.application}</h3><p>{item.role} · {item.status}</p><small>{localized(item.notes)}</small></article>)}</div></section>
      <section className="graph-section"><p className="layer-label">KNOWLEDGE GRAPH</p><h2>Graf vztahů</h2><p className="graph-intro">Plné čáry zachycují normativní a významové vazby; přerušované čáry vedou k dosud neověřenému chování implementací.</p><LoadingState state={graphState} />{graphState.data && <RelationshipGraph graph={graphState.data} />}<details className="relation-data"><summary>Textový výpis vztahů</summary><div className="relations">{state.data?.relations.map((relation) => <code key={relation.id}>{relation.from} —{relation.type}→ {relation.to}</code>)}</div></details></section>
      {rule.source_file && <a className="button button--ghost" href={`https://github.com/bezverec/standardy/edit/main/${rule.source_file}`}>Navrhnout změnu na GitHubu ↗</a>}
    </>}
  </main>;
}

function EntityList({ type }: { type: "standards" | "profiles" }) {
  const state = useAsync<{ data: RegistryEntity[] }>(() => type === "standards" ? api.standards() : api.profiles(), [type]);
  const label = type === "standards" ? "Standardy" : "Profily";
  return <main><header className="page-header"><p className="eyebrow">Registry / {type}</p><h1>{label}</h1></header><LoadingState state={state} /><div className="card-grid">{state.data?.data.map((entity) => <Link to={`/${type}/${entity.id}`} className="entity-card" key={entity.id}><Status tone={entity.status === "draft" ? "warn" : "neutral"}>{entity.status}</Status><h2>{localized(entity.title)}</h2><code>{entity.id}</code><p>{localized(entity.description)}</p></Link>)}</div></main>;
}

function EntityDetail({ type, id }: { type: "standards" | "profiles"; id: string }) {
  const state = useAsync<RegistryEntity>(() => type === "standards" ? api.standard(id) : api.profile(id), [type, id]);
  return <main><Link to={`/${type}`} className="back">← Zpět</Link><LoadingState state={state} />{state.data && <><header className="detail-header"><div><p className="eyebrow">{type.slice(0, -1)}</p><h1>{localized(state.data.title)}</h1><code className="stable-id">{state.data.id}</code></div><Status tone={state.data.status === "draft" ? "warn" : "neutral"}>{state.data.status}</Status></header><p className="lead">{localized(state.data.description)}</p><JsonBlock value={state.data} /></>}</main>;
}

function NotFound() {
  return <main className="state"><h1>Stránka nenalezena</h1><Link to="/">Zpět na přehled</Link></main>;
}

export function App() {
  const [path, setPath] = useState(routePath());
  useEffect(() => { const update = () => setPath(routePath()); window.addEventListener("popstate", update); return () => window.removeEventListener("popstate", update); }, []);
  let page: ReactNode = <NotFound />;
  const rule = path.match(/^\/rules\/([^/]+)\/?$/);
  const standard = path.match(/^\/standards\/([^/]+)\/?$/);
  const profile = path.match(/^\/profiles\/([^/]+)\/?$/);
  if (path === "/") page = <Dashboard />;
  else if (path === "/rules" || path === "/rules/") page = <Rules />;
  else if (rule?.[1]) page = <RuleDetail id={decodeURIComponent(rule[1])} />;
  else if (path === "/standards" || path === "/standards/") page = <EntityList type="standards" />;
  else if (standard?.[1]) page = <EntityDetail type="standards" id={decodeURIComponent(standard[1])} />;
  else if (path === "/profiles" || path === "/profiles/") page = <EntityList type="profiles" />;
  else if (profile?.[1]) page = <EntityDetail type="profiles" id={decodeURIComponent(profile[1])} />;
  return <div className="app-shell"><header className="topbar"><a href="/" className="brand"><span>SD</span><div>Standardy digitalizace<small>Registry Explorer</small></div></a><nav><Link to="/">Přehled</Link><Link to="/rules">Pravidla</Link><Link to="/standards">Standardy</Link><Link to="/profiles">Profily</Link><a href="/">Dokumentace ↗</a></nav></header>{page}<footer>Git/YAML je jediný source of truth · <a href="https://github.com/bezverec/standardy">GitHub</a> · <a href="/api/v1/meta">API v1</a></footer></div>;
}
