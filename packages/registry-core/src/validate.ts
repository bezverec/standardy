import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateSemanticDocuments, type ValidationIssue } from "./validate-semantic.ts";
import type { RegistryDocument } from "./model.ts";
export type { ValidationIssue } from "./validate-semantic.ts";

async function schemaValidators(root: string): Promise<Record<string, ValidateFunction>> {
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  const kinds = ["standard", "national_standard", "rule", "vocabulary"] as const;
  const validators: Record<string, ValidateFunction> = {};
  for (const kind of kinds) {
    const schema = JSON.parse(await readFile(path.join(root, "schemas", `${kind}.schema.json`), "utf8"));
    validators[kind] = ajv.compile(schema);
  }
  return validators;
}

function formatSchemaErrors(document: RegistryDocument, errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  return (errors ?? []).map((error) => ({
    file: document.source_file,
    path: error.instancePath || "/",
    message: error.message ?? "schema validation failed",
  }));
}

export async function validateRegistry(
  root: string,
  documents: RegistryDocument[],
  options: { relationsOnly?: boolean } = {},
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  if (!options.relationsOnly) {
    const validators = await schemaValidators(root);
    for (const document of documents) {
      const validator = validators[document.kind];
      if (!validator) {
        issues.push({ file: document.source_file, message: `Unknown entity kind: ${String(document.kind)}` });
        continue;
      }
      const schemaInput = { ...document };
      delete schemaInput.source_file;
      if (!validator(schemaInput)) issues.push(...formatSchemaErrors(document, validator.errors));
    }
  }

  return [...issues, ...validateSemanticDocuments(documents, options)];
}
