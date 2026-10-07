import type { RuleDocument, RuleVersion, NdkObligationCode } from "../../../packages/registry-core/src/model.ts";
import { ndkObligations } from "../../../packages/registry-core/src/obligation.ts";
import type { NewRuleCatalog } from "./new-rule.ts";

export function NewRuleFields({ document, index = 0, catalog, identityLocked, onChange }: {
  document: RuleDocument; index?: number; catalog: NewRuleCatalog; identityLocked: boolean; onChange: (next: RuleDocument) => void;
}) {
  const version = document.versions[index]!;
  const standard = catalog.national_standards.find((item) => item.id === document.national_standard.id);
  function replace(next: RuleVersion) { onChange({ ...document, versions: document.versions.map((item, i) => i === index ? next : item) }); }
  function update(patch: Partial<RuleVersion>) { replace({ ...version, ...patch }); }
  return <>
    <p>Nové pravidlo začíná jako neověřený návrh. Doplňte pramen i požadavek; prázdný záznam nelze uložit.</p>
    <label>ID nového pravidla<input disabled={identityLocked} value={document.id} onChange={(e) => onChange({ ...document, id: e.target.value })} /></label>
    <label>Národní standard<select value={document.national_standard.id} onChange={(e) => onChange({ ...document, national_standard: { id: e.target.value }, versions: document.versions.map((item) => ({ ...item, version: "" })) })}><option value="">Vyberte standard</option>{catalog.national_standards.map((item) => <option key={item.id} value={item.id}>{item.title.cs ?? item.id}</option>)}</select></label>
    <label>Verze nového pravidla<select value={version.version} onChange={(e) => update({ version: e.target.value })}><option value="">Vyberte verzi standardu</option>{standard?.versions.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label>Cílový prvek<select value={version.target.entity} onChange={(e) => update({ target: { entity: e.target.value } })}><option value="">Vyberte cílový prvek</option>{catalog.targets.map((item) => <option key={item.id} value={item.id}>{item.id} — {item.title.cs ?? item.id}</option>)}</select></label>
    <label>Kategorie<input placeholder="např. metadata/MIX" value={version.category} onChange={(e) => update({ category: e.target.value })} /></label>
    <label>Původní kód povinnosti<select value={version.obligation_code ?? ""} onChange={(e) => {
      const code = e.target.value as NdkObligationCode | "";
      const next = { ...version, obligation: code ? ndkObligations[code] : "unspecified" as const };
      delete next.obligation_source;
      if (code) next.obligation_code = code; else delete next.obligation_code;
      replace(next);
    }}><option value="">Neurčeno / bez kódu</option>{Object.keys(ndkObligations).map((code) => <option key={code}>{code}</option>)}</select></label>
    <label>Požadavek na přítomnost<select value={String(version.requirement.presence ?? "")} onChange={(e) => {
      const requirement = { ...version.requirement };
      if (e.target.value) requirement.presence = e.target.value; else delete requirement.presence;
      update({ requirement });
    }}><option value="">Vyberte podle pramene</option><option value="required">Vyžadováno</option><option value="optional">Volitelné</option><option value="conditional">Podmíněné</option><option value="forbidden">Nepoužívat</option></select></label>
    <p>Význam vazby (výchozí „souvisí s“), slovní povinnost bez kódu, podmínky a případné nepoužití upřesněte v JSON. Výběr povinnosti se neodvozuje automaticky z přítomnosti.</p>
  </>;
}
