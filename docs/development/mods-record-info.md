# Původ katalogového záznamu v MODS

Patnáct pravidel kategorie `metadata/mods-record-info` doplňuje přímé `recordInfo` v MODS **svazku jednosvazkové monografie** v hlavním METS. Zachycují historii a původ katalogového záznamu, jeho identitu, katalogizační standard a jazyk katalogizace. Nejde o pravidla pro titul vícesvazku, kapitolu, přílohu, stránku ani vnořené relatedItem.

## Podklady

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 58–59, a legenda s. 24. Tabulky a jejich návaznost byly vizuálně ověřeny 3. 11. 2026.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): modsGroup, recordInfoDefinition, recordIdentifierDefinition, dateDefinition, languageDefinition, languageTermDefinition a authorityAttributeGroup.
- [LOC: recordInfo](https://www.loc.gov/standards/mods/userguide/recordinfo.html): význam údajů o záznamu, nikoli o popisovaném zdroji. Obecné MODS povinnosti DMF neobsahuje.

## Pravidla

Prefix ID je `NDK-MONO-MODS-SINGLE-`. Kardinalita se počítá vůči rodiči určenému v `element_role`, ne v celém SIP.

| Suffix ID | Cíl | Povinnost | Kardinalita |
|---|---|---|---|
| RECORD-INFO | recordInfo | M | 1..n |
| DESCRIPTION-STANDARD | recordInfo/descriptionStandard | M | 1..n |
| RECORD-CONTENT-SOURCE | recordInfo/recordContentSource | R | 0..n |
| RECORD-CONTENT-SOURCE-AUTHORITY | recordInfo/recordContentSource/@authority | R | 0..1 |
| RECORD-CREATION-DATE | recordInfo/recordCreationDate | M | 1..n |
| RECORD-CREATION-DATE-ENCODING | recordInfo/recordCreationDate/@encoding | M | 1..1 |
| RECORD-CHANGE-DATE | recordInfo/recordChangeDate | MA | 1..n |
| RECORD-CHANGE-DATE-ENCODING | recordInfo/recordChangeDate/@encoding | M | 1..1 |
| RECORD-IDENTIFIER | recordInfo/recordIdentifier | R | 0..n |
| RECORD-IDENTIFIER-SOURCE | recordInfo/recordIdentifier/@source | R | 0..1 |
| RECORD-ORIGIN | recordInfo/recordOrigin | R | 0..n |
| CATALOGUING-LANGUAGE | recordInfo/languageOfCataloging | R | 0..n |
| CATALOGUING-LANGUAGE-TERM | recordInfo/languageOfCataloging/languageTerm | M | 1..n |
| CATALOGUING-LANGUAGE-TERM-AUTHORITY | recordInfo/languageOfCataloging/languageTerm/@authority | R | 0..1 |
| CATALOGUING-LANGUAGE-TERM-TYPE | recordInfo/languageOfCataloging/languageTerm/@type | R | 0..1 |

Jde o šest M, jedno MA a osm R. Elementy zůstávají opakovatelné podle MODS XSD 3.8: tabulka na rozdíl od physicalLocation neuvádí neopakovatelnost. Atribut má nejvýše jeden výskyt na svém rodiči.

M u languageTerm platí uvnitř použitého languageOfCataloging s R. M u encoding platí na každém uvedeném datu změny, přestože jeho rodič má MA. Dostupnost pro MA vyjadřuje `record_change_date_available`, zjištěné ze zdroje. Nepřítomnost cílového XML není důkazem nedostupnosti; neznámý kontext není false.

## Hranice výkladu

### Katalogizační režim

Společná povinnost descriptionStandard neznamená volnou záměnu hodnot:

- AACR2: LDR/18 s hodnotou a se mapuje na doslovné XML `aacr`.
- RDA: 040$e s hodnotou rda se mapuje na `rda`; DMF tento údaj výslovně určuje jako primární rozlišení.

Pozitivní údaj RDA se nesmí přepsat pouhým zjištěním LDR/18=a. Nedostatečný či rozporný zdroj vyžaduje posouzení. Interní označení režimu `aacr2` se nepřebírá do XML; absence 040$e sama nedokazuje AACR2.

Všech patnáct pravidel je vedeno jako společný předpis správy bibliografického záznamu podle konkrétní tabulky a legendy. U descriptionStandard je zachováno větvení; společné zařazení neprohlašuje mapování za totožné. U ostatních řádků DMF režimy nerozlišuje. Toto posouzení se nepřenáší na technická metadata nebo všechny elementy MODS. Nové významové klíče pro porovnávač nejsou přiděleny.

### Instituce a identifikátor záznamu

Řádek recordContentSource pokračuje na s. 59: použije se **poslední 040$d**, teprve pokud 040 žádné $d neobsahuje, hodnota $a. Authority=siglaADR je R. Instituce původu záznamu není automaticky instituce uchovávající exemplář z physicalLocation.

RecordIdentifier přebírá 001, jeho source přebírá 003. Oba požadavky mají R; identifikátor je řetězec a nesmí ztratit počáteční nuly. Nejde o ISBN vydání, signaturu ani UUID digitalizátu. Vzorové ABA001 a CZ-PrNK se nepovýší na obecné číselníky.

### Čas a původ

RecordCreationDate má M; recordChangeDate MA. Obě data mají mít alespoň minutovou přesnost a povinné encoding=iso8601. Registr nepředepisuje sekundy, časové pásmo Z ani jedinou syntaxi podle vzoru. Chybějící hodiny a minuty se nesmí vymyslet, například doplněním půlnoci. Platnost a přesnost vyžadují sémantické posouzení data; obecný řetězcový XSD typ je nezaručí.

LOC při převodu metadat vztahuje vznik záznamu k původnímu zdroji. Datum exportu SIP, skenování nebo vydání knihy jej nenahrazuje. DMF v těchto řádcích neuvádí konkrétní pole MARC pro časová data; nepřidáváme je jako vydaný národní požadavek.

U recordOrigin DMF uvádí dvě hodnoty, machine generated a human prepared, zatímco obecné MODS připouští volný text. Jde o národní zúžení v doporučeném elementu, nikoli o rozpor se schématem. Způsob vzniku záznamu neprokazuje jeho správnost.

### Jazyk katalogizace

LanguageOfCataloging popisuje jazyk záznamu, nikoli knihy. Povinný languageTerm uvnitř tohoto doporučeného kontejneru se přebírá z 040$b; nepoužívá se automaticky jazyk obsahu z 008/35–37 nebo 041.

Authority=iso639-2b a type=code mají **R**, na rozdíl od M ve stávající skupině jazyka obsahu. Cze ve vzoru není jediný dovolený jazyk. MODS 3.8 má obecnou authority jako volný řetězec a type připouští code i text; národní doporučení zůstávají v pravidlech.

## Doložené XML

Patnáct ukázek pochází z [vzorového SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download) označeného uživatelem jako oficiální. Některá pravidla sdílejí stejný uzel, například datum a jeho encoding. Všechny ukázky zachovávají původní hodnoty a pořadí.

Soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256:
`7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`.

Základ XPath:
`/mets:mets/mets:dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:recordInfo`.

Namespace: mets = http://www.loc.gov/METS/, mods = http://www.loc.gov/mods/v3.

Vybraný záznam deklaruje MODS 3.8, genre=volume, issuance=single unit a descriptionStandard=aacr; info deklaruje DMF 2.3. Záznam obsahuje data 2010-10-05T00:00:00Z a 2010-12-02T10:35:03Z, recordIdentifier nkc20102129761 se source=CZ-PrNK, instituci ABA001, machine generated a jazyk cze.

Samotná ukázka nedokládá původní MARC, správnost uvedených časů nebo předepsaného převodu a neposkytuje příklad větve RDA. Půlnoc v prvním datu je původní hodnota; není ověřeno, zda jde o skutečně známý čas. Zaznamenání příkladu není potvrzením validity celého SIP. Implementace nástrojů nebyly ověřeny a deklarativní custom kontroly registr nad SIP nespouští.

## Ověření

Lokálně 3. 11. 2026 prošly:

- validace 330 YAML dokumentů a typová kontrola;
- všech 459 testů v 52 souborech, včetně osmi významových testů sady a čtyř nových kombinací filtrů;
- sestavení dokumentace, registru, editoru a Swaggeru: 320 pravidel (302 monografických a 18 periodických), 257 zdrojových entit a 1703 vazeb;
- kontrola syntaxe a shody všech 265 monografických XML ukázek s původním souborem pomocí SHA-256 a XPath; celý registr má 272 ukázek u 217 pravidel;
- kontrola diffu a validace aktualizovaného autorského skillu.

Zůstává dřívější nesouvisející upozornění MkDocs na kotvu poznámky v openexr-preservation-master.md. Původní MARC, historie časových údajů a implementace nástrojů zůstávají neověřené. Uvedené výsledky dokládají lokální přípravu sady; GitHub CI a skutečné nasazení se ověřují samostatně pro konkrétní commit.
