import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { compareRuleContexts, compileRegistry, loadRegistry } from "../packages/registry-core/src/index.ts";
import { ComparisonResults, PeriodicalComparisonLink } from "../web/registry/src/ComparisonPage.tsx";
import { comparisonChoiceError, comparisonParams, comparisonValue, initialComparison, type ComparisonResult } from "../web/registry/src/comparison.ts";
import { api, type RegistryEntity } from "../web/registry/src/api.ts";
import { RegistryNavigation } from "../web/registry/src/RegistryNavigation.tsx";

const registry = compileRegistry(await loadRegistry(path.resolve(import.meta.dirname, "..")));
const standards = JSON.parse(JSON.stringify(registry.national_standards)) as RegistryEntity[];
const result = JSON.parse(JSON.stringify(compareRuleContexts(registry.rule_versions,
  { national_standard: "ndk-monograph", version: "2.3", cataloguing_rules: "aacr2" },
  { national_standard: "ndk-monograph", version: "2.3", cataloguing_rules: "rda" }))) as ComparisonResult;
const render = (data = result) => renderToStaticMarkup(createElement(ComparisonResults, { result: data }));

describe("comparison screen", () => {
  it("shows matching cross-DMF requirements and keeps document scope separate", () => {
    const data = JSON.parse(JSON.stringify(compareRuleContexts(registry.rule_versions,
      { national_standard: "ndk-monograph", version: "2.3" },
      { national_standard: "ndk-periodical", version: "2.2" }))) as ComparisonResult;
    data.comparisons = data.comparisons.filter((item) => item.key.startsWith("mix.mc-ps."));
    const html = render(data);
    expect(html).toContain("Shodný požadavek (18)");
    expect(html).toContain("Odlišný kontext (0)");
    expect(html).toContain("Rozdílný rozsah dokumentů");
    expect(html).toContain("monograph");
    expect(html).toContain("periodical");
    expect(html).not.toContain("Rozdíly zaznamenaných polí");
    expect(html).toContain("DMF Monografie · verze 2.3");
    expect(html).toContain("DMF Periodika · verze 2.2");
    data.comparisons[0]!.scope_changes[0]!.new = "<script>scope</script>";
    expect(render(data)).not.toContain("<script>");
    expect(render(data)).toContain("&lt;script&gt;scope");
  });
  it("offers the real cross-DMF comparison without imposing a cataloguing regime", () => {
    const html = renderToStaticMarkup(createElement(PeriodicalComparisonLink, { standards }));
    expect(html).toContain("Porovnat Monografie 2.3 a Periodika 2.2");
    const href = html.match(/href="([^"]+)"/)![1]!.replaceAll("&amp;", "&");
    const choices = initialComparison(href.split("?")[1]!, standards);
    expect(choices).toEqual([
      { national_standard: "ndk-monograph", version: "2.3", cataloguing: "" },
      { national_standard: "ndk-periodical", version: "2.2", cataloguing: "" },
    ]);
    expect(renderToStaticMarkup(createElement(PeriodicalComparisonLink, { standards: standards.filter((item) => item.id !== "ndk-periodical") }))).toBe("");
    expect(render()).toContain("Proč jsou pravidla porovnávána");
    const data = structuredClone(result);
    data.comparisons[0]!.left[0]!.comparison!.note.cs = "<script>unsafe</script>";
    expect(render(data)).not.toContain("<script>");
    expect(render(data)).toContain("&lt;script&gt;unsafe");
  });
  it("selects an evidenced AACR2/RDA example by default and round-trips share links", () => {
    const selections = initialComparison("", standards);
    expect(selections.map((item) => item.cataloguing)).toEqual(["aacr2", "rda"]);
    expect(selections.every((item) => !comparisonChoiceError(item, standards))).toBe(true);
    expect(initialComparison(comparisonParams(...selections).toString(), standards)).toEqual(selections);
    selections[0].cataloguing = "";
    expect(initialComparison(comparisonParams(...selections).toString(), standards)).toEqual(selections);
  });
  it("keeps malformed shared selections visible instead of silently substituting defaults", () => {
    const [left, right] = initialComparison("national_standard_a=unknown&version_a=9&cataloguing_a=aacr", standards);
    expect(left).toEqual({ national_standard: "unknown", version: "9", cataloguing: "aacr" });
    expect(right.version).toBe("");
    expect(comparisonChoiceError(left, standards)).toContain("existující");
    expect(comparisonChoiceError({ ...left, national_standard: "ndk-monograph" }, standards)).toContain("verzi");
    expect(comparisonChoiceError({ ...left, national_standard: "ndk-monograph", version: "2.3" }, standards)).toContain("AACR2");
    expect(comparisonChoiceError(initialComparison("", [])[0], [])).toBeDefined();
  });
  it("displays both requirements, versioned links, sources, changes and incomplete coverage without declaring an error", () => {
    const html = render();
    expect(html).toContain("Odlišný kontext");
    expect(html).toContain("Rozdílný kontext sám nepotvrzuje chybu");
    expect(html).toContain("Nepoužití je výklad omezení zdroje");
    expect(html).toContain("NDK-MONO-MODS-SINGLE-ORIGIN-AACR-NO-EVENT-TYPE?version=2.3");
    expect(html).toContain("DMF Monografie · verze 2.3 · s. 51–52");
    expect(html).toContain("Katalogizační rozsah dosud neurčen — A: 0, B: 0");
    expect(html).toContain("Nezávislé požadavky zahrnuté ve výběru — A: 186, B: 186");
    expect(html).toContain("Zahrnutá pravidla bez významového klíče — A: 230, B: 236");
    expect(html).toContain("Rozdíly zaznamenaných polí");
    // Hundreds of unpaired records are not mounted until their disclosure opens.
    expect(html).not.toContain("NDK-MONO-MIX-ICC-PROFILE-VERSION?version=2.3");
  });
  it("explains missing and ambiguous matches rather than showing an empty or arbitrarily chosen side", () => {
    const data = structuredClone(result);
    data.comparisons[0]!.right = [];
    data.comparisons[0]!.status = "no_counterpart";
    expect(render(data)).toContain("Protějšek v tomto výběru nenalezen");
    data.comparisons[0]!.status = "ambiguous_mapping";
    expect(render(data)).toContain("žádný kandidát nebyl automaticky vybrán");
    data.comparisons = [];
    expect(render(data)).toContain("Nejde o shodu standardů");
  });
  it("escapes source text and does not link unsafe source URLs", () => {
    const data = structuredClone(result);
    data.comparisons[0]!.left[0]!.source.url = "javascript:alert(1)";
    data.comparisons[0]!.left[0]!.normative_requirement.cs = "<script>alert(1)</script>";
    const html = render(data);
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(comparisonValue(undefined)).toBe("Neuvedeno");
    expect(comparisonValue(false)).toBe("false");
    expect(comparisonValue(0)).toBe("0");
  });
  it("marks the new navigation item as the current page", () => {
    const html = renderToStaticMarkup(createElement(RegistryNavigation, { path: "/compare", onNavigate: () => {} }));
    expect(html).toContain('href="/registry/compare" class="active" aria-current="page">Porovnání');
  });
  it("passes an abort signal through the comparison API client and reports failed responses", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(result)));
    vi.stubGlobal("fetch", fetcher);
    try {
      expect(await api.compare("version_a=2.3", controller.signal)).toEqual(result);
      expect(fetcher).toHaveBeenCalledWith("/api/v1/compare/contexts?version_a=2.3", expect.objectContaining({ signal: controller.signal }));
      fetcher.mockResolvedValue(new Response(JSON.stringify({ error: "comparison_standard_version_not_found" }), { status: 404 }));
      await expect(api.compare("version_a=missing")).rejects.toThrow("comparison_standard_version_not_found");
    } finally { vi.unstubAllGlobals(); }
  });
});
