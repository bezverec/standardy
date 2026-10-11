import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-classification");
const rule = (suffix = "") => rules.find((item) => item.rule_id === "NDK-MONO-MODS-SINGLE-CLASSIFICATION" + suffix)!;
const eq = (field: string, value: string) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const check = (suffix: string, text: string) => expect(rule(suffix).requirement.validations).toContainEqual(expect.objectContaining({ type: "custom", expression: expect.stringContaining(text) }));

describe("MODS classification, DMF Monografie 2.3", () => {
  it("records three source-backed bibliographic requirements in a precise parent scope", () => {
    expect(rules).toHaveLength(3);
    expect(new Set(rules.map((item) => item.target.entity)).size).toBe(3);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { document: "DMF Monografie", version: "2.3", page: 56 }, verification: { status: "verified", date: "2026-10-11" } });
      expect(item.cataloguing_scope).toMatchObject({ applicability: "applicable", reviewed_on: "2026-10-11" });
      expect(item.cataloguing_rules).toEqual(["aacr2", "rda"]);
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_scope?.sources.some((source) => source.page === 24)).toBe(true);
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
      expect(item.interpretation?.cs).toContain("nikoli subject/classification");
      expect(item.implementations).toBeUndefined();
    }
  });

  it("does not turn an optional repeatable classification into a mandatory container", () => {
    expect(rule()).toMatchObject({ obligation: "recommended", obligation_code: "R", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
    expect(rule().condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
    check("", "nevytvářet classification jen kvůli povinnému authority");
    check("", "nikoli převádět na číslo");
    expect(rule().requirement.allowed_values).toBeUndefined();
    expect(registry.standard_entities.find((item) => item.id === "MODS-CLASSIFICATION")?.definition?.cs).toContain("0..n");
  });

  it("requires authority only on used classification and keeps the source-code list open", () => {
    const item = rule("-AUTHORITY");
    expect(item).toMatchObject({ obligation: "mandatory", obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: 1 } } });
    expect(item.condition).toEqual({ all: [...base, eq("element_role", "mods_classification")] });
    expect(item.requirement.allowed_values).toBeUndefined();
    for (const mapping of ["080$a → udc", "072$a → udc", "072$9 → Konspekt"]) check("-AUTHORITY", mapping);
    check("-AUTHORITY", "Jedno MARC 072 může poskytnout oddělené klasifikace");
    check("-AUTHORITY", "AuthorityURI ani valueURI nenahrazuje");
    expect(item.interpretation?.cs).toContain("candocs");
    expect(item.interpretation?.cs).toContain("Není tím prokázána zaměnitelnost");
    expect(registry.standard_entities.find((item) => item.id === "MODS-CLASSIFICATION-AUTHORITY")?.definition?.cs).toContain("Volitelný atribut");
  });

  it("preserves MA for edition and conditions it on the source subfield, not target presence or udc", () => {
    const item = rule("-EDITION");
    expect(item).toMatchObject({ obligation: "mandatory_if_available", obligation_code: "MA", requirement: { presence: "required", cardinality: { min: 1, max: 1 }, allowed_values: ["Konspekt"] } });
    expect(item.condition).toEqual({ all: [...base, eq("element_role", "mods_classification"), eq("classification_source_marc_subfield", "072$a")] });
    check("-EDITION", "Pro 080$a ani 072$9 tato podmínka povinnost edition nezakládá");
    check("-EDITION", "Neznámý původ vykázat jako nevyhodnocený");
    expect(item.interpretation?.cs).toContain("nevytváří obecný zákaz edition");
    expect(item.interpretation?.cs).toContain("nikoli výskyt libovolného 072 v záznamu");
    expect(item.target.entity).not.toBe("MODS-EDITION");
    expect(item.interpretation?.cs).toContain("originInfo/edition");
    expect(item.examples).toBeUndefined();
  });

  it("keeps both catalogue regimes without inventing equivalence keys", () => {
    const selection = { national_standard: "ndk-monograph", version: "2.3" };
    const result = compareRuleContexts(rules, { ...selection, cataloguing_rules: "aacr2" }, { ...selection, cataloguing_rules: "rda" });
    expect(result.unmapped.left).toHaveLength(3);
    expect(result.unmapped.right).toEqual(result.unmapped.left);
    expect(result.comparisons).toEqual([]);
    expect(result.excluded_context).toEqual({ left: [], right: [] });
    expect(result.unresolved_context).toEqual({ left: [], right: [] });
  });

  it("preserves observed text and does not infer source MARC or missing edition errors from samples", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(3);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(2);
    expect(rule().examples![0]!.code).toContain(">621.3-051<");
    expect(rule().examples![1]!.code).toContain(">(73)<");
    expect(rule().examples![1]!.source_xpath).toContain("/mods:classification[4]");
    for (const example of examples) {
      expect(example.file_sha256).toBe("7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473");
      expect(example.source_xpath).toContain('dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:classification[');
      expect(example.checked_on).toBe("2026-10-11");
      expect(example.note.cs).toContain("descriptionStandard=aacr");
      expect(example.note.cs).toContain("authority=udc samo nerozlišuje původ z 080$a a 072$a");
      expect(example.code).not.toContain("edition=");
    }
  });
});
