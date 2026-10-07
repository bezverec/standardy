import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import standaloneCode from "ajv/dist/standalone/index.js";

// Cloudflare Workers cannot compile schemas with new Function at request time.
const root = path.resolve(import.meta.dirname, "..");
const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true, code: { source: true } });
addFormats(ajv);
const schema = JSON.parse(await readFile(path.join(root, "schemas/rule.schema.json"), "utf8"));
const validate = ajv.compile(schema);
const directory = path.join(root, "worker/generated");
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, "rule-schema.cjs"), standaloneCode(ajv, validate));
console.log("Built editor rule schema validator from schemas/rule.schema.json.");
