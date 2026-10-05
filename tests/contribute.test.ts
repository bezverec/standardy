import { describe, expect, it } from "vitest";
import { changeProposalUrl } from "../web/registry/src/contribute.ts";
import { ruleCounts } from "../web/registry/src/explore.ts";

describe("registry counts and contribution", () => {
  it("counts IDs independently of versioned records", () => {
    expect(ruleCounts([{ rule_id: "a" }, { rule_id: "a" }, { rule_id: "b" }])).toEqual({ rules: 2, records: 3 });
    expect(ruleCounts([])).toEqual({ rules: 0, records: 0 });
  });
  it("opens a new GitHub issue with a rule and version, without submitting it", () => {
    const url = new URL(changeProposalUrl({ rule_id: "A&B", version: "2.3" }));
    expect(url.origin + url.pathname).toBe("https://github.com/bezverec/standardy/issues/new");
    expect(url.searchParams.get("title")).toBe("Návrh změny: A&B (NDK 2.3)");
    expect(url.searchParams.get("body")).toContain("/registry/rules/A%26B?version=2.3");
    expect(url.searchParams.get("body")).toContain("Důvod a opora v původním zdroji");
  });
  it("supports proposals not associated with a current rule", () => {
    expect(new URL(changeProposalUrl()).searchParams.get("title")).toBe("Návrh změny registru");
  });
});
