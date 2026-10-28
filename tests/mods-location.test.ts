import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-location");
const rule = (suffix: string) => rules.find((item) => item.rule_id === "NDK-MONO-MODS-SINGLE-" + suffix)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];

describe("MODS location, DMF Monografie 2.3", () => {
  it("scopes seven sourced requirements to direct single-volume descriptive metadata", () => {
    expect(rules).toHaveLength(7);
    for (const item of rules) {
      expect(item).toMatchObject({
        version: "2.3", status: "normative",
        source: { document: "DMF Monografie", version: "2.3", page: 58 },
        verification: { status: "verified", date: "2026-10-28" },
        cataloguing_scope: { applicability: "applicable", reviewed_on: "2026-10-28" },
        cataloguing_rules: ["aacr2", "rda"],
      });
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_scope?.sources.some((source) => source.page === 24)).toBe(true);
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.condition).toMatchObject({ all: expect.arrayContaining(base) });
      expect(item.comparison).toBeUndefined();
      expect(item.implementations).toBeUndefined();
    }
  });

  it("conditions MA on available source data, not the existence of the target node", () => {
    for (const [id, role, field] of [
      ["LOCATION", "mods_record", "location_metadata_available"],
      ["SHELF-LOCATOR", "mods_location", "shelf_locator_metadata_available"],
    ]) {
      expect(rule(id!)).toMatchObject({
        obligation: "mandatory_if_available", obligation_code: "MA",
        requirement: { presence: "required", cardinality: { min: 1, max: null } },
      });
      expect(rule(id!).condition).toEqual({ all: [...base, eq("element_role", role!), eq(field!, true)] });
    }
  });

  it("requires one physical location per used parent without making the parent unconditional", () => {
    expect(rule("PHYSICAL-LOCATION")).toMatchObject({
      obligation: "mandatory", obligation_code: "M",
      requirement: { presence: "required", cardinality: { min: 1, max: 1 } },
    });
    expect(rule("PHYSICAL-LOCATION").condition).toEqual({ all: [...base, eq("element_role", "mods_location")] });
    expect(rule("PHYSICAL-LOCATION").requirement.allowed_values).toBeUndefined();
    expect(rule("LOCATION").obligation_code).toBe("MA");
    expect(registry.standard_entities.find((item) => item.id === "MODS-PHYSICAL-LOCATION")?.definition?.cs).toContain("0..n");
  });

  it("uses authority rather than type and distinguishes authority codes from institution codes", () => {
    const item = rule("PHYSICAL-LOCATION-AUTHORITY");
    expect(item.target.entity).toBe("MODS-PHYSICAL-LOCATION-AUTHORITY");
    expect(item.requirement.allowed_values).toEqual(["siglaADR", "ICO", "NARP"]);
    expect(item.requirement.cardinality).toEqual({ min: 1, max: 1 });
    expect(item.condition).toEqual({ all: [...base, eq("element_role", "mods_physical_location")] });
    expect(item.interpretation?.cs).toContain("changelog");
    expect(item.interpretation?.cs).toContain("Nepřidává se zákaz type");
  });

  it("keeps the physical-copy fallback independent of a missing XML shelfLocator", () => {
    const item = rule("PHYSICAL-COPY-IDENTIFIER");
    expect(item).toMatchObject({ obligation: "mandatory", obligation_source: "prose", requirement: { presence: "required" } });
    expect(item.obligation_code).toBeUndefined();
    expect(item.condition).toEqual({ all: [...base, eq("element_role", "mods_record"), eq("owner_assigns_shelfmarks", false)] });
    expect(item.requirement.allowed_values).toBeUndefined();
    expect(item.requirement.cardinality).toBeUndefined();
    const text = JSON.stringify(item.requirement.validations);
    expect(text).toContain("fyzického exempláře");
    expect(text).toContain("ISBN");
    expect(item.interpretation?.cs).toContain("nepřikazuje tento jediný způsob zápisu");
    expect(item.examples).toBeUndefined();
  });

  it("keeps url and its note optional without inventing URL or note vocabularies", () => {
    for (const id of ["LOCATION-URL", "LOCATION-URL-NOTE"]) {
      expect(rule(id)).toMatchObject({ obligation: "optional", obligation_code: "O", requirement: { presence: "optional" } });
      expect(rule(id).requirement.allowed_values).toBeUndefined();
      expect(rule(id).examples).toBeUndefined();
    }
    expect(rule("LOCATION-URL").requirement.cardinality).toEqual({ min: 0, max: null });
    expect(rule("LOCATION-URL-NOTE").requirement.cardinality).toEqual({ min: 0, max: 1 });
    expect(rule("LOCATION-URL-NOTE").condition).toEqual({ all: [...base, eq("element_role", "mods_location_url")] });
  });

  it("preserves four actual excerpts without claiming they demonstrate other identifier systems", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(4);
    for (const example of examples) {
      expect(example).toMatchObject({ kind: "source_excerpt", checked_on: "2026-10-28", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473" });
      expect(example.source_xpath).toContain('mets:dmdSec[@ID="MODSMD_VOLUME_0001"]');
      expect(example.source_xpath).toContain("/mods:location");
    }
    expect(rule("PHYSICAL-LOCATION-AUTHORITY").examples![0]!.code).toBe(rule("PHYSICAL-LOCATION").examples![0]!.code);
    expect(rule("PHYSICAL-LOCATION").examples![0]!.code).toContain('authority="siglaADR">ABA001');
    expect(rule("SHELF-LOCATOR").examples![0]!.code).toContain("54 H 001617");
  });
});
