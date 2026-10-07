export class EditorError extends Error {
  constructor(public status: number, public code: string, public issues: Array<{ path?: string; message: string }> = []) {
    super(code);
  }
}
export const errors: Record<string, string> = {
  editor_unavailable: "Editor není nakonfigurovaný nebo je dočasně nedostupný. Veřejný registr zůstává dostupný.",
  unauthenticated: "Přihlášení vypršelo. Přihlaste se znovu.",
  membership_required: "Jste přihlášeni, ale nemáte přidělený přístup k registru. Obraťte se na správce.",
  origin_denied: "Editor byl otevřen z nepovolené adresy.",
  origin_required: "Zápis vyžaduje požadavek ze stejné adresy editoru.",
  validation_failed: "Návrh neprošel kontrolou. Opravte uvedené chyby; nic nebylo uloženo.",
  revision_conflict: "Koncept mezitím někdo změnil. Vaše změny zůstaly ve formuláři; znovunačtení je zahodí.",
  base_changed: "Publikovaný dataset se změnil. Tento návrh nelze uložit bez nového porovnání s aktuální verzí.",
  owner_required: "Cizí koncept je dostupný jen pro čtení.",
  create_rule_forbidden: "Nová pravidla mohou vytvářet a upravovat pouze editor a správce. Existující návrh zůstal ve formuláři.",
  rule_id_exists: "Pravidlo s tímto ID již existuje. Zvolte jiné ID, nebo načtěte existující pravidlo jako návrh změny.",
  not_found: "Záznam není dostupný.",
  rate_limited: "Příliš mnoho požadavků. Zkuste to za minutu.",
};
export async function editorRequest<T>(token: string, path: string, method = "GET", payload?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/editor${path}`, {
    method, credentials: "same-origin", cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, ...(payload === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }), ...(signal ? { signal } : {}),
  });
  const data = await response.json() as { error?: string; issues?: Array<{ path?: string; message: string }> };
  if (!response.ok) throw new EditorError(response.status, data.error ?? "editor_unavailable", data.issues ?? []);
  return data as T;
}
