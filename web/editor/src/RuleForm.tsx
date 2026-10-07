import type { RuleDocument, RuleVersion } from "../../../packages/registry-core/src/model.ts";

export function RuleForm({ document, index, onChange }: { document: RuleDocument; index: number; onChange: (next: RuleDocument) => void }) {
  const version = document.versions[index]!;
  const updateVersion = (patch: Partial<RuleVersion>) => onChange({ ...document, versions: document.versions.map((value, i) => i === index ? { ...value, ...patch } : value) });
  return <>
    <label>Název pravidla<input value={document.title.cs ?? ""} onChange={(e) => onChange({ ...document, title: { ...document.title, cs: e.target.value } })} /></label>
    <p><strong>{document.id}</strong> · {document.national_standard.id} · verze {version.version} · {version.obligation_code ?? version.obligation}</p>
    <label>Normativní požadavek<textarea rows={5} value={version.normative_requirement.cs ?? ""} onChange={(e) => updateVersion({ normative_requirement: { ...version.normative_requirement, cs: e.target.value } })} /></label>
    <label>Výklad registru<textarea rows={5} value={version.interpretation?.cs ?? ""} onChange={(e) => updateVersion({ interpretation: { ...version.interpretation, cs: e.target.value } })} /></label>
    <div className="fields">
      <label>Zdrojový dokument<input value={version.source.document} onChange={(e) => updateVersion({ source: { ...version.source, document: e.target.value } })} /></label>
      <label>Verze pramene<input value={version.source.version ?? ""} onChange={(e) => updateVersion({ source: { ...version.source, version: e.target.value || null } })} /></label>
      <label>Strana<input value={version.source.page ?? ""} onChange={(e) => updateVersion({ source: { ...version.source, page: e.target.value || null } })} /></label>
      <label>Oddíl / lokátor<input value={version.source.section ?? ""} onChange={(e) => updateVersion({ source: { ...version.source, section: e.target.value || null } })} /></label>
    </div>
    <label>URL pramene<input type="url" value={version.source.url ?? ""} onChange={(e) => updateVersion({ source: { ...version.source, url: e.target.value || null } })} /></label>
    <p>Formulář zachovává ostatní pole i verze. Povinnosti, podmínky, ověření, cílový prvek a XML ukázky lze zatím upravit v pokročilém JSON. Změna textu sama nemění stav odborného ověření.</p>
  </>;
}
