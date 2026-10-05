import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "technical/premis-object");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-PREMIS-${suffix}`)!;

describe("PREMIS Object, DMF Monografie 2.3 / PREMIS 2.2", () => {
  it("records 17 explicitly mandatory rules scoped to MC, PS and ALTO file objects", () => {
    expect(rules).toHaveLength(17);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", obligation: "mandatory", obligation_code: "M" });
      expect(item.obligation_source).toBeUndefined();
      expect(item.implementations).toBeUndefined();
      expect(item.requirement.presence).toBe("required");
      expect(item.condition).toEqual({ all: [
        { field: "object_type", operator: "equals", value: "monograph" },
        { field: "document_role", operator: "equals", value: "amd_mets" },
        { field: "file_role", operator: "in", value: ["MC", "PS", "ALTO"] },
        { field: "premis_object_type", operator: "equals", value: "file" },
      ] });
      expect(item.source).toMatchObject({ document: "DMF Monografie", version: "2.3" });
      expect(item.references).toContainEqual(expect.objectContaining({ document: "PREMIS XML Schema", version: "2.2" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("PREMIS");
      expect(registry.standard_entities).toContainEqual(expect.objectContaining({ id: item.target.entity, version: "2.2", namespace: "info:lc/xmlns/premis-v2" }));
    }
  });
  it("retains repeatable containers while M overrides the optionality of the general XSD", () => {
    const repeated = new Set(["OBJECT-IDENTIFIER", "OBJECT-CHARACTERISTICS", "FIXITY", "FORMAT"]);
    for (const item of rules) expect(item.requirement.cardinality).toEqual({
      min: 1, max: repeated.has(item.rule_id.replace("NDK-MONO-PREMIS-", "")) ? null : 1,
    });
    expect(rule("FIXITY").references).toContainEqual(expect.objectContaining({ section: expect.stringContaining("0–n") }));
    for (const suffix of ["SIZE", "DIGEST-ORIGINATOR", "FORMAT-VERSION"]) {
      expect(rule(suffix).references).toContainEqual(expect.objectContaining({ section: expect.stringContaining("0–1") }));
    }
  });
  it("does not turn illustrative algorithms, identifiers or levels into closed vocabularies", () => {
    for (const suffix of ["DIGEST-ALGORITHM", "OBJECT-IDENTIFIER-TYPE", "COMPOSITION-LEVEL", "FORMAT-NAME", "FORMAT-VERSION", "FORMAT-REGISTRY-KEY"]) {
      expect(rule(suffix).requirement.allowed_values).toBeUndefined();
    }
    expect(rule("COMPOSITION-LEVEL").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("xs:nonNegativeInteger") }));
    expect(rule("DIGEST-ALGORITHM").interpretation?.cs).toContain("nikoli výhradní hodnota");
    expect(rule("MESSAGE-DIGEST").interpretation?.cs).toContain("není univerzální 32místný");
    expect(rule("FORMAT-REGISTRY-NAME").requirement.allowed_values).toEqual(["PRONOM"]);
    expect(rule("FORMAT-REGISTRY-KEY").interpretation?.cs).toContain("nebyla nezávisle ověřena");
  });
  it("requires both designation and registry without limiting the number of ALTO formats", () => {
    expect(rule("FORMAT").requirement.cardinality).toEqual({ min: 1, max: null });
    expect(rule("FORMAT-DESIGNATION").interpretation?.cs).toContain("současně formatDesignation i formatRegistry");
    expect(rule("FORMAT-VERSION").references).toContainEqual(expect.objectContaining({ section: expect.stringContaining("xs:string") }));
    const alto = rule("FORMAT").examples![1]!;
    expect(alto.source_xpath).toContain("[@ID='OBJ_004']");
    expect(alto.code).toContain("text/xml");
    expect(alto.code.match(/<premis:format /g)).toHaveLength(1);
    expect(alto.note.cs).toContain("nikoli povinnost");
  });
  it("preserves 18 exact source excerpts and documents historical PS checks separately", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(18);
    for (const item of rules) {
      expect(item.examples![0]!.source_xpath).toContain("[@ID='OBJ_003']");
      expect(item.examples![0]!.file_sha256).toBe("4a8d9098cb15b621a0dee3fd5501a3eee2b107088dc728dcace2a36f1e2b583f");
    }
    expect(rule("OBJECT-IDENTIFIER").examples![0]!.code).toContain("MC_1_00010003_2R");
    expect(rule("SIZE").examples![0]!.code).toContain(">3523405</");
    expect(rule("MESSAGE-DIGEST").examples![0]!.code).toContain("2f6a5856f32ad60c5e68989beafbdef8");
    expect(rule("MESSAGE-DIGEST").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("u nedostupného historického PS") }));
    expect(rule("SIZE").interpretation?.cs).toContain("uchovaný historický údaj");
  });
  it("connects PREMIS to METS checksum, size and ADMID without reclassifying METS", () => {
    for (const [suffix, target] of [["MESSAGE-DIGEST", "CHECKSUM"], ["SIZE", "FILE-SIZE"], ["OBJECT-IDENTIFIER", "AMD-ADMID"]]) {
      expect(registry.relations).toContainEqual(expect.objectContaining({ from: `NDK-MONO-PREMIS-${suffix}`, to: `NDK-MONO-METS-${target}`, type: "related_to" }));
    }
    const admid = registry.rule_versions.find((item) => item.rule_id === "NDK-MONO-METS-AMD-ADMID")!;
    expect(targetStandardId(admid.target.entity, registry.relations)).toBe("METS");
    expect(registry.relations).toContainEqual(expect.objectContaining({ from: admid.rule_id, to: rule("OBJECT-IDENTIFIER").rule_id, type: "related_to" }));
  });
});
