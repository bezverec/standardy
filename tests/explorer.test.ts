import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { filterRules, matchesQuery, sourceIds } from "../web/registry/src/explore.ts";
import { api, type RuleVersion } from "../web/registry/src/api.ts";
import { handleRequest, type Env } from "../worker/src/index.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions as unknown as RuleVersion[];
const rule = rules.find((item) => item.rule_id.endsWith("-VERSION"))!;

afterEach(() => vi.unstubAllGlobals());

describe("registry exploration", () => {
  it("searches interpretation and provenance without accents and combines filters", () => {
    expect(matchesQuery(rule, "HLAVIC profilu")).toBe(true);
    expect(matchesQuery(rule, "Monografie 2.3")).toBe(true);
    expect(matchesQuery(rule, "barevny neexistujici")).toBe(false);
    expect(filterRules(rules, "hlavic profilu", { source: "ICC", verification: "verified" }, registry.relations)).toEqual([rule]);
    expect(filterRules(rules, "hlavic profilu", { severity: "warning" }, registry.relations)).toEqual([]);
  });

  it("uses direct source relations without inheriting evidence from a related rule", () => {
    expect(sourceIds(rule, registry.relations)).toEqual(["ICC", "MIX", "NISO-Z3987"]);
    const name = rules.find((item) => item.rule_id.endsWith("-NAME"))!;
    expect(sourceIds(name, registry.relations)).toEqual(["MIX", "NISO-Z3987"]);
    const renamedRelations = registry.relations.map((edge) => ({ ...edge,
      from: edge.from === rule.rule_id ? "OTHER-RULE" : edge.from,
      to: edge.to === rule.rule_id ? "OTHER-RULE" : edge.to,
    }));
    expect(sourceIds(name, renamedRelations)).toEqual(["MIX", "NISO-Z3987"]);
  });

  it("loads all rules and relations beyond the first API page", async () => {
    const fetchMock = vi.fn(async (input: string) => {
      const url = new URL(input, "https://registry.invalid");
      const data = url.pathname.endsWith("/rules") ? rules : registry.relations;
      const page = Number(url.searchParams.get("page") ?? 1);
      return new Response(JSON.stringify({ data: page === 1 ? data.slice(0, 1) : data.slice(1), pagination: { total: data.length } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    expect((await api.rules()).data).toEqual(rules);
    expect((await api.relations()).data).toEqual(registry.relations);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/rules?page_size=100", "/api/v1/rules?page_size=100&page=2",
      "/api/v1/relations?page_size=500", "/api/v1/relations?page_size=500&page=2",
    ]);
  });

  it("pages Worker relations with matching filter bindings and a total count", async () => {
    const queries: Array<{ sql: string; bindings: unknown[] }> = [];
    const DB = { prepare(sql: string) {
      const query = { sql, bindings: [] as unknown[] };
      queries.push(query);
      const statement = {
        bind(...bindings: unknown[]) { query.bindings = bindings; return statement; },
        async first() { return { total: 501 }; },
        async all() { return { results: sql.includes("registry_meta")
          ? [{ key: "dataset_version", value: "test" }]
          : [{ data_json: JSON.stringify(registry.relations[0]) }] }; },
      };
      return statement;
    } } as unknown as D1Database;
    const response = await handleRequest(new Request("https://registry.invalid/api/v1/relations?type=defined_by&page=2&page_size=500"), { DB } as Env);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ pagination: { page: 2, page_size: 500, total: 501 } });
    expect(queries.find((query) => query.sql.includes("COUNT(*)"))?.bindings).toEqual(["defined_by"]);
    expect(queries.find((query) => query.sql.includes("LIMIT ? OFFSET ?"))?.bindings).toEqual(["defined_by", 500, 500]);
  });
});
