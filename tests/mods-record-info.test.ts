import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-record-info");
const rule = (suffix: string) => rules.find((item) => item.rule_id === "NDK-MONO-MODS-SINGLE-" + suffix)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const checks = (suffix: string) => JSON.stringify(rule(suffix).requirement.validations);

describe("MODS recordInfo, DMF Monografie 2.3", () => {
  it("keeps bibliographic provenance scoped to direct single-volume records", () => {
    expect(rules).toHaveLength(15);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", verification: { status: "verified", date: "2026-11-03" }, cataloguing_scope: { applicability: "applicable" }, cataloguing_rules: ["aacr2", "rda"] });
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_scope?.sources.some((source) => source.page === 24)).toBe(true);
      expect(item.condition).toMatchObject({ all: expect.arrayContaining(base) });
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.comparison).toBeUndefined();
      expect(item.implementations).toBeUndefined();
    }
    expect(rule("RECORD-INFO").condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
  });

  it("preserves AACR XML spelling and RDA precedence instead of a free choice of two values", () => {
    const item = rule("DESCRIPTION-STANDARD");
    expect(item).toMatchObject({ obligation_code: "M", requirement: { presence: "required", allowed_values: ["aacr", "rda"] } });
    expect(checks("DESCRIPTION-STANDARD")).toContain("040$e");
    expect(checks("DESCRIPTION-STANDARD")).toContain("LDR/18");
    expect(checks("DESCRIPTION-STANDARD")).toContain("nesmí přepsat pozitivní údaj RDA");
    expect(checks("DESCRIPTION-STANDARD")).toContain("potřebu posouzení");
    expect(item.condition).toEqual({ all: [...base, eq("element_role", "mods_record_info")] });
  });

  it("uses the continuation on page 59 for the last modifying institution and keeps R optional", () => {
    const item = rule("RECORD-CONTENT-SOURCE");
    expect(item.source.page).toBe("58–59");
    expect(item).toMatchObject({ obligation_code: "R", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
    expect(checks("RECORD-CONTENT-SOURCE")).toContain("poslední 040$d");
    expect(checks("RECORD-CONTENT-SOURCE")).toContain("pouze pokud 040$d chybí");
    expect(checks("RECORD-CONTENT-SOURCE")).toContain("040$a");
    expect(item.requirement.allowed_values).toBeUndefined();
    expect(rule("RECORD-CONTENT-SOURCE-AUTHORITY").requirement.allowed_values).toEqual(["siglaADR"]);
  });

  it("separates available change dates from mandatory encoding on each supplied date", () => {
    expect(rule("RECORD-CHANGE-DATE")).toMatchObject({ obligation_code: "MA", requirement: { presence: "required" } });
    expect(rule("RECORD-CHANGE-DATE").condition).toEqual({ all: [...base, eq("element_role", "mods_record_info"), eq("record_change_date_available", true)] });
    expect(rule("RECORD-CREATION-DATE").condition).toEqual({ all: [...base, eq("element_role", "mods_record_info")] });
    for (const [id, role] of [["RECORD-CREATION-DATE", "mods_record_creation_date"], ["RECORD-CHANGE-DATE", "mods_record_change_date"]]) {
      const encoding = rule(id! + "-ENCODING");
      expect(encoding).toMatchObject({ obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: 1 }, allowed_values: ["iso8601"] } });
      expect(encoding.condition).toEqual({ all: [...base, eq("element_role", role!)] });
      expect(rule(id!).requirement.cardinality).toMatchObject({ max: null });
      expect(checks(id!)).toContain("minut");
      expect(rule(id!).requirement.validations).toEqual([{ type: "custom", expression: expect.any(String) }]);
    }
    expect(checks("RECORD-CREATION-DATE")).toContain("nevynucovat sekundy ani Z");
    expect(checks("RECORD-CREATION-DATE")).toContain("nedoplňovat neznámý čas nulami");
  });

  it("distinguishes record identity from resource identity and does not hardcode the sample institution", () => {
    expect(checks("RECORD-IDENTIFIER")).toContain("001");
    expect(checks("RECORD-IDENTIFIER")).toContain("počátečních nul");
    expect(checks("RECORD-IDENTIFIER-SOURCE")).toContain("003");
    expect(rule("RECORD-IDENTIFIER-SOURCE").condition).toEqual({ all: [...base, eq("element_role", "mods_record_identifier")] });
    for (const id of ["RECORD-IDENTIFIER", "RECORD-IDENTIFIER-SOURCE"]) {
      expect(rule(id).obligation_code).toBe("R");
      expect(rule(id).requirement.allowed_values).toBeUndefined();
    }
    expect(rule("RECORD-IDENTIFIER").target.entity).not.toBe("MODS-IDENTIFIER");
  });

  it("retains the DMF origin values without narrowing the generic MODS entity", () => {
    expect(rule("RECORD-ORIGIN")).toMatchObject({ obligation_code: "R", requirement: { presence: "optional", allowed_values: ["machine generated", "human prepared"] } });
    expect(registry.standard_entities.find((item) => item.id === "MODS-RECORD-ORIGIN")?.definition?.cs).toContain("neomezuje text");
  });

  it("requires the term only inside a used catalogue-language parent and preserves R for its attributes", () => {
    expect(rule("CATALOGUING-LANGUAGE")).toMatchObject({ obligation_code: "R", requirement: { presence: "optional" } });
    const term = rule("CATALOGUING-LANGUAGE-TERM");
    expect(term).toMatchObject({ obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    expect(term.condition).toEqual({ all: [...base, eq("element_role", "mods_language_of_cataloging")] });
    expect(checks("CATALOGUING-LANGUAGE-TERM")).toContain("040$b");
    expect(term.requirement.allowed_values).toBeUndefined();
    for (const [suffix, value] of [["AUTHORITY", "iso639-2b"], ["TYPE", "code"]]) {
      const item = rule("CATALOGUING-LANGUAGE-TERM-" + suffix);
      expect(item).toMatchObject({ obligation_code: "R", requirement: { presence: "optional", cardinality: { min: 0, max: 1 }, allowed_values: [value] } });
      expect(item.condition).toEqual({ all: [...base, eq("element_role", "mods_cataloguing_language_term")] });
      expect(registry.rule_versions.find((other) => other.rule_id === "NDK-MONO-MODS-SINGLE-LANGUAGE-TERM-" + suffix)?.obligation_code).toBe("M");
    }
  });

  it("exports actual recordInfo evidence with provenance and no claim to source MARC or RDA validation", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(15);
    for (const example of examples) {
      expect(example).toMatchObject({ kind: "source_excerpt", checked_on: "2026-11-03", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473" });
      expect(example.source_xpath).toContain('mets:dmdSec[@ID="MODSMD_VOLUME_0001"]');
      expect(example.source_xpath).toContain("/mods:recordInfo");
      expect(example.note.cs).toContain("Původní MARC");
    }
    expect(rule("RECORD-INFO").examples![0]!.code).toContain("2010-12-02T10:35:03Z");
    expect(rule("DESCRIPTION-STANDARD").examples![0]!.code).toContain(">aacr<");
    expect(rule("CATALOGUING-LANGUAGE-TERM-TYPE").examples![0]!.code).toBe(rule("CATALOGUING-LANGUAGE-TERM").examples![0]!.code);
  });
});
