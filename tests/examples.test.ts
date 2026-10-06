import path from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, validateRegistry } from "../packages/registry-core/src/index.ts";
import { CodeExamples } from "../web/registry/src/CodeExamples.tsx";
import { RelationshipGraph } from "../web/registry/src/RelationshipGraph.tsx";

const root = path.resolve(import.meta.dirname, "..");
const documents = await loadRegistry(root);
const rules = compileRegistry(documents).rule_versions;
const examples = rules.flatMap((rule) => rule.examples ?? []);
const pythonVenv = path.join(root, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
const python = existsSync(pythonVenv) ? pythonVenv : process.platform === "win32" ? "python" : "python3";
const checkXml = (data: unknown) => spawnSync(python, [path.join(root, "scripts/verify-xml-examples.py")], { input: JSON.stringify(data), encoding: "utf8" });

describe("source-backed XML examples", () => {
  it("ships 196 source excerpts for 153 rules with provenance in versioned API/export records", () => {
    expect(examples).toHaveLength(196);
    expect(rules.filter((rule) => rule.examples?.length)).toHaveLength(153);
    for (const rule of rules.filter((rule) => rule.examples?.length)) {
      expect(rule.version).toBe("2.3");
      for (const example of rule.examples!) {
        expect(example.kind).toBe("source_excerpt");
        expect(example.file_sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(example.source.url).toBe("https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download");
        expect(example.file_path).not.toMatch(/^[A-Za-z]:|^\/|\.\./);
      }
    }
    expect(rules.filter((rule) => rule.rule_id.includes("MIX-ICC")).every((rule) => !rule.examples)).toBe(true);
    expect(rules.find((rule) => rule.rule_id === "NDK-MONO-MIX-X-SAMPLING-FREQUENCY")!.examples![0]!.code).toContain("<mix:denominator>39</mix:denominator>");
  });
  it("parses every excerpt as standalone XML and rejects malformed XML and entities", () => {
    const result = checkXml(rules);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ examples: 196, xml_syntax: "ok" });
    for (const code of ["<mix:mix/>", "<created>", '<!DOCTYPE x [<!ENTITY data SYSTEM "file:///test">]><x>&data;</x>']) {
      expect(checkXml([{ rule_id: "fixture", examples: [{ ...examples[0], code }] }]).status).toBe(1);
    }
  });
  it("rejects incomplete provenance and duplicate IDs", async () => {
    for (const change of ["hash", "duplicate"] as const) {
      const modified = structuredClone(documents);
      const rule = modified.find((item) => item.kind === "rule" && item.versions[0]?.examples?.length);
      if (!rule || rule.kind !== "rule") throw new Error("Example fixture missing");
      const example = rule.versions[0]!.examples![0]!;
      if (change === "hash") example.file_sha256 = "not-a-hash";
      else rule.versions[0]!.examples!.push(structuredClone(example));
      expect((await validateRegistry(root, modified)).length).toBeGreaterThan(0);
    }
  });
  it("renders XML as escaped text with copy controls and source details, never executable markup", () => {
    const output = renderToStaticMarkup(createElement(CodeExamples, { examples: [{ ...examples[0]!, code: '<script>alert("test")</script>' }] }));
    expect(output).toContain("&lt;script&gt;");
    expect(output).not.toContain("<script>");
    expect(output).toContain("Kopírovat XML");
    expect(output).toContain("SHA-256 celého zdrojového souboru");
    expect(output).toContain("nikoli univerzální šablona");
    expect(renderToStaticMarkup(createElement(CodeExamples, { examples: [] }))).toBe("");
  });
  it("starts graph rendering in whole-graph mode without intrinsic SVG minimum width", () => {
    const output = renderToStaticMarkup(createElement(RelationshipGraph, { graph: { root: "rule", nodes: [{ id: "rule", kind: "rule" }], edges: [] }, topicLabels: {}, onNavigate() {} }));
    expect(output).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(output).toContain('style="width:100%;height:100%"');
    expect(output).toContain("Celý graf");
  });
});
