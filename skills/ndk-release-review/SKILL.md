---
name: ndk-release-review
description: Posuzuje připravenost změn registru bezverec/standardy k odbornému schválení a publikaci. Kontroluje diff, prameny, testy a shodu artefaktů; samotné posouzení neprovádí push, merge ani nasazení.
---

# Kontrola před publikací

Přečti [architekturu](../../docs/development/architecture.md), [lokální vývoj a nasazení](../../docs/development/local-development.md) a rozlišení současných funkcí od [navrženého redakčního postupu](../../docs/development/editorial-workflow.md). Příkazy se spouštějí z kořene checkoutu. Rozlišuj revizi, odborné schválení, commit, zveřejnění PR a produkční deployment; požadavek na jednu činnost neopravňuje automaticky ke všem ostatním.

## Posouzení změny

- Zjisti základ porovnání, aktuální commit a pracovní strom. Nezahrnuj nesouvisející úpravy, stažené SIP/PDF, tokeny ani lokální konfiguraci do návrhu. Chybějící pramen nebo skutečné provedení testu neoznačuj jako ověřené.
- Prohlédni význam změn: správná verze DMF, povinnosti a rozsah, provenance, oddělení výkladu/implementace, XML původ, relace a párování. Ověřený přepis není odborné schválení výkladu. Automatická kontrola nemůže sama dát redakční souhlas za člověka.
- Spusť `npm run registry:validate`, `npm run typecheck`, `npm test -- --maxWorkers=2`, `npm run build` a `git diff --check`. Úplný build obnovuje lokální `site/` a `dist/`; není čistě read-only. Pokud uživatel zakázal lokální zápisy, build vynech a omezení uveď.
- U změněných skutečných příkladů dolož srovnání s příslušným zdrojem; pokud zdroj není dostupný, uveď pouze výsledek syntaktické kontroly. V náhledu/API zkontroluj změněné pravidlo, kategorii, porovnání a dokumentaci podle dopadu změny.
- Report obsahuje provedené příkazy a výsledky, blokující nálezy s cestami, neověřené oblasti a přesnou revizi. `Připraveno` není `nasazeno`. Skills a dnešní CI nevynucují budoucí redakční role ani schvalovací brány.

## Když je nasazení skutečně zadáno

Tato skill primárně připravuje kontrolní zprávu. Při navazujícím výslovném zadání k nasazení postupuj podle aktuálního deployment návodu, nikoli starých ID z chatu. Ověř konkrétní Worker, doménu, databázi a prostředí; před nahrazením odvozené D1 zaznamenej obnovovací bod. Po commitu sestav znovu, protože identita datasetu vychází z Git SHA. Importní skript může použít starý existující `dist/registry/import.sql`; `npm run deploy` sám D1 neimportuje.

Při chybě zastav další mutace, zjisti skutečný vzdálený stav a nepokračuj slepým opakováním importu nebo návratem databáze. Obnova má odpovídat schválenému cíli a nesmí přepsat mezitím cizí změny. Po úspěchu ověř SHA v API i statickém exportu, počty a konkrétní změněný záznam, dokumentaci a nasazení Workeru. GitHub Pages, Cloudflare workflow a ruční nasazení nejsou totéž. Nikdy nevypisuj autentizační tokeny ani neměň oprávnění jako vedlejší krok revize.
