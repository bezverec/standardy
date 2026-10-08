<img src="docs/assets/standardy.svg" width="56" height="56" alt="Standardy — monogram S">

# Standardy digitalizace

Otevřený projekt pro dokumentaci a propojování standardů digitalizace kulturního dědictví. Pomáhá dohledat, **co standard požaduje, odkud požadavek pochází a jak jej zpracovávají konkrétní nástroje**.

Repozitář obsahuje dvě propojené části:

- **Odbornou dokumentaci** — návrhy, interpretace a doporučení publikované pomocí MkDocs.
- **Interaktivní registr pravidel** — verzovaná YAML data, vyhledávání, filtry, graf vztahů, veřejné JSON exporty a čtecí REST API.

Projekt není oficiálním vydáním standardů ani náhradou validačních nástrojů. Registr zatím pokrývá malou skupinu pravidel, nikoli celý standard NDK.

## Veřejný web a API

Registr nabízí [porovnávací obrazovku](https://standardy.digitalizaty.cz/registry/compare) pro dvě DMF/verze a AACR2/RDA, se sdílitelným výběrem, filtry a požadavky i prameny vedle sebe. Využívá `/api/v1/compare/contexts` (také ve Swaggeru). Páruje explicitní významové klíče a nezaměňuje chybějící záznam za zákaz či absenci požadavku. Vedle `originInfo/@eventType` je ručně propojeno 18 dvojic MIX pro Monografie 2.3 a Periodika 2.2. [Audit všech 263 pravidel](docs/development/cataloguing-scope-audit.md) rozlišuje nezávislé požadavky, společné bibliografické předpisy a konkrétní rozsah AACR2/RDA; nezávislé požadavky zůstávají ve výběru pro oba režimy. Další významové párování je samostatný krok. [Datový model a meze porovnání](docs/development/registry-data-model.md).

- [Dokumentace · standardy.digitalizaty.cz](https://standardy.digitalizaty.cz/)
- [Registr pravidel – domovská mapa](https://standardy.digitalizaty.cz/registry/)
- [Mapa registru podle oblastí metadat](https://standardy.digitalizaty.cz/registry/map)
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

- Vyhledávání bez diakritiky a filtry podle oblasti metadat, metadatového i národního standardu, citovaných zdrojů, verze, typu dokumentu, tématu pravidla, úrovně povinnosti, stavu požadavku a ověření.
- Sdílené odkazy s dotazem a filtry v URL; detail lze otevřít pro konkrétní verzi NDK.
- Oddělený požadavek standardu, interpretaci, původní prameny, známé rozpory a chování konkrétních verzí nástrojů.
- Mapu registru s tematickými dlaždicemi, počty pravidel a verzovaných záznamů, rozložením povinností a přechodem do filtrovaného seznamu.
- Sloupcový graf, radiální síť s nastavitelným pořadím vrstev a tabulku vazeb. Sdílejí filtry vztahů i kategorií; graf nabízí zvýraznění sousedů, přiblížení, posun a celou obrazovku. Uspořádání se pamatuje v prohlížeči; viz [kategorie a graf vztahů](docs/development/graph-and-categories.md).
- Návrhy změn přes GitHub a odkazy na související diskuse.
- [230 XML ukázek ze vzorových SIP](docs/development/xml-examples.md) u 184 pravidel, s kopírováním, XPath a otiskem zdrojového souboru. Jde o doložené výřezy, nikoli univerzální šablony nebo potvrzení validity balíčku; některé výslovně dokládají nesoulad se standardem.

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

### Zpracované skupiny: MIX, info.xml, METS, MODS a PREMIS

Předchozí sada [copyright, vznik a vydávání MODS](docs/development/mods-origin-completion.md) přidává pět pravidel: copyrightDate, samostatné omezení RDA, dateCreated, edition a issuance. Obsahuje doložený XML výřez issuance a výslovně eviduje nejasnosti DMF.

Navazující sada [jazykových údajů MODS](docs/development/mods-language.md) přidává pět pravidel a čtyři XML ukázky: language, objectPart, languageTerm a atributy type/authority. Rozlišuje jazyk obsahu od katalogizace, opakování jazyků od termínů, bibliografické kódy B od T a význam translation podle MARC 041$h.

Registr obsahuje **263 pravidel: 245 pro DMF Monografie 2.3 a 18 pro DMF Periodika 2.2**. [První porovnávací sada periodik](docs/development/periodical-mix-comparison.md) pokrývá rozměry, vzorkování a barevné kódování MIX pro MC/PS, s vlastními prameny a vysvětleným párováním. Nejde o elektronická periodika. Monografická část zahrnuje: 21 pro MIX, 18 pro `info.xml`, 77 pro hlavní METS (14 soubory a vazby, 12 kořen a hlavička, 12 fyzická mapa, 10 logická mapa a výčet stran, 13 vnitřní části, 8 blokové vazby ALTO, 8 obálky MODS/DC), osm pro vedlejší METS, 60 pro MODS (osm názvové údaje, devět původci a role, devět podrobnosti jmen, čtyři typ dokumentu a žánr, osm původ a místa vydání, pět nakladatelé a výrobci, sedm data vydání a dalších událostí, pět copyright, vznik a vydávání a pět jazykové údaje) a 61 pro PREMIS (38 Object, 16 Event a sedm Agent). [Obrazová metadata MIX](docs/development/mix-image-characteristics.md) zahrnují MC a PS, včetně podmíněné povinnosti MA u frekvencí X/Y. [Skupina info.xml](docs/development/info-xml.md) popisuje údaje o SIP, identifikátory, seznam souborů a MD5 odkaz; zachovává původní kódy povinností a rozdíly DMF/XSD 1.1. [Hlavní METS](docs/development/mets-files.md) pokrývá fileSec, skupiny, atributy souborů, FLocat a fyzické odkazy FILEID. [Kořen a hlavička METS](docs/development/mets-header.md) přidávají 12 pravidel včetně obou rolí organizací a doložené vady schemaLocation ve vzoru. [Fyzická mapa](docs/development/mets-physical.md) doplňuje 12 pravidel pro stránky, pořadí, paginaci a vazby na metadata; číselník typů stran vychází z Pravidel pro popis 2.4. [Logická mapa a výčet stran](docs/development/mets-logical.md) přidávají deset pravidel, včetně varianty bez kapitol a podmínky vícesvazkového titulu. [Vnitřní části monografie](docs/development/mets-internal-parts.md) přidávají 13 pravidel pro kapitoly, obrazy a jejich stránky, včetně doložené nejednoznačnosti TYPE kapitoly. [Blokové vazby METS–ALTO](docs/development/mets-alto-links.md) přidávají osm pravidel pro fptr/area a rozlišení souborových a blokových identifikátorů. [Obálky MODS/DC](docs/development/mets-dmd.md) doplňují osm pravidel pro dmdSec, identifikátory, mdWrap a xmlData, včetně povinné verze MODS a vynechání verze DC. [Názvové údaje MODS](docs/development/mods-titles.md) přidávají osm pravidel pro jednosvazkovou monografii, včetně M/MA/O, hlavního názvu bez type a zachování významových mezer v nonSort. [Původci a role v MODS](docs/development/mods-names.md) přidávají devět pravidel pro explicitně pojmenované původce, autoritní identifikátor a kódované role ze slovníku marcrelator. [Podrobnosti jmen MODS](docs/development/mods-name-details.md) rozlišují MA/RA u částí osobních jmen, volitelné alternativní jméno s povinným obsahem a samostatné etal. [Typ dokumentu a žánr MODS](docs/development/mods-resource-genre.md) rozlišují doporučený typeOfResource, povinný strukturální genre a další doporučené bibliografické žánry a jejich autoritu. [Původ a místa vydání MODS](docs/development/mods-origin.md) přidávají osm pravidel pro originInfo, rozdíly AACR/RDA a místní údaje z MARC 260/264 a 008. [Nakladatelé a výrobci MODS](docs/development/mods-origin-agents.md) doplňují pět pravidel pro agent a jeho jméno a role, včetně výjimky copyright a doložené nejasnosti zápisu distibutor. [Data vydání a dalších událostí MODS](docs/development/mods-origin-dates.md) přidávají sedm pravidel pro dateIssued, jeho atributy a dateOther; rozlišují datum vydání, skutečné rozmezí a datum jiné události. [Vedlejší METS](docs/development/mets-amd.md) doplňuje inventář stránky, sémantické vazby ADMID a fyzickou mapu, včetně doložených nesouladů vzorového SIP. Požadavky DMF jsou oddělené od obecného METS 1.9.1 a slovní povinnosti nemají domyšlený kód M. [PREMIS Object](docs/development/premis-object.md) přidává identifikaci, charakteristiky, fixity, velikost a formát souboru; odděluje PREMIS 2.2 od výslovné povinnosti M v DMF. [Vznik a ochrana souboru](docs/development/premis-provenance.md) doplňují osm pravidel s povinnostmi M/R a doložené původní názvy odlišné od současného pojmenování v SIP. [Vazby objektů a událostí](docs/development/premis-relationships.md) přidávají 13 pravidel pro MC/ALTO a přímé odkazy PS, včetně odlišení požadavků od skutečných vazeb ve vzoru. [PREMIS Event](docs/development/premis-events.md) doplňuje 16 pravidel pro evidenci událostí, čas, výsledky a vazby na původce a objekty, s 23 zdrojovými XML výřezy. [PREMIS Agent](docs/development/premis-agents.md) přidává sedm pravidel pro původce, kontext SIP/AIP a podmíněnou poznámku s příkazem výroby JPEG 2000. Implementace nástrojů pro tyto nové skupiny zatím ověřeny nebyly. Nová [sada základních údajů MIX](docs/development/mix-basic-information.md) přidává osm pravidel pro každý DMF a sedm monografických i sedm periodických XML ukázek.

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

Pro práci agentů slouží [projektový rozcestník](AGENTS.md) a čtyři [verzované skills](docs/development/agent-skills.md). [MVP neveřejného editoru](docs/development/editor-mvp.md) na `/editor/` nabízí přihlášení Clerk pouze na pozvání, explicitní členství, soukromé koncepty, validaci a diff. Bez úplné konfigurace je uzavřený. [Redakční postup](docs/development/editorial-workflow.md) rozlišuje tuto první implementaci od budoucího schvalování a publikace přes PR. Veřejný registr a jeho read-only API zůstávají oddělené.

Chyby a návrhy patří do [Issues](https://github.com/bezverec/standardy/issues). Tlačítko „Navrhnout změnu“ v registru otevře návrh; v detailu předvyplní ID pravidla, vybranou verzi NDK a odkaz. Návrh musí uživatel sám odeslat z účtu GitHub.

U odborných změn uveďte původní zdroj, verzi dokumentu a konkrétní stránku, oddíl nebo element. Oddělte citovaný požadavek od vlastní interpretace a od chování nástroje. Změny dat lze navrhnout také pull requestem do `registry/`; přiložte výsledek `npm run registry:validate` a `npm test`. Neupravujte pouze odvozenou databázi nebo generované exporty.

## Upozornění

Jedná se o osobní *passion project*. Informace mohou obsahovat nedostatky, někdy i zásadní; jako celek nejsou adoptované ani schválené paměťovými institucemi. Pro rozhodnutí o souladu s konkrétním standardem vždy zkontrolujte jeho původní znění a verzi.

Stav ověření čtěte u každého pravidla, pramene a implementace zvlášť. Registr není úplný katalog pravidel NDK ani hotový validační engine.

## Licence

<a href="https://github.com/bezverec/standardy">Standardy digitalizace</a> © 2026 by <a href="https://github.com/bezverec">Jan Houserek</a> is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">
