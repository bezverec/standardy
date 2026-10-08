import path from "node:path";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { cataloguingCondition, compareRuleContexts, compileRegistry, loadRegistry, registryImportSql, validateRegistry } from "../packages/registry-core/src/index.ts";
import type { ComparableRule, ComparisonSelection, RuleDocument } from "../packages/registry-core/src/index.ts";
import { openApiDocument } from "../packages/registry-core/src/openapi.ts";
import { obligationLabel } from "../web/registry/src/obligation.ts";
import { handleRequest, type Env } from "../worker/src/index.ts";

const root = path.resolve(import.meta.dirname, "..");
const documents = await loadRegistry(root);
const registry = compileRegistry(documents);
const aacr: ComparisonSelection = { national_standard: "ndk-monograph", version: "2.3", cataloguing_rules: "aacr2" };
const rda: ComparisonSelection = { ...aacr, cataloguing_rules: "rda" };
const original = registry.rule_versions.find((rule) => rule.rule_id === "NDK-MONO-MODS-SINGLE-ORIGIN-EVENT-TYPE")!;
const compare = (rules = registry.rule_versions) => compareRuleContexts(rules, aacr, rda);

describe("context-aware comparison foundation", () => {
  it("pairs the documented AACR2/RDA aspect without declaring a conflict", () => {
    const result = compare();
    expect(result.comparisons).toHaveLength(19);
    expect(result.comparisons.filter((item) => item.status === "same_recorded_requirement")).toHaveLength(18);
    const item = result.comparisons.find((item) => item.key === "mods.descriptive-origin.event-type")!;
    expect(item.status).toBe("different_context");
    expect(item.left[0]?.rule_id).toBe("NDK-MONO-MODS-SINGLE-ORIGIN-AACR-NO-EVENT-TYPE");
    expect(item.right[0]?.rule_id).toBe(original.rule_id);
    expect(item.changes.some((change) => change.field === "obligation")).toBe(true);
    for (const rule of [...item.left, ...item.right]) {
      expect(rule.source).toMatchObject({ document: "DMF Monografie", version: "2.3", page: "51–52" });
      expect(rule.condition).toBeDefined();
    }
    expect(result.unresolved_context.left).toHaveLength(0);
    expect(result.unresolved_context.right).toHaveLength(0);
    expect(result.unmapped.left).toHaveLength(230);
    expect(result.unmapped.right).toHaveLength(236);
    expect(result.unmapped.right.map((rule) => rule.rule_id)).toContain("NDK-MONO-MODS-SINGLE-ORIGIN-PRIMARY-EVENT");
  });

  it("does not guess AACR2 from absent data or collapse competing variants", () => {
    const result = compareRuleContexts(registry.rule_versions, { national_standard: "ndk-monograph", version: "2.3" }, rda);
    const item = result.comparisons.find((item) => item.key === "mods.descriptive-origin.event-type")!;
    expect(item.status).toBe("ambiguous_mapping");
    expect(item.left).toHaveLength(2);
    expect(cataloguingCondition({ not: { field: "unrelated", operator: "equals", value: true } }, "aacr2")).toBeUndefined();
    expect(cataloguingCondition({ all: [{ field: "cataloguing_rules", operator: "equals", value: "rda" }, { field: "unknown", operator: "exists" }] }, "aacr2")).toBe(false);
    expect(cataloguingCondition({ any: [{ field: "cataloguing_rules", operator: "equals", value: "rda" }, { field: "unknown", operator: "exists" }] }, "aacr2")).toBeUndefined();
    expect(cataloguingCondition({ field: "cataloguing_rules", operator: "in", value: ["aacr2", "rda"] }, "aacr2")).toBe(true);
  });

  it("compares different document DMFs by explicit semantic key, not rule ID or XML name", () => {
    // Synthetic second DMF, never exported as a real published standard.
    const other: ComparableRule = { ...structuredClone(original), rule_id: "TEST-OTHER-ID", national_standard_id: "test-other-dmf", version: "test-1", source: { ...original.source, document: "Synthetic fixture", version: "test-1" } };
    const selection = { national_standard: other.national_standard_id, version: other.version, cataloguing_rules: "rda" as const };
    const result = compareRuleContexts([original, other], rda, selection);
    expect(result.comparisons[0]?.status).toBe("same_recorded_requirement");
    expect(result.comparisons[0]?.right[0]?.source.document).toBe("Synthetic fixture");
    other.requirement = { ...other.requirement, cardinality: { min: 0, max: 1 } };
    expect(compareRuleContexts([original, other], rda, selection).comparisons[0]?.status).toBe("difference_for_review");
    other.condition = { field: "bibliographic_level", operator: "equals", value: "periodical_issue" };
    expect(compareRuleContexts([original, other], rda, selection).comparisons[0]?.status).toBe("different_context");
    delete other.comparison;
    const absent = compareRuleContexts([original, other], rda, selection);
    expect(absent.comparisons[0]?.status).toBe("no_counterpart");
    expect(absent.unmapped.right).toEqual([other]);
    expect(absent.notice).toContain("neznamená, že DMF údaj neupravuje, dovoluje nebo zakazuje");
  });

  it("does not certify disputed requirements even when their recorded content matches", () => {
    const unverified = { ...original, verification: { ...original.verification, status: "unverified" as const } };
    expect(compareRuleContexts([unverified], rda, rda).comparisons[0]?.status).toBe("unverified");
    expect(compareRuleContexts([{ ...original, status: "disputed" }], rda, rda).comparisons[0]?.status).toBe("unverified");
  });

  it("documents all six scoped non-use rules, keeping an inferred restriction distinct", () => {
    const rules = registry.rule_versions.filter((rule) => rule.obligation === "forbidden");
    expect(rules).toHaveLength(6);
    expect(rules.every((rule) => rule.non_use?.note.cs && rule.condition && rule.requirement.presence === "forbidden")).toBe(true);
    expect(rules.filter((rule) => rule.non_use?.basis === "interpretation").map((rule) => rule.rule_id)).toEqual(["NDK-MONO-MODS-SINGLE-ORIGIN-AACR-NO-EVENT-TYPE"]);
    expect(obligationLabel({ obligation: "forbidden" })).toBe("V daném kontextu se nepoužívá");
    const examples = rules.flatMap((rule) => rule.examples ?? []);
    expect(examples.some((example) => example.note.cs?.includes("uvádí aacr;"))).toBe(true);
    expect(examples.every((example) => !example.code.includes("aacr2"))).toBe(true);
  });

  it("rejects invented prohibitions, legacy context values and contradictory cataloguing declarations", async () => {
    const cloned = structuredClone(documents);
    const doc = cloned.find((item) => item.id === "NDK-MONO-MODS-SINGLE-ORIGIN-AACR-NO-EVENT-TYPE") as RuleDocument;
    const version = doc.versions[0]!;
    delete version.non_use;
    expect(await validateRegistry(root, cloned)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("must document non_use") }));
    version.non_use = { basis: "interpretation", note: { cs: "Test" } };
    version.cataloguing_rules = ["rda"];
    expect(await validateRegistry(root, cloned)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("contradicts condition") }));
    version.cataloguing_rules = ["aacr2"];
    version.condition = { field: "cataloguing_rules", operator: "equals", value: "aacr" };
    expect(await validateRegistry(root, cloned)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("canonical aacr2") }));
    version.condition = { field: "cataloguing_rules", operator: "equals", value: "aacr2" };
    delete version.cataloguing_rules;
    expect(await validateRegistry(root, cloned)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("must declare audited") }));
  });

  it("serves real D1-derived comparisons and validates the full OpenAPI response", async () => {
    const database = new DatabaseSync(":memory:");
    try {
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
      const base = new URL("https://registry.test/api/v1/compare/contexts");
      base.search = new URLSearchParams({ national_standard_a: "ndk-monograph", version_a: "2.3", cataloguing_a: "aacr2", national_standard_b: "ndk-monograph", version_b: "2.3", cataloguing_b: "rda" }).toString();
      const response = await handleRequest(new Request(base), env);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(JSON.parse(JSON.stringify(compare())));
      const ajv = new Ajv2020({ strict: false, allErrors: true });
      addFormats(ajv);
      ajv.addSchema({ $id: "https://registry.test/contract", components: openApiDocument.components });
      const validate = ajv.compile({ $ref: "https://registry.test/contract#/components/schemas/ContextComparison" });
      expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
      const crossUrl = new URL(base);
      crossUrl.searchParams.set("national_standard_b", "ndk-periodical");
      crossUrl.searchParams.set("version_b", "2.2");
      const crossResponse = await handleRequest(new Request(crossUrl), env);
      expect(crossResponse.status).toBe(200);
      const crossData = await crossResponse.json();
      expect(crossData).toEqual(JSON.parse(JSON.stringify(compareRuleContexts(registry.rule_versions, aacr, { national_standard: "ndk-periodical", version: "2.2", cataloguing_rules: "rda" }))));
      expect(validate(crossData), JSON.stringify(validate.errors)).toBe(true);
      crossUrl.searchParams.set("version_b", "2.3");
      expect((await handleRequest(new Request(crossUrl), env)).status).toBe(404);
      for (const [key, value, status] of [["cataloguing_b", "aacr", 400], ["version_b", "missing", 404], ["national_standard_b", "missing", 404], ["version_a", "", 400]] as const) {
        const url = new URL(base);
        url.searchParams.set(key, value);
        expect((await handleRequest(new Request(url), env)).status).toBe(status);
      }
    } finally { database.close(); }
  });
});
