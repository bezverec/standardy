import ruleSchema from "../../../schemas/rule.schema.json";
import standardSchema from "../../../schemas/standard.schema.json";
import nationalSchema from "../../../schemas/national_standard.schema.json";

type Schema = Record<string, unknown>;
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const array = (items: Schema) => ({ type: "array", items });
const string = (description?: string) => ({ type: "string", ...(description ? { description } : {}) });
const object = (properties: Record<string, Schema>, required = Object.keys(properties)): Schema => ({ type: "object", properties, required });

// Reuse the authoritative registry definitions, rewriting only their local refs.
function relocate(value: unknown, prefix: string): any {
  if (Array.isArray(value)) return value.map((item) => relocate(item, prefix));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["$id", "$schema", "$defs"].includes(key))
    .map(([key, item]) => [key, key === "$ref" && typeof item === "string"
      ? item.replace("#/$defs/", `#/components/schemas/${prefix}_`)
      : relocate(item, prefix)]));
  return value;
}
const schemas: Record<string, Schema> = {};
for (const [prefix, schema] of [["Rule", ruleSchema], ["Standard", standardSchema], ["National", nationalSchema]] as const) {
  for (const [name, definition] of Object.entries(schema.$defs)) schemas[`${prefix}_${name}`] = relocate(definition, prefix);
}
const ruleVersion = relocate(ruleSchema.$defs.ruleVersion, "Rule");
schemas.RuleVersion = { ...ruleVersion, properties: { ...ruleVersion.properties,
  rule_id: string(), national_standard_id: string(), title: ref("Rule_localized"), description: ref("Rule_localized"), source_file: string(),
}, required: [...ruleVersion.required, "rule_id", "national_standard_id", "title"] };
const standard = relocate(standardSchema, "Standard");
schemas.Standard = { ...standard, properties: { ...standard.properties, source_file: string() } };
const entity = relocate(standardSchema.properties.entities.items, "Standard");
schemas.StandardEntity = { ...entity, properties: { ...entity.properties, standard_id: string() }, required: [...entity.required, "standard_id"] };
schemas.StandardDetail = { ...schemas.Standard, properties: { ...standard.properties, source_file: string(), entities: array(ref("StandardEntity")) } };
const national = relocate(nationalSchema, "National");
schemas.NationalStandard = { ...national, properties: { ...national.properties, source_file: string() } };
schemas.NationalStandardDetail = { ...schemas.NationalStandard, properties: { ...national.properties, source_file: string(), effective_rules: array(ref("RuleVersion")) }, required: [...national.required, "effective_rules"] };
schemas.Implementation = { ...relocate(ruleSchema.$defs.implementation, "Rule"),
  properties: { ...relocate(ruleSchema.$defs.implementation.properties, "Rule"), rule_id: string(), rule_version: string() },
};
schemas.Relation = object({ id: string(), from: string(), to: string(), type: ref("Rule_relationType"), rule_version: string(), note: ref("Rule_localized") }, ["id", "from", "to", "type"]);
schemas.Pagination = object({ page: { type: "integer", minimum: 1 }, page_size: { type: "integer", minimum: 1 }, total: { type: "integer", minimum: 0 } });
schemas.Meta = object({ dataset_version: string("Identita datasetu git-<SHA>; nejde o počet pravidel."), git_commit: string(), generated_at: { type: "string", format: "date-time" }, schema_version: string() });
schemas.Error = object({ error: string(), detail: string(), id: string(), path: string() }, ["error"]);
schemas.RulePage = object({ data: array(ref("RuleVersion")), pagination: ref("Pagination") });
schemas.RelationPage = object({ data: array(ref("Relation")), pagination: ref("Pagination") });
schemas.RuleDetail = object({ id: string(), versions: array(ref("RuleVersion")), relations: array(ref("Relation")), implementations: array(ref("Implementation")) });
schemas.StandardList = object({ data: array(ref("Standard")) });
schemas.NationalStandardList = object({ data: array(ref("NationalStandard")) });
schemas.Graph = object({ root: string(), nodes: array(object({ id: string(), kind: { type: "string", enum: ["rule", "standard", "national_standard", "standard_entity", "implementation"] }, data: { type: "object", additionalProperties: true } }, ["id", "kind"])), edges: array(ref("Relation")) });
schemas.SearchResult = object({ query: string(), data: array(object({ kind: { type: "string", enum: ["rule", "standard_entity", "standard", "national_standard"] }, id: string(), title: { type: ["string", "null"] }, version: { type: ["string", "null"] }, data: { type: "object", additionalProperties: true } }, ["kind", "id", "title", "data"])) });
schemas.XmlResolution = object({ entity: { anyOf: [ref("StandardEntity"), { type: "null" }] }, rules: array(ref("RuleVersion")), relations: array(ref("Relation")), implementations: array(ref("Implementation")) });
schemas.Diff = object({ national_standard: string(), version_a: string(), version_b: string(), added: array(string()), removed: array(string()), changed: array(object({ rule: string(), changes: array(object({ field: string(), old: {}, new: {} }, ["field"])) })) });

