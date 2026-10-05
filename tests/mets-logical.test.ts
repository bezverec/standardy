import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "structure/mets-logical");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-METS-LOGICAL-${suffix}`)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets")];
const logical = [...base, eq("structmap_type", "LOGICAL")];
const simple = [...logical, eq("logical_description_mode", "no_internal_parts")];

describe("main METS logical structure and page links, DMF 2.3", () => {
  it("keeps ten sourced prose rules separate from tool implementations", () => {
    expect(rules).toHaveLength(10);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", obligation: "mandatory", obligation_source: "prose" });
      expect(item.obligation_code).toBeUndefined();
      expect(item.source).toMatchObject({ document: "DMF Monografie", version: "2.3" });
      expect(item.references).toContainEqual(expect.objectContaining({ document: "METS XML Schema", version: "1.9.1" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("METS");
      expect(item.implementations).toBeUndefined();
      expect(item.validator_behaviour).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("does not make missing maps or containers disable their presence checks", () => {
    for (const suffix of ["MAP", "STRUCTLINK", "SMLINK"]) expect(rule(suffix).condition).toEqual({ all: base });
    expect(rule("MAP").requirement.cardinality).toEqual({ min: 1, max: null });
    expect(rule("STRUCTLINK").requirement.cardinality).toEqual({ min: 1, max: 1 });
    expect(rule("SMLINK").requirement.cardinality).toEqual({ min: 1, max: null });
    expect(rule("MAP-LABEL").condition).toEqual({ all: logical });
    expect(rule("MAP-LABEL").requirement.allowed_values).toEqual(["Logical_Structure"]);
  });
  it("keeps simple hierarchy separate from chapter description", () => {
    expect(rule("SIMPLE-DIV").condition).toEqual({ all: simple });
    expect(rule("SIMPLE-DIV").requirement.allowed_values).toBeUndefined();
    expect(rule("SIMPLE-DIV").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("Nevyžadovat kapitoly") }));
    expect(rule("SIMPLE-DIV").interpretation?.cs).toContain("nikoli pouze z chybějících kapitol");
  });
  it("requires title metadata only from the external multipart context", () => {
    const item = rule("SIMPLE-TITLE-DMDID");
    expect(item.condition).toEqual({ all: [...simple, eq("monograph_is_multipart", true)] });
    expect(item.requirement.presence).toBe("conditional");
    expect(item.requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("Chybějící uzel titulu nesmí kontrolu vypnout") }));
    expect(item.examples).toBeUndefined();
    expect(item.interpretation?.cs).toContain("jednodílný vzor");
  });
  it("preserves DMDID lists and semantic dmdSec targets", () => {
    const item = rule("SIMPLE-VOLUME-DMDID");
    expect(item.condition).toEqual({ all: [...simple, eq("structural_level", "volume")] });
    expect(item.interpretation?.cs).toContain("IDREFS");
    expect(item.interpretation?.cs).toContain("nikoli počet tokenů");
    expect(item.requirement.allowed_values).toBeUndefined();
    expect(item.requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("dmdSec téhož METS") }));
    expect(item.examples![1]!.code).toContain('<mets:dmdSec ID="MODSMD_VOLUME_0001"');
  });
  it("keeps XLink attributes and directional targets distinct", () => {
    for (const suffix of ["FROM", "TO"]) {
      const item = rule(`SMLINK-${suffix}`);
      expect(item.condition).toEqual({ all: [...base, eq("element_role", "structlink_smlink")] });
      expect(registry.standard_entities).toContainEqual(expect.objectContaining({ id: item.target.entity, type: "attribute", namespace: "http://www.w3.org/1999/xlink" }));
      expect(item.requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("http://www.w3.org/1999/xlink") }));
      expect(item.examples![0]!.code).toContain('xlink:from="VOLUME_0001"');
      expect(item.examples![0]!.code).toContain('xlink:to="DIV_P_PAGE_0000"');
    }
    expect(rule("SMLINK-FROM").interpretation?.cs).toContain("Nezavádíme povinnost xlink:href ani xlink:type");
    expect(rule("SMLINK-TO").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("rodičovský div svazku, logický div ani file") }));
    expect(rule("SMLINK").interpretation?.cs).toContain("smLinkGrp");
  });
  it("describes set coverage rather than equal counts or mandatory ancestor links", () => {
    const item = rule("SIMPLE-PAGE-COVERAGE");
    expect(item.condition).toEqual({ all: [...base, eq("logical_description_mode", "no_internal_parts")] });
    expect(item.requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("stejný počet vazeb nestačí") }));
    expect(item.interpretation?.cs).toContain("Duplicitní odkaz nesmí zamaskovat chybějící stranu");
    expect(item.interpretation?.cs).toContain("z každého předka");
    const links = item.examples![0]!.code;
    expect(links.match(/<mets:smLink /g)).toHaveLength(16);
    const targets = [...links.matchAll(/xlink:to="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(targets).size).toBe(16);
    expect(links.match(/xlink:from="VOLUME_0001"/g)).toHaveLength(16);
  });
  it("ships thirteen exact excerpts for nine rules with connections to existing groups", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(13);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(9);
    for (const example of examples) {
      expect(example.file_sha256).toBe("7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473");
      expect(example.kind).toBe("source_excerpt");
      expect(example.code.length).toBeLessThan(20000);
    }
    for (const [from, to] of [
      ["NDK-MONO-METS-ROOT", "NDK-MONO-METS-LOGICAL-MAP"],
      ["NDK-MONO-METS-PHYSICAL-MAP", "NDK-MONO-METS-LOGICAL-MAP"],
      ["NDK-MONO-METS-PHYSICAL-PAGES", "NDK-MONO-METS-LOGICAL-SIMPLE-PAGE-COVERAGE"],
    ]) expect(registry.relations).toContainEqual(expect.objectContaining({ from, to, type: "related_to" }));
  });
});
