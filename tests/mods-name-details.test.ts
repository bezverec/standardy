import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-name-details");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-${suffix}`)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const person = [...base, eq("element_role", "mods_contributor_name"), eq("contributor_kind", "personal")];

describe("MODS name details of a single-volume monograph, DMF 2.3", () => {
  it("classifies nine version-pinned rules under MODS", () => {
    expect(rules).toHaveLength(9);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { document: "DMF Monografie", version: "2.3", page: 50 } });
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(item.condition).toEqual(expect.objectContaining({ all: expect.arrayContaining(base) }));
      expect(item.implementations).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("preserves three MA, two RA, two O, one M and a prose prohibition", () => {
    for (const [code, count] of [["MA", 3], ["RA", 2], ["O", 2], ["M", 1]] as const) expect(rules.filter((item) => item.obligation_code === code)).toHaveLength(count);
    expect(rule("NAME-PART-NO-TYPE")).toMatchObject({ obligation: "forbidden", obligation_source: "prose", requirement: { presence: "forbidden", cardinality: { min: 0, max: 0 } } });
    expect(rule("NAME-PART-NO-TYPE").obligation_code).toBeUndefined();
  });
  it("uses semantic part types, not the attribute being checked, to require type", () => {
    expect(rule("NAME-PART-TYPE").condition).toEqual({ all: [...base, eq("element_role", "mods_contributor_name_part"), eq("contributor_kind", "personal"), { field: "name_part_kind", operator: "in", value: ["date", "family", "given", "termsOfAddress"] }] });
    expect(rule("NAME-PART-TYPE").requirement.allowed_values).toEqual(["date", "family", "given", "termsOfAddress"]);
    expect(rule("NAME-PART-TYPE").requirement.cardinality).toEqual({ min: 1, max: 1 });
  });
  it("requires distinguishable available family and given names separately", () => {
    for (const [suffix, field, part] of [["NAME-PART-FAMILY", "family_name_available", "family"], ["NAME-PART-GIVEN", "given_name_available", "given"]]) {
      expect(rule(suffix!).condition).toEqual({ all: [...person, eq("name_components_distinguishable", true), eq(field!, true)] });
      expect(rule(suffix!).requirement.cardinality).toEqual({ min: 1, max: null });
      expect(rule(suffix!).requirement.allowed_values).toBeUndefined();
      expect(rule(suffix!).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(`namePart[@type='${part}']`) }));
    }
    expect(rule("NAME-PART-GIVEN").interpretation?.cs).toContain("nevytváří maximum jednoho výskytu");
  });
  it("keeps dates and titles recommended when available rather than mandatory", () => {
    for (const [suffix, field] of [["NAME-PART-DATE", "biographical_dates_available"], ["NAME-PART-ADDRESS", "name_title_available"]]) {
      expect(rule(suffix!)).toMatchObject({ obligation: "recommended_if_available", obligation_code: "RA", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
      expect(rule(suffix!).condition).toEqual({ all: [...person, eq(field!, true)] });
    }
    expect(rule("NAME-PART-DATE").interpretation?.cs).toContain("nepředepisuje ISO 8601");
    expect(rule("NAME-PART-ADDRESS").interpretation?.cs).toContain("ne poštovní adresu");
  });
  it("does not ban date or title beside an unparsed personal name", () => {
    expect(rule("NAME-PART-NO-TYPE").condition).toEqual({ all: [...base, eq("element_role", "mods_contributor_name_part"), { any: [
      { field: "contributor_kind", operator: "in", value: ["corporate", "conference", "family"] },
      { all: [eq("contributor_kind", "personal"), eq("name_components_distinguishable", false), eq("name_part_kind", "unparsed")] },
    ] }] });
    expect(rule("NAME-PART-NO-TYPE").interpretation?.cs).toContain("neznámá dostupnost není false");
  });
  it("requires namePart inside an optional alternativeName without an availability escape", () => {
    expect(rule("ALTERNATIVE-NAME")).toMatchObject({ obligation_code: "O", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
    expect(rule("ALTERNATIVE-NAME-PART")).toMatchObject({ obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    expect(rule("ALTERNATIVE-NAME-PART").condition).toEqual({ all: [...base, eq("element_role", "mods_contributor_alternative_name")] });
    expect(rule("ALTERNATIVE-NAME").interpretation?.cs).toContain("neodvozujeme povinné altType");
  });
  it("checks etal per top-level name including invalid mixed branches", () => {
    expect(rule("ETAL").condition).toEqual({ all: [...base, eq("element_role", "mods_top_level_name")] });
    expect(rule("ETAL")).toMatchObject({ obligation_code: "O", requirement: { presence: "optional", cardinality: { min: 0, max: 1 } } });
    expect(rule("ETAL").requirement.allowed_values).toBeUndefined();
    for (const text of ["namePart", "nameIdentifier", "alternativeName", "ruční vložení"]) expect(rule("ETAL").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(text) }));
    expect(rule("ETAL").interpretation?.cs).toContain("i chybné kombinace etal");
    expect(rule("ETAL").interpretation?.cs).toContain("MODS dovoluje i prázdné etal");
  });
  it("adds four distinct general entities and reuses the existing namePart entity", () => {
    const ids = new Set(rules.map((item) => item.target.entity));
    expect(ids.size).toBe(5);
    expect(ids.has("MODS-NAME-PART")).toBe(true);
    for (const id of ids) {
      const entity = registry.standard_entities.find((item) => item.id === id)!;
      expect(entity).toMatchObject({ version: "3.8", status: "normative" });
      if (entity.type === "attribute") expect(entity.namespace).toBeUndefined();
      else expect(entity.namespace).toBe("http://www.loc.gov/mods/v3");
    }
  });
  it("does not use subject names or invented excerpts to fill missing source examples", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(0);
    for (const item of rules) expect(item.interpretation?.cs).toContain("nikoli subject/name");
    for (const suffix of ["NAME-PART-TYPE", "NAME-PART-FAMILY", "NAME-PART-GIVEN", "NAME-PART-DATE", "NAME-PART-ADDRESS", "NAME-PART-NO-TYPE"]) expect(registry.relations).toContainEqual(expect.objectContaining({ from: "NDK-MONO-MODS-SINGLE-NAME-PART", to: `NDK-MONO-MODS-SINGLE-${suffix}`, type: "related_to" }));
  });
});
