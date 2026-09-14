import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const isRemote = process.argv.includes("--remote");
const reset = process.argv.includes("--reset");
const targetFlag = isRemote ? "--remote" : "--local";
const wrangler = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");

function run(args: string[]): void {
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, XDG_CONFIG_HOME: path.join(root, ".wrangler", "config") },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(path.join(root, "dist", "registry", "import.sql"))) {
  await import("./build-registry.ts");
}

run(["d1", "migrations", "apply", "DB", targetFlag]);
if (reset) {
  console.log("Reset requested: replacing all derived registry rows from the current YAML dataset.");
}
run(["d1", "execute", "DB", targetFlag, "--file", "dist/registry/import.sql"]);
