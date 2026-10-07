import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-origin");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-${suffix}`)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const check = (suffix: string, text: string) => expect(rule(suffix).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(text) }));

describe("MODS origin and publication places of a single-volume monograph, DMF 2.3", () => {
  it("pins eight rules to DMF 2.3 and MODS 3.8 without claiming an implemented validator", () => {
    expect(rules).toHaveLength(8);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { document: "DMF Monografie", version: "2.3", page: "51–52" } });
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(item.implementations).toBeUndefined();
      expect(item.validator_behaviour).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
      expect(item.interpretation?.cs).toContain("neznámá hodnota není false");
    }
  });
  it("preserves three M, three MA and two prose requirements", () => {
    expect(rules.filter((item) => item.obligation_code === "M")).toHaveLength(3);
    expect(rules.filter((item) => item.obligation_code === "MA")).toHaveLength(3);
    expect(rule("ORIGIN-PRIMARY-EVENT")).toMatchObject({ obligation: "mandatory", obligation_source: "prose" });
    expect(rule("ORIGIN-AACR-NO-EVENT-TYPE")).toMatchObject({ obligation: "forbidden", obligation_source: "prose", requirement: { presence: "forbidden", cardinality: { min: 0, max: 0 } } });
    for (const suffix of ["ORIGIN-PRIMARY-EVENT", "ORIGIN-AACR-NO-EVENT-TYPE"]) expect(rule(suffix).obligation_code).toBeUndefined();
  });
  it("requires the origin container without gating on its prior presence", () => {
    expect(rule("ORIGININFO").condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
    expect(rule("ORIGININFO").requirement.cardinality).toEqual({ min: 1, max: null });
    check("ORIGININFO", "opakovat originInfo pro každé pole");
    check("ORIGININFO", "vazba místa a vydavatele");
  });
  it("requires eventType only in independently established RDA and maps all five indicators", () => {
    expect(rule("ORIGIN-EVENT-TYPE").condition).toEqual({ all: [...base, eq("element_role", "mods_origin_info"), eq("cataloguing_rules", "rda")] });
    expect(rule("ORIGIN-EVENT-TYPE").requirement.allowed_values).toEqual(["production", "publication", "distribution", "manufacture", "copyright"]);
    expect(rule("ORIGIN-EVENT-TYPE").requirement.cardinality).toEqual({ min: 1, max: 1 });
    for (const [indicator, value] of ["production", "publication", "distribution", "manufacture", "copyright"].entries()) check("ORIGIN-EVENT-TYPE", `264_${indicator} → ${value}`);
    expect(rule("ORIGIN-EVENT-TYPE").interpretation?.cs).toContain("R u jednotlivých hodnot");
    expect(rule("ORIGIN-EVENT-TYPE").interpretation?.cs).toContain("neznamená volitelný atribut");
  });
  it("checks the RDA record for a primary event, not only already-valid events", () => {
    expect(rule("ORIGIN-PRIMARY-EVENT").condition).toEqual({ all: [...base, eq("element_role", "mods_record"), eq("cataloguing_rules", "rda")] });
    expect(rule("ORIGIN-PRIMARY-EVENT").requirement.cardinality).toEqual({ min: 1, max: null });
    expect(rule("ORIGIN-PRIMARY-EVENT").requirement.allowed_values).toBeUndefined();
    check("ORIGIN-PRIMARY-EVENT", "Minimum 1 se vztahuje na tuto podmnožinu");
    check("ORIGIN-PRIMARY-EVENT", "Samotné distribution, manufacture a copyright tuto podmínku nesplní");
    expect(rule("ORIGIN-PRIMARY-EVENT").interpretation?.cs).toContain("Nevyžaduje současný výskyt obou hodnot");
  });
  it("uses explicit AACR rather than not-RDA, and forbids empty attributes too", () => {
    expect(rule("ORIGIN-AACR-NO-EVENT-TYPE").condition).toEqual({ all: [...base, eq("element_role", "mods_origin_info"), eq("cataloguing_rules", "aacr")] });
    expect(rule("ORIGIN-AACR-NO-EVENT-TYPE").interpretation?.cs).toContain("Prázdný eventType není totéž jako vynechaný atribut");
  });
  it("keeps MA availability independent from XML and supports repeated places and terms", () => {
    expect(rule("ORIGIN-PLACE").condition).toEqual({ all: [...base, eq("element_role", "mods_origin_info"), eq("origin_place_available", true)] });
    expect(rule("ORIGIN-PLACE-TERM").condition).toEqual({ all: [...base, eq("element_role", "mods_origin_place"), eq("origin_place_term_available", true)] });
    for (const suffix of ["ORIGIN-PLACE", "ORIGIN-PLACE-TERM"]) expect(rule(suffix).requirement.cardinality).toEqual({ min: 1, max: null });
    check("ORIGIN-PLACE-TERM", "opakovat placeTerm");
    expect(rule("ORIGIN-PLACE-TERM").interpretation?.cs).toContain("xr označuje zemi, nikoli identifikátor města Louny");
  });
  it("distinguishes code/text by MARC source and limits marccountry to 008", () => {
    expect(rule("ORIGIN-PLACE-TERM-TYPE").condition).toEqual({ all: [...base, eq("element_role", "mods_origin_place_term")] });
    expect(rule("ORIGIN-PLACE-TERM-TYPE").requirement.allowed_values).toEqual(["code", "text"]);
    check("ORIGIN-PLACE-TERM-TYPE", "008/15–17 → code; 260$a/264$a → text");
    expect(rule("ORIGIN-PLACE-TERM-AUTHORITY").condition).toEqual({ all: [...base, eq("element_role", "mods_origin_place_term"), eq("origin_place_source", "marc_008_15_17")] });
    expect(rule("ORIGIN-PLACE-TERM-AUTHORITY").requirement.allowed_values).toEqual(["marccountry"]);
    check("ORIGIN-PLACE-TERM-AUTHORITY", "Marccountry nepřenášet na text");
  });
  it("adds six MODS targets without inventing XSD restrictions", () => {
    const ids = new Set(rules.map((item) => item.target.entity));
    expect(ids.size).toBe(6);
    for (const id of ids) {
      const entity = registry.standard_entities.find((item) => item.id === id)!;
      expect(entity).toMatchObject({ version: "3.8", status: "normative" });
      if (entity.type === "attribute") expect(entity.namespace).toBeUndefined();
      else expect(entity.namespace).toBe("http://www.loc.gov/mods/v3");
    }
    expect(registry.standard_entities.find((item) => item.id === "MODS-ORIGININFO-EVENT-TYPE")!.definition?.cs).toContain("xs:string");
    expect(registry.standard_entities.find((item) => item.id === "MODS-ORIGIN-PLACE")!.definition?.cs).toContain("placeIdentifier a cartographics");
    expect(registry.standard_entities.find((item) => item.id === "MODS-ORIGIN-PLACE-TERM-AUTHORITY")!.definition?.cs).toContain("odstraněn starší omezený výčet");
  });
  it("anchors eight AACR excerpts on six rules, with no fabricated RDA sample", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(8);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(6);
    for (const item of rules) for (const example of item.examples ?? []) {
      expect(example).toMatchObject({ kind: "source_excerpt", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473" });
      expect(example.source_xpath).toContain('mets:dmdSec[@ID="MODSMD_VOLUME_0001"]');
    }
    expect(rule("ORIGIN-EVENT-TYPE").examples).toBeUndefined();
    expect(rule("ORIGIN-PRIMARY-EVENT").examples).toBeUndefined();
    expect(rule("ORIGIN-AACR-NO-EVENT-TYPE").examples![0]!.code).not.toContain("eventType");
    expect(rule("ORIGIN-PLACE-TERM").examples!.map((item) => item.code).join(" ")).toContain("V Lounech");
    expect(registry.relations).toContainEqual(expect.objectContaining({ from: "NDK-MONO-MODS-SINGLE-ORIGININFO", to: "NDK-MONO-METS-DMD-XMLDATA", type: "related_to" }));
  });
});
