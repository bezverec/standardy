# Části jmen, alternativní jména a etal v MODS

Devět pravidel `metadata/mods-name-details` navazuje na [původce a role](mods-names.md) pro svazek jednosvazkové monografie. Rozlišuje povinnosti dostupných částí osobního jména, volitelné alternativní jméno s povinným obsahem a samostatné označení dalších neuvedených autorů.

## Zdroje a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 49–50; nová pravidla vycházejí z pokračování tabulky na s. 50.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd), nameDefinition, namePartDefinition, alternativeNameDefinition a etal.

Ověřeno textově i vizuálně 6. 10. 2026. Sada se vztahuje na přímé jmenné údaje o odpovědnosti v MODS svazku jednosvazkového dokumentu. Nevztahuje se automaticky na jiné bibliografické úrovně, subject/name, relatedItem/name nebo originInfo/agent. Kontext etal naopak zahrnuje každé top-level name v tomto záznamu, i chybné kombinace etal se jmenným obsahem.

## Pravidla

Prefix ID je `NDK-MONO-MODS-SINGLE-`.

| Pravidlo | Předmět | Povinnost |
|---|---|---|
| NAME-PART-TYPE | Typ rozlišené části osobního jména | MA |
| NAME-PART-FAMILY | Dostupné a rozlišitelné příjmení | MA |
| NAME-PART-GIVEN | Dostupné a rozlišitelné křestní jméno | MA |
| NAME-PART-DATE | Dostupná životopisná data osoby | RA |
| NAME-PART-ADDRESS | Dostupný akademický titul či hodnost | RA |
| NAME-PART-NO-TYPE | Type u neosobního nebo nerozlišeného jména | Slovní zákaz, bez domyšleného kódu |
| ALTERNATIVE-NAME | Alternativní jméno stejné entity | O |
| ALTERNATIVE-NAME-PART | NamePart uvnitř uvedeného alternativeName | M |
| ETAL | Označení dalších neuvedených autorů v samostatném name | O, při použití platí omezení struktury |

Sada tedy zachovává tři MA, dvě RA, dvě O, jedno M a jeden slovní zákaz. Registr nyní obsahuje 207 pravidel, z toho 30 pro MODS.

## Části osobního jména a dostupnost

Celý řádek namePart/@type má v DMF kód MA, ale popisy jednotlivých hodnot rozlišují family a given s MA od date a termsOfAddress s RA. Přepis je proto neslučuje do plošného požadavku na všechny čtyři údaje. Doporučené části mají `presence=optional` a minimum 0: jejich absence není porušením M či MA. Pokud je rozlišená část uvedena, typ se musí shodovat s jejím významem.

Kontext tvoří `object_type=monograph`, `document_role=main_mets`, `bibliographic_level=single_volume` a konkrétní role elementu. `contributor_kind` určuje druh původce ze zdroje, nikoli podle hodnoty kontrolovaného name/@type. `name_part_kind` je význam části ze zdroje; nesmí se slepě kopírovat z kontrolovaného atributu.

Povinnost family a given závisí na `name_components_distinguishable=true` a nezávisle na `family_name_available` či `given_name_available`. RA používá `biographical_dates_available` a `name_title_available`. Tyto kontexty nejsou nové XML atributy. Chybějící údaj ve výstupu není důkaz nedostupnosti a neznámá hodnota není false.

Kardinality čtyř pravidel pro hodnotové části se vztahují na odpovídající podmnožinu namePart u konkrétního původce, například namePart[@type='family'], nikoli na součet všech namePart. Chybějící příjmení tak nelze nahradit datem narození. Protože datový model nemá samostatné pole selektoru, tento rozsah je výslovně uveden v custom kontrole a interpretaci; budoucí engine jej nesmí odvozovat jen z obecné cílové entity MODS-NAME-PART.

DMF doporučuje více křestních jmen uvést společně. Toto slovní doporučení nepředstavuje zákaz více namePart ani povinnost rozepsat iniciály. Datum zde není datum vydání nebo digitalizace; termsOfAddress není adresa osoby ani název díla. Family jako část osobního jména není name/@type=family pro rod.

