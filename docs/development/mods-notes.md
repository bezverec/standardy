# Shrnutí a obecné poznámky jednosvazkové monografie

Sada doplňuje tři pravidla DMF Monografie 2.3 v kategorii `metadata/mods-notes`. Navazuje na [fyzický popis](mods-physical-description.md), ale neslučuje obecné poznámky s poznámkou o fyzickém stavu. Rozsah je přímý MODS záznam svazku jednosvazkové monografie v hlavním METS.

## Prameny a ověření přepisu

Ověřeno 8. 10. 2026:

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 55: vizuální kontrola řádků abstract, obecného note a jeho type, včetně odlišení předcházejícího physicalDescription/note a následujícího subject.
- Tentýž dokument, s. 24: rodičovský kontext a legenda barev. Nerozlišené černé řádky jsou společným bibliografickým předpisem AACR2/RDA, nikoli technicky nezávislou vrstvou.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): modsDefinition/modsGroup, abstractDefinition, noteDefinition. Oba elementy jsou opakovatelné, type je volitelný string bez enumerace.
- [LOC: abstract](https://www.loc.gov/standards/mods/userguide/abstract.html), [LOC: note](https://www.loc.gov/standards/mods/userguide/note.html) a [seznam používaných typů poznámek](https://www.loc.gov/standards/mods/mods-notes.html): doplňující sémantika, konkrétnější elementy, oddělení jednotlivých poznámek a otevřenost označení.

`verified` označuje ověřený přepis těchto požadavků, nikoli bezchybnost celého DMF, validitu SIP nebo implementaci validátoru.

## Nová pravidla

Společný prefix ID: `NDK-MONO-MODS-SINGLE-`.

| Přípona ID | Cíl a rodič | Povinnost | Význam |
|---|---|---|---|
| ABSTRACT | mods/abstract | R | Shrnutí obsahu; MARC 520 |
| NOTE | mods/note | RA | Obecná poznámka ke svazku; MARC 245$c a poznámková pole 5XX |
| NOTE-TYPE | mods/note/@type | O | Volitelné upřesnění druhu poznámky |

### Významové hranice

- R, RA a O zůstávají zachovány. Žádné z těchto pravidel nevyžaduje bezpodmínečně přítomnost elementu či atributu.
- Dostupnost u RA nelze odvodit z existence cílového note. Chybějící původní záznam není svolením domyslet obsah.
- Kardinality abstract/note jsou 0..n na záznam svazku; type má 0..1 na jednu obecnou poznámku. Nejde o počty všech stejně pojmenovaných uzlů v SIP.
- Note uvnitř physicalDescription, recordInfoNote, poznámky relatedItem a stránkové note s left/right mají jiný kontext.
- Řádek 5XX není mechanický příkaz převést každé pole této skupiny na note. LOC doporučuje konkrétnější MODS elementy; samotný DMF zde samostatně mapuje 520 na abstract. Doplňující doporučení LOC není vydáváno za doslovný řádek DMF.
- Seznam note types je otevřený. Proto type nemá `allowed_values` ani kontrolu `value_set`; `statement of responsibility` není povinnou hodnotou všech poznámek. Relace tohoto pravidla k obecné entitě je `clarifies`, nikoli tvrzení o uzavření hodnot.
- DMF odkazuje u abstract i note na dc:description. Samostatná pravidla DC ani obecná ekvivalence těchto elementů tím nevznikají.
- Nová sada nepřidává odhadnuté porovnávací klíče. V katalogizačním výběru jsou všechna tři pravidla zahrnuta v AACR2 i RDA, zatím jako nezmapovaná.

## Skutečné XML ukázky

Použit je uživatelem dodaný [monografický SIP z CESNET](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download). Lokální kopie deklaruje DMF 2.3 v info.xml; její identita s dnešním vzdáleným archivem nebyla znovu kontrolována.

Soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256:

`7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`

Záznam `MODSMD_VOLUME_0001` obsahuje MODS 3.8, strukturální genre volume, issuance single unit a descriptionStandard aacr. Fyzická mapa na tuto sekci odkazuje přes DMDID. Přímé poznámky jsou:

- údaj o odpovědnosti `[J. Mařík]` s type `statement of responsibility`;
- poznámka o zjištění autora ze závěru textu, bez type;
- poznámka o zdroji roku vydání, bez type.

V YAML jsou čtyři ukázky u dvou pravidel: tři původní note a znovu typovaný note u pravidla type. XPath používají konkrétní sekci svazku a jednoznačný atributový či poziční predikát. Hodnoty nejsou upraveny, doplněn je pouze namespace pro samostatné XML.

Abstract ve zkontrolovaném záznamu není; neexistující ukázka není nahrazena autorským textem. Výřezy nedokládají RDA, původní MARC ani úplnou validitu SIP. Typované i netypované poznámky ilustrují rozdíl, nikoli požadavek na počet tří poznámek.

## Kontroly a meze

Provedené lokální kontroly 8. 10. 2026:

- validace 285 zdrojových YAML dokumentů, typová kontrola a všech 313 testů prošly;
- celé sestavení prošlo: 275 pravidel (257 monografických a 18 periodických), 213 entit a 1501 relací;
- registr obsahuje 242 XML ukázek u 190 pravidel; všech 235 monografických ukázek prošlo kontrolou syntaxe, SHA-256, jednoznačnosti XPath a shody se zdrojovým SIP;
- `git diff --check` bez chyb; žádný commit, push ani nasazení.

Významové testy pokrývají rodičovský rozsah, R/RA/O, otevřený type, rozlišení shrnutí a obecných poznámek, společný katalogizační rozsah a provenienci XML. Kontroly `custom` jsou deklarativní záznamy pro budoucí engine; registr je nevykonává.

Implementace ProArcu, JHOVE a dalších nástrojů nebyly pro tuto sadu prověřovány. Převod původního MARC vyžaduje samostatný zdroj a posouzení; samotný XML výřez jej nepotvrzuje. Publikace je samostatný krok, nikoli důsledek lokálního sestavení.
