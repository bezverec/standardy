# Původ a místa vydání v MODS jednosvazkové monografie

Osm pravidel `metadata/mods-origin` popisuje kontejner originInfo, rozdíl AACR/RDA, druh nakladatelské události a místo vydání. Rozsah je omezen na svazek jednosvazkové monografie podle DMF 2.3, ne na relatedItem, subject, titul vícesvazku nebo stránku. Údaje agent a jeho role popisuje navazující [sada nakladatelů a výrobců](mods-origin-agents.md); data a issuance zůstávají pro další sadu.

## Podklady

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 51–52: originInfo, eventType, place, placeTerm a atributy type/authority.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): modsGroup, originInfoDefinition, placeDefinition, placeTermDefinition, codeOrText a authorityAttributeGroup.
- [MARC 21, pole 264](https://www.loc.gov/marc/bibliographic/bd264.html), vydání stránky July 2022: význam druhého indikátoru.

Tabulky DMF byly přečteny textově i vizuálně 6. 10. 2026. Obecné schéma, národní požadavky a ukázky balíčku jsou vedeny odděleně; chování implementací nebylo ověřeno.

## Osm pravidel

Prefix ID je `NDK-MONO-MODS-SINGLE-`.

| Pravidlo | Obsah | Povinnost |
|---|---|---|
| ORIGININFO | Přítomnost kontejneru, opakování a zachování vazeb | M |
| ORIGIN-EVENT-TYPE | Druh události podle MARC 264, pouze RDA | M |
| ORIGIN-PRIMARY-EVENT | Alespoň jedna production nebo publication, pouze RDA | Slovní požadavek |
| ORIGIN-AACR-NO-EVENT-TYPE | Vynechání eventType v AACR | Slovní zákaz |
| ORIGIN-PLACE | Dostupné místo v příslušném originInfo | MA |
| ORIGIN-PLACE-TERM | Dostupný textový nebo kódovaný místní údaj | MA |
| ORIGIN-PLACE-TERM-TYPE | Povinné rozlišení code/text v použitém termínu | M |
| ORIGIN-PLACE-TERM-AUTHORITY | Marccountry pro údaj z MARC 008 | MA |

Sada zachovává tři M a tři MA; dvě slovní povinnosti mají obligation_source=prose bez domyšleného kódu. Minimum 1 u MA platí až při splnění nezávislé podmínky dostupnosti. Atributy mají maximum 1, zakázaný atribut minimum i maximum 0; elementy jsou opakovatelné.

## Opakování a vztahy

Každý výskyt zdrojového MARC 260/264 se převede do samostatného originInfo. Pokud se v jednom poli opakují podpole $a/$b, DMF dovoluje opakovat příslušné potomky nebo celý kontejner, ale musí zůstat zachována vazba konkrétního místa a vydavatele. Sloučení všech míst a všech vydavatelů do nezávislých seznamů není ekvivalentní převod.

M kontejneru neznamená M každého podřízeného pole. Nedostupnost místa nezruší povinnost originInfo; zároveň není důvodem místo vymýšlet.

## AACR a RDA nejsou stejná větev

DMF vyhrazuje eventType pouze RDA. U RDA je atribut povinný a jeho hodnota vychází z **druhého**, nikoli prvního indikátoru pole MARC 264:

| Druhý indikátor | eventType | Význam |
|---|---|---|
| 0 | production | Vytvoření nezveřejněného zdroje |
| 1 | publication | Vydání |
| 2 | distribution | Distribuce |
| 3 | manufacture | Tisk či výroba zveřejněného zdroje |
| 4 | copyright | Údaj o autorskoprávní ochraně |

Tabulkové M u atributu se nesmí snížit na R podle značek u jednotlivých hodnot. Pokračování tabulky na s. 52 vysvětluje závaznost převodu z katalogizačního záznamu. Členství v seznamu samo nestačí: například libovolné publication nenahradí správné distribution pro pole 264_2.

Alespoň jedno přímé originInfo RDA záznamu musí mít production **nebo** publication, nikoli obojí současně. Samotné distribution, manufacture a copyright nestačí. Kontrola je na úrovni záznamu; nesmí se zapnout až při existenci správné události. Minimum 1 se vztahuje na podmnožinu hlavních událostí, nikoli na zákaz dalších událostí.

U doloženého AACR se eventType vynechá. Ani prázdný atribut není vynechání. Neznámý katalogizační režim není AACR jen proto, že nebylo prokázáno RDA. Režim musí vycházet z nezávislého popisu zdroje, nikoli z právě kontrolovaného eventType.

## Místo a země vydání

Place a placeTerm mají MA. Hodnoty čerpají z 260$a/264$a a 008/15–17; termín musí mít type=text pro 260/264, type=code pro 008. Dostupné kódové i textové vyjádření téhož místa se zapisuje opakováním placeTerm. Nelze však zaměnit geografickou úroveň: xr je kód země, ne identifikátor města Louny.

Authority=marccountry má MA a podle poznámky DMF patří jen k údaji z pole 008. Dostupnost autority zde vyplývá ze známého zdrojového pole a předepsaného slovníku. Není to obecná povinnost pro všechna textová místa z 260/264. Původ údaje se nesmí zpětně odhadnout jen z aktuálního type=code nebo z existující authority.

Tato sada nekontroluje samostatně mapování do dc:publisher ani členství kódu v autoritním slovníku. K tomu by bylo třeba odpovídajícího zdroje a kontroly, nikoli jen shody atributu.

## Kontext podmínek a obecné MODS

Společné podmínky jsou object_type=monograph, document_role=main_mets a bibliographic_level=single_volume. Konkrétní role:

| Kontext | Pravidla / další podmínka |
|---|---|
| mods_record | ORIGININFO; ORIGIN-PRIMARY-EVENT navíc cataloguing_rules=rda |
| mods_origin_info | EVENT-TYPE při rda; AACR-NO-EVENT-TYPE při aacr; PLACE při origin_place_available=true |
| mods_origin_place | PLACE-TERM při origin_place_term_available=true |
| mods_origin_place_term | TYPE; AUTHORITY při origin_place_source=marc_008_15_17 |

Jde o sémantické kontexty, ne nové XML atributy. Dostupnost se zjišťuje nezávisle z katalogu či popisu předlohy. Absence údaje v XML není důkaz jeho nedostupnosti a neznámá hodnota není false ani potvrzení správnosti.

MODS 3.8 má eventType jako volitelný xs:string, bez národního výčtu a bez podmínky RDA. PlaceDefinition dovoluje vedle placeTerm také placeIdentifier a cartographics; ze samotného XSD proto nelze vyvozovat povinné placeTerm. Atribut type má code/text, ale je volitelný. Authority je volitelné xs:string; starší omezený výčet autorit byl ve 3.8 odstraněn.

Elementy mají namespace `http://www.loc.gov/mods/v3`, atributy jsou bez namespace. Verze 3.8 je určena zdrojem, nikoli samotným namespace.

## Ukázky a meze ověření

Osm ukázek u šesti pravidel zachycuje čtyři uzly [vzorového SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download): originInfo, jeho place, kód xr a text V Lounech. Opakované použití výřezu dovoluje číst detail pravidla samostatně.

Zdrojový soubor je `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`. Výchozí XPath:

```text
/mets:mets/mets:dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods
```

RecordInfo/descriptionStandard v tomto záznamu uvádí aacr a originInfo nemá eventType. To dokládá AACR větev, nikoli chybu chybějícího RDA atributu. Pro RDA nepřidáváme vymyšlené výřezy. Celé originInfo v ukázce obsahuje také agent, data a issuance, ale tato sada z toho neodvozuje ověření všech potomků.

Původní MARC nebyl analyzován. Shoda ukázek se SIP neprokazuje správnost původního převodu ani validitu celého balíčku.

Registr nyní obsahuje 220 pravidel, z toho 43 pro MODS, a 208 XML ukázek u 163 pravidel. Testy kontrolují přepis, kontexty, povinnosti, mapování hodnot, vazby, API filtry a mapu registru. **Custom kontroly registr nevykonává**; nejde o nově implementovaný validátor SIP.
