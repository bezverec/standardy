import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalize,
  compileRegistry,
  diffFields,
  loadRegistry,
  profileAncestors,
  registryImportSql,
  semanticProfileDiff,
  validateRegistry,
} from "../packages/registry-core/src/index.ts";

const root = path.resolve(import.meta.dirname, "..");

describe("registry vertical slice", () => {
  it("validates all YAML and resolves every relation", async () => {
    const documents = await loadRegistry(root);
    expect(await validateRegistry(root, documents)).toEqual([]);
  });

  it("compiles MIX to an NDK rule and implementation graph", async () => {
    const registry = compileRegistry(await loadRegistry(root));
    expect(registry.standard_entities.map((entity) => entity.id)).toContain("MIX-ICC-PROFILE-VERSION");
    expect(registry.rule_versions[0]).toMatchObject({
      rule_id: "NDK-MONO-MIX-ICC-PROFILE-VERSION",
      target: { entity: "MIX-ICC-PROFILE-VERSION" },
      verification: { status: "unverified" },
    });
    expect(registry.relations.map((edge) => edge.type)).toEqual(expect.arrayContaining(["defined_by", "restricts", "generated_by", "validated_by"]));
  });

  it("emits deterministic canonical JSON and idempotent D1-compatible replacement SQL", async () => {
    const documents = await loadRegistry(root);
    const first = JSON.stringify(canonicalize(compileRegistry(documents)));
    const second = JSON.stringify(canonicalize(compileRegistry(documents)));
    expect(first).toBe(second);
    const sql = registryImportSql(compileRegistry(documents));
    expect(sql).toContain("DELETE FROM rule_versions;");
    expect(sql).not.toContain("BEGIN TRANSACTION;");
    expect(sql).not.toContain("COMMIT;");
  });

  it("resolves profile inheritance without copying rules", async () => {
    const profiles = (await loadRegistry(root)).filter((document) => document.kind === "profile");
    expect(profileAncestors(profiles, "ndk-monograph")).toEqual(["ndk-base"]);
  });
});

describe("semantic diff", () => {
  it("reports field-level changes", () => {
    expect(diffFields({ requirement: { cardinality: { min: 0 } } }, { requirement: { cardinality: { min: 1 } } })).toEqual([
      { field: "requirement.cardinality.min", old: 0, new: 1 },
    ]);
  });

  it("separates added, removed and changed rules", () => {
    const base: any = { profile_id: "p", status: "draft", target: { entity: "E" }, relation_to_target: { type: "restricts" }, category: "metadata", severity: "error", normative_requirement: { cs: "x" }, requirement: {}, source: {}, verification: {} };
    const result = semanticProfileDiff([
      { ...base, rule_id: "A", version: "1", requirement: { presence: "optional" } },
      { ...base, rule_id: "A", version: "2", requirement: { presence: "required" } },
      { ...base, rule_id: "B", version: "1" },
      { ...base, rule_id: "C", version: "2" },
    ], "p", "1", "2");
    expect(result.added).toEqual(["C"]);
    expect(result.removed).toEqual(["B"]);
    expect(result.changed[0]?.changes).toContainEqual({ field: "requirement.presence", old: "optional", new: "required" });
  });
});
