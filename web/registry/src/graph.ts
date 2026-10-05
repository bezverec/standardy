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
