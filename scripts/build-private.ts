import { mkdir, writeFile, cp } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { canonicalize, compileRegistry, loadRegistry, validateRegistry } from "../packages/registry-core/src/index.ts";

const root = path.resolve(import.meta.dirname, "..");
const documents = await loadRegistry(root);
const issues = await validateRegistry(root, documents);
if (issues.length) throw new Error(issues.map((issue) => `${issue.file}: ${issue.message}`).join("\n"));
const registry = compileRegistry(documents);
await mkdir(path.join(root, ".private-preview/data"), { recursive: true });
await writeFile(path.join(root, ".private-preview/data/registry.json"), JSON.stringify(canonicalize(registry)));
if (!process.argv.includes("--prepare-only")) {
  execFileSync(path.join(root, "node_modules/.bin/vite"), ["build", "--config", "web/registry/vite.private.config.ts"], { cwd: root, stdio: "inherit" });
  // The same authenticated boundary protects HTML, scripts and the data snapshot.
  await cp(path.join(root, ".private-preview/data"), path.join(root, "dist/client/data"), { recursive: true });
}
console.log(`Private snapshot: ${registry.rule_versions.length} rule versions, ${registry.standards.length} source standards.`);
