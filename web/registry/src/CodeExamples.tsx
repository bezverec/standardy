import { useState } from "react";
import type { RuleExample } from "../../../packages/registry-core/src/model.ts";

function Example({ example }: { example: RuleExample }) {
  const [message, setMessage] = useState("");
  const [copying, setCopying] = useState(false);
  const title = example.title.cs ?? example.title.en ?? example.id;
  async function copy() {
    setCopying(true);
    setMessage("");
    try {
      await navigator.clipboard.writeText(example.code);
      setMessage("XML zkopírováno.");
    } catch {
      setMessage("Kopírování není dostupné. Označte a zkopírujte text ukázky ručně.");
    } finally { setCopying(false); }
  }
  return <article className="code-example">
    <div className="code-example-heading"><h3>{title}</h3><button type="button" onClick={copy} disabled={copying} aria-label={`Kopírovat XML: ${title}`}>{copying ? "Kopíruji…" : "Kopírovat XML"}</button></div>
    <p role="status" aria-live="polite">{message}</p>
    <pre tabIndex={0} aria-label={`Ukázka XML: ${title}`}><code className="language-xml">{example.code}</code></pre>
    <p>{example.note.cs ?? example.note.en}</p>
    <p className="muted">{example.source.document} · {example.source.version}</p>
    {example.source.url && /^https?:\/\//i.test(example.source.url) && <a href={example.source.url} target="_blank" rel="noopener noreferrer">Stáhnout zdrojový balíček</a>}
    <details className="example-provenance"><summary>Původ a ověření ukázky</summary><dl>
      <dt>Soubor v balíčku</dt><dd><code>{example.file_path}</code></dd>
      <dt>XPath ve zdrojovém dokumentu</dt><dd><code>{example.source_xpath}</code></dd>
      <dt>Jmenné prostory XPath</dt><dd>{Object.keys(example.namespaces).length ? <pre>{JSON.stringify(example.namespaces, null, 2)}</pre> : "Bez jmenného prostoru"}</dd>
      <dt>SHA-256 celého zdrojového souboru</dt><dd><code>{example.file_sha256}</code></dd>
      <dt>Datum kontroly výřezu</dt><dd>{example.checked_on}</dd>
    </dl></details>
  </article>;
}

export function CodeExamples({ examples }: { examples: RuleExample[] }) {
  if (!examples.length) return null;
  return <section className="layer layer--examples"><p className="layer-label">Ukázky · nenormativní</p><h2>Ukázka XML</h2>
    <p>Výřezy ze vzorového balíčku, nikoli univerzální šablona nebo potvrzení jeho validity. Identifikátory, cesty a hodnoty patří ke konkrétnímu dokumentu. Upraveno je odsazení; případné zděděné jmenné prostory jsou doplněny pro samostatné čtení výřezu.</p>
    {examples.map((example) => <Example key={example.id} example={example} />)}
  </section>;
}
