import path from "node:path";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, registryImportSql } from "../packages/registry-core/src/index.ts";
import { metadataAreas, metadataStandards, metadataTaxonomy, targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";
import { handleRequest, type Env } from "../worker/src/index.ts";
import { filterRules } from "../web/registry/src/explore.ts";
import type { RuleVersion, KnowledgeGraphResponse } from "../web/registry/src/api.ts";

const root = path.resolve(import.meta.dirname, "..");
const registry = compileRegistry(await loadRegistry(root));
const rules = JSON.parse(JSON.stringify(registry.rule_versions)) as RuleVersion[];
const database = new DatabaseSync(":memory:");
for (const migration of ["0001_registry.sql", "0002_national_standards.sql", "0003_obligation.sql"]) database.exec(await readFile(path.join(root, "migrations", migration), "utf8"));
database.exec(registryImportSql(registry));
const env = { DB: { prepare(sql: string) {
  let parameters: any[] = [];
  const statement = {
    bind(...values: any[]) { parameters = values; return statement; },
    async all() { return { results: database.prepare(sql).all(...parameters) }; },
    async first() { return database.prepare(sql).get(...parameters) ?? null; },
  };
  return statement;
} } } as unknown as Env;
afterAll(() => database.close());
const request = (path: string) => handleRequest(new Request(`https://registry.test/api/v1${path}`), env);

describe("metadata taxonomy", () => {
  it("publishes all nine metadata standards plus info.xml, including empty areas", async () => {
    expect(new Set(metadataStandards.map((item) => item.id)).size).toBe(10);
    expect(new Set(metadataStandards.map((item) => item.area))).toEqual(new Set(metadataAreas.map((item) => item.id)));
    const response = await request("/metadata-taxonomy");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(metadataTaxonomy);
    for (const standard of metadataStandards) {
      const rule = { ...rules[0]!, target: { entity: "fixture" } };
      const edges = [{ id: "owner", from: "fixture", to: standard.id, type: "defined_by" }];
      expect(filterRules([rule], "", { standard: standard.id, metadata_area: standard.area }, edges)).toEqual([rule]);
    }
  });
  it("matches client and API filters, combinations, pagination and empty results", async () => {
    for (const [filters, count] of [
      [{ metadata_area: "administrative-technical" }, 74], [{ metadata_area: "package" }, 18],
      [{ standard: "PREMIS" }, 61], [{ standard: "PREMIS", category: "technical/premis-object" }, 17],
      [{ standard: "PREMIS", category: "technical/premis-provenance" }, 8],
      [{ standard: "PREMIS", category: "technical/premis-relationships" }, 13],
      [{ standard: "PREMIS", category: "technical/premis-events" }, 16],
      [{ standard: "PREMIS", category: "technical/premis-agents" }, 7],
      [{ metadata_area: "structural" }, 69], [{ standard: "METS" }, 69],
      [{ standard: "METS", category: "structure/mets-files" }, 14],
      [{ standard: "METS", category: "structure/mets-header" }, 12],
      [{ standard: "METS", category: "structure/mets-physical" }, 12],
      [{ standard: "METS", category: "structure/mets-logical" }, 10],
      [{ standard: "METS", category: "structure/mets-internal-parts" }, 13],
      [{ category: "structure/mets-internal-parts", obligation: "mandatory_if_available" }, 1],
      [{ category: "structure/mets-internal-parts", obligation: "optional" }, 1],
      [{ category: "structure/mets-internal-parts", status: "ambiguous" }, 1],
      [{ standard: "METS", category: "structure/mets-amd" }, 8],
      [{ metadata_area: "descriptive" }, 0], [{ metadata_area: "administrative-technical", standard: "MIX" }, 13],
      [{ metadata_area: "package", standard: "MIX" }, 0], [{ standard: "NDK-INFO" }, 18],
    ] as Array<[Record<string, string>, number]>) {
      const response = await request(`/rules?${new URLSearchParams({ ...filters, page_size: "2" })}`);
      expect(response.status).toBe(200);
      const result = await response.json() as { data: RuleVersion[]; pagination: { total: number } };
      expect(result.pagination.total).toBe(count);
      expect(result.data.length).toBe(Math.min(2, count));
      expect(filterRules(rules, "", filters, registry.relations)).toHaveLength(count);
    }
    const response = await request("/rules?metadata_area=unknown");
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "unknown_metadata_area" });
  });
  it("does not classify ICC citations as the target's metadata standard", () => {
    const rule = rules.find((item) => item.rule_id === "NDK-MONO-MIX-ICC-PROFILE-VERSION")!;
    expect(targetStandardId(rule.target.entity, registry.relations)).toBe("MIX");
    expect(filterRules([rule], "", { source: "ICC", standard: "MIX", metadata_area: "administrative-technical" }, registry.relations)).toEqual([rule]);
    expect(filterRules([rule], "", { standard: "ICC" }, registry.relations)).toEqual([]);
  });
  it("limits server graphs to four outgoing hops independently of edge order", async () => {
    const ruleId = rules[0]!.rule_id;
    database.exec("SAVEPOINT graph_fixture");
    try {
      database.exec("DELETE FROM relations");
      const edges = Array.from({ length: 7 }, (_, i) => ({ from: i === 0 ? ruleId : `node-${i}`, to: `node-${i + 1}`, type: "related_to" }));
      for (const reverse of [false, true]) {
        database.exec("DELETE FROM relations");
        for (const [index, edge] of edges.entries()) database.prepare("INSERT INTO relations(id, from_id, to_id, relation_type, data_json) VALUES (?, ?, ?, ?, ?)").run(String(reverse ? 7 - index : index), edge.from, edge.to, edge.type, JSON.stringify(edge));
        const response = await request(`/rules/${ruleId}/why`);
        const graph = await response.json() as KnowledgeGraphResponse;
        expect(graph.edges).toHaveLength(4);
        expect(graph.nodes.map((node) => node.id).sort()).toEqual([ruleId, "node-1", "node-2", "node-3", "node-4"].sort());
      }
    } finally { database.exec("ROLLBACK TO graph_fixture; RELEASE graph_fixture"); }
  });
});
