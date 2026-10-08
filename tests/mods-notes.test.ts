import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-notes");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-${suffix}`)!;
const eq = (field: string, value: string) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const check = (id: string, text: string) => expect(rule(id).requirement.validations).toContainEqual(expect.objectContaining({ type: "custom", expression: expect.stringContaining(text) }));

describe("MODS summaries and general notes, DMF Monografie 2.3", () => {
  it("records three sourced requirements and distinct MODS entities", () => {
    expect(rules).toHaveLength(3);
    expect(new Set(rules.map((item) => item.target.entity)).size).toBe(3);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { document: "DMF Monografie", version: "2.3", page: 55 }, verification: { status: "verified", date: "2026-10-08" } });
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_scope?.sources.some((source) => source.page === 24)).toBe(true);
      expect(item.cataloguing_scope?.applicability).toBe("applicable");
      expect(item.cataloguing_rules).toEqual(["aacr2", "rda"]);
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(registry.standard_entities.find((entity) => entity.id === item.target.entity)).toMatchObject({ version: "3.8", namespace: "http://www.loc.gov/mods/v3" });
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
      expect(item.implementations).toBeUndefined();
      expect(item.non_use).toBeUndefined();
    }
  });

  it("preserves R, RA and O without requiring optional content", () => {
    expect(rule("ABSTRACT")).toMatchObject({ obligation: "recommended", obligation_code: "R" });
    expect(rule("NOTE")).toMatchObject({ obligation: "recommended_if_available", obligation_code: "RA" });
    expect(rule("NOTE-TYPE")).toMatchObject({ obligation: "optional", obligation_code: "O" });
    for (const item of rules) {
      expect(item.requirement.presence).toBe("optional");
      expect(item.requirement.cardinality).toMatchObject({ min: 0 });
      expect(item.obligation_source).toBeUndefined();
      expect(item.requirement.validations).not.toEqual(expect.arrayContaining([expect.objectContaining({ assertion: "exists" })]));
    }
    check("ABSTRACT", "Absence abstract není porušením povinné přítomnosti");
    check("NOTE", "Dostupnost neposuzovat podle přítomnosti cílového note");
    check("NOTE-TYPE", "Chybějící type není chyba ani důvod založit nový note");
  });

  it("limits the rules to a volume record and the type attribute to its direct general note", () => {
    for (const id of ["ABSTRACT", "NOTE"]) {
      expect(rule(id).condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
      expect(rule(id).requirement.cardinality).toEqual({ min: 0, max: null });
    }
    expect(rule("NOTE-TYPE").condition).toEqual({ all: [...base, eq("element_role", "mods_general_note")] });
    expect(rule("NOTE-TYPE").requirement.cardinality).toEqual({ min: 0, max: 1 });
    expect(rule("NOTE").target.entity).not.toBe("MODS-PHYSICAL-NOTE");
    expect(rule("NOTE").interpretation?.cs).toContain("Stránkové note s hodnotou left/right");
    expect(rule("NOTE-TYPE").interpretation?.cs).toContain("ne kořene mods ani physicalDescription/note");
    for (const item of rules) expect(item.interpretation?.cs).toContain("neznámá hodnota není false");
  });

  it("distinguishes summaries and specific elements from indiscriminate 5XX conversion", () => {
    check("ABSTRACT", "MARC 520");
    check("NOTE", "245$c");
    check("NOTE", "nejde o bezvýhradné kopírování všech 5XX do note");
    check("NOTE", "obsahové shrnutí z 520 řeší samostatný abstract");
    expect(rule("NOTE").interpretation?.cs).toContain("tento výklad nepřipisujeme doslovně řádku DMF");
    expect(rule("ABSTRACT").interpretation?.cs).toContain("netvoří samostatné pravidlo DC");
  });

  it("does not turn a recommended open list into an enum or a required type", () => {
    expect(rule("NOTE-TYPE").relation_to_target.type).toBe("clarifies");
    for (const item of rules) {
      expect(item.requirement.allowed_values).toBeUndefined();
      expect(item.requirement.validations).not.toEqual(expect.arrayContaining([expect.objectContaining({ type: "value_set" })]));
    }
    check("NOTE-TYPE", "nikoli vynucovat uzavřený číselník");
    check("NOTE-TYPE", "ne povinná hodnota všech poznámek");
    expect(rule("NOTE-TYPE").references).toContainEqual(expect.objectContaining({ url: "https://www.loc.gov/standards/mods/mods-notes.html" }));
  });

  it("includes the same requirements in both regimes without inventing equivalence keys", () => {
    const selection = { national_standard: "ndk-monograph", version: "2.3" };
    const result = compareRuleContexts(rules, { ...selection, cataloguing_rules: "aacr2" }, { ...selection, cataloguing_rules: "rda" });
    expect(result.unmapped.left).toHaveLength(3);
    expect(result.unmapped.right).toEqual(result.unmapped.left);
    expect(result.comparisons).toEqual([]);
    expect(result.excluded_context).toEqual({ left: [], right: [] });
    expect(result.unresolved_context).toEqual({ left: [], right: [] });
  });

  it("preserves typed and untyped source notes without fabricating an abstract", () => {
    expect(rule("ABSTRACT").examples).toBeUndefined();
    expect(rule("NOTE").examples).toHaveLength(3);
    expect(rule("NOTE-TYPE").examples).toHaveLength(1);
    expect(rule("NOTE").examples![0]!.code).toContain('type="statement of responsibility">[J. Mařík]');
    expect(rule("NOTE").examples!.slice(1).every((item) => !item.code.includes("type="))).toBe(true);
    expect(rule("NOTE-TYPE").examples![0]!.code).toBe(rule("NOTE").examples![0]!.code);
    expect(rule("NOTE").examples![1]!.source_xpath).toContain("/mods:note[2]");
    expect(rule("NOTE").examples![2]!.source_xpath).toContain("/mods:note[3]");
    for (const item of rules.flatMap((entry) => entry.examples ?? [])) {
      expect(item.file_sha256).toBe("7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473");
      expect(item.source_xpath).toContain('dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:note');
      expect(item.note.cs).toContain("descriptionStandard=aacr");
      expect(item.note.cs).toContain("původní MARC ani úplná validita SIP nebyly ověřeny");
    }
  });
});
