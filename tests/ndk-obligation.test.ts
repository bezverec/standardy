import path from "node:path";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { compileRegistry, loadRegistry, registryImportSql, semanticNationalStandardDiff, validateRegistry } from "../packages/registry-core/src/index.ts";
import { ndkObligations } from "../packages/registry-core/src/obligation.ts";
import type { NdkObligationCode } from "../packages/registry-core/src/model.ts";
import { openApiDocument } from "../packages/registry-core/src/openapi.ts";
import { handleRequest, type Env } from "../worker/src/index.ts";
import { filterRules } from "../web/registry/src/explore.ts";
import { obligationLabel, obligationOptions } from "../web/registry/src/obligation.ts";
import type { RuleVersion } from "../web/registry/src/api.ts";

const root = path.resolve(import.meta.dirname, "..");
const codes = Object.keys(ndkObligations) as NdkObligationCode[];

// Synthetic future versions test transitions without inventing production DMF data.
async function fixture() {
  const documents = structuredClone(await loadRegistry(root));
  const rule = documents.find((item) => item.kind === "rule" && item.id.endsWith("-VERSION"))!;
  if (rule.kind !== "rule") throw new Error("Missing fixture rule");
  const national = documents.find((item) => item.kind === "national_standard" && item.id === rule.national_standard.id)!;
  if (national.kind !== "national_standard") throw new Error("Missing fixture national standard");
  const original = rule.versions[0]!;
  for (const code of codes) {
    const version = `test-${code}`;
    const source = { ...original.source, document: "Synthetic test fixture, not a published DMF", version };
    rule.versions.push({ ...original, version, source, obligation: ndkObligations[code], obligation_code: code });
    national.versions.push({ version, status: "draft", source });
  }
  return { documents, rule };
}

describe("versioned NDK obligation codes", () => {
  it("validates all five codes without rewriting historical RA/O", async () => {
    const { documents, rule } = await fixture();
    expect(await validateRegistry(root, documents)).toEqual([]);
    const registry = compileRegistry(documents);
    for (const code of codes) {
      expect(registry.rule_versions.find((item) => item.rule_id === rule.id && item.version === `test-${code}`))
        .toMatchObject({ obligation_code: code, obligation: ndkObligations[code], source: { version: `test-${code}` } });
    }
    for (const before of ["RA", "O"]) {
      const diff = semanticNationalStandardDiff(registry.rule_versions, "ndk-monograph", `test-${before}`, "test-R");
      expect(diff.changed.find((item) => item.rule === rule.id)?.changes).toEqual(expect.arrayContaining([
        { field: "obligation_code", old: before, new: "R" },
        { field: "obligation", old: ndkObligations[before as NdkObligationCode], new: "recommended" },
      ]));
    }
  });

  it("rejects missing codes, unknown codes and inconsistent source meanings", async () => {
    const { documents, rule } = await fixture();
    const version = rule.versions[0]!;
    delete version.obligation_code;
    expect(await validateRegistry(root, documents)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("must preserve") }));
    for (const code of codes) {
      version.obligation_code = code;
      version.obligation = "unspecified";
      expect(await validateRegistry(root, documents)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("does not match source code") }));
    }
    Object.assign(version, { obligation_code: "INVALID" });
    expect((await validateRegistry(root, documents)).some((issue) => issue.path?.endsWith("/obligation_code"))).toBe(true);
    delete version.obligation_code;
    version.obligation = "unspecified";
    expect(await validateRegistry(root, documents)).toEqual([]);
  });

  it("preserves codes in D1 and filters by normalized level, source code and version", async () => {
    const { documents } = await fixture();
    const registry = compileRegistry(documents);
    const wire = JSON.parse(JSON.stringify(registry.rule_versions)) as RuleVersion[];
    const database = new DatabaseSync(":memory:");
    try {
      for (const migration of ["0001_registry.sql", "0002_national_standards.sql", "0003_obligation.sql"]) database.exec(await readFile(path.join(root, "migrations", migration), "utf8"));
      database.exec(registryImportSql(registry));
      const env = { DB: { prepare(sql: string) {
        let parameters: any[] = [];
        const statement = {
          bind(...values: any[]) { parameters = values; return statement; },
          async all() { return { results: database.prepare(sql).all(...parameters) }; },
          async first() { return database.prepare(sql).get(...parameters) ?? null; },
        };
        return statement;
      } } } as unknown as Env;
      for (const code of codes) {
        const level = ndkObligations[code];
        const expected = wire.filter((rule) => rule.obligation_code === code);
        for (const query of [`obligation_code=${code}`, `obligation=${level}`, `obligation=${level}&obligation_code=${code}`]) {
          const response = await handleRequest(new Request(`https://registry.test/api/v1/rules?${query}`), env);
          const result = await response.json() as { data: RuleVersion[]; pagination: { total: number } };
          expect(response.status).toBe(200);
          expect(result.pagination.total).toBe(expected.length);
          expect(result.data.every((rule) => rule.obligation === level && rule.obligation_code === code)).toBe(true);
        }
        expect(filterRules(wire, "", { obligation: level }, registry.relations)).toEqual(expected);
        const versionResult = await handleRequest(new Request(`https://registry.test/api/v1/rules?obligation_code=${code}&version=test-${code}`), env);
        expect(await versionResult.json()).toMatchObject({ pagination: { total: 1 } });
      }
      const mismatch = await handleRequest(new Request("https://registry.test/api/v1/rules?obligation=mandatory&obligation_code=RA"), env);
      expect(await mismatch.json()).toMatchObject({ pagination: { total: 0 } });
    } finally { database.close(); }
  });

  it("documents and displays MA/RA separately without guessing source codes", () => {
    const schema = openApiDocument.components.schemas.RuleVersion as any;
    expect(schema.properties.obligation.enum).toEqual(obligationOptions.map(([value]) => value));
    expect(schema.properties.obligation_code.enum).toEqual(codes);
    for (const code of codes) expect(obligationLabel({ obligation: ndkObligations[code], obligation_code: code })).toContain(`(${code})`);
    expect(obligationLabel({ obligation: "mandatory_if_available", obligation_code: "MA" })).toBe("Povinné, pokud je údaj dostupný (MA)");
    expect(obligationLabel({ obligation: "recommended_if_available", obligation_code: "RA" })).toBe("Doporučené, pokud je údaj dostupný (RA)");
    expect(obligationLabel({ obligation: "mandatory" })).toBe("Povinné");
    expect(openApiDocument.paths["/rules"].get.parameters).toContainEqual(expect.objectContaining({ name: "obligation_code", schema: { type: "string", enum: codes } }));
  });
});
