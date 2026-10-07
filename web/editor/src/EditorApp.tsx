import { SignIn, UserButton, useAuth } from "@clerk/react";
import { useEffect, useRef, useState } from "react";
import type { RuleDocument } from "../../../packages/registry-core/src/model.ts";
import { editorRequest, EditorError, errors } from "./api.ts";
import { RuleForm } from "./RuleForm.tsx";

type Catalog = { base_commit: string; rules: Array<{ id: string; title: { cs?: string } }> };
type Session = { userId: string; role: string };
type DraftSummary = { id: string; rule_id: string; revision: number; owner_id: string };
type Draft = DraftSummary & { document: RuleDocument; base_commit: string };
type Change = { path: string; before: unknown; after: unknown };
type Validation = { issues: Array<{ path?: string; message: string }>; changes: Change[]; note: string };

export function EditorApp() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  if (!isLoaded) return <p role="status">Načítám přihlášení…</p>;
  if (!isSignedIn) return <section><h2>Přihlášení operátora</h2><p>Samotné přihlášení nezakládá oprávnění upravovat registr.</p><SignIn routing="hash" forceRedirectUrl="/editor/" /></section>;
  return <><div className="actions"><UserButton /><a href="/registry/">Veřejný registr</a></div><Workspace key={userId} /></>;
}

