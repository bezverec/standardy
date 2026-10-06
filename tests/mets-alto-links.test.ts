import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "structure/mets-alto-links");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-METS-ALTO-${suffix}`)!;
const eq = (field: string, value: string) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("logical_description_mode", "internal_parts_alto"), eq("structmap_type", "LOGICAL")];
const roles = { field: "logical_content_role", operator: "in", value: ["text_block", "image_block", "image_only_page"] };
const block = [...base, roles];
const textCheck = (suffix: string, text: string) => expect(rule(suffix).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(text) }));

describe("METS links to ALTO blocks, DMF Monografie 2.3", () => {
  it("keeps eight prose rules in structural METS despite ALTO citations", () => {
    expect(rules).toHaveLength(8);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", obligation: "mandatory", obligation_source: "prose" });
      expect(item.obligation_code).toBeUndefined();
      expect(item.source).toMatchObject({ document: "DMF Monografie", version: "2.3" });
      expect(item.references).toEqual(expect.arrayContaining([
        expect.objectContaining({ document: "METS XML Schema", version: "1.9.1" }),
        expect.objectContaining({ document: "ALTO XML Schema", version: "2.0" }),
        expect.objectContaining({ document: "ALTO XML Schema", version: "4.4" }),
      ]));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("METS");
      expect(item.implementations).toBeUndefined();
      expect(item.validator_behaviour).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("does not activate block links in the simple or page-link-only modes", () => {
    expect(rule("FPTR").condition).toEqual({ all: block });
    expect(rule("AREA").condition).toEqual({ all: [...block, eq("element_role", "alto_block_pointer")] });
    for (const suffix of ["FILEID", "BEGIN", "BETYPE"]) expect(rule(suffix).condition).toEqual({ all: [...block, eq("element_role", "alto_block_area")] });
    expect(rule("FPTR").requirement.cardinality).toEqual({ min: 1, max: null });
    expect(rule("AREA").requirement.cardinality).toEqual({ min: 1, max: 1 });
    textCheck("FPTR", "Nepodmiňovat kontrolu přítomností fptr");
    const pageOnly = registry.rule_versions.find((item) => item.rule_id === "NDK-MONO-METS-PARTS-NO-ALTO-POINTERS")!;
    expect(JSON.stringify(pageOnly.condition)).toContain("internal_parts_pages");
    expect(JSON.stringify(pageOnly.condition)).not.toContain("internal_parts_alto");
  });
  it("models the element and attribute targets without merging fptr and area FILEID", () => {
    for (const id of ["METS-FPTR", "METS-AREA"]) expect(registry.standard_entities).toContainEqual(expect.objectContaining({ id, type: "element", namespace: "http://www.loc.gov/METS/" }));
    for (const suffix of ["FILEID", "BEGIN", "BETYPE"]) {
      expect(rule(suffix).target.entity).toBe(`METS-AREA-${suffix}`);
      const entity = registry.standard_entities.find((item) => item.id === `METS-AREA-${suffix}`)!;
      expect(entity.type).toBe("attribute");
      expect(entity.namespace).toBeUndefined();
    }
    expect(rule("FILEID").target.entity).not.toBe("METS-FPTR-FILEID");
    expect(rule("FILEID").discrepancies![0]!.cs).toContain("areaType však vyžaduje vlastní FILEID");
    expect(rule("FILEID").interpretation?.cs).toContain("samotné XSD jeho souběžný výskyt nezakazuje");
  });
  it("resolves the selected ALTO file before BEGIN and preserves its string datatype", () => {
    textCheck("FILEID", "file v fileSec téhož METS");
    textCheck("FILEID", "JPEG 2000, TXT, dmdSec");
    textCheck("BEGIN", "shoda ID v jiném souboru nestačí");
    textCheck("BEGIN", "Požadovat právě jeden");
    expect(rule("BEGIN").interpretation?.cs).toContain("xs:string, nikoli xs:IDREF");
    expect(rule("BEGIN").interpretation?.cs).toContain("Stejné ID se může opakovat");
    expect(rule("BEGIN").requirement.allowed_values).toBeUndefined();
    expect(rule("BETYPE").requirement.allowed_values).toEqual(["IDREF"]);
  });
  it("separates text targets from image targets and the image-only-page exception", () => {
    expect(rule("TEXT-BLOCK").condition).toEqual({ all: [...base, eq("logical_content_role", "text_block"), eq("element_role", "alto_block_area")] });
    expect(rule("IMAGE-BLOCK").condition).toEqual({ all: [...base, { field: "logical_content_role", operator: "in", value: ["image_block", "image_only_page"] }, eq("element_role", "alto_block_area")] });
    textCheck("TEXT-BLOCK", "TextBlock ve správném namespace");
    textCheck("TEXT-BLOCK", "Page, TextLine, String");
    textCheck("IMAGE-BLOCK", "ComposedBlock");
    textCheck("IMAGE-BLOCK", "přímým Illustration");
    textCheck("IMAGE-BLOCK", "stránky obsahující jen obraz a žádný text");
    expect(rule("IMAGE-BLOCK").interpretation?.cs).toContain("Není nutné vymýšlet textovou kapitolu");
    expect(rule("IMAGE-BLOCK").examples).toBeUndefined();
  });
  it("limits the type vocabulary to described sub-blocks, not every logical div", () => {
    const item = rule("BLOCK-TYPE");
    expect(item.requirement.allowed_values).toEqual(["TITLE", "SUBTITLE", "AUTHOR", "TRANSLATOR", "NORMAL_TEXT", "NOTE", "CAPTION", "PICT_AUTHOR", "PICT_TITLE", "IMAGE"]);
    expect(item.condition).toEqual({ all: [...base, { field: "logical_content_role", operator: "in", value: ["text_block", "image_block"] }] });
    expect(item.interpretation?.cs).toContain("Nejde o úplný číselník všech logických div");
    expect(item.interpretation?.cs).toContain("nepředepisuje existenci všech deseti částí");
  });
  it("ships four actual file/block excerpts without inventing a METS linkage or minor version", () => {
    const examples = rules.flatMap((item) => item.examples ?? []);
    expect(examples).toHaveLength(4);
    expect(rules.filter((item) => item.examples?.length)).toHaveLength(3);
    const pair = rule("TEXT-BLOCK").examples!;
    expect(pair[0]!.code).toContain('ID="alto_0001"');
    expect(pair[0]!.code).toContain('xlink:href="alto/alto_75faba8d-c629-11f0-8950-12e8557df20e_0001.xml"');
    expect(pair[1]!.code).toContain('<TextBlock ID="Page1_Block1"');
    expect(pair[1]!.file_sha256).toBe("a130c403cfbcf41119e3eba49cba65cd0a831d47a1d4f74e4a399edb54f6d326");
    expect(pair[1]!.source.version).toBe("ALTO namespace v4 (minor verze ve zdroji neuvedena)");
    for (const example of examples) {
      expect(example.kind).toBe("source_excerpt");
      expect(example.note.cs).toContain("ukázka nedokládá existenci fptr/area");
      expect(example.code).not.toContain("<mets:area");
    }
  });
  it("connects logical blocks to existing files and page coverage without replacing them", () => {
    for (const [from, to] of [
      ["NDK-MONO-METS-PARTS-CHAPTER", "NDK-MONO-METS-ALTO-FPTR"],
      ["NDK-MONO-METS-PARTS-PICTURE", "NDK-MONO-METS-ALTO-IMAGE-BLOCK"],
      ["NDK-MONO-METS-ALTO-FILEID", "NDK-MONO-METS-FPTR-FILEID"],
      ["NDK-MONO-METS-ALTO-AREA", "NDK-MONO-METS-PARTS-PART-PAGE-COVERAGE"],
    ]) expect(registry.relations).toContainEqual(expect.objectContaining({ from, to, type: "related_to" }));
    const coverage = registry.rule_versions.find((item) => item.rule_id === "NDK-MONO-METS-PARTS-PART-PAGE-COVERAGE")!;
    expect(coverage.interpretation?.cs).toContain("Ani fptr/area nenahrazuje tento výčet");
  });
});
