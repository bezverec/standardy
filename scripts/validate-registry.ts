import path from "node:path";
import { loadRegistry, validateRegistry } from "../packages/registry-core/src/index.ts";

const root = path.resolve(import.meta.dirname, "..");
const documents = await loadRegistry(root);
const relationsOnly = process.argv.includes("--relations-only");
const issues = await validateRegistry(root, documents, { relationsOnly });

if (issues.length) {
  for (const issue of issues) {
    const location = [issue.file, issue.path].filter(Boolean).join(":");
    console.error(`${location ? `${location}: ` : ""}${issue.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Registry validation passed (${documents.length} YAML documents).`);
}
