# Identifikace a charakteristiky jednotlivých stran v MODS

Sada z 5. 11. 2026 přidává osm pravidel DMF Monografie 2.3 pro přímý MODS záznam **PAGE** v hlavním METS. Navazuje na [paginaci a pořadí stran](mods-page-pagination.md). Popisuje identifikaci, reprezentativnost, druh a obsah stránky, její polohu v dokumentu a fyzický stav.

## Prameny a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.6, s. 72–73: vizuálně ověřeny řádky identifier, note, genre, typeOfResource a physicalDescription včetně atributů, potomků a kódů M/MA/O. Legenda s. 24 určuje vztah povinností potomků k použití rodiče. Kapitola 4, s. 9 doplňuje přidělování UUID při digitalizaci.
- [Pravidla pro popis monografií 2.4](https://standardy.ndk.cz/ndk/standardy-digitalizace/ppp_mono_2.4_final.pdf), s. 8 a 14: typ strany na genre/@type a výčet hodnot; tabulka na s. 14 ověřena i vizuálně. Výčet patří k tomuto vydání, odkaz DMF na aktuální pravidla není automatickým převzetím budoucích změn.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): modsGroup, identifierDefinition, genreDefinition, typeOfResourceDefinition, noteDefinition, physicalDescriptionDefinition a physicalDescriptionNote. Obecné schéma samo nevyžaduje atribut genre/@type ani jeho národní číselník.

Nezávislost na AACR2/RDA byla posouzena pro konkrétní role digitální stránky, ne podle namespace MODS. UUID se přiděluje při digitalizaci; reprezentativnost, typ a označení strany řeší DMF a PPM. Druh obsahu a fyzický stav se vztahují k jednotlivé stránce. Stejnojmenné bibliografické prvky svazku mají vlastní pravidla a katalogizační rozsah. Sada nevytváří nové párovací klíče s periodiky ani tvrzení o implementacích nástrojů.

## Pravidla

ID mají prefix `NDK-MONO-MODS-PAGE-`. Kardinalita se vztahuje k uvedenému rodiči, nikoli ke všem uzlům téhož názvu v SIP.

| Konec ID | Cíl / rodičovský kontext | Povinnost | Kardinalita |
|---|---|---|---|
| IDENTIFIER | identifier přímo v MODS stránky | M | 1..n |
| IDENTIFIER-TYPE | type každého takového identifier = uuid | M | 1..1 |
| SIDE-NOTE | note přímo v MODS stránky, right/left/singlePage | O | 0..n |
| GENRE | genre přímo v MODS stránky, page/reprePage | M | 1..n |
| GENRE-TYPE | type každého takového genre, druh strany podle PPM | M | 1..1 |
| RESOURCE-TYPE | typeOfResource přímo v MODS stránky | MA | 1..n při dostupnosti |
| PHYSICAL-DESCRIPTION | physicalDescription přímo v MODS stránky | O | 0..n |
| PHYSICAL-NOTE | note uvnitř použitého physicalDescription stránky | O | 0..n |

Přibyla jedna obecná entita `MODS-GENRE-TYPE`. Existující entity se sdílejí s jinými úrovněmi; význam a povinnost na úrovni stránky vyjadřují samostatná pravidla a jejich podmínky. Neomezená horní mez elementů vychází z opakovatelnosti XSD; jedna instance v ukázce neznamená předpis právě jedné instance.

## Hranice výkladu

**UUID stránky.** Identifier identifikuje stránku a má povinný typ uuid. Tím se na stránku nepřenáší povinnost URN:NBN svazku ani katalogové ISBN. Tato sada nezavádí konkrétní verzi UUID, syntaktický regex či globální kontrolu jedinečnosti. Správný atribut type sám neprokazuje správné přidělení identifikátoru.

**Tři různé údaje.** Text genre rozlišuje `page` a `reprePage`, atribut genre/@type druh strany a typeOfResource její obsah. Například `titlePage` patří do atributu, `reprePage` do textu a `text` do typeOfResource. Titulní stránka není jen z názvu svého typu automaticky reprezentativní. Z jedné ukázky nevyvozujeme počet reprezentativních stran v celém SIP.

**Druhy stran.** Povolených 37 hodnot pochází z prvních dvou sloupců tabulky PPM 2.4 s. 14. Hodnoty pouze pro vnitřní části, například chapter, nejsou typem stránky; příklad index v DMF není jedinou povolenou hodnotou. PPM požadují popis druhů, pokud byly naskenovány, nikoli naskenování všech druhů. Vazby `related_to` propojují genre/@type s typem v paginaci a fyzické mapě METS, ale neprohlašují celé požadavky za ekvivalentní.

**Dostupnost obsahu.** MA u typeOfResource se vyhodnotí podle obsahu stránky a zdrojových údajů (`page_content_type_available`), ne podle existence tohoto elementu. Čtyři hodnoty `text`, `still image`, `notated music` a `cartographic` jsou předpisem DMF pro PAGE, nikoli uzavřenou enumerací XSD 3.8. Nejde o formát skenu ani o automatické převzetí MARC LDR svazku.

**Dvě poznámky.** Přímý note stránky má význam right, left nebo singlePage. Poslední hodnota podle DMF označuje stránku vzniklou spojením více snímků stránek, nikoli obecně jeden sken. Right/left nelze spolehlivě odvodit jen z parity pořadí skenu. Naproti tomu physicalDescription/note je textová poznámka k fyzickému stavu; každá poznámka má vlastní element a číselník stran se na ni nevztahuje.

**Volitelný fyzický popis.** O platí pro kontejner i jeho poznámku. Chybějící poznámka neprokazuje nepoškozený stav. O u note také nepovoluje prázdný physicalDescription proti XSD, které vyžaduje alespoň jednoho potomka ze své volby, ne nutně note. Mapování do Dublin Core není v této sadě implementováno.

**Výběr kontextu.** Rodičovské role `mods_page_identifier`, `mods_page_genre` a `mods_page_physical_description` určují přímo použité rodiče v PAGE. Jejich výběr nesmí předpokládat správnost kontrolovaného atributu ani existenci kontrolovaného dítěte. Jinak by chybějící type vypnul vlastní kontrolu. Neurčený kontext není splněné pravidlo. Deklarativní custom kontroly registr nad SIP nespouští.

## XML ze vzorového SIP

Devět výřezů u šesti pravidel pochází z [monografického vzoru](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), souboru `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256:

`7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`.

XPath vybírá přímé děti MODS uvnitř `MODSMD_PAGE_0001` a `MODSMD_PAGE_0004`. První stránka obsahuje UUID `02db9be9-7074-11f1-b41e-d6a2fa380025`, right, genre s typem titlePage a textem reprePage, typeOfResource=text. Čtvrtá dokládá left a genre s typem normalPage a textem page. Příklady u atributových pravidel opakují celý příslušný element; nejde o další původní uzly.

Namespace jsou `mets=http://www.loc.gov/METS/` a `mods=http://www.loc.gov/mods/v3`. Záznamy deklarují MODS 3.8, info.xml DMF 2.3. Zachovány jsou skutečné hodnoty. Ověření výřezů neprokazuje správnost přidělení UUID, reprezentativnosti, obrazového obsahu ani celého SIP.

Bylo prohlédnuto všech 16 PAGE záznamů: žádný neobsahuje physicalDescription a žádná přímá poznámka nemá singlePage. Tyto příklady proto nejsou doplněny jako zdrojové výřezy. Nepřítomnost ve vzoru neruší příslušné požadavky DMF.

## Ověření

Lokálně 5. 11. 2026 prošla validace 360 YAML dokumentů, typová kontrola a všech 496 testů v 55 souborech. Nové kontroly zahrnují rodičovské role, M/MA/O, dostupnost nezávislou na cílovém XML, tři různé druhy označení stránky, rozdíl obou poznámek a filtrování kategorie přes API.

Všech 298 monografických XML ukázek prošlo kontrolou syntaxe a porovnáním se zdrojovým SIP podle SHA-256 a XPath. Celkem registr obsahuje 305 ukázek u 241 pravidel, z toho monografických 298 u 234 pravidel. Fyzický stav ani shoda s obrazovou předlohou tím ověřeny nejsou.

Prošlo sestavení registru, MkDocs, veřejného webu, editoru a Swaggeru i kontrola `git diff --check`.

Po přidání sady obsahuje registr 350 pravidel (332 monografických a 18 periodických), 268 zdrojových entit a 1822 vztahů.
