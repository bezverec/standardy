import type { RuleDocument } from "../../../packages/registry-core/src/model.ts";

export type NewRuleCatalog = {
  national_standards: Array<{ id: string; title: { cs?: string }; versions: string[] }>;
  targets: Array<{ id: string; title: { cs?: string } }>;
};

// Deliberately incomplete: the operator must supply the requirement and its source.
export function blankRule(): RuleDocument {
  return {
    schema_version: "1.0", kind: "rule", id: "", title: { cs: "" }, national_standard: { id: "" },
    versions: [{
      version: "", status: "draft", target: { entity: "" }, relation_to_target: { type: "related_to" },
      category: "", obligation: "unspecified", normative_requirement: { cs: "" }, requirement: {},
      source: { document: "", version: null, page: null, section: null, url: null },
      verification: { status: "unverified", date: null, reference: null },
    }],
  };
}
