import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-origin-agents");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-${suffix}`)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const check = (suffix: string, text: string) => expect(rule(suffix).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(text) }));

describe("MODS origin agents of a single-volume monograph, DMF 2.3", () => {
  it("pins five rules to DMF 2.3 and MODS 3.8 without asserting tool implementation", () => {
    expect(rules).toHaveLength(5);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", source: { document: "DMF Monografie", version: "2.3", page: 52 } });
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(item.implementations).toBeUndefined();
      expect(item.validator_behaviour).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
      expect(item.interpretation?.cs).toContain("neznámá hodnota není false");
    }
  });
  it("preserves two M, two MA and one prose prohibition", () => {
    expect(rules.filter((item) => item.obligation_code === "M")).toHaveLength(2);
    expect(rules.filter((item) => item.obligation_code === "MA")).toHaveLength(2);
    expect(rule("ORIGIN-COPYRIGHT-NO-ROLE")).toMatchObject({ obligation: "forbidden", obligation_source: "prose", requirement: { presence: "forbidden", cardinality: { min: 0, max: 0 } } });
    expect(rule("ORIGIN-COPYRIGHT-NO-ROLE").obligation_code).toBeUndefined();
  });
  it("requires independently available agents and preserves repeated publishers", () => {
    expect(rule("ORIGIN-AGENT").condition).toEqual({ all: [...base, eq("element_role", "mods_origin_info"), eq("origin_agent_available", true)] });
    expect(rule("ORIGIN-AGENT").requirement.cardinality).toEqual({ min: 1, max: null });
    check("ORIGIN-AGENT", "Pro každého vydavatele z opakovaného $b");
    check("ORIGIN-AGENT", "Nesloučit různé vydavatele");
    expect(rule("ORIGIN-AGENT").interpretation?.cs).toContain("Starší publisher zůstává ve schématu povolený");
  });
  it("requires namePart within supplied agents, not only when a name is already present", () => {
    expect(rule("ORIGIN-AGENT-NAME").condition).toEqual({ all: [...base, eq("element_role", "mods_origin_agent")] });
    expect(rule("ORIGIN-AGENT-NAME").requirement.cardinality).toEqual({ min: 1, max: null });
    check("ORIGIN-AGENT-NAME", "260$b/264$b");
    check("ORIGIN-AGENT-NAME", "260$f");
  });
  it("applies available roles only outside independently established copyright context", () => {
    expect(rule("ORIGIN-AGENT-ROLE").condition).toEqual({ all: [...base, eq("element_role", "mods_origin_agent"), eq("origin_copyright_notice", false), eq("origin_agent_role_available", true)] });
    expect(rule("ORIGIN-AGENT-ROLE").interpretation?.cs).toContain("Role může být dostupná i v AACR originInfo bez eventType");
    expect(rule("ORIGIN-AGENT-ROLE").interpretation?.cs).toContain("nikoli pouhou absenci eventType=copyright");
  });
  it("checks the copyright prohibition at agent level regardless of role availability", () => {
    expect(rule("ORIGIN-COPYRIGHT-NO-ROLE").condition).toEqual({ all: [...base, eq("element_role", "mods_origin_agent"), eq("origin_copyright_notice", true), eq("cataloguing_rules", "rda")] });
    check("ORIGIN-COPYRIGHT-NO-ROLE", "včetně prázdných kontejnerů");
    check("ORIGIN-COPYRIGHT-NO-ROLE", "Jiná událost téhož záznamu své role neztrácí");
    expect(rule("ORIGIN-COPYRIGHT-NO-ROLE").interpretation?.cs).toContain("neznamená zákaz všech agentů");
  });
  it("keeps required roleTerm and known mappings while exposing the source typo", () => {
    expect(rule("ORIGIN-AGENT-ROLE-TERM").condition).toEqual({ all: [...base, eq("element_role", "mods_origin_agent_role"), eq("origin_copyright_notice", false)] });
    expect(rule("ORIGIN-AGENT-ROLE-TERM")).toMatchObject({ status: "ambiguous", obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    expect(rules.filter((item) => item.status === "ambiguous")).toHaveLength(1);
    expect(rule("ORIGIN-AGENT-ROLE-TERM").requirement.allowed_values).toBeUndefined();
    for (const mapping of ["264_0 → producer", "260$b/264_1 → publisher", "260$f/264_3 → manufacturer"]) check("ORIGIN-AGENT-ROLE-TERM", mapping);
    check("ORIGIN-AGENT-ROLE-TERM", "neprovádět automatickou opravu");
    expect(rule("ORIGIN-AGENT-ROLE-TERM").discrepancies).toContainEqual(expect.objectContaining({ cs: expect.stringContaining("distibutor") }));
    expect(rule("ORIGIN-AGENT-ROLE-TERM").interpretation?.cs).toContain("Povinnost M roleTerm je jasná");
  });
  it("does not confuse origin agents with authors, preservation agents or event types", () => {
    for (const item of rules) expect(item.interpretation?.cs).toContain("nikoli na top-level name, subject/name, relatedItem nebo PREMIS Agent");
    expect(rule("ORIGIN-AGENT-ROLE").interpretation?.cs).toContain("Nejde o požadavek MARC kódu pbl, prt či dst");
    expect(rule("ORIGIN-AGENT-ROLE-TERM").interpretation?.cs).toContain("eventType production/publication/manufacture");
    expect(registry.relations).toContainEqual(expect.objectContaining({ from: "NDK-MONO-MODS-SINGLE-ORIGIN-AGENT", to: "NDK-MONO-MODS-SINGLE-ORIGININFO", type: "related_to" }));
  });
  it("adds four context-specific XSD targets, not a fabricated role enum", () => {
    const ids = new Set(rules.map((item) => item.target.entity));
    expect(ids.size).toBe(4);
    for (const id of ids) expect(registry.standard_entities.find((item) => item.id === id)).toMatchObject({ version: "3.8", type: "element", namespace: "http://www.loc.gov/mods/v3" });
    expect(registry.standard_entities.find((item) => item.id === "MODS-ORIGIN-AGENT")!.definition?.cs).toContain("nameDefinition");
    expect(registry.standard_entities.find((item) => item.id === "MODS-ORIGIN-AGENT-ROLE")!.definition?.cs).toContain("jeden nebo více roleTerm");
    expect(registry.standard_entities.find((item) => item.id === "MODS-ORIGIN-AGENT-ROLE-TERM")!.definition?.cs).toContain("nemá číselník");
  });
  it("anchors four actual publisher excerpts without inventing copyright or distributor data", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(4);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(4);
    for (const item of rules) for (const example of item.examples ?? []) {
      expect(example).toMatchObject({ kind: "source_excerpt", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473" });
      expect(example.source_xpath).toContain('/mods:originInfo/mods:agent');
    }
    expect(rule("ORIGIN-AGENT-NAME").examples![0]!.code).toContain("Tiskem a nákl. Th. Venty");
    expect(rule("ORIGIN-AGENT-ROLE-TERM").examples![0]!.code).toContain(">publisher</mods:roleTerm>");
    expect(rule("ORIGIN-AGENT-ROLE-TERM").examples![0]!.code).not.toMatch(/authority=|type=/);
    expect(rule("ORIGIN-COPYRIGHT-NO-ROLE").examples).toBeUndefined();
  });
});
