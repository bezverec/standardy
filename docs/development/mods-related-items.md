# Vztahy a edice MODS

Sedm pravidel kategorie `metadata/mods-related-items` popisuje přímé relatedItem v MODS svazku **jednosvazkové monografie** v hlavním METS podle DMF Monografie 2.3. Jde o bibliografické vztahy, nikoli PREMIS vztahy digitálních souborů.

## Prameny a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 56–57; tabulka včetně pokračování řádku EDICE vizuálně ověřena 14. 10. 2026.
- Legenda s. 24: černé řádky jsou společný bibliografický předpis AACR2/RDA, nikoli technicky nezávislá pravidla.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): modsDefinition, modsGroup, relatedItemDefinition a titleInfoDefinition.
- [LOC relatedItem](https://www.loc.gov/standards/mods/userguide/relateditem.html): význam vztahu a atributů; tento obecný pokyn je oddělen od doslovného předpisu DMF.
- [Změny MODS 3.8](https://www.loc.gov/standards/mods/changes-3-8.html), bod 2, a [LOC titleInfo](https://www.loc.gov/standards/mods/userguide/titleinfo.html): doplňující podklad pro výslovně označenou inferenci významu otherTypeAuthURI.

Pravidla mají prefix `NDK-MONO-MODS-SINGLE-RELATED-ITEM`.

| Suffix ID | Cíl | Povinnost DMF | Kardinalita v platném kontextu |
|---|---|---|---|
| bez suffixu | relatedItem | RA | 0..n na MODS záznam svazku |
| -TYPE | @type | R | 0..1 na použitý relatedItem |
| -OTHER-TYPE | @otherType | O | 0..1 |
| -OTHER-TYPE-URI | @otherTypeURI | O; nejasný popis | 0..1 |
| -OTHER-TYPE-AUTH | @otherTypeAuth | O; nejasný popis | 0..1 |
| -OTHER-TYPE-AUTH-URI | @otherTypeAuthURI | O; nejasný popis | 0..1 |
| -SERIES | titleInfo uvnitř edice | slovní požadavek, bez kódu | 1..n v použitém záznamu edice s převáděnými poli |

Rozsah se nepřenáší na titul vícesvazku, přílohy, vnitřní části, stránky ani rekurzivně vnořené relatedItem. Existující pravidla pro přímý název monografie se automaticky nepoužijí jako požadavek na název souvisejícího zdroje. Znovu používáme obecnou entitu MODS-TITLEINFO s odlišnou podmínkou.

## Edice: převod polí, nikoli nová povinnost rodiče

| Zdroj | Cíl uvnitř příslušného titleInfo |
|---|---|
| 490$a | title |
| 490$v | partNumber |
| 830$a | title |
| 830$n | partNumber |
| 830$p | partName |
| 830$v | partNumber |

Pod společným relatedItem s type=series má být **samostatné titleInfo pro každý výskyt bibliografického pole**. Není požadována současná existence 490 a 830 ani všech jejich podpolí. Pokud jsou v 830 dostupná $n i $v, nepřijdeme automaticky o jeden údaj a bez podkladu je neslučujeme. XSD dovoluje opakování titleInfo i jeho názvových částí.

Slovní předpis je označen `obligation_source: prose`, nemá domyšlený kód M. Platí při použití záznamu edice s dostupnými převáděnými poli; doporučení RA pro samotné relatedItem se nemění.

Podmínky `related_resource_role=series` a `source_series_fields_available=true` popisují **zdrojový kontext**. Nesmějí se odvozovat z cílového type=series či přítomnosti titleInfo — jinak by chybný nebo chybějící zápis unikl posouzení. Neznámý zdroj není false.

DMF v tomto odstavci nepřikazuje titleInfo/@type=uniform. Přesné rozdělení více odlišných edic mezi kontejnery relatedItem není úplně určeno; nelze automaticky sloučit všechny edice jednoho dokumentu do jediné.

## Typy vztahů a nejasné popisy DMF

Type má uzavřený výčet jedenácti hodnot podle XSD 3.8. Host je jen příklad v DMF, nikoli povinná konstanta. OtherType slouží pro jiný typ vztahu, který do výčtu nelze zařadit.

Formulace DMF o type „spolu s“ otherType není požadavkem na současný výskyt. LOC Guidelines výslovně oddělují type od otherType/otherTypeURI; samotné XSD tuto vzájemnou výlučnost nevynucuje. Neodvozujeme z této formulace další národní pravidlo se zákazem.

| Atribut | Popis DMF | Sémantika MODS / meze doložení |
|---|---|---|
| otherTypeURI | odkaz na zdroj související položky | LOC definuje URI **typu vztahu**, nikoli dokumentu |
| otherTypeAuth | autoritní záznam příbuzné položky | LOC definuje jméno **seznamu typů vztahů** |
| otherTypeAuthURI | odkaz na autoritní záznam příbuzné položky | pravděpodobně URI seznamu typů vztahů; viz inference níže |

Tato tři pravidla mají stav **ambiguous** a samostatné discrepancies. Národní O i popis pramene jsou zachovány. Verified znamená ověřený přepis, nikoli vyřešený rozdíl významu. Automatická kontrola nesmí bez rozhodnutí považovat URL dokumentu za jediný správný obsah těchto atributů.

U otherTypeAuthURI stránka LOC relatedItem samostatnou definici neposkytuje. Výklad URI autoritativního seznamu typů vztahů odvozujeme ze změn MODS 3.8 (sjednocení příslušných atributů titleInfo s relatedItem) a definice atributu u titleInfo. Jde o **redakční inferenci**, kterou nevydáváme za přímou citaci definice relatedItem.

V relatedItemDefinition mají všechny čtyři otherType* atributy typ **xs:string**, včetně názvů končících URI. Nezaměňujeme je se stejně pojmenovanými atributy jiných typů a nepřidáváme nedoložený URI regex. Podle LOC patří odkaz na obsah souvisejícího dokumentu do location/url, zatímco xlink:href odkazuje na metadata; tato sada pro ně nepřidává další národní povinnosti.

## Kontrola vzorového SIP

[Vzorový SIP monografie](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download) deklaruje DMF 2.3, MODS 3.8 a descriptionStandard=aacr. Kontext MODSMD_VOLUME_0001 je doložen žánrem volume, issuance=single unit a vazbami DMDID.

Soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`:
SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`.

Kontrola 14. 10. 2026 při zakázaném DTD a externím resolveru:
`/mets:mets/mets:dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:relatedItem`
vrátila **0 uzlů**. Namespace mets je http://www.loc.gov/METS/ a mods http://www.loc.gov/mods/v3.

Nové XML příklady proto nejsou doplněny. Absence nedokazuje nedostupnost vztahů či edice ve zdrojové katalogizaci, splnění RA ani validitu celého SIP. Vzor AACR2 není ověřením větve RDA.

## Kontroly a omezení

Lokální ověření 14. 10. 2026:

- validace všech 308 YAML dokumentů a typová kontrola prošly;
- všech 340 testů ve 49 souborech prošlo; šest nových testů kontroluje rozsah, povinnosti, podmínku edice, mapování a nejasné popisy;
- celé sestavení prošlo: 298 pravidel (280 monografických a 18 periodických), 235 entit a 1609 relací;
- registr nadále obsahuje 253 XML výřezů u 198 pravidel; všech 246 monografických výřezů prošlo kontrolou syntaxe a porovnáním se zdrojem (SHA-256 a XPath);
- kontrola diffu prošla. MkDocs nadále hlásí nesouvisející chybějící kotvu poznámky v openexr-preservation-master.md; sestavení tím není blokováno.

Nové významové klíče porovnání nejsou přiděleny. Registr deklarativní custom kontroly nad SIP nevykonává a implementace nástrojů nebyly ověřeny. Tři nejasné popisy vztahových atributů a přesné seskupení více odlišných edic zůstávají k odbornému dořešení. Tato sada není potvrzením nasazení.
