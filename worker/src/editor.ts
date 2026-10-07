import { createClerkClient } from "@clerk/backend";
import type { RegistryDocument, RuleDocument } from "../../packages/registry-core/src/model.ts";
import { changedFields, documentHash, validateProposal } from "./editor-model.ts";

export interface EditorEnv {
  DB: D1Database;
  EDITOR_DB?: D1Database;
  EDITOR_ENABLED?: string;
  EDITOR_ORIGIN?: string;
  CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
}
type Member = { user_id: string; role: "editor" | "reviewer" | "admin" };
type Draft = { id: string; owner_id: string; rule_id: string; revision: number; document: string; base_document: string | null; base_commit: string; content_hash: string; created_at: string; updated_at: string };
const MAX_BODY = 256 * 1024;

export function editorJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store",
    "Vary": "Authorization, Cookie, Origin", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
  } });
}
function configured(env: EditorEnv, url: URL): boolean {
  if (env.EDITOR_ENABLED !== "true" || !env.EDITOR_DB || env.EDITOR_DB === env.DB || !env.CLERK_PUBLISHABLE_KEY || !env.CLERK_SECRET_KEY) return false;
  try { return new URL(env.EDITOR_ORIGIN!).origin === env.EDITOR_ORIGIN && url.origin === env.EDITOR_ORIGIN; } catch { return false; }
}
async function snapshot(db: D1Database): Promise<{ commit: string; documents: RegistryDocument[] }> {
  const tables = ["rules", "standards", "national_standards", "vocabularies"];
  const results = await db.batch<Record<string, unknown>>([
    db.prepare("SELECT value FROM registry_meta WHERE key = 'git_commit'"),
    ...tables.map((table) => db.prepare(`SELECT data_json FROM ${table} ORDER BY id`)),
  ]);
  const commit = String(results[0]?.results[0]?.value ?? "");
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("Published dataset has no stable commit");
  const documents = results.slice(1).flatMap((result) => result.results.map((row) => {
    const doc = JSON.parse(String(row.data_json)) as RegistryDocument;
    delete doc.source_file;
    return doc;
  }));
  return { commit, documents };
}
async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json") throw new Response(null, { status: 415 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) throw new Response(null, { status: 413 });
  const reader = request.body?.getReader();
  if (!reader) throw new Response(null, { status: 400 });
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.length;
    if (size > MAX_BODY) { await reader.cancel(); throw new Response(null, { status: 413 }); }
    chunks.push(next.value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); } catch { throw new Response(null, { status: 400 }); }
  const checkDepth = (value: unknown, depth = 0): void => {
    if (depth > 30) throw new Response(null, { status: 400 });
    if (value && typeof value === "object") for (const item of Object.values(value)) checkDepth(item, depth + 1);
  };
  checkDepth(parsed);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Response(null, { status: 400 });
  return parsed as Record<string, unknown>;
}
function visible(draft: Draft, member: Member): boolean { return draft.owner_id === member.user_id || member.role !== "editor"; }
function serializeDraft(draft: Draft) {
  const document = JSON.parse(draft.document) as RuleDocument;
  const baseDocument = draft.base_document ? JSON.parse(draft.base_document) : null;
  return { ...draft, state: "draft", document, base_document: baseDocument, changes: changedFields(baseDocument, document) };
}

