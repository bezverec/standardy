import { readFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { compileRegistry, loadRegistry, registryImportSql, validateRegistry } from "../packages/registry-core/src/index.ts";
import type { RuleDocument } from "../packages/registry-core/src/model.ts";
import { handleRequest, type Env } from "../worker/src/index.ts";
import { changedFields, documentHash, validateProposal } from "../worker/src/editor-model.ts";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RuleForm } from "../web/editor/src/RuleForm.tsx";
import { NewRuleFields } from "../web/editor/src/NewRuleFields.tsx";
import { blankRule } from "../web/editor/src/new-rule.ts";

// Only the external authentication boundary is mocked, never a production bypass.
const auth = vi.hoisted(() => vi.fn());
vi.mock("@clerk/backend", () => ({ createClerkClient: () => ({ authenticateRequest: auth }) }));
const root = path.resolve(import.meta.dirname, "..");
const docs = await loadRegistry(root);
const registry = compileRegistry(docs);
const candidate = structuredClone(docs.find((doc) => doc.id === "NDK-PER-MIX-FORMAT-VERSION")) as RuleDocument;
delete candidate.source_file;
const commit = registry.meta.git_commit;
const origin = "https://registry.test";

function d1(database: DatabaseSync): D1Database {
  return {
    prepare(sql: string) {
      let parameters: SQLInputValue[] = [];
      const statement = {
        bind(...values: SQLInputValue[]) { parameters = values; return statement; },
        async all() { return { results: database.prepare(sql).all(...parameters), success: true }; },
        async first() { return database.prepare(sql).get(...parameters) ?? null; },
        async run() { const result = database.prepare(sql).run(...parameters); return { meta: { changes: Number(result.changes) } }; },
      };
      return statement;
    },
    async batch(statements: Array<{ all(): Promise<unknown> }>) {
      database.exec("BEGIN");
      try { const results = []; for (const statement of statements) results.push(await statement.all()); database.exec("COMMIT"); return results; }
      catch (error) { database.exec("ROLLBACK"); throw error; }
    },
  } as unknown as D1Database;
}

let publicDb: DatabaseSync;
let privateDb: DatabaseSync;
let env: Env;
function signedIn(user = "operator") { auth.mockResolvedValue({ isAuthenticated: true, toAuth: () => ({ userId: user }) }); }
function request(route: string, method = "GET", payload?: unknown, headers: Record<string, string> = {}) {
  return handleRequest(new Request(`${origin}/api/editor${route}`, { method, headers: {
    ...(method === "GET" ? {} : { Origin: origin, "Content-Type": "application/json" }), ...headers,
  }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }) }), env);
}
async function create(document = candidate) {
  const response = await request("/drafts", "POST", { document, base_commit: commit });
  expect(response.status).toBe(201);
  return response.json() as Promise<{ id: string; revision: number }>;
}
beforeEach(async () => {
  publicDb = new DatabaseSync(":memory:"); privateDb = new DatabaseSync(":memory:");
  for (const file of ["0001_registry.sql", "0002_national_standards.sql", "0003_obligation.sql"]) publicDb.exec(await readFile(path.join(root, "migrations", file), "utf8"));
  publicDb.exec(registryImportSql(registry));
  privateDb.exec(await readFile(path.join(root, "migrations-editor/0001_editor.sql"), "utf8"));
  privateDb.exec("INSERT INTO editor_members VALUES ('operator', 'editor', 1), ('other', 'editor', 1), ('reviewer', 'reviewer', 1)");
  env = { DB: d1(publicDb), EDITOR_DB: d1(privateDb), EDITOR_ENABLED: "true", EDITOR_ORIGIN: origin, CLERK_SECRET_KEY: "test-fixture-only", CLERK_PUBLISHABLE_KEY: "test-fixture-only", ASSETS: { fetch: async () => new Response("asset") } as unknown as Fetcher };
  auth.mockReset(); signedIn();
});
afterEach(() => { publicDb.close(); privateDb.close(); });

