import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "technical/premis-provenance");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-PREMIS-${suffix}`)!;

describe("PREMIS creation and preservation, DMF Monografie 2.3", () => {
  it("adds eight rules with explicit M/R and PREMIS 2.2 source entities", () => {
    expect(rules).toHaveLength(8);
    for (const item of rules) {
      const recommended = item.rule_id.endsWith("PRESERVATION-LEVEL-DATE");
      expect(item).toMatchObject({ version: "2.3", status: "normative", obligation: recommended ? "recommended" : "mandatory", obligation_code: recommended ? "R" : "M" });
      expect(item.obligation_source).toBeUndefined();
      expect(item.implementations).toBeUndefined();
      expect(item.source).toMatchObject({ version: "2.3", page: item.rule_id.includes("PRESERVATION-LEVEL") ? 77 : 78 });
      expect(item.references).toContainEqual(expect.objectContaining({ document: "PREMIS XML Schema", version: "2.2" }));
      expect(registry.standard_entities).toContainEqual(expect.objectContaining({ id: item.target.entity, version: "2.2" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("PREMIS");
      expect(item.condition).toEqual({ all: [
        { field: "object_type", operator: "equals", value: "monograph" },
        { field: "document_role", operator: "equals", value: "amd_mets" },
        { field: "file_role", operator: "in", value: ["MC", "PS", "ALTO"] },
        { field: "premis_object_type", operator: "equals", value: "file" },
      ] });
    }
  });
  it("keeps repeatable mandatory containers and a genuinely recommended assignment date", () => {
    for (const suffix of ["PRESERVATION-LEVEL", "CREATING-APPLICATION"]) {
      expect(rule(suffix).requirement).toMatchObject({ presence: "required", cardinality: { min: 1, max: null } });
    }
    expect(rule("PRESERVATION-LEVEL-DATE").requirement).toMatchObject({ presence: "optional", cardinality: { min: 0, max: 1 } });
    expect(rule("PRESERVATION-LEVEL-DATE").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("RRRR-MM-DD") }));
    expect(rule("CREATION-DATETIME").requirement).toMatchObject({ presence: "required", cardinality: { min: 1, max: 1 } });
    expect(rule("CREATION-DATETIME").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("s uvedenými sekundami") }));
    expect(rule("CREATION-DATETIME").interpretation?.cs).toContain("nezavádí povinné UTC");
  });
  it("maps preservation levels by representation rather than merely accepting either value", () => {
    const item = rule("PRESERVATION-LEVEL-VALUE");
    expect(item.requirement.allowed_values).toEqual(["preservation", "deleted"]);
    expect(item.requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("pro MC a ALTO vyžadovat preservation, pro PS deleted") }));
    expect(item.examples![0]!.code).toContain(">preservation</");
    expect(item.examples![1]!.code).toContain(">deleted</");
    expect(item.interpretation?.cs).toContain("bit-level");
    expect(item.interpretation?.cs).toContain("nikoli příkaz soubor smazat");
  });
  it("does not turn application examples into a software or version vocabulary", () => {
    for (const suffix of ["CREATING-APPLICATION-NAME", "CREATING-APPLICATION-VERSION"]) {
      expect(rule(suffix).requirement.allowed_values).toBeUndefined();
      expect(rule(suffix).requirement.cardinality).toEqual({ min: 1, max: 1 });
    }
    expect(rule("CREATING-APPLICATION").interpretation?.cs).toContain("DMF požaduje jméno, verzi i datum");
    expect(rule("CREATING-APPLICATION-VERSION").interpretation?.cs).toContain("nenahrazuje samostatný povinný prvek");
    const examples = rule("CREATING-APPLICATION").examples!;
    expect(examples).toHaveLength(3);
    for (const [index, id, name] of [[0, "OBJ_003", "Kakadu"], [1, "OBJ_002", "Book Pavilion 6.0.1.0"], [2, "OBJ_004", "ABBYY FineReader Server"]] as const) {
      expect(examples[index]!.source_xpath).toContain(`[@ID='${id}']`);
      expect(examples[index]!.code).toContain(name);
    }
  });
  it("preserves the actual original names, including double extensions, for all three roles", () => {
    const item = rule("ORIGINAL-NAME");
    expect(item.requirement).toMatchObject({ presence: "required", cardinality: { min: 1, max: 1 } });
    expect(item.examples).toHaveLength(3);
    expect(item.discrepancies).toBeUndefined();
    for (const [index, id, name] of [[0, "OBJ_003", "1_00010003_2R.tif.jp2"], [1, "OBJ_002", "1_00010003_2R.tif"], [2, "OBJ_004", "1_00010003_2R.tif.xml"]] as const) {
      expect(item.examples![index]!.source_xpath).toContain(`[@ID='${id}']`);
      expect(item.examples![index]!.code).toContain(`>${name}</premis:originalName>`);
      expect(item.examples![index]!.file_sha256).toBe("4a8d9098cb15b621a0dee3fd5501a3eee2b107088dc728dcace2a36f1e2b583f");
    }
    expect(item.references).toContainEqual(expect.objectContaining({ url: "https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download" }));
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(13);
  });
  it("makes the new group reachable from existing object characteristics and identification", () => {
    for (const [from, to] of [["OBJECT-CHARACTERISTICS", "CREATING-APPLICATION"], ["OBJECT-IDENTIFIER", "PRESERVATION-LEVEL"], ["OBJECT-IDENTIFIER", "ORIGINAL-NAME"]]) {
      expect(registry.relations).toContainEqual(expect.objectContaining({ from: `NDK-MONO-PREMIS-${from}`, to: `NDK-MONO-PREMIS-${to}`, type: "related_to" }));
    }
  });
});
