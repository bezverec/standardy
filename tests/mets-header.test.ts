import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "structure/mets-header");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-METS-${suffix}`)!;
const scope = [
  { field: "object_type", operator: "equals", value: "monograph" },
  { field: "document_role", operator: "equals", value: "main_mets" },
];

describe("main METS root and header, DMF Monografie 2.3", () => {
  it("keeps twelve rules, eleven original M codes and one prose requirement", () => {
    expect(rules).toHaveLength(12);
    expect(new Set(rules.map((item) => item.target.entity)).size).toBe(9);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", obligation: "mandatory" });
      expect(item.obligation_code).toBe(item === rule("SCHEMA-LINKS") ? undefined : "M");
      expect(item.obligation_source).toBe(item === rule("SCHEMA-LINKS") ? "prose" : undefined);
      expect(item.references).toContainEqual(expect.objectContaining({ document: "METS XML Schema", version: "1.9.1" }));
      expect(registry.standard_entities).toContainEqual(expect.objectContaining({ id: item.target.entity, version: "1.9.1" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("METS");
      expect(item.implementations).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("checks missing root, header and required roles without self-existence conditions", () => {
    for (const suffix of ["ROOT", "ROOT-LABEL", "ROOT-TYPE", "SCHEMA-LINKS", "HEADER", "HEADER-CREATEDATE", "HEADER-LASTMODDATE", "HEADER-CREATOR", "HEADER-ARCHIVIST"]) {
      expect(rule(suffix).condition).toEqual({ all: scope });
      expect(rule(suffix).requirement.presence).toBe("required");
    }
    for (const suffix of ["ROOT", "ROOT-LABEL", "ROOT-TYPE", "HEADER", "HEADER-CREATEDATE", "HEADER-LASTMODDATE"]) {
      expect(rule(suffix).requirement.cardinality).toEqual({ min: 1, max: 1 });
    }
    for (const suffix of ["HEADER-CREATOR", "HEADER-ARCHIVIST"]) {
      expect(rule(suffix).requirement.cardinality).toEqual({ min: 1, max: null });
    }
    expect(rule("HEADER-CREATOR").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("dva záznamy ARCHIVIST") }));
    expect(rule("HEADER-ARCHIVIST").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("CREATOR tuto roli nenahrazuje") }));
  });
  it("separates root TYPE, role and organization TYPE while keeping names scoped to their role", () => {
    expect(rule("ROOT-TYPE").requirement.allowed_values).toEqual(["Monograph"]);
    expect(rule("HEADER-AGENT-TYPE").requirement.allowed_values).toEqual(["ORGANIZATION"]);
    expect(rule("HEADER-AGENT-TYPE").condition).toEqual({ all: [...scope, { field: "mets_header_agent_role", operator: "in", value: ["CREATOR", "ARCHIVIST"] }] });
    for (const role of ["CREATOR", "ARCHIVIST"]) {
      const item = rule(`HEADER-${role}-NAME`);
      expect(item.condition).toEqual({ all: [...scope, { field: "mets_header_agent_role", operator: "equals", value: role }] });
      expect(item.requirement.cardinality).toEqual({ min: 1, max: 1 });
      expect(item.requirement.allowed_values).toBeUndefined();
    }
    expect(rule("HEADER-AGENT-TYPE").interpretation?.cs).toContain("nikoli o premis:agent");
    expect(rule("HEADER-ARCHIVIST").interpretation?.cs).toContain("zákaz všech ostatních rolí");
  });
  it("preserves bibliographic label and timestamps without inventing extra constraints", () => {
    expect(rule("ROOT-LABEL").interpretation?.cs).toContain("[1890]");
    expect(rule("ROOT-LABEL").requirement.allowed_values).toBeUndefined();
    expect(rule("ROOT").interpretation?.cs).toContain("nové povinnosti OBJID, ID nebo PROFILE");
    for (const suffix of ["HEADER-CREATEDATE", "HEADER-LASTMODDATE"]) {
      expect(rule(suffix).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("obsahující sekundy") }));
      expect(rule(suffix).examples![0]!.code).toContain('CREATEDATE="2025-11-20T15:56:25"');
      expect(rule(suffix).examples![0]!.code).toContain('LASTMODDATE="2026-06-29T13:27:53"');
    }
    expect(rule("HEADER-CREATEDATE").interpretation?.cs).toContain("povinné Z");
    expect(rule("HEADER-LASTMODDATE").interpretation?.cs).toContain("neuvádí další nerovnost dat");
  });
  it("records the odd schemaLocation evidence separately from normative links and validator results", () => {
    const item = rule("SCHEMA-LINKS");
    expect(item.requirement.cardinality).toBeUndefined();
    expect(item.references).toContainEqual(expect.objectContaining({ document: "XML Schema Part 1: Structures" }));
    expect(item.discrepancies![0]!.cs).toContain("11 whitespace-oddělených URI");
    expect(item.discrepancies![0]!.cs).toContain("copyrightMD.xsd");
    expect(item.discrepancies![0]!.cs).toContain("Zdroj nebyl opraven");
    expect(item.validator_behaviour).toBeUndefined();
    expect(item.interpretation?.cs).toContain("obecné URL mets.xsd neprokazuje verzi 1.9.1");
  });
  it("ships exact header excerpts without pretending a truncated root is a source excerpt", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(9);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(8);
    for (const suffix of ["ROOT", "ROOT-LABEL", "ROOT-TYPE", "SCHEMA-LINKS"]) expect(rule(suffix).examples).toBeUndefined();
    expect(rule("HEADER-AGENT-TYPE").examples).toHaveLength(2);
    for (const item of rules) for (const example of item.examples ?? []) {
      expect(example.source_xpath).toMatch(/^\/mets:mets\/mets:metsHdr/);
      expect(example.file_sha256).toBe("7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473");
      expect(example.namespaces).toEqual({ mets: "http://www.loc.gov/METS/" });
      expect(example.code).toContain("ABA001");
    }
  });
  it("shares generic METS entities and links the header from existing package rules", () => {
    expect(rule("HEADER-CREATOR").target).toEqual(rule("HEADER-ARCHIVIST").target);
    expect(rule("HEADER-CREATOR-NAME").target).toEqual(rule("HEADER-ARCHIVIST-NAME").target);
    for (const [from, to] of [
      ["NDK-MONO-INFO-MAIN-METS", "NDK-MONO-METS-ROOT"],
      ["NDK-MONO-METS-FILESEC", "NDK-MONO-METS-ROOT"],
      ["NDK-MONO-INFO-CREATOR", "NDK-MONO-METS-HEADER-CREATOR-NAME"],
    ]) expect(registry.relations).toContainEqual(expect.objectContaining({ from, to, type: "related_to" }));
  });
});