describe("private editor boundary and persistence", () => {
  it("fails closed without config or isolated storage, including configuration endpoint", async () => {
    delete env.CLERK_SECRET_KEY;
    expect((await request("/config")).status).toBe(503);
    expect(auth).not.toHaveBeenCalled();
    env.CLERK_SECRET_KEY = "fixture"; env.EDITOR_DB = env.DB;
    expect((await request("/drafts")).status).toBe(503);
  });
  it("returns only publishable configuration and requires authenticated membership", async () => {
    const config = await request("/config");
    expect(await config.json()).toEqual({ publishableKey: "test-fixture-only" });
    auth.mockResolvedValue({ isAuthenticated: false });
    expect((await request("/drafts")).status).toBe(401);
    signedIn("unknown"); expect((await request("/drafts")).status).toBe(403);
    signedIn(); privateDb.exec("UPDATE editor_members SET active=0 WHERE user_id='operator'");
    expect((await request("/session")).status).toBe(403);
  });
  it("uses exact origin and session tokens and keeps every error private", async () => {
    expect((await request("/drafts", "POST", {}, { Origin: "https://evil.test" })).status).toBe(403);
    expect((await request("/drafts", "POST", {}, { Origin: "" })).status).toBe(403);
    const ok = await request("/session");
    expect(auth).toHaveBeenCalledWith(expect.any(Request), { authorizedParties: [origin], acceptsToken: "session_token" });
    expect(ok.headers.get("Cache-Control")).toContain("no-store");
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBeNull();
    auth.mockRejectedValue(new Error("secret must not leak"));
    const failed = await request("/session");
    expect(failed.status).toBe(503); expect(await failed.text()).not.toContain("secret must not leak");
  });
  it("stores in private database with immutable base and atomic revision history", async () => {
    const draft = await create();
    const changed = structuredClone(candidate); changed.title.cs = "Soukromý návrh";
    const update = await request(`/drafts/${draft.id}`, "PUT", { document: changed, base_commit: commit, revision: 1 });
    expect(update.status).toBe(200);
    expect(privateDb.prepare("SELECT revision FROM editor_revisions ORDER BY revision").all()).toEqual([{ revision: 1 }, { revision: 2 }]);
    const current = await request(`/drafts/${draft.id}`);
    expect(await current.json()).toMatchObject({ revision: 2, base_document: candidate, document: changed, state: "draft" });
    const publicResponse = await handleRequest(new Request(`${origin}/api/v1/rules/${candidate.id}`), env);
    expect(await publicResponse.text()).not.toContain("Soukromý návrh");
    publicDb.exec(registryImportSql(registry));
    expect(privateDb.prepare("SELECT count(*) AS count FROM editor_drafts").get()).toEqual({ count: 1 });
  });
  it("rejects stale revisions and changed published baselines without altering history", async () => {
    const draft = await create();
    expect((await request(`/drafts/${draft.id}`, "PUT", { document: candidate, base_commit: commit, revision: 9 })).status).toBe(409);
    publicDb.prepare("UPDATE registry_meta SET value=? WHERE key='git_commit'").run("a".repeat(40));
    expect((await request(`/drafts/${draft.id}`, "PUT", { document: candidate, base_commit: "a".repeat(40), revision: 1 })).status).toBe(409);
    expect(privateDb.prepare("SELECT count(*) AS count FROM editor_revisions").get()).toEqual({ count: 1 });
  });
  it("hides other editors drafts, allows reviewer reading but not editing or approval", async () => {
    const draft = await create();
    signedIn("other"); expect(await (await request("/drafts")).json()).toMatchObject({ data: [] });
    expect((await request(`/drafts/${draft.id}`)).status).toBe(404);
    signedIn("reviewer"); expect((await request(`/drafts/${draft.id}`)).status).toBe(200);
    expect((await request(`/drafts/${draft.id}`, "PUT", { document: candidate, base_commit: commit, revision: 1 })).status).toBe(403);
    expect((await request(`/drafts/${draft.id}/approve`, "POST", {})).status).toBe(404);
  });
  it("validates schema, code semantics and references before persisting anything", async () => {
    for (const document of [{ id: "incomplete" }, { ...candidate, unknown: "field" }, { ...candidate, national_standard: { id: "missing" } }]) {
      expect((await request("/drafts", "POST", { document, base_commit: commit })).status).toBe(422);
    }
    const wrong = structuredClone(candidate); wrong.versions[0]!.obligation_code = "R";
    expect((await request("/validate", "POST", { document: wrong, base_commit: commit })).status).toBe(422);
    expect(privateDb.prepare("SELECT count(*) AS count FROM editor_drafts").get()).toEqual({ count: 0 });
  });
  it("supports new rule proposals without overwriting a different entity identity", async () => {
    const document = structuredClone(candidate); document.id = "NDK-PER-MIX-NEW-PROPOSAL";
    const draft = await create(document);
    expect(await (await request(`/drafts/${draft.id}`)).json()).toMatchObject({ base_document: null, document });
    document.id = "MIX";
    expect((await request("/validate", "POST", { document, base_commit: commit })).status).toBe(422);
  });
  it("exposes creation capability and catalog choices for editor, admin and reviewer", async () => {
    for (const role of ["editor", "admin", "reviewer"]) {
      privateDb.prepare("UPDATE editor_members SET role=? WHERE user_id='operator'").run(role);
      expect(await (await request("/session")).json()).toMatchObject({ capabilities: { create_rules: role !== "reviewer" } });
    }
    const catalog = await (await request("/catalog")).json() as { national_standards: unknown[]; targets: Array<{ id: string }> };
    expect(catalog.national_standards.length).toBeGreaterThan(0);
    expect(catalog.targets.some((item) => item.id === candidate.versions[0]!.target.entity)).toBe(true);
  });
  it("denies new rules to reviewer even with omitted or false client flags, but permits existing proposals", async () => {
    signedIn("reviewer");
    const document = { ...candidate, id: "NEW-REVIEWER-RULE" };
    for (const route of ["/validate", "/drafts"]) for (const flag of [undefined, false, true]) {
      const response = await request(route, "POST", { document, base_commit: commit, ...(flag === undefined ? {} : { new_rule: flag }) });
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "create_rule_forbidden" });
    }
    expect(privateDb.prepare("SELECT COUNT(*) AS count FROM editor_drafts").get()).toEqual({ count: 0 });
    await create();
  });
  it("permits admin creation, protects explicit new IDs and rechecks permissions after demotion", async () => {
    privateDb.exec("UPDATE editor_members SET role='admin' WHERE user_id='operator'");
    for (const route of ["/validate", "/drafts"]) {
      const duplicate = await request(route, "POST", { document: candidate, base_commit: commit, new_rule: true });
      expect(duplicate.status).toBe(409);
      expect(await duplicate.json()).toEqual({ error: "rule_id_exists" });
    }
    const document = { ...candidate, id: "NEW-ADMIN-RULE" };
    const draft = await create(document);
    privateDb.exec("UPDATE editor_members SET role='reviewer' WHERE user_id='operator'");
    expect((await request(`/drafts/${draft.id}`)).status).toBe(200);
    expect((await request(`/drafts/${draft.id}`, "PUT", { document, base_commit: commit, revision: 1 })).status).toBe(403);
    expect(privateDb.prepare("SELECT COUNT(*) AS count FROM editor_revisions").get()).toEqual({ count: 1 });
    privateDb.exec("UPDATE editor_members SET role='editor' WHERE user_id='operator'");
    expect((await request(`/drafts/${draft.id}`, "PUT", { document, base_commit: commit, revision: 1 })).status).toBe(200);
  });
  it("saves a completed blank form without inherited evidence and keeps it out of the public registry", async () => {
    const document = blankRule();
    expect(validateProposal(document, docs).length).toBeGreaterThan(0);
    document.id = "NEW-FROM-BLANK"; document.title.cs = "Test nového návrhu";
    document.national_standard = structuredClone(candidate.national_standard);
    Object.assign(document.versions[0]!, {
      version: candidate.versions[0]!.version, target: structuredClone(candidate.versions[0]!.target), category: "metadata/MIX",
      normative_requirement: { cs: "Testovací požadavek" }, requirement: { presence: "required" },
      source: { document: "Testovací pramen", version: null, page: null, section: null, url: null },
    });
    expect(validateProposal(document, docs)).toEqual([]);
    const response = await request("/drafts", "POST", { document, base_commit: commit, new_rule: true });
    expect(response.status).toBe(201);
    expect(document.versions[0]!.verification).toEqual({ status: "unverified", date: null, reference: null });
    expect(document.versions[0]!.examples).toBeUndefined();
    expect((await handleRequest(new Request(`${origin}/api/v1/rules/${document.id}`), env)).status).toBe(404);
  });
  it("limits payloads, methods and per-user requests", async () => {
    expect((await request("/validate", "POST", { huge: "a".repeat(256 * 1024) })).status).toBe(413);
    expect((await request("/validate", "POST", {}, { "Content-Type": "text/plain" })).status).toBe(415);
    expect((await request("/drafts", "DELETE")).status).toBe(405);
    privateDb.prepare("INSERT OR REPLACE INTO editor_rate_limits VALUES (?, ?, ?)").run("operator", Math.floor(Date.now() / 60000), 120);
    expect((await request("/drafts")).status).toBe(429);
  });
  it("does not change the public API method contract or expose editor credentials in assets", async () => {
    expect((await handleRequest(new Request(`${origin}/api/v1/rules`, { method: "POST" }), env)).status).toBe(405);
    const shell = await handleRequest(new Request(`${origin}/editor/`), env);
    expect(shell.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(shell.headers.get("Cache-Control")).toContain("no-store");
  });
});

