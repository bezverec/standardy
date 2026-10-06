import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-names");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-${suffix}`)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const name = [...base, eq("element_role", "mods_contributor_name")];

describe("MODS named contributors and roles of a single-volume monograph, DMF 2.3", () => {
  it("classifies nine sourced rules under MODS without claiming implemented validators", () => {
    expect(rules).toHaveLength(9);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { document: "DMF Monografie", version: "2.3" } });
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(item.implementations).toBeUndefined();
      expect(item.validator_behaviour).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("keeps the single-volume scope and independent source availability", () => {
    expect(rule("NAME").condition).toEqual({ all: [...base, eq("element_role", "mods_record"), eq("contributor_metadata_available", true)] });
    for (const item of rules) {
      expect(item.condition).toEqual(expect.objectContaining({ all: expect.arrayContaining(base) }));
      expect(item.interpretation?.cs).toContain("ne subject, relatedItem, originInfo nebo PREMIS Agent");
      expect(item.interpretation?.cs).toContain("neznámá hodnota není false");
    }
    for (const [suffix, field] of [["NAME-TYPE", "contributor_type_available"], ["NAME-PART", "contributor_name_available"], ["NAME-IDENTIFIER", "national_authority_id_available"], ["ROLE", "contributor_role_available"]]) {
      expect(rule(suffix!).condition).toEqual({ all: [...name, eq(field!, true)] });
    }
  });
  it("preserves five MA, one O and three M", () => {
    expect(rules.filter((item) => item.obligation_code === "MA")).toHaveLength(5);
    expect(rules.filter((item) => item.obligation_code === "O")).toHaveLength(1);
    expect(rules.filter((item) => item.obligation_code === "M")).toHaveLength(3);
    for (const item of rules.filter((item) => item.obligation_code === "MA")) expect(item.obligation).toBe("mandatory_if_available");
  });
  it("keeps the type vocabulary distinct from optional primary usage and author role", () => {
    expect(rule("NAME-TYPE").requirement.allowed_values).toEqual(["personal", "corporate", "conference", "family"]);
    expect(rule("NAME-USAGE")).toMatchObject({ obligation: "optional", requirement: { presence: "optional", cardinality: { min: 0, max: 1 }, allowed_values: ["primary"] } });
    expect(rule("NAME-USAGE").condition).toEqual({ all: name });
    expect(rule("NAME-USAGE").interpretation?.cs).toContain("Primární jméno, role aut a typ personal jsou tři odlišné údaje");
  });
  it("does not invent name parts, etal requirements or numeric authority constraints", () => {
    expect(rule("NAME-PART").interpretation?.cs).toContain("Nevyžaduje namePart v samostatném name s etal");
    expect(rule("NAME-PART").interpretation?.cs).toContain("včetně RA");
    expect(rule("NAME-IDENTIFIER").requirement.allowed_values).toBeUndefined();
    expect(rule("NAME-IDENTIFIER").requirement.validations).toEqual([expect.objectContaining({ type: "custom" })]);
    expect(rule("NAME-IDENTIFIER").interpretation?.cs).toContain("textový identifikátor");
    expect(rule("NAME-IDENTIFIER").interpretation?.cs).toContain("Autoritní služba nebyla dotazována");
  });
  it("requires role children without a second availability gate", () => {
    expect(rule("ROLE").obligation_code).toBe("MA");
    expect(rule("ROLE-TERM").condition).toEqual({ all: [...base, eq("element_role", "mods_contributor_role")] });
    expect(rule("ROLE-TERM").requirement.cardinality).toEqual({ min: 1, max: null });
    for (const suffix of ["ROLE-TERM-TYPE", "ROLE-TERM-AUTHORITY"]) {
      expect(rule(suffix).condition).toEqual({ all: [...base, eq("element_role", "mods_contributor_role_term")] });
      expect(rule(suffix).requirement.cardinality).toEqual({ min: 1, max: 1 });
    }
  });
  it("uses the full external relator vocabulary rather than an aut-only enum", () => {
    expect(rule("ROLE-TERM").requirement.allowed_values).toBeUndefined();
    for (const suffix of ["ROLE", "ROLE-TERM", "ROLE-TERM-TYPE", "ROLE-TERM-AUTHORITY"]) expect(rule(suffix).references).toContainEqual(expect.objectContaining({ document: "MARC Code List for Relators", url: "https://www.loc.gov/marc/relators/relaterm.html" }));
    expect(rule("ROLE-TERM-TYPE").requirement.allowed_values).toEqual(["code"]);
    expect(rule("ROLE-TERM-AUTHORITY").requirement.allowed_values).toEqual(["marcrelator"]);
  });
  it("defines nine MODS 3.8 targets with unqualified attributes", () => {
    const ids = new Set(rules.map((item) => item.target.entity));
    expect(ids.size).toBe(9);
    for (const id of ids) {
      const entity = registry.standard_entities.find((item) => item.id === id)!;
      expect(entity).toMatchObject({ version: "3.8", status: "normative" });
      if (entity.type === "attribute") expect(entity.namespace).toBeUndefined();
      else expect(entity.namespace).toBe("http://www.loc.gov/mods/v3");
    }
  });
  it("ships nine source-anchored excerpts without inventing expanded given names", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(9);
    for (const item of rules) {
      expect(item.examples).toHaveLength(1);
      expect(item.examples![0]).toMatchObject({ kind: "source_excerpt", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473" });
      expect(item.examples![0]!.source_xpath).toContain('mets:dmdSec[@ID="MODSMD_VOLUME_0001"]');
    }
    expect(rule("NAME-PART").examples![0]!.code).toContain("Mařík, J.");
    expect(rule("NAME-IDENTIFIER").examples![0]!.code).toContain("jx20101005005");
    expect(rule("ROLE-TERM").examples![0]!.code).toContain('authority="marcrelator" type="code">aut</mods:roleTerm>');
  });
  it("connects names, titles, the METS payload and role constraints", () => {
    for (const to of ["NDK-MONO-MODS-SINGLE-TITLEINFO", "NDK-MONO-METS-DMD-XMLDATA", "NDK-MONO-MODS-SINGLE-ROLE"]) expect(registry.relations).toContainEqual(expect.objectContaining({ from: "NDK-MONO-MODS-SINGLE-NAME", to, type: "related_to" }));
    for (const suffix of ["ROLE-TERM-TYPE", "ROLE-TERM-AUTHORITY"]) expect(registry.relations).toContainEqual(expect.objectContaining({ from: "NDK-MONO-MODS-SINGLE-ROLE-TERM", to: `NDK-MONO-MODS-SINGLE-${suffix}`, type: "related_to" }));
  });
});
