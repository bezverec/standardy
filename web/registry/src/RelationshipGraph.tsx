import { useId, useMemo, useState, type MouseEvent } from "react";
import type { KnowledgeGraphNode, KnowledgeGraphResponse } from "./api.ts";
import { metadataAreas } from "../../../packages/registry-core/src/metadata-taxonomy.ts";
import { filterGraph, graphKindLabels, graphNodeAreas, graphNodeLabel, graphNodeTopics, layoutGraph, relationLabels } from "./graph.ts";

function toggle(set: ReadonlySet<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value); else next.add(value);
  return next;
}
function lines(text: string): string[] {
  const result: string[] = [];
  for (const word of text.split(/\s+/).flatMap((word) => word.match(/.{1,32}/gu) ?? [])) {
    const last = result.at(-1);
    if (last && `${last} ${word}`.length <= 32) result[result.length - 1] = `${last} ${word}`;
    else result.push(word);
  }
  return result.length > 3 ? [...result.slice(0, 2), `${result[2]!.slice(0, 29)}…`] : result;
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
  const [depth, setDepth] = useState(1);
  const [view, setView] = useState("graph");
  const [showLabels, setShowLabels] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(() => new Set());
  const [hiddenKinds, setHiddenKinds] = useState<Set<string>>(() => new Set());
  const [hiddenAreas, setHiddenAreas] = useState<Set<string>>(() => new Set());
  const [hiddenTopics, setHiddenTopics] = useState<Set<string>>(() => new Set());
  const visible = useMemo(() => filterGraph(graph, { depth, hiddenTypes, hiddenKinds, hiddenAreas, hiddenTopics }), [graph, depth, hiddenTypes, hiddenKinds, hiddenAreas, hiddenTopics]);
  const layout = useMemo(() => layoutGraph(visible), [visible]);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const types = [...new Set(graph.edges.map((edge) => edge.type))].sort();
  const kinds = [...new Set(graph.nodes.map((node) => node.kind))].sort();
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
  const reset = () => { setDepth(1); setHiddenTypes(new Set()); setHiddenKinds(new Set()); setHiddenAreas(new Set()); setHiddenTopics(new Set()); setShowLabels(false); setView("graph"); };

  return <div className="graph-explorer">
    <div className="graph-toolbar">
      <label>Zobrazení<select value={view} onChange={(event) => setView(event.target.value)}><option value="graph">Graf</option><option value="table">Tabulka vazeb</option></select></label>
      <label>Rozsah vazeb<select value={depth} onChange={(event) => setDepth(Number(event.target.value))}><option value={1}>Přímé vazby</option><option value={2}>Do dvou kroků</option><option value={99}>Celé dostupné okolí</option></select></label>
      <label className="graph-label-toggle"><input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} disabled={view !== "graph"} />Popisky vazeb</label>
      <button onClick={reset}>Obnovit výchozí</button>
    </div>
    <details className="graph-filter-panel"><summary>Skrýt nebo zobrazit vazby a kategorie</summary><div className="graph-filter-grid">
      <Choices title="Typy vazeb" options={types.map((type) => [type, relationLabels[type] ?? type])} hidden={hiddenTypes} onToggle={(id) => setHiddenTypes((old) => toggle(old, id))} />
      <Choices title="Druhy uzlů" options={kinds.map((kind) => [kind, graphKindLabels[kind]])} hidden={hiddenKinds} onToggle={(id) => setHiddenKinds((old) => toggle(old, id))} />
      <Choices title="Oblasti metadat" options={areas.map((area) => [area, metadataAreas.find((item) => item.id === area)?.label ?? "Ostatní / nezařazené"])} hidden={hiddenAreas} onToggle={(id) => setHiddenAreas((old) => toggle(old, id))} />
      {topics.length > 0 && <Choices title="Témata pravidel" options={topics.map((topic) => [topic, topicLabels[topic] ?? topic])} hidden={hiddenTopics} onToggle={(id) => setHiddenTopics((old) => toggle(old, id))} />}
    </div></details>
    <p role="status" aria-live="polite" className="graph-count">Zobrazeno {visible.nodes.length} z {graph.nodes.length} uzlů a {visible.edges.length} z {graph.edges.length} vazeb. Výchozí pravidlo zůstává viditelné; odpojené uzly se skryjí.</p>
    {!visible.edges.length && <p className="state">Vybraným filtrům neodpovídá žádná vazba. Zkuste obnovit výchozí zobrazení.</p>}
    {view === "table" ? <div className="graph-table-scroll"><table className="graph-table"><caption>Vazby po použití filtrů; směr je od zdroje k cíli.</caption><thead><tr><th scope="col">Zdroj</th><th scope="col">Vztah →</th><th scope="col">Cíl</th></tr></thead><tbody>{visible.edges.map((edge, index) => <tr key={edge.id ?? `${edge.from}-${edge.type}-${edge.to}-${index}`}><td>{nodeLink(edge.from)}<small>{edge.from}</small></td><td>{relationLabels[edge.type] ?? edge.type}</td><td>{nodeLink(edge.to)}<small>{edge.to}</small></td></tr>)}</tbody></table></div>
      : <div className="graph-scroll" tabIndex={0} aria-label="Graf vztahů pravidla, posuvná oblast">
        <svg className="knowledge-graph" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-labelledby={`${instanceId}-title`}>
          <title id={`${instanceId}-title`}>Filtrované vztahy pravidla {graph.root}</title>
          <defs><marker id={`${instanceId}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
          <g>{visible.edges.map((edge, index) => {
            const from = layout.positions.get(edge.from)!, to = layout.positions.get(edge.to)!;
            const forward = to.x > from.x, same = to.x === from.x;
            const x1 = from.x + (forward || same ? from.width : 0), y1 = from.y + from.height / 2;
            const x2 = to.x + (forward ? 0 : to.width), y2 = to.y + to.height / 2;
            const control = same ? x1 + 70 : (x1 + x2) / 2;
            return <g key={edge.id ?? `${edge.from}-${edge.type}-${edge.to}-${index}`} className={`graph-edge${["generated_by", "validated_by", "implements"].includes(edge.type) ? " graph-edge--implementation" : ""}`}>
              <title>{label(edge.from)} — {relationLabels[edge.type] ?? edge.type} → {label(edge.to)}</title>
              <path d={`M ${x1} ${y1} C ${control} ${y1}, ${control} ${y2}, ${x2} ${y2}`} markerEnd={`url(#${instanceId}-arrow)`} />
              {showLabels && <text x={control} y={(y1 + y2) / 2 - 6} textAnchor="middle">{relationLabels[edge.type] ?? edge.type}</text>}
            </g>;
          })}</g>
          <g>{visible.nodes.map((node) => {
            const position = layout.positions.get(node.id)!;
            const content = <g className={`graph-node graph-node--${node.kind}`} transform={`translate(${position.x} ${position.y})`}>
              <rect width={position.width} height={position.height} /><text className="graph-node-kind" x="16" y="20">{node.id === graph.root ? "Aktuální pravidlo" : graphKindLabels[node.kind]}</text>
              <text className="graph-node-title" x="16" y="43">{lines(graphNodeLabel(node)).map((line, index) => <tspan key={index} x="16" dy={index ? 18 : 0}>{line}</tspan>)}</text>
              <title>{graphNodeLabel(node)} ({node.id})</title>
            </g>;
            const href = destination(node);
            return href ? <a key={node.id} href={href} onClick={onNavigate} aria-label={graphNodeLabel(node)}>{content}</a> : <g key={node.id}>{content}</g>;
          })}</g>
        </svg>
      </div>}
  </div>;
}
