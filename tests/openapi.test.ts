import path from "node:path";
import { describe, expect, it } from "vitest";
import SwaggerParser from "@apidevtools/swagger-parser";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { openApiDocument } from "../packages/registry-core/src/openapi.ts";
import { metadataTaxonomy } from "../packages/registry-core/src/metadata-taxonomy.ts";
import { handleRequest, type Env } from "../worker/src/index.ts";

describe("OpenAPI contract", () => {
  it("validates all operations and schema references as OpenAPI 3.1", async () => {
    await SwaggerParser.validate(JSON.parse(JSON.stringify(openApiDocument)));
    expect(Object.keys(openApiDocument.paths)).toHaveLength(15);
    expect(new Set(Object.values(openApiDocument.paths).map((path) => path.get.operationId)).size).toBe(15);
  });
  it("describes normalized records and response envelopes using actual registry data", async () => {
    const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats(ajv);
    const contract = { $id: "https://registry.test/openapi.json", components: openApiDocument.components };
    ajv.addSchema(contract);
    const rule = registry.rule_versions[0]!;
    const standard = registry.standards[0]!;
    const national = registry.national_standards[0]!;
    const samples: Record<string, unknown[]> = {
      RuleVersion: registry.rule_versions,
      StandardEntity: registry.standard_entities,
      Implementation: registry.implementations,
      Relation: registry.relations,
      Meta: [registry.meta],
      MetadataTaxonomy: [metadataTaxonomy],
      RulePage: [{ data: registry.rule_versions, pagination: { page: 1, page_size: 25, total: registry.rule_versions.length } }],
      RuleDetail: [{ id: rule.rule_id, versions: registry.rule_versions.filter((item) => item.rule_id === rule.rule_id), relations: registry.relations, implementations: registry.implementations }],
      StandardList: [{ data: registry.standards }],
      StandardDetail: [{ ...standard, entities: registry.standard_entities.filter((item) => item.standard_id === standard.id) }],
      NationalStandardList: [{ data: registry.national_standards }],
      NationalStandardDetail: [{ ...national, effective_rules: registry.rule_versions.filter((item) => item.national_standard_id === national.id) }],
      XmlResolution: [{ entity: registry.standard_entities[0], rules: registry.rule_versions, relations: registry.relations, implementations: registry.implementations }, { entity: null, rules: [], relations: [], implementations: [] }],
      Graph: [{ root: rule.rule_id, nodes: [{ id: rule.rule_id, kind: "rule", data: registry.rules[0] }], edges: registry.relations }],
      SearchResult: [{ query: "ICC", data: [{ kind: "rule", id: rule.rule_id, version: rule.version, title: rule.title.cs, data: rule }] }],
    };
    for (const [schema, values] of Object.entries(samples)) {
      const validate = ajv.compile({ $ref: `https://registry.test/openapi.json#/components/schemas/${schema}` });
      for (const value of values) expect(validate(value), `${schema}: ${JSON.stringify(validate.errors)}`).toBe(true);
    }
  });
  it("serves both spec URLs without requiring a database or static assets", async () => {
    const env = {} as Env;
    for (const pathname of ["/openapi.json", "/api/v1/openapi.json"]) {
      const response = await handleRequest(new Request(`https://registry.test${pathname}`), env);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(openApiDocument);
      const head = await handleRequest(new Request(`https://registry.test${pathname}`, { method: "HEAD" }), env);
      expect(await head.text()).toBe("");
      expect((await handleRequest(new Request(`https://registry.test${pathname}`, { method: "POST" }), env)).status).toBe(405);
    }
  });
});
