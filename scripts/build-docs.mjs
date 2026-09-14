import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const candidates = process.platform === "win32"
  ? [path.join(root, ".venv", "Scripts", "python.exe"), "python"]
  : [path.join(root, ".venv", "bin", "python"), "python3", "python"];
const python = candidates.find((candidate) => !path.isAbsolute(candidate) || existsSync(candidate)) ?? candidates.at(-1);
const result = spawnSync(python, ["-m", "mkdocs", "build", "--strict"], { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
