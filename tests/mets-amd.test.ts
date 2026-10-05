import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((rule) => rule.category === "structure/mets-amd");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-METS-AMD-${suffix}`)!;

describe("secondary METS, DMF Monografie 2.3", () => {
  it("adds eight source-backed rules without expanding the scope of the main METS rules", () => {
    expect(rules.map((item) => item.rule_id).sort()).toEqual([
      "ADMID", "FILE-ATTRIBUTES", "FILE-GROUP", "FILES", "FILESEC", "FPTR-FILEID", "PAGE-DIV", "STRUCTMAP",
    ].map((suffix) => `NDK-MONO-METS-AMD-${suffix}`).sort());
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", obligation: "mandatory", obligation_source: "prose" });
      expect(item.obligation_code).toBeUndefined();
      expect(item.condition).toMatchObject({ all: expect.arrayContaining([
        { field: "object_type", operator: "equals", value: "monograph" },
        { field: "document_role", operator: "equals", value: "amd_mets" },
      ]) });
      expect(item.source).toMatchObject({ version: "2.3", page: ["STRUCTMAP", "PAGE-DIV", "FPTR-FILEID"].some((suffix) => item.rule_id.endsWith(`AMD-${suffix}`)) ? 98 : 92 });
      expect(item.references).toContainEqual(expect.objectContaining({ version: "1.9.1" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("METS");
      expect(item.implementations).toBeUndefined();
    }
    const main = registry.rule_versions.filter((item) => item.category === "structure/mets-files");
    expect(main).toHaveLength(14);
    expect(main.every((item) => JSON.stringify(item.condition).includes('"main_mets"'))).toBe(true);
  });
  it("keeps the normative single group separate from the four groups in the observed sample", () => {
    const item = rule("FILE-GROUP");
    expect(item.requirement.cardinality).toEqual({ min: 1, max: 1 });
    expect(item.examples![0]!.code.match(/<mets:fileGrp /g)).toHaveLength(4);
    expect(item.examples![0]!.note.cs).toContain("NESOULAD");
    expect(item.discrepancies?.[0]?.cs).toContain("čtyři");
    expect(item.status).toBe("normative");
    expect(rule("FILES").requirement.cardinality).toEqual({ min: 3, max: null });
  });
  it("conditions ADMID on a representation and its own technical record, not on the attribute existing", () => {
    const item = rule("ADMID");
    expect(item.requirement).toMatchObject({ presence: "conditional", cardinality: { min: 1, max: 1 } });
    expect(item.condition).toMatchObject({ all: expect.arrayContaining([
      { field: "file_role", operator: "in", value: ["MC", "ALTO"] },
      { field: "has_own_premis_object_or_mix", operator: "equals", value: true },
    ]) });
    expect(JSON.stringify(item.condition)).not.toContain("@ADMID");
    expect(item.requirement.allowed_values).toBeUndefined();
    expect(item.interpretation?.cs).toContain("nikoli pro počet ID");
  });
  it("preserves evidence of wrong but resolvable ADMID targets without silently repairing the sample", () => {
    const item = rule("ADMID");
    expect(item.examples).toHaveLength(5);
    const example = (suffix: string) => item.examples!.find((entry) => entry.id.endsWith(`-${suffix}`))!;
    expect(example("mc").code).toContain('ADMID="OBJ_002 MIX_002"');
    expect(example("alto").code).toContain('ADMID="OBJ_003"');
    expect(example("premisPS").source_xpath).toContain("[@ID='OBJ_002']");
    expect(example("premisPS").code).toContain("PS_1_00010003_2R");
    expect(example("premisMC").source_xpath).toContain("[@ID='OBJ_003']");
    expect(example("premisMC").code).toContain("MC_1_00010003_2R");
    expect(example("mixPS").code).toContain("image/tiff");
    expect(item.discrepancies?.[0]?.cs).toContain("existující ID");
    expect(item.examples!.every((entry) => entry.file_sha256 === "4a8d9098cb15b621a0dee3fd5501a3eee2b107088dc728dcace2a36f1e2b583f")).toBe(true);
  });
  it("does not copy main-METS group names or invent sequence requirements for ALTO/OCR", () => {
    const item = rule("FILE-ATTRIBUTES");
    expect(item.condition).toMatchObject({ all: expect.arrayContaining([
      { field: "file_role", operator: "in", value: ["MC", "ALTO", "OCR"] },
    ]) });
    expect(JSON.stringify(item.condition)).not.toContain("file_group_id");
    expect(item.requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("U MC navíc vyžadovat SEQ") }));
    expect(item.references).toContainEqual(expect.objectContaining({ page: "90–91" }));
  });
  it("uses a single MONOGRAPH_PAGE div and the corrected FILEID name, not the printed FILEI typo", () => {
    expect(rule("PAGE-DIV").requirement.cardinality).toEqual({ min: 1, max: 1 });
    expect(rule("PAGE-DIV").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("nepřítomnost dalších vnořených div") }));
    expect(rule("STRUCTMAP").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("odmítnout LOGICAL") }));
    expect(rule("FPTR-FILEID").target.entity).toBe("METS-FPTR-FILEID");
    expect(rule("FPTR-FILEID").discrepancies?.[0]?.cs).toContain("FILEI");
    expect(registry.standard_entities.some((entity) => entity.name === "fptr/@FILEI")).toBe(false);
  });
  it("links ADMID to techMD and MIX without claiming new implementation evidence", () => {
    for (const target of ["METS-TECHMD", "MIX"]) expect(registry.relations).toContainEqual(expect.objectContaining({
      from: rule("ADMID").rule_id, to: target, type: "related_to",
    }));
    expect(targetStandardId(rule("ADMID").target.entity, registry.relations)).toBe("METS");
    expect(registry.standard_entities).toContainEqual(expect.objectContaining({ id: "METS-FILE-ADMID", version: "1.9.1" }));
  });
});
