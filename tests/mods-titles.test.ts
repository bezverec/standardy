import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-titles");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-${suffix}`)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const titleInfo = [...base, eq("element_role", "mods_titleinfo")];
const check = (suffix: string, text: string) => expect(rule(suffix).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(text) }));

describe("MODS titles of a single-volume monograph, DMF 2.3", () => {
  it("classifies eight rules under MODS even when linked to METS wrappers", () => {
    expect(rules).toHaveLength(8);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { document: "DMF Monografie", version: "2.3" } });
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(item.implementations).toBeUndefined();
      expect(item.validator_behaviour).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("keeps the single-volume bibliographic level separate from pages and multivolumes", () => {
    expect(rule("TITLEINFO").condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
    for (const item of rules) expect(item.condition).toEqual(expect.objectContaining({ all: expect.arrayContaining(base) }));
    check("TITLEINFO", "relatedItem nebo subject");
    expect(rule("TITLEINFO").interpretation?.cs).toContain("nikoli pro titul vícesvazku");
    expect(rule("TITLEINFO").requirement.cardinality).toEqual({ min: 1, max: null });
  });
  it("preserves two M, four MA, one O and the independent prose prohibition", () => {
    expect(rules.filter((item) => item.obligation_code === "M")).toHaveLength(2);
    expect(rules.filter((item) => item.obligation_code === "MA")).toHaveLength(4);
    expect(rules.filter((item) => item.obligation_code === "O")).toHaveLength(1);
    expect(rule("MAIN-NO-TYPE")).toMatchObject({ obligation: "forbidden", obligation_source: "prose", requirement: { presence: "forbidden", cardinality: { min: 0, max: 0 } } });
    expect(rule("MAIN-NO-TYPE").obligation_code).toBeUndefined();
    for (const item of rules.filter((item) => item.obligation_code === "MA")) expect(item.obligation).toBe("mandatory_if_available");
  });
  it("requires absence of type for main titles without inferring the role from that absence", () => {
    expect(rule("MAIN-NO-TYPE").condition).toEqual({ all: [...titleInfo, eq("title_role", "main")] });
    check("MAIN-NO-TYPE", "prázdný atribut ani hodnotu primary");
    expect(rule("MAIN-NO-TYPE").interpretation?.cs).toContain("nikoli právě podle nepřítomnosti type");
  });
  it("constrains additional title types while preserving the semantics of their sources", () => {
    expect(rule("TYPE").condition).toEqual({ all: [...titleInfo, eq("title_role", "additional"), eq("title_type_available", true)] });
    expect(rule("TYPE").requirement.allowed_values).toEqual(["abbreviated", "alternative", "translated", "uniform"]);
    expect(rule("TYPE").requirement.cardinality).toEqual({ min: 1, max: 1 });
    for (const field of ["210", "246", "242", "130", "240"]) check("TYPE", field);
    check("TYPE", "věcnou shodu");
  });
  it("retains optional nonSort and its significant whitespace exception", () => {
    expect(rule("NONSORT")).toMatchObject({ obligation: "optional", obligation_code: "O", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
    expect(rule("NONSORT").condition).toEqual({ all: titleInfo });
    check("NONSORT", "přiléhajícího členu ji nevkládat");
    check("NONSORT", "při hodnotě 0 se nonSort nepoužije");
    check("NONSORT", "plošné trimování");
    expect(rule("NONSORT").requirement.allowed_values).toBeUndefined();
  });
  it("uses independent source availability for subtitle, part number and part name", () => {
    for (const [suffix, field] of [["SUBTITLE", "subtitle_available"], ["PARTNUMBER", "title_part_number_available"], ["PARTNAME", "title_part_name_available"]]) {
      expect(rule(suffix!).condition).toEqual({ all: [...titleInfo, eq(field!, true)] });
      expect(rule(suffix!).requirement.cardinality).toEqual({ min: 1, max: null });
      expect(rule(suffix!).interpretation?.cs).toContain("neznámá dostupnost se nesmí zaměnit za false");
    }
    check("PARTNAME", "Nepodmiňovat přítomnost partName existencí partNumber");
    check("PARTNUMBER", "pořadí skenu");
    expect(rule("TITLE").requirement.cardinality).toEqual({ min: 1, max: null });
    check("TITLE", "prázdný title");
  });
  it("defines seven MODS 3.8 entities without putting type in the MODS namespace", () => {
    const ids = new Set(rules.map((item) => item.target.entity));
    expect(ids.size).toBe(7);
    for (const id of ids) {
      const entity = registry.standard_entities.find((item) => item.id === id)!;
      expect(entity).toMatchObject({ version: "3.8", status: "normative" });
      if (entity.type === "attribute") expect(entity.namespace).toBeUndefined();
      else expect(entity.namespace).toBe("http://www.loc.gov/mods/v3");
    }
  });
  it("ships three real main-title excerpts and no invented examples of absent fields", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(3);
    for (const suffix of ["TITLEINFO", "MAIN-NO-TYPE", "TITLE"]) {
      const example = rule(suffix).examples![0]!;
      expect(example.kind).toBe("source_excerpt");
      expect(example.code).toContain("Tomáš Alva Edison a jeho fonograf");
      expect(example.code).not.toContain(" type=");
      expect(example.source_xpath).toContain('mets:dmdSec[@ID="MODSMD_VOLUME_0001"]');
      expect(example.file_sha256).toBe("7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473");
    }
    for (const suffix of ["TYPE", "NONSORT", "SUBTITLE", "PARTNUMBER", "PARTNAME"]) expect(rule(suffix).examples).toBeUndefined();
  });
  it("links the new group to payload and version rules without duplicating them", () => {
    for (const suffix of ["XMLDATA", "MODS-VERSION"]) expect(registry.relations).toContainEqual(expect.objectContaining({ from: "NDK-MONO-MODS-SINGLE-TITLEINFO", to: `NDK-MONO-METS-DMD-${suffix}`, type: "related_to" }));
  });
});
