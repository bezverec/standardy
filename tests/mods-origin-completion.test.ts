import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";
import { targetStandardId } from "../packages/registry-core/src/metadata-taxonomy.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((item) => item.category === "metadata/mods-origin-completion");
const rule = (suffix: string) => rules.find((item) => item.rule_id === `NDK-MONO-MODS-SINGLE-${suffix}`)!;
const eq = (field: string, value: string | boolean) => ({ field, operator: "equals", value });
const base = [eq("object_type", "monograph"), eq("document_role", "main_mets"), eq("bibliographic_level", "single_volume"), eq("element_role", "mods_record")];
const check = (id: string, text: string) => expect(rule(id).requirement.validations).toContainEqual(expect.objectContaining({ expression: expect.stringContaining(text) }));

describe("MODS copyright, creation, edition and issuance, DMF 2.3", () => {
  it("adds five scoped, source-backed rules and four MODS 3.8 entities", () => {
    expect(rules).toHaveLength(5);
    expect(new Set(rules.map((item) => item.target.entity)).size).toBe(4);
    for (const item of rules) {
      expect(item).toMatchObject({ version: "2.3", status: "normative", source: { version: "2.3", page: 53 }, verification: { status: "verified" } });
      expect(item.source.section).toContain("54");
      expect(targetStandardId(item.target.entity, registry.relations)).toBe("MODS");
      expect(item.references).toContainEqual(expect.objectContaining({ document: "MODS XML Schema", version: "3.8" }));
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
      expect(item.cataloguing_scope?.sources.some((source) => source.page === 24)).toBe(true);
      expect(item.interpretation?.cs).toContain("Custom kontroly registr nevykonává");
      expect(item.interpretation?.cs).toContain("neznámá hodnota není false");
      expect(item.implementations).toBeUndefined();
      const entity = registry.standard_entities.find((entity) => entity.id === item.target.entity)!;
      expect(entity).toMatchObject({ version: "3.8", namespace: "http://www.loc.gov/mods/v3", type: "element" });
    }
  });
  it("preserves three recommendations, one M and one explicit scoped non-use without an invented code", () => {
    expect(rules.filter((item) => item.obligation_code === "R")).toHaveLength(3);
    for (const id of ["COPYRIGHT-DATE", "DATE-CREATED", "EDITION"]) {
      expect(rule(id)).toMatchObject({ obligation: "recommended", requirement: { presence: "optional", cardinality: { min: 0, max: null } } });
      expect(rule(id).requirement.pattern).toBeUndefined();
    }
    expect(rule("ISSUANCE")).toMatchObject({ obligation_code: "M", requirement: { presence: "required", cardinality: { min: 1, max: null } } });
    expect(rule("COPYRIGHT-DATE-RDA-SOURCE")).toMatchObject({ obligation: "forbidden", obligation_source: "prose", non_use: { basis: "explicit" }, requirement: { presence: "forbidden", cardinality: { min: 0, max: 0 } } });
    expect(rule("COPYRIGHT-DATE-RDA-SOURCE").obligation_code).toBeUndefined();
  });
  it("separates copyright from publication and exposes the unresolved source collision", () => {
    expect(rule("COPYRIGHT-DATE").condition).toEqual({ all: base });
    check("COPYRIGHT-DATE", "008/11–14");
    check("COPYRIGHT-DATE", "008/07–10 zůstává datem vydání");
    check("COPYRIGHT-DATE", "Při rozporu 008 a 264_4$c");
    expect(rule("COPYRIGHT-DATE").discrepancies?.[0]?.cs).toContain("neurčuje postup");
    expect(rule("COPYRIGHT-DATE").interpretation?.cs).toContain("právní stav");
  });
  it("requires independent evidence of RDA and missing 264_4$c, not missing target XML", () => {
    expect(rule("COPYRIGHT-DATE-RDA-SOURCE").cataloguing_rules).toEqual(["rda"]);
    expect(rule("COPYRIGHT-DATE-RDA-SOURCE").condition).toEqual({ all: [...base, eq("cataloguing_rules", "rda"), eq("copyright_264_4_c_present", false)] });
    check("COPYRIGHT-DATE-RDA-SOURCE", "Neznámá dostupnost původního MARC není doloženou absencí");
    expect(rule("COPYRIGHT-DATE-RDA-SOURCE").interpretation?.cs).toContain("sama neprokazuje katalogizační režim");
  });
  it("limits the manuscript recommendation by LDR/06, without silently repairing the duplicated MARC reference", () => {
    expect(rule("DATE-CREATED").condition).toEqual({ all: [...base, { field: "marc_leader_06", operator: "in", value: ["d", "f", "t"] }] });
    expect(rule("DATE-CREATED").discrepancies?.[0]?.cs).toContain("264_0$c / 264_0$c");
    check("DATE-CREATED", "Nezaměnit LDR/06 s LDR/07");
    check("DATE-CREATED", "datum rukopisu s datem skenování");
    expect(rule("DATE-CREATED").interpretation?.cs).toContain("R není MA");
  });
  it("keeps edition a textual statement from 250$a, not a volume number or an inferred first edition", () => {
    expect(rule("EDITION").condition).toEqual({ all: base });
    check("EDITION", "MARC 250$a");
    check("EDITION", "ani nedoplňovat první vydání");
    check("EDITION", "číslem svazku v partNumber");
    check("EDITION", "automaticky nepřipojuje 250$b");
  });
  it("retains the literal issuance vocabulary and separately checks its meaning", () => {
    expect(rule("ISSUANCE").condition).toEqual({ all: base });
    expect(rule("ISSUANCE").requirement.allowed_values).toEqual(["monographic", "multipart monograph", "single unit"]);
    check("ISSUANCE", "LDR/07=m samo nerozlišuje");
    check("ISSUANCE", "Multipart monograph označit k posouzení");
    expect(rule("ISSUANCE").discrepancies).toHaveLength(1);
    const entity = registry.standard_entities.find((item) => item.id === "MODS-ISSUANCE")!;
    expect(entity.definition?.cs).toContain("integrating resource");
    expect(rule("ISSUANCE").interpretation?.cs).toContain("nepožadujeme současně obecný i podrobný zápis");
  });
  it("includes four common requirements in both regimes and excludes the RDA clause only from AACR2", () => {
    const selection = { national_standard: "ndk-monograph", version: "2.3" };
    const result = compareRuleContexts(rules, { ...selection, cataloguing_rules: "aacr2" }, { ...selection, cataloguing_rules: "rda" });
    expect(result.unmapped.left).toHaveLength(4);
    expect(result.unmapped.right).toHaveLength(5);
    expect(result.excluded_context.left).toEqual([rule("COPYRIGHT-DATE-RDA-SOURCE")]);
    expect(result.excluded_context.right).toEqual([]);
    expect(result.unresolved_context).toEqual({ left: [], right: [] });
    expect(result.comparisons).toEqual([]); // No invented semantic pairing keys.
  });
  it("adds only the issuance excerpt actually present in the supplied SIP", () => {
    expect(rules.flatMap((item) => item.examples ?? [])).toHaveLength(1);
    expect(rule("ISSUANCE").examples![0]).toMatchObject({ kind: "source_excerpt", file_sha256: "7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473" });
    expect(rule("ISSUANCE").examples![0]!.code).toContain(">single unit</mods:issuance>");
    expect(rule("ISSUANCE").examples![0]!.source_xpath).toContain("/mods:originInfo/mods:issuance");
    expect(rule("ISSUANCE").examples![0]!.note?.cs).toContain("Původní MARC nebyl analyzován");
    for (const item of rules) expect(registry.relations).toContainEqual(expect.objectContaining({ from: item.rule_id, to: item.target.entity, type: "restricts" }));
  });
});
