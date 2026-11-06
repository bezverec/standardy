import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const pageTitles = registry.rule_versions.filter((rule) => rule.category === "metadata/mods-page-titles");
const rule = (suffix: string) => pageTitles.find((item) => item.rule_id === "NDK-MONO-MODS-PAGE-" + suffix)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const context = (parent: string) => [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "page"), eq("element_role", parent)];

describe("MODS titles on an individual monograph page", () => {
  it("uses the same title entity for opposite source conditions without upgrading RA to mandatory", () => {
    const title = rule("TITLE"), absent = rule("TITLE-ABSENT");
    expect(title.target.entity).toBe("MODS-TITLE");
    expect(absent.target.entity).toBe(title.target.entity);
    expect(title).toMatchObject({ obligation_code: "RA", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
    expect(absent).toMatchObject({ obligation_source: "prose", non_use: { basis: "explicit" }, requirement: { presence: "forbidden", cardinality: { min: 0, max: 0 } } });
    expect(absent.obligation_code).toBeUndefined();
    // An unknown source fact must not select the negative branch merely because title is missing.
    expect(title.condition).toEqual({ all: [...context("mods_page_titleinfo"), eq("page_heading_available", true)] });
    expect(absent.condition).toEqual({ all: [...context("mods_page_titleinfo"), eq("page_heading_available", false)] });
  });

  it("assesses the container and subtitle independently and preserves the joining space in optional nonSort", () => {
    expect(rule("TITLEINFO").condition).toEqual({ all: [...context("mods_record"), eq("page_title_information_available", true)] });
    expect(rule("SUBTITLE").condition).toEqual({ all: [...context("mods_page_titleinfo"), eq("page_subtitle_available", true)] });
    const nonSort = rule("NONSORT");
    expect(nonSort.condition).toEqual({ all: context("mods_page_titleinfo") });
    expect(nonSort.obligation_code).toBe("O");
    expect(nonSort.normative_requirement.cs).toContain("na konci hodnoty");
    expect(nonSort.normative_requirement.cs).toContain("U přiléhajícího členu se mezera nevkládá");
  });

  it("documents the shared descriptive prescription without borrowing volume evidence or pairing with periodicals", () => {
    for (const item of pageTitles) {
      expect(item).toMatchObject({ version: "2.3", source: { page: 72 }, cataloguing_rules: ["aacr2", "rda"], cataloguing_scope: { applicability: "applicable" } });
      expect(item.cataloguing_scope?.sources.map((source) => source.page)).toEqual([72, 24]);
      expect(item.examples).toBeUndefined();
      expect(item.comparison).toBeUndefined();
    }
  });
});
