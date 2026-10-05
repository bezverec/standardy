import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RegistryNavigation } from "../web/registry/src/RegistryNavigation.tsx";

const render = (path: string) => renderToStaticMarkup(createElement(RegistryNavigation, { path, onNavigate: () => {} }));

describe("registry home and navigation", () => {
  it.each(["/", "/map", "/map/"])("links home and marks the map active at %s", (path) => {
    const html = render(path);
    expect(html).toContain('href="/registry/" class="active" aria-current="page">Mapa registru');
    expect(html).toContain('aria-label="Pravidla a standardy – domovská mapa registru"');
    expect(html).not.toContain('href="/registry/map"');
  });

  it("starts with an accessible collapsed mobile menu and retains all destinations", () => {
    const html = render("/rules/example");
    expect(html).toContain('aria-expanded="false" aria-controls="registry-navigation"');
    expect(html).toContain('id="registry-navigation"');
    expect(html).toContain('href="/registry/rules" class="active" aria-current="page">Pravidla');
    expect(html).toContain('href="/registry/standards"');
    expect(html).toContain('href="/registry/national-standards"');
    expect(html).toContain('href="/api-docs/"');
  });
});
