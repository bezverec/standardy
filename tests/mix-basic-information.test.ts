import path from "node:path";
import { describe, expect, it } from "vitest";
import { compareRuleContexts, compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rules = registry.rule_versions.filter((rule) => rule.category === "technical/mix-basic");
const rows = [
  ["OBJECT-IDENTIFIER", "R", 82, 69], ["OBJECT-IDENTIFIER-TYPE", "M", 82, 69],
  ["OBJECT-IDENTIFIER-VALUE", "M", 83, 69], ["FILE-SIZE", "R", 83, 69],
  ["FORMAT-DESIGNATION", "M", 83, 69], ["FORMAT-NAME", "M", 83, 69],
  ["FORMAT-VERSION", "M", 83, 70], ["BYTE-ORDER", "M", 83, 70],
] as const;
const get = (kind: string, suffix: string) => rules.find((rule) => rule.rule_id === `NDK-${kind}-MIX-${suffix}`)!;

describe("MIX basic digital object information in both digitization DMFs", () => {
  it("records eight independently sourced MC/PS rules per DMF", () => {
    expect(rules).toHaveLength(16);
    expect(rules.filter((rule) => rule.obligation_code === "M")).toHaveLength(12);
    expect(rules.filter((rule) => rule.obligation_code === "R")).toHaveLength(4);
    for (const [suffix, code, monoPage, perPage] of rows) {
      for (const [kind, object, version, document, page] of [
        ["MONO", "monograph", "2.3", "DMF Monografie", monoPage],
        ["PER", "periodical", "2.2", "DMF Periodika", perPage],
      ] as const) {
        const rule = get(kind, suffix);
        expect(rule).toMatchObject({ version, obligation_code: code, source: { document, version, page }, verification: { status: "verified" } });
        expect(rule.cataloguing_scope?.applicability).toBe("independent");
        expect(rule.cataloguing_scope?.sources[0]).toEqual(rule.source);
        expect(rule.cataloguing_rules).toBeUndefined();
        expect(rule.condition).toMatchObject({ all: expect.arrayContaining([
          { field: "object_type", operator: "equals", value: object },
          { field: "file_role", operator: "in", value: ["MC", "PS"] },
        ]) });
        expect(rule.implementations).toBeUndefined();
        expect(registry.standard_entities.find((entity) => entity.id === rule.target.entity)).toMatchObject({ standard_id: "MIX", version: "2.0" });
      }
    }
  });
  it("retains M inside each recommended identifier, not a global mandatory container or MA", () => {
    for (const kind of ["MONO", "PER"]) {
      expect(get(kind, "OBJECT-IDENTIFIER").requirement).toMatchObject({ presence: "optional", cardinality: { min: 0, max: null } });
      for (const child of ["TYPE", "VALUE"]) {
        const rule = get(kind, `OBJECT-IDENTIFIER-${child}`);
        expect(rule.obligation_code).toBe("M");
        expect(rule.requirement).toMatchObject({ presence: "required", cardinality: { min: 1, max: 1 } });
        expect(rule.condition).toMatchObject({ all: expect.arrayContaining([{ field: "element_role", operator: "equals", value: "mix_object_identifier" }]) });
        expect(JSON.stringify(rule.requirement.validations)).toContain("každého kontejneru samostatně");
        expect(rule.requirement.allowed_values).toBeUndefined();
      }
    }
  });
  it("keeps examples out of controlled values and preserves nonnegative size lexical space", () => {
    for (const kind of ["MONO", "PER"]) {
      const size = get(kind, "FILE-SIZE");
      expect(size.requirement).toMatchObject({ presence: "optional", cardinality: { min: 0, max: 1 } });
      const checks = size.requirement.validations as Array<{ expression: string }>;
      const regex = new RegExp(checks[0]!.expression);
      for (const value of ["0", "-0", "-000", " +00123\n", "99999999999999999999999"]) expect(regex.test(value)).toBe(true);
      for (const value of ["", "-1", "1.2", "1e3", "12 bytes"]) expect(regex.test(value)).toBe(false);
      expect(get(kind, "BYTE-ORDER").requirement.allowed_values).toEqual(["big endian", "little endian"]);
      for (const suffix of ["FORMAT-NAME", "FORMAT-VERSION"]) expect(get(kind, suffix).requirement.allowed_values).toBeUndefined();
      expect(get(kind, "FORMAT-VERSION").normative_requirement.cs).toContain("TIFF");
      expect(get(kind, "FORMAT-VERSION").interpretation?.cs).toContain("nikoli verzi DMF");
    }
  });
  it("adds eight explicit matching aspects while preserving each source and object scope", () => {
    const mono = { national_standard: "ndk-monograph", version: "2.3" };
    const per = { national_standard: "ndk-periodical", version: "2.2" };
    for (const [a, b] of [[mono, per], [per, mono]] as const) {
      const result = compareRuleContexts(rules, a, b);
      expect(result.comparisons).toHaveLength(8);
      for (const pair of result.comparisons) {
        expect(pair.status).toBe("same_recorded_requirement");
        expect(pair.changes).toEqual([]);
        expect(pair.scope_changes).toHaveLength(2);
        expect(pair.left[0]!.source.document).not.toBe(pair.right[0]!.source.document);
      }
    }
  });
  it("ships seven real monographic excerpts without inventing the absent MIX fileSize", () => {
    expect(rules.filter((rule) => rule.national_standard_id === "ndk-monograph").flatMap((rule) => rule.examples ?? [])).toHaveLength(7);
    expect(get("MONO", "FILE-SIZE").examples).toBeUndefined();
    expect(get("MONO", "OBJECT-IDENTIFIER").examples?.[0]?.code).toContain("MC_1_00010003_2R");
  });
  it("adds independent periodical excerpts with declared 2.2 provenance and the observed link caveat", () => {
    const examples = rules.filter((rule) => rule.national_standard_id === "ndk-periodical").flatMap((rule) => rule.examples ?? []);
    expect(examples).toHaveLength(7);
    for (const example of examples) {
      expect(example.file_sha256).toBe("c5b5e451618486b3a333daa1d504a6b48662465903f9cfe0bb6dc98534e870ec");
      expect(example.source.version).toContain("DMF Periodika 2.2");
      expect(example.source_xpath).toContain("MIX_003");
      expect(example.note.cs).toContain("MIX_002");
      expect(example.note.cs).toContain("nesoulad vzoru");
    }
    expect(get("PER", "FILE-SIZE").examples).toBeUndefined();
    expect(get("PER", "OBJECT-IDENTIFIER-VALUE").examples?.[0]?.code).toContain("MC_1_0008_2R");
  });
});
