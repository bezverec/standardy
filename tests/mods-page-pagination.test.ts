import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-page-pagination");
const rule = (suffix: string) => rules.find((item) => item.rule_id === "NDK-MONO-MODS-PAGE-" + suffix)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "page")];
const context = (role: string) => [...base, eq("element_role", role)];

describe("MODS page pagination, DMF Monografie 2.3", () => {
  it("targets the page rather than the volume and keeps all requirements independent of cataloguing", () => {
    expect(rules).toHaveLength(12);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", cataloguing_scope: { applicability: "independent" }, verification: { status: "verified", date: "2026-11-05" } });
      expect(item.condition).toMatchObject({ all: expect.arrayContaining(base) });
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_rules).toBeUndefined();
      expect(item.comparison).toBeUndefined();
      expect(item.implementations).toBeUndefined();
    }
    const selection = { national_standard: "ndk-monograph", version: "2.3", cataloguing_rules: "aacr2" as const };
    const result = compareRuleContexts(rules, selection, { ...selection, cataloguing_rules: "rda" });
    expect(result.unmapped.left).toEqual(result.unmapped.right);
    expect(result.unmapped.left).toHaveLength(12);
    expect(result.unresolved_context).toEqual({ left: [], right: [] });
  });

  it("keeps the R and O parent branches optional despite mandatory descendants", () => {
    expect(rule("NUMBER-PART")).toMatchObject({ obligation_code: "R", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
    expect(rule("INDEX-PART")).toMatchObject({ obligation_code: "O", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
    for (const suffix of ["NUMBER-PART", "INDEX-PART"]) expect(rule(suffix).condition).toEqual({ all: context("mods_record") });
    expect(rule("NUMBER-PART").interpretation?.cs).toContain("nepřepisuje původní kód");
    expect(rule("INDEX-DETAIL")).toMatchObject({ obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    expect(rule("INDEX-DETAIL").condition).toEqual({ all: context("mods_page_index_part") });
  });

  it("does not let missing pagination XML turn off source availability", () => {
    for (const [suffix, role] of [["NUMBER-DETAIL", "mods_page_number_part"], ["NUMBER", "mods_page_number_detail"]]) {
      expect(rule(suffix!)).toMatchObject({ obligation_code: "MA", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
      expect(rule(suffix!).condition).toEqual({ all: [...context(role!), eq("pagination_label_available", true)] });
      expect(JSON.stringify(rule(suffix!).requirement.validations)).toContain("nikoli z existence cílového XML");
    }
    expect(rule("NUMBER-DETAIL").interpretation?.cs).toContain("dopočitatelnou podle PPM");
    expect(rule("INDEX").condition).toEqual({ all: context("mods_page_index_detail") });
  });

  it("distinguishes the page type on part from the two semantic roles of detail/@type", () => {
    const pageType = rule("NUMBER-PART-TYPE");
    expect(pageType.target.entity).toBe("MODS-PART-TYPE");
    expect(pageType.condition).toEqual({ all: context("mods_page_number_part") });
    expect(pageType.requirement.allowed_values).toEqual(expect.arrayContaining(["titlePage", "normalPage", "frontJacket", "map", "sheetMusic"]));
    for (const value of ["chapter", "article", "pageNumber", "pageIndex", "reprePage"]) expect(pageType.requirement.allowed_values).not.toContain(value);
    for (const [suffix, role, value] of [["NUMBER-DETAIL-TYPE", "mods_page_number_detail", "pageNumber"], ["INDEX-DETAIL-TYPE", "mods_page_index_detail", "pageIndex"]]) {
      expect(rule(suffix!)).toMatchObject({ target: { entity: "MODS-PART-DETAIL-TYPE" }, obligation_code: "M", requirement: { cardinality: { min: 1, max: 1 }, allowed_values: [value] } });
      // A missing or wrong @type must not exclude the detail from its own check.
      expect(rule(suffix!).condition).toEqual({ all: context(role!) });
    }
  });

  it("retains textual page labels and does not impose the scan index or an invented numeric regex", () => {
    for (const suffix of ["NUMBER", "INDEX", "EXTENT-START"]) {
      expect(rule(suffix).requirement.allowed_values).toBeUndefined();
      expect(rule(suffix).requirement.validations).not.toEqual(expect.arrayContaining([expect.objectContaining({ type: "regex" })]));
    }
    expect(rule("NUMBER").examples![0]!.code).toContain(">[1]</mods:number>");
    expect(rule("INDEX").examples![0]!.code).toContain(">1</mods:number>");
    expect(rule("NUMBER").interpretation?.cs).toContain("římská čísla");
    expect(rule("INDEX").interpretation?.cs).toContain("ORDER=0");
    const number = registry.standard_entities.find((entity) => entity.id === "MODS-PART-DETAIL-NUMBER")!;
    expect(number.definition?.cs).toContain("xs:string");
  });

  it("requires unit and start only in an existing optional extent, with no availability exemption for M", () => {
    expect(rule("EXTENT")).toMatchObject({ obligation_code: "O", target: { entity: "MODS-PART-EXTENT" }, requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
    expect(rule("EXTENT").condition).toEqual({ all: context("mods_page_number_part") });
    expect(rule("EXTENT-UNIT").requirement.allowed_values).toEqual(["pages"]);
    for (const suffix of ["EXTENT-UNIT", "EXTENT-START"]) {
      expect(rule(suffix)).toMatchObject({ obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: 1 } } });
      expect(rule(suffix).condition).toEqual({ all: context("mods_page_number_extent") });
    }
    expect(rule("EXTENT-START").normative_requirement.cs).toContain("tak, jak je uvedeno v dokumentu");
    expect(rule("EXTENT-START").examples![0]!.note.cs).toContain("nikoli potvrzení");
  });

  it("links pagination and scan order to the appropriate existing METS rules without equating them", () => {
    for (const [suffix, target] of [["NUMBER", "ORDERLABEL"], ["INDEX", "ORDER"]]) {
      expect(registry.relations).toContainEqual(expect.objectContaining({ from: "NDK-MONO-MODS-PAGE-" + suffix, to: "NDK-MONO-METS-PHYSICAL-PAGE-" + target, type: "related_to" }));
    }
    expect(rules.every((item) => !item.comparison)).toBe(true);
  });

  it("uses exact branches from the page sample instead of relabelling volume metadata", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(12);
    for (const item of examples) {
      expect(item).toMatchObject({ kind: "source_excerpt", checked_on: "2026-11-05", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473" });
      expect(item.source_xpath).toContain('mets:dmdSec[@ID="MODSMD_PAGE_0001"]');
    }
    expect(rule("NUMBER-PART").examples![0]!.code).toContain('type="titlePage"');
    expect(rule("INDEX-PART").examples![0]!.code).not.toContain('<mods:part type=');
    expect(rule("INDEX-PART").examples![0]!.source_xpath).toMatch(/mods:part\[2\]$/);
  });
});
