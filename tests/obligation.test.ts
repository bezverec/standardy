import path from "node:path";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, registryImportSql } from "../packages/registry-core/src/index.ts";
import { handleRequest, type Env } from "../worker/src/index.ts";
import { filterRules } from "../web/registry/src/explore.ts";
import type { RuleVersion } from "../web/registry/src/api.ts";

const root = path.resolve(import.meta.dirname, "..");
describe("source-backed obligation", () => {
  it("imports levels and filters the API after all D1 migrations", async () => {
    const database = new DatabaseSync(":memory:");
    try {
      for (const migration of ["0001_registry.sql", "0002_national_standards.sql", "0003_obligation.sql"]) database.exec(await readFile(path.join(root, "migrations", migration), "utf8"));
      const registry = compileRegistry(await loadRegistry(root));
      const wireRules = JSON.parse(JSON.stringify(registry.rule_versions)) as RuleVersion[];
      database.exec(registryImportSql(registry));
      const columns = database.prepare("PRAGMA table_info(rule_versions)").all().map((row) => row.name);
      expect(columns).toContain("obligation");
      expect(columns).not.toContain("severity");
      expect(registry.rule_versions.filter((rule) => rule.rule_id.startsWith("NDK-MONO-MIX-ICC-")).map((rule) => rule.obligation).sort()).toEqual(["mandatory", "mandatory", "recommended"]);
      expect(JSON.stringify(registry.rules)).not.toContain('"severity"');
      const env = { DB: { prepare(sql: string) {
        let parameters: any[] = [];
        const statement = {
          bind(...values: any[]) { parameters = values; return statement; },
          async all() { return { results: database.prepare(sql).all(...parameters) }; },
          async first() { return database.prepare(sql).get(...parameters) ?? null; },
        };
        return statement;
      } } } as unknown as Env;
      for (const level of ["mandatory", "mandatory_if_available", "recommended", "recommended_if_available", "optional"] as const) {
        const count = registry.rule_versions.filter((rule) => rule.obligation === level).length;
        const response = await handleRequest(new Request(`https://registry.test/api/v1/rules?obligation=${level}&sort=obligation`), env);
        const result = await response.json() as { data: RuleVersion[]; pagination: { total: number } };
        expect(response.status).toBe(200);
        expect(result.pagination.total).toBe(count);
        expect(result.data.every((rule) => rule.obligation === level)).toBe(true);
        expect(filterRules(wireRules, "", { obligation: level }, registry.relations)).toHaveLength(count);
      }
      const result = await handleRequest(new Request("https://registry.test/api/v1/rules/NDK-MONO-MIX-ICC-PROFILE-VERSION"), env);
      const rule = (await result.json() as { versions: RuleVersion[] }).versions[0]!;
      expect(rule.obligation).toBe("mandatory");
      expect(rule.obligation_code).toBe("M");
      expect(rule.status).toBe("disputed");
      expect(rule.references).toContainEqual(expect.objectContaining({ url: "https://github.com/NLCR/Standard_NDK/issues/255" }));
      for (const query of ["severity=error", "sort=severity"]) {
        const response = await handleRequest(new Request(`https://registry.test/api/v1/rules?${query}`), env);
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ error: "severity_removed_use_obligation" });
      }
    } finally { database.close(); }
  });
});
