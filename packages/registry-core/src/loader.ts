import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import type { RegistryDocument } from "./model.ts";

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  }));
  return nested.flat().sort((a, b) => a.localeCompare(b));
}

export async function loadRegistry(root: string): Promise<RegistryDocument[]> {
  const registryDirectory = path.join(root, "registry");
  const files = (await walk(registryDirectory)).filter((file) => /\.ya?ml$/i.test(file));

  return Promise.all(files.map(async (file) => {
    const raw = await readFile(file, "utf8");
    const parsed = parse(raw) as RegistryDocument;
    return {
      ...parsed,
      source_file: path.relative(root, file).replaceAll(path.sep, "/"),
    };
  }));
}
