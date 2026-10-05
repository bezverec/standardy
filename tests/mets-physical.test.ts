import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "structure/mets-physical");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-METS-PHYSICAL-${suffix}`)!;
const base = [
  { field: "object_type", operator: "equals", value: "monograph" },
  { field: "document_role", operator: "equals", value: "main_mets" },
];
const physical = [...base, { field: "structmap_type", operator: "equals", value: "PHYSICAL" }];

describe("main METS physical structure, DMF 2.3 and PPM 2.4", () => {
  it("keeps twelve prose rules without inventing original obligation codes", () => {
    expect(rules).toHaveLength(12);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", obligation_source: "prose" });
      expect(item.obligation_code).toBeUndefined();
      expect(item.obligation).toBe(item === rule("VOLUME-LABEL") ? "optional" : "mandatory");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "METS XML Schema", version: "1.9.1" }));
      expect(registry.standard_entities).toContainEqual(expect.objectContaining({ id: item.target.entity, version: "1.9.1" }));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("METS");
      expect(item.implementations).toBeUndefined();
      expect(item.validator_behaviour).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("does not hide missing maps, parents or pages behind self-existence predicates", () => {
    expect(rule("MAP").condition).toEqual({ all: base });
    expect(rule("MAP").requirement.cardinality).toEqual({ min: 1, max: null });
    for (const suffix of ["MAP-LABEL", "VOLUME-DIV", "PAGES"]) expect(rule(suffix).condition).toEqual({ all: physical });
    expect(rule("VOLUME-DIV").requirement.cardinality).toEqual({ min: 1, max: 1 });
    expect(rule("PAGES").requirement.cardinality).toEqual({ min: 1, max: null });
    expect(rule("PAGE-TYPE").condition).toEqual({ all: [...physical, { field: "structural_level", operator: "equals", value: "page" }] });
    expect(rule("PAGES").interpretation?.cs).toContain("dvě tiskové strany na jednom skenu");
  });
  it("separates fixed map label from optional volume label and illustrative volume type", () => {
    expect(rule("MAP-LABEL").requirement.allowed_values).toEqual(["Physical_Structure"]);
    expect(rule("VOLUME-LABEL").requirement).toMatchObject({ presence: "optional", cardinality: { min: 0, max: 1 } });
    expect(rule("VOLUME-TYPE").requirement.allowed_values).toBeUndefined();
    expect(rule("VOLUME-TYPE").interpretation?.cs).toContain("např.");
    expect(rule("VOLUME-TYPE").target).toEqual(rule("PAGE-TYPE").target);
  });
  it("preserves document-wide IDs and IDREFS rather than hard-coded sample identifiers", () => {
    expect(rule("DIV-ID").condition).toEqual({ all: [...physical, { field: "structural_level", operator: "in", value: ["volume", "page"] }] });
    expect(rule("DIV-ID").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("v celém XML dokumentu") }));
    expect(rule("DIV-ID").requirement.allowed_values).toBeUndefined();
    expect(rule("VOLUME-DMDID").interpretation?.cs).toContain("IDREFS");
    expect(rule("VOLUME-DMDID").interpretation?.cs).toContain("nikoli počtu tokenů");
    expect(rule("VOLUME-DMDID").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("dmdSec téhož METS") }));
  });
  it("uses all 37 page-capable PPM values and excludes internal-part-only and genre text values", () => {
    const values = rule("PAGE-TYPE").requirement.allowed_values as string[];
    expect(values).toHaveLength(37);
    expect(new Set(values).size).toBe(37);
    expect(values).toEqual(expect.arrayContaining(["frontJacket", "titlePage", "normalPage", "bibliography", "sheetMusic", "conclusion", "flyleaf"]));
    for (const excluded of ["chapter", "article", "abstract", "photograph", "plate", "reprePage", "page", "PAGE", "Monograph"]) expect(values).not.toContain(excluded);
    expect(rule("PAGE-TYPE").references).toContainEqual(expect.objectContaining({ document: "Pravidla pro popis monografií", version: "2.4", page: "8, 14" }));
    expect(rule("PAGE-TYPE").interpretation?.cs).toContain("nevynucujeme výskyt všech 37 typů");
  });
  it("keeps page order separate from paginated labels and optional MODS pageIndex", () => {
    expect(rule("PAGE-ORDER").interpretation?.cs).toContain("ORDER=0");
    expect(rule("PAGE-ORDER").requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("nevynucovat přítomnost volitelného MODS part") }));
    expect(rule("PAGE-ORDERLABEL").interpretation?.cs).toContain("xs:string");
    for (const suffix of ["PAGE-ORDER", "PAGE-ORDERLABEL"]) {
      expect(rule(suffix).requirement.allowed_values).toBeUndefined();
      expect(rule(suffix).requirement.validations).toEqual([expect.objectContaining({ type: "custom" })]);
      expect(rule(suffix).references).toContainEqual(expect.objectContaining({ document: "DMF Monografie", page: 73 }));
      expect(rule(suffix).examples![0]!.code).toContain('ORDERLABEL="[1]"');
      expect(rule(suffix).examples![1]!.code).toContain('type="pageIndex"');
    }
  });
  it("keeps rights optional and documents the DMF versus METS target discrepancy", () => {
    const item = rule("VOLUME-ADMID");
    expect(item.requirement.presence).toBe("conditional");
    expect(item.condition).toEqual({ all: [...physical, { field: "structural_level", operator: "equals", value: "volume" }] });
    expect(item.requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining("Nezavádět povinnost vytvořit autorskoprávní metadata") }));
    expect(item.discrepancies![0]!.cs).toContain("AMD_MONOGRAPH_0001");
    expect(item.discrepancies![0]!.cs).toContain("RIGHTS_0001");
    expect(item.discrepancies![0]!.cs).toContain("nikoli o výsledek externího validátoru");
  });
  it("ships 17 exact excerpts and connects the existing file and root groups", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(17);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(12);
    for (const example of examples) {
      expect(example.file_sha256).toBe("7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473");
      expect(example.kind).toBe("source_excerpt");
      expect(example.code.length).toBeLessThan(20000);
    }
    expect(rule("MAP").examples![0]!.code.match(/<mets:div ID=/g)).toHaveLength(16);
    for (const [from, to] of [
      ["NDK-MONO-METS-ROOT", "NDK-MONO-METS-PHYSICAL-MAP"],
      ["NDK-MONO-METS-FPTR-FILEID", "NDK-MONO-METS-PHYSICAL-PAGES"],
      ["NDK-MONO-METS-AMD-STRUCTMAP", "NDK-MONO-METS-PHYSICAL-MAP"],
    ]) expect(registry.relations).toContainEqual(expect.objectContaining({ from, to, type: "related_to" }));
  });
});
