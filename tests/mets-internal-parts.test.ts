import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "structure/mets-internal-parts");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-METS-PARTS-${suffix}`)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets")];
const modes = { field: "logical_description_mode", operator: "in", value: ["internal_parts_pages", "internal_parts_alto"] };
const parts = [...base, modes];
const map = [...parts, eq("structmap_type", "LOGICAL")];
const textCheck = (suffix: string, text: string) => expect(rule(suffix).requirement.validations).toContainEqual(expect.objectContaining({ type: "custom", expression: expect.stringContaining(text) }));

describe("METS internal parts, DMF Monografie 2.3", () => {
  it("keeps thirteen sourced rules separate from unverified implementations and excerpts", () => {
    expect(rules).toHaveLength(13);
    for (const item of rules) {
      expect(item.version).toBe("2.3");
      expect(item.source).toMatchObject({ document: "DMF Monografie", version: "2.3" });
      expect(item.references).toEqual(expect.arrayContaining([
        expect.objectContaining({ document: "METS XML Schema", version: "1.9.1" }),
        expect.objectContaining({ document: "DMF Monografie", page: 4 }),
      ]));
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("METS");
      expect(item.examples).toBeUndefined();
      expect(item.implementations).toBeUndefined();
      expect(item.validator_behaviour).toBeUndefined();
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
    }
  });
  it("preserves original M, MA and O only on the three table nodes", () => {
    expect(rule("CHAPTER")).toMatchObject({ obligation: "mandatory", obligation_code: "M" });
    expect(rule("PICTURE")).toMatchObject({ obligation: "mandatory_if_available", obligation_code: "MA", requirement: { presence: "conditional" } });
    expect(rule("PAGE")).toMatchObject({ obligation: "optional", obligation_code: "O" });
    for (const item of rules) {
      if ([rule("CHAPTER"), rule("PICTURE"), rule("PAGE")].includes(item)) expect(item.obligation_source).toBeUndefined();
      else {
        expect(item.obligation_source).toBe("prose");
        expect(item.obligation_code).toBeUndefined();
      }
    }
  });
  it("selects presence rules using expected content rather than existing nodes", () => {
    expect(rule("CHAPTER").condition).toEqual({ all: [...parts, eq("expected_internal_part", "chapter")] });
    expect(rule("PICTURE").condition).toEqual({ all: [...parts, eq("expected_internal_part", "picture")] });
    textCheck("CHAPTER", "Chybějící mapa nebo uzel nesmí kontrolu vypnout");
    textCheck("PICTURE", "nevyžadovat pro samostatný obraz umělou kapitolu");
    for (const item of rules) expect(JSON.stringify(item.condition)).not.toContain("no_internal_parts");
  });
  it("records the TYPE discrepancy without inventing a chapter value set", () => {
    const item = rule("CHAPTER-TYPE");
    expect(item.status).toBe("ambiguous");
    expect(item.verification.status).toBe("verified");
    expect(item.condition).toEqual({ all: [...map, eq("structural_level", "chapter")] });
    expect(item.requirement).toMatchObject({ presence: "required", cardinality: { min: 1, max: 1 } });
    expect(item.requirement.allowed_values).toBeUndefined();
    expect(item.requirement.validations).toEqual([expect.objectContaining({ type: "custom" })]);
    expect(item.discrepancies![0]!.cs).toContain("CHAPTER_0001");
    expect(item.discrepancies![0]!.cs).toContain("TYPE=CHAPTER");
    expect(item.interpretation?.cs).toContain("více uzlů může sdílet stejný TYPE=CHAPTER");
    expect(item.interpretation?.cs).toContain("není potvrzenou opravou vydavatele DMF");
    expect(rules.filter((entry) => entry.status === "ambiguous")).toEqual([item]);
  });
  it("distinguishes DMDID semantic targets from XML IDs and attribute cardinality", () => {
    for (const suffix of ["CHAPTER-DMDID", "PICTURE-DMDID"]) {
      expect(rule(suffix).target.entity).toBe("METS-DIV-DMDID");
      expect(rule(suffix).requirement.cardinality).toEqual({ min: 1, max: 1 });
      textCheck(suffix, "IDREFS");
      textCheck(suffix, "dmdSec téhož METS");
      expect(rule(suffix).requirement.allowed_values).toBeUndefined();
    }
    textCheck("DIV-ID", "jedinečné v celém XML dokumentu");
    expect(rule("DIV-ID").condition).toEqual({ all: [...map, { field: "structural_level", operator: "in", value: ["chapter", "picture", "logical_page"] }] });
  });
  it("keeps picture titles conditional and order distinct from pagination", () => {
    expect(rule("PICTURE-LABEL").condition).toEqual({ all: [...map, eq("structural_level", "picture"), eq("picture_has_title", true)] });
    expect(rule("PICTURE-LABEL").requirement.presence).toBe("conditional");
    textCheck("PICTURE-LABEL", "podmínku nezjišťovat z pouhé existence kontrolovaného atributu");
    textCheck("CHAPTER-ORDER", "xs:integer");
    textCheck("CHAPTER-ORDER", "ORDERLABEL");
    expect(rule("CHAPTER-ORDER").interpretation?.cs).toContain("povinný začátek od jedničky");
  });
  it("limits pointer exclusion to the page-link-only logical map", () => {
    const item = rule("NO-ALTO-POINTERS");
    expect(item.condition).toEqual({ all: [...base, eq("logical_description_mode", "internal_parts_pages")] });
    expect(item.target.entity).toBe("METS-STRUCTMAP");
    expect(item.requirement.presence).toBe("required");
    expect(item.obligation).toBe("mandatory");
    textCheck("NO-ALTO-POINTERS", "ve všech jejích potomcích");
    textCheck("NO-ALTO-POINTERS", "mets:fptr i mets:area");
    textCheck("NO-ALTO-POINTERS", "neaplikovat na fyzickou mapu");
  });
  it("keeps part and whole-unit page coverage separate in both detailed modes", () => {
    for (const suffix of ["PART-PAGE-COVERAGE", "UNIT-PAGE-COVERAGE"]) {
      expect(rule(suffix).condition).toEqual({ all: parts });
      expect(rule(suffix).source).toMatchObject({ page: 99, section: "7.8.1 Výčet stran v případě popisu vnitřních částí" });
    }
    textCheck("PART-PAGE-COVERAGE", "vazby pouze z celého svazku nestačí");
    textCheck("UNIT-PAGE-COVERAGE", "Zachovat celkový výčet");
    expect(rule("PART-PAGE-COVERAGE").interpretation?.cs).toContain("jedna strana může patřit více částem");
    expect(rule("PART-PAGE-COVERAGE").interpretation?.cs).toContain("Ani fptr/area nenahrazuje tento výčet");
  });
  it("keeps logical PAGE optional without removing physical page obligations", () => {
    expect(rule("PAGE").condition).toEqual({ all: map });
    expect(rule("PAGE").requirement).toMatchObject({ presence: "optional", cardinality: { min: 0, max: null } });
    textCheck("PAGE", "Nehlásit chybu pouze kvůli absenci logických PAGE");
    textCheck("PAGE", "kapitola nebo obraz nesmějí být podřízeny logické stránce");
    textCheck("PAGE", "Povinné fyzické stránky zůstávají zachovány");
    for (const [from, to] of [
      ["NDK-MONO-METS-LOGICAL-MAP", "NDK-MONO-METS-PARTS-CHAPTER"],
      ["NDK-MONO-METS-LOGICAL-STRUCTLINK", "NDK-MONO-METS-PARTS-PART-PAGE-COVERAGE"],
      ["NDK-MONO-METS-PARTS-PART-PAGE-COVERAGE", "NDK-MONO-METS-LOGICAL-SMLINK-TO"],
    ]) expect(registry.relations).toContainEqual(expect.objectContaining({ from, to, type: "related_to" }));
  });
});
