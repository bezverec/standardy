import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, validateRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";
import { openApiDocument } from "../packages/registry-core/src/openapi.ts";

const root = path.resolve(import.meta.dirname, "..");
const documents = await loadRegistry(root);
const registry = compileRegistry(documents);
const rules = registry.rule_versions.filter((rule) => rule.category === "structure/mets-files");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-METS-${suffix}`)!;

describe("main METS file inventory, DMF Monografie 2.3", () => {
  it("ships fourteen scoped requirements backed by METS 1.9.1 and explicit prose obligations", () => {
    expect(rules).toHaveLength(14);
    expect(registry.standards.find((item) => item.id === "METS")?.versions.map((item) => item.version)).toEqual(["1.9.1"]);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", obligation: "mandatory", obligation_source: "prose", category: "structure/mets-files" });
      expect(item.obligation_code).toBeUndefined();
      expect(item.source).toMatchObject({ version: "2.3", page: item.rule_id.endsWith("FPTR-FILEID") ? 93 : "90–91" });
      expect(item.references).toContainEqual(expect.objectContaining({ version: "1.9.1", url: "https://www.loc.gov/standards/mets/version191/mets.xsd" }));
      expect(item.condition).toMatchObject({ all: expect.arrayContaining([
        { field: "object_type", operator: "equals", value: "monograph" },
        { field: "document_role", operator: "equals", value: "main_mets" },
      ]) });
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("METS");
      expect(item.implementations).toBeUndefined();
      expect(item.examples).toHaveLength(1);
    }
  });
  it("requires explicit prose provenance instead of silently allowing missing historical codes", async () => {
    const modified = structuredClone(documents);
    const document = modified.find((item) => item.kind === "rule" && item.id === rule("FILESEC").rule_id)!;
    if (document.kind !== "rule") throw new Error("Missing rule");
    const version = document.versions[0]!;
    delete version.obligation_source;
    expect(await validateRegistry(root, modified)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("must preserve") }));
    version.obligation_source = "prose";
    expect(await validateRegistry(root, modified)).toEqual([]);
    version.obligation_code = "M";
    expect(await validateRegistry(root, modified)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("prose obligation must not") }));
    expect(JSON.stringify(openApiDocument)).toContain('"obligation_source"');
  });
  it("does not turn typical URL or a single sample locator into exclusive constraints", () => {
    expect(rule("LOCTYPE").requirement.allowed_values).toBeUndefined();
    expect(rule("FLOCAT").requirement.cardinality).toEqual({ min: 1, max: null });
    expect(rule("FILESEC").requirement.cardinality).toEqual({ min: 1, max: 1 });
    expect(rule("CHECKSUM-TYPE").requirement.allowed_values).toEqual(["MD5"]);
    expect(rule("FILE-GROUPS").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("ID/USE") }));
    expect(rule("FILE-MIMETYPE").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("TXTGRP = text/plain") }));
  });
  it("limits sequence numbers and physical pointers to their actual contexts", () => {
    expect(rule("FILE-SEQ").condition).toMatchObject({ all: expect.arrayContaining([
      { field: "file_group_id", operator: "in", value: ["MC_IMGGRP", "UC_IMGGRP", "TECHMDGRP"] },
    ]) });
    expect(rule("FILE-SEQ").examples![0]!.code).toContain('SEQ="0"');
    expect(rule("FPTR-FILEID").condition).toMatchObject({ all: expect.arrayContaining([
      { field: "structmap_type", operator: "equals", value: "PHYSICAL" },
      { field: "structural_level", operator: "equals", value: "page" },
    ]) });
    expect(rule("FPTR-FILEID").examples![0]!.code.match(/<mets:fptr /g)).toHaveLength(5);
    expect(rule("FPTR-FILEID").interpretation?.cs).toContain("logickou mapu");
  });
  it("connects pointers, file identifiers, locators and info.xml without claiming equivalence", () => {
    for (const [from, to] of [["FPTR-FILEID", "FILE-ID"], ["FILE", "FLOCAT"], ["FLOCAT", "HREF"], ["CHECKSUM", "CHECKSUM-TYPE"]]) {
      expect(registry.relations).toContainEqual(expect.objectContaining({ from: `NDK-MONO-METS-${from}`, to: `NDK-MONO-METS-${to}`, type: "related_to" }));
    }
    expect(registry.relations).toContainEqual(expect.objectContaining({ from: rule("FILESEC").rule_id, to: "NDK-MONO-INFO-MAIN-METS", type: "related_to" }));
    expect(registry.relations).not.toContainEqual(expect.objectContaining({ from: rule("CHECKSUM").rule_id, to: "NDK-MONO-INFO-CHECKSUM", type: "equivalent_to" }));
  });
});
