import path from "node:path";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { filterRules, sourceIds } from "../web/registry/src/explore.ts";
import type { RuleVersion } from "../web/registry/src/api.ts";

const root = path.resolve(import.meta.dirname, "..");
const registry = compileRegistry(await loadRegistry(root));
const rules = registry.rule_versions.filter((rule) => rule.rule_id.startsWith("NDK-MONO-INFO-"));
const get = (suffix: string) => rules.find((rule) => rule.rule_id === `NDK-MONO-INFO-${suffix}`)!;

describe("DMF 2.3 info.xml transcription", () => {
  it("preserves source codes, scope and links to the namespace-free info 1.1 schema", () => {
    const matrix = {
      ROOT: "M", CREATED: "M", "METADATA-VERSION": "M", "PACKAGE-ID": "M", "MAIN-METS": "M",
      VALIDATION: "MA", "VALIDATION-VERSION": "M", "VALIDATION-RESULT": "R", "TITLE-ID": "M",
      COLLECTION: "R", INSTITUTION: "R", CREATOR: "M", SIZE: "M", "ITEM-LIST": "M", "ITEM-TOTAL": "M",
      ITEM: "M", CHECKSUM: "M", NOTE: "O",
    };
    expect(rules).toHaveLength(18);
    for (const [suffix, code] of Object.entries(matrix)) {
      const rule = get(suffix);
      expect(rule).toMatchObject({ version: "2.3", category: "metadata/info", obligation_code: code,
        source: { version: "2.3", page: ["ITEM", "CHECKSUM", "NOTE"].includes(suffix) ? 18 : 17 },
        verification: { status: "verified" } });
      expect(rule.condition).toMatchObject({ all: expect.arrayContaining([
        { field: "object_type", operator: "equals", value: "monograph" },
        { field: "document_role", operator: "equals", value: "info" },
      ]) });
      expect(rule.implementations).toBeUndefined();
      const entity = registry.standard_entities.find((item) => item.id === rule.target.entity)!;
      expect(entity).toMatchObject({ standard_id: "NDK-INFO", version: "1.1" });
      expect(entity.namespace).toBeUndefined();
    }
  });

  it("does not turn MA or recommended validation output into unconditional presence", () => {
    expect(get("VALIDATION")).toMatchObject({ obligation: "mandatory_if_available", status: "disputed",
      requirement: { presence: "conditional", cardinality: { min: 1, max: 1 } } });
    expect(get("VALIDATION").requirement.validations).toBeUndefined();
    for (const suffix of ["VALIDATION-VERSION", "VALIDATION-RESULT"]) {
      expect(get(suffix).condition).toMatchObject({ all: expect.arrayContaining([
        { field: "xpath:/info/validation", operator: "exists" },
      ]) });
    }
    for (const suffix of ["VALIDATION-RESULT", "COLLECTION", "INSTITUTION", "NOTE"]) {
      expect(get(suffix).requirement.presence).toBe("optional");
      expect(get(suffix).requirement.validations).toBeUndefined();
    }
    expect(get("NOTE").obligation_code).toBe("O");
  });

  it("retains repeatability, version vocabulary and documented DMF/XSD discrepancies", () => {
    for (const suffix of ["TITLE-ID", "ITEM"]) expect(get(suffix).requirement.cardinality).toEqual({ min: 1, max: null });
    expect(get("METADATA-VERSION").requirement.allowed_values).toEqual([
      "1.1", "1.1.1", "1.1.2", "1.1.3", "1.2", "1.3", "1.3.1", "1.3.2", "1.4", "2.0", "2.1", "2.2", "2.3",
    ]);
    expect(get("TITLE-ID").requirement.allowed_values).toBeUndefined();
    for (const suffix of ["TITLE-ID", "VALIDATION"]) expect(get(suffix).discrepancies).toHaveLength(1);
    expect(get("CHECKSUM").requirement.validations).toEqual(expect.arrayContaining([
      { type: "xpath", expression: "/info/checksum/@type", assertion: "exists" },
      { type: "xpath", expression: "/info/checksum/@checksum", assertion: "exists" },
    ]));
  });

  it("exposes the new group and schema through explorer filters and graph relations", () => {
    const wire = JSON.parse(JSON.stringify(registry.rule_versions)) as RuleVersion[];
    expect(filterRules(wire, "", { category: "metadata/info", source: "NDK-INFO" }, registry.relations)).toHaveLength(18);
    const rule = wire.find((item) => item.rule_id === "NDK-MONO-INFO-CHECKSUM")!;
    expect(sourceIds(rule, registry.relations)).toContain("NDK-INFO");
    expect(registry.relations).toContainEqual(expect.objectContaining({ from: rule.rule_id, to: "NDK-MONO-INFO-ITEM-LIST", type: "related_to" }));
  });

  it("removes the coverage paragraph from the rules list", async () => {
    const source = await readFile(path.join(root, "web/registry/src/App.tsx"), "utf8");
    expect(source).not.toContain('className="coverage"');
    expect(source).not.toContain("Pokrytí MVP:");
    expect(source).not.toContain("Částečné pokrytí NDK</span>");
  });
});