const query = (name: string, description: string, schema: Schema = string(), required = false) => ({ name, in: "query", description, required, schema });
const id = (example: string) => ({ name: "id", in: "path", required: true, description: "Stabilní ID záznamu.", schema: string(), example });
const page = query("page", "Číslo stránky od 1; hodnoty nad maximem se omezí, neplatné hodnoty použijí výchozí číslo.", { type: "integer", minimum: 1, maximum: 1000000, default: 1 });
const pageSize = (defaultSize: number, max: number) => query("page_size", "Počet záznamů na stránce; vyšší hodnoty se omezí na maximum, neplatné použijí výchozí hodnotu.", { type: "integer", minimum: 1, maximum: max, default: defaultSize });
const content = (schema: Schema) => ({ "application/json": { schema } });
const error = (description: string) => ({ description, content: content(ref("Error")) });
const responses = (schema: string, errors: Record<string, unknown> = {}) => ({
  "200": { description: "Úspěšná odpověď.", headers: { ETag: { description: "Identita datasetu, nikoli hash jednotlivé odpovědi. Podmíněné 304 není implementováno.", schema: string() } }, content: content(ref(schema)) },
  "503": error("Odvozená databáze registru není inicializována nebo dostupná."), ...errors,
});
const operation = (operationId: string, tag: string, summary: string, schema: string, parameters: unknown[] = [], description = "", errors: Record<string, unknown> = {}) => ({
  get: { operationId, tags: [tag], summary, description, parameters, responses: responses(schema, errors) },
});
const relationFilters = [query("from", "ID výchozího uzlu."), query("to", "ID cílového uzlu."), query("type", "Typ relace.", ref("Rule_relationType"))];

