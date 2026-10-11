import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-subject-details");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-SUBJECT-${suffix}`)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const check = (id: string, text: string) => expect(rule(id).requirement.validations).toContainEqual(expect.objectContaining({ type: "custom", expression: expect.stringContaining(text) }));

describe("MODS cartographic and name subjects, DMF Monografie 2.3", () => {
  it("records six scoped requirements with distinct verified MODS entities", () => {
    expect(rules).toHaveLength(6);
    expect(new Set(rules.map((item) => item.target.entity)).size).toBe(6);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { document: "DMF Monografie", version: "2.3", page: 56 }, verification: { status: "verified", date: "2026-10-11" } });
      expect(item.cataloguing_scope).toMatchObject({ applicability: "applicable", reviewed_on: "2026-10-11" });
      expect(item.cataloguing_rules).toEqual(["aacr2", "rda"]);
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_scope?.sources.some((source) => source.page === 24)).toBe(true);
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
      expect(item.implementations).toBeUndefined();
      expect(item.requirement.allowed_values).toBeUndefined();
    }
  });

  it("does not promote recommended containers to mandatory because of their children", () => {
    for (const suffix of ["CARTOGRAPHICS", "NAME"]) {
      expect(rule(suffix)).toMatchObject({ obligation: "recommended", obligation_code: "R", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
      expect(rule(suffix).condition).toEqual({ all: [...base, eq("element_role", "mods_subject")] });
    }
    check("CARTOGRAPHICS", "MA potomci sami nezakládají povinnost kontejner vytvořit");
    check("NAME", "nevytvářet je pouze kvůli M");
    check("CARTOGRAPHICS", "není omezením pouze na tyto předlohy");
  });

  it("requires available cartographic values in their own parent without circular availability checks", () => {
    for (const [suffix, available, max] of [["COORDINATES", "cartographic_coordinates_available", null], ["SCALE", "cartographic_scale_available", 1]] as const) {
      const item = rule("CARTOGRAPHICS-" + suffix);
      expect(item).toMatchObject({ obligation: "mandatory_if_available", obligation_code: "MA", requirement: { presence: "required", cardinality: { min: 1, max } } });
      expect(item.condition).toEqual({ all: [...base, eq("element_role", "mods_subject_cartographics"), eq(available, true)] });
      check("CARTOGRAPHICS-" + suffix, "Dostupnost neposuzovat podle přítomnosti cílového");
      expect(item.interpretation?.cs).toContain("neznámá hodnota není false");
    }
  });

  it("preserves the distinct MARC sources, textual values and XSD ordering", () => {
    check("CARTOGRAPHICS-COORDINATES", "034$d, $e, $f, $g");
    check("CARTOGRAPHICS-COORDINATES", "neznamenají čtyři povinné XML elementy");
    check("CARTOGRAPHICS-SCALE", "255$a");
    check("CARTOGRAPHICS-SCALE", "nevynucovat číselný jmenovatel");
    check("CARTOGRAPHICS-SCALE", "před projection a coordinates");
    expect(rule("CARTOGRAPHICS-SCALE").interpretation?.cs).toContain("nikoli 034$b");
    expect(registry.standard_entities.find((item) => item.id === "MODS-SUBJECT-CARTOGRAPHICS-SCALE")?.definition?.cs).toContain("0..1");
    expect(registry.standard_entities.find((item) => item.id === "MODS-SUBJECT-CARTOGRAPHICS-COORDINATES")?.definition?.cs).toContain("0..n");
    expect(rule("CARTOGRAPHICS-COORDINATES").examples).toBeUndefined();
    expect(rule("CARTOGRAPHICS-SCALE").examples).toBeUndefined();
  });

  it("requires an actual name part only in subject names, preserving the source wording caveat", () => {
    expect(rule("NAME-PART")).toMatchObject({ obligation: "mandatory", obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    expect(rule("NAME-PART").condition).toEqual({ all: [...base, eq("element_role", "mods_subject_name")] });
    check("NAME", "MARC 600");
    check("NAME-PART", "600$a");
    check("NAME-PART", "type=date s životními daty nenahrazuje vlastní jméno");
    expect(rule("NAME-PART").interpretation?.cs).toContain("Případné rozšíření mapování korporací není tímto řádkem vyřešeno");
    expect(rule("NAME").interpretation?.cs).toContain("nikoli top-level nameDefinition");
    expect(registry.standard_entities.find((item) => item.id === "MODS-SUBJECT-NAME")?.definition?.cs).toContain("nikoli etal či alternativeName");
    expect(rule("NAME-PART").target.entity).not.toBe("MODS-NAME-PART");
  });

  it("requires the available authority of the subject person, not an unrelated contributor identifier", () => {
    expect(rule("NAME-IDENTIFIER")).toMatchObject({ obligation: "mandatory_if_available", obligation_code: "MA", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    expect(rule("NAME-IDENTIFIER").condition).toEqual({ all: [...base, eq("element_role", "mods_subject_name"), eq("national_authority_id_available", true)] });
    check("NAME-IDENTIFIER", "Dostupnost neposuzovat podle přítomnosti cílového");
    check("NAME-IDENTIFIER", "UUID SIP ani authority=czenas");
    expect(rule("NAME-IDENTIFIER").interpretation?.cs).toContain("ne povinně celé číslo");
    expect(rule("NAME-IDENTIFIER").interpretation?.cs).toContain("nedokládá nedostupnost autority");
    expect(rule("NAME-IDENTIFIER").examples).toBeUndefined();
  });

  it("includes the same rules in both regimes without adding equivalence keys", () => {
    const selection = { national_standard: "ndk-monograph", version: "2.3" };
    const result = compareRuleContexts(rules, { ...selection, cataloguing_rules: "aacr2" }, { ...selection, cataloguing_rules: "rda" });
    expect(result.unmapped.left).toHaveLength(6);
    expect(result.unmapped.right).toEqual(result.unmapped.left);
    expect(result.comparisons).toEqual([]);
    expect(result.excluded_context).toEqual({ left: [], right: [] });
    expect(result.unresolved_context).toEqual({ left: [], right: [] });
  });

  it("preserves three source excerpts and keeps life dates separate from temporal subjects", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(3);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(2);
    expect(rule("NAME").examples![0]!.code).toContain("Edison, Thomas A. (Thomas Alva)");
    expect(rule("NAME").examples![0]!.code).not.toContain("nameIdentifier");
    expect(rule("NAME-PART").examples).toHaveLength(2);
    expect(rule("NAME-PART").examples![1]!.code).toContain('type="date">1847-1931');
    expect(rule("NAME-PART").examples![1]!.note.cs).toContain("sám neplní požadavek na vlastní jméno");
    for (const item of examples) {
      expect(item.file_sha256).toBe("7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473");
      expect(item.source_xpath).toContain('dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:subject[2]/mods:name');
      expect(item.checked_on).toBe("2026-10-11");
      expect(item.note.cs).toContain("descriptionStandard=aacr");
    }
  });
});
