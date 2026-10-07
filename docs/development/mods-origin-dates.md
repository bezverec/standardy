# Data vydání a dalších událostí v MODS jednosvazkové monografie

Sedm pravidel `metadata/mods-origin-dates` navazuje na [originInfo](mods-origin.md). Zahrnuje dateIssued, atributy encoding/point/qualifier/calendar a dateOther s povinným type. Platí pro záznam svazku jednosvazkové monografie, ne automaticky pro titul vícesvazku, stránku, relatedItem nebo subject.

Na tuto sadu navazují [copyrightDate, dateCreated, edition a issuance](mods-origin-completion.md). Jejich odlišný význam se zde uvádí tam, kde brání chybnému převodu do dateIssued nebo dateOther.

## Podklady

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 53.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): originInfoDefinition, dateDefinition, dateOtherDefinition a zděděný textový typ.
- [MARC 008, All Materials](https://www.loc.gov/marc/bibliographic/bd008a.html), May 2026: význam pozic 06, 07–10 a 11–14.
- [MARC 260](https://www.loc.gov/marc/bibliographic/bd260.html), September 2011, $c/$g; [MARC 264](https://www.loc.gov/marc/bibliographic/bd264.html), July 2022, druhý indikátor a $c.

Ověřeno 7. 10. 2026, textově i vizuálně proti tabulce DMF. Národní povinnosti jsou odděleny od možností obecného MODS a od neověřeného chování aplikací.

## Sedm pravidel

Prefix je `NDK-MONO-MODS-SINGLE-`.

| Pravidlo | Obsah | Povinnost |
|---|---|---|
| DATE-ISSUED | Datum vydání a jeho přípustné zdroje | M |
| DATE-ISSUED-ENCODING | Encoding=marc pro datum z 008 | R |
| DATE-ISSUED-POINT | Označení mezí rozmezí z 008 | MA |
| DATE-ISSUED-QUALIFIER | Upřesnění nepřesného, odvozeného nebo sporného data | R |
| DATE-ISSUED-CALENDAR | Určení kalendáře | O |
| DATE-OTHER | Doplňující datum vytvoření, distribuce nebo výroby | R |
| DATE-OTHER-TYPE | Typ každého použitého dateOther | M |

Sada zachovává dvě M, jedno MA, tři R a jedno O. Doporučená a volitelná pole mají minimum 0; atributy mají maximum 1 v konkrétním elementu. DateIssued a dateOther jsou opakovatelné. R není nahrazeno RA či M.

## Povinné datum vydání není libovolné datum

DateIssued podle DMF čerpá z 260$c, 264_1$c a 008/07–10, případně 008/07–14. Datum výroby z 260$g/264_3$c, distribuce z 264_2$c nebo copyrightu z 264_4$c se sem nepřesouvá jen proto, že je jediné známé.

Povinnost kontrolujeme na úrovni MODS záznamu a dat v jeho přímých originInfo. Není podmíněna už existujícím správným dateIssued ani dostupností libovolného jiného data. Neznamená kopírovat datum vydání do každého opakovaného originInfo pro distribuci, výrobu či copyright. DateOther povinné dateIssued nenahradí.

Obecný MODS používá textový typ, nikoli xs:date. Volný přepis [1890] proto není automaticky schématovou chybou jen kvůli hranatým závorkám. Textové datum a kódované datum se mohou opakovat; nesmějí být mechanicky sloučeny či omezeny na jediný výskyt.

## MARC 008: dvě hodnoty nejsou vždy interval

Význam Date 1 a Date 2 určuje 008/06. Například t rozlišuje vydání a copyright, r reedici a původní vydání a e může ve druhé části uvádět měsíc a den. Dvě neprázdné položky ani dva různé roky samy nedokládají rozmezí. Kód q naopak vyjadřuje nejistou dataci pomocí krajních možných let. Toto vysvětlení není úplným převodníkem všech kombinací MARC.

Point=start/end má MA jen pro skutečné rozmezí převzaté z 008. Při jeho převodu je třeba zachovat obě meze, správné přiřazení a souvislost opakovaných dateIssued. Dva atributy start nejsou dvojice start/end. Samostatná datace nebo textové datum z 260/264 nedostává point jen proto, že se v záznamu nachází ještě jiné datum.

Neznámé a neúplné datace se nemění na přesné roky či nuly. Sada nezavádí plošný čtyřciferný regex a neprohlašuje všechny přípustné výplňové znaky MARC za vhodný obsah každého MODS data.

## Encoding, qualifier a calendar

Encoding=marc má R a je v DMF vyhrazeno údaji z 008. Neznamená „pochází z katalogu“, a tedy se automaticky nepřipojuje k volnému přepisu 260$c/264_1$c. Obecné MODS dovoluje také w3cdtf, iso8601, temper a edtf; zdejší doporučení není obecným schématovým zákazem těchto hodnot. Chybějící doporučené encoding se nesmí vykazovat jako chybějící povinný atribut.

Qualifier má R: approximate pro nepřesné datum, inferred pro datum odvozené z jiného zdroje a questionable pro sporné datum. Nejistota a způsob odvození nejsou zaměnitelné. Hranaté závorky ve vzoru samy nedokazují konkrétní qualifier; známému přesnému datu se upřesnění nevymýšlí.

Calendar je O a národní výčet obsahuje gregorian, hebrew a julian. XSD má pouze xs:string. Nepřítomnost není chyba a doplnění gregorian není univerzální oprava. Označit kalendář neznamená přepočítat datum mezi kalendáři.

## DateOther a jeho type

| Zdroj podle DMF | Význam | Povinné type |
|---|---|---|
| 264_0, datum v $c | Vytvoření | production |
| 264_2, datum v $c | Distribuce | distribution |
| 260$g / 264_3, datum v $c | Výroba nebo tisk | manufacture |

Samotné dateOther je doporučené; jakmile se použije, jeho type je povinné. Podmínkou kontroly type není už existující atribut. Typ musí odpovídat události i zdrojovému údaji, nestačí libovolný člen seznamu.

Type data není roleTerm agenta: producer a manufacturer zde nenahrazují production a manufacture. Stejně tak dateOther/@type není totožný uzel s originInfo/@eventType. V obecném XSD je type nepovinné xs:string; povinnost a trojici hodnot přidává DMF.

U rukopisů je třeba rozlišit také samostatný řádek dateCreated. Tato sada neřeší všechny jeho podmínky ani nepřesouvá libovolné datum vytvoření do jiného pole. Samostatná kontrola převodu do dc:date není součástí sady.

## Kontext podmínek

Všechna pravidla mají object_type=monograph, document_role=main_mets a bibliographic_level=single_volume.

| Kontext | Použití |
|---|---|
| mods_record | DATE-ISSUED a DATE-OTHER |
| mods_date_issued + origin_date_source=marc_008 | Doporučené ENCODING |
| mods_date_issued + origin_date_source=marc_008 + origin_date_range_available=true | Podmíněně povinné POINT |
| mods_date_issued | QUALIFIER a CALENDAR |
| mods_date_other | Povinné TYPE |

Jde o sémantické kontexty, ne nové XML atributy. Původ z 008 se neurčuje podle přítomnosti encoding=marc. Dostupnost rozmezí se neurčuje podle přítomnosti point či počtu dat. Neznámý zdroj nebo význam není false ani potvrzení správnosti. Omezení použití encoding=marc a point mimo jejich zdrojový kontext je uvedeno také v custom kontrole DATE-ISSUED, která se nevypíná podle platnosti kontrolovaného atributu.

Elementy používají namespace `http://www.loc.gov/mods/v3`; atributy jsou bez namespace. XSD 3.8 má encoding, point, qualifier a calendar volitelné; konkrétní verzi dokládá citované schéma, nikoli samotný namespace.

## Zdrojové ukázky a ověření

Tři ukázky u dvou pravidel vycházejí ze dvou skutečných uzlů [vzorového SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download): dateIssued s [1890] a dateIssued s encoding=marc a hodnotou 1890. Druhý uzel je použit také u pravidla encoding. Nejde o dvě meze intervalu.

Soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml` má SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`. Výchozí XPath:

```text
/mets:mets/mets:dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:originInfo
```

DateIssued[1] a dateIssued[2] pouze ukotvují uzly zdroje, neurčují normativní pořadí. Vzor v tomto originInfo nemá dateOther ani point, qualifier a calendar; pro tyto větve nepřidáváme vymyšlené zdrojové ukázky.

Původní MARC nebyl analyzován. Shoda výřezů se SIP neprokazuje úplnou správnost převodu ani platnost celého balíčku. Registr nyní obsahuje 227 pravidel, z toho 50 pro MODS, a 211 XML ukázek u 165 pravidel. Testy ověřují přepis, povinnosti, kontexty, slovníky, vazby, API filtry a mapu registru. **Custom kontroly registr nevykonává**; nejde o nově implementovaný validátor SIP.
