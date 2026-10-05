# PREMIS Object: vazby objektů a událostí

Třetí skupina PREMIS Object obsahuje **13 pravidel DMF Monografie 2.3**. Doplňuje [identifikaci souboru](premis-object.md) a [jeho vznik a ochranu](premis-provenance.md). V mapě registru a filtrech je vedena jako `technical/premis-relationships` pod standardem PREMIS, v oblasti administrativních a technických metadat.

## Podklady a rozsah

Primární podklad je [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.5.1, s. 78–79; legenda povinností je na s. 75. Hierarchie, datové typy a obecné kardinality byly porovnány s [XSD PREMIS 2.2](https://www.loc.gov/standards/premis/v2/premis-v2-2.xsd).

Deset pravidel se vztahuje na relationship objektů MC a ALTO. Tři pravidla linkingEventIdentifier se týkají přímých odkazů PS. Všechny platí pro souborový objekt file ve vedlejším METS monografie; role ALTO odpovídá XML v tabulce DMF. Povinnost přímých odkazů PS se nepřenáší na MC/ALTO a povinnost relationship pro MC/ALTO nezakazuje další vztahy PS.

Celý oddíl DMF pro [PREMIS Event](premis-events.md) popisuje navazující skupina 16 pravidel. Úplný PREMIS Agent zatím zpracován není; skupiny nezavádějí validační engine.

## Přehled pravidel

Kardinalita se vztahuje k bezprostřednímu rodiči každé cesty, nikoli k součtu výskytů v celém dokumentu.

| Prvek | Rozsah | Povinnost | Kardinalita NDK |
|---|---|---|---|
| relationship | MC, ALTO | M | 1–n |
| relationshipType | MC, ALTO | M | 1–1 |
| relationshipSubType | MC, ALTO | M | 1–1 |
| relatedObjectIdentification | MC, ALTO | M | 1–n |
| relatedObjectIdentifierType | MC, ALTO | M | 1–1 |
| relatedObjectIdentifierValue | MC, ALTO | M | 1–1 |
| relatedEventIdentification | MC, ALTO | M | 1–n |
| relatedEventIdentifierType | MC, ALTO | M | 1–1 |
| relatedEventIdentifierValue | MC, ALTO | M | 1–1 |
| relatedEventSequence | MC, ALTO | R | 0–1 |
| linkingEventIdentifier | PS | M | 1–n + obsahově vytvoření i vymazání |
| linkingEventIdentifierType | PS | M | 1–1 |
| linkingEventIdentifierValue | PS | M | 1–1 |

Obecné XSD dovoluje vynechat relationship, relatedEventIdentification i linkingEventIdentifier; uvedená M v DMF jejich přítomnost vyžadují v příslušném rozsahu. U linkingEventIdentifier nestačí samotný počet: odkazy musí významově pokrýt vytvoření a vymazání **téhož PS**, ne dvě kopie stejného nebo nesouvisejícího odkazu.

### Povinný údaj není totéž co uzavřený číselník

relationshipType a relationshipSubType mají M, ale uvedené hodnoty jsou v DMF doporučené. Proto registr nevynucuje uzavřenou množinu `derivation/structural` ani univerzální `created from`. Konkrétní hodnota má odpovídat skutečnému vztahu; u `created from` vede odkaz od odvozeného objektu ke zdroji.

relatedEventIdentifierType označuje systém identifikace, nikoli eventType. Hodnota `NK_eventID` se proto nesmí zaměnit za `capture`, `migration` nebo `deletion`. Odkaz tvoří **pár typu a hodnoty**. Samotná shoda textu s mets:techMD/@ID nebo mets:digiprovMD/@ID nestačí a tyto identity nejsou automaticky totožné.

relatedEventSequence zůstává doporučené R. Pokud je uvedeno, XSD vyžaduje nezáporné celé číslo. Příklad `003` neznamená povinnou délku, počátek číslování ani souvislou řadu. U MC a ALTO první stránky vzoru chybí; nejde tím o chybějící povinný údaj. Pořadí nelze bez opory domyslet z pořadí elementů.

## Doložené vazby první stránky SIP

Skupina přidává **14 přesných XML výřezů u deseti pravidel** z [dodaného vzorového SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download). Vedle vztahů MC a ALTO ukazuje identitu cílového PS, identifikátor události MC a vnořené události PS.

| Výchozí objekt | Umístění vazby | Identifikátor cíle | Dohledaný cíl |
|---|---|---|---|
| MC, OBJ_003 | relationship / relatedObjectIdentification | file / PS_1_00010003_2R | PS, OBJ_002 |
| ALTO, OBJ_004 | relationship / relatedObjectIdentification | file / MC_1_00010003_2R | MC, OBJ_003 |
| MC, OBJ_003 | relationship / relatedEventIdentification | NK_eventID / mastercopy_001 | Událost migration |
| ALTO, OBJ_004 | relationship / relatedEventIdentification | NK_eventID / alto_001 | Událost capture |
| PS, OBJ_002 | relationship / relatedEventIdentification | NK_eventID / postprocessingdata_001 | Událost derivation |
| PS, OBJ_002 | relationship / relatedEventIdentification | NK_eventID / postprocessingdata_002 | Událost deletion |

Typy událostí byly přečteny z cílových záznamů, nikoli odhadnuty z prefixů identifikátorů. Všechny zde uvedené páry mají ve zkoumaném souboru odpovídající metadata; to samo neprokazuje správnost historie nebo všech požadavků DMF.

### ALTO odkazuje na MC, ne přímo na PS

DMF u relatedObjectIdentification zmiňuje vztah k původnímu objektu, skenu. Ve vzoru je však přímým cílem ALTO archivní MC. V metadatech tedy existuje řetězec `ALTO → MC → PS`, nikoli přímá vazba `ALTO → PS`.

Registr výřez nemění. Přijatelnost nepřímé cesty vůči znění DMF zůstává výkladovou otázkou, nikoli potvrzenou výjimkou. Záznam není označen za neexistující cíl a z metadat se neodvozuje neprokázaný výrobní postup. Uchovaný popis již smazaného PS lze dohledat bez požadavku na existenci jeho datového souboru.

### PS nemá požadované přímé linkingEventIdentifier

XPath kontrola **celého objektu OBJ_002**, identifikovaného jako PS_1_00010003_2R, zjistila nulový počet přímých potomků linkingEventIdentifier. Dvě události jsou zaznamenány uvnitř relationship pomocí relatedEventIdentification.

Oba cílové event záznamy existují, ale vnořené odkazy nejsou stejným prvkem ani umístěním jako přímé linkingEventIdentifier požadované DMF pro PS. Tento nesoulad se vztahuje k objektu první stránky, nikoli automaticky ke všem stranám SIP. Připojená ukázka relationship dokládá vnořenou podobu; **sama o sobě nedokazuje nepřítomnost prvku mimo výřez**.

Pro děti chybějícího přímého bloku ani pro neuvedené relatedEventSequence se nevytvářejí fiktivní výřezy.

## Reprodukovatelnost a meze ověření

Kontrola 5. 10. 2026 pracovala se souborem:

`amdsec/amd_mets_75faba8d-c629-11f0-8950-12e8557df20e_0001.xml`

SHA-256:

`4a8d9098cb15b621a0dee3fd5501a3eee2b107088dc728dcace2a36f1e2b583f`

Výběr pro chybějící přímé odkazy PS:

`/mets:mets/mets:amdSec/mets:techMD[@ID='OBJ_002']/mets:mdWrap/mets:xmlData/premis:object/premis:linkingEventIdentifier`

V témže objektu cesta `premis:relationship/premis:relatedEventIdentification` vrací dva uzly. Namespace METS je `http://www.loc.gov/METS/`, PREMIS `info:lc/xmlns/premis-v2`. Ověření všech výřezů vůči XPath a otiskům je popsáno v [dokumentaci ukázek](xml-examples.md).

Přepis tabulek byl ověřen také vizuálně. Testy kontrolují rozsah, povinnosti, kardinality, absenci domyšlených číselníků, zachování ukázek a vazby v registru. Popisy `custom` jsou určeny budoucím implementacím; **registr je nevykonává**. Nebyl spuštěn externí validátor ani nově doloženo chování JHOVE, jpylyzeru, ProArcu či Komplexního validátoru.
