# Jazykové údaje MODS jednosvazkové monografie

Sada přidává pět pravidel DMF Monografie 2.3 pro přímé `language` v MODS záznamu svazku jednosvazkové monografie. Nezahrnuje jazyk katalogizace, další bibliografické úrovně ani periodika.

## Prameny a rozsah

Primárním pramenem je [DMF Monografie 2.3, § 7.4.1.3, s. 54](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf). Tabulka i legenda na s. 24 byly 8. 10. 2026 zkontrolovány vizuálně. Jazykové řádky nejsou červeně vyhrazené pro RDA: všech pět pravidel má společný bibliografický rozsah AACR2/RDA, nikoli technickou nezávislost.

Obecné typy a kardinality byly ověřeny v [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd). Sémantiku doplňují [MODS User Guidelines — language](https://www.loc.gov/standards/mods/userguide/language.html), [MARC 21 — 041](https://www.loc.gov/marc/bibliographic/bd041.html) a [číselník ISO 639-2](https://www.loc.gov/standards/iso639-2/php/code_list.php). Přidáno je pět samostatných entit MODS; národní omezení nejsou vydávána za vlastnosti XSD.

## Pravidla

ID mají společný prefix `NDK-MONO-MODS-SINGLE-`.

| Přípona ID | Kontrolovaný údaj | Povinnost | Rozsah kardinality |
|---|---|---|---|
| LANGUAGE | Jazyk obsahu; pro více jazyků opakovat kontejner | M | 1..n na MODS záznam svazku |
| LANGUAGE-OBJECT-PART | Část či role jazykového údaje podle DMF | MA | 0..1 na language; při dostupnosti požadovat |
| LANGUAGE-TERM | Kód jazyka ISO 639-2/B | M | 1..n na language |
| LANGUAGE-TERM-TYPE | `type=code` | M | 1..1 na languageTerm |
| LANGUAGE-TERM-AUTHORITY | `authority=iso639-2b` | M | 1..1 na languageTerm |

## Sémantické hranice

- **Více jazyků versus více termínů:** různé jazyky mají samostatné `language`. Opakované `languageTerm` uvnitř jednoho kontejneru představují tentýž jazyk různými termíny. XSD dovoluje 1..n termínů; DMF neukládá přesně jeden, ale pro všechny zde požaduje kód a bibliografickou autoritu.
- **Jazyk obsahu není jazyk metadat:** pravidla nekontrolují `recordInfo/languageOfCataloging` ani atributy `lang` a `xml:lang`. Shodná hodnota v obou místech nenahrazuje chybějící jazyk obsahu.
- **MA není dobrovolnost:** dostupnost údaje pro `objectPart` se zjišťuje ze zdrojového popisu či předlohy, ne z přítomnosti cílového atributu. Neznámá dostupnost není doložená absence. Nelze požadovat všechny čtyři hodnoty ani připsat část každému jazyku hlavního obsahu.
- **Bibliografické B versus terminologické T:** ISO 639-2 obsahuje u některých jazyků dvě varianty, například `cze` a `ces`. DMF požaduje B. Správný atribut autority ani tři písmena samy neprokazují správnost kódu; slovník nenahrazujeme částečným výčtem či regulárním výrazem.
- **Národní omezení není obecný zákaz:** XSD dovoluje textovou reprezentaci a volnou autoritu; DMF zde požaduje `code` a `iso639-2b`. Pravidla se automaticky nepřenášejí do jiných úrovní popisu.

### Význam objectPart=translation

DMF uvádí mapování `summary → 041$b`, `table of contents → 041$f`, `accompanying material → 041$g` a `translation → 041$h`.

Poslední název může být zavádějící: MARC `041$h` označuje **jazyk originálu**, kdežto jazyk přeloženého textu patří do `041$a`. Registr zachovává doslovné `translation` z DMF, nepřejmenovává je na `original` a v pravidle výslovně vysvětluje mapování. Jde o upozornění na význam názvu, ne o doloženou chybu celé vazby nebo nově zavedený zákaz.

## XML důkaz

Použita je dodaná lokální kopie [vzorového monografického SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), která v info.xml deklaruje verzi 2.3. V hlavním METS, MODSMD_VOLUME_0001, je jeden přímý jazykový blok s `cze`, `authority=iso639-2b` a `type=code`. Úroveň potvrzuje strukturální odkaz na svazek; nevybíráme stejně vypadající jazyk katalogizace.

Celý zdrojový soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml` má SHA-256:

```text
7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473
```

Čtyři pravidla mají čtyři položky ukázek: celý language a sdílený výřez languageTerm. Nejde o čtyři různé zdrojové výskyty. Atribut `objectPart` ve vybraném bloku není, proto pro něj není vymyšlený příklad. Původní MARC ani úplná validita SIP nebyly ověřovány; shoda lokální kopie s dnešním vzdáleným archivem není tímto potvrzena.

## Kontroly a meze

Testy hlídají kódy M/MA, rozsah rodičů, opakování, oddělení jazyka katalogizace, varianty B/T, vazbu translation na originál a zdůvodněný společný katalogizační rozsah. XML ukázky mají XPath a otisk souboru a porovnávají se s lokálním SIP.

Popsané `custom` kontroly nejsou spustitelný validátor. Chování ProArcu, validátoru NDK či jiných nástrojů nebylo testováno. Sada neuděluje porovnávací klíče bez samostatného významového posouzení protějšku. Změny v repozitáři samy neznamenají publikaci do veřejné databáze.

Lokální ověření 8. 10. 2026: validace 273 YAML dokumentů, typová kontrola, 297 testů ve 43 souborech a celé sestavení prošly. Kompilovaný registr obsahuje 263 pravidel (245 monografických a 18 periodických), 204 entit a 230 XML ukázek u 184 pravidel. Porovnání všech 223 monografických výřezů s příslušným lokálním SIP ověřilo XML, SHA-256 i obsah zdrojových uzlů. Kontrola diffu prošla. Jde o záznam lokálních kontrol; stav nasazení se ověřuje shodou dataset_version ve veřejném API a exportech.
