# Fyzický popis MODS jednosvazkové monografie

Sada přidává devět pravidel pro fyzický popis předlohy v přímém MODS záznamu svazku jednosvazkové monografie, DMF Monografie 2.3. Nepopisuje technické parametry obrazových souborů, přílohy, stránky, titul vícesvazku ani periodika.

## Prameny a katalogizační rozsah

[DMF Monografie 2.3, § 7.4.1.3, s. 54–55](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf) a legenda na s. 24 byly 8. 10. 2026 ověřeny vizuálně, včetně pokračování atributu type na další straně. Černé společné požadavky se odlišují od červených doplňků RDA. Čtyři pravidla mají společný rozsah, jedno vymezuje autority AACR2 a čtyři jsou pro RDA. Nejde o technicky nezávislé požadavky.

Obecné deklarace vycházejí z [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd); doporučení a sémantiku doplňují [MODS User Guidelines — physicalDescription](https://www.loc.gov/standards/mods/userguide/physicaldescription.html), [MARC 337](https://www.loc.gov/marc/bibliographic/bd337.html), [MARC 338](https://www.loc.gov/marc/bibliographic/bd338.html) a [MARC 300](https://www.loc.gov/marc/bibliographic/bd300.html).

## Přidaná pravidla

ID mají prefix `NDK-MONO-MODS-SINGLE-`. Rozdělení autority do dvou pravidel zachovává odlišný výčet, nikoli dvě různé entity XML.

| Přípona ID | Rozsah | Povinnost | Význam |
|---|---|---|---|
| PHYSICAL-DESCRIPTION | AACR2 i RDA | M | Kontejner fyzického popisu předlohy |
| FORM | AACR2 i RDA | M | Fyzická forma podle příslušných pozic 008/007 |
| FORM-AUTHORITY-AACR | AACR2 | M | marcform, marccategory, marcsmd nebo gmd |
| FORM-AUTHORITY-RDA | RDA | M | Základní čtveřice, navíc rdamedia a rdacarrier podle role údaje |
| FORM-RDA-MEDIA | RDA | Nepovinné, slovně | Typ média z 337 |
| FORM-RDA-CARRIER | RDA | Povinné, slovně | Typ nosiče z 338 |
| FORM-RDA-TYPE | RDA, údaj média/nosiče | MA | media pro 337, carrier pro 338 |
| PHYSICAL-EXTENT | AACR2 i RDA | RA | Rozsah a rozměry z 300$a, $b, $c |
| PHYSICAL-NOTE | AACR2 i RDA | RA | Samostatná poznámka o fyzickém stavu |

## Důležité hranice

### M, MA, RA a slovní povinnosti

Povinný kontejner nečiní extent a note povinnými. Jejich **RA** zůstává doporučením při dostupnosti údaje, nikoli M nebo zpětně zjednodušeným R. Atribut form/type zachovává **MA**; dostupnost a roli údaje nelze zjišťovat pouze z existence kontrolovaného XML.

Řádek form má tabulkové M, ale jeho RDA doplňky rozlišují slovní **NEPOVINNÉ** pro 337 a **POVINNÉ** pro 338. Samostatná pravidla proto používají `obligation_source: prose`, bez domyšlených kódů O a M. Povinný nosič nelze vypnout podmínkou „jen pokud existuje 338“; chybějící podklad vyžaduje posouzení, nikoli vymyšlení hodnoty.

### Autorita, typ a hodnota jsou různé údaje

- Při zápisu média je vazba `337 → rdamedia → type=media`; u nosiče `338 → rdacarrier → type=carrier`. Type se posuzuje podle MA, autorita podle M.
- Nestačí, že autorita patří do sjednoceného výčtu: musí odpovídat konkrétní roli. Autority nejsou zaměnitelné a nepožadují se všechny současně.
- Základní čtyři autority nejsou v DMF pro RDA vyškrtnuty. Registr je svévolně nenahrazuje pouze dvojicí RDA.
- `print`, `microfilm`, `bez média` a `svazek` jsou příklady, nikoli úplné číselníky nebo výchozí hodnoty pro každý dokument.
- MARC 337/338 rozlišuje slovní termín v $a a kód v $b. Tabulka DMF odkazuje na celé pole a uvádí slovní příklad; registr nepřidává nedoložený univerzální převod podpolí.
- Typ obsahu z 336, médium z 337 a nosič z 338 nejsou totéž. Ani MIME typ digitálního souboru nenahrazuje fyzickou formu předlohy.

Předpis type je v DMF vyhrazen RDA. Sada z toho nevyrábí samostatný výkladový zákaz atributu v AACR2 ani tvrzení, že obecné MODS dovoluje jen media/carrier. Obecné XSD má volitelný řetězec.

### Rozsah a rodičovský kontext

Kardinalita kontejneru je 1..n podle povinnosti DMF a opakovatelnosti XSD. MODS User Guidelines opakování kontejneru nedoporučují; nejde však o zákaz v XSD ani doložené národní max=1. RDA médium/nosič se počítají na úrovni svazku napříč jeho přímými kontejnery, ne jako povinné duplikace v každém dalším bloku.

Extent je text: podpole 300$a, $b a $c jednoho výskytu pole se spojí, různé výskyty 300 mají samostatné extent. Nevyžaduje se číselný typ, shoda s počtem skenů ani struktura part/extent/start/end. Text může zahrnovat rozsah i rozměry.

Note zde patří pod physicalDescription. Následující top-level note a jeho type v tabulce představují jiný kontext; jejich povinnosti se nepřenášejí. Obecná poznámka o původci či vydání není ukázkou fyzického stavu.

## XML ze vzorového SIP

[Dodaná lokální kopie monografického SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download) deklaruje DMF 2.3 a ve svazku `descriptionStandard=aacr`. Hlavní METS propojuje MODSMD_VOLUME_0001 se svazkem VOLUME. Zdrojový soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml` má SHA-256:

```text
7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473
```

Výřezy zachovávají tři form: `marcform/print`, `marccategory/text`, `marcsmd/regular print`, a extent `14 s. ; 16 cm`. Přidáno je osm položek ukázek u čtyř pravidel: celý kontejner, tři form, tytéž tři form pro atribut authority v AACR2 a jeden extent. Nejde o osm odlišných zdrojových uzlů ani požadavek vždy tří form.

V přímém physicalDescription není note a vzor nedokládá RDA. Proto nejsou přidány smyšlené příklady pro tyto větve. Původní MARC nebyl analyzován; hodnoty v MODS nepotvrzují samy správnost převodu 007/008/300. Deklarace aacr není novým nezávislým ověřením katalogizačního postupu. Shoda lokální kopie s aktuálním vzdáleným archivem ani úplná validita SIP se netvrdí.

## Ověření a meze

Sémantické testy kontrolují povinnosti, rodiče, různé režimy autorit, roli média/nosiče, nepodmíněnou povinnost nosiče při chybějícím 338, RA, textový extent a rozdíl fyzické a obecné poznámky. XML ukázky mají přesný XPath, zdrojový otisk a porovnání s lokálním SIP.

Custom kontroly registr nevykonává. Implementace ProArcu či validátoru NDK pro tuto sadu nebyly prověřeny. Významové klíče pro porovnání se bez samostatného posouzení nepřidělují; neexistence páru není důkaz odlišnosti nebo absence požadavku. Sada je připravena lokálně, nikoli automaticky publikována.

Kontroly 8. 10. 2026: validace 282 YAML dokumentů, typová kontrola, všech 306 testů ve 44 souborech, celé sestavení a kontrola diffu prošly. Sestavený registr obsahuje 272 pravidel (254 monografických a 18 periodických), 210 entit a 238 XML ukázek u 188 pravidel. Všech 231 monografických výřezů prošlo syntaktickou kontrolou i porovnáním SHA-256 a zdrojových uzlů s příslušnou lokální kopií SIP.
