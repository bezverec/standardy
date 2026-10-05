import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import type { Condition } from "../packages/registry-core/src/model.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "technical/premis-agents");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-PREMIS-AGENT-${suffix}`)!;
const agentPath = "xpath:/mets:mets/mets:amdSec/mets:digiprovMD/mets:mdWrap/mets:xmlData/premis:agent";
const context = { object_type: "monograph", document_role: "amd_mets" };

// Truth-table checks for this group's declarative scope only, not an XML/NDK validator.
function applies(condition: Condition, facts: Record<string, unknown>): boolean {
  if ("all" in condition) return condition.all.every((child) => applies(child, facts));
  if ("any" in condition) return condition.any.some((child) => applies(child, facts));
  if ("not" in condition) return !applies(condition.not, facts);
  if (condition.operator === "exists") return Object.hasOwn(facts, condition.field);
  if (condition.operator === "equals") return facts[condition.field] === condition.value;
  throw new Error("Unexpected operator in agent rule scope");
}

describe("PREMIS Agent, DMF Monografie 2.3", () => {
  it("keeps all seven table rows, original obligation codes and versioned sources", () => {
    expect(rules).toHaveLength(7);
    for (const item of rules) {
      const name = item === rule("NAME");
      const note = item === rule("NOTE");
      expect(item).toMatchObject({
        version: "2.3", status: "normative",
        obligation: name ? "recommended" : note ? "mandatory_if_available" : "mandatory",
        obligation_code: name ? "R" : note ? "MA" : "M",
      });
      expect(item.source).toMatchObject({ version: "2.3", page: item === rule("TYPE") || note ? 82 : 81, section: expect.stringContaining("7.5.3 PREMIS Agent") });
      expect(item.references).toContainEqual(expect.objectContaining({ document: "PREMIS XML Schema", version: "2.2" }));
      expect(registry.standard_entities).toContainEqual(expect.objectContaining({ id: item.target.entity, version: "2.2" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("PREMIS");
      expect(item.implementations).toBeUndefined();
      expect(item.obligation_source).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("does not force an Agent into every SIP but detects the AIP activity scope without an existing Agent", () => {
    const item = rule("RECORD");
    expect(item.requirement).toMatchObject({ presence: "conditional", cardinality: { min: 1, max: null } });
    expect(applies(item.condition!, context)).toBe(false);
    expect(applies(item.condition!, { ...context, preservation_activity_on_aip: false })).toBe(false);
    expect(applies(item.condition!, { ...context, preservation_activity_on_aip: true })).toBe(true);
    expect(applies(item.condition!, { ...context, [agentPath]: true })).toBe(true);
    expect(applies(item.condition!, { ...context, object_type: "periodical", preservation_activity_on_aip: true })).toBe(false);
    expect(item.interpretation?.cs).toContain("jeden duplicitní popis na každý odkaz");
    expect(item.requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("mimo tento kontext jej DMF nepoužívá") }));
  });
  it("checks mandatory children inside a supplied agent, including multiple identifiers", () => {
    const facts = { ...context, metadata_record_type: "premis_agent" };
    for (const suffix of ["IDENTIFIER", "IDENTIFIER-TYPE", "IDENTIFIER-VALUE", "TYPE"]) {
      expect(applies(rule(suffix).condition!, facts)).toBe(true);
      expect(applies(rule(suffix).condition!, context)).toBe(false);
      expect(rule(suffix).requirement.presence).toBe("required");
    }
    expect(rule("IDENTIFIER").requirement.cardinality).toEqual({ min: 1, max: null });
    for (const suffix of ["IDENTIFIER-TYPE", "IDENTIFIER-VALUE", "TYPE"]) {
      expect(rule(suffix).requirement.cardinality).toEqual({ min: 1, max: 1 });
    }
    expect(rule("NAME").requirement).toMatchObject({ presence: "optional", cardinality: { min: 0, max: null } });
  });
  it("restricts agentType using the DMF values without closing identifier or name examples", () => {
    expect(rule("TYPE").requirement.allowed_values).toEqual(["organization", "person", "software", "hardware"]);
    for (const item of rules.filter((item) => item !== rule("TYPE"))) expect(item.requirement.allowed_values).toBeUndefined();
    expect(rule("TYPE").interpretation?.cs).toContain("agentType není linkingAgentRole");
    expect(rule("TYPE").interpretation?.cs).toContain("nepřidává alternativní hodnotu s velkým S");
    expect(rule("IDENTIFIER-TYPE").interpretation?.cs).toContain("nikoli uzavřený číselník");
  });
  it("scopes MA to software actually involved in JPEG2000 production, never to note presence", () => {
    const item = rule("NOTE");
    const facts = { ...context, metadata_record_type: "premis_agent", "xpath:premis:agentType": "software", agent_linked_to_jpeg2000_creation_or_migration: true };
    expect(item.requirement).toMatchObject({ presence: "conditional", cardinality: { min: 1, max: null } });
    expect(applies(item.condition!, facts)).toBe(true);
    expect(applies(item.condition!, { ...facts, "xpath:premis:agentType": "hardware" })).toBe(false);
    expect(applies(item.condition!, { ...facts, "xpath:premis:agentType": "Software" })).toBe(false);
    expect(applies(item.condition!, { ...facts, agent_linked_to_jpeg2000_creation_or_migration: false })).toBe(false);
    expect(applies(item.condition!, { ...context, metadata_record_type: "premis_agent", "xpath:premis:agentType": "software", "xpath:premis:agentNote": "command" })).toBe(false);
    expect(item.interpretation?.cs).toContain("minimum 1 se uplatní, lze-li údaj plnit");
    expect(item.requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("Příkaz uložit jako text a nevykonávat jej") }));
  });
  it("preserves ten source excerpts, identifier pairs and command text without tool claims", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(10);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(7);
    const pair = rule("IDENTIFIER").examples!;
    expect(pair).toHaveLength(2);
    expect(pair[0]!.source_xpath).toContain("AGENT_004");
    expect(pair[1]!.source_xpath).toContain("EVT_004");
    for (const entry of pair) {
      expect(entry.code).toContain("NK_AgentID");
      expect(entry.code).toContain("Kakadu-mastercopy");
    }
    expect(rule("NOTE").examples![0]!.code).toContain("kdu_compress -i /smb/");
    expect(rule("NOTE").examples![0]!.code).toContain("Corder=RPCL");
    expect(rule("NOTE").examples![0]!.note.cs).toContain("Příkaz nebyl vykonán");
    expect(rule("TYPE").examples![1]!.code).toContain("Plustek OpticBook A300");
    expect(rule("TYPE").examples![1]!.code).toContain("<premis:agentType>software</premis:agentType>");
    expect(rule("TYPE").examples![1]!.note.cs).toContain("nejsou totožná pole");
  });
  it("connects agents back to events and file provenance", () => {
    for (const [from, to] of [
      ["EVENT-LINKING-AGENT", "AGENT-IDENTIFIER"],
      ["EVENT-LINKING-AGENT", "AGENT-RECORD"],
      ["EVENT-LINKING-AGENT-ROLE", "AGENT-TYPE"],
      ["EVENT-DETAIL", "AGENT-NOTE"],
      ["AGENT-NOTE", "CREATING-APPLICATION"],
    ]) expect(registry.relations).toContainEqual(expect.objectContaining({ from: `NDK-MONO-PREMIS-${from}`, to: `NDK-MONO-PREMIS-${to}`, type: "related_to" }));
  });
});
