import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-language");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-${suffix}`)!;
const check = (id: string, text: string) => expect(rule(id).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(text) }));
const eq = (field: string, value: string) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];

describe("MODS language of a single-volume monograph, DMF 2.3", () => {
  it("adds five source-backed rules and distinct MODS 3.8 targets", () => {
    expect(rules).toHaveLength(5);
    expect(new Set(rules.map((item) => item.target.entity)).size).toBe(5);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { version: "2.3", page: 54 }, verification: { status: "verified", date: "2026-10-08" } });
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_scope?.sources.some((source) => source.page === 24)).toBe(true);
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(registry.standard_entities.find((entity) => entity.id === item.target.entity)).toMatchObject({ version: "3.8", namespace: "http://www.loc.gov/mods/v3" });
      expect(registry.relations).toContainEqual(expect.objectContaining({ from: item.rule_id, to: item.target.entity, type: "restricts" }));
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
      expect(item.interpretation?.cs).toContain("neznámá hodnota není false");
      expect(item.implementations).toBeUndefined();
    }
  });
  it("distinguishes record, language and term scope; repeated languages are not repeated terms", () => {
    const roles = { LANGUAGE: "mods_record", "LANGUAGE-OBJECT-PART": "mods_language", "LANGUAGE-TERM": "mods_language", "LANGUAGE-TERM-TYPE": "mods_language_term", "LANGUAGE-TERM-AUTHORITY": "mods_language_term" };
    for (const [id, role] of Object.entries(roles)) expect(rule(id).condition).toEqual({ all: [...base, eq("element_role", role)] });
    for (const id of ["LANGUAGE", "LANGUAGE-TERM"]) expect(rule(id).requirement.cardinality).toEqual({ min: 1, max: null });
    check("LANGUAGE", "Různé jazyky patří do samostatných language");
    check("LANGUAGE", "recordInfo/languageOfCataloging");
    expect(rule("LANGUAGE-TERM").interpretation?.cs).toContain("tentýž jazyk, ne různé jazyky");
    for (const item of rules) {
      expect(item.interpretation?.cs).toContain("nikoli recordInfo/languageOfCataloging");
      expect(item.interpretation?.cs).toContain("titul vícesvazku");
    }
  });
  it("preserves MA and source availability for objectPart, without requiring every part", () => {
    expect(rules.filter((item) => item.obligation_code === "M")).toHaveLength(4);
    expect(rule("LANGUAGE-OBJECT-PART")).toMatchObject({ obligation: "mandatory_if_available", obligation_code: "MA", requirement: { presence: "conditional", cardinality: { min: 0, max: 1 } } });
    expect(rule("LANGUAGE-OBJECT-PART").requirement.allowed_values).toEqual(["summary", "table of contents", "accompanying material", "translation"]);
    check("LANGUAGE-OBJECT-PART", "nikoli z přítomnosti kontrolovaného atributu");
    check("LANGUAGE-OBJECT-PART", "Nepožadovat všechny čtyři hodnoty");
    check("LANGUAGE-OBJECT-PART", "Neznámá dostupnost není prokázaná nedostupnost");
  });
  it("retains translation from DMF but explains the original-language MARC mapping", () => {
    check("LANGUAGE-OBJECT-PART", "translation → 041$h");
    check("LANGUAGE-OBJECT-PART", "jazyk originálu, nikoli jazyk přeloženého textu v 041$a");
    expect(rule("LANGUAGE-OBJECT-PART").discrepancies?.[0]?.cs).toContain("zachovává doslovnou hodnotu DMF");
    expect(rule("LANGUAGE-OBJECT-PART").references).toContainEqual(expect.objectContaining({ url: "https://www.loc.gov/marc/bibliographic/bd041.html" }));
  });
  it("requires code and ISO 639-2/B without inventing a language default or a partial vocabulary", () => {
    expect(rule("LANGUAGE-TERM-TYPE").requirement.allowed_values).toEqual(["code"]);
    expect(rule("LANGUAGE-TERM-AUTHORITY").requirement.allowed_values).toEqual(["iso639-2b"]);
    for (const id of ["LANGUAGE-TERM-TYPE", "LANGUAGE-TERM-AUTHORITY"]) expect(rule(id)).toMatchObject({ obligation: "mandatory", obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: 1 } } });
    expect(rule("LANGUAGE-TERM").requirement.allowed_values).toBeUndefined();
    expect(rule("LANGUAGE-TERM").requirement.pattern).toBeUndefined();
    check("LANGUAGE-TERM", "Samotný třípísmenný tvar není ověřením slovníku");
    check("LANGUAGE-TERM", "cze versus ces");
    expect(rule("LANGUAGE-TERM").interpretation?.cs).toContain("cze není výchozí ani jediný");
    expect(registry.standard_entities.find((entity) => entity.id === "MODS-LANGUAGE-TERM-AUTHORITY")?.definition?.cs).toContain("odstranilo dřívější výčet");
  });
  it("includes all five common bibliographic rules in both cataloguing regimes without invented pairing", () => {
    for (const item of rules) {
      expect(item.cataloguing_rules).toEqual(["aacr2", "rda"]);
      expect(item.cataloguing_scope?.applicability).toBe("applicable");
    }
    const selection = { national_standard: "ndk-monograph", version: "2.3" };
    const result = compareRuleContexts(rules, { ...selection, cataloguing_rules: "aacr2" }, { ...selection, cataloguing_rules: "rda" });
    expect(result.unmapped.left).toHaveLength(5);
    expect(result.unmapped.right).toHaveLength(5);
    expect(result.excluded_context).toEqual({ left: [], right: [] });
    expect(result.unresolved_context).toEqual({ left: [], right: [] });
    expect(result.comparisons).toEqual([]);
  });
  it("adds four real excerpts but no invented objectPart example", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(4);
    expect(rule("LANGUAGE-OBJECT-PART").examples).toBeUndefined();
    for (const example of rules.flatMap((item) => item.examples ?? [])) {
      expect(example).toMatchObject({ kind: "source_excerpt", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473", checked_on: "2026-10-08" });
      expect(example.source_xpath).toContain('dmdSec[@ID="MODSMD_VOLUME_0001"]');
      expect(example.source_xpath).toContain("/mods:mods/mods:language");
      expect(example.source_xpath).not.toContain("languageOfCataloging");
      expect(example.code).toContain(">cze</mods:languageTerm>");
      expect(example.code).toContain('authority="iso639-2b" type="code"');
      expect(example.code).not.toContain("objectPart=");
      expect(example.note?.cs).toContain("původní MARC nebyl analyzován");
    }
  });
});
