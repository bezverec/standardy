import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import type { KnowledgeGraphResponse, RuleVersion } from "../web/registry/src/api.ts";
import { buildRegistryMap, mapRulesUrl } from "../web/registry/src/registry-map.ts";
import { RegistryMap } from "../web/registry/src/RegistryMap.tsx";
import { connectedGraphNodes, defaultLayerOrder, layoutRadialGraph, moveGraphLayer, normalizeGraphPreferences, radialEdge } from "../web/registry/src/graph.ts";
import { filterRules } from "../web/registry/src/explore.ts";

const compiled = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = compiled.rule_versions as unknown as RuleVersion[];
const relations = compiled.relations;

describe("registry map", () => {
  it("accounts for every version exactly once, following target owners rather than citations", () => {
    const map = buildRegistryMap(rules, relations);
    expect(map.rules).toBe(78);
    expect(map.records).toBe(78);
    const standards = map.areas.flatMap((area) => area.standards);
    expect(standards.find(({ id }) => id === "MIX")?.records).toBe(13);
    expect(standards.find(({ id }) => id === "NDK-INFO")?.records).toBe(18);
    expect(standards.find(({ id }) => id === "METS")?.records).toBe(22);
    expect(standards.find(({ id }) => id === "PREMIS")?.records).toBe(25);
    expect(standards.find(({ id }) => id === "PREMIS")?.topics).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "technical/premis-object", records: 17 }),
      expect.objectContaining({ category: "technical/premis-provenance", records: 8 }),
    ]));
    expect(standards.find(({ id }) => id === "METS")?.topics).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "structure/mets-files", records: 14 }),
      expect.objectContaining({ category: "structure/mets-amd", records: 8 }),
    ]));
    expect(standards.find(({ id }) => id === "MODS")?.records).toBe(0);
    expect(standards.reduce((sum, item) => sum + item.records, 0) + map.unclassified.length).toBe(map.records);
    for (const standard of standards) {
      expect(standard.topics.reduce((sum, topic) => sum + topic.records, 0)).toBe(standard.records);
      for (const topic of standard.topics) {
        expect(topic.obligations.reduce((sum, item) => sum + item.count, 0)).toBe(topic.records);
        expect(filterRules(rules, "", { standard: standard.id, category: topic.category }, relations)).toHaveLength(topic.records);
      }
    }
  });
  it("keeps historical obligations and separates IDs from version records", () => {
    const sample = rules.find((rule) => rule.obligation_code === "O")!;
    const map = buildRegistryMap([sample, { ...sample, version: "future", obligation: "recommended", obligation_code: "R" }], relations);
    expect(map.rules).toBe(1);
    expect(map.records).toBe(2);
    expect(map.obligations.map(({ value, count }) => [value, count])).toEqual([["recommended", 1], ["optional", 1]]);
  });
  it("retains unknown target owners and handles an empty selection", () => {
    const unknown = { ...rules[0]!, target: { entity: "unknown" } };
    expect(buildRegistryMap([unknown], relations).unclassified).toEqual([unknown]);
    expect(buildRegistryMap([], relations).areas.flatMap((area) => area.standards).every(({ records }) => records === 0)).toBe(true);
  });
  it("generates filter links preserving national standard and version with URL-safe parameters", () => {
    const href = mapRulesUrl({ national: "NDK mono", version: "2.3", category: "technical/icc", standard: "MIX", q: "" });
    const url = new URL(href, "https://example.test");
    expect(url.pathname).toBe("/registry/rules");
    expect(Object.fromEntries(url.searchParams)).toEqual({ national: "NDK mono", version: "2.3", category: "technical/icc", standard: "MIX" });
  });
  it("renders accessible links, text counts and empty standards without a percentage of completeness", () => {
    const html = renderToStaticMarkup(createElement(RegistryMap, { rules, relations, nationalStandards: [], topicLabels: {}, onNavigate() {} }));
    expect(html).toContain('role="status"');
    expect(html).toContain("MIX");
    expect(html).toContain("Další metadatové standardy");
    expect(html).toContain("category=technical%2Ficc");
    expect(html).toContain("verzovaných záznamů");
    expect(html).not.toContain("100%");
  });
});

describe("radial network", () => {
  const graph: KnowledgeGraphResponse = {
    root: "root", nodes: [{ id: "root", kind: "rule" }, ...defaultLayerOrder.flatMap((kind) => Array.from({ length: 12 }, (_, index) => ({ id: `${kind}-${index}`, kind })))],
    edges: [{ from: "root", to: "implementation-0", type: "generated_by" }, { from: "standard-0", to: "root", type: "related_to" }],
  };
  it("fits every rectangle without overlap; remains deterministic and keeps the root centered", () => {
    const layout = layoutRadialGraph(graph, defaultLayerOrder);
    expect(layoutRadialGraph({ ...graph, nodes: [...graph.nodes].reverse() }, defaultLayerOrder)).toEqual(layout);
    const root = layout.positions.get("root")!;
    expect(root.x + root.width / 2).toBe(layout.center);
    expect(root.y + root.height / 2).toBe(layout.center);
    const positions = [...layout.positions.values()];
    for (const [index, a] of positions.entries()) {
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.y).toBeGreaterThanOrEqual(0);
      expect(a.x + a.width).toBeLessThanOrEqual(layout.width);
      expect(a.y + a.height).toBeLessThanOrEqual(layout.height);
      for (const b of positions.slice(index + 1)) expect(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y).toBe(true);
    }
  });
  it("normalizes damaged preferences and changes radial order without mutating defaults", () => {
    const preferences = normalizeGraphPreferences({ order: ["implementation", "bogus", "implementation"], hiddenKinds: ["rule", "bogus"], view: "radial" });
    expect(preferences.order).toHaveLength(5);
    expect(preferences.order[0]).toBe("implementation");
    expect(preferences.hiddenKinds).toEqual(["rule"]);
    expect(normalizeGraphPreferences(null).view).toBe("graph");
    expect(normalizeGraphPreferences({ order: "invalid", hiddenKinds: {} }).order).toEqual(defaultLayerOrder);
    const moved = moveGraphLayer(defaultLayerOrder, "standard", -1);
    expect(moved[0]).toBe("standard");
    expect(defaultLayerOrder[0]).toBe("standard_entity");
    expect(layoutRadialGraph(graph, moved).rings[0]?.kind).toBe("standard");
    expect(moveGraphLayer(defaultLayerOrder, "standard_entity", -1)).toEqual(defaultLayerOrder);
  });
  it("highlights incoming and outgoing neighbours but not disconnected nodes", () => {
    expect([...connectedGraphNodes(graph, "root")].sort()).toEqual(["implementation-0", "root", "standard-0"]);
    expect(connectedGraphNodes(graph, "missing").size).toBe(0);
    expect(connectedGraphNodes(graph, null).size).toBe(0);
  });
  it("handles empty layers, a lone root, vertical links and self-links with finite geometry", () => {
    const single = layoutRadialGraph({ ...graph, nodes: [graph.nodes[0]!] }, defaultLayerOrder);
    expect(single.rings).toHaveLength(0);
    expect(single.positions.size).toBe(1);
    const node = single.positions.get("root")!;
    for (const other of [node, { ...node, y: node.y + 300 }, { ...node, x: node.x + 500 }]) {
      expect(radialEdge(node, other).path).not.toMatch(/NaN|Infinity/);
    }
  });
});
