# Soubory a jejich vazby v hlavním METS

Úplný popis fyzické mapy, typy a číslování stran doplňuje [samostatná skupina](mets-physical.md). Existující pravidlo FILEID zůstává zde.

Kořenový záznam, hlavičku a role organizací popisuje samostatná skupina [Kořen a hlavička hlavního METS](mets-header.md).

Skupina 14 pravidel `NDK-MONO-METS-*` popisuje **hlavní METS monografie podle DMF 2.3**. V mapě registru patří do strukturálních metadat, standardu METS a tématu „METS · soubory a jejich vazby“. Vazby propojují inventář s lokátory, kontrolními součty, fyzickou mapou a údaji v info.xml.

## Prameny a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf): s. 5 vybírá METS 1.9.1; s. 90–91, § 7.6.1, popisují hlavní fileSec; s. 92–93, § 7.7.1.1, fyzickou mapu. Relevantní požadavky byly ověřeny také ve vykresleném PDF.
- [Oficiální XSD METS 1.9.1](https://www.loc.gov/standards/mets/version191/mets.xsd): oddělená evidence obecných elementů a atributů. Nejde o nejnovější verzi METS ani přechod na METS 2.

Tato skupina **nezahrnuje** úplnou fyzickou strukturu, logickou mapu, odkazy do bloků ALTO ani structLink. FileSec vedlejšího `amd_mets.xml`, jeho ADMID a mapu popisuje [samostatná navazující skupina](mets-amd.md). Pravidla zde mají podmínku `document_role = main_mets`; `FILEID` navíc fyzickou mapu a úroveň stránky. `SEQ` se týká jen skupin MC, UC a technických METS.

## Přehled pravidel

Společný prefix ID je `NDK-MONO-METS-`.

| ID – přípona | Předmět | Kontext kontroly |
|---|---|---|
| FILESEC | Inventář souborů | Hlavní METS |
| FILE-GROUPS | Skupiny a párování ID/USE | fileSec |
| FILE | Evidence jednotlivých souborů | Příslušná skupina |
| FILE-ID | XML identifikátor | Každý file; jedinečnost v celém dokumentu |
| FILE-MIMETYPE | Typ obsahu | Každý file podle své skupiny |
| FILE-SIZE | Velikost v bajtech | Každý file a odkazovaný soubor |
| FILE-CREATED | Datum a čas vytvoření | Každý file |
| FILE-SEQ | Pořadí | Jen MC, UC a technické METS |
| CHECKSUM-TYPE | Algoritmus MD5 | Každý file |
| CHECKSUM | Kontrolní součet | Každý file a obsah souboru |
| FLOCAT | Lokátor | Každý file |
| LOCTYPE | Typ lokátoru | Každý FLocat |
| HREF | Cesta v balíčku | Každý FLocat |
| FPTR-FILEID | Odkazy stránky na reprezentace | Přímé fptr fyzické stránky |

## Meze interpretace

DMF zde formuluje povinnosti slovně, nikoli kódy M/MA/R/RA/O. Pravidla proto mají `obligation: mandatory` a `obligation_source: prose`, ale **nemají domyšlený historický kód M**. Filtr „Povinné“ je zahrne, filtr přesného zdrojového kódu M nikoli. Obecné schéma METS mnoho těchto údajů nevyžaduje; vazba `restricts` zachycuje zpřísnění v NDK, nikoli chybu XSD.

- Kardinalita platí v uvedeném kontextu rodiče, ne jako součet všech výskytů v dokumentu. Pět předepsaných skupin neznamená automatický zákaz dalších skupin. U FLocat neodvozujeme maximum jeden jen z jedné ukázky.
- `LOCTYPE` má v DMF typickou hodnotu URL, nikoli výhradně povolenou hodnotu. Obecný číselník určuje METS.
- Cesta `xlink:href` se vyhodnocuje vůči kořeni SIP. Ukázka `mastercopy/…` nedokládá požadavek na diskovou absolutní cestu nebo úvodní lomítko.
- `SEQ` není automaticky `ORDER` stránky. DMF v této kapitole neurčuje počáteční číslo; zachované `SEQ="0"` ve vzoru neopravujeme.
- `FILEID` odkazuje na `file/@ID`, nikoli na cestu či libovolné XML ID. Obecné fptr může použít area/par/seq bez vlastního FILEID, což tato úzce vymezená fyzická pravidla nepřenášejí na logickou mapu. Překlep `ftpr` v jedné odrážce DMF se nepřebírá jako název elementu.
- MD5 zde zaznamenává historický požadavek formátu. Není důkazem autenticity ani doporučením nového bezpečnostního návrhu. Součet v METS a součet seznamu checksumů v info.xml nejsou totéž.

## XML a ověření

Všech 14 pravidel má [výřezy dodaného SIP](xml-examples.md): celou skupinu MC (sdílenou dvěma pravidly), první `file`, jeho `FLocat` nebo první fyzickou stránku s pěti `fptr`. Celý zdrojový hlavní METS má SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`. Výřezy zachovávají hodnoty, mají XPath, namespace, otisk souboru a datum kontroly. Záznam souboru leží mimo výřez fyzické stránky; ukázka není samostatný SIP.

Testy ověřují datové schéma, zdroje, podmínky, vztahy, klasifikaci v mapě a API, původ povinnosti a syntaxi XML. Skript `verify-xml-examples.py --source-root …` navíc porovná výřezy s lokálním balíčkem. **Nejde o úplnou validaci SIP podle NDK, XSD ani o ověření chování ProArcu či Komplexního validátoru.** Kontroly `custom` jsou přesným popisem požadovaných kontrol pro budoucí implementaci, nikoli kódem, který registr vykonává. Samotná přítomnost záznamu neověří velikost nebo kontrolní součet souboru.
