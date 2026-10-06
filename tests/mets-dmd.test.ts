import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "structure/mets-dmd");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-METS-DMD-${suffix}`)!;
const eq = (field: string, value: string) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets")];
const check = (suffix: string, text: string) => expect(rule(suffix).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(text) }));

describe("descriptive METS wrappers, DMF Monografie 2.3", () => {
  it("keeps eight wrapper rules under METS, not under their payload formats", () => {
    expect(rules).toHaveLength(8);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { document: "DMF Monografie", version: "2.3", page: "21–22" } });
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("METS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "METS XML Schema", version: "1.9.1" }));
      expect(item.implementations).toBeUndefined();
      expect(item.validator_behaviour).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("preserves seven table codes M and a separate prose prohibition for DC", () => {
    for (const item of rules.filter((item) => item !== rule("DC-VERSION"))) {
      expect(item).toMatchObject({ obligation: "mandatory", obligation_code: "M", requirement: { presence: "required" } });
      expect(item.obligation_source).toBeUndefined();
    }
    expect(rule("DC-VERSION")).toMatchObject({ obligation: "forbidden", obligation_source: "prose", requirement: { presence: "forbidden", cardinality: { min: 0, max: 0 } } });
    expect(rule("DC-VERSION").obligation_code).toBeUndefined();
  });
  it("limits attribute checks to descriptive wrappers and branches by actual format", () => {
    expect(rule("SECTION").condition).toEqual({ all: base });
    for (const suffix of ["ID", "WRAP"]) expect(rule(suffix).condition).toEqual({ all: [...base, eq("element_role", "descriptive_section")] });
    for (const suffix of ["MDTYPE", "MIMETYPE", "XMLDATA"]) expect(rule(suffix).condition).toEqual({ all: [...base, eq("element_role", "descriptive_wrapper")] });
    for (const format of ["MODS", "DC"]) expect(rule(`${format}-VERSION`).condition).toEqual({ all: [...base, eq("element_role", "descriptive_wrapper"), eq("descriptive_format", format)] });
    check("MDTYPE", "MDTYPE=DC nad mods:mods");
  });
  it("keeps wrapper IDs distinct from record IDs and global identifier values", () => {
    expect(rule("ID").target.entity).toBe("METS-DMDSEC-ID");
    check("ID", "jedinečné v celém XML");
    for (const part of ["TITLE_0001", "VOLUME_0001", "CHAP", "PICT", "SUPPL", "PAGE"]) check("ID", part);
    expect(rule("ID").interpretation?.cs).toContain("DMDID odkazuje na dmdSec");
    expect(rule("ID").interpretation?.cs).toContain("není ID vloženého mods:mods");
    expect(rule("ID").requirement.allowed_values).toBeUndefined();
    expect(rule("SECTION").requirement.cardinality).toEqual({ min: 1, max: null });
    check("SECTION", "modsCollection");
  });
  it("requires embedded XML but does not invent a generic prohibition of mdRef", () => {
    for (const suffix of ["WRAP", "XMLDATA"]) expect(rule(suffix).requirement.cardinality).toEqual({ min: 1, max: 1 });
    check("WRAP", "Samotný mdRef");
    expect(rule("WRAP").interpretation?.cs).toContain("nezavádí zákaz doplňkového mdRef");
    expect(rule("WRAP").interpretation?.cs).toContain("xsd:all dovoluje nejvýše jeden");
    expect(rule("XMLDATA").interpretation?.cs).toContain("processContents=lax");
    check("XMLDATA", "escapovaným XML");
    check("XMLDATA", "namespace a local-name");
  });
  it("records exact prescribed values and does not conflate the two version attributes", () => {
    expect(rule("MDTYPE").requirement.allowed_values).toEqual(["MODS", "DC"]);
    expect(rule("MODS-VERSION").requirement.allowed_values).toEqual(["3.8"]);
    expect(rule("MIMETYPE").requirement.allowed_values).toEqual(["text/xml"]);
    check("MODS-VERSION", "mods:mods/@version za náhradu");
    check("DC-VERSION", "prázdný atribut, hodnotu 1.1");
  });
  it("defines seven general METS entities with unqualified attributes", () => {
    const ids = new Set(rules.map((item) => item.target.entity));
    expect(ids.size).toBe(7);
    for (const id of ids) {
      const entity = registry.standard_entities.find((item) => item.id === id)!;
      expect(entity).toBeDefined();
      expect(entity.version).toBe("1.9.1");
      if (entity.type === "attribute") expect(entity.namespace).toBeUndefined();
      else expect(entity.namespace).toBe("http://www.loc.gov/METS/");
    }
  });
  it("ships fourteen complete source excerpts with real MODS and DC differences", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(14);
    expect(rules.every((item) => item.examples?.length)).toBe(true);
    const [mods, dc] = rule("ID").examples!;
    expect(mods!.code).toContain('ID="MODSMD_PAGE_0001"');
    expect(mods!.code).toContain('ID="MODS_PAGE_0001"');
    expect(dc!.code).toContain('ID="DCMD_PAGE_0001"');
    expect(dc!.code).not.toContain("MDTYPEVERSION");
    expect(rule("MODS-VERSION").examples![0]!.code).toContain('MDTYPEVERSION="3.8"');
    for (const example of rules.flatMap((item) => item.examples ?? [])) {
      expect(example.kind).toBe("source_excerpt");
      expect(example.file_sha256).toBe("7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473");
      expect(example.source_xpath).toMatch(/^\/mets:mets\/mets:dmdSec\[@ID=/);
    }
  });
  it("connects wrapper IDs to existing structural metadata links", () => {
    for (const suffix of ["PHYSICAL-VOLUME-DMDID", "LOGICAL-SIMPLE-VOLUME-DMDID", "PARTS-CHAPTER-DMDID", "PARTS-PICTURE-DMDID"]) {
      expect(registry.relations).toContainEqual(expect.objectContaining({ from: "NDK-MONO-METS-DMD-ID", to: `NDK-MONO-METS-${suffix}`, type: "related_to" }));
    }
  });
});
