# Události PREMIS Event

Skupina obsahuje **16 pravidel DMF Monografie 2.3** z § 7.5.2. Navazuje na [vazby objektů a událostí](premis-relationships.md). V mapě a filtrech je vedena jako `technical/premis-events`, pod PREMIS v administrativních a technických metadatech.

## Zdroje a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), s. 79–81, § 7.5.2: evidence provedených činností, struktura a povinnosti. Tabulky byly zkontrolovány také vizuálně ve vykresleném PDF.
- Stejný dokument, s. 75: legenda odlišuje obecné četnosti od povinností DMF; povinné děti doporučeného kontejneru se uplatní, když je kontejner přítomen.
- Stejný dokument, s. 81, úvod § 7.5.3: meze požadavku na úplný popis PREMIS Agent v digitalizačním SIP.
- [Oficiální XSD PREMIS 2.2](https://www.loc.gov/standards/premis/v2/premis-v2-2.xsd): obecná struktura, kardinality a datové typy. Verzi volí DMF na s. 5; nejde o PREMIS 2.3 ani 3.

Události leží v `amdSec/digiprovMD/mdWrap/xmlData/premis:event` vedlejšího METS. Každá evidovaná událost má vlastní `digiprovMD`. Kontroluje se skutečně provedená digitalizace, vytvoření ALTO XML, MC a UC a vymazání PS. Na rozdíl od skupiny Object zde nepoužíváme omezení `file_role=MC/PS/ALTO`: text výslovně zahrnuje i vznik UC. To nezavádí nový požadavek na souborový PREMIS Object pro UC.

## Pravidla a povinnosti

Cesty v tabulce jsou relativní k `event`, s výjimkou kořenového záznamu. Kardinalita dítěte platí v každém jeho bezprostředním rodiči. Kódy M/R jsou převzaty z tabulky, nikoli domyšleny ze schématu.

| Element nebo cesta | Povinnost | Četnost podle DMF v daném kontextu |
|---|---|---|
| `event` | M | 1–n ve vedlejším METS; jeden event na vlastní digiprovMD |
| `eventIdentifier` | M | 1–1 |
| `eventIdentifier/eventIdentifierType` | M | 1–1 |
| `eventIdentifier/eventIdentifierValue` | M | 1–1 |
| `eventType` | M | 1–1 |
| `eventDateTime` | M | 1–1 |
| `eventDetail` | M | 1–1 |
| `eventOutcomeInformation` | R | 0–n |
| `eventOutcomeInformation/eventOutcome` | M | 1–1, je-li uveden rodič |
| `linkingAgentIdentifier` | M | 1–n |
| `linkingAgentIdentifier/linkingAgentIdentifierType` | M | 1–1 |
| `linkingAgentIdentifier/linkingAgentIdentifierValue` | M | 1–1 |
| `linkingAgentIdentifier/linkingAgentRole` | R | 0–n |
| `linkingObjectIdentifier` | M | 1–n |
| `linkingObjectIdentifier/linkingObjectIdentifierType` | M | 1–1 |
| `linkingObjectIdentifier/linkingObjectIdentifierValue` | M | 1–1 |

Četnost kořenových událostí není pevný počet aktivit ani počet všech `digiprovMD` v dokumentu (ty mohou obsahovat i agenty). Nestačí mít libovolný jeden event: úplnost historie vyžaduje porovnání s provedenými činnostmi.

### Výsledek: doporučený rodič, povinné dítě

`eventOutcomeInformation` je R a může být opakován. V každém jeho uvedeném výskytu je `eventOutcome` M, právě jednou. Chybějící doporučený rodič proto není chybějícím povinným výsledkem. Kód dítěte zůstává **M**, nikoli MA; podmínka přítomnosti rodiče je vedena zvlášť a vyhodnocuje se v aktuálním event.

Obecné XSD dovoluje i větev pouze s `eventOutcomeDetail`, zatímco DMF ve zvoleném kontejneru požaduje `eventOutcome`. Jeho hodnota musí pocházet z kontrolovaného slovníku nebo seznamu kódů. Slova successful/failure jsou příklady. Zdrojové `OK` zachováváme, ale konkrétní číselník vzoru nebyl doložen.

### Typ, upřesnění a čas

`eventType` vyžaduje kontrolovaný slovník. DMF jmenuje capture, migration, derivation a deletion jako zaznamenávané typy, nikoli jako explicitně uzavřený seznam všech přípustných hodnot. Nelze požadovat všechny typy u každé jednotlivé události nebo domýšlet neprovedenou činnost.

`eventDetail` je povinný, přestože XSD dovoluje jeho vynechání. DMF uvádí doporučená upřesnění za lomítkem v zápisech capture/digitization, capture/XML_creation, capture/TXT_creation, migration/MC_creation a deletion/PS_deletion. Vzor používá celé řetězce včetně prefixu typu. Tento rozdíl výslovně zachováváme; neděláme z kombinovaného řetězce povinnou syntaxi ani z doporučení uzavřený číselník.

`eventDateTime` vyžaduje ISO 8601 včetně sekund. PREMIS `edtfSimpleType` obecně dovoluje širší zápisy. DMF zde neukládá konkrétní časové pásmo ani povinné `Z`; čas bez offsetu ze vzoru není doplněn odhadem.

### Identity a vazby

Událost se identifikuje dvojicí typu a hodnoty: například `NK_eventID / mastercopy_001`. `EVT_004` je naproti tomu XML ID obalu `digiprovMD`. Tyto identity nelze zaměňovat.

Vazby na objekty a původce se také řeší přes dvojice identifikátorů, nikoli jen přes jméno, podobnost řetězce nebo METS `file/@ID`. Odkaz na smazaný PS může směřovat na jeho uchovaný metadatový záznam; neznamená povinnost uchovávat smazaný soubor.

§ 7.5.2 požaduje identifikaci původce a mluví o vazbě na PREMIS Agent. § 7.5.3 současně uvádí, že další upřesnění agenta není pro digitalizační SIP nutné. Proto pravidlo zachovává povinný `linkingAgentIdentifier`, ale nezavádí bezvýjimečný požadavek na úplný lokální záznam Agent. Tento rozsah a obsah záznamu nyní popisuje navazující skupina [PREMIS Agent](premis-agents.md).

## Zdrojové XML ukázky

Všech 16 pravidel má ukázku; celkem přidáváme **23 výřezů** z prvního vedlejšího METS [dodaného vzorového SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download):

`amdsec/amd_mets_75faba8d-c629-11f0-8950-12e8557df20e_0001.xml`

SHA-256: `4a8d9098cb15b621a0dee3fd5501a3eee2b107088dc728dcace2a36f1e2b583f`.

| Obal | Identifikátor události (typ NK_eventID) | Typ | Upřesnění ze zdroje |
|---|---|---|---|
| EVT_001 | flatdata_001 | capture | capture/digitization |
| EVT_002 | postprocessingdata_001 | derivation | derivation/POSTPROCESSING_creation |
| EVT_003 | postprocessingdata_002 | deletion | deletion/PS_deletion |
| EVT_004 | mastercopy_001 | migration | migration/MC_creation |
| EVT_005 | alto_001 | capture | capture/XML_creation |

Základní výřezy pocházejí z EVT_004. Další ukazují všechny čtyři zde přítomné typy, rozdílná upřesnění a role software/machine. Výsledek je `OK`. Hodnoty machine ani OK nehodnotíme jako chybu jen proto, že nejsou mezi příklady DMF; příslušnost ke konkrétním slovníkům nebyla ověřena.

Ukázky neslouží jako důkaz chování Kakadu, ABBYY nebo jiného nástroje. Identifikátor agenta není doložením jeho verze ani jeho skutečného spuštění. Pět událostí první stránky také nepotvrzuje úplnost historie celého SIP.

## Ověření a meze

Přepis DMF, obecné XSD a XML výřezy jsou ověřené odděleně. Kontrola ukázek porovnává XPath, namespace, strukturu a hodnoty s původním souborem a jeho SHA-256; postup je v [dokumentaci XML ukázek](xml-examples.md). Testy hlídají povinnosti, kardinality, podmínku doporučeného rodiče, identifikátory a zařazení do filtrů a mapy.

Nebyl spuštěn externí NDK validátor ani provedena úplná validace SIP. Kontroly `custom` jsou popisy pro budoucí implementaci, nikoli vykonávaný validační engine. Skupina nepopisuje všechny volitelné prvky obecného PREMIS, ale všech 16 řádků oddílu DMF Event.
