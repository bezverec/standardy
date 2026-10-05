<img src="docs/assets/standardy.svg" width="56" height="56" alt="Standardy — monogram S">

# Standardy digitalizace

Otevřený projekt pro dokumentaci a propojování standardů digitalizace kulturního dědictví. Pomáhá dohledat, **co standard požaduje, odkud požadavek pochází a jak jej zpracovávají konkrétní nástroje**.

Repozitář obsahuje dvě propojené části:

- **Odbornou dokumentaci** — návrhy, interpretace a doporučení publikované pomocí MkDocs.
- **Interaktivní registr pravidel** — verzovaná YAML data, vyhledávání, filtry, graf vztahů, veřejné JSON exporty a čtecí REST API.

Projekt není oficiálním vydáním standardů ani náhradou validačních nástrojů. Registr zatím pokrývá malou skupinu pravidel, nikoli celý standard NDK.

## Veřejný web a API

- [Dokumentace · standardy.digitalizaty.cz](https://standardy.digitalizaty.cz/)
- [Registr pravidel](https://standardy.digitalizaty.cz/registry/rules)
- [Zdrojové standardy](https://standardy.digitalizaty.cz/registry/standards) a [národní standardy](https://standardy.digitalizaty.cz/registry/national-standards)
- [Swagger UI — interaktivní dokumentace API](https://standardy.digitalizaty.cz/api-docs/)
- [OpenAPI 3.1 v JSON](https://standardy.digitalizaty.cz/openapi.json)

API pod `/api/v1/` je veřejné, bez přihlášení a pouze pro čtení. Například:

```bash
curl 'https://standardy.digitalizaty.cz/api/v1/rules?obligation=mandatory'
curl 'https://standardy.digitalizaty.cz/api/v1/rules?obligation_code=MA'
curl 'https://standardy.digitalizaty.cz/api/v1/rules/NDK-MONO-MIX-ICC-PROFILE-VERSION?version=2.3'
curl 'https://standardy.digitalizaty.cz/api/v1/meta'
```

Swagger umožňuje prohlédnout datové typy a vyzkoušet GET operace. Jeho tlačítko Execute odešle skutečný požadavek, ale obsah registru nemění. Swagger je hostován společně s webem bez závislosti na CDN nebo externím validátoru; kontrakt se validuje při sestavení a datové definice přebírá z JSON schémat registru.

## Co registr nabízí

- Vyhledávání bez diakritiky a filtry podle národního i zdrojového standardu, verze, typu dokumentu, kategorie, úrovně povinnosti, stavu požadavku a ověření.
- Sdílené odkazy s dotazem a filtry v URL; detail lze otevřít pro konkrétní verzi NDK.
- Oddělený požadavek standardu, interpretaci, původní prameny, známé rozpory a chování konkrétních verzí nástrojů.
- Interaktivní graf vztahů mezi pravidlem, národním standardem, prvky zdrojových standardů a implementacemi.
- Návrhy změn přes GitHub a odkazy na související diskuse.

### Jak číst pravidlo

| Údaj | Význam |
|---|---|
| Úroveň povinnosti (`obligation`) | Povinné, povinné pokud dostupné, doporučené, doporučené pokud dostupné, volitelné, zakázané nebo neurčeno podle citované verze standardu. Platí za podmínek uvedených u pravidla. |
| Původní kód NDK (`obligation_code`) | M, MA, R, RA nebo O doslova z pramene konkrétní verze pravidla. |
| Stav požadavku (`status`) | Zda je požadavek normativní, nejednoznačný, sporný, pracovní, historický nebo určený implementací. |
| Stav ověření (`verification.status`) | Stav ověření daného záznamu, nikoli výsledek validace souboru. |
| Verze NDK (`version`) | Verze národního standardu, ke které se záznam vztahuje. |

Úroveň povinnosti **není závažností validačního hlášení**. Pole `obligation` nahradilo původní `severity`; hodnoty `error`, `warning` a `info` se na povinnost automaticky nepřevádějí. Ověřený přepis může současně dokumentovat sporný požadavek. Chování nástroje není samo o sobě požadavkem standardu.

MA (`mandatory_if_available`) a RA (`recommended_if_available`) rozlišují dostupnost údaje, nikoli podmínku platnosti pravidla (`condition`). Podle [návrhu NDK #258](https://github.com/NLCR/Standard_NDK/issues/258) mají nové verze DMF postupně používat jen M, MA a R, s převodem RA/O na R. Historické záznamy ale zachovávají původní povinnost; registr změnu nepředjímá ani neprovádí automaticky. Podrobné mapování je v [datovém modelu](docs/development/registry-data-model.md#podmínky-a-validace).

„Počet pravidel“ počítá unikátní ID. Jedno pravidlo může mít více verzovaných záznamů, jejichž počet je uveden zvlášť; `pagination.total` v API počítá právě tyto záznamy. Verze kontraktu API, verze NDK a identita datasetu v [`/api/v1/meta`](https://standardy.digitalizaty.cz/api/v1/meta) jsou samostatné údaje, nikoli počty pravidel.

### Aktuální pokrytí: ICC v MIX

První zpracovaná skupina zahrnuje `iccProfileName`, `iccProfileVersion` a `iccProfileURI` podle DMF Monografie 2.3. Registr rozlišuje číselnou verzi v hlavičce ICC od sporného významu stejně pojmenovaného prvku MIX a dokumentuje mapování v konkrétních verzích JHOVE, jpylyzeru, ProArcu a validátoru.

Podrobnosti, zdroje a meze ověření jsou v [rozboru ICC](docs/development/icc-profile-version.md) a [detailu pravidla ICC profile version](https://standardy.digitalizaty.cz/registry/rules/NDK-MONO-MIX-ICC-PROFILE-VERSION?version=2.3). Související diskuse je v [NLCR/Standard_NDK #255](https://github.com/NLCR/Standard_NDK/issues/255); diskuse není normativním předpisem. NISO Z39.87 je evidován jako samostatný zdroj a jeho položky mají vlastní stav ověření.

## Data a architektura

Autoritativním zdrojem strukturovaných dat je **Git/YAML v [`registry/`](registry/)**. Cloudflare D1 je pouze odvozený index, který lze obnovit z repozitáře. Webové rozhraní data přímo do databáze nezapisuje.

| Adresář | Obsah |
|---|---|
| [`docs/`](docs/) | Odborné texty a vývojová dokumentace |
| [`registry/`](registry/) | Pravidla, standardy, vztahy a implementace v YAML |
| [`schemas/`](schemas/) | JSON schémata dat |
| [`packages/registry-core/`](packages/registry-core/) | Načítání, validace, porovnání a kompilace registru |
| [`worker/`](worker/) a [`migrations/`](migrations/) | Cloudflare Worker API a schéma D1 |
| [`web/`](web/) | React rozhraní registru a Swagger UI |
| [`scripts/`](scripts/) a [`tests/`](tests/) | Sestavení, importy a automatické kontroly |

Produkční web běží na Cloudflare Worker + Static Assets s D1. Sestavení skládá dokumentaci MkDocs, registr React/Vite, datové exporty a Swagger do adresáře `site/`.

## Lokální vývoj

Požadavky: Node.js 22 nebo novější, Python 3.12 nebo novější a balíčky z `requirements.txt`.

```bash
python -m pip install -r requirements.txt
npm ci
npm run registry:validate
npm run typecheck
npm test
npm run build
npm run registry:reset
npm run dev
```

`registry:reset` aplikuje migrace a nahradí odvozená data **v lokální D1** sestaveným YAML datasetem; zdrojové YAML soubory nemění. Po změně YAML nejprve spusťte `npm run build` a potom znovu import/reset.

- Vývojové rozhraní: `http://localhost:5173/registry/`
- Worker API: `http://localhost:8787/api/v1/`
- Sestavený web včetně Swaggeru: `http://localhost:8787/api-docs/`

Podrobnosti jsou v [návodu pro lokální vývoj](docs/development/local-development.md), [datovém modelu](docs/development/registry-data-model.md) a [architektuře](docs/development/architecture.md). CI kontroluje data, typy, testy a celé sestavení. Automatické nasazení na Cloudflare vyžaduje konfiguraci proměnných a secrets uvedených v [deployment workflow](.github/workflows/deploy-cloudflare.yml); samotný push bez této konfigurace produkci neaktualizuje.

## Jak přispět

Chyby a návrhy patří do [Issues](https://github.com/bezverec/standardy/issues). Tlačítko „Navrhnout změnu“ v registru otevře návrh; v detailu předvyplní ID pravidla, vybranou verzi NDK a odkaz. Návrh musí uživatel sám odeslat z účtu GitHub.

U odborných změn uveďte původní zdroj, verzi dokumentu a konkrétní stránku, oddíl nebo element. Oddělte citovaný požadavek od vlastní interpretace a od chování nástroje. Změny dat lze navrhnout také pull requestem do `registry/`; přiložte výsledek `npm run registry:validate` a `npm test`. Neupravujte pouze odvozenou databázi nebo generované exporty.

## Upozornění

Jedná se o osobní *passion project*. Informace mohou obsahovat nedostatky, někdy i zásadní; jako celek nejsou adoptované ani schválené paměťovými institucemi. Pro rozhodnutí o souladu s konkrétním standardem vždy zkontrolujte jeho původní znění a verzi.

Stav ověření čtěte u každého pravidla, pramene a implementace zvlášť. Registr není úplný katalog pravidel NDK ani hotový validační engine.

## Licence

<a href="https://github.com/bezverec/standardy">Standardy digitalizace</a> © 2026 by <a href="https://github.com/bezverec">Jan Houserek</a> is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">
