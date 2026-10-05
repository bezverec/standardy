# Fyzická mapa hlavního METS

Dvanáct pravidel `structure/mets-physical` navazuje na [soubory a FILEID](mets-files.md) a [kořen a hlavičku](mets-header.md). Platí pro hlavní METS svazku podle DMF Monografie 2.3. [Logická mapa a structLink](mets-logical.md) mají vlastní navazující skupinu; odkazy do bloků ALTO zatím nepokrýváme; pravidla se nepřenášejí do [vedlejšího METS](mets-amd.md).

## Zdroje a verze

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), s. 92–93, § 7.7.1.1; pro skutečné umístění pageNumber/pageIndex také tabulka PAGE na s. 73. Příslušné strany byly přečteny a vizuálně ověřeny.
- [METS 1.9.1 XSD](https://www.loc.gov/standards/mets/version191/mets.xsd), structMapType, divType a ORDERLABELS. Verzi vybírá DMF, s. 5.
- [Pravidla pro popis monografií 2.4](https://standardy.ndk.cz/ndk/standardy-digitalizace/ppp_mono_2.4_final.pdf), s. 4–7 (paginace), s. 8 a 14 (typy stran). Číselník byl vizuálně zkontrolován podle tří sloupců tabulky 1.2.2, nikoli podle smíchaného textového výtahu.

## Přehled

Prefix ID je `NDK-MONO-METS-PHYSICAL-`.

| Pravidlo | Co požaduje |
|---|---|
| MAP | Přítomnost fyzické mapy s TYPE=PHYSICAL |
| MAP-LABEL | LABEL=Physical_Structure na mapě |
| VOLUME-DIV | Jeden přímý rodičovský div v mapě |
| VOLUME-TYPE | Typ rodiče; Monograph je v tomto oddílu příklad |
| VOLUME-LABEL | Volitelný titul svazku |
| DIV-ID | ID rodiče i stran, jedinečná v celém XML |
| VOLUME-DMDID | Odkaz na dmdSec příslušného svazku |
| VOLUME-ADMID | Podmíněná vazba na nepovinná metadata práv |
| PAGES | Úplnost stran včetně příloh |
| PAGE-TYPE | Typ stránky z PPM 2.4 |
| PAGE-ORDER | Numerické pořadí reprezentace |
| PAGE-ORDERLABEL | Paginace podle předlohy a PPM |

V této části jsou požadavky slovní. Všech 12 pravidel má `obligation_source: prose`, žádné nemá domyšlený kód M/MA/O. Jedenáct má úroveň Povinné (u ADMID s podmíněnou přítomností), LABEL svazku je Volitelné. Neznamená to, že ADMID nebo metadata práv musejí být v každém balíčku.

## Co se nesmí zaměnit

| Kontext | Význam |
|---|---|
| structMap/@LABEL | Pevné označení Physical_Structure |
| rodičovský div/@LABEL | Volitelný titul |
| mets/@TYPE | Monograph podle samostatného kořenového pravidla |
| rodičovský div/@TYPE | DMF uvádí Monograph pouze jako příklad |
| stránkový div/@TYPE | Typ strany, např. titlePage |
| mods:genre/@type | Tentýž typ odpovídající strany |
| text mods:genre | page / reprePage, tedy reprezentativnost |

Číselník PAGE-TYPE má **37 hodnot**: první a prostřední sloupec tabulky PPM, nikoli hodnoty pouze pro vnitřní části z třetího sloupce. `chapter` nebo `article` sem nepatří. Nevyžaduje se přítomnost všech typů v každé knize ani jejich naskenování. PPM rozlišují povinné určení vybraných typů od dobrovolného podrobnějšího popisu.

### Pořadí není paginace

Ve vzoru má první stránka `ID=DIV_P_PAGE_0000`, `ORDER=1` a `ORDERLABEL=[1]`. Jde o tři různé údaje. XSD předepisuje pro ORDER integer, pro ORDERLABEL string. PPM obsahují i ukázku ORDER=0; z této skupiny proto nevzniká univerzální požadavek začínat od jedničky.

Paginace připouští podle konkrétní situace také římské číslování, dopočítaná čísla, recto/verso či dvojici čísel jedné dvoustrany. Nevynucujeme numerický regex, shodu ORDER a ORDERLABEL ani jedno stránkové div na každé tiskové číslo.

Zkratky `part type=pageIndex/pageNumber` v oddílu fyzické mapy porovnáváme s podrobnou tabulkou PAGE: atribut type je na `mods:detail` pod `mods:part`. Shoda se kontroluje s popisem **téže** stránky, ne jen podle podobnosti koncovek ID. Volitelné MODS part pro pageIndex se touto skupinou nestává povinným.

### Vazby DMDID a ADMID

DMDID odkazuje na dmdSec, nikoli přímo na ID vnořeného mods:mods. Obě odkazová pole mají typ IDREFS: jeden atribut může obsahovat několik tokenů; četnost atributu 1–1 není zákazem seznamu.

U ADMID zůstává výslovně zachován rozdíl pramenů: DMF jmenuje kontejner amdSec, dokumentace METS dílčí administrativní záznamy, typicky rightsMD. Vzor odkazuje na `AMD_MONOGRAPH_0001`; uvnitř je `RIGHTS_0001`. Datový typ IDREFS existenci ID ověří, ale nerozhodne tento sémantický rozdíl. Registr ho nepřevádí na jednoznačný verdikt externího validátoru ani automatickou opravu zdroje.

Pravidlo nepožaduje vytvořit metadata práv. Pokud jsou vložena pro daný svazek, požaduje vazbu; již uvedený odkaz se kontroluje i kvůli neexistujícímu nebo nesouvisejícímu cíli.

## XML ukázky a ověření

Skupina má **17 přesných výřezů u všech 12 pravidel**: mapu, rodičovský div, první stránku a související popisy svazku, práv a první stránky. Stejný výřez může dokládat více pravidel. Celé rodičovské elementy nejsou zkráceny na nepravý fragment.

Zdroj: [dodaný vzorový SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), hlavní soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`.

SHA-256: `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`.

Vzor má 16 stránkových div. To je pozorování jednoho svazku, nikoli předepsaná četnost ani důkaz úplnosti vůči fyzické předloze. Počty, obsah výřezů a zdrojový otisk lze ověřit skriptem popsaným u [XML ukázek](xml-examples.md).

## Kontext a meze

Přítomnost MAP se posuzuje pro `object_type=monograph`, `document_role=main_mets` bez podmínky existence mapy. Další pravidla mají kontext `structmap_type=PHYSICAL`; `structural_level=volume/page` vychází z pozice div, ne z jeho kontrolovaného TYPE. Pravidla pro rodiče a stránky nezaniknou jen proto, že atribut TYPE chybí.

Registr uchovává normativní požadavky a vysvětlení, ale `custom` kontroly nevykonává. Ověřen je přepis pramenů a původ XML ukázek, nikoli chování ProArcu, Krameria, NDK validátoru či úplná validita SIP.
