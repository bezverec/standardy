# Věcné údaje MODS

Sada sedmi pravidel DMF Monografie 2.3 v kategorii `metadata/mods-subject` popisuje přímé věcné údaje MODS svazku **jednosvazkové monografie** v hlavním METS. Nepřenáší požadavky na stránky, relatedItem, vícesvazkové tituly ani periodika.

## Prameny a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 55–56: text i vykreslené tabulky ověřeny 10. 10. 2026. Řádek geographic/valueURI pokračuje na s. 56, nepatří ke cartographics.
- Legenda s. 24: černé řádky této sady jsou společné pro AACR2/RDA. Společný požadavek na převod není důkazem totožných katalogizačních postupů.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): modsGroup, subjectDefinition, stringPlusLanguagePlusAuthority, temporalDefinition, dateDefinition a authorityAttributeGroup.
- [LOC: subject](https://www.loc.gov/standards/mods/userguide/subject.html): význam jednotlivých složek a rozdíl mezi autoritou záhlaví a jeho části.

## Pravidla

Všechna mají **R**, nikoli M či MA. Kardinality vycházejí z obecného XSD a vztahují se k jednotlivému rodiči; nevytvářejí povinnost kontejner založit.

| Suffix ID NDK-MONO-MODS-SINGLE- | Pole | Strana | Rodič / kardinalita |
|---|---|---:|---|
| SUBJECT | subject | 55 | mods / 0..n |
| SUBJECT-AUTHORITY | subject/@authority | 55 | subject / 0..1 |
| SUBJECT-TOPIC | subject/topic | 55 | subject / 0..n |
| SUBJECT-TOPIC-VALUE-URI | subject/topic/@valueURI | 55 | topic / 0..1 |
| SUBJECT-GEOGRAPHIC | subject/geographic | 55 | subject / 0..n |
| SUBJECT-GEOGRAPHIC-VALUE-URI | subject/geographic/@valueURI | 56 | geographic / 0..1 |
| SUBJECT-TEMPORAL | subject/temporal | 56 | subject / 0..n |

DMF předpokládá převzetí věcných údajů z katalogizačního záznamu. Pro authority uvádí czenas, eczenas, **Konspekt**, czmesh, mednas, msvkth a agrovoc a vazbu na 6XX$2. Výčet popisuje národní doporučení, nikoli XSD enum. Správná autorita se neurčí přejmenováním atributu bez posouzení termínu.

Topic navazuje na kontrolovaný slovník, MARC 650 či 072$x; geographic na 651; temporal na 648. Není předepsáno, aby každý subject obsahoval všechny tři druhy údajů. Geographic není geographicCode ani místo vydání. Temporal je časové téma, ne datum vydání ani životní data osoby. XSD pro temporal nestanoví povinný typ xs:date.

ValueURI označuje jednotlivý termín, authorityURI slovník. DMF doporučuje adresu ve tvaru `https://aleph.nkp.cz/dai/číslo_autority`; nepřevádíme ji na povinný regex. Tištěná čísla autorit jsou příklady. Správnost odkazu není dána samotnou odpovědí HTTP 200. Autoritní služba ani původní MARC nebyly v této sadě ověřovány.

Samostatné cartographics, jmenná věcná záhlaví a classification zůstávají pro navazující sady. Sloupec dc:subject není zde implementován jako další pravidlo DC. Nejsou přidány významové klíče pro porovnávač; společná použitelnost AACR2/RDA není automatickým párováním.

## Pět skutečných XML výřezů

[Vzorový SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download) deklaruje v info.xml DMF 2.3. Hlavní METS obsahuje MODS 3.8 svazku v MODSMD_VOLUME_0001, genre volume, issuance single unit a descriptionStandard aacr. Na záznam odkazuje fyzická i logická mapa.

Otisk hlavního METS: `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`.

Pět ukázek u čtyř pravidel zachovává:

- společné záhlaví czenas s tématem „objevitelé a vynálezci“ a geografickým termínem „Spojené státy americké“ (sdílené u subject a authority);
- samostatný subject s geographicCode authority=marcgac, ale bez authority rodiče;
- samostatné výřezy tematického a geografického termínu bez valueURI.

Vzor neobsahuje temporal ani příslušné valueURI; ukázky těchto polí nevymýšlíme. NamePart type=date uvnitř jmenného záhlaví není temporal. Absence doporučeného atributu není chyba povinné přítomnosti. Výřezy nejsou ověřením původního MARC, členství v autoritách, RDA ani celého SIP.

## Kontroly

Lokální kontroly 10. 10. 2026:

- validace 292 zdrojových YAML dokumentů, typová kontrola a všech 320 testů ve 46 souborech prošly;
- celé sestavení prošlo: 282 pravidel (264 monografických a 18 periodických), 220 entit a 1534 relací;
- registr obsahuje 247 XML ukázek u 194 pravidel; všech 240 monografických ukázek prošlo kontrolou XML, SHA-256, jednoznačnosti XPath a shody se zdrojovým SIP;
- kontrola diffu prošla.

Registr ukládá deklarativní custom kontroly, sám je nad SIP nevykonává. Správnost autoritních přiřazení a původního MARC zůstává neověřena. Tato sada není nasazením.
