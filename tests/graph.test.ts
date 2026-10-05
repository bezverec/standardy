import { describe, expect, it } from "vitest";
import { filterGraph, graphNodeAreas, graphNodeTopics, layoutGraph, type GraphFilters } from "../web/registry/src/graph.ts";
import type { KnowledgeGraphResponse } from "../web/registry/src/api.ts";

const graph: KnowledgeGraphResponse = {
  root: "root",
  nodes: [
    { id: "root", kind: "rule", data: { versions: [{ target: { entity: "entity" }, category: "technical/icc" }] } },
    { id: "entity", kind: "standard_entity", data: { standard_id: "MIX" } },
    { id: "MIX", kind: "standard" },
    { id: "tool", kind: "implementation" },
    { id: "related", kind: "rule", data: { target: { entity: "info" }, category: "package/info" } },
    { id: "info", kind: "standard_entity", data: { standard_id: "NDK-INFO" } },
    { id: "island", kind: "standard" },
  ],
  edges: [
    { from: "root", to: "entity", type: "restricts" },
    { from: "entity", to: "MIX", type: "defined_by" },
    { from: "root", to: "tool", type: "generated_by" },
    { from: "root", to: "related", type: "related_to" },
    { from: "related", to: "info", type: "restricts" },
    { from: "related", to: "root", type: "related_to" },
  ],
};
const defaults: GraphFilters = { depth: 1, hiddenTypes: new Set(), hiddenKinds: new Set(), hiddenAreas: new Set(), hiddenTopics: new Set() };
const ids = (result: KnowledgeGraphResponse) => result.nodes.map((node) => node.id).sort();

describe("graph exploration", () => {
  it("starts with direct neighbours; expands by hops, not input order; handles cycles", () => {
    expect(ids(filterGraph(graph, defaults))).toEqual(["entity", "related", "root", "tool"]);
    const expanded = filterGraph(graph, { ...defaults, depth: 2 });
    expect(ids(expanded)).toEqual(["MIX", "entity", "info", "related", "root", "tool"]);
    expect(ids(filterGraph({ ...graph, edges: [...graph.edges].reverse() }, { ...defaults, depth: 99 }))).toEqual(ids(expanded));
  });
  it("hides relation types and prunes orphaned nodes, without mutating the original", () => {
    const before = JSON.stringify(graph);
    const filtered = filterGraph(graph, { ...defaults, depth: 99, hiddenTypes: new Set(["restricts"]) });
    expect(ids(filtered)).toEqual(["related", "root", "tool"]);
    expect(filtered.edges.every((edge) => edge.type !== "restricts")).toBe(true);
    expect(JSON.stringify(graph)).toBe(before);
  });
  it("hides node kinds, metadata areas and rule topics independently, retaining the root", () => {
    expect(ids(filterGraph(graph, { ...defaults, hiddenKinds: new Set(["implementation", "rule"]) }))).toEqual(["entity", "root"]);
    expect(ids(filterGraph(graph, { ...defaults, depth: 99, hiddenAreas: new Set(["administrative-technical"]) }))).toEqual(["info", "related", "root", "tool"]);
    expect(ids(filterGraph(graph, { ...defaults, depth: 99, hiddenTopics: new Set(["package/info", "technical/icc"]) }))).toEqual(["MIX", "entity", "root", "tool"]);
    expect(ids(filterGraph(graph, { ...defaults, hiddenTypes: new Set(graph.edges.map((edge) => edge.type)) }))).toEqual(["root"]);
  });
  it("classifies versioned and normalized rules through target ownership, including boundary entities", () => {
    expect(graphNodeAreas(graph.nodes[0]!, graph)).toEqual(["administrative-technical"]);
    expect(graphNodeAreas(graph.nodes[4]!, graph)).toEqual(["package"]);
    expect(graphNodeTopics(graph.nodes[0]!)).toEqual(["technical/icc"]);
    expect(graphNodeAreas(graph.nodes[3]!, graph)).toEqual(["other"]);
  });
  it("lays out deterministic non-overlapping rectangles regardless of input order", () => {
    const visible = filterGraph(graph, { ...defaults, depth: 99 });
    const layout = layoutGraph(visible);
    expect(layout.positions.get(graph.root)!.y + 48).toBe(layout.height / 2);
    expect(layoutGraph({ ...visible, nodes: [...visible.nodes].reverse() })).toEqual(layout);
    const positions = [...layout.positions.values()];
    for (const [index, a] of positions.entries()) {
      expect(a.x + a.width).toBeLessThanOrEqual(layout.width);
      expect(a.y + a.height).toBeLessThanOrEqual(layout.height);
      for (const b of positions.slice(index + 1)) expect(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y).toBe(true);
    }
  });
  it("balances large neighbourhoods around the root instead of one long column", () => {
    const large: KnowledgeGraphResponse = { root: "root", edges: [], nodes: [graph.nodes[0]!, ...Array.from({ length: 30 }, (_, index) => ({ id: `node-${index}`, kind: "standard_entity" as const }))] };
    const layout = layoutGraph(large);
    expect(layout.height).toBe(15 * 112 + 48);
    const sides = [...layout.positions.entries()].filter(([id]) => id !== "root").map(([, position]) => position.x);
    expect(sides.filter((x) => x === 24)).toHaveLength(15);
    expect(sides.filter((x) => x === 832)).toHaveLength(15);
  });
});
