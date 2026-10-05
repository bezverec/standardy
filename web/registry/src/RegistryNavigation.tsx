import { useState, type MouseEvent } from "react";
import standardyMark from "../../../docs/assets/standardy.svg";

export function RegistryNavigation({ path, onNavigate }: {
  path: string; onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  function follow(event: MouseEvent<HTMLAnchorElement>) {
    onNavigate(event);
    if (event.defaultPrevented) setOpen(false);
  }
  const links = [
    { href: "/registry/", title: "Mapa registru", active: path === "/" || path === "/map" || path === "/map/" },
    { href: "/registry/rules", title: "Pravidla", active: path.startsWith("/rules") },
    { href: "/registry/standards", title: "Zdrojové standardy", active: path.startsWith("/standards") },
    { href: "/registry/national-standards", title: "Standardy NDK", active: path.startsWith("/national-standards") },
  ];
  return <header className="topbar">
    <a href="/registry/" onClick={follow} className="brand" aria-label="Pravidla a standardy – domovská mapa registru"><img src={standardyMark} width="44" height="44" alt="" /><span>Pravidla &amp; standardy<small>Standardy digitalizace</small></span></a>
    <button className="mobile-menu-toggle" aria-expanded={open} aria-controls="registry-navigation" onClick={() => setOpen((value) => !value)}>{open ? "Zavřít menu" : "Menu"}</button>
    <nav id="registry-navigation" className={open ? "navigation--open" : ""} aria-label="Hlavní navigace" onKeyDown={(event) => {
      if (event.key === "Escape") { setOpen(false); event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(".mobile-menu-toggle")?.focus(); }
    }}>
      {links.map((link) => <a key={link.href} href={link.href} onClick={follow} className={link.active ? "active" : ""} aria-current={link.active ? "page" : undefined}>{link.title}</a>)}
      <a href="/api-docs/">API / dokumentace</a>
    </nav>
  </header>;
}
