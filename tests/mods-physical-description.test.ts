import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-physical-description");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-${suffix}`)!;
const eq = (field: string, value: string) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const check = (id: string, text: string) => expect(rule(id).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(text) }));

describe("MODS physical description, DMF Monografie 2.3", () => {
  it("adds nine contextual rules and six source-backed MODS entities", () => {
    expect(rules).toHaveLength(9);
    expect(new Set(rules.map((item) => item.target.entity)).size).toBe(6);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { version: "2.3" }, verification: { status: "verified", date: "2026-10-08" } });
      expect([54, 55]).toContain(item.source.page);
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_scope?.sources.some((source) => source.page === 24)).toBe(true);
      expect(item.cataloguing_scope?.applicability).toBe("applicable");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(registry.standard_entities.find((entity) => entity.id === item.target.entity)).toMatchObject({ version: "3.8", namespace: "http://www.loc.gov/mods/v3" });
      expect(registry.relations).toContainEqual(expect.objectContaining({ from: item.rule_id, to: item.target.entity, type: "restricts" }));
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
      expect(item.interpretation?.cs).toContain("neznámá hodnota není false");
      expect(item.implementations).toBeUndefined();
      expect(item.non_use).toBeUndefined();
    }
  });
  it("preserves M, MA, RA and two prose-only duties without fabricating codes", () => {
    expect(rules.filter((item) => item.obligation_code === "M")).toHaveLength(4);
    expect(rules.filter((item) => item.obligation_code === "MA")).toHaveLength(1);
    expect(rules.filter((item) => item.obligation_code === "RA")).toHaveLength(2);
    expect(rule("FORM-RDA-MEDIA")).toMatchObject({ obligation: "optional", obligation_source: "prose", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
    expect(rule("FORM-RDA-CARRIER")).toMatchObject({ obligation: "mandatory", obligation_source: "prose", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    for (const id of ["FORM-RDA-MEDIA", "FORM-RDA-CARRIER"]) expect(rule(id).obligation_code).toBeUndefined();
    for (const id of ["PHYSICAL-EXTENT", "PHYSICAL-NOTE"]) expect(rule(id)).toMatchObject({ obligation: "recommended_if_available", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
  });
  it("scopes container and children to the correct parents, without forcing optional children", () => {
    expect(rule("PHYSICAL-DESCRIPTION").condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
    for (const id of ["FORM", "PHYSICAL-EXTENT", "PHYSICAL-NOTE"]) expect(rule(id).condition).toEqual({ all: [...base, eq("element_role", "mods_physical_description")] });
    for (const id of ["PHYSICAL-DESCRIPTION", "FORM"]) expect(rule(id).requirement.cardinality).toEqual({ min: 1, max: null });
    check("PHYSICAL-DESCRIPTION", "nepovinný extent ani note se nestávají povinnými");
    expect(rule("PHYSICAL-DESCRIPTION").interpretation?.cs).toContain("nedoložené max=1");
    expect(rule("FORM").requirement.allowed_values).toBeUndefined();
    check("FORM", "Print a microfilm jsou příklady, ne úplný výčet");
    check("FORM", "MARC 336");
  });
  it("keeps the authority sets separate and validates role-specific pairings in RDA", () => {
    const original = ["marcform", "marccategory", "marcsmd", "gmd"];
    expect(rule("FORM-AUTHORITY-AACR").requirement.allowed_values).toEqual(original);
    expect(rule("FORM-AUTHORITY-RDA").requirement.allowed_values).toEqual([...original, "rdamedia", "rdacarrier"]);
    for (const [id, regime] of [["FORM-AUTHORITY-AACR", "aacr2"], ["FORM-AUTHORITY-RDA", "rda"]]) {
      expect(rule(id!).condition).toEqual({ all: [...base, eq("element_role", "mods_physical_form"), eq("cataloguing_rules", regime!)] });
      expect(rule(id!).requirement.cardinality).toEqual({ min: 1, max: 1 });
    }
    check("FORM-AUTHORITY-RDA", "samotná příslušnost ke sjednocenému výčtu nestačí");
    check("FORM-AUTHORITY-RDA", "Základní čtyři hodnoty DMF pro RDA nevyškrtává");
    check("FORM-AUTHORITY-AACR", "sama není důkazem katalogizačního režimu");
  });
  it("does not suppress the RDA carrier requirement merely because MARC 338 is missing", () => {
    for (const id of ["FORM-RDA-MEDIA", "FORM-RDA-CARRIER"]) expect(rule(id).condition).toEqual({ all: [...base, eq("element_role", "mods_record"), eq("cataloguing_rules", "rda")] });
    check("FORM-RDA-CARRIER", "Chybějící zdrojové pole 338 není podmínkou pro vypnutí povinnosti");
    check("FORM-RDA-MEDIA", "Absence form pro MARC 337 není porušením");
    for (const id of ["FORM-RDA-MEDIA", "FORM-RDA-CARRIER"]) expect(rule(id).requirement.allowed_values).toBeUndefined();
    check("FORM-RDA-CARRIER", "Příklad svazek není uzavřený číselník");
  });
  it("limits the MA type mapping to media/carrier roles independently evidenced in RDA", () => {
    const item = rule("FORM-RDA-TYPE");
    expect(item.requirement).toMatchObject({ presence: "conditional", cardinality: { min: 0, max: 1 }, allowed_values: ["media", "carrier"] });
    expect(item.condition).toEqual({ all: [...base, eq("element_role", "mods_physical_form"), eq("cataloguing_rules", "rda"), { field: "form_semantic_role", operator: "in", value: ["media", "carrier"] }] });
    check("FORM-RDA-TYPE", "nezávisle na přítomnosti cílového type");
    check("FORM-RDA-TYPE", "Nevyžadovat media/carrier na každém jiném form RDA");
    expect(item.interpretation?.cs).toContain("netvoří samostatný domyšlený zákaz type v AACR2");
  });
  it("keeps textual extent and physical notes distinct from page counts and general notes", () => {
    check("PHYSICAL-EXTENT", "300$a, $b a $c z jednoho výskytu pole do jednoho extent");
    check("PHYSICAL-EXTENT", "Různá pole 300 neslučovat");
    check("PHYSICAL-EXTENT", "počtem obrazových souborů");
    expect(rule("PHYSICAL-EXTENT").requirement.pattern).toBeUndefined();
    expect(rule("PHYSICAL-EXTENT").interpretation?.cs).toContain("není to strukturované part/extent");
    check("PHYSICAL-NOTE", "Obecný note přímo pod mods");
    expect(rule("PHYSICAL-NOTE").interpretation?.cs).toContain("nedostávají povinnost z následujícího řádku");
  });
  it("selects four common, one AACR2 and four RDA requirements without guessing comparison keys", () => {
    expect(rules.filter((item) => item.cataloguing_rules?.length === 2)).toHaveLength(4);
    expect(rules.filter((item) => item.cataloguing_rules?.join() === "aacr2")).toHaveLength(1);
    expect(rules.filter((item) => item.cataloguing_rules?.join() === "rda")).toHaveLength(4);
    const selection = { national_standard: "ndk-monograph", version: "2.3" };
    const result = compareRuleContexts(rules, { ...selection, cataloguing_rules: "aacr2" }, { ...selection, cataloguing_rules: "rda" });
    expect(result.unmapped.left).toHaveLength(5);
    expect(result.unmapped.right).toHaveLength(8);
    expect(result.excluded_context.left).toHaveLength(4);
    expect(result.excluded_context.right).toEqual([rule("FORM-AUTHORITY-AACR")]);
    expect(result.unresolved_context).toEqual({ left: [], right: [] });
    expect(result.comparisons).toEqual([]);
  });
  it("includes eight genuine excerpts, not fabricated RDA or physical-note examples", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(8);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(4);
    expect(rule("FORM").examples).toHaveLength(3);
    expect(rule("FORM-AUTHORITY-AACR").examples).toHaveLength(3);
    expect(rule("PHYSICAL-EXTENT").examples![0]!.code).toContain(">14 s. ; 16 cm</mods:extent>");
    expect(rule("PHYSICAL-DESCRIPTION").examples![0]!.code).toContain('authority="marcsmd">regular print');
    for (const item of rules.filter((item) => item.cataloguing_rules?.join() === "rda" || item.rule_id.endsWith("PHYSICAL-NOTE"))) expect(item.examples).toBeUndefined();
    for (const example of examples) {
      expect(example.file_sha256).toBe("7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473");
      expect(example.source_xpath).toContain('dmdSec[@ID="MODSMD_VOLUME_0001"]');
      expect(example.source_xpath).toContain("/mods:mods/mods:physicalDescription");
      expect(example.note?.cs).toContain("descriptionStandard=aacr");
      expect(example.note?.cs).toContain("nedokládá větev RDA");
    }
  });
});
