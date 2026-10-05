import { describe, expect, it } from "vitest";
import { issueReferences, linkIssueMentions } from "../web/registry/src/evidence.ts";

const url = "https://github.com/NLCR/Standard_NDK/issues/255";
describe("explicit evidence links", () => {
  it("links repeated mentions only to a cited issue and preserves the original text", () => {
    const refs = issueReferences([{ url }, { url }]);
    expect(refs).toHaveLength(1);
    const text = "Viz issue #255; také #255 a neznámé #256.";
    const parts = linkIssueMentions(text, refs);
    expect(parts.map((part) => part.text).join("")).toBe(text);
    expect(parts.filter((part) => part.href).map((part) => part.href)).toEqual([url, url]);
  });
  it("does not guess URLs for unsafe or ambiguous references", () => {
    expect(issueReferences([{ url: "javascript:alert(1)" }, { url: "https://github.com.evil.test/a/b/issues/255" }, { url: 255 }])).toEqual([]);
    const refs = issueReferences([{ url }, { url: "https://github.com/other/repo/issues/255" }]);
    expect(linkIssueMentions("issue #255", refs)).toEqual([{ text: "issue #255" }]);
  });
});
