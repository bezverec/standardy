import path from "node:path";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compileRegistry, loadRegistry, validateRegistry, compareRuleContexts } from "../packages/registry-core/src/index.ts";
import type { ComparableRule, RuleDocument } from "../packages/registry-core/src/index.ts";
import { CataloguingScope, cataloguingLabel } from "../web/registry/src/CataloguingScope.tsx";

const root = path.resolve(import.meta.dirname, "..");
const documents = await loadRegistry(root);
const rules = compileRegistry(documents).rule_versions;
const selection = { national_standard: "ndk-monograph", version: "2.3", cataloguing_rules: "rda" as const };
const rule = (id: string) => rules.find((item) => item.rule_id === `NDK-MONO-${id}`)!;

describe("cataloguing relevance audit", () => {
  it("assesses every current rule with evidence, separately from requirement verification", () => {
    expect(rules).toHaveLength(263);
    for (const item of rules) {
      expect(item.cataloguing_scope?.note.cs).toBeTruthy();
      expect(item.cataloguing_scope?.sources.length).toBeGreaterThan(0);
      expect(item.cataloguing_scope?.reviewed_on).toBe(item.category === "metadata/mods-language" ? "2026-10-08" : "2026-10-07");
      expect(item.cataloguing_scope?.sources[0]).toEqual(item.source);
    }
    expect(rules.filter((item) => item.cataloguing_scope?.applicability === "independent")).toHaveLength(204);
    expect(rules.filter((item) => item.cataloguing_rules?.length === 2)).toHaveLength(54);
    expect(rules.filter((item) => item.cataloguing_rules?.length === 1)).toHaveLength(5);
  });

  it("distinguishes structural MODS, common descriptive requirements, and RDA-specific clauses", () => {
    expect(rule("MODS-SINGLE-GENRE-STRUCTURAL").cataloguing_scope?.applicability).toBe("independent");
    for (const id of ["MODS-SINGLE-TITLE", "MODS-SINGLE-NAME", "MODS-SINGLE-ETAL", "MODS-SINGLE-GENRE-DESCRIPTIVE"]) {
      expect(rule(id).cataloguing_rules).toEqual(["aacr2", "rda"]);
      expect(rule(id).cataloguing_scope?.sources.some((source) => source.page === 24)).toBe(true);
    }
    expect(rule("MODS-SINGLE-ORIGIN-COPYRIGHT-NO-ROLE").cataloguing_rules).toEqual(["rda"]);
    for (const id of ["MIX-ICC-PROFILE-VERSION", "INFO-TITLE-ID", "METS-ROOT-LABEL", "PREMIS-AGENT-NAME"]) {
      expect(rule(id).cataloguing_rules).toBeUndefined();
      expect(rule(id).cataloguing_scope?.applicability).toBe("independent");
    }
  });

  it("includes independent rules in either regime, even without a comparison key", () => {
    const independent = rule("MIX-ICC-PROFILE-VERSION");
    const result = compareRuleContexts([independent], { ...selection, cataloguing_rules: "aacr2" }, selection);
    expect(result.unmapped).toEqual({ left: [independent], right: [independent] });
    expect(result.unresolved_context).toEqual({ left: [], right: [] });
    const mapped = { ...rule("INFO-CHECKSUM"), comparison: { key: "test.integrity", note: { cs: "Synthetic fixture" } } };
    expect(compareRuleContexts([mapped], { ...selection, cataloguing_rules: "aacr2" }, selection).comparisons[0]?.status).toBe("same_recorded_requirement");
  });

  it("never infers independence from namespace, category, missing metadata or an unaudited assessment", () => {
    const unknown = structuredClone(rule("MIX-ICC-PROFILE-VERSION"));
    delete unknown.cataloguing_scope;
    expect(compareRuleContexts([unknown], selection, selection).unresolved_context.left).toEqual([unknown]);
    unknown.cataloguing_scope = { ...rule("MIX-ICC-PROFILE-VERSION").cataloguing_scope!, applicability: "undetermined" };
    expect(compareRuleContexts([unknown], selection, selection).unresolved_context.left).toEqual([unknown]);
    const noFilter = { national_standard: selection.national_standard, version: selection.version };
    expect(compareRuleContexts([unknown], noFilter, noFilter).unmapped.left).toEqual([unknown]);
  });

  it("compares applicability but not audit dates or wording", () => {
    const original: ComparableRule = { ...rule("INFO-CHECKSUM"), comparison: { key: "test.integrity", note: { cs: "Test" } } };
    const other: ComparableRule = { ...structuredClone(original), national_standard_id: "test-dmf" };
    const right = { ...selection, national_standard: "test-dmf" };
    other.cataloguing_scope!.reviewed_on = "2026-10-08";
    other.cataloguing_scope!.note = { cs: "Different audit prose" };
    expect(compareRuleContexts([original, other], selection, right).comparisons[0]?.status).toBe("same_recorded_requirement");
    other.cataloguing_scope!.applicability = "applicable";
    other.cataloguing_rules = ["aacr2", "rda"];
    expect(compareRuleContexts([original, other], selection, right).comparisons[0]?.status).toBe("different_context");
  });

  it("rejects contradictory scopes and incomplete evidence", async () => {
    const cloned = structuredClone(documents);
    const version = (cloned.find((doc) => doc.id === "NDK-MONO-INFO-CHECKSUM") as RuleDocument).versions[0]!;
    version.cataloguing_rules = ["rda"];
    expect(await validateRegistry(root, cloned)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("cataloguing_rules requires applicable") }));
    delete version.cataloguing_rules;
    version.condition = { field: "cataloguing_rules", operator: "equals", value: "rda" };
    expect(await validateRegistry(root, cloned)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("condition requires applicable") }));
    delete version.condition;
    version.cataloguing_scope!.applicability = "applicable";
    expect(await validateRegistry(root, cloned)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("applicable cataloguing_scope requires") }));
    version.cataloguing_scope!.applicability = "independent";
    version.cataloguing_scope!.sources = [];
    expect((await validateRegistry(root, cloned)).length).toBeGreaterThan(0);
  });

  it("renders independent, common, specific and unknown scope without a misleading blanket warning", () => {
    expect(cataloguingLabel(rule("INFO-CHECKSUM"))).toBe("Nezávislé na katalogizačních pravidlech");
    expect(cataloguingLabel(rule("MODS-SINGLE-TITLE"))).toBe("Společný předpis pro AACR2 a RDA");
    expect(cataloguingLabel(rule("MODS-SINGLE-ORIGIN-EVENT-TYPE"))).toBe("Pouze RDA");
    expect(cataloguingLabel({})).toBe("Katalogizační rozsah dosud neurčen");
    const item = structuredClone(rule("INFO-CHECKSUM"));
    item.cataloguing_scope!.sources[0]!.url = "javascript:alert(1)";
    item.cataloguing_scope!.note.cs = "<script>alert(1)</script>";
    const html = renderToStaticMarkup(createElement(CataloguingScope, { rule: item }));
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("nelze předpokládat platnost");
  });
});
