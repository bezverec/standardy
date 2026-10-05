import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { matchesQuery, sourceIds } from "../web/registry/src/explore.ts";
import type { RuleVersion } from "../web/registry/src/api.ts";
import { snapshotRequest } from "../web/registry/src/snapshot.ts";
import { searchTool } from "../web/registry/src/webmcp.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rule = registry.rule_versions.find((item) => item.rule_id.endsWith("-VERSION"))! as unknown as RuleVersion;

describe("registry exploration", () => {
  it("searches provenance and interpretation without accents and supports multiple words", () => {
    expect(matchesQuery(rule, "HLAVIC profilu")).toBe(true);
    expect(matchesQuery(rule, "Monografie 2.3")).toBe(true);
    expect(matchesQuery(rule, "barevny neexistujici")).toBe(false);
    expect(matchesQuery(rule, "   ")).toBe(true);
  });
  it("follows explicit source evidence without importing related rule evidence", () => {
    expect(sourceIds(rule, registry.relations)).toEqual(["ICC", "MIX", "NISO-Z3987"]);
    const name = registry.rule_versions.find((item) => item.rule_id.endsWith("-NAME"))! as unknown as RuleVersion;
    expect(sourceIds(name, registry.relations)).toEqual(["MIX", "NISO-Z3987"]);
  });
  it("loads the private data once, resolves graph nodes and preserves reverse browsing", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(registry), { headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetch);
    const graph = await snapshotRequest<{ nodes: Array<{ id: string }>; edges: Array<{ from: string; to: string }> }>(`/rules/${rule.rule_id}/why`);
    expect(graph.nodes.map((node) => node.id)).toEqual(expect.arrayContaining(["ICC", "MIX", "NISO-Z3987", "ndk-monograph"]));
    for (const edge of graph.edges) {
      expect(graph.nodes.some((node) => node.id === edge.from)).toBe(true);
      expect(graph.nodes.some((node) => node.id === edge.to)).toBe(true);
    }
    const standard = await snapshotRequest<{ entities: Array<{ id: string }> }>("/standards/MIX");
    expect(standard.entities).toHaveLength(3);
    await expect(snapshotRequest("/rules/DOES-NOT-EXIST")).rejects.toThrow("Pravidlo nebylo nalezeno");
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
  it("validates the optional browser search tool before changing the query", async () => {
    const search = vi.fn(async () => ({ count: 1, ids: [rule.rule_id] }));
    const tool = searchTool(search);
    expect(tool.name).toBe("set_rule_search");
    expect(tool.annotations.readOnlyHint).toBe(false);
    expect(await tool.execute({ query: "hlavic" })).toEqual({ count: 1, ids: [rule.rule_id] });
    await expect(tool.execute({ query: 12 })).rejects.toThrow("query musí být text");
    await expect(tool.execute({ query: "x", unexpected: true })).rejects.toThrow("query musí být text");
    expect(search).toHaveBeenCalledTimes(1);
  });
});
