# Vývoj registru pravidel

Registr propojuje požadavky národních standardů s původními specifikacemi, interpretacemi a doloženým chováním nástrojů. Tato sekce popisuje jeho současné pokrytí, datový model, API a postupy pro přispěvatele a vývojáře.

[Otevřít registr – domovskou mapu](https://standardy.digitalizaty.cz/registry/){ .md-button }
[Swagger / API](https://standardy.digitalizaty.cz/api-docs/){ .md-button }

## Současný stav

K 8. 10. 2026 registr obsahuje **263 pravidel: 245 pro DMF Monografie 2.3 a 18 pro DMF Periodika 2.2**. [První porovnávací sada periodik](periodical-mix-comparison.md) propojuje deset technických požadavků MIX se samostatně ověřenými monografickými protějšky. Monografická část zahrnuje: 21 pro technická metadata MIX pro MC a PS, 18 pro obsah info.xml, 77 pro hlavní METS (14 pro soubory a vazby, 12 pro kořen a hlavičku, 12 pro fyzickou mapu, 10 pro logickou mapu a výčet stran, 13 pro vnitřní části, 8 pro blokové vazby ALTO, 8 pro obálky MODS/DC), osm pro vedlejší METS, 60 pro MODS jednosvazkové monografie (osm názvové údaje, devět původci a role, devět podrobnosti jmen, čtyři typ dokumentu a žánr, osm původ a místa vydání, pět nakladatelé a výrobci, sedm data vydání a dalších událostí, pět copyright, vznik a vydávání a pět jazykové údaje) a 61 pro PREMIS (38 Object, 16 Event a sedm Agent). Nejde o úplné pokrytí monografií ani o hotový validační engine. Nová [sada základních údajů MIX](mix-basic-information.md) přidává osm pravidel pro každý DMF a sedm monografických i sedm periodických XML ukázek.

| Skupina | Počet pravidel | Obsah a podklady |
|---|---:|---|
| ICC | 3 | Jméno, verze a URI profilu; [rozbor sporného významu verze a mapování nástrojů](icc-profile-version.md) |
| Rozměry obrazu | 2 | Šířka a výška v pixelech |
| Vzorkování | 4 | Referenční rovina, jednotka a frekvence X/Y |
| Barevné kódování | 4 | Barevný prostor, počet bitů na vzorek, jejich jednotka a počet složek pixelu |
| info.xml | 18 | [Informace o SIP, identifikátory, seznam souborů a checksum](info-xml.md); včetně rozdílů DMF a XSD 1.1 |
| METS – soubory a vazby | 14 | [fileSec, skupiny, atributy souborů, FLocat a fyzické odkazy FILEID](mets-files.md); oddělení DMF 2.3 od METS 1.9.1 |
| METS – kořen a hlavička | 12 | [Kořen, data záznamu a organizace](mets-header.md); role CREATOR/ARCHIVIST a odkazy na schémata |
| METS – fyzická mapa | 12 | [Stránky, typy, pořadí, paginace a vazby](mets-physical.md); včetně číselníku PPM 2.4 |
| METS – logická mapa | 10 | [Varianta bez kapitol a propojení stran](mets-logical.md); titul vícesvazku a smLink |
| METS – vnitřní části | 13 | [Kapitoly, obrazy a jejich stránky](mets-internal-parts.md); rozdílné režimy popisu a volitelná logická PAGE |
| METS – blokové vazby ALTO | 8 | [fptr/area, FILEID, BEGIN a BETYPE](mets-alto-links.md); textové a obrazové cíle |
| METS – obálky MODS/DC | 8 | [dmdSec, ID, mdWrap a xmlData](mets-dmd.md); verze MODS 3.8 a výjimka DC |
| MODS – názvové údaje jednosvazku | 8 | [titleInfo, type, title, nonSort, subTitle, partNumber a partName](mods-titles.md); M/MA/O a hlavní název bez type |
| MODS – původci a role jednosvazku | 9 | [name, namePart, nameIdentifier a role](mods-names.md); MA/O/M a slovník marcrelator |
| MODS – podrobnosti jmen jednosvazku | 9 | [Typované části jmen, alternativeName a etal](mods-name-details.md); MA/RA/O/M a slovní zákaz type |
| MODS – typ dokumentu a žánr jednosvazku | 4 | [typeOfResource, strukturální a bibliografický genre, authority](mods-resource-genre.md); M/R a čtyři druhy předloh |
| MODS – původ a místa vydání jednosvazku | 8 | [originInfo, eventType, place a placeTerm](mods-origin.md); AACR/RDA, M/MA a slovní požadavky |
| MODS – nakladatelé a výrobci jednosvazku | 5 | [agent, namePart, role a roleTerm](mods-origin-agents.md); MA/M, výjimka copyright a sporný zápis distributora |
| MODS – data vydání a dalších událostí jednosvazku | 7 | [dateIssued, encoding, point, qualifier, calendar a dateOther](mods-origin-dates.md); M/MA/R/O a význam polí MARC |
| MODS – copyright, vznik a vydávání jednosvazku | 5 | [copyrightDate, dateCreated, edition a issuance](mods-origin-completion.md); samostatné omezení RDA a nejasnosti mapování |
| MODS – jazykové údaje jednosvazku | 5 | [language, objectPart, languageTerm, type a authority](mods-language.md); M/MA, ISO 639-2/B a význam translation |
| Vedlejší METS | 8 | [Inventář stránky, ADMID a fyzická mapa](mets-amd.md); včetně doložených nesouladů ve vzoru |
| PREMIS Object | 17 | [Identifikace, charakteristiky, fixity, velikost a formát](premis-object.md); rozdíly PREMIS 2.2 a povinností DMF |
| PREMIS – vznik a ochrana | 8 | [Úroveň ochrany, aplikace, data a původní název](premis-provenance.md); povinnosti M/R a ukázky MC, PS a ALTO |
| PREMIS – vazby | 13 | [Vztahy objektů a událostí](premis-relationships.md); odkazy MC/ALTO, přímé odkazy PS a výkladové meze vzoru |
| PREMIS Event | 16 | [Události, jejich výsledky a vazby](premis-events.md); povinnosti M/R, čas na sekundy a odlišení příkladů od číselníků |
| PREMIS Agent | 7 | [Původci událostí](premis-agents.md); kontext SIP/AIP, identity, typy a příkaz výroby JPEG 2000 s MA |

Deset pravidel rozměrů, vzorkování a barevného kódování je popsáno v [rozboru obrazových metadat MIX](mix-image-characteristics.md), včetně stránek DMF, XSD typů, podmínek a mezí ověření. Frekvence X/Y mají MA s konkrétní podmínkou fyzikální jednotky `in.` nebo `cm`. Skupiny METS zachovávají tabulkové kódy M/MA/O; u slovních požadavků se původní kód nedomýšlí. Obálky MODS/DC obsahují sedm pravidel s M a slovní zákaz MDTYPEVERSION u DC.

Ověřený přepis požadavku není potvrzením správnosti souboru ani všech implementací. U ICC jsou doloženy konkrétní verze a cesty nástrojů; u nové obrazové skupiny jejich chování zatím ověřeno nebylo. Demo standard `ndk-base` již není součástí datasetu.

## Orientace v dokumentaci

- [Architektura](architecture.md) — Git/YAML, compiler, Cloudflare D1, Worker a společný web MkDocs/React/Swagger.
- [Datový model](registry-data-model.md) — identity, verze, povinnosti M/MA/R/RA/O, podmínky, zdroje a vztahy.
- [Kategorie a graf vztahů](graph-and-categories.md) — oblasti metadat, standardy, skrývání vazeb a tabulkový pohled.
- [XML ukázky ze vzorového SIP](xml-examples.md) — kopírovatelný kód, původ výřezů a opakovatelné ověření.
- [Lokální vývoj a nasazení](local-development.md) — instalace, sestavení, testy, import dat a publikování.
- [Případ ICC profile version](icc-profile-version.md) — oddělení požadavku, sporné sémantiky a implementací.
- [Periodika a monografie — první srovnání MIX](periodical-mix-comparison.md) — deset doložených dvojic pro MC/PS, shody a odlišný dokumentový kontext.
- [Identifikace, velikost a formát v MIX](mix-basic-information.md) — osm dalších dvojic a kontext povinnosti uvnitř doporučeného kontejneru.
- [Rozměry, vzorkování a barva v MIX](mix-image-characteristics.md) — metodika přepisu nové skupiny.
- [Informace o balíčku info.xml](info-xml.md) — povinnosti M/MA/R/O, vazby na soubory a rozpory DMF/XSD.
- [Soubory a jejich vazby v METS](mets-files.md) — hlavní METS, inventář souborů a fyzická mapa.
- [Kořen a hlavička hlavního METS](mets-header.md) — LABEL, TYPE, schémata, časy a tvůrce/vlastník záznamu.
- [Data vydání a dalších událostí MODS](mods-origin-dates.md) — datum vydání, rozmezí, nejistota, kalendář a další typy dat.
- [Copyright, vznik a vydávání MODS](mods-origin-completion.md) — datum copyrightu a rukopisu, údaj o vydání, způsob vydávání a oddělená větev RDA.
- [Jazykové údaje MODS](mods-language.md) — jazyk obsahu versus katalogizace, opakování jazyků a termínů, kódy B/T a mapování objectPart.
- [Nakladatelé a výrobci MODS](mods-origin-agents.md) — odlišení od autorů, role a výjimka copyright.
- [Původ a místa vydání MODS](mods-origin.md) — opakování originInfo, povinnosti RDA/AACR a převod místních údajů z MARC.
- [Typ dokumentu a žánr MODS](mods-resource-genre.md) — oddělení strukturálního modelu, bibliografického žánru a autority.
- [Podrobnosti jmen MODS](mods-name-details.md) — rozlišení MA/RA, alternativní jména a samostatné etal.
- [Původci a role MODS](mods-names.md) — pojmenované autorství a další odpovědnosti, identifikátory a kódované role.
- [Názvové údaje MODS](mods-titles.md) — první popisná skupina, pouze pro jednosvazkovou úroveň.
- [Obálky bibliografických metadat](mets-dmd.md) — oddělení ID obálky a záznamu, MODS/DC a rozsah ověření.
- [Blokové vazby METS–ALTO](mets-alto-links.md) — dva rozsahy identifikátorů, textové/obrazové cíle a doložené dílčí XML ukázky.
- [Vnitřní části monografie](mets-internal-parts.md) — kapitoly, obrazy, jejich metadata a výčty stran; bez předstírání ukázek z jednoduchého SIP.
- [Logická mapa a výčet stran](mets-logical.md) — vazby DMDID a smLink, směr odkazů a úplnost stran bez popisu kapitol.
- [Fyzická mapa hlavního METS](mets-physical.md) — úplnost stran, číselník typů, ORDER versus ORDERLABEL a vazby DMDID/ADMID.
- [Vedlejší METS a vazby na technická metadata](mets-amd.md) — jediná skupina, správné cíle ADMID a MONOGRAPH_PAGE.
- [PREMIS Object](premis-object.md) — identifikace souboru, kontrolní součty, velikost a popis formátu.
- [Vznik a ochrana souboru v PREMIS](premis-provenance.md) — úroveň ochrany, aplikace, data a původní název.
- [Vazby objektů a událostí PREMIS](premis-relationships.md) — relationship pro MC/ALTO a linkingEventIdentifier pro PS.
- [Události PREMIS Event](premis-events.md) — identifikace, typ, čas, výsledek, původci a objekty.
- [Původci událostí PREMIS Agent](premis-agents.md) — identifikace, jméno, typ a podmíněná poznámka s příkazem.

## Rozhraní registru a API

Základ [porovnávání DMF a katalogizačních režimů](registry-data-model.md) pracuje s explicitními významovými klíči a rozsahem AACR2/RDA. [Porovnávací obrazovka](https://standardy.digitalizaty.cz/registry/compare) nabízí výběr obou stran, prohození, sdílený odkaz, filtr výsledků a hledání. Vedle `originInfo/@eventType` je dostupných 18 dvojic MIX mezi Monografiemi 2.3 a Periodiky 2.2, včetně odkazu na tento výběr a vysvětlení párování; API `/api/v1/compare/contexts` vrací i nezmapované a nejednoznačné případy, které obrazovka uvádí odděleně. [Audit katalogizačního rozsahu](cataloguing-scope-audit.md) u všech 263 pravidel doložil 204 nezávislých, 54 společných, jeden AACR2 a čtyři RDA předpisy. Nezávislost se nezaměňuje s neprověřeným rozsahem ani se společným bibliografickým předpisem. Rozdíl není automaticky chyba. Nepoužití údaje v kontextu DMF se v rozhraní neoznačuje jako obecný zákaz v MODS/METS a rozlišuje výslovný požadavek od výkladu. Další významové mapování a další DMF jsou samostatný krok.

Web nabízí hledání bez diakritiky, kombinovatelné filtry, sdílené odkazy, detail konkrétní verze pravidla a interaktivní graf vztahů. Tlačítko **Navrhnout změnu** otevře předvyplněný návrh GitHub issue; samo nic neodesílá.

Pravidla lze filtrovat podle oblasti metadat i metadatového standardu (METS, MODS, Dublin Core, PREMIS, MIX, AES57, ALTO, copyrightMD, documentMD a info.xml). Nabídka rozlišuje dosud prázdné oblasti. Graf začíná přímými vazbami, umožňuje skrývat typy vztahů a kategorie uzlů a přepnout do tabulky.

[Veřejné API](https://standardy.digitalizaty.cz/api-docs/) je pouze pro čtení, bez přihlášení. [OpenAPI kontrakt](https://standardy.digitalizaty.cz/openapi.json) popisuje dostupné operace, filtry a datové typy. Swagger je součástí stejného nasazení jako dokumentace a registr.

```bash
curl 'https://standardy.digitalizaty.cz/api/v1/rules?category=technical%2Fsampling'
curl 'https://standardy.digitalizaty.cz/api/v1/rules?obligation_code=MA'
curl 'https://standardy.digitalizaty.cz/api/v1/meta'
```

„Počet pravidel“ znamená počet unikátních ID. Počet verzovaných záznamů se může lišit; právě ten počítá `pagination.total` v API. Verze NDK, verze kontraktu API, `schema_version` a identita datasetu `git-<SHA>` jsou různé údaje. Úroveň povinnosti není závažnost validačního hlášení.

## Jak přidat nebo opravit pravidlo

Agenti mohou použít [projektové skills](agent-skills.md). [MVP neveřejného editoru](editor-mvp.md) na `/editor/` používá stejná schémata a sémantické kontroly pro soukromé koncepty. Přístup vyžaduje pozvání do samostatné Clerk aplikace a explicitní členství v registru. Budoucí schvalování a publikaci popisuje [redakční postup](editorial-workflow.md).

1. Určete standard, jeho verzi, rozsah platnosti a přesný lokátor původního zdroje.
2. Zapište pravidlo do YAML v `registry/`; oddělte požadavek od výkladu, rozporů a implementací.
3. Zachovejte původní kód povinnosti a zdokumentujte podmínky. Ověření nástroje nepřenášejte na jinou verzi nebo jiné pravidlo.
4. Doplňte vazby na zdrojové entity a testy důležitých podmínek.
5. Spusťte validaci, typovou kontrolu, testy a celé sestavení podle [návodu](local-development.md).
6. Navrhněte změnu v [repozitáři](https://github.com/bezverec/standardy). D1 a JSON exporty jsou odvozené; neopravujte je místo zdrojového YAML.