export async function handleEditor(request: Request, env: EditorEnv): Promise<Response> {
  const url = new URL(request.url);
  if (!configured(env, url)) return editorJson({ error: "editor_unavailable" }, 503);
  const route = url.pathname.slice("/api/editor".length);
  if (request.headers.has("Origin") && request.headers.get("Origin") !== env.EDITOR_ORIGIN) return editorJson({ error: "origin_denied" }, 403);
  if (route === "/config" && request.method === "GET") return editorJson({ publishableKey: env.CLERK_PUBLISHABLE_KEY });
  if (!["GET", "POST", "PUT"].includes(request.method)) return editorJson({ error: "method_not_allowed" }, 405);
  if (request.method !== "GET" && request.headers.get("Origin") !== env.EDITOR_ORIGIN) return editorJson({ error: "origin_required" }, 403);
  try {
    const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY!, publishableKey: env.CLERK_PUBLISHABLE_KEY! });
    const session = await clerk.authenticateRequest(request, { authorizedParties: [env.EDITOR_ORIGIN!], acceptsToken: "session_token" });
    if (!session.isAuthenticated) return editorJson({ error: "unauthenticated" }, 401);
    const userId = session.toAuth().userId;
    if (!userId) return editorJson({ error: "unauthenticated" }, 401);
    const privateDb = env.EDITOR_DB!;
    const member = await privateDb.prepare("SELECT user_id, role FROM editor_members WHERE user_id = ? AND active = 1").bind(userId).first<Member>();
    if (!member || !["editor", "reviewer", "admin"].includes(member.role)) return editorJson({ error: "membership_required" }, 403);
    const minute = Math.floor(Date.now() / 60000);
    const rate = await privateDb.batch<Record<string, unknown>>([
      privateDb.prepare("DELETE FROM editor_rate_limits WHERE minute < ?").bind(minute - 2),
      privateDb.prepare("INSERT INTO editor_rate_limits (user_id, minute, count) VALUES (?, ?, 1) ON CONFLICT(user_id, minute) DO UPDATE SET count = count + 1 RETURNING count").bind(userId, minute),
    ]);
    if (Number(rate[1]?.results[0]?.count) > 120) return editorJson({ error: "rate_limited" }, 429);
    if (route === "/session" && request.method === "GET") return editorJson({ userId, role: member.role });
    if (route === "/drafts" && request.method === "GET") {
      const rows = await privateDb.prepare("SELECT id, owner_id, rule_id, revision, base_commit, content_hash, created_at, updated_at FROM editor_drafts WHERE owner_id = ? OR ? != 'editor' ORDER BY updated_at DESC LIMIT 100").bind(userId, member.role).all();
      return editorJson({ data: rows.results, limit: 100 });
    }
    const match = route.match(/^\/drafts\/([a-f0-9-]{36})$/);
    let draft: Draft | null = null;
    if (match) {
      draft = await privateDb.prepare("SELECT * FROM editor_drafts WHERE id = ?").bind(match[1]).first<Draft>();
      if (!draft || !visible(draft, member)) return editorJson({ error: "not_found" }, 404);
      if (request.method === "GET") return editorJson(serializeDraft(draft));
      if (draft.owner_id !== userId) return editorJson({ error: "owner_required" }, 403);
    }
    const isCreate = route === "/drafts" && request.method === "POST";
    const isUpdate = Boolean(match && request.method === "PUT");
    const isValidate = route === "/validate" && request.method === "POST";
    const ruleMatch = route.match(/^\/rules\/([A-Za-z0-9._-]+)$/);
    if (!(route === "/catalog" && request.method === "GET") && !(ruleMatch && request.method === "GET") && !isCreate && !isUpdate && !isValidate) return editorJson({ error: "not_found" }, 404);
    const published = await snapshot(env.DB);
    if (route === "/catalog") return editorJson({ base_commit: published.commit, rules: published.documents.filter((doc) => doc.kind === "rule").map((doc) => ({ id: doc.id, title: doc.title })) });
    if (ruleMatch) {
      const document = published.documents.find((doc) => doc.kind === "rule" && doc.id === ruleMatch[1]);
      return document ? editorJson({ document, base_commit: published.commit }) : editorJson({ error: "not_found" }, 404);
    }
    const input = await body(request);
    if (Object.keys(input).some((key) => !["document", "base_commit", "revision"].includes(key))) return editorJson({ error: "unknown_fields" }, 400);
    if (input.base_commit !== published.commit || (draft && draft.base_commit !== published.commit)) return editorJson({ error: "base_changed", current_commit: published.commit }, 409);
    const issues = validateProposal(input.document, published.documents);
    if (issues.length) return editorJson({ error: "validation_failed", issues }, 422);
    const document = input.document as RuleDocument;
    if (draft && draft.rule_id !== document.id) return editorJson({ error: "draft_identity_changed" }, 400);
    const base = draft?.base_document ? JSON.parse(draft.base_document) : published.documents.find((doc) => doc.kind === "rule" && doc.id === document.id) ?? null;
    const changes = changedFields(base, document);
    if (isValidate) return editorJson({ issues: [], changes, note: "Kontrola schématu a sémantických vazeb, nikoli odborné schválení či validace XML/SIP." });
    const now = new Date().toISOString();
    const hash = await documentHash(document);
    const json = JSON.stringify(document);
    const membership = "EXISTS (SELECT 1 FROM editor_members WHERE user_id = ? AND active = 1)";
    if (isCreate) {
      const id = crypto.randomUUID();
      const result = await privateDb.prepare(`INSERT INTO editor_drafts (id, owner_id, rule_id, base_commit, base_document, document, content_hash, revision, created_at, updated_at) SELECT ?, ?, ?, ?, ?, ?, ?, 1, ?, ? WHERE ${membership} RETURNING id`)
        .bind(id, userId, document.id, published.commit, base ? JSON.stringify(base) : null, json, hash, now, now, userId).first();
      if (!result) return editorJson({ error: "membership_required" }, 403);
      return editorJson({ id, revision: 1, content_hash: hash }, 201);
    }
    if (!Number.isSafeInteger(input.revision) || Number(input.revision) < 1) return editorJson({ error: "revision_required" }, 400);
    const result = await privateDb.prepare(`UPDATE editor_drafts SET document = ?, content_hash = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND owner_id = ? AND revision = ? AND ${membership} RETURNING revision`)
      .bind(json, hash, now, draft!.id, userId, input.revision, userId).first();
    if (!result) return editorJson({ error: "revision_conflict" }, 409);
    return editorJson({ id: draft!.id, revision: Number(input.revision) + 1, content_hash: hash });
  } catch (error) {
    if (error instanceof Response) return editorJson({ error: "invalid_request" }, error.status);
    // Auth/database failures must never expose draft content, keys or server internals.
    return editorJson({ error: "editor_unavailable" }, 503);
  }
}