function Workspace() {
  const { getToken } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [document, setDocument] = useState<RuleDocument | null>(null);
  const [draft, setDraft] = useState<DraftSummary | null>(null);
  const [baseCommit, setBaseCommit] = useState("");
  const [versionIndex, setVersionIndex] = useState(0);
  const [jsonText, setJsonText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [jsonDirty, setJsonDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<EditorError | null>(null);
  const [message, setMessage] = useState("");
  const [validation, setValidation] = useState<Validation | null>(null);
  const [selectedRule, setSelectedRule] = useState("");
  const mounted = useRef(true);
  const forbidden = error?.status === 401 || error?.status === 403;
  const readOnly = Boolean(draft && draft.owner_id !== session?.userId);

  async function api<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
    const token = await getToken();
    if (!token) throw new EditorError(401, "unauthenticated");
    return editorRequest<T>(token, path, method, body, signal);
  }
  function failure(reason: unknown) { setError(reason instanceof EditorError ? reason : new EditorError(503, "editor_unavailable")); }
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    async function load() {
      try {
        const [who, choices, list] = await Promise.all([
          api<Session>("/session", "GET", undefined, controller.signal),
          api<Catalog>("/catalog", "GET", undefined, controller.signal),
          api<{ data: DraftSummary[] }>("/drafts", "GET", undefined, controller.signal),
        ]);
        if (!controller.signal.aborted) { setSession(who); setCatalog(choices); setDrafts(list.data); }
      } catch (reason) { if (!controller.signal.aborted) failure(reason); }
    }
    void load();
    return () => { mounted.current = false; controller.abort(); };
  }, [getToken]);
  useEffect(() => {
    if (!dirty && !jsonDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, jsonDirty]);

  function change(next: RuleDocument) { setDocument(next); setJsonText(JSON.stringify(next, null, 2)); setDirty(true); setValidation(null); setMessage(""); }
  function canReplace() { return (!dirty && !jsonDirty) || window.confirm("Zahodit neuložené změny ve formuláři?"); }
  async function run(action: () => Promise<void>) {
    setPending(true); setError(null); setMessage("");
    try { await action(); } catch (reason) { if (mounted.current) failure(reason); }
    finally { if (mounted.current) setPending(false); }
  }
  function accept(next: RuleDocument, commit: string, selectedDraft: DraftSummary | null) {
    if (!mounted.current) return;
    setDocument(next); setBaseCommit(commit); setDraft(selectedDraft); setVersionIndex(0);
    setJsonText(JSON.stringify(next, null, 2)); setDirty(false); setJsonDirty(false); setValidation(null);
  }
  async function loadRule() {
    if (!selectedRule || !canReplace()) return;
    await run(async () => {
      const result = await api<{ document: RuleDocument; base_commit: string }>(`/rules/${encodeURIComponent(selectedRule)}`);
      accept(result.document, result.base_commit, null);
    });
  }
  async function loadDraft(id: string) {
    if (!canReplace()) return;
    await run(async () => {
      const result = await api<Draft>(`/drafts/${id}`);
      accept(result.document, result.base_commit, result);
    });
  }
  async function validate(next = document) {
    if (!next) return;
    const result = await api<Validation>("/validate", "POST", { document: next, base_commit: baseCommit });
    if (mounted.current) setValidation(result);
  }
  async function applyJson() {
    await run(async () => {
      let parsed: unknown;
      try { parsed = JSON.parse(jsonText); } catch { throw new EditorError(422, "validation_failed", [{ message: "Neplatná syntaxe JSON." }]); }
      if (draft && (parsed as RuleDocument)?.id !== draft.rule_id) throw new EditorError(422, "validation_failed", [{ message: "Identita uloženého konceptu se nemění. Pro nové pravidlo založte nový návrh." }]);
      await validate(parsed as RuleDocument);
      if (mounted.current) { setDocument(parsed as RuleDocument); setVersionIndex(0); setDirty(true); setJsonDirty(false); }
    });
  }
  async function save() {
    await run(async () => {
      const result = await api<{ id: string; revision: number }>(draft ? `/drafts/${draft.id}` : "/drafts", draft ? "PUT" : "POST", { document, base_commit: baseCommit, ...(draft ? { revision: draft.revision } : {}) });
      if (!mounted.current) return;
      setDraft({ id: result.id, revision: result.revision, owner_id: session!.userId, rule_id: document!.id });
      setDirty(false); setMessage(`Soukromý koncept uložen, revize ${result.revision}. Nebyl publikován.`);
      const list = await api<{ data: DraftSummary[] }>("/drafts");
      if (mounted.current) setDrafts(list.data);
    });
  }
  return <>
    {error && <section role="alert" className="notice error"><p>{errors[error.code] ?? "Požadavek se nepodařilo dokončit."}</p>{error.issues.length > 0 && <ul>{error.issues.map((issue, i) => <li key={i}><code>{issue.path}</code> {issue.message}</li>)}</ul>}</section>}
    {!catalog && !error && <p role="status">Načítám oprávnění a katalog…</p>}
    {catalog && session && !forbidden && <>
      <p>Přístup: {session.role}. Koncepty se nezapisují do veřejného registru. Schvalování a publikace nejsou v této verzi dostupné.</p>
      <div className="workspace"><aside>
        <h2>Nový návrh</h2><label>Výchozí pravidlo<select value={selectedRule} disabled={pending} onChange={(e) => setSelectedRule(e.target.value)}><option value="">Vyberte pravidlo</option>{catalog.rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.id} — {rule.title.cs}</option>)}</select></label>
        <button disabled={pending || !selectedRule} onClick={() => void loadRule()}>Načíst jako nový návrh</button>
        <p>Pro nové pravidlo lze před prvním uložením upravit ID a další pole v JSON. Převzaté prameny a ověření je nutné znovu odborně posoudit.</p>
        <h2>Koncepty</h2><p>Zobrazeno nejvýše 100 naposledy změněných konceptů. Editor vidí vlastní; recenzent a správce mohou číst i ostatní.</p>
        <ul>{drafts.map((item) => <li key={item.id}><button className="draft-link" disabled={pending} onClick={() => void loadDraft(item.id)}>{item.rule_id} · r{item.revision}</button></li>)}</ul>
      </aside><section aria-label="Editace pravidla">
        {!document ? <p>Vyberte pravidlo nebo uložený koncept.</p> : <>
          <h2>{draft ? `Koncept · revize ${draft.revision}` : "Neuložený návrh"}</h2>
          <p>Výchozí commit: <code>{baseCommit}</code>{dirty || jsonDirty ? " · neuložené změny" : ""}{readOnly ? " · pouze čtení" : ""}</p>
          {baseCommit !== catalog.base_commit && <p className="notice">Základ návrhu je jiný než načtený katalog. Server při ukládání znovu ověří aktuální dataset.</p>}
          <fieldset disabled={pending || readOnly || jsonDirty}>
            <legend>Základní údaje</legend>
            <label>Verze NDK<select value={versionIndex} onChange={(e) => setVersionIndex(Number(e.target.value))}>{document.versions.map((item, index) => <option key={item.version} value={index}>{item.version}</option>)}</select></label>
            <RuleForm document={document} index={versionIndex} onChange={change} />
          </fieldset>
          <details><summary>Pokročilý zápis JSON</summary><p>Změny použijte před uložením. Server odmítne zápis neodpovídající schématu nebo s neplatnými vazbami.</p><label>Celý zdrojový záznam<textarea className="json" rows={18} disabled={pending || readOnly} value={jsonText} onChange={(e) => { setJsonText(e.target.value); setJsonDirty(true); setValidation(null); setMessage(""); }} /></label><button disabled={pending || readOnly || !jsonDirty} onClick={() => void applyJson()}>Ověřit a použít JSON</button><button disabled={pending || !jsonDirty} onClick={() => { setJsonText(JSON.stringify(document, null, 2)); setJsonDirty(false); }}>Zahodit změny JSON</button></details>
          <div className="actions"><button disabled={pending || jsonDirty} onClick={() => void run(() => validate())}>Ověřit a zobrazit rozdíly</button><button disabled={pending || readOnly || jsonDirty || (!dirty && Boolean(draft))} onClick={() => void save()}>Uložit soukromý koncept</button></div>
          {pending && <p role="status">Zpracovávám…</p>}{message && <p role="status" className="notice">{message}</p>}
          {validation && <section aria-label="Výsledek kontroly"><h3>Technická kontrola prošla</h3><p>{validation.note}</p>{validation.changes.length ? validation.changes.map((item) => <article className="change" key={item.path}><h4><code>{item.path}</code></h4><div className="fields"><div><strong>Publikovaný základ</strong><pre>{JSON.stringify(item.before, null, 2)}</pre></div><div><strong>Návrh</strong><pre>{JSON.stringify(item.after, null, 2)}</pre></div></div></article>) : <p>Bez změn proti publikovanému základu.</p>}</section>}
        </>}
      </section></div>
    </>}
  </>;
}
