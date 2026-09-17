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

  it("compiles MIX to an NDK rule and implementation graph", async () => {
    const registry = compileRegistry(await loadRegistry(root));
    expect(registry.standard_entities.map((entity) => entity.id)).toEqual(expect.arrayContaining(["MIX-ICC-PROFILE-VERSION", "ICC-PROFILE-HEADER-VERSION"]));
    expect(registry.rule_versions[0]).toMatchObject({
      rule_id: "NDK-MONO-MIX-ICC-PROFILE-VERSION",
      national_standard_id: "ndk-monograph",
      version: "2.3",
      target: { entity: "MIX-ICC-PROFILE-VERSION" },
      verification: { status: "verified" },
    });
    expect(registry.relations.map((edge) => edge.type)).toEqual(expect.arrayContaining(["defined_by", "restricts", "clarifies", "generated_by", "validated_by"]));
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
