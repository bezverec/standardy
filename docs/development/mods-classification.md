# Klasifikační údaje MODS

Sada tří pravidel kategorie `metadata/mods-classification` popisuje přímé classification v MODS svazku **jednosvazkové monografie** v hlavním METS podle DMF Monografie 2.3. Navazuje na [věcné údaje](mods-subject.md), ale classification není potomkem subject.

## Prameny a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 56; text i celá vykreslená tabulka ověřeny 11. 10. 2026.
- Legenda s. 24: povinnost potomka uvnitř použitého rodiče a barevné rozlišení AACR2/RDA. Černé řádky této sady jsou společné oběma režimům; nejde o technickou nezávislost.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): modsDefinition, modsGroup, classificationDefinition, stringPlusLanguagePlusAuthority a authorityAttributeGroup.
- [LOC Classification Scheme Source Codes](https://www.loc.gov/standards/sourcelist/classification.html): otevřený seznam klasifikačních schémat; jeho současný stav se nevydává za historickou revizi DMF.

ID mají prefix `NDK-MONO-MODS-SINGLE-`.

| Suffix | Pole | Kód DMF | Kardinalita v platném kontextu |
|---|---|---|---|
| CLASSIFICATION | classification | R | 0..n na záznam svazku |
| CLASSIFICATION-AUTHORITY | classification/@authority | M | 1..1 na použité classification |
| CLASSIFICATION-EDITION | classification/@edition | MA | 1..1 při doloženém původu této klasifikace z 072$a |

M atributu nemění doporučené R rodiče na povinný element. Požadavky se nepřenášejí na relatedItem, stranu ani titul vícesvazku. Sloupec dc:subject nevytváří další pravidlo DC. Nové porovnávací klíče nebyly přiděleny.

## Mapování zdrojových polí

| Zdroj konkrétní klasifikace | Authority podle DMF | Povinnost edition z tohoto řádku |
|---|---|---|
| MARC 080$a | udc | není stanovena |
| MARC 072$a | udc | Konspekt |
| MARC 072$9 | Konspekt | není stanovena |

Jedno pole MARC 072 může mít $a i $9; nejde o vzájemně výlučné varianty celého bibliografického záznamu. Každý převáděný údaj se posuzuje samostatně. Klasifikační znaky jsou text, nikoli obecně čísla.

DMF připouští také lcc, ddc, nlm, sudocs, candocs a další hodnoty podle LOC. Proto authority nemá uzavřené `allowed_values`. Národní zápis **Konspekt** se nepřepisuje na lowercase.

### Edition: podmínka nesmí být kruhová

Zachováváme tabulkové **MA** a současně slovní upřesnění povinnosti pro 072$a. Podmínka `classification_source_marc_subfield=072$a` musí být doložena zdrojovým MARC nebo informací o převodu této konkrétní klasifikace; nikoli přítomností cílového edition nebo pouhým výskytem libovolného pole 072 v záznamu.

Samotné **authority=udc nestačí**, protože jej používá i 080$a. Neznámý původ není prokázaná nepoužitelnost ani splnění. Slovo „pouze“ vymezuje povinnost; není implementováno jako obecný zákaz edition mimo tuto podmínku. Konstantu Konspekt kontrolujeme jen v platném kontextu této národní povinnosti.

Obecné MODS má authority i edition nepovinné a typu xs:string; XSD nevyžaduje národní mapování. Classification/@edition není originInfo/edition, které popisuje vydání dokumentu.

### Otevřená otázka candocs

DMF uvádí candocs, ale tento kód nebyl nalezen v současném seznamu LOC, který obsahuje cacodoc pro CODOC. To samo neprokazuje překlep ani zaměnitelnost. Zachováváme přepis vydaného DMF, neprovádíme automatickou náhradu a historický výklad ponecháváme k odbornému dořešení. Stav verified znamená ověřený přepis pramene, nikoli vyřešení této otázky.

## Tři skutečné XML ukázky

[Vzorový SIP monografie](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download) deklaruje DMF 2.3, MODS 3.8 a descriptionStandard=aacr. Kontext MODSMD_VOLUME_0001 je doložen žánrem volume, issuance=single unit a vazbami DMDID fyzické i logické mapy.

Hlavní METS má SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`. Obsahuje pět přímých classification, všechny s authority=udc a bez edition. Vybrány jsou celé elementy na jednoznačných XPath:

- classification[1] s textem 621.3-051;
- classification[4] s textem (73);
- první element znovu u pravidla authority, aby byl patrný rodič atributu.

Tři výřezy u dvou pravidel nejsou třemi různými soubory ani číselníkem. Původní MARC není ověřen; absence edition proto není důkazem chyby ani splnění MA. Ukázka edition se nevymýšlí a vzor AACR2 se nevydává za ověření RDA.

## Kontroly a omezení

Lokální ověření 11. 10. 2026:

- validace všech 301 YAML dokumentů a typová kontrola prošly;
- všech 334 testů ve 48 souborech prošlo, včetně rodičovského kontextu, zdrojové podmínky edition a otevřeného seznamu authority;
- celé sestavení prošlo: 291 pravidel (273 monografických a 18 periodických), 229 entit a 1577 relací;
- registr obsahuje 253 XML ukázek u 198 pravidel; všech 246 monografických výřezů prošlo kontrolou syntaxe, SHA-256, jednoznačnosti XPath a shody se zdrojovým SIP;
- kontrola diffu prošla.

Registr deklarativní custom kontroly nad SIP nevykonává. Konverzní implementace, správnost klasifikačních znaků a celý SIP nebyly validovány. Sestavení ani tato dokumentace nepotvrzují nasazení; publikovanou revizi určuje shoda dataset_version ve veřejném API a exportech.