describe("shared validation, deterministic evidence and form rendering", () => {
  it("matches CLI semantic findings using the precompiled schema", async () => {
    const wrong = structuredClone(candidate); wrong.versions[0]!.obligation_code = "R";
    const selected = docs.map((doc) => doc.id === wrong.id ? wrong : doc);
    const cli = await validateRegistry(root, selected);
    expect(validateProposal(wrong, docs).map((issue) => issue.message)).toEqual(cli.map((issue) => issue.message));
    expect(validateProposal(candidate, docs)).toEqual([]);
  });
  it("hashes property-order independently and distinguishes changed content", async () => {
    expect(await documentHash({ b: 2, a: 1 })).toBe(await documentHash({ a: 1, b: 2 }));
    expect(await documentHash({ a: 1 })).not.toBe(await documentHash({ a: 2 }));
    expect(changedFields({ title: { cs: "old" } }, { title: { cs: "new" } })).toEqual([{ path: "/title/cs", before: "old", after: "new" }]);
    expect(changedFields({ versions: [{ normative_requirement: { cs: "old" } }] }, { versions: [{ normative_requirement: { cs: "new" } }] })).toEqual([{ path: "/versions/0/normative_requirement/cs", before: "old", after: "new" }]);
  });
  it("renders form values as text and preserves separate normative and interpretation fields", () => {
    const document = structuredClone(candidate); document.title.cs = '<script>alert("test")</script>';
    const html = renderToStaticMarkup(createElement(RuleForm, { document, index: 0, onChange: () => {} }));
    expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain("<script>");
    expect(html).toContain("Normativní požadavek"); expect(html).toContain("Výklad registru");
    const blank = renderToStaticMarkup(createElement(NewRuleFields, { document: blankRule(), catalog: { national_standards: [], targets: [] }, identityLocked: false, onChange: () => {} }));
    expect(blank).toContain("ID nového pravidla"); expect(blank).toContain("Cílový prvek");
  });
});
