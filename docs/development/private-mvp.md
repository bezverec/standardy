# Soukromé MVP databáze NDK

Soukromá aplikace používá existující registry compiler a stejné YAML záznamy jako Cloudflare Worker/D1 varianta. Pro malé read-only MVP se při sestavení vytvoří neměnný JSON snapshot. React nad ním provádí hledání a filtrování; databáze je trvale verzována v Git, nikoliv uložena jen v prohlížeči. D1 migrace ani veřejné API se pro toto soukromé nasazení nespouštějí.

Hosting je realizován službou Sites nad Cloudflare. Přístup ověřuje platforma před vydáním HTML, skriptů i datového souboru. Nový web je pouze pro vlastníka. Text „Soukromý web“ ani `noindex` nejsou bezpečnostní opatření; soukromí zajišťuje politika platformy. Pro případné samostatné nasazení na vlastním Cloudflare účtu je nutné před publikováním obdobně ochránit **všechny** cesty pomocí Cloudflare Access, včetně dat a dalších hostname. Prostý upload do veřejného Pages by tento požadavek nesplnil.

## Vývoj a sestavení

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build:private
```

`npm run dev` připraví snapshot a spustí samostatnou Vite aplikaci. `npm run dev:full` zachovává původní vývojový tok React + Worker/D1. Původní `npm run build` a `npm run deploy` patří dosavadnímu Cloudflare nasazení, **nejsou příkazy pro soukromé publikování**.

Soukromý build je v `dist/client/`, logický hostingový manifest v `.openai/hosting.json`. `web/registry/vite.private.config.ts` zapíná snapshot adaptér a hashové URL. Detaily i nastavené filtry lze otevřít přímým odkazem a obnovit bez serverového SPA routeru. Žádné tokeny ani přístupové údaje se do výstupu nezapisují.

## Pokrytí první verze

- 3 verzovaná pravidla ICC profilu v DMF Monografie 2.3;
- zdrojové standardy MIX 2.0, ICC.1:2022 a NISO Z39.87 R2017;
- přímé citace, lokátory a datum/stav ověření;
- obousměrné procházení pravidel a standardů, klikací graf, související pravidla;
- hledání bez diakritiky, více slov a kombinace filtrů;
- oddělený požadavek, interpretace, návrh kontroly a neověřené implementace.

Nové položky NISO přebírají lokátory z existujících YAML pravidel. Samotná identita standardu byla ověřena u NISO, jednotlivé nově evidované položky jsou označeny jako neověřené. Nepředstavují nový odborně ověřený přepis definic.

## Doplňování

1. Pro nový zahraniční zdroj přidejte `registry/standards/<id>/<id>.yaml`; každému prvku přiřaďte stabilní ID, verzi a přesný zdroj.
2. Pro nový profil NDK přidejte `registry/national-standards/<id>/national-standard.yaml` s konkrétními verzemi.
3. Pravidlo přidejte do `registry/rules/ndk/<typ-dokumentu>/`. Uveďte národní standard, cílový prvek, skutečnou povinnost a podmínky, zdroj, references a stav ověření. Interpretaci udržujte v samostatném poli.
4. Vazby na další zdrojové prvky deklarujte v `relations`. Druh `related_to` znamená souvislost; není důkazem normativního odvození. Compiler doplní `defined_by` pro jednotlivé prvky.
5. Ověřte `npm run registry:validate`, `npm run typecheck` a `npm test`; neexistující cíle vazeb zastaví build.
6. Sestavte a soukromě nasaďte novou verzi. Snapshot se při každém buildu vytváří z aktuálních YAML dat. Nedoplňuje se ručně.

Verze pravidel zůstávají položkami jednoho záznamu. Přepis není kompletním standardem ani oficiální metodikou NK ČR. Při růstu dat lze použít existující D1 index a REST API, aniž by se měnil zdrojový datový model.

## Oddělení od veřejného nasazení

Soukromé MVP se připravuje na samostatné větvi. Push do `main` by mohl spustit existující workflow pro veřejný Cloudflare web nebo GitHub Pages. Soukromé publikování přes Sites tato workflow nespouští. Bez výslovného pokynu se změna do `main` neslučuje a politika přístupu se nezveřejňuje.

## Ověření

V prohlížeči byly ověřeny hledání bez diakritiky, kombinované filtry, prázdný výsledek a jeho reset, zachování filtru po obnovení, detail pravidla, související pravidla a návrat od ICC ke konkrétnímu pravidlu. Prohlížeč použitý k QA neexponoval volitelný WebMCP nástroj; jeho vstupní kontrakt a validace jsou pokryty testem, hlavní UI na této schopnosti nezávisí.