export const openApiDocument = {
  openapi: "3.1.1",
  info: { title: "Standardy digitalizace – Registry API", version: "1.1.0",
    description: "Veřejné read-only API registru pravidel NDK. Bez přihlášení; Try it out provádí skutečný GET, ale data nemění. YAML v Git je zdroj pravdy, D1 je odvozený index. Verze kontraktu API (1.1.0), verze standardu NDK (např. 2.3) a identita datasetu (/meta) jsou odlišné údaje. Počty seznamů pravidel počítají verzované záznamy, nikoli unikátní ID. U každého pravidla rozlišujte normativní požadavek, interpretaci a stav ověření.",
    contact: { name: "Návrhy a chyby", url: "https://github.com/bezverec/standardy/issues" },
  },
  servers: [{ url: "/api/v1", description: "API na stejném serveru jako dokumentace (produkce i lokální vývoj)." }],
  security: [],
  tags: [{ name: "Registr", description: "Metadata a vyhledávání." }, { name: "Pravidla" }, { name: "Standardy" }, { name: "Vztahy" }],
  paths: {
    "/meta": operation("getMeta", "Registr", "Identita a datum sestavení datasetu", "Meta"),
    "/rules": operation("listRules", "Pravidla", "Stránkovaný seznam verzovaných pravidel", "RulePage", [
      query("national_standard", "ID národního standardu, např. ndk-monograph."), query("version", "Verze národního standardu, např. 2.3."), query("standard", "ID zdrojového standardu cílové entity, např. MIX. Nejde o všechny citované prameny."),
      query("category", "Kategorie nebo její nadřazený prefix, např. technical nebo technical/icc."), query("object_type", "Typ dokumentu, např. monograph; současná implementace používá textové vyhledání ve strukturovaných datech."),
      query("obligation", "Úroveň povinnosti podle citované verze standardu. MA/RA mají samostatné hodnoty if_available, odlišné od condition. Historické RA/O se nepřevádějí na R.", { type: "string", enum: ruleSchema.$defs.ruleVersion.properties.obligation.enum }),
      query("obligation_code", "Původní kód NDK v citované verzi pravidla; lze kombinovat s obligation.", { type: "string", enum: ruleSchema.$defs.ruleVersion.properties.obligation_code.enum }), query("status", "Stav požadavku.", ref("Rule_status")),
      query("sort", "Pole řazení; neznámé hodnoty použijí id. Verze se řadí textově.", { type: "string", enum: ["id", "version", "national_standard", "standard", "obligation", "status", "category"], default: "id" }),
      query("direction", "Směr řazení, jiná hodnota než desc použije ASC.", { type: "string", enum: ["asc", "desc"], default: "asc" }), page, pageSize(25, 100),
    ], "Každá položka je jedno pravidlo v jedné verzi národního standardu. pagination.total počítá tyto záznamy. Vyhledávání a filtry v Exploreru jsou klientské a mají širší možnosti než tento endpoint. Původní pole a parametr severity byly nahrazeny obligation; nejde o převod jejich hodnot. Požadavky se severity nebo sort=severity vracejí 400.", { "400": error("Odstraněný filtr či řazení severity; použijte obligation.") }),
    "/rules/{id}": operation("getRule", "Pravidla", "Detail pravidla a jeho verzí", "RuleDetail", [id("NDK-MONO-MIX-ICC-PROFILE-VERSION"), query("version", "Volitelně omezí pole versions. Relace a implementace v obálce zůstávají napříč verzemi; u vybrané verze použijte její implementations.")], "Bez version vrací všechny verze v sestupném textovém pořadí.", { "404": error("Pravidlo nebo požadovaná verze nebyly nalezeny.") }),
    "/rules/{id}/relations": operation("getRuleRelations", "Vztahy", "Odchozí relace pravidla", "RelationPage", [id("NDK-MONO-MIX-ICC-PROFILE-VERSION"), query("to", "Volitelný cílový uzel."), relationFilters[2], page, pageSize(500, 500)], "Filtr from je pevně určen ID v cestě. Neexistující ID vrátí prázdný seznam, nikoli 404."),
    "/rules/{id}/why": operation("getRuleGraph", "Vztahy", "Graf původu a souvisejících záznamů", "Graph", [id("NDK-MONO-MIX-ICC-PROFILE-VERSION")], "Prochází odchozí vazby z pravidla i ze souvisejících uzlů. Zahrnuje všechny verze; nejde o graf omezený na jednu verzi. Implementační uzly preferují záznam kořenového pravidla.", { "404": error("Pravidlo nebylo nalezeno.") }),
    "/standards": operation("listStandards", "Standardy", "Seznam zdrojových standardů", "StandardList"),
    "/standards/{id}": operation("getStandard", "Standardy", "Zdrojový standard a jeho entity", "StandardDetail", [id("MIX")], "Entity mají navíc standard_id odvozené indexem.", { "404": error("Standard nebyl nalezen.") }),
    "/national-standards": operation("listNationalStandards", "Standardy", "Seznam národních standardů", "NationalStandardList"),
    "/national-standards/{id}": operation("getNationalStandard", "Standardy", "Národní standard a evidovaná pravidla", "NationalStandardDetail", [id("ndk-monograph")], "effective_rules jsou přímo evidovaná pravidla všech verzí pro dané ID; endpoint zatím nevyhodnocuje dědičnost rodičovských standardů.", { "404": error("Národní standard nebyl nalezen.") }),
    "/search": operation("searchRegistry", "Registr", "Vyhledávání v pravidlech a zdrojích", "SearchResult", [query("q", "Hledaný podřetězec; prázdný dotaz vrátí prázdná data. Toto SQL vyhledávání neodstraňuje diakritiku jako Explorer."), query("limit", "Celkový limit napříč druhy záznamů.", { type: "integer", minimum: 1, maximum: 100, default: 25 })], "Výsledky jsou spojeny v pořadí pravidla, entity, zdrojové standardy, národní standardy; nejde o skóre relevance."),
    "/relations": operation("listRelations", "Vztahy", "Stránkovaný seznam relací", "RelationPage", [...relationFilters, page, pageSize(500, 500)]),
    "/resolve/xml": operation("resolveXml", "Registr", "Pravidla pro XML element a namespace", "XmlResolution", [query("namespace", "Jmenný prostor XML, např. http://www.loc.gov/mix/v20.", { type: "string", example: "http://www.loc.gov/mix/v20" }, true), query("element", "Lokální název elementu.", { type: "string", example: "iccProfileVersion" }, true), query("national_standard", "Volitelné ID národního standardu."), query("version", "Volitelná verze národního standardu.")], "Vybere zdrojovou entitu podle sestupně textově řazené standard_version. Implementace v obálce mohou zahrnovat další verze nalezených pravidel.", { "400": error("Chybí namespace nebo element."), "404": { description: "Entita nebyla nalezena: entity=null a prázdné seznamy.", content: content(ref("XmlResolution")) } }),
    "/compare/national-standards/{id}": operation("compareNationalStandards", "Standardy", "Porovnání dvou evidovaných verzí národního standardu", "Diff", [id("ndk-monograph"), query("version_a", "Výchozí verze.", string(), true), query("version_b", "Cílová verze.", string(), true)], "Vrací změny polí, přidaná a odstraněná ID. Neexistující ID nebo verze zatím znamenají prázdnou množinu, nikoli 404.", { "400": error("Chybí version_a nebo version_b.") }),
    "/openapi.json": { get: { operationId: "getOpenApi", tags: ["Registr"], summary: "OpenAPI dokument ve strojově čitelném JSON", responses: { "200": { description: "Tento kontrakt. Kanonická adresa je /openapi.json; dostupné i bez D1.", content: content({ type: "object", additionalProperties: true }) } } } },
  },
  components: { schemas },
};
