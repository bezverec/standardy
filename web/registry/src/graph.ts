import type { KnowledgeGraphNode, KnowledgeGraphResponse } from "./api.ts";
import { metadataAreaForStandard, targetStandardId } from "../../../packages/registry-core/src/metadata-taxonomy.ts";

export const graphKindLabels: Record<KnowledgeGraphNode["kind"], string> = {
  rule: "Pravidla", national_standard: "Národní standardy", standard_entity: "Prvky standardů",
  standard: "Zdrojové standardy", implementation: "Implementace",
};
export const relationLabels: Record<string, string> = {
  defined_by: "je definováno v", derived_from: "vychází z", restricts: "omezuje", extends: "rozšiřuje",
  clarifies: "upřesňuje", implements: "implementuje", conflicts_with: "je v rozporu s", supersedes: "nahrazuje",
  equivalent_to: "je ekvivalentní", related_to: "souvisí s", validated_by: "je kontrolováno v",
  generated_by: "je generováno v", provides_value_for: "poskytuje hodnotu pro",
};
export function graphNodeLabel(node: KnowledgeGraphNode): string {
  return node.data?.title?.cs ?? node.data?.title?.en ?? node.data?.application ?? node.data?.name ?? node.id;
}
export function graphNodeAreas(node: KnowledgeGraphNode, graph: KnowledgeGraphResponse): string[] {
  const targets = node.data?.versions?.flatMap((version) => version.target ? [version.target.entity] : [])
    ?? (node.data?.target ? [node.data.target.entity] : []);
  const owners = node.kind === "standard" ? [node.id] : node.kind === "standard_entity"
    ? [node.data?.standard_id ?? targetStandardId(node.id, graph.edges) ?? ""]
    : targets.map((target) => graph.nodes.find((item) => item.id === target && item.kind === "standard_entity")?.data?.standard_id ?? targetStandardId(target, graph.edges) ?? "");
  const areas = [...new Set(owners.flatMap((owner) => metadataAreaForStandard(owner) ? [metadataAreaForStandard(owner)!] : []))];
  return areas.length ? areas : ["other"];
}
export function graphNodeTopics(node: KnowledgeGraphNode): string[] {
  return [...new Set(node.data?.versions?.flatMap((version) => version.category ? [version.category] : [])
    ?? (node.data?.category ? [node.data.category] : []))];
}
export interface GraphFilters {
  depth: number;
  hiddenTypes: ReadonlySet<string>;
  hiddenKinds: ReadonlySet<string>;
  hiddenAreas: ReadonlySet<string>;
  hiddenTopics: ReadonlySet<string>;
}
export function filterGraph(graph: KnowledgeGraphResponse, filters: GraphFilters): KnowledgeGraphResponse {
  const eligible = new Set(graph.nodes.filter((node) => node.id === graph.root || (
    !filters.hiddenKinds.has(node.kind)
    && graphNodeAreas(node, graph).some((area) => !filters.hiddenAreas.has(area))
    && (!graphNodeTopics(node).length || graphNodeTopics(node).some((topic) => !filters.hiddenTopics.has(topic)))
  )).map((node) => node.id));
  const candidates = graph.edges.filter((edge) => !filters.hiddenTypes.has(edge.type) && eligible.has(edge.from) && eligible.has(edge.to));
  const reached = new Set([graph.root]);
  let frontier = new Set([graph.root]);
  for (let depth = 0; depth < filters.depth && frontier.size; depth++) {
    const next = new Set<string>();
    for (const edge of candidates) {
      if (frontier.has(edge.from) && !reached.has(edge.to)) next.add(edge.to);
      if (frontier.has(edge.to) && !reached.has(edge.from)) next.add(edge.from);
    }
    for (const id of next) reached.add(id);
    frontier = next;
  }
  return { root: graph.root, nodes: graph.nodes.filter((node) => reached.has(node.id)),
    edges: candidates.filter((edge) => reached.has(edge.from) && reached.has(edge.to)
      && (filters.depth !== 1 || edge.from === graph.root || edge.to === graph.root)) };
}

export function layoutGraph(graph: KnowledgeGraphResponse) {
  const sorted = graph.nodes.filter((node) => node.id !== graph.root).sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
  // Balance both sides of the root instead of growing one tall column of neighbours.
  const split = Math.ceil(sorted.length / 2);
  const columns = [sorted.slice(0, split), graph.nodes.filter((node) => node.id === graph.root), sorted.slice(split)];
  const height = Math.max(320, split * 112 + 48);
  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  columns.forEach((column, columnIndex) => column.forEach((node, row) => positions.set(node.id, {
    x: 24 + columnIndex * 404, y: columnIndex === 1 ? height / 2 - 48 : 24 + row * 112, width: 300, height: 96,
  })));
  return { positions, width: 1240, height };
}

