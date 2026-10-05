import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "technical/premis-relationships");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-PREMIS-${suffix}`)!;

describe("PREMIS object relationships, DMF Monografie 2.3", () => {
  it("keeps ten MC/ALTO rules separate from three direct PS event-link rules", () => {
    expect(rules).toHaveLength(13);
    for (const item of rules) {
      const ps = item.rule_id.startsWith("NDK-MONO-PREMIS-LINKING-");
      const recommended = item.rule_id.endsWith("RELATED-EVENT-SEQUENCE");
      expect(item).toMatchObject({ version: "2.3", status: "normative", obligation: recommended ? "recommended" : "mandatory", obligation_code: recommended ? "R" : "M" });
      expect(item.implementations).toBeUndefined();
      expect(item.obligation_source).toBeUndefined();
      expect(item.condition).toEqual({ all: [
        { field: "object_type", operator: "equals", value: "monograph" },
        { field: "document_role", operator: "equals", value: "amd_mets" },
        { field: "file_role", operator: "in", value: ps ? ["PS"] : ["MC", "ALTO"] },
        { field: "premis_object_type", operator: "equals", value: "file" },
      ] });
      expect(item.source).toMatchObject({ version: "2.3" });
      expect(item.references).toContainEqual(expect.objectContaining({ document: "PREMIS XML Schema", version: "2.2" }));
      expect(registry.standard_entities).toContainEqual(expect.objectContaining({ id: item.target.entity, version: "2.2" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("PREMIS");
    }
  });
  it("preserves repeated containers, required pairs and the recommended sequence", () => {
    for (const suffix of ["RELATIONSHIP", "RELATED-OBJECT", "RELATED-EVENT", "LINKING-EVENT"]) {
      expect(rule(suffix).requirement).toMatchObject({ presence: "required", cardinality: { min: 1, max: null } });
    }
    for (const suffix of ["RELATED-OBJECT-TYPE", "RELATED-OBJECT-VALUE", "RELATED-EVENT-TYPE", "RELATED-EVENT-VALUE", "LINKING-EVENT-TYPE", "LINKING-EVENT-VALUE"]) {
      expect(rule(suffix).requirement.cardinality).toEqual({ min: 1, max: 1 });
    }
    const sequence = rule("RELATED-EVENT-SEQUENCE");
    expect(sequence.requirement).toMatchObject({ presence: "optional", cardinality: { min: 0, max: 1 } });
    expect(sequence.requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("xs:nonNegativeInteger") }));
    expect(sequence.examples).toBeUndefined();
    expect(sequence.discrepancies).toBeUndefined();
  });
  it("does not convert recommended relationship names or identifier examples into closed enums", () => {
    for (const item of rules) expect(item.requirement.allowed_values).toBeUndefined();
    expect(rule("RELATIONSHIP-TYPE").interpretation?.cs).toContain("doporučené hodnoty nejsou uzavřeným číselníkem");
    expect(rule("RELATIONSHIP-SUBTYPE").interpretation?.cs).toContain("od odvozeného objektu ke zdroji");
    expect(rule("RELATED-EVENT-TYPE").interpretation?.cs).toContain("není eventType");
    expect(rule("RELATED-OBJECT-VALUE").interpretation?.cs).toContain("RelObjectXmlID");
  });
  it("preserves ALTO pointing to MC without silently relabelling the target as PS", () => {
    const item = rule("RELATED-OBJECT");
    expect(item.examples).toHaveLength(3);
    expect(item.examples![0]!.code).toContain("PS_1_00010003_2R");
    expect(item.examples![1]!.code).toContain("MC_1_00010003_2R");
    expect(item.examples![1]!.source_xpath).toContain("[@ID='OBJ_004']");
    expect(item.examples![2]!.source_xpath).toContain("[@ID='OBJ_002']");
    expect(item.discrepancies![0]!.cs).toContain("nepřímé cesty ALTO → MC → PS nebyl potvrzen");
    expect(item.interpretation?.cs).toContain("Uchovaný záznam smazaného PS");
  });
  it("keeps nested PS relationship evidence distinct from missing direct event links", () => {
    const item = rule("LINKING-EVENT");
    expect(item.examples).toHaveLength(1);
    expect(item.examples![0]!.source_xpath).toContain("[@ID='OBJ_002']");
    expect(item.examples![0]!.source_xpath).toMatch(/premis:relationship$/);
    expect(item.examples![0]!.code).toContain("postprocessingdata_001");
    expect(item.examples![0]!.code).toContain("postprocessingdata_002");
    expect(item.examples![0]!.code).not.toContain("<premis:linkingEventIdentifier");
    expect(item.examples![0]!.note.cs).toContain("Z výřezu samotného nelze absenci");
    expect(item.discrepancies![0]!.cs).toContain("nulový počet přímých potomků");
    expect(item.requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("Dva duplicitní či nesouvisející odkazy nestačí") }));
    expect(rule("LINKING-EVENT-TYPE").examples).toBeUndefined();
    expect(rule("LINKING-EVENT-VALUE").examples).toBeUndefined();
  });
  it("retains event identifier evidence and makes new relations reachable from existing rules", () => {
    const item = rule("RELATED-EVENT");
    expect(item.examples![0]!.code).toContain("mastercopy_001");
    expect(item.examples![1]!.code).toContain("mastercopy_001");
    expect(item.examples![1]!.source_xpath).toContain("mets:digiprovMD");
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(14);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(10);
    for (const [from, to] of [["OBJECT-IDENTIFIER", "RELATIONSHIP"], ["PRESERVATION-LEVEL-VALUE", "LINKING-EVENT"]]) {
      expect(registry.relations).toContainEqual(expect.objectContaining({ from: `NDK-MONO-PREMIS-${from}`, to: `NDK-MONO-PREMIS-${to}`, type: "related_to" }));
    }
  });
});
