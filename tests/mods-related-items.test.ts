import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-related-items");
const rule = (suffix = "") => rules.find((item) => item.rule_id === "NDK-MONO-MODS-SINGLE-RELATED-ITEM" + suffix)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];

describe("MODS relatedItem, DMF Monografie 2.3", () => {
  it("records seven sourced requirements scoped to single-volume descriptive metadata", () => {
    expect(rules).toHaveLength(7);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", source: { document: "DMF Monografie", version: "2.3" }, verification: { status: "verified", date: "2026-10-14" } });
      expect([56, 57]).toContain(item.source.page);
      expect(item.cataloguing_scope).toMatchObject({ applicability: "applicable", reviewed_on: "2026-10-14" });
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_scope?.sources.some((source) => source.page === 24)).toBe(true);
      expect(item.cataloguing_rules).toEqual(["aacr2", "rda"]);
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
      expect(item.interpretation?.cs).toContain("nikoli vnořené relatedItem");
      expect(item.implementations).toBeUndefined();
      expect(item.examples).toBeUndefined();
    }
  });

  it("preserves optional RA container and R type without making host a constant", () => {
    expect(rule()).toMatchObject({ obligation: "recommended_if_available", obligation_code: "RA", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
    expect(rule().condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
    expect(rule("-TYPE")).toMatchObject({ obligation: "recommended", obligation_code: "R", requirement: { presence: "optional", cardinality: { min: 0, max: 1 } } });
    expect(rule("-TYPE").requirement.allowed_values).toEqual(["preceding", "succeeding", "original", "host", "constituent", "series", "otherVersion", "otherFormat", "isReferencedBy", "references", "reviewOf"]);
    expect(rule("-TYPE").interpretation?.cs).toContain("XSD tuto vzájemnou výlučnost nevynucuje");
  });

  it("retains four optional attributes in the used parent, without closed string vocabularies", () => {
    for (const suffix of ["-OTHER-TYPE", "-OTHER-TYPE-URI", "-OTHER-TYPE-AUTH", "-OTHER-TYPE-AUTH-URI"]) {
      const item = rule(suffix);
      expect(item).toMatchObject({ obligation: "optional", obligation_code: "O", requirement: { presence: "optional", cardinality: { min: 0, max: 1 } } });
      expect(item.condition).toEqual({ all: [...base, eq("element_role", "mods_related_item")] });
      expect(item.requirement.allowed_values).toBeUndefined();
      expect(registry.standard_entities.find((entity) => entity.id === item.target.entity)?.definition?.cs).toContain("xs:string");
    }
  });

  it("keeps source transcription separate from unresolved resource/relationship semantics", () => {
    for (const suffix of ["-OTHER-TYPE-URI", "-OTHER-TYPE-AUTH", "-OTHER-TYPE-AUTH-URI"]) {
      const item = rule(suffix);
      expect(item.status).toBe("ambiguous");
      expect(item.discrepancies).toHaveLength(1);
      expect(item.verification.reference).toContain("není nejasná sémantika tímto vyřešena");
    }
    expect(rule("-OTHER-TYPE-URI").interpretation?.cs).toContain("URI typu vztahu");
    expect(rule("-OTHER-TYPE-AUTH").interpretation?.cs).toContain("jméno autoritativního seznamu typů vztahů");
    expect(rule("-OTHER-TYPE-AUTH-URI").interpretation?.cs).toContain("redakční inference");
    expect(rule("-OTHER-TYPE-AUTH-URI").references).toContainEqual(expect.objectContaining({ document: "MODS 3.8 Changes" }));
    expect(rule("-OTHER-TYPE").status).toBe("normative");
  });

  it("conditions the prose series mapping on source context, not correct target encoding", () => {
    const item = rule("-SERIES");
    expect(item).toMatchObject({ target: { entity: "MODS-TITLEINFO" }, obligation: "mandatory", obligation_source: "prose", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    expect(item.obligation_code).toBeUndefined();
    expect(item.condition).toEqual({ all: [...base, eq("element_role", "mods_related_item"), eq("related_resource_role", "series"), eq("source_series_fields_available", true)] });
    const expression = JSON.stringify(item.requirement.validations);
    for (const mapping of ["490$a → title", "490$v → partNumber", "830$a → title", "830$n → partNumber", "830$p → partName", "830$v → partNumber"]) expect(expression).toContain(mapping);
    expect(expression).toContain("samostatné titleInfo pro každý výskyt bibliografického pole");
    expect(expression).toContain("Nevyžadovat současnou existenci polí 490 i 830");
    expect(item.interpretation?.cs).toContain("nepřikazuje titleInfo/@type=uniform");
    expect(item.interpretation?.cs).toContain("Nezakládá povinné relatedItem pro každý dokument");
  });

  it("keeps shared bibliographic scope without inventing cross-DMF pairings", () => {
    const selection = { national_standard: "ndk-monograph", version: "2.3" };
    const result = compareRuleContexts(rules, { ...selection, cataloguing_rules: "aacr2" }, { ...selection, cataloguing_rules: "rda" });
    expect(result.unmapped.left).toHaveLength(7);
    expect(result.unmapped.right).toEqual(result.unmapped.left);
    expect(result.comparisons).toEqual([]);
    expect(result.excluded_context).toEqual({ left: [], right: [] });
    expect(result.unresolved_context).toEqual({ left: [], right: [] });
  });
});
