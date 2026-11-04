import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-identifiers");
const rule = (suffix = "") => rules.find((item) => item.rule_id === "NDK-MONO-MODS-SINGLE-IDENTIFIER" + suffix)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const checks = (suffix: string) => JSON.stringify(rule(suffix).requirement.validations);

describe("MODS identifiers, DMF Monografie 2.3", () => {
  it("scopes resource identifiers to the direct single-volume record", () => {
    expect(rules).toHaveLength(10);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", verification: { status: "verified", date: "2026-11-04" } });
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.condition).toMatchObject({ all: expect.arrayContaining(base) });
      expect(item.comparison).toBeUndefined();
      expect(item.implementations).toBeUndefined();
    }
    expect(rule()).toMatchObject({ target: { entity: "MODS-IDENTIFIER" }, obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    expect(rule().condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
    expect(rule().normative_requirement.cs).toContain("neplatné");
    expect(rule().interpretation?.cs).toContain("recordInfo/recordIdentifier");
  });

  it("requires the type on each identifier without closing the source's open list", () => {
    const item = rule("-TYPE");
    expect(item).toMatchObject({ target: { entity: "MODS-IDENTIFIER-TYPE" }, obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: 1 } } });
    expect(item.condition).toEqual({ all: [...base, eq("element_role", "mods_identifier")] });
    expect(item.requirement.allowed_values).toBeUndefined();
    expect(checks("-TYPE")).toContain("Otevřený seznam");
    expect(registry.standard_entities.find((entity) => entity.id === "MODS-IDENTIFIER-TYPE")?.definition?.cs).toContain("nepovinný xs:string");
  });

  it("keeps generated UUID and assigned URN:NBN mandatory and independent of cataloguing", () => {
    for (const suffix of ["-UUID", "-URNNBN"]) {
      expect(rule(suffix)).toMatchObject({ obligation_code: "M", cataloguing_scope: { applicability: "independent" }, requirement: { presence: "required", cardinality: { min: 1, max: null } } });
      expect(rule(suffix).cataloguing_rules).toBeUndefined();
      expect(rule(suffix).condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
      expect(rule(suffix).requirement.allowed_values).toBeUndefined();
    }
    expect(checks("-UUID")).toContain("@type='uuid'");
    expect(checks("-URNNBN")).toContain("@type='urnnbn'");
    const left = { national_standard: "ndk-monograph", version: "2.3", cataloguing_rules: "aacr2" as const };
    const result = compareRuleContexts(rules, left, { ...left, cataloguing_rules: "rda" });
    expect(result.unmapped.left).toHaveLength(10);
    expect(result.unmapped.right).toHaveLength(10);
    expect(result.unresolved_context.left).toHaveLength(0);
    expect(rules.filter((item) => item.cataloguing_rules?.length === 2)).toHaveLength(8);
  });

  it("bases MA on source availability including cancelled identifiers, not target XML", () => {
    for (const [suffix, field, marc] of [
      ["-CCNB", "ccnb_metadata_available", "015"],
      ["-ISBN", "isbn_metadata_available", "020"],
      ["-ISSN", "issn_metadata_available", "022"],
      ["-ISMN", "ismn_metadata_available", "024"],
    ]) {
      expect(rule(suffix!)).toMatchObject({ obligation_code: "MA", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
      expect(rule(suffix!).condition).toEqual({ all: [...base, eq("element_role", "mods_record"), eq(field!, true)] });
      const text = checks(suffix!);
      for (const token of [marc!, "$a", "$z", "invalid='yes'"]) expect(text).toContain(token);
      expect(rule(suffix!).requirement.allowed_values).toBeUndefined();
    }
    expect(rule("-ISSN").interpretation?.cs).toContain("022$y není");
  });

  it("retains the ISMN indicator and does not turn an expectation about maps into a prohibition", () => {
    expect(rule("-ISMN").normative_requirement.cs).toContain("prvním indikátorem 2");
    expect(checks("-ISMN")).toContain("Nepřevádět každé pole 024");
    expect(rule("-ISMN").non_use).toBeUndefined();
    expect(rule("-ISMN").obligation).toBe("mandatory_if_available");
    expect(rule("-ISMN").interpretation?.cs).toContain("není výslovný zákaz");
  });

  it("records invalid=yes as a prose obligation triggered by source status", () => {
    expect(rule("-INVALID")).toMatchObject({ obligation: "mandatory", obligation_source: "prose", requirement: { presence: "required", cardinality: { min: 1, max: 1 }, allowed_values: ["yes"] } });
    expect(rule("-INVALID").obligation_code).toBeUndefined();
    expect(rule("-INVALID").condition).toEqual({ all: [...base, eq("element_role", "mods_identifier"), eq("identifier_invalid_or_cancelled", true)] });
    expect(checks("-INVALID")).toContain("nikoli existencí cílového atributu");
    expect(rule("-INVALID").interpretation?.cs).toContain("nepovoluje převod neplatných identifikátorů do Dublin Core");
    expect(rule("-INVALID").examples).toBeUndefined();
  });

  it("keeps additional identifiers recommended and links the separately conditional physical-copy requirement", () => {
    expect(rule("-OTHER")).toMatchObject({ obligation_code: "R", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
    expect(rule("-OTHER").requirement.allowed_values).toBeUndefined();
    expect(rule("-OTHER").source.page).toBe(58);
    expect(checks("-OTHER")).toContain("všech pěti");
    const fallback = registry.rule_versions.find((item) => item.rule_id === "NDK-MONO-MODS-SINGLE-PHYSICAL-COPY-IDENTIFIER")!;
    expect(fallback).toMatchObject({ obligation: "mandatory", obligation_source: "prose", condition: { all: expect.arrayContaining([eq("owner_assigns_shelfmarks", false)]) } });
  });

  it("uses all four actual identifiers without inventing missing ISBN, ISSN, ISMN or invalid examples", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(12);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(6);
    for (const example of examples) {
      expect(example).toMatchObject({ kind: "source_excerpt", checked_on: "2026-11-04", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473" });
      expect(example.source_xpath).toContain('mets:dmdSec[@ID="MODSMD_VOLUME_0001"]');
      expect(example.source_xpath).toContain('/mods:identifier[@type=');
    }
    expect(rule().examples!.map((item) => item.code)).toEqual(rule("-TYPE").examples!.map((item) => item.code));
    expect(rule("-URNNBN").examples![0]!.code).toContain("urn:nbn:cz:nk-008m3g");
    for (const suffix of ["-ISBN", "-ISSN", "-ISMN", "-INVALID"]) expect(rule(suffix).examples).toBeUndefined();
  });
});
