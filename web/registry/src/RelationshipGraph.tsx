import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { KnowledgeGraphNode, KnowledgeGraphResponse } from "./api.ts";
import { metadataAreas } from "../../../packages/registry-core/src/metadata-taxonomy.ts";
import { connectedGraphNodes, filterGraph, graphKindLabels, graphNodeAreas, graphNodeLabel, graphNodeTopics, graphPreferenceKey, layoutGraph, layoutRadialGraph, moveGraphLayer, normalizeGraphPreferences, radialEdge, relationLabels, type GraphPreferences } from "./graph.ts";

function toggle(set: ReadonlySet<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value); else next.add(value);
  return next;
}
function lines(text: string, limit = 32): string[] {
  const result: string[] = [];
  for (const word of text.split(/\s+/).flatMap((word) => word.match(new RegExp(`.{1,${limit}}`, "gu")) ?? [])) {
    const last = result.at(-1);
    if (last && `${last} ${word}`.length <= limit) result[result.length - 1] = `${last} ${word}`;
    else result.push(word);
  }
  return result.length > 3 ? [...result.slice(0, 2), `${result[2]!.slice(0, limit - 1)}…`] : result;
}
function readPreferences(): GraphPreferences {
  try { return normalizeGraphPreferences(JSON.parse(localStorage.getItem(graphPreferenceKey) ?? "null")); }
  catch { return normalizeGraphPreferences(null); }
}
function Choices({ title, options, hidden, onToggle }: {
  title: string; options: Array<[string, string]>; hidden: ReadonlySet<string>; onToggle: (id: string) => void;
}) {
  return <fieldset className="graph-choices"><legend>{title}</legend>{options.map(([id, label]) =>
    <label key={id}><input type="checkbox" checked={!hidden.has(id)} onChange={() => onToggle(id)} />{label}</label>)}</fieldset>;
}

