import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "technical/premis-events");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-PREMIS-EVENT-${suffix}`)!;

describe("PREMIS Event, DMF Monografie 2.3", () => {
  it("keeps 16 sourced rules separate from PREMIS 2.2 and tool implementations", () => {
    expect(rules).toHaveLength(16);
    for (const item of rules) {
      const recommended = ["OUTCOME-INFORMATION", "LINKING-AGENT-ROLE"].some((suffix) => item.rule_id === `NDK-MONO-PREMIS-EVENT-${suffix}`);
      expect(item).toMatchObject({
        version: "2.3", status: "normative",
        obligation: recommended ? "recommended" : "mandatory",
        obligation_code: recommended ? "R" : "M",
      });
      expect(item.source).toMatchObject({ version: "2.3", section: expect.stringContaining("7.5.2 PREMIS Event") });
      expect(item.references).toContainEqual(expect.objectContaining({ document: "PREMIS XML Schema", version: "2.2" }));
      expect(item.implementations).toBeUndefined();
      expect(item.obligation_source).toBeUndefined();
      expect(registry.standard_entities).toContainEqual(expect.objectContaining({ id: item.target.entity, version: "2.2" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("PREMIS");
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("does not limit performed events to MC/PS/ALTO file objects or hide missing event records", () => {
    const scope = [
      { field: "object_type", operator: "equals", value: "monograph" },
      { field: "document_role", operator: "equals", value: "amd_mets" },
    ];
    for (const item of rules.filter((item) => item !== rule("OUTCOME"))) expect(item.condition).toEqual({ all: scope });
    expect(rule("RECORD").requirement).toMatchObject({ presence: "required", cardinality: { min: 1, max: null } });
    expect(rule("RECORD").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("MC a UC") }));
    expect(rule("RECORD").interpretation?.cs).toContain("pět událostí ve vzoru není univerzální předepsaný počet");
  });
  it("preserves the recommended outcome container and mandatory child conditional on its parent", () => {
    expect(rule("OUTCOME-INFORMATION").requirement).toMatchObject({ presence: "optional", cardinality: { min: 0, max: null } });
    expect(rule("OUTCOME")).toMatchObject({
      obligation_code: "M",
      requirement: { presence: "conditional", cardinality: { min: 1, max: 1 } },
      condition: { all: [
        { field: "object_type", operator: "equals", value: "monograph" },
        { field: "document_role", operator: "equals", value: "amd_mets" },
        { field: "xpath:premis:eventOutcomeInformation", operator: "exists" },
      ] },
    });
    expect(rule("OUTCOME").interpretation?.cs).toContain("pouze s eventOutcomeDetail");
    expect(rule("OUTCOME").examples![0]!.code).toContain(">OK<");
    expect(rule("OUTCOME").examples![0]!.note.cs).toContain("číselníku nebyla ověřena");
  });
  it("keeps mandatory agent/object links repeated, identifiers single and roles recommended", () => {
    for (const suffix of ["LINKING-AGENT", "LINKING-OBJECT"]) {
      expect(rule(suffix).requirement).toMatchObject({ presence: "required", cardinality: { min: 1, max: null } });
    }
    for (const suffix of ["IDENTIFIER", "IDENTIFIER-TYPE", "IDENTIFIER-VALUE", "TYPE", "DATETIME", "DETAIL", "LINKING-AGENT-TYPE", "LINKING-AGENT-VALUE", "LINKING-OBJECT-TYPE", "LINKING-OBJECT-VALUE"]) {
      expect(rule(suffix).requirement).toMatchObject({ presence: "required", cardinality: { min: 1, max: 1 } });
    }
    expect(rule("LINKING-AGENT-ROLE").requirement).toMatchObject({ presence: "optional", cardinality: { min: 0, max: null } });
    expect(rule("LINKING-AGENT").interpretation?.cs).toContain("neztotožňujeme s bezvýjimečnou povinností úplného záznamu Agent");
    expect(rule("LINKING-OBJECT").interpretation?.cs).toContain("nepřidává povinnost PREMIS Object pro UC");
  });
  it("does not turn examples, recommended details or sample tool names into closed vocabularies", () => {
    for (const item of rules) expect(item.requirement.allowed_values).toBeUndefined();
    expect(rule("TYPE").examples).toHaveLength(4);
    expect(rule("TYPE").interpretation?.cs).toContain("nevymezuje tím uzavřený");
    expect(rule("DETAIL").examples).toHaveLength(4);
    expect(rule("DETAIL").interpretation?.cs).toContain("doporučená upřesnění za lomítkem");
    expect(rule("DETAIL").interpretation?.cs).toContain("nikoli jako předepsanou syntaxi");
  });
  it("requires timestamp precision but does not invent a timezone", () => {
    expect(rule("DATETIME").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("včetně sekund") }));
    expect(rule("DATETIME").interpretation?.cs).toContain("nezavádí povinné Z");
    expect(rule("DATETIME").examples![0]!.code).toContain(">2026-06-25T08:41:21<");
  });
  it("distinguishes semantic identities from XML wrapper IDs and preserves sample evidence", () => {
    expect(rule("IDENTIFIER").examples![0]!.source_xpath).toContain("[@ID='EVT_004']");
    expect(rule("IDENTIFIER").examples![0]!.code).toContain("mastercopy_001");
    expect(rule("IDENTIFIER-TYPE").interpretation?.cs).toContain("není eventType");
    expect(rule("LINKING-OBJECT-VALUE").interpretation?.cs).toContain("není to METS file/@ID mc_0001");
    expect(rule("LINKING-AGENT-ROLE").examples![1]!.code).toContain(">machine<");
    expect(rule("LINKING-AGENT-VALUE").interpretation?.cs).toContain("není sám o sobě důkazem verze ani chování nástroje");
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(23);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(16);
  });
  it("connects the new event identities to existing object relationship rules", () => {
    for (const [from, to] of [
      ["RELATED-EVENT", "EVENT-IDENTIFIER"],
      ["LINKING-EVENT", "EVENT-IDENTIFIER"],
      ["OBJECT-IDENTIFIER", "EVENT-LINKING-OBJECT"],
      ["EVENT-DATETIME", "CREATION-DATETIME"],
    ]) expect(registry.relations).toContainEqual(expect.objectContaining({ from: `NDK-MONO-PREMIS-${from}`, to: `NDK-MONO-PREMIS-${to}`, type: "related_to" }));
  });
});
