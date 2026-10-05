import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import SwaggerParser from "@apidevtools/swagger-parser";
import { openApiDocument } from "../packages/registry-core/src/openapi.ts";

const root = path.resolve(import.meta.dirname, "..");
await SwaggerParser.validate(JSON.parse(JSON.stringify(openApiDocument)));
const output = path.join(root, "site", "api-docs");
await mkdir(output, { recursive: true });
const require = createRequire(import.meta.url);
const swaggerDist = path.dirname(require.resolve("swagger-ui-dist/package.json"));
await Promise.all([
  writeFile(path.join(root, "site", "openapi.json"), `${JSON.stringify(openApiDocument, null, 2)}\n`),
  ...["swagger-ui-bundle.js", "swagger-ui.css", "LICENSE"].map((file) => copyFile(path.join(swaggerDist, file), path.join(output, file))),
  ...["index.html", "init.js", "style.css"].map((file) => copyFile(path.join(root, "web", "api-docs", file), path.join(output, file))),
]);
console.log(`Built Swagger UI and OpenAPI ${openApiDocument.openapi} (${Object.keys(openApiDocument.paths).length} GET operations).`);