export function RelationshipGraph({ graph, onNavigate, topicLabels }: {
  graph: KnowledgeGraphResponse; onNavigate: (event: MouseEvent<HTMLAnchorElement | SVGAElement>) => void; topicLabels: Record<string, string>;
}) {
  const instanceId = useId().replaceAll(":", "");
  const [preferences, setPreferences] = useState(readPreferences);
  const [depth, setDepth] = useState(1);
  const view = preferences.view;
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(() => new Set());
  const hiddenKinds = useMemo(() => new Set(preferences.hiddenKinds), [preferences.hiddenKinds]);
  const [hiddenAreas, setHiddenAreas] = useState<Set<string>>(() => new Set());
  const [hiddenTopics, setHiddenTopics] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState("");
  const explorer = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === explorer.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  function savePreferences(next: GraphPreferences) {
    setPreferences(next);
    try { localStorage.setItem(graphPreferenceKey, JSON.stringify(next)); setNotice(""); }
    catch { setNotice("Nastavení nelze uložit v tomto prohlížeči; pro otevřený detail zůstává aktivní."); }
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === explorer.current) await document.exitFullscreen();
      else await explorer.current?.requestFullscreen();
    } catch { setNotice("Prohlížeč nepovolil celou obrazovku. Graf lze dále přibližovat v běžném zobrazení."); }
  }
  const visible = useMemo(() => filterGraph(graph, { depth, hiddenTypes, hiddenKinds, hiddenAreas, hiddenTopics }), [graph, depth, hiddenTypes, hiddenKinds, hiddenAreas, hiddenTopics]);
  const radialLayout = useMemo(() => view === "radial" ? layoutRadialGraph(visible, preferences.order) : null, [visible, view, preferences.order]);
  const layout = useMemo(() => radialLayout ?? layoutGraph(visible), [radialLayout, visible]);
  const selected = visible.nodes.find((node) => node.id === selectedId);
  const connected = useMemo(() => connectedGraphNodes(visible, selected?.id ?? null), [visible, selected]);
  // New layouts always open with the complete graph in view, preserving semantic filters.
  useEffect(() => { setZoom(1); viewport.current?.scrollTo(0, 0); }, [layout]);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const types = [...new Set(graph.edges.map((edge) => edge.type))].sort();
  const kinds = preferences.order;
  const areas = [...new Set(graph.nodes.flatMap((node) => graphNodeAreas(node, graph)))].sort();
  const topics = [...new Set(graph.nodes.flatMap(graphNodeTopics))].sort();
  const label = (id: string) => byId.has(id) ? graphNodeLabel(byId.get(id)!) : id;
  const destination = (node: KnowledgeGraphNode): string | undefined => {
    if (node.kind === "rule") return `/registry/rules/${encodeURIComponent(node.id)}`;
    if (node.kind === "standard") return `/registry/standards/${encodeURIComponent(node.id)}`;
    if (node.kind === "national_standard") return `/registry/national-standards/${encodeURIComponent(node.id)}`;
    const owner = node.kind === "standard_entity" ? graph.edges.find((edge) => edge.from === node.id && edge.type === "defined_by") : undefined;
    return owner ? `/registry/standards/${encodeURIComponent(owner.to)}` : undefined;
  };
  const nodeLink = (id: string) => {
    const node = byId.get(id);
    const href = node && destination(node);
    return href ? <a href={href} onClick={onNavigate}>{label(id)}</a> : label(id);
  };
  const fit = () => { setZoom(1); viewport.current?.scrollTo(0, 0); };
  const reset = () => { setDepth(1); setHiddenTypes(new Set()); savePreferences(normalizeGraphPreferences(null)); setHiddenAreas(new Set()); setHiddenTopics(new Set()); setShowLabels(false); setSelectedId(null); fit(); };

  return <div className="graph-explorer" ref={explorer}>
    <div className="graph-toolbar">
      <label>Zobrazení<select value={view} onChange={(event) => savePreferences({ ...preferences, view: event.target.value as GraphPreferences["view"] })}><option value="graph">Sloupcový graf</option><option value="radial">Radiální síť</option><option value="table">Tabulka vazeb</option></select></label>
      <label>Rozsah vazeb<select value={depth} onChange={(event) => setDepth(Number(event.target.value))}><option value={1}>Přímé vazby</option><option value={2}>Do dvou kroků</option><option value={99}>Celé dostupné okolí</option></select></label>
      {view !== "table" && <label>Měřítko<select value={zoom} onChange={(event) => setZoom(Number(event.target.value))}><option value={1}>Celý graf</option><option value={1.5}>Zvětšit 1,5×</option><option value={2}>Zvětšit 2×</option><option value={3}>Zvětšit 3×</option></select></label>}
      <label className="graph-label-toggle"><input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} disabled={view === "table"} />Popisky vazeb</label>
      {view !== "table" && <button onClick={fit}>Přizpůsobit celý graf</button>}
      <button onClick={() => void toggleFullscreen()}>{fullscreen ? "Ukončit celou obrazovku" : "Na celou obrazovku"}</button>
      <button onClick={reset}>Obnovit výchozí</button>
    </div>
    <details className="graph-filter-panel"><summary>Skrýt nebo zobrazit vazby a kategorie</summary><div className="graph-filter-grid">
      <Choices title="Typy vazeb" options={types.map((type) => [type, relationLabels[type] ?? type])} hidden={hiddenTypes} onToggle={(id) => setHiddenTypes((old) => toggle(old, id))} />
      <fieldset className="graph-choices"><legend>Druhy uzlů / pořadí vrstev</legend><p className="muted">Pořadí od středu ven platí v radiální síti. Aktuální pravidlo zůstává ve středu.</p>{kinds.map((kind) => {
        const index = preferences.order.indexOf(kind);
        return <div className="graph-layer-choice" key={kind}><label><input type="checkbox" checked={!hiddenKinds.has(kind)} onChange={() => savePreferences({ ...preferences, hiddenKinds: [...toggle(hiddenKinds, kind)] as GraphPreferences["hiddenKinds"] })} />{graphKindLabels[kind]}</label><button disabled={index === 0} aria-label={`${graphKindLabels[kind]} blíž ke středu`} onClick={() => savePreferences({ ...preferences, order: moveGraphLayer(preferences.order, kind, -1) })}>↑</button><button disabled={index === preferences.order.length - 1} aria-label={`${graphKindLabels[kind]} dál od středu`} onClick={() => savePreferences({ ...preferences, order: moveGraphLayer(preferences.order, kind, 1) })}>↓</button></div>;
      })}<p className="muted">Režim, pořadí a skryté druhy uzlů se pamatují v tomto prohlížeči.</p></fieldset>
      <Choices title="Oblasti metadat" options={areas.map((area) => [area, metadataAreas.find((item) => item.id === area)?.label ?? "Ostatní / nezařazené"])} hidden={hiddenAreas} onToggle={(id) => setHiddenAreas((old) => toggle(old, id))} />
      {topics.length > 0 && <Choices title="Témata pravidel" options={topics.map((topic) => [topic, topicLabels[topic] ?? topic])} hidden={hiddenTopics} onToggle={(id) => setHiddenTopics((old) => toggle(old, id))} />}
    </div></details>
    {notice && <p role="status">{notice}</p>}
    <p role="status" aria-live="polite" className="graph-count">Zobrazeno {visible.nodes.length} z {graph.nodes.length} uzlů a {visible.edges.length} z {graph.edges.length} vazeb. Výchozí pravidlo zůstává viditelné; odpojené uzly se skryjí.</p>
    {!visible.edges.length && <p className="state">Vybraným filtrům neodpovídá žádná vazba. Zkuste obnovit výchozí zobrazení.</p>}
    {view !== "table" && <div className="graph-selection"><span>{selected ? <>Vybraný uzel: <strong>{graphNodeLabel(selected)}</strong> · <code>{selected.id}</code></> : "Kliknutím na uzel zvýrazníte jeho přímé vazby. Zvětšený graf posunete tažením za pozadí nebo posuvníky."}</span>{selected && <>{destination(selected) && <a href={destination(selected)} onClick={onNavigate}>Otevřít detail</a>}<button onClick={() => setSelectedId(null)}>Zrušit výběr</button></>}</div>}
    {view === "table" ? <div className="graph-table-scroll"><table className="graph-table"><caption>Vazby po použití filtrů; směr je od zdroje k cíli.</caption><thead><tr><th scope="col">Zdroj</th><th scope="col">Vztah →</th><th scope="col">Cíl</th></tr></thead><tbody>{visible.edges.map((edge, index) => <tr key={edge.id ?? `${edge.from}-${edge.type}-${edge.to}-${index}`}><td>{nodeLink(edge.from)}<small>{edge.from}</small></td><td>{relationLabels[edge.type] ?? edge.type}</td><td>{nodeLink(edge.to)}<small>{edge.to}</small></td></tr>)}</tbody></table></div>
      : <div ref={viewport} className={`graph-scroll${zoom > 1 ? " graph-scroll--zoomed" : ""}`} style={{ "--graph-height": `${layout.height}px` } as CSSProperties} tabIndex={0} aria-label={zoom === 1 ? "Graf vztahů pravidla, celý graf" : "Zvětšený graf vztahů pravidla, posuvná oblast"}
        onPointerDown={(event) => {
          if (zoom === 1 || event.button !== 0 || (event.target as Element).closest('[role="button"], a')) return;
          drag.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop };
          event.currentTarget.setPointerCapture(event.pointerId);
        }} onPointerMove={(event) => {
          if (!drag.current) return;
          event.currentTarget.scrollLeft = drag.current.left - event.clientX + drag.current.x;
          event.currentTarget.scrollTop = drag.current.top - event.clientY + drag.current.y;
        }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
        <div className="graph-canvas" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
        <svg className="knowledge-graph" viewBox={`0 0 ${layout.width} ${layout.height}`} preserveAspectRatio="xMidYMid meet" aria-labelledby={`${instanceId}-title`}>
          <title id={`${instanceId}-title`}>{`Filtrované vztahy pravidla ${graph.root}`}</title>
          <defs><marker id={`${instanceId}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
          {radialLayout && <g className="graph-rings" aria-hidden="true">{radialLayout.rings.map((ring) => <g key={ring.kind}><circle cx={radialLayout.center} cy={radialLayout.center} r={ring.radius} /><text x={radialLayout.center + ring.radius * Math.SQRT1_2} y={radialLayout.center - ring.radius * Math.SQRT1_2 - 16} textAnchor="middle">{graphKindLabels[ring.kind]}</text></g>)}</g>}
          <g>{visible.edges.map((edge, index) => {
            const from = layout.positions.get(edge.from)!, to = layout.positions.get(edge.to)!;
            const forward = to.x > from.x, same = to.x === from.x;
            const x1 = from.x + (forward || same ? from.width : 0), y1 = from.y + from.height / 2;
            const x2 = to.x + (forward ? 0 : to.width), y2 = to.y + to.height / 2;
            const control = same ? x1 + 70 : (x1 + x2) / 2;
            const route = radialLayout ? radialEdge(from, to) : { path: `M ${x1} ${y1} C ${control} ${y1}, ${control} ${y2}, ${x2} ${y2}`, x: control, y: (y1 + y2) / 2 - 6 };
            return <g key={edge.id ?? `${edge.from}-${edge.type}-${edge.to}-${index}`} opacity={!selected || edge.from === selected.id || edge.to === selected.id ? 1 : 0.12} className={`graph-edge${["generated_by", "validated_by", "implements"].includes(edge.type) ? " graph-edge--implementation" : ""}`}>
              <title>{`${label(edge.from)} — ${relationLabels[edge.type] ?? edge.type} → ${label(edge.to)}`}</title>
              <path d={route.path} markerEnd={`url(#${instanceId}-arrow)`} />
              {showLabels && <text x={route.x} y={route.y} textAnchor="middle">{relationLabels[edge.type] ?? edge.type}</text>}
            </g>;
          })}</g>
          <g>{visible.nodes.map((node) => {
            const position = layout.positions.get(node.id)!;
            return <g key={node.id} className={`graph-node graph-node--${node.kind}`} transform={`translate(${position.x} ${position.y})`} opacity={!selected || connected.has(node.id) ? 1 : 0.25} role="button" tabIndex={0} aria-label={`${graphNodeLabel(node)} (${node.id})`} aria-pressed={selected?.id === node.id}
              onClick={() => setSelectedId((current) => current === node.id ? null : node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId((current) => current === node.id ? null : node.id); } }}>
              <rect width={position.width} height={position.height} /><text className="graph-node-kind" x="16" y="20">{node.id === graph.root ? "Aktuální pravidlo" : graphKindLabels[node.kind]}</text>
              <text className="graph-node-title" x="16" y="43">{lines(graphNodeLabel(node), radialLayout ? 24 : 32).map((line, index) => <tspan key={index} x="16" dy={index ? 18 : 0}>{line}</tspan>)}</text>
              <title>{`${graphNodeLabel(node)} (${node.id})`}</title>
            </g>;
          })}</g>
        </svg>
        </div>
      </div>}
  </div>;
}
