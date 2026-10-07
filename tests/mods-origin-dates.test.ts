import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-origin-dates");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-${suffix}`)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const check = (suffix: string, text: string) => expect(rule(suffix).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(text) }));

describe("MODS issue and other dates of a single-volume monograph, DMF 2.3", () => {
  it("pins seven rules to DMF 2.3 and MODS 3.8 without claiming a validator implementation", () => {
    expect(rules).toHaveLength(7);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { document: "DMF Monografie", version: "2.3", page: 53 } });
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(item.implementations).toBeUndefined();
      expect(item.validator_behaviour).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
      expect(item.interpretation?.cs).toContain("neznámá hodnota není false");
    }
  });
  it("preserves two M, one MA, three R and one O", () => {
    for (const [code, count] of [["M", 2], ["MA", 1], ["R", 3], ["O", 1]] as const) expect(rules.filter((item) => item.obligation_code === code)).toHaveLength(count);
    for (const item of rules.filter((item) => ["R", "O"].includes(item.obligation_code!))) expect(item.requirement).toMatchObject({ presence: "optional", cardinality: { min: 0 } });
    for (const item of rules.filter((item) => ["M", "MA"].includes(item.obligation_code!))) expect(item.requirement).toMatchObject({ presence: "required", cardinality: { min: 1 } });
  });
  it("checks mandatory issue dates at record level and limits their source", () => {
    expect(rule("DATE-ISSUED").condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
    expect(rule("DATE-ISSUED").requirement.cardinality).toEqual({ min: 1, max: null });
    check("DATE-ISSUED", "260$c, 264_1$c");
    check("DATE-ISSUED", "Nepřesouvat sem datum výroby");
    expect(rule("DATE-ISSUED").interpretation?.cs).toContain("Neznamená kopírovat datum vydání do každého originInfo");
    expect(rule("DATE-ISSUED").interpretation?.cs).toContain("nikoli xs:date");
    expect(rule("DATE-ISSUED").requirement.pattern).toBeUndefined();
  });
  it("keeps MARC encoding a contextual recommendation, not a four-digit requirement", () => {
    expect(rule("DATE-ISSUED-ENCODING").condition).toEqual({ all: [...base, eq("element_role", "mods_date_issued"), eq("origin_date_source", "marc_008")] });
    expect(rule("DATE-ISSUED-ENCODING").requirement.allowed_values).toEqual(["marc"]);
    expect(rule("DATE-ISSUED-ENCODING").requirement.cardinality).toEqual({ min: 0, max: 1 });
    expect(rule("DATE-ISSUED-ENCODING").interpretation?.cs).toContain("R se nemění na M ani RA");
    expect(rule("DATE-ISSUED-ENCODING").interpretation?.cs).toContain("Nezavádí čtyřciferný regex");
  });
  it("requires point only for a source-established range and checks the pair semantically", () => {
    expect(rule("DATE-ISSUED-POINT").condition).toEqual({ all: [...base, eq("element_role", "mods_date_issued"), eq("origin_date_source", "marc_008"), eq("origin_date_range_available", true)] });
    expect(rule("DATE-ISSUED-POINT").requirement.allowed_values).toEqual(["start", "end"]);
    expect(rule("DATE-ISSUED-POINT").requirement.cardinality).toEqual({ min: 1, max: 1 });
    check("DATE-ISSUED-POINT", "dvě hodnoty start nejsou pár start/end");
    check("DATE-ISSUED-POINT", "008/06=t");
    check("DATE-ISSUED-POINT", "při r o reedici");
    check("DATE-ISSUED-POINT", "při e může druhá část obsahovat měsíc a den");
    check("DATE-ISSUED", "zachovat obě jeho meze");
  });
  it("does not infer a specific qualifier just from square brackets", () => {
    expect(rule("DATE-ISSUED-QUALIFIER").requirement.allowed_values).toEqual(["approximate", "inferred", "questionable"]);
    expect(rule("DATE-ISSUED-QUALIFIER").requirement.cardinality).toEqual({ min: 0, max: 1 });
    check("DATE-ISSUED-QUALIFIER", "neodvozovat automaticky inferred jen z hranatých závorek");
    expect(rule("DATE-ISSUED-QUALIFIER").interpretation?.cs).toContain("sám neprokazuje, která hodnota");
    expect(rule("DATE-ISSUED-QUALIFIER").examples).toBeUndefined();
  });
  it("keeps calendar optional and separates assigning a label from calendar conversion", () => {
    expect(rule("DATE-ISSUED-CALENDAR")).toMatchObject({ obligation: "optional", obligation_code: "O", requirement: { cardinality: { min: 0, max: 1 } } });
    expect(rule("DATE-ISSUED-CALENDAR").requirement.allowed_values).toEqual(["gregorian", "hebrew", "julian"]);
    check("DATE-ISSUED-CALENDAR", "automaticky nedoplňovat gregorian");
    expect(rule("DATE-ISSUED-CALENDAR").interpretation?.cs).toContain("není převod mezi kalendáři");
  });
  it("preserves recommended dateOther with mandatory contextual type", () => {
    expect(rule("DATE-OTHER").condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
    expect(rule("DATE-OTHER").requirement.cardinality).toEqual({ min: 0, max: null });
    expect(rule("DATE-OTHER-TYPE").condition).toEqual({ all: [...base, eq("element_role", "mods_date_other")] });
    expect(rule("DATE-OTHER-TYPE").requirement.cardinality).toEqual({ min: 1, max: 1 });
    expect(rule("DATE-OTHER-TYPE").requirement.allowed_values).toEqual(["production", "distribution", "manufacture"]);
    for (const mapping of ["264_0 → production", "264_2 → distribution", "260$g/264_3 → manufacture"]) check("DATE-OTHER-TYPE", mapping);
    check("DATE-OTHER", "DateOther nenahrazuje povinné dateIssued");
    expect(rule("DATE-OTHER-TYPE").interpretation?.cs).toContain("jiný uzel");
  });
  it("adds seven targets with unqualified attributes and accurately described XSD types", () => {
    const ids = new Set(rules.map((item) => item.target.entity));
    expect(ids.size).toBe(7);
    for (const id of ids) {
      const entity = registry.standard_entities.find((item) => item.id === id)!;
      expect(entity).toMatchObject({ version: "3.8", status: "normative" });
      if (entity.type === "attribute") expect(entity.namespace).toBeUndefined();
      else expect(entity.namespace).toBe("http://www.loc.gov/mods/v3");
    }
    expect(registry.standard_entities.find((item) => item.id === "MODS-DATE-ISSUED-CALENDAR")!.definition?.cs).toContain("xs:string");
    expect(registry.standard_entities.find((item) => item.id === "MODS-DATE-OTHER-TYPE")!.definition?.cs).toContain("Volitelný atribut");
    expect(registry.relations).toContainEqual(expect.objectContaining({ from: "NDK-MONO-MODS-SINGLE-DATE-ISSUED", to: "NDK-MONO-MODS-SINGLE-ORIGININFO", type: "related_to" }));
  });
  it("anchors three excerpts on two rules and never fabricates dateOther or range examples", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(3);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(2);
    for (const item of rules) for (const example of item.examples ?? []) {
      expect(example).toMatchObject({ kind: "source_excerpt", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473" });
      expect(example.source_xpath).toContain("/mods:originInfo/mods:dateIssued[");
      expect(example.note?.cs).toContain("nikoli dvě hranice intervalu");
    }
    expect(rule("DATE-ISSUED").examples![0]!.code).toContain(">[1890]</mods:dateIssued>");
    expect(rule("DATE-ISSUED").examples![1]!.code).toContain('encoding="marc">1890');
    for (const suffix of ["DATE-ISSUED-POINT", "DATE-ISSUED-CALENDAR", "DATE-OTHER", "DATE-OTHER-TYPE"]) expect(rule(suffix).examples).toBeUndefined();
  });
});
