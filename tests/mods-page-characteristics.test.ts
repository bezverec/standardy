import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-page-characteristics");
const rule = (suffix: string) => rules.find((item) => item.rule_id === "NDK-MONO-MODS-PAGE-" + suffix)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const context = (role: string) => [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "page"), eq("element_role", role)];

describe("MODS page identification and characteristics, DMF Monografie 2.3", () => {
  it("scopes independence to the digital page, without extending it to the whole MODS namespace", () => {
    expect(rules).toHaveLength(8);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", cataloguing_scope: { applicability: "independent" }, verification: { status: "verified", date: "2026-11-05" } });
      expect(item.condition).toMatchObject({ all: expect.arrayContaining(context("mods_record").slice(0, 3)) });
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_rules).toBeUndefined();
      expect(item.comparison).toBeUndefined();
      expect(item.implementations).toBeUndefined();
    }
    const selection = { national_standard: "ndk-monograph", version: "2.3", cataloguing_rules: "aacr2" as const };
    const result = compareRuleContexts(rules, selection, { ...selection, cataloguing_rules: "rda" });
    expect(result.unmapped.left).toEqual(result.unmapped.right);
    expect(result.unmapped.left).toHaveLength(8);
    expect(result.unresolved_context).toEqual({ left: [], right: [] });
    const volumePhysical = registry.rule_versions.filter((item) => item.category === "metadata/mods-physical-description");
    expect(volumePhysical.some((item) => item.cataloguing_scope?.applicability === "applicable")).toBe(true);
  });

  it("requires page identifiers and their uuid type without importing a volume URN:NBN or a UUID regex", () => {
    expect(rule("IDENTIFIER")).toMatchObject({ target: { entity: "MODS-IDENTIFIER" }, obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    expect(rule("IDENTIFIER").condition).toEqual({ all: context("mods_record") });
    expect(rule("IDENTIFIER").requirement.allowed_values).toBeUndefined();
    expect(rule("IDENTIFIER").requirement.validations).not.toEqual(expect.arrayContaining([expect.objectContaining({ type: "regex" })]));
    expect(rule("IDENTIFIER-TYPE")).toMatchObject({ target: { entity: "MODS-IDENTIFIER-TYPE" }, obligation_code: "M", requirement: { cardinality: { min: 1, max: 1 }, allowed_values: ["uuid"] } });
    // A missing or wrong @type must not turn off its own check.
    expect(rule("IDENTIFIER-TYPE").condition).toEqual({ all: context("mods_page_identifier") });
  });

  it("separates representative status from page kind and excludes internal-part-only values", () => {
    expect(rule("GENRE")).toMatchObject({ target: { entity: "MODS-GENRE" }, obligation_code: "M", requirement: { allowed_values: ["page", "reprePage"], cardinality: { min: 1, max: null } } });
    expect(rule("GENRE").condition).toEqual({ all: context("mods_record") });
    const type = rule("GENRE-TYPE");
    expect(type.target.entity).toBe("MODS-GENRE-TYPE");
    expect(type.requirement.cardinality).toEqual({ min: 1, max: 1 });
    expect(type.condition).toEqual({ all: context("mods_page_genre") });
    expect(type.requirement.allowed_values).toHaveLength(37);
    expect(type.requirement.allowed_values).toEqual(expect.arrayContaining(["titlePage", "normalPage", "frontJacket", "index", "map", "sheetMusic"]));
    for (const value of ["chapter", "article", "plate", "page", "reprePage", "pageNumber", "text"]) expect(type.requirement.allowed_values).not.toContain(value);
    const entity = registry.standard_entities.find((item) => item.id === "MODS-GENRE-TYPE")!;
    expect(entity.definition?.cs).toContain("nepovinný xs:string");
  });

  it("does not use absent content metadata as the availability condition for MA", () => {
    expect(rule("RESOURCE-TYPE")).toMatchObject({ obligation_code: "MA", requirement: { presence: "required", cardinality: { min: 1, max: null }, allowed_values: ["text", "still image", "notated music", "cartographic"] } });
    expect(rule("RESOURCE-TYPE").condition).toEqual({ all: [...context("mods_record"), eq("page_content_type_available", true)] });
    expect(JSON.stringify(rule("RESOURCE-TYPE").requirement.validations)).toContain("nikoli z existence cílového XML");
    expect(rule("RESOURCE-TYPE").interpretation?.cs).toContain("ne formát obrazového souboru");
  });

  it("keeps side notes distinct from free-text physical notes in an optional parent", () => {
    expect(rule("SIDE-NOTE")).toMatchObject({ target: { entity: "MODS-NOTE" }, obligation_code: "O", requirement: { allowed_values: ["right", "left", "singlePage"], cardinality: { min: 0, max: null } } });
    expect(rule("SIDE-NOTE").condition).toEqual({ all: context("mods_record") });
    expect(rule("SIDE-NOTE").normative_requirement.cs).toContain("spojením více snímků");
    for (const suffix of ["PHYSICAL-DESCRIPTION", "PHYSICAL-NOTE"]) {
      expect(rule(suffix)).toMatchObject({ obligation_code: "O", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
      expect(rule(suffix).requirement.allowed_values).toBeUndefined();
    }
    expect(rule("PHYSICAL-DESCRIPTION").condition).toEqual({ all: context("mods_record") });
    expect(rule("PHYSICAL-NOTE").condition).toEqual({ all: context("mods_page_physical_description") });
    expect(rule("PHYSICAL-NOTE").target.entity).toBe("MODS-PHYSICAL-NOTE");
    expect(rule("PHYSICAL-NOTE").normative_requirement.cs).toContain("Každá poznámka");
  });

  it("links page kind to pagination and METS without claiming rule equivalence", () => {
    for (const target of ["NDK-MONO-MODS-PAGE-NUMBER-PART-TYPE", "NDK-MONO-METS-PHYSICAL-PAGE-TYPE"]) {
      expect(registry.relations).toContainEqual(expect.objectContaining({ from: "NDK-MONO-MODS-PAGE-GENRE-TYPE", to: target, type: "related_to" }));
    }
    expect(rule("GENRE-TYPE").references).toContainEqual(expect.objectContaining({ version: "2.4", page: "8, 14" }));
    expect(rule("GENRE-TYPE").comparison).toBeUndefined();
  });

  it("retains representative/ordinary and right/left observations from two different source pages", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(9);
    for (const item of examples) {
      expect(item).toMatchObject({ kind: "source_excerpt", checked_on: "2026-11-05", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473" });
      expect(item.source_xpath).toMatch(/MODSMD_PAGE_000[14]/);
    }
    const genres = rule("GENRE").examples!;
    expect(genres[0]!.code).toContain('type="titlePage">reprePage</mods:genre>');
    expect(genres[1]!.code).toContain('type="normalPage">page</mods:genre>');
    expect(rule("SIDE-NOTE").examples![0]!.code).toContain(">right</mods:note>");
    expect(rule("SIDE-NOTE").examples![1]!.code).toContain(">left</mods:note>");
  });

  it("does not fabricate physical-state or singlePage source evidence", () => {
    expect(rule("PHYSICAL-DESCRIPTION").examples).toBeUndefined();
    expect(rule("PHYSICAL-NOTE").examples).toBeUndefined();
    expect(rule("SIDE-NOTE").examples!.some((item) => item.code.includes(">singlePage<"))).toBe(false);
    expect(rule("PHYSICAL-DESCRIPTION").interpretation?.cs).toContain("neprokazuje jejich nepoškozený stav");
  });
});
