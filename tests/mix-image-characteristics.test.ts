import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const rule = (suffix: string) => registry.rule_versions.find((item) => item.rule_id === `NDK-MONO-MIX-${suffix}` && item.version === "2.3")!;
const spatial = "/mix:mix/mix:ImageAssessmentMetadata/mix:SpatialMetrics";

describe("DMF 2.3 image metadata transcription", () => {
  it("preserves the MC/PS scope and M/MA/R codes from the source tables", () => {
    const rows = [
      ["IMAGE-WIDTH", "M", 83], ["IMAGE-HEIGHT", "M", 83], ["COLOR-SPACE", "M", 83],
      ["SAMPLING-FREQUENCY-PLANE", "R", 87], ["SAMPLING-FREQUENCY-UNIT", "M", 87],
      ["X-SAMPLING-FREQUENCY", "MA", 87], ["Y-SAMPLING-FREQUENCY", "MA", "87–88"],
      ["BITS-PER-SAMPLE-VALUE", "M", 88], ["BITS-PER-SAMPLE-UNIT", "R", 88], ["SAMPLES-PER-PIXEL", "M", 88],
    ] as const;
    for (const [suffix, code, page] of rows) {
      const item = rule(suffix);
      expect(item).toMatchObject({ obligation_code: code, source: { version: "2.3", page }, verification: { status: "verified" } });
      expect(item.condition).toMatchObject({ all: expect.arrayContaining([
        { field: "object_type", operator: "equals", value: "monograph" },
        { field: "file_role", operator: "in", value: ["MC", "PS"] },
      ]) });
      expect(item.requirement.presence).toBe(code === "R" ? "optional" : code === "MA" ? "conditional" : "required");
      expect(item.implementations).toBeUndefined();
      expect(registry.standard_entities.find((entity) => entity.id === item.target.entity)).toMatchObject({ standard_id: "MIX", version: "2.0" });
    }
  });

  it("requires X/Y only for physical units and keeps unit and frequencies as siblings", () => {
    expect(rule("SAMPLING-FREQUENCY-UNIT").requirement.allowed_values).toEqual(["no absolute unit of measurement", "in.", "cm"]);
    for (const axis of ["X", "Y"]) {
      const item = rule(`${axis}-SAMPLING-FREQUENCY`);
      const target = `${spatial}/mix:${axis.toLowerCase()}SamplingFrequency`;
      expect(item.obligation).toBe("mandatory_if_available");
      expect(item.condition).toMatchObject({ all: expect.arrayContaining([
        { field: `xpath:${spatial}/mix:samplingFrequencyUnit`, operator: "in", value: ["in.", "cm"] },
      ]) });
      expect(item.requirement.validations).toEqual([
        { type: "xpath", expression: target, assertion: "exists" },
        { type: "xpath", expression: `${target}/mix:numerator`, assertion: "exists" },
        { type: "xpath", expression: `${target}/mix:denominator`, assertion: "exists" },
      ]);
      expect(item.requirement.allowed_values).toBeUndefined();
    }
  });

  it("keeps repeated bit values and accepts positive-integer lexical forms without closing examples into vocabularies", () => {
    for (const suffix of ["IMAGE-WIDTH", "IMAGE-HEIGHT", "BITS-PER-SAMPLE-VALUE", "SAMPLES-PER-PIXEL"]) {
      const item = rule(suffix);
      const validations = item.requirement.validations as Array<{ type: string; expression: string }>;
      const pattern = new RegExp(validations.find((check) => check.type === "regex")!.expression);
      for (const value of ["1", "3", "5", "008", "+0008", " 8\n"]) expect(pattern.test(value), `${suffix}: ${value}`).toBe(true);
      for (const value of ["", "0", "-1", "8.0", "8,8,8", "8 8 8"]) expect(pattern.test(value), `${suffix}: ${value}`).toBe(false);
    }
    expect(rule("BITS-PER-SAMPLE-VALUE").requirement.cardinality).toEqual({ min: 1, max: null });
    expect(rule("BITS-PER-SAMPLE-UNIT").requirement.allowed_values).toEqual(["integer", "floating point"]);
    expect(rule("BITS-PER-SAMPLE-UNIT").requirement.validations).toBeUndefined();
    expect(rule("SAMPLING-FREQUENCY-PLANE").requirement.validations).toBeUndefined();
    expect(rule("COLOR-SPACE").requirement.allowed_values).toBeUndefined();
    expect(rule("SAMPLES-PER-PIXEL").requirement.allowed_values).toBeUndefined();
  });
});
