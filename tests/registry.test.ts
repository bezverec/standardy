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

  it("excludes the retired demo national standard from compiled data", async () => {
    const registry = compileRegistry(await loadRegistry(root));
    expect(registry.national_standards.map((standard) => standard.id)).not.toContain("ndk-base");
    expect(registry.rule_versions.some((rule) => rule.national_standard_id === "ndk-base")).toBe(false);
    expect(registry.relations.some((edge) => edge.from === "ndk-base" || edge.to === "ndk-base")).toBe(false);
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
    expect(registry.relations.map((edge) => edge.type)).toEqual(expect.arrayContaining(["defined_by", "restricts", "related_to", "generated_by", "validated_by"]));
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
      obligation: "mandatory",
      requirement: { presence: "conditional", cardinality: { min: 1, max: 1 } },
    });
    expect(rules["NDK-MONO-MIX-ICC-PROFILE-URI"]).toMatchObject({
      obligation: "recommended",
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

  it("requires the ICC version element without asserting disputed numeric MIX semantics", async () => {
    const registry = compileRegistry(await loadRegistry(root));
    const rule = registry.rule_versions.find((item) => item.rule_id === "NDK-MONO-MIX-ICC-PROFILE-VERSION");
    expect(rule).toMatchObject({
      status: "disputed",
      requirement: {
        cardinality: { min: 1, max: 1 },
        validations: [{ type: "xpath", expression: "//mix:IccProfile/mix:iccProfileVersion", assertion: "exists" }],
      },
    });
    expect(rule?.requirement.validations).toHaveLength(1);
    expect(rule?.requirement.validation).toBeUndefined();
    expect(rule?.interpretation?.cs).toContain("properties/jp2HeaderBox/colourSpecificationBox/icc/profileVersion");
    expect(rule?.verification.reference).toContain("zde nebyl znovu spuštěn");
    expect(rule?.references).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: "https://github.com/NLCR/Standard_NDK/issues/255" }),
    ]));
    expect(registry.relations).toContainEqual(expect.objectContaining({
      from: "NDK-MONO-MIX-ICC-PROFILE-VERSION", to: "ICC-PROFILE-HEADER-VERSION", type: "related_to",
    }));
    expect(registry.relations).not.toContainEqual(expect.objectContaining({
      from: "NDK-MONO-MIX-ICC-PROFILE-VERSION", to: "ICC-PROFILE-HEADER-VERSION", type: "equivalent_to",
    }));
  });

  it("keeps version-scoped ICC implementations separate in the rule and graph", async () => {
    const registry = compileRegistry(await loadRegistry(root));
    const rule = registry.rule_versions.find((item) => item.rule_id === "NDK-MONO-MIX-ICC-PROFILE-VERSION")!;
    expect(rule.implementations?.map((item) => item.id).sort()).toEqual(["JHOVE", "JPYLYZER", "KOMPLEXNI-VALIDATOR", "PROARC"]);
    for (const id of ["JHOVE", "JPYLYZER", "PROARC"]) {
      expect(rule.implementations).toContainEqual(expect.objectContaining({ id, role: "generator", status: "partial", verification: "verified", behaviour: { cs: expect.any(String) } }));
      expect(registry.relations).toContainEqual(expect.objectContaining({ from: rule.rule_id, to: id, type: "generated_by", rule_version: "2.3" }));
    }
    expect(rule.implementations).toContainEqual(expect.objectContaining({ id: "KOMPLEXNI-VALIDATOR", role: "validator", status: "implemented", verification: "verified" }));
    expect(registry.relations).toContainEqual(expect.objectContaining({ from: rule.rule_id, to: "KOMPLEXNI-VALIDATOR", type: "validated_by", rule_version: "2.3" }));
    expect(rule.implementations?.every((item) => Boolean(item.notes?.cs))).toBe(true);
  });
});

describe("semantic diff", () => {
  it("reports field-level changes", () => {
    expect(diffFields({ requirement: { cardinality: { min: 0 } } }, { requirement: { cardinality: { min: 1 } } })).toEqual([
      { field: "requirement.cardinality.min", old: 0, new: 1 },
    ]);
  });

  it("separates added, removed and changed rules", () => {
    const base: any = { national_standard_id: "p", status: "draft", target: { entity: "E" }, relation_to_target: { type: "restricts" }, category: "metadata", obligation: "mandatory", normative_requirement: { cs: "x" }, requirement: {}, source: {}, verification: {} };
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
