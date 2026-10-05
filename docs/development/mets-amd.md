# Vedlejší METS a vazby na technická metadata

Osm pravidel `NDK-MONO-METS-AMD-*` doplňuje [hlavní METS](mets-files.md) o `amd_mets.xml` jedné stránky monografie. Platí pro **DMF Monografie 2.3**, nikoli pro hlavní inventář celého svazku. V mapě registru jsou pod METS → „Vedlejší záznam a technická metadata“.

## Prameny a oddělení vrstev

[DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), s. 92 (§ 7.6.2), určuje inventář a vazby ADMID; s. 98 (§ 7.7.2) fyzickou mapu. Atributy souborů přebírá podle reprezentace z § 7.6.1, s. 90–91. Text byl porovnán s vykreslenými stránkami. Obecné možnosti a datové typy jsou samostatně doloženy [XSD METS 1.9.1](https://www.loc.gov/standards/mets/version191/mets.xsd).

Jde opět o slovní povinnosti: `obligation: mandatory`, `obligation_source: prose`, bez domýšlení kódu M nebo MA. U ADMID je povinnost podmíněná reprezentací MC/ALTO s vlastním PREMIS Object nebo MIX. Podmínka nesmí být založena na přítomnosti samotného ADMID.

## Přehled

Společný prefix je `NDK-MONO-METS-AMD-`.

| Přípona ID | Požadavek a kontext |
|---|---|
| FILESEC | Inventář souborů v kořeni vedlejšího METS |
| FILE-GROUP | Jediné fileGrp pro stránku, bez přenosu názvů skupin z hlavního METS |
| FILES | Samostatná evidence MC, ALTO a OCR stránky |
| FILE-ATTRIBUTES | Atributy podle reprezentace; SEQ je vyžadováno u MC, ne automaticky u ALTO/OCR |
| ADMID | Odkazy na techMD, které skutečně popisují danou reprezentaci |
| STRUCTMAP | Přítomnost fyzické mapy; žádná logická mapa |
| PAGE-DIV | Jediný div typu MONOGRAPH_PAGE, bez dalších vnořených div |
| FPTR-FILEID | Odkazy stránky na místní file pro MC, ALTO a OCR |

`ADMID` je seznam XML IDREFS, nikoli jediné ID ani cesta. Jeho kardinalita 1–1 označuje jeden atribut, ne jeden token. Názvy typu `OBJ_002` nejsou univerzální a nelze je určit pořadovým číslem. Obecné METS umožňuje odkazovat na různé administrativní sekce; tento požadavek DMF míří na příslušná techMD.

Podmínka `document_role = amd_mets` udržuje oddělenou působnost hlavních a vedlejších pravidel. Typ reprezentace se neurčuje předepsaným ID skupiny hlavního METS. Vazby `related_to` mezi pravidly pouze vysvětlují souvislost, nemění podmínky jejich použití.

## Doložené nesoulady ve vzorovém SIP

Ukázky pocházejí z uživatelem dodaného balíčku [75faba8d-c629-11f0-8950-12e8557df20e](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), který v info.xml deklaruje DMF 2.3. Kontrolován byl **vedlejší METS první stránky**, nikoli plošně všechny stránky a všechny podmínky standardu. SHA-256 tohoto souboru je `4a8d9098cb15b621a0dee3fd5501a3eee2b107088dc728dcace2a36f1e2b583f`.

| Pozorovaný zápis | Závěr z porovnání |
|---|---|
| Čtyři fileGrp: MC_IMGGRP, UC_IMGGRP, ALTOGRP, TXTGRP | Neodpovídá jedinému fileGrp požadovanému na s. 92 |
| `mc_0001/@ADMID = "OBJ_002 MIX_002"` | Oba cíle identifikují PS, nikoli MC; MIX_002 uvádí formát image/tiff |
| `alto_0001/@ADMID = "OBJ_003"` | Cílový PREMIS Object identifikuje MC, nikoli ALTO |

V detailu ADMID jsou kromě obou záznamů file také výřezy identifikátorů PREMIS z OBJ_002 a OBJ_003 a základních informací MIX_002. Rozpor je tedy viditelný z doložených dat, nejen z komentáře. Odkazovaná ID existují, ale to samo nezaručuje správnou sémantickou vazbu. Zjištění není důkazem poškození obrazových dat ani záznamem výsledku externího validátoru.

Ukázky **neopravujeme** a nevydáváme je za vyhovující šablony. U dotčených pravidel mají výslovné upozornění a pole `discrepancies`. Pravidla zůstávají normativní: nesoulad vzoru s DMF sám o sobě nečiní normativní požadavek sporným.

## Překlep a meze výkladu

- Na s. 98 je vytištěno `FILEI`; XSD a odpovídající vazby na s. 93 používají `FILEID`. Pravidlo používá doložený název a překlep eviduje, nevytváří nový atribut.
- Výčet MC, ALTO a OCR nezaměňujeme za doložený zákaz další reprezentace UC. Vzor UC obsahuje; to samo nemění povinný rozsah pravidla. Stejně tak sem nepřidáváme povinnost odkazu na amd_mets.xml samotný.
- U strukturální mapy je zachyceno omezení na fyzický typ, nikoli dodatečně domyšlený číselný limit map. Naopak jediný div stránky je ve zdroji výslovný. Hodnota LABEL z ukázky se nepovyšuje na povinnost.
- Jediná skupina a typ MONOGRAPH_PAGE jsou požadavky NDK, ne obecného XSD. Obsah PREMIS/MIX zde nespecifikujeme kompletně; řešíme jeho vazbu na soubor.

## Testy a meze ověření

Testy kontrolují rozsah pravidel, původ povinností, stránky pramenů, referenční integritu, klasifikaci v mapě/API a zachování doložených nesouladů ve výřezech. Ověření [XML ukázek](xml-examples.md) kontroluje syntaxi, otisk zdrojového souboru a shodu vybraného uzlu. Neprovádí úplnou XSD ani NDK validaci SIP a nezjišťuje aktuální chování ProArcu či Komplexního validátoru. Popisy kontrol `custom` nejsou spustitelným validačním enginem registru.
