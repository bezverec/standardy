import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalize,
  compileRegistry,
  diffFields,
  loadRegistry,
  registryImportSql,
  semanticNationalStandardDiff,
  validateRegistry,
} from "../packages/registry-core/src/index.ts";

const root = path.resolve(import.meta.dirname, "..");

describe("registry vertical slice", () => {
  it("validates all YAML and resolves every relation", async () => {
    const documents = await loadRegistry(root);
    expect(await validateRegistry(root, documents)).toEqual([]);
  });

  it("compiles the MIX ICC profile group to NDK rules and an implementation graph", async () => {
    const registry = compileRegistry(await loadRegistry(root));
    expect(registry.standard_entities.map((entity) => entity.id)).toEqual(expect.arrayContaining([
      "MIX-ICC-PROFILE-NAME",
      "MIX-ICC-PROFILE-VERSION",
      "MIX-ICC-PROFILE-URI",
      "ICC-PROFILE-HEADER-VERSION",
    ]));
    expect(registry.rule_versions.find((item) => item.rule_id === "NDK-MONO-MIX-ICC-PROFILE-VERSION")).toMatchObject({
      rule_id: "NDK-MONO-MIX-ICC-PROFILE-VERSION",
      national_standard_id: "ndk-monograph",
      version: "2.3",
      target: { entity: "MIX-ICC-PROFILE-VERSION" },
      verification: { status: "verified" },
    });
    expect(registry.relations.map((edge) => edge.type)).toEqual(expect.arrayContaining(["defined_by", "restricts", "clarifies", "generated_by", "validated_by"]));
  });

  it("keeps name, version and URI as distinct ICC profile requirements", async () => {
    const registry = compileRegistry(await loadRegistry(root));
    const rules = Object.fromEntries(registry.rule_versions.map((rule) => [rule.rule_id, rule]));

    expect(Object.keys(rules)).toEqual(expect.arrayContaining([
      "NDK-MONO-MIX-ICC-PROFILE-NAME",
      "NDK-MONO-MIX-ICC-PROFILE-VERSION",
      "NDK-MONO-MIX-ICC-PROFILE-URI",
    ]));
    expect(rules["NDK-MONO-MIX-ICC-PROFILE-NAME"]).toMatchObject({
      severity: "error",
      requirement: { presence: "conditional", cardinality: { min: 1, max: 1 } },
    });
    expect(rules["NDK-MONO-MIX-ICC-PROFILE-URI"]).toMatchObject({
      severity: "warning",
      requirement: { presence: "optional", cardinality: { min: 0, max: 1 } },
    });

    const uriValidation = rules["NDK-MONO-MIX-ICC-PROFILE-URI"]?.requirement.validation as { expression: string };
    const uriPattern = new RegExp(uriValidation.expression);
    for (const value of ["https://www.color.org/sRGB2014.icc", "urn:example:icc:profile:1"]) expect(uriPattern.test(value)).toBe(true);
    for (const value of ["sRGB IEC61966-2.1", "relative/profile.icc", "https://example.org/a profile.icc"]) expect(uriPattern.test(value)).toBe(false);

    const groupEdges = registry.relations.filter((edge) => edge.type === "related_to" && edge.from.startsWith("NDK-MONO-MIX-ICC-PROFILE-"));
    expect(groupEdges.map((edge) => `${edge.from}->${edge.to}`)).toEqual(expect.arrayContaining([
      "NDK-MONO-MIX-ICC-PROFILE-NAME->NDK-MONO-MIX-ICC-PROFILE-VERSION",
      "NDK-MONO-MIX-ICC-PROFILE-VERSION->NDK-MONO-MIX-ICC-PROFILE-URI",
      "NDK-MONO-MIX-ICC-PROFILE-URI->NDK-MONO-MIX-ICC-PROFILE-NAME",
    ]));
  });

  it("emits deterministic canonical JSON and idempotent D1-compatible replacement SQL", async () => {
    const documents = await loadRegistry(root);
    const first = JSON.stringify(canonicalize(compileRegistry(documents)));
    const second = JSON.stringify(canonicalize(compileRegistry(documents)));
    expect(first).toBe(second);
    const sql = registryImportSql(compileRegistry(documents));
    expect(sql).toContain("DELETE FROM rule_versions;");
    expect(sql).toContain("DELETE FROM national_standards;");
    expect(sql).toContain("national_standard_id");
    expect(sql).not.toContain("profiles");
    expect(sql).not.toContain("BEGIN TRANSACTION;");
    expect(sql).not.toContain("COMMIT;");
  });

  it("accepts numeric ICC format versions and rejects profile names", async () => {
    const registry = compileRegistry(await loadRegistry(root));
    const rule = registry.rule_versions.find((item) => item.rule_id === "NDK-MONO-MIX-ICC-PROFILE-VERSION");
    const validations = rule?.requirement.validations as Array<{ type: string; expression: string }>;
    const expression = validations.find((item) => item.type === "regex")?.expression;
    expect(expression).toBeDefined();
    const pattern = new RegExp(expression!);
    for (const value of ["2", "2.4", "2.4.0", "4", "4.3", "4.4.0.0"]) expect(pattern.test(value)).toBe(true);
    for (const value of ["sRGB", "Adobe RGB", "sRGB IEC61966-2.1"]) expect(pattern.test(value)).toBe(false);
    expect(rule?.discrepancies).toHaveLength(2);
    expect(rule?.references).toHaveLength(3);
  });
});

describe("semantic diff", () => {
  it("reports field-level changes", () => {
    expect(diffFields({ requirement: { cardinality: { min: 0 } } }, { requirement: { cardinality: { min: 1 } } })).toEqual([
      { field: "requirement.cardinality.min", old: 0, new: 1 },
    ]);
  });

  it("separates added, removed and changed rules", () => {
    const base: any = { national_standard_id: "p", status: "draft", target: { entity: "E" }, relation_to_target: { type: "restricts" }, category: "metadata", severity: "error", normative_requirement: { cs: "x" }, requirement: {}, source: {}, verification: {} };
    const result = semanticNationalStandardDiff([
      { ...base, rule_id: "A", version: "1", requirement: { presence: "optional" } },
      { ...base, rule_id: "A", version: "2", requirement: { presence: "required" } },
      { ...base, rule_id: "B", version: "1" },
      { ...base, rule_id: "C", version: "2" },
    ], "p", "1", "2");
    expect(result.added).toEqual(["C"]);
    expect(result.removed).toEqual(["B"]);
    expect(result.changed[0]?.changes).toContainEqual({ field: "requirement.presence", old: "optional", new: "required" });
  });
});
