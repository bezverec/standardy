import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
if (!databaseId) throw new Error("CLOUDFLARE_D1_DATABASE_ID is required");
const source = JSON.parse(await readFile(path.join(root, "wrangler.jsonc"), "utf8"));
const publicDb = source.d1_databases.find((db: { binding: string }) => db.binding === "DB");
const editorDb = source.d1_databases.find((db: { binding: string }) => db.binding === "EDITOR_DB");
if (!publicDb) throw new Error("Public DB binding is required");
publicDb.database_id = databaseId;
if (editorDb && editorDb.database_id === databaseId) throw new Error("EDITOR_DB must be separate from the public DB");
await writeFile(path.join(root, "wrangler.deploy.jsonc"), `${JSON.stringify(source, null, 2)}\n`);
console.log("Prepared wrangler.deploy.jsonc with the configured D1 binding.");
