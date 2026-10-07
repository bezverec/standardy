import { describe, expect, it } from "vitest";
// Plain JS CLI is also imported to exercise selection without filesystem side effects.
// @ts-expect-error The standalone .mjs helper has no TypeScript declaration.
import { selectXmlExamples } from "../scripts/select-xml-examples.mjs";

const sourceUrl = "https://example.org/periodical.zip";
const selection = { nationalStandard: "ndk-periodical", version: "2.2", sourceUrl };
const example = (id: string, url = sourceUrl) => ({ id, source: { url }, code: "<x/>" });
const rules = [
  { rule_id: "PER", national_standard_id: "ndk-periodical", version: "2.2", examples: [example("a"), example("other", "https://example.org/other.zip")] },
  { rule_id: "OLDER", national_standard_id: "ndk-periodical", version: "2.1", examples: [example("b")] },
  { rule_id: "MONO", national_standard_id: "ndk-monograph", version: "2.2", examples: [example("c")] },
  { rule_id: "ABSENT", national_standard_id: "ndk-periodical", version: "2.2" },
];

describe("selection of XML examples for source verification", () => {
  it("selects exact source, standard and version even within a mixed-source rule", () => {
    const selected = selectXmlExamples(rules, selection);
    expect(selected).toHaveLength(1);
    expect(selected[0].rule_id).toBe("PER");
    expect(selected[0].examples).toEqual([example("a")]);
  });
  it("does not modify the compiled input or its examples array", () => {
    const before = structuredClone(rules);
    const selected = selectXmlExamples(rules, selection);
    selected[0].examples.pop();
    expect(rules).toEqual(before);
  });
  it("fails closed for zero matches rather than reporting a successful empty verification", () => {
    expect(() => selectXmlExamples(rules, { ...selection, sourceUrl: sourceUrl + "?different" })).toThrow("No XML examples");
    expect(() => selectXmlExamples([], selection)).toThrow("No XML examples");
  });
  it("rejects omitted filters and non-compiled input", () => {
    for (const key of ["version", "nationalStandard", "sourceUrl"]) {
      expect(() => selectXmlExamples(rules, { ...selection, [key]: "" })).toThrow("required");
    }
    expect(() => selectXmlExamples({}, selection)).toThrow("array");
  });
});
