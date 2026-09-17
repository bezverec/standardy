import { semanticNationalStandardDiff } from "../../packages/registry-core/src/semantic-diff.ts";
import type { RuleVersion } from "../../packages/registry-core/src/model.ts";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

const API_PREFIX = "/api/v1";
const LONG_CACHE = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";
const QUERY_CACHE = "public, max-age=60, s-maxage=900, stale-while-revalidate=3600";

function apiHeaders(datasetVersion: string, cacheControl = LONG_CACHE): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": cacheControl,
    "Content-Type": "application/json; charset=utf-8",
    "ETag": `"${datasetVersion}"`,
    "X-Content-Type-Options": "nosniff",
  });
}

function json(data: unknown, datasetVersion: string, status = 200, cacheControl?: string): Response {
  return new Response(JSON.stringify(data), { status, headers: apiHeaders(datasetVersion, cacheControl) });
}

function parseJsonRow<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row.data_json)) as T;
}

async function datasetMeta(db: D1Database): Promise<Record<string, string>> {
  const result = await db.prepare("SELECT key, value FROM registry_meta ORDER BY key").all<{ key: string; value: string }>();
  return Object.fromEntries(result.results.map((row) => [row.key, row.value]));
}

function positiveInteger(value: string | null, fallback: number, maximum: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

async function listRules(requestUrl: URL, env: Env, version: string): Promise<Response> {
  const clauses: string[] = [];
  const bindings: unknown[] = [];
  const filters: Array<[string, string]> = [
    ["national_standard", "national_standard_id"],
    ["version", "version"],
    ["standard", "standard_id"],
    ["severity", "severity"],
    ["status", "status"],
  ];
  for (const [parameter, column] of filters) {
    const value = requestUrl.searchParams.get(parameter);
    if (value) {
      clauses.push(`${column} = ?`);
      bindings.push(value);
    }
  }
  const category = requestUrl.searchParams.get("category");
  if (category) {
    clauses.push("(category = ? OR category LIKE ?)");
    bindings.push(category, `${category}/%`);
  }
  const objectType = requestUrl.searchParams.get("object_type");
  if (objectType) {
    clauses.push("data_json LIKE ?");
    bindings.push(`%\"values\":[%\"${objectType.replaceAll("%", "")}\"%`);
  }
  const page = positiveInteger(requestUrl.searchParams.get("page"), 1, 1_000_000);
  const pageSize = positiveInteger(requestUrl.searchParams.get("page_size"), 25, 100);
  const sortMap: Record<string, string> = {
    id: "rule_id", version: "version", national_standard: "national_standard_id", standard: "standard_id",
    severity: "severity", status: "status", category: "category",
  };
  const sort = sortMap[requestUrl.searchParams.get("sort") ?? "id"] ?? "rule_id";
  const direction = requestUrl.searchParams.get("direction") === "desc" ? "DESC" : "ASC";
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const count = await env.DB.prepare(`SELECT COUNT(*) AS total FROM rule_versions ${where}`).bind(...bindings).first<{ total: number }>();
  const result = await env.DB.prepare(
    `SELECT data_json FROM rule_versions ${where} ORDER BY ${sort} ${direction}, rule_id ASC LIMIT ? OFFSET ?`,
  ).bind(...bindings, pageSize, (page - 1) * pageSize).all();
  return json({
    data: result.results.map((row) => parseJsonRow(row)),
    pagination: { page, page_size: pageSize, total: Number(count?.total ?? 0) },
  }, version, 200, QUERY_CACHE);
}

async function ruleDetail(id: string, requestUrl: URL, env: Env, version: string): Promise<Response> {
  const requestedVersion = requestUrl.searchParams.get("version");
  const query = requestedVersion
    ? env.DB.prepare("SELECT data_json FROM rule_versions WHERE rule_id = ? AND version = ?").bind(id, requestedVersion)
    : env.DB.prepare("SELECT data_json FROM rule_versions WHERE rule_id = ? ORDER BY version DESC").bind(id);
  const result = await query.all();
  if (!result.results.length) return json({ error: "rule_not_found", id }, version, 404, QUERY_CACHE);
  const relations = await env.DB.prepare("SELECT data_json FROM relations WHERE from_id = ? OR to_id = ? ORDER BY id").bind(id, id).all();
  const implementations = await env.DB.prepare("SELECT data_json FROM implementations WHERE rule_id = ? ORDER BY id").bind(id).all();
  return json({
    id,
    versions: result.results.map((row) => parseJsonRow(row)),
    relations: relations.results.map((row) => parseJsonRow(row)),
    implementations: implementations.results.map((row) => parseJsonRow(row)),
  }, version);
}

async function listEntities(table: "standards" | "national_standards", env: Env, version: string): Promise<Response> {
  const result = await env.DB.prepare(`SELECT data_json FROM ${table} ORDER BY id`).all();
  return json({ data: result.results.map((row) => parseJsonRow(row)) }, version);
}

async function entityDetail(table: "standards" | "national_standards", id: string, env: Env, version: string): Promise<Response> {
  const row = await env.DB.prepare(`SELECT data_json FROM ${table} WHERE id = ?`).bind(id).first();
  if (!row) return json({ error: `${table.slice(0, -1)}_not_found`, id }, version, 404, QUERY_CACHE);
  const data = parseJsonRow<Record<string, unknown>>(row);
  if (table === "standards") {
    const entities = await env.DB.prepare("SELECT data_json FROM standard_entities WHERE standard_id = ? ORDER BY id").bind(id).all();
    return json({ ...data, entities: entities.results.map((item) => parseJsonRow(item)) }, version);
  }
  const rules = await env.DB.prepare("SELECT data_json FROM rule_versions WHERE national_standard_id = ? ORDER BY rule_id, version").bind(id).all();
  return json({ ...data, effective_rules: rules.results.map((item) => parseJsonRow(item)) }, version);
}

async function search(url: URL, env: Env, version: string): Promise<Response> {
  const query = (url.searchParams.get("q") ?? "").trim();
  if (!query) return json({ query, data: [] }, version, 200, QUERY_CACHE);
  const pattern = `%${query.replaceAll("%", "").replaceAll("_", "\\_")}%`;
  const limit = positiveInteger(url.searchParams.get("limit"), 25, 100);
  const [rules, entities, standards, nationalStandards] = await Promise.all([
    env.DB.prepare("SELECT rule_versions.rule_id AS id, rule_versions.version, rules.title_cs AS title, rule_versions.data_json AS data_json FROM rule_versions JOIN rules ON rules.id = rule_versions.rule_id WHERE rule_versions.search_text LIKE ? ESCAPE '\\' OR rule_versions.rule_id LIKE ? ESCAPE '\\' LIMIT ?").bind(pattern, pattern, limit).all(),
    env.DB.prepare("SELECT id, standard_version AS version, name AS title, data_json FROM standard_entities WHERE id LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR data_json LIKE ? ESCAPE '\\' LIMIT ?").bind(pattern, pattern, pattern, limit).all(),
    env.DB.prepare("SELECT id, NULL AS version, title_cs AS title, data_json FROM standards WHERE id LIKE ? ESCAPE '\\' OR title_cs LIKE ? ESCAPE '\\' OR data_json LIKE ? ESCAPE '\\' LIMIT ?").bind(pattern, pattern, pattern, limit).all(),
    env.DB.prepare("SELECT id, NULL AS version, title_cs AS title, data_json FROM national_standards WHERE id LIKE ? ESCAPE '\\' OR title_cs LIKE ? ESCAPE '\\' OR data_json LIKE ? ESCAPE '\\' LIMIT ?").bind(pattern, pattern, pattern, limit).all(),
  ]);
  return json({
    query,
    data: [
      ...rules.results.map((row) => ({ kind: "rule", id: row.id, version: row.version, title: row.title, data: parseJsonRow(row) })),
      ...entities.results.map((row) => ({ kind: "standard_entity", id: row.id, version: row.version, title: row.title, data: parseJsonRow(row) })),
      ...standards.results.map((row) => ({ kind: "standard", id: row.id, title: row.title, data: parseJsonRow(row) })),
      ...nationalStandards.results.map((row) => ({ kind: "national_standard", id: row.id, title: row.title, data: parseJsonRow(row) })),
    ].slice(0, limit),
  }, version, 200, QUERY_CACHE);
}

async function relations(url: URL, env: Env, version: string): Promise<Response> {
  const clauses: string[] = [];
  const bindings: string[] = [];
  for (const [parameter, column] of [["from", "from_id"], ["to", "to_id"], ["type", "relation_type"]] as const) {
    const value = url.searchParams.get(parameter);
    if (value) { clauses.push(`${column} = ?`); bindings.push(value); }
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await env.DB.prepare(`SELECT data_json FROM relations ${where} ORDER BY id LIMIT 500`).bind(...bindings).all();
  return json({ data: result.results.map((row) => parseJsonRow(row)) }, version, 200, QUERY_CACHE);
}

async function why(id: string, env: Env, version: string): Promise<Response> {
  const rule = await env.DB.prepare("SELECT 1 AS found FROM rules WHERE id = ?").bind(id).first();
  if (!rule) return json({ error: "rule_not_found", id }, version, 404, QUERY_CACHE);
  const relationRows = await env.DB.prepare("SELECT data_json FROM relations ORDER BY id").all();
  const all = relationRows.results.map((row) => parseJsonRow<{ from: string; to: string; type: string }>(row));
  const nodes = new Set([id]);
  const edges: typeof all = [];
  for (let depth = 0; depth < 4; depth += 1) {
    let changed = false;
    for (const edge of all) {
      if (nodes.has(edge.from) && !edges.includes(edge)) {
        edges.push(edge); nodes.add(edge.to); changed = true;
      }
    }
    if (!changed) break;
  }
  const nodeData = await Promise.all([...nodes].sort().map(async (nodeId) => {
    for (const [kind, table] of [["rule", "rules"], ["standard", "standards"], ["national_standard", "national_standards"], ["standard_entity", "standard_entities"]] as const) {
      const row = await env.DB.prepare(`SELECT data_json FROM ${table} WHERE id = ?`).bind(nodeId).first();
      if (row) return { id: nodeId, kind, data: parseJsonRow(row) };
    }
    const implementation = await env.DB.prepare("SELECT data_json FROM implementations WHERE json_extract(data_json, '$.id') = ? LIMIT 1").bind(nodeId).first();
    return { id: nodeId, kind: "implementation", ...(implementation ? { data: parseJsonRow(implementation) } : {}) };
  }));
  return json({ root: id, nodes: nodeData, edges }, version);
}

async function resolveXml(url: URL, env: Env, version: string): Promise<Response> {
  const namespace = url.searchParams.get("namespace");
  const element = url.searchParams.get("element");
  if (!namespace || !element) return json({ error: "namespace_and_element_required" }, version, 400, QUERY_CACHE);
  const entityRow = await env.DB.prepare("SELECT data_json FROM standard_entities WHERE namespace = ? AND name = ? ORDER BY standard_version DESC LIMIT 1").bind(namespace, element).first();
  if (!entityRow) return json({ entity: null, rules: [], relations: [], implementations: [] }, version, 404, QUERY_CACHE);
  const entity = parseJsonRow<{ id: string }>(entityRow);
  const clauses = ["target_id = ?"];
  const bindings: string[] = [entity.id];
  for (const [parameter, column] of [["national_standard", "national_standard_id"], ["version", "version"]] as const) {
    const value = url.searchParams.get(parameter);
    if (value) { clauses.push(`${column} = ?`); bindings.push(value); }
  }
  const ruleRows = await env.DB.prepare(`SELECT data_json FROM rule_versions WHERE ${clauses.join(" AND ")} ORDER BY rule_id, version`).bind(...bindings).all();
  const ruleData = ruleRows.results.map((row) => parseJsonRow<{ rule_id: string; version: string }>(row));
  const ruleIds = ruleData.map((rule) => rule.rule_id);
  const relationRows = await env.DB.prepare("SELECT data_json FROM relations WHERE from_id = ? OR to_id = ? ORDER BY id").bind(entity.id, entity.id).all();
  const implementationData: unknown[] = [];
  for (const ruleId of ruleIds) {
    const rows = await env.DB.prepare("SELECT data_json FROM implementations WHERE rule_id = ? ORDER BY id").bind(ruleId).all();
    implementationData.push(...rows.results.map((row) => parseJsonRow(row)));
  }
  return json({ entity, rules: ruleData, relations: relationRows.results.map((row) => parseJsonRow(row)), implementations: implementationData }, version);
}

async function compareNationalStandard(nationalStandardId: string, url: URL, env: Env, version: string): Promise<Response> {
  const versionA = url.searchParams.get("version_a");
  const versionB = url.searchParams.get("version_b");
  if (!versionA || !versionB) return json({ error: "version_a_and_version_b_required" }, version, 400, QUERY_CACHE);
  const rows = await env.DB.prepare("SELECT data_json FROM rule_versions WHERE national_standard_id = ? AND version IN (?, ?) ORDER BY rule_id, version").bind(nationalStandardId, versionA, versionB).all();
  const rules = rows.results.map((row) => parseJsonRow<RuleVersion & { rule_id: string; national_standard_id: string }>(row));
  return json(semanticNationalStandardDiff(rules, nationalStandardId, versionA, versionB), version, 200, QUERY_CACHE);
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let meta: Record<string, string>;
  try {
    meta = await datasetMeta(env.DB);
  } catch (error) {
    return json({ error: "registry_not_initialized", detail: error instanceof Error ? error.message : String(error) }, "uninitialized", 503, "no-store");
  }
  const version = meta.dataset_version ?? "unknown";
  const path = url.pathname.slice(API_PREFIX.length) || "/";

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: apiHeaders(version) });
  if (request.method !== "GET" && request.method !== "HEAD") return json({ error: "method_not_allowed" }, version, 405, "no-store");
  if (path === "/meta") return json(meta, version);
  if (path === "/rules") return listRules(url, env, version);
  if (path === "/standards") return listEntities("standards", env, version);
  if (path === "/national-standards") return listEntities("national_standards", env, version);
  if (path === "/search") return search(url, env, version);
  if (path === "/relations") return relations(url, env, version);
  if (path === "/resolve/xml") return resolveXml(url, env, version);

  const whyMatch = path.match(/^\/rules\/([^/]+)\/why$/);
  if (whyMatch?.[1]) return why(decodeURIComponent(whyMatch[1]), env, version);
  const relationMatch = path.match(/^\/rules\/([^/]+)\/relations$/);
  if (relationMatch?.[1]) {
    url.searchParams.set("from", decodeURIComponent(relationMatch[1]));
    return relations(url, env, version);
  }
  const ruleMatch = path.match(/^\/rules\/([^/]+)$/);
  if (ruleMatch?.[1]) return ruleDetail(decodeURIComponent(ruleMatch[1]), url, env, version);
  const standardMatch = path.match(/^\/standards\/([^/]+)$/);
  if (standardMatch?.[1]) return entityDetail("standards", decodeURIComponent(standardMatch[1]), env, version);
  const nationalStandardMatch = path.match(/^\/national-standards\/([^/]+)$/);
  if (nationalStandardMatch?.[1]) return entityDetail("national_standards", decodeURIComponent(nationalStandardMatch[1]), env, version);
  const compareMatch = path.match(/^\/compare\/national-standards\/([^/]+)$/);
  if (compareMatch?.[1]) return compareNationalStandard(decodeURIComponent(compareMatch[1]), url, env, version);
  return json({ error: "not_found", path }, version, 404, QUERY_CACHE);
}

async function handleRegistryAsset(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/registry") return Response.redirect(`${url.origin}/registry/`, 308);
  const isConcreteAsset = url.pathname === "/registry/"
    || url.pathname.startsWith("/registry/assets/")
    || /\.[A-Za-z0-9]+$/.test(url.pathname);
  if (isConcreteAsset) return env.ASSETS.fetch(request);
  // Fetch the directory URL because Static Assets canonicalizes index.html to
  // /registry/ with a redirect, which would otherwise erase the SPA deep link.
  const fallbackUrl = new URL("/registry/", url);
  return env.ASSETS.fetch(new Request(fallbackUrl, request));
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname.startsWith(`${API_PREFIX}/`) || url.pathname === API_PREFIX) return handleApi(request, env);
  if (url.pathname === "/registry" || url.pathname.startsWith("/registry/")) return handleRegistryAsset(request, env);
  return env.ASSETS.fetch(request);
}

export default {
  fetch: handleRequest,
} satisfies ExportedHandler<Env>;