## Kdy se type nepíše

U neosobního jména se type na přímém namePart nepoužije. Není-li možné rozlišit křestní jméno a příjmení osoby, její nerozlišené jméno se uvede v jednom namePart bez type. Prázdný atribut není nepřítomný atribut.

Druhá větev zákazu používá `name_part_kind=unparsed` a `name_components_distinguishable=false`. Nezakazuje samostatné typované životopisné datum či titul vedle nerozlišeného osobního jména. Neznámý druh původce se nesmí automaticky považovat za neosobní.

## Alternativní jméno

AlternativeName je volitelné i při dostupnosti alternativního jména. Popisuje stejnou entitu, nikoli dalšího tvůrce dokumentu. Pokud je kontejner použit, NDK vyžaduje jeho vlastní přímý namePart s alternativním jménem, například pseudonymem. Povinnost M potomka nelze vypnout nedostupností, když už je kontejner uveden.

Obecné MODS umožňuje opakování kontejneru i namePart. Samotné alternativeNameDefinition má minOccurs=0 pro volbu potomků a neprázdný namePart nevynucuje. NamePart přímého name ani nameIdentifier uvnitř alternativeName národní požadavek nenahrazují. Sada nevymýšlí povinný altType ani automaticky nepřenáší MA přímého name/namePart do alternativní větve.

## Etal a samostatná větev name

Etal je nepovinné označení dalších neuvedených autorů. V jednom name může být nejvýše jednou; nejde o maximum jednoho výskytu v celém MODS záznamu. Musí být v samostatném top-level name bez namePart, nameIdentifier a alternativeName. Nelze je tedy prostě přidat do existujícího jmenného záznamu autora.

DMF stanoví ruční vložení, které nelze prokázat ze samotného výsledného XML. Etal se nemá automaticky generovat kvůli chybějícímu poli ani používat k vynechání dostupných původců. Text a kol. v DMF je příklad, nikoli jediná povolená hodnota. Obecné MODS dovoluje i prázdné etal.

Vykonatelná deklarace XSD vyžaduje etal jako první prvek zvláštní větve a za ním dovoluje opakovatelnou volbu affiliation, role a description. Nepřipouští displayForm ani běžnou jmennou větev. Komentáře uvnitř XSD nejsou v otázce opakování těchto doprovodných prvků zcela jednotné; popis obecného schématu vychází z deklarované struktury, nikoli z odlišného komentáře. Tyto detaily nejsou vydávány za doslovný řádek DMF.

## Ilustrační zápis, nikoli výřez SIP

Následující autorský příklad ukazuje oddělení běžného jména a etal. Smyšlené hodnoty nejsou z dodaného balíčku, neověřují skutečnou osobu ani úplnou platnost záznamu:

```xml
<mods:mods xmlns:mods="http://www.loc.gov/mods/v3" version="3.8">
  <mods:name type="personal">
    <mods:namePart type="family">Novák</mods:namePart>
    <mods:namePart type="given">Jan</mods:namePart>
    <mods:alternativeName>
      <mods:namePart>J. Lesní</mods:namePart>
    </mods:alternativeName>
  </mods:name>
  <mods:name>
    <mods:etal>a kol.</mods:etal>
  </mods:name>
</mods:mods>
```

Ve [vzorovém SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download) je přímý původce Mařík, J. bez typovaných částí, alternativeName a etal. Životopisná data Edisona se nacházejí v subject/name, tedy mimo rozsah této skupiny. Z ukázky nelze určit rozlišitelnost jména Mařík, J. v původním katalogu. Novým pravidlům proto nepřidáváme zdánlivě vyhovující zdrojové ukázky; počet zůstává 196 výřezů u 153 pravidel.

Testy ověřují přepis dat, kontexty, povinnosti, vazby a zařazení do API a mapy. **Custom kontroly registr nevykonává** a implementace externích nástrojů nebyly ověřeny.