export type GraphKind = KnowledgeGraphNode["kind"];
export const defaultLayerOrder: GraphKind[] = ["standard_entity", "standard", "national_standard", "rule", "implementation"];
export interface GraphPreferences { order: GraphKind[]; hiddenKinds: GraphKind[]; view: "graph" | "radial" | "table" }
export const graphPreferenceKey = "standardy-graph-layout-v1";
export function normalizeGraphPreferences(value: unknown): GraphPreferences {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const kinds = (value: unknown): GraphKind[] => Array.isArray(value) ? value.filter((kind): kind is GraphKind => defaultLayerOrder.includes(kind)) : [];
  return { order: [...new Set([...kinds(data.order), ...defaultLayerOrder])], hiddenKinds: [...new Set(kinds(data.hiddenKinds))], view: data.view === "radial" || data.view === "table" ? data.view : "graph" };
}
export function moveGraphLayer(order: GraphKind[], kind: GraphKind, direction: -1 | 1): GraphKind[] {
  const result = [...order], index = result.indexOf(kind), other = index + direction;
  if (index >= 0 && other >= 0 && other < result.length) [result[index], result[other]] = [result[other]!, result[index]!];
  return result;
}

/** Deterministic rings, expanded only when actual rectangular labels would collide. */
export function layoutRadialGraph(graph: KnowledgeGraphResponse, order: GraphKind[]) {
  const width = 240, height = 96, diagonal = Math.hypot(width, height);
  const groups = normalizeGraphPreferences({ order }).order.map((kind) => ({ kind, nodes: graph.nodes.filter((node) => node.id !== graph.root && node.kind === kind).sort((a, b) => a.id.localeCompare(b.id)) })).filter(({ nodes }) => nodes.length);
  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  if (graph.nodes.some((node) => node.id === graph.root)) positions.set(graph.root, { x: -width / 2, y: -height / 2, width, height });
  const overlaps = (a: Position, b: Position) => a.x < b.x + b.width + 24 && b.x < a.x + a.width + 24 && a.y < b.y + b.height + 24 && b.y < a.y + a.height + 24;
  let radius = 0;
  const rings = groups.map((group, layer) => {
    const count = group.nodes.length;
    radius = Math.max(radius + height + 40, count > 1 ? (height + 24) / (2 * Math.sin(Math.PI / count)) : 180);
    const place = () => group.nodes.map((node, index) => {
      const angle = -Math.PI / 2 + 2 * Math.PI * index / count + layer * 0.7;
      return { id: node.id, x: Math.cos(angle) * radius - width / 2, y: Math.sin(angle) * radius - height / 2, width, height };
    });
    let candidates = place();
    const occupied = [...positions.values()];
    while (candidates.some((node, index) => [...occupied, ...candidates.slice(0, index)].some((other) => overlaps(node, other)))) {
      radius += 16;
      candidates = place();
    }
    for (const { id, ...position } of candidates) positions.set(id, position);
    return { ...group, radius };
  });
  const size = Math.max(600, (radius + diagonal / 2 + 48) * 2), center = size / 2;
  for (const [id, position] of positions) positions.set(id, { ...position, x: position.x + center, y: position.y + center });
  return { positions, width: size, height: size, center, rings };
}

export function connectedGraphNodes(graph: KnowledgeGraphResponse, selected: string | null): Set<string> {
  return new Set(selected && graph.nodes.some(({ id }) => id === selected) ? [selected, ...graph.edges.filter((edge) => edge.from === selected || edge.to === selected).flatMap((edge) => [edge.from, edge.to])] : []);
}

type Position = { x: number; y: number; width: number; height: number };
export function radialEdge(from: Position, to: Position) {
  const x = from.x + from.width / 2, y = from.y + from.height / 2;
  const dx = to.x + to.width / 2 - x, dy = to.y + to.height / 2 - y;
  if (dx === 0 && dy === 0) return { path: `M ${x} ${from.y} C ${x - 60} ${from.y - 48}, ${x + 60} ${from.y - 48}, ${x + 20} ${from.y}`, x, y: from.y - 35 };
  const start = 1 / Math.max(Math.abs(dx) / (from.width / 2), Math.abs(dy) / (from.height / 2));
  const end = 1 / Math.max(Math.abs(dx) / (to.width / 2), Math.abs(dy) / (to.height / 2));
  return { path: `M ${x + dx * start} ${y + dy * start} L ${x + dx * (1 - end)} ${y + dy * (1 - end)}`, x: x + dx / 2, y: y + dy / 2 - 6 };
}
