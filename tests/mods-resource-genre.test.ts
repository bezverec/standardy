import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-resource-genre");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-${suffix}`)!;
const eq = (field: string, value: string) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume")];
const check = (suffix: string, text: string) => expect(rule(suffix).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(text) }));

describe("MODS resource types and genres of a single-volume monograph, DMF 2.3", () => {
  it("classifies four version-pinned rules under MODS without asserting implementation support", () => {
    expect(rules).toHaveLength(4);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { document: "DMF Monografie", version: "2.3" } });
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(item.implementations).toBeUndefined();
      expect(item.validator_behaviour).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("checks the record rather than requiring an already-correct genre to activate M", () => {
    for (const suffix of ["RESOURCE-TYPE", "GENRE-STRUCTURAL", "GENRE-DESCRIPTIVE"]) expect(rule(suffix).condition).toEqual({ all: [...base, eq("element_role", "mods_record")] });
    expect(rule("GENRE-AUTHORITY").condition).toEqual({ all: [...base, eq("element_role", "mods_descriptive_genre")] });
    for (const item of rules) expect(item.interpretation?.cs).toContain("neznámý druh není potvrzení správnosti");
  });
  it("preserves one M and three R without converting recommendation to RA", () => {
    expect(rules.filter((item) => item.obligation_code === "M")).toHaveLength(1);
    expect(rules.filter((item) => item.obligation_code === "R")).toHaveLength(3);
    expect(rule("GENRE-STRUCTURAL")).toMatchObject({ obligation: "mandatory", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    for (const item of rules.filter((item) => item.obligation_code === "R")) expect(item).toMatchObject({ obligation: "recommended", requirement: { presence: "optional", cardinality: { min: 0 } } });
  });
  it("keeps the four resource and structural values semantically paired", () => {
    expect(rule("RESOURCE-TYPE").requirement.allowed_values).toEqual(["text", "cartographic", "still image", "notated music"]);
    expect(rule("GENRE-STRUCTURAL").requirement.allowed_values).toEqual(["volume", "cartographic", "graphic", "sheetmusic"]);
    for (const [kind, resource, structural] of [["textová monografie", "text", "volume"], ["kartografický dokument", "cartographic", "cartographic"], ["grafický dokument", "still image", "graphic"], ["hudebnina", "notated music", "sheetmusic"]]) {
      check("RESOURCE-TYPE", `${kind} → ${resource}`);
      check("GENRE-STRUCTURAL", `${kind} → ${structural}`);
    }
    check("RESOURCE-TYPE", "LDR/06");
  });
  it("does not apply the structural enum to additional bibliographic genres", () => {
    expect(rule("GENRE-DESCRIPTIVE").target.entity).toBe(rule("GENRE-STRUCTURAL").target.entity);
    expect(rule("GENRE-DESCRIPTIVE").requirement.allowed_values).toBeUndefined();
    check("GENRE-STRUCTURAL", "pouze na strukturální podmnožinu genre");
    check("GENRE-DESCRIPTIVE", "655, 336 a 008");
    expect(rule("GENRE-STRUCTURAL").interpretation?.cs).toContain("Výskyt biografie nesmí vypnout kontrolu chybějícího volume");
  });
  it("keeps czenas a recommendation and never silently relabels marcgt terms", () => {
    expect(rule("GENRE-AUTHORITY").requirement.allowed_values).toEqual(["czenas"]);
    expect(rule("GENRE-AUTHORITY").requirement.cardinality).toEqual({ min: 0, max: 1 });
    check("GENRE-AUTHORITY", "Pouhá změna atributu bez odpovídajícího termínu není opravou");
    expect(rule("GENRE-AUTHORITY").interpretation?.cs).toContain("nikoli povinný zákaz všech jiných slovníků");
    expect(rule("GENRE-AUTHORITY").interpretation?.cs).toContain("služba nebyla dotazována");
  });
  it("documents DC mappings without treating DC model values as MODS genre values", () => {
    for (const value of ["model:monograph", "model:map", "model:graphic", "model:sheetmusic"]) expect(rule("GENRE-STRUCTURAL").interpretation?.cs).toContain(value);
    expect(rule("GENRE-DESCRIPTIVE").interpretation?.cs).toContain("bez prefixu model:");
    expect(rule("GENRE-STRUCTURAL").interpretation?.cs).toContain("nekontroluje samostatně obsah DC");
  });
  it("adds three MODS targets, with authority unqualified and XSD distinct from NDK", () => {
    const ids = new Set(rules.map((item) => item.target.entity));
    expect(ids.size).toBe(3);
    for (const id of ids) {
      const entity = registry.standard_entities.find((item) => item.id === id)!;
      expect(entity).toMatchObject({ version: "3.8", status: "normative" });
      if (entity.type === "attribute") expect(entity.namespace).toBeUndefined();
      else expect(entity.namespace).toBe("http://www.loc.gov/mods/v3");
    }
    expect(registry.standard_entities.find((item) => item.id === "MODS-TYPE-OF-RESOURCE")!.definition?.cs).toContain("není uzavřený výčet");
  });
  it("ships six anchored excerpts including the contrasting marcgt authority", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(6);
    for (const item of rules) for (const example of item.examples!) {
      expect(example).toMatchObject({ kind: "source_excerpt", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473" });
      expect(example.source_xpath).toContain('mets:dmdSec[@ID="MODSMD_VOLUME_0001"]');
    }
    expect(rule("RESOURCE-TYPE").examples![0]!.code).toContain(">text</mods:typeOfResource>");
    expect(rule("GENRE-STRUCTURAL").examples![0]!.code).toContain(">volume</mods:genre>");
    const otherAuthority = rule("GENRE-AUTHORITY").examples!.find((item) => item.code.includes('authority="marcgt"'))!;
    expect(otherAuthority.note?.cs).toContain("ne splnění doporučení czenas");
    expect(registry.relations).toContainEqual(expect.objectContaining({ from: "NDK-MONO-MODS-SINGLE-GENRE-STRUCTURAL", to: "NDK-MONO-METS-DMD-XMLDATA", type: "related_to" }));
  });
});
