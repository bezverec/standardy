# Paginace a pořadí jednotlivých stran v MODS

Sada z 5. 11. 2026 přidává dvanáct pravidel DMF Monografie 2.3 pro úroveň **PAGE** v hlavním METS. Odděluje označení strany podle předlohy (`pageNumber`) od pořadí strany v reprezentaci (`pageIndex`). Nejde o další pravidla popisu svazku ani o úplné pokrytí metadat stránky.

## Prameny a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.6, s. 72–73: vizuálně ověřeny oba bloky `part`, pokračování řádku přes stránku a jednotlivé kódy povinností. Legenda na s. 24 určuje závislost povinností potomků na použití rodiče.
- [Pravidla pro popis monografií 2.4](https://standardy.ndk.cz/ndk/standardy-digitalizace/ppp_mono_2.4_final.pdf), s. 4–7: paginace; s. 8 a 14: typy stran. Tabulka na s. 14 byla ověřena i vizuálně. Toto vydání výslovně vychází z DMF 2.3; odkaz DMF na „aktuální“ pravidla není automatickým přebíráním budoucích změn.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): `partDefinition`, `detailDefinition`, `extentDefinition`, `number`, `start` a `stringPlusLanguage`. [Pokyny LOC k part](https://www.loc.gov/standards/mods/userguide/part.html) doplňují význam jednotlivých prvků. Textový typ čísla se nezaměňuje s celočíselným atributem `part/@order`.

Všech dvanáct požadavků je nezávislých na AACR2/RDA: popisují paginaci, typ strany a pořadí skenu podle národní metodiky digitalizace. Toto posouzení se nevztahuje automaticky na ostatní prvky MODS. Nevznikají nové párovací klíče ani tvrzení o shodě s DMF Periodika.

## Pravidla

ID v tabulce mají prefix `NDK-MONO-MODS-PAGE-`. Povinnost a kardinalita platí v uvedeném rodičovském kontextu.

| Konec ID | Cíl / role | Povinnost | Kardinalita |
|---|---|---|---|
| NUMBER-PART | part pro paginaci, přímo v MODS stránky | R | 0..n |
| NUMBER-PART-TYPE | type použitého part pro paginaci | M | 1..1 |
| NUMBER-DETAIL | detail pro číslo strany v tomto part | MA | 1..n při dostupnosti |
| NUMBER-DETAIL-TYPE | type tohoto detail = pageNumber | M | 1..1 |
| NUMBER | number uvnitř detail pro paginaci | MA | 1..n při dostupnosti |
| EXTENT | extent uvnitř part pro paginaci | O | 0..n |
| EXTENT-UNIT | unit použitého extent = pages | M | 1..1 |
| EXTENT-START | start uvnitř použitého extent | M | 1..1 |
| INDEX-PART | part pro pořadí reprezentace, přímo v MODS stránky | O | 0..n |
| INDEX-DETAIL | detail uvnitř part pro pořadí reprezentace | M | 1..n |
| INDEX-DETAIL-TYPE | type tohoto detail = pageIndex | M | 1..1 |
| INDEX | number uvnitř detail pro pořadí reprezentace | M | 1..n |

Přibylo osm obecných entit MODS. Obě větve používají stejné entity `part`, `detail` a `number`; národní význam odlišují pravidla a jejich podmínky. `part/extent` má samostatnou entitu, protože nejde o textový `physicalDescription/extent` svazku. Horní mez potomků odpovídá XSD, nikoli počtu výskytů v ukázce.

## Hranice výkladu a kontroly

**R/O rodiče a M potomků.** Vynechaný volitelný `part` pořadí skenu neporušuje M jeho `detail`. Jakmile je ale tento `part` použit, chybějící `detail` je relevantní chyba. Totéž platí pro O `extent` a jeho M `unit` a `start`. Tabulkové R prvního `part` zachováváme; související slovní pokyn PPM s. 4 k zápisu paginace v METS i MODS zaznamenáváme odděleně.

**Dostupnost a role.** `pagination_label_available` se určuje z předlohy a možností dopočítání podle PPM, nikoli z přítomnosti cílového `number`. Dětská pravidla mají kontext konkrétního použitého rodiče. Role `mods_page_number_part`, `mods_page_index_part` a jejich potomků vyjadřují účel větve; jejich určení nesmí záviset pouze na správnosti kontrolovaného `detail/@type`. Jinak by chybějící nebo chybný atribut vypnul vlastní kontrolu. Nerozpoznaný účel se musí vykázat jako nevyřešený kontext, nikoli jako splněné pravidlo. Registr zatím vyhodnocování těchto kontextů nad SIP neimplementuje.

**Dvě různé hodnoty.** Paginace může obsahovat hranaté závorky, římská čísla, označení recto/verso nebo dvoustrany. Pořadí skenu označuje místo v reprezentaci. Nezavádíme pro oba údaje společný číselný regex ani univerzální počátek 1. Související pravidla [fyzické mapy METS](mets-physical.md) jsou propojena přes `related_to`: číslo strany s ORDERLABEL, pořadí s ORDER. Vazba není automatickou ekvivalencí a nevynucuje doplnění volitelného MODS bloku.

**Dva atributy type.** Na prvním `part` označuje type druh strany podle PPM 2.4. Povolené hodnoty pocházejí z prvních dvou sloupců tabulky s. 14; například `chapter` z výhradně vnitřních částí do této množiny nepatří. Hodnoty `pageNumber` a `pageIndex` patří na `detail/@type`. Druhému `part` pro pořadí skenu tabulka DMF atribut type nepředepisuje.

**Start a předloha.** Řádek `start` požaduje číslo uvedené v dokumentu a má M bez podmínky dostupnosti. Vzor obsahuje `[1]`, tedy zápis odlišný od prostého čísla 1. Výřez není důkaz, že údaj je takto vytištěn. Rozsah aplikace obecných pokynů k dopočítání na tento řádek zůstává k věcnému posouzení s předlohou; normativní znění není potichu přepsáno podle vzoru. Převod `start` do `dc:coverage` ani další mapování DC tato sada neimplementuje.

## XML ze vzorového SIP

Dvanáct výřezů u dvanácti pravidel pochází z [monografického vzoru](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), hlavního souboru `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256:

`7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`.

Základem XPath je `/mets:mets/mets:dmdSec[@ID="MODSMD_PAGE_0001"]/mets:mdWrap/mets:xmlData/mods:mods`. První `part` nese `type="titlePage"`, `detail type="pageNumber"` s `number=[1]` a `extent unit="pages"` se `start=[1]`. Druhý `part` je bez atributu type a obsahuje `detail type="pageIndex"` s `number=1`. Konkrétní uzly jsou zvoleny pozičním predikátem `[1]` či `[2]` pouze pro tento zdroj; pořadí těchto dvou bloků není nové normativní pravidlo.

Namespace jsou `mets=http://www.loc.gov/METS/` a `mods=http://www.loc.gov/mods/v3`. Záznam stránky deklaruje MODS 3.8, info.xml DMF 2.3. Ukázky zachovávají všechny hodnoty; opakování výřezu u atributového pravidla neznačí další původní uzel. Nejde o potvrzení správnosti paginace, obrazu předlohy, všech vazeb METS ani celého SIP.

## Ověření

Lokálně 5. 11. 2026 prošla validace 352 YAML dokumentů, typová kontrola a všech 484 testů v 54 souborech se dvěma pracovními procesy. Testy zahrnují rodičovské kontexty, M/MA uvnitř R/O, rozlišení obou atributů type, řetězcovou paginaci, katalogizační nezávislost i filtrování nové kategorie přes API.

Všech 289 monografických XML ukázek prošlo ověřením syntaxe a porovnáním se zdrojovým SIP podle SHA-256 a XPath. Celkem registr obsahuje 296 ukázek u 235 pravidel; monografické ukázky jsou u 228 pravidel. Aktualizovaný autorský skill prošel vlastní validací.

Sestavený registr obsahuje 342 pravidel (324 monografických, 18 periodických), 267 zdrojových entit a 1793 vztahů. Veškeré nové kontroly jsou deklarativní; tato sada neověřuje běh validátoru nad SIP, správnost předlohy ani všechny zvláštní případy paginace podle PPM. Produkční nasazení se ověřuje samostatně pro konkrétní commit.
