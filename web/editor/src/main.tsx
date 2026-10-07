import { StrictMode, Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const AuthenticatedEditor = lazy(() => import("./provider.tsx"));
function Bootstrap() {
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/editor/config", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Editor unavailable");
      const config = await response.json() as { publishableKey?: string };
      if (!config.publishableKey) throw new Error("Missing public configuration");
      if (!controller.signal.aborted) setKey(config.publishableKey);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);
  return <main><header><a href="/registry/">Standardy digitalizace</a><h1>Redakční editor</h1><p>Neveřejné koncepty · pracovní verze</p></header>
    {error ? <section role="alert" className="notice"><h2>Editor není dostupný</h2><p>Přihlášení nebo soukromé úložiště není nakonfigurované. Přístup zůstává uzavřený.</p><a href="/registry/">Otevřít veřejný registr</a></section> : key ? <Suspense fallback={<p role="status">Načítám přihlášení…</p>}><AuthenticatedEditor publishableKey={key} /></Suspense> : <p role="status">Ověřuji dostupnost editoru…</p>}
  </main>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><Bootstrap /></StrictMode>);
