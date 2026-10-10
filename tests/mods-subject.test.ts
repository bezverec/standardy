import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-subject");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-SUBJECT${suffix ? "-" + suffix : ""}`)!;
const eq = (field: string, value: string) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const check = (id: string, text: string) => expect(rule(id).requirement.validations).toContainEqual(expect.objectContaining({ type: "custom", expression: expect.stringContaining(text) }));

describe("MODS subject, DMF Monografie 2.3", () => {
  it("records seven recommendations with verified sources and distinct entities", () => {
    expect(rules).toHaveLength(7);
    expect(new Set(rules.map((item) => item.target.entity)).size).toBe(7);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", obligation: "recommended", obligation_code: "R", verification: { status: "verified", date: "2026-10-10" } });
      expect(item.requirement).toMatchObject({ presence: "optional", cardinality: { min: 0 } });
      expect(item.cataloguing_rules).toEqual(["aacr2", "rda"]);
      expect(item.cataloguing_scope).toMatchObject({ applicability: "applicable", reviewed_on: "2026-10-10" });
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_scope?.sources.some((source) => source.page === 24)).toBe(true);
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
      expect(item.implementations).toBeUndefined();
    }
    for (const id of ["", "AUTHORITY", "TOPIC", "TOPIC-VALUE-URI", "GEOGRAPHIC"]) expect(rule(id).source.page).toBe(55);
    for (const id of ["GEOGRAPHIC-VALUE-URI", "TEMPORAL"]) expect(rule(id).source.page).toBe(56);
  });

  it("scopes cardinality to the specific parent without requiring all subject children", () => {
    const roles: Record<string, string> = { "": "mods_record", AUTHORITY: "mods_subject", TOPIC: "mods_subject", GEOGRAPHIC: "mods_subject", TEMPORAL: "mods_subject", "TOPIC-VALUE-URI": "mods_subject_topic", "GEOGRAPHIC-VALUE-URI": "mods_subject_geographic" };
    for (const [suffix, role] of Object.entries(roles)) {
      expect(rule(suffix).condition).toEqual({ all: [...base, eq("element_role", role)] });
      expect(rule(suffix).requirement.cardinality).toEqual({ min: 0, max: suffix === "AUTHORITY" || suffix.endsWith("URI") ? 1 : null });
      expect(rule(suffix).interpretation?.cs).toContain("ne relatedItem, stránce či titulu vícesvazku");
    }
    check("", "Nevyžadovat současně topic, geographic a temporal");
    check("", "Absence subject není porušením povinné přítomnosti");
  });

  it("preserves the national authority list without presenting it as a MODS enum", () => {
    expect(rule("AUTHORITY").requirement.allowed_values).toEqual(["czenas", "eczenas", "Konspekt", "czmesh", "mednas", "msvkth", "agrovoc"]);
    check("AUTHORITY", "6XX$2");
    check("AUTHORITY", "není porušením M ani neplatností MODS");
    expect(rule("AUTHORITY").interpretation?.cs).toContain("není automaticky autoritou rodiče");
    expect(registry.standard_entities.find((item) => item.id === "MODS-SUBJECT-AUTHORITY")?.definition?.cs).toContain("bez výčtu hodnot");
  });

  it("distinguishes topics, geography and temporal subjects from other metadata roles", () => {
    check("TOPIC", "MARC 650 či 072$x");
    check("GEOGRAPHIC", "MARC 651");
    check("GEOGRAPHIC", "s místem vydání");
    check("TEMPORAL", "MARC 648");
    check("TEMPORAL", "s datem vydání ani životními daty osoby");
    check("TEMPORAL", "ani automaticky formát ISO data");
    expect(rule("GEOGRAPHIC").interpretation?.cs).toContain("není geographicCode");
    expect(registry.standard_entities.find((item) => item.id === "MODS-SUBJECT-TEMPORAL")?.definition?.cs).toContain("nikoli povinný xs:date");
  });

  it("does not turn recommended authority links or printed examples into mandatory URI patterns", () => {
    for (const suffix of ["TOPIC-VALUE-URI", "GEOGRAPHIC-VALUE-URI"]) {
      expect(rule(suffix).requirement.allowed_values).toBeUndefined();
      expect(rule(suffix).requirement.validations).not.toEqual(expect.arrayContaining([expect.objectContaining({ type: "regex" })]));
      check(suffix, "https://aleph.nkp.cz/dai/číslo_autority");
      check(suffix, "není univerzální hodnota");
      check(suffix, "Samotné HTTP 200");
      expect(rule(suffix).examples).toBeUndefined();
      expect(rule(suffix).interpretation?.cs).toContain("authorityURI slovník");
    }
    expect(rule("GEOGRAPHIC-VALUE-URI").interpretation?.cs).toContain("nejde o valueURI následujícího cartographics");
  });

  it("includes the same requirements in both regimes without inventing comparison keys", () => {
    const selection = { national_standard: "ndk-monograph", version: "2.3" };
    const result = compareRuleContexts(rules, { ...selection, cataloguing_rules: "aacr2" }, { ...selection, cataloguing_rules: "rda" });
    expect(result.unmapped.left).toHaveLength(7);
    expect(result.unmapped.right).toEqual(result.unmapped.left);
    expect(result.comparisons).toEqual([]);
    expect(result.excluded_context).toEqual({ left: [], right: [] });
    expect(result.unresolved_context).toEqual({ left: [], right: [] });
  });

  it("preserves observed complex subjects and missing attributes without fabricating temporal data", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(5);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(4);
    expect(rule("TEMPORAL").examples).toBeUndefined();
    expect(rule("").examples![0]!.code).toBe(rule("AUTHORITY").examples![0]!.code);
    expect(rule("").examples![1]!.code).toContain('<mods:geographicCode authority="marcgac">n-us---</mods:geographicCode>');
    expect(rule("").examples![1]!.code).not.toContain('subject authority=');
    expect(rule("TOPIC").examples![0]!.code).not.toContain("valueURI");
    expect(rule("GEOGRAPHIC").examples![0]!.code).not.toContain("valueURI");
    for (const item of examples) {
      expect(item.file_sha256).toBe("7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473");
      expect(item.source_xpath).toContain('dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:subject');
      expect(item.note.cs).toContain("descriptionStandard=aacr");
      expect(item.checked_on).toBe("2026-10-10");
    }
  });
});
