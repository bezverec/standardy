# PREMIS Object: identifikace, fixity a formát

Skupina obsahuje **17 pravidel DMF Monografie 2.3** pro souborové objekty **PREMIS 2.2**. Navazuje na [vedlejší METS a odkazy ADMID](mets-amd.md). V mapě a filtrech registru patří do oblasti administrativních a technických metadat, standardu PREMIS a tématu `technical/premis-object`.

## Rozsah a podmínky

Zdrojem je [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.5.1, s. 76–78; legenda povinností je na s. 75. Verze PREMIS 2.2 je uvedena v přehledu standardů na s. 5. Obecná struktura byla porovnána s [oficiálním XSD PREMIS 2.2](https://www.loc.gov/standards/premis/v2/premis-v2-2.xsd), nikoli s novějším PREMIS 3.

Pravidla se vztahují na monografii, vedlejší METS a reprezentace MC, PS a ALTO. Označení XML v tabulce DMF zde normalizujeme na roli ALTO; nejde o libovolný XML soubor. OCR.TXT a UC jsou z této skupiny vyloučeny. [Vznik, původní název a úroveň ochrany souboru](premis-provenance.md) popisuje navazující skupina osmi pravidel a [vazby objektů a událostí](premis-relationships.md) dalších třináct pravidel. [PREMIS Event](premis-events.md) nyní popisuje samostatná skupina 16 pravidel. Další reprezentace objektů a úplný PREMIS Agent tím nejsou zpracovány.

Podmínka `premis_object_type = file` označuje vyhodnocený typ v namespace `info:lc/xmlns/premis-v2`, nikoli požadavek na konkrétní prefix v `xsi:type`. Podmínky nevycházejí z přítomnosti kontrolovaného dítěte — chybějící povinný prvek musí být možné zjistit. Samotnou povinnost vytvořit celý objekt PREMIS tato skupina nenahrazuje.

## Přehled pravidel

Všech 17 údajů má v citované tabulce DMF výslovný kód **M**. Číselné kardinality v tabulce popisují obecné schéma; povinnost NDK se řídí písmenem podle legendy. Níže je účinná kardinalita pro NDK, vždy **v každém bezprostředním rodiči**.

| Prvek | Kardinalita NDK | Podstatný rozdíl nebo mez |
|---|---|---|
| objectIdentifier | 1–n | Pár typu a hodnoty; není to ID obalové sekce techMD |
| objectIdentifierType | 1–1 | Kontrolovaný slovník kontextů, nikoli pevný seznam příkladů NDK/ANL |
| objectIdentifierValue | 1–1 | Hodnota jednoznačná v deklarovaném kontextu |
| objectCharacteristics | 1–n | Kontrolují se všechny bloky |
| compositionLevel | 1–1 | Nezáporné celé číslo; 0, 1 a 2 nejsou uzavřený seznam |
| fixity | 1–n | XSD dovoluje 0–n; M vyžaduje přítomnost |
| messageDigestAlgorithm | 1–1 | MD5 je příklad, nikoli jediný povolený algoritmus |
| messageDigest | 1–1 | Tvar i výpočet závisí na algoritmu |
| messageDigestOriginator | 1–1 | V XSD volitelný; JHOVE není předepsaná hodnota |
| size | 1–1 | Bajty; obecné xs:long, význam velikosti vyžaduje nezápornost |
| format | 1–n | ALTO může mít samostatný popis XML i ALTO, nemusí mít přesně dva |
| formatDesignation | 1–1 | NDK požaduje označení i registr, nikoli pouze jednu větev volby XSD |
| formatName | 1–1 | Není omezen jen na MIME typ |
| formatVersion | 1–1 | Řetězec verze souborového formátu, nikoli verze DMF nebo ICC |
| formatRegistry | 1–1 | Povinný společně s formatDesignation |
| formatRegistryName | 1–1 | DMF výslovně vyžaduje PRONOM |
| formatRegistryKey | 1–1 | PUID příslušného formátu; fmt/155 je pouze příklad |

## Fixity, velikost a historické objekty

Požadavek METS `CHECKSUMTYPE=MD5` se automaticky nepřenáší na všechny záznamy PREMIS fixity. Různé bloky mohou používat různé algoritmy; bez znalosti algoritmu nelze předepsat univerzální délku nebo regulární výraz pro součet. Porovnání PREMIS s METS má smysl pouze pro **stejný soubor a stejný algoritmus**.

DMF požaduje uchovat metadata i po smazání původního skenu PS. Historická velikost a součet proto zůstávají povinné, i když soubor již není dostupný a nelze je přepočítat. Nedostupnost historického PS sama o sobě není důvodem vynechat tyto údaje.

## Doložené ukázky

Každé pravidlo má výřez z `OBJ_003` vedlejšího METS první stránky dodaného [vzorového SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download). Pravidlo `FORMAT` má navíc výřez ALTO z `OBJ_004`: celkem **18 ukázek**. Výřezy uchovávají XPath, otisk zdrojového souboru a datum kontroly.

Záznam MC vybíráme podle identifikátoru `MC_1_00010003_2R`, nikoli podle nesprávného ADMID ve vzoru. Dříve doložené odkazy MC na PS a ALTO na MC se neopravují a nezakrývají.

Dne 5. 10. 2026 byly oproti skutečným souborům první stránky samostatně ověřeny:

| Soubor | Velikost v bajtech | MD5 |
|---|---:|---|
| mastercopy/mc_75faba8d-c629-11f0-8950-12e8557df20e_0001.jp2 | 3523405 | 2f6a5856f32ad60c5e68989beafbdef8 |
| alto/alto_75faba8d-c629-11f0-8950-12e8557df20e_0001.xml | 5693 | a5cceecc68f28b235510803181545aab |

Obě dvojice odpovídají příslušným záznamům PREMIS. Tato kontrola **nepotvrzuje validitu celého SIP**, správnost všech stran ani výsledek externího validátoru.

Další meze ukázek:

- `objectIdentifierType=file` je zachovaná hodnota, ale její příslušnost k doloženému kontrolovanému slovníku nebyla ověřena.
- `Utility GeneratePremis` je zaznamenaný původce součtu, nikoli důkaz verze či chování nástroje.
- Přiřazení `x-fmt/392` a `fmt/101` ke skutečným formátům nebylo nezávisle ověřeno proti PRONOM.
- ALTO obsahuje jediný popis `text/xml`; druhý popis nebyl do příkladu domyšlen.

## Ověření a implementace

Přepis byl zkontrolován v textu i vykreslených tabulkách DMF a v XSD PREMIS 2.2. Testy registru kontrolují scope, povinnosti, opakovatelnost, vlastnictví entit, filtry, grafové vazby a původ XML ukázek. Postup opakování kontroly výřezů je v [dokumentaci XML ukázek](xml-examples.md).

Výrazy `custom` popisují zamýšlené kontroly; **registr je nevykonává**. Chování JHOVE, jpylyzeru, ProArcu ani Komplexního validátoru pro tuto skupinu nebylo tímto doplněním ověřeno.
