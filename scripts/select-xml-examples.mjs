import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

/** Select compiled examples from one explicitly identified source, without mutation. */
export function selectXmlExamples(rules, { nationalStandard, version, sourceUrl }) {
  if (!Array.isArray(rules)) throw new Error("Expected compiled rules.json array");
  if (![nationalStandard, version, sourceUrl].every((value) => typeof value === "string" && value.trim())) {
    throw new Error("national-standard, version and source-url are required");
  }
  const selected = rules
    .filter((rule) => rule.national_standard_id === nationalStandard && rule.version === version)
    .map((rule) => ({ ...rule, examples: (rule.examples ?? []).filter((example) => example.source?.url === sourceUrl) }))
    .filter((rule) => rule.examples.length > 0);
  if (!selected.length) throw new Error("No XML examples match the exact standard, version and source URL");
  return selected;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: {
      rules: { type: "string" },
      "national-standard": { type: "string" },
      version: { type: "string" },
      "source-url": { type: "string" },
    } });
    if (!values.rules) throw new Error("--rules path/to/compiled/rules.json is required");
    const rules = JSON.parse(readFileSync(values.rules, "utf8").replace(/^\uFEFF/, ""));
    const selected = selectXmlExamples(rules, {
      nationalStandard: values["national-standard"], version: values.version, sourceUrl: values["source-url"],
    });
    process.stdout.write(JSON.stringify(selected) + "\n");
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
