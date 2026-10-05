# Kontrola závislostí — 2026-10-05

## Shrnutí a rozsah

Kontrola požadovaných hlášení GitHub Dependabot a celého npm dependency tree.
Nejde o penetrační test ani úplný audit aplikace či Cloudflare účtu.
Po opravách `npm audit --json` nehlásí žádné známé zranitelnosti (včetně devDependencies).
Závažnost níže přebíráme z advisories; přítomnost balíčku sama nepotvrzuje zneužitelnost aplikace.

## Vysoká závažnost

### 1. Undici v nástrojích Cloudflare — opraveno

- Původní řetězec: Wrangler 4.131.2 → Miniflare → Undici 7.29.0.
- Dopad: mimo jiné obejití vlastní TLS kontroly v `BalancedPool` a DoS při WebSocket komunikaci za podmínek popsaných autory.
- Oprava: Wrangler 4.147.0 → Miniflare 5.20261001.0-alpha → Undici 7.29.1. Typy Workers aktualizovány podle peer dependency Wrangleru.
- Umístění opravy: `package.json:38`, `package.json:47`, `package-lock.json:3364`.
- Jde o vývojové/nasazovací nástroje, nikoli implementaci HTTP klienta produkčního Workeru. V aplikačním kódu nebylo nalezeno přímé použití `BalancedPool`.
- Druhá kopie Undici 8.11.2 v parseru OpenAPI již byla mimo zranitelné rozsahy.
- [TLS advisory](https://github.com/nodejs/undici/security/advisories/GHSA-w293-vg96-wgc3), [WebSocket advisory](https://github.com/nodejs/undici/security/advisories/GHSA-rfgv-xxqx-mfg5).
- Aktualizace řeší také související hlášení střední/nízké závažnosti: GHSA-3wwx-pv8p-q78v, GHSA-pmjh-fq2x-6v4x, GHSA-r53p-7pc4-xj5r, GHSA-3xpg-4rpp-hhhm, GHSA-2jfj-6hjv-fm6j, GHSA-2gqq-gqf2-x968, GHSA-8436-99hf-9mmv a GHSA-rx4f-c7p8-82vq.

## Střední závažnost

### 2. Vitest / @vitest/mocker — opraveno

- Původní verze 3.2.7; opraveno přechodem na 4.1.11, včetně `@vitest/mocker`.
- Dopad: čtení souborů mimo povolené cesty přes redirect mock u dosažitelného vývojového serveru za podmínek advisory.
- Repo používá `vitest run`, nikoli veřejně vystavený mocker server; produkční web Vitest nespouští. Řada 3 opravu nedostane.
- Umístění: `package.json:46`, `package-lock.json:2160`, `package-lock.json:3495`.
- [Advisory a podmínky zneužití](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9).

### 3. fast-uri — opraveno

- Tranzitivní závislost Ajv: 3.1.7 → 3.1.8, bez vynuceného override.
- Dopad: nekonzistentní normalizace velikosti písmen hostitele může obejít case-sensitive kontrolu hostů u aplikací, které se na tuto normalizaci spoléhají.
- Aplikace nepoužívá `fast-uri` přímo pro autorizaci cílových hostů; přítomnost v Ajv opravujeme aktualizací lockfilu.
- Umístění: `package-lock.json:2685`.
- [Advisory](https://github.com/fastify/fast-uri/security/advisories/GHSA-hrr3-gc8f-f4qj).

## Ověření a další provoz

- TypeScript: úspěch.
- Vitest 4.1.11: 59 testů / 13 souborů, úspěch. První pokus v omezeném Windows sandboxu zablokovala oprávnění k přejmenování dočasné cache; opakování mimo sandbox prošlo.
- Kompletní build registru, MkDocs, React a OpenAPI: úspěch.
- npm audit včetně vývojových závislostí: 0 nálezů k datu kontroly.
- CI nadále používá `npm ci` a verzovaný lockfile. Zachovat sledování Dependabotu; nulový výsledek dnes není záruka absence budoucích zranitelností.
