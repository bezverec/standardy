import path from "node:path";
import { describe, expect, it } from "vitest";
import { compareRuleContexts, compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((rule) => rule.national_standard_id === "ndk-periodical" && rule.category !== "technical/mix-basic");
const per = { national_standard: "ndk-periodical", version: "2.2" };
const mono = { national_standard: "ndk-monograph", version: "2.3" };
const get = (suffix: string) => rules.find((rule) => rule.rule_id === `NDK-PER-MIX-${suffix}`)!;
const validations = (rule: (typeof rules)[number]) => rule.requirement.validations as Array<{ type: string; expression: string }>;
const pages: Record<string, string> = {
  "IMAGE-WIDTH": "70", "IMAGE-HEIGHT": "70", "COLOR-SPACE": "70",
  "SAMPLING-FREQUENCY-PLANE": "74", "SAMPLING-FREQUENCY-UNIT": "74",
  "X-SAMPLING-FREQUENCY": "74–75", "Y-SAMPLING-FREQUENCY": "75",
  "BITS-PER-SAMPLE-VALUE": "75", "BITS-PER-SAMPLE-UNIT": "75", "SAMPLES-PER-PIXEL": "75",
};

describe("digitized periodicals 2.2: first MIX comparison set", () => {
  it("records ten independently sourced technical rules, not e-born or copied SIP evidence", () => {
    expect(rules).toHaveLength(10);
    expect(registry.national_standards.find((item) => item.id === per.national_standard)).toBeDefined();
    expect(rules.filter((rule) => rule.obligation_code === "M")).toHaveLength(6);
    expect(rules.filter((rule) => rule.obligation_code === "MA")).toHaveLength(2);
    expect(rules.filter((rule) => rule.obligation_code === "R")).toHaveLength(2);
    for (const [suffix, page] of Object.entries(pages)) {
      const rule = get(suffix);
      expect(rule.version).toBe("2.2");
      expect(rule.source).toMatchObject({ document: "DMF Periodika", version: "2.2", url: "https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_periodika_2.2_final.pdf" });
      expect(String(rule.source.page)).toBe(page);
      expect(rule.cataloguing_scope?.applicability).toBe("independent");
      expect(rule.cataloguing_scope?.sources).toContainEqual(rule.source);
      expect(rule.cataloguing_rules).toBeUndefined();
      expect(rule.object_types?.values).toEqual(["periodical"]);
      expect(rule.condition).toMatchObject({ all: expect.arrayContaining([
        { field: "object_type", operator: "equals", value: "periodical" },
        { field: "file_role", operator: "in", value: ["MC", "PS"] },
      ]) });
      expect(rule.verification.status).toBe("verified");
      expect(rule.verification.reference).toContain("Nástroje ani periodický SIP nebyly ověřeny");
      expect(rule.examples ?? []).toHaveLength(0);
      expect(rule.implementations ?? []).toHaveLength(0);
    }
  });

  it("keeps conditional sampling, repeatable samples and open colour values", () => {
    for (const axis of ["X", "Y"]) {
      const rule = get(`${axis}-SAMPLING-FREQUENCY`);
      expect(rule.requirement.presence).toBe("conditional");
      expect(rule.condition).toMatchObject({ all: expect.arrayContaining([
        { field: "xpath:/mix:mix/mix:ImageAssessmentMetadata/mix:SpatialMetrics/mix:samplingFrequencyUnit", operator: "in", value: ["in.", "cm"] },
      ]) });
      expect(validations(rule).map((item) => item.expression)).toEqual(expect.arrayContaining([
        expect.stringMatching(/\/mix:numerator$/), expect.stringMatching(/\/mix:denominator$/),
      ]));
      expect(rule.interpretation?.cs).toContain("neurčuje minimální PPI");
    }
    expect(get("SAMPLING-FREQUENCY-UNIT").requirement.allowed_values).toEqual(["no absolute unit of measurement", "in.", "cm"]);
    expect(get("BITS-PER-SAMPLE-VALUE").requirement.cardinality).toEqual({ min: 1, max: null });
    expect(get("COLOR-SPACE").requirement.allowed_values).toBeUndefined();
    expect(get("SAMPLES-PER-PIXEL").requirement.allowed_values).toBeUndefined();
    for (const suffix of ["IMAGE-WIDTH", "IMAGE-HEIGHT", "BITS-PER-SAMPLE-VALUE", "SAMPLES-PER-PIXEL"]) {
      const expression = validations(get(suffix)).find((item) => item.type === "regex")?.expression;
      const regex = new RegExp(expression!);
      for (const value of ["1", "8", "  +0003\n"]) expect(regex.test(value)).toBe(true);
      for (const value of ["0", "-1", "8,8,8", "1.5"]) expect(regex.test(value)).toBe(false);
    }
  });

  it("pairs only reviewed technical aspects and retains the document-scope difference", () => {
    expect(new Set(rules.map((rule) => rule.comparison?.key)).size).toBe(10);
    for (const rule of rules) {
      const counterpart = registry.rule_versions.find((item) => item.rule_id === rule.rule_id.replace("NDK-PER-", "NDK-MONO-"))!;
      expect(counterpart.comparison?.key).toBe(rule.comparison?.key);
      expect(rule.comparison?.note.cs).toContain("DMF Monografie 2.3");
      expect(rule.comparison?.note.cs).toContain("DMF Periodika 2.2");
      expect(rule.requirement).toEqual(counterpart.requirement);
      expect(rule.obligation).toBe(counterpart.obligation);
      expect(rule.target).toEqual(counterpart.target);
    }
    for (const [left, right] of [[mono, per], [per, mono]]) {
      const result = compareRuleContexts(registry.rule_versions, left!, right!);
      const pairs = result.comparisons.filter((item) => item.key.startsWith("mix.mc-ps."));
      expect(pairs).toHaveLength(18);
      for (const pair of pairs) {
        expect(pair.status).toBe("same_recorded_requirement");
        expect(pair.left).toHaveLength(1);
        expect(pair.right).toHaveLength(1);
        expect(pair.scope_changes.some((change) => change.field.startsWith("object_types."))).toBe(true);
        expect(pair.changes).toEqual([]);
        expect(pair.changes.some((change) => change.field === "requirement" || change.field.startsWith("requirement."))).toBe(false);
      }
    }
    const same = compareRuleContexts(registry.rule_versions, { ...per, cataloguing_rules: "aacr2" }, { ...per, cataloguing_rules: "rda" });
    expect(same.comparisons).toHaveLength(18);
    expect(same.comparisons.every((item) => item.status === "same_recorded_requirement")).toBe(true);
    expect(same.excluded_context).toEqual({ left: [], right: [] });
    expect(same.unresolved_context).toEqual({ left: [], right: [] });
    const cross = compareRuleContexts(registry.rule_versions, { ...mono, cataloguing_rules: "aacr2" }, per);
    expect(cross.comparisons.find((item) => item.key === "mods.descriptive-origin.event-type")?.status).toBe("no_counterpart");
    expect(cross.notice).toContain("neznamená, že DMF údaj neupravuje");
  });

  it("does not hide real requirement or applicability changes behind document scope", () => {
    const right = get("X-SAMPLING-FREQUENCY");
    const left = registry.rule_versions.find((rule) => rule.rule_id === "NDK-MONO-MIX-X-SAMPLING-FREQUENCY")!;
    const compare = (candidate: typeof right) => compareRuleContexts([left, candidate], mono, per).comparisons[0]!;
    for (const mutate of [
      (r: typeof right) => { r.obligation = "recommended"; },
      (r: typeof right) => { r.requirement.cardinality = { min: 0, max: 2 }; },
      (r: typeof right) => { r.requirement.allowed_values = ["300"]; },
      (r: typeof right) => { r.normative_requirement = { cs: "Odlišný slovní požadavek." }; },
    ]) {
      const candidate = structuredClone(right); mutate(candidate);
      expect(compare(candidate).status).toBe("difference_for_review");
      expect(compare(candidate).scope_changes.length).toBeGreaterThan(0);
    }
    for (const extra of [
      { field: "file_role", operator: "equals" as const, value: "MC" },
      { field: "bibliographic_level", operator: "equals" as const, value: "periodical_issue" },
      { field: "cataloguing_rules", operator: "equals" as const, value: "rda" },
      { field: "xpath:/mix:mix/mix:ImageAssessmentMetadata/mix:SpatialMetrics/mix:samplingFrequencyUnit", operator: "equals" as const, value: "cm" },
    ]) {
      const candidate = structuredClone(right);
      if (!candidate.condition || !("all" in candidate.condition)) throw new Error("Expected conjunction");
      candidate.condition.all.push(extra);
      expect(compare(candidate).status).toBe("different_context");
      expect(compare(candidate).scope_changes.length).toBeGreaterThan(0);
    }
    expect(compare({ ...right, cataloguing_rules: ["rda"] }).status).toBe("different_context");
    expect(compare({ ...right, verification: { ...right.verification, status: "unverified" } }).status).toBe("unverified");
    expect(compare({ ...right, status: "disputed" }).status).toBe("unverified");
  });

  it("fails closed on complex, missing, conflicting or unpaired document scopes", () => {
    const right = get("IMAGE-WIDTH");
    const left = registry.rule_versions.find((rule) => rule.rule_id === "NDK-MONO-MIX-IMAGE-WIDTH")!;
    const compare = (candidate: typeof right) => compareRuleContexts([left, candidate], mono, per).comparisons[0]!;
    const leaf = { field: "object_type", operator: "equals" as const, value: "periodical" };
    for (const condition of [undefined, { any: [leaf] }, { not: leaf },
      { all: [{ any: [leaf] }] }, { all: [leaf, { not: leaf }] },
      { field: "object_type", operator: "equals" as const, value: "other" },
    ]) {
      const candidate = structuredClone(right);
      if (condition) candidate.condition = condition; else delete candidate.condition;
      const result = compare(candidate);
      expect(result.scope_changes).toEqual([]);
      expect(result.status).toBe("different_context");
    }
    for (const object_types of [undefined, { vocabulary: "OTHER", values: ["periodical"] },
      { vocabulary: "NDK-OBJECT-TYPES", values: ["periodical", "monograph"] }]) {
      const candidate = structuredClone(right);
      if (object_types) candidate.object_types = object_types; else delete candidate.object_types;
      const result = compare(candidate);
      expect(result.scope_changes).toEqual([]);
      expect(result.status).toBe("different_context");
    }
    const unpaired = structuredClone(right);
    delete unpaired.comparison;
    const result = compare(unpaired);
    expect(result.status).toBe("no_counterpart");
    expect(result.scope_changes).toEqual([]);
    // Within one DMF a changed document scope remains a substantive context change.
    const sameDmf = { ...right, national_standard_id: mono.national_standard, version: "test" };
    const changed = compareRuleContexts([left, sameDmf], mono, { ...mono, version: "test" }).comparisons[0]!;
    expect(changed.status).toBe("different_context");
    expect(changed.scope_changes).toEqual([]);
    const ambiguous = compareRuleContexts([left, right, { ...right, rule_id: "DUPLICATE" }], mono, per).comparisons[0]!;
    expect(ambiguous.status).toBe("ambiguous_mapping");
    expect(ambiguous.scope_changes).toEqual([]);
  });
});
