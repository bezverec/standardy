# Původci událostí PREMIS Agent

Sedm pravidel z § 7.5.3 DMF Monografie 2.3 navazuje na [PREMIS Event](premis-events.md). Kategorie `technical/premis-agents` je dostupná v mapě, filtrech a API pod PREMIS v oblasti administrativních a technických metadat.

## Ověřené zdroje

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), s. 81–82, § 7.5.3: rozsah SIP/AIP, umístění záznamů, prvky a povinnosti. Tabulky byly ověřeny také ve vykreslených stránkách PDF.
- Stejný dokument, s. 75: legenda povinností a obecných četností; s. 80: vazba z události na původce.
- [XSD PREMIS 2.2](https://www.loc.gov/standards/premis/v2/premis-v2-2.xsd): `agentComplexType`, `agentIdentifierComplexType` a jednoduché prvky. Verzi 2.2 volí DMF na s. 5; nejde o PREMIS 2.3 nebo 3.

## SIP není AIP

Úvod § 7.5.3 připisuje úplný popis původců zejména ochranným aktivitám nad archivními daty AIP. Pro informace přicházející z digitalizace v SIP považuje popis v Event a Object za dostačující; další upřesnění v Agent není nutné. Tabulka současně uvádí pro kořenový `agent` kód M.

Registr tento kontext nezamlčuje: zachovává **M**, ale nedělá z něj univerzální požadavek na nový Agent v každém SIP. Při ochranné aktivitě nad AIP má být doložen její původce; dobrovolně dodaný Agent v SIP musí mít předepsanou strukturu. Povinná identifikace původce v Event tím nezaniká.

Každý Agent má vlastní `amdSec/digiprovMD/mdWrap/xmlData/premis:agent` ve vedlejším METS. Jeden agent může být odkazován více událostmi. Nevyžadujeme nový duplicitní záznam pro každou vazbu ani pět agentů jen proto, že tolik obsahuje vzor.

## Přepsaná pravidla

Cesty jsou relativní k agentovi. Četnosti vyjadřují DMF v příslušném kontextu, nikoli jen obecné XSD.

| Prvek | Povinnost | Četnost | Význam |
|---|---|---|---|
| agent | M | 1–n při uplatnění kontextu | Původce události; vlastní digiprovMD |
| agentIdentifier | M | 1–n | Identita jednoznačná v daném kontextu |
| agentIdentifier/agentIdentifierType | M | 1–1 | Systém identifikace |
| agentIdentifier/agentIdentifierValue | M | 1–1 | Vlastní hodnota identifikátoru |
| agentName | R | 0–n | Jméno osoby nebo název aplikace apod. |
| agentType | M | 1–1 | organization, person, software, hardware |
| agentNote | MA | 1–n při splnění podmínky a dostupnosti údaje | Příkaz výroby JPEG 2000 |

### Identita, jméno a role

Agenta lze identifikovat více dvojicemi typu a hodnoty. Odkaz `event/linkingAgentIdentifier` se porovnává s libovolnou odpovídající dvojicí `agentIdentifier`; ne pouze s první hodnotou, jménem nebo ID obalu METS.

Ve vzoru je `AGENT_004` XML ID obalu, `NK_AgentID / Kakadu-mastercopy` identita a `Kakadu-8.6.1` doporučený název agenta. Nejde o tři zaměnitelné identifikátory. Verze ve jménu je tvrzením zdrojových metadat, nikoli nezávislým ověřením aplikace.

DMF výslovně uvádí čtyři hodnoty `agentType`. XSD má naproti tomu nepovinný `xs:string`. Typ agenta je odlišný od `linkingAgentRole`, která vyjadřuje roli v konkrétní události a používá vlastní slovník. NK_AgentID a UUID jsou jen příklady typů identifikátorů, nikoli uzavřený seznam.

### agentNote: podmínka a dostupnost údaje

DMF omezuje použití poznámky na software související s vytvořením/migrací původního souboru do JPEG2000. Poznámka má uchovat použitý příkaz pro Kakadu nebo OpenJpeg a má kód **MA**, nikoli M nebo obecné O.

Rozlišujeme:

- **Podmínku platnosti:** skutečně jde o softwarového původce příslušné výroby JPEG 2000, doloženého propojením s událostí a objektem.
- **Dostupnost údaje MA:** použitý příkaz lze zaznamenat. Neznámá dostupnost neznamená automaticky úspěšnou kontrolu ani oprávnění příkaz vymyslet.
- **Obsah:** skutečný příkaz jako textový údaj. Jeho existence neprokazuje správnost parametrů nebo úspěšné provedení.

Samotné jméno Kakadu, hodnota software nebo libovolná migration tuto podmínku nedokládají. Řetězec „creation/migration Event“ v popisu DMF není předepsaná kombinovaná hodnota `eventType`. Slovo Software s velkým S v této větě nemění seznam malých hodnot `agentType`.

Protože se podmíněné pravidlo poznámky mimo uvedený kontext neuplatní, omezení jejího použití tam výslovně kontroluje také popis kontroly kořenového pravidla Agent. Obecný PREMIS jiné poznámky umožňuje; jde o užší použití v DMF.

## Vyhodnocovací kontext pro budoucí implementaci

Jde o deklarativní popisy; registr neprovádí validaci balíčků.

| Kontextové pole | Význam a původ |
|---|---|
| object_type=monograph | Monografický dokument |
| document_role=amd_mets | Právě posuzovaný vedlejší METS |
| preservation_activity_on_aip=true | Doložená ochranná aktivita nad archivními daty popisovanými tímto metadatovým dokumentem; externí kontext procesu, ne odhad z přípony či názvu |
| xpath:/mets:mets/mets:amdSec/mets:digiprovMD/mets:mdWrap/mets:xmlData/premis:agent exists | Alternativní větev kořenového pravidla: Agent byl dodán, například i v SIP |
| metadata_record_type=premis_agent | Pro pravidla dětí byl vybrán konkrétní existující agent v namespace PREMIS |
| xpath:premis:agentType=software | Relativní XPath v právě vybraném agentovi |
| agent_linked_to_jpeg2000_creation_or_migration=true | Doložený účel činnosti přes vazbu z Event a příslušné objekty; ne samotná existence poznámky |

Kořenové pravidlo používá **ochrannou aktivitu AIP NEBO existujícího Agenta**, nikoli jen existenci agenta. Tak zůstává možné zjistit chybějící popis původce ochranné aktivity. Děti se kontrolují v každém vybraném Agent i tehdy, když kontrolovaný potomek chybí. Údaj o kontextu, který není znám, nelze zaměnit za důkaz, že povinnost neplatí.

Prefix `premis` označuje `info:lc/xmlns/premis-v2`, `mets` označuje `http://www.loc.gov/METS/`. Kardinalita každého dítěte platí v bezprostředním rodiči; `max: null` značí neomezené opakování. Pojmenovaná kontextová pole jsou rozhraním pro budoucí implementaci, nikoli novými XML elementy DMF.

## Zdrojové XML ukázky

Sedm pravidel má **deset výřezů** z první stránky [dodaného SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), který v info.xml deklaruje DMF 2.3:

`amdsec/amd_mets_75faba8d-c629-11f0-8950-12e8557df20e_0001.xml`

SHA-256: `4a8d9098cb15b621a0dee3fd5501a3eee2b107088dc728dcace2a36f1e2b583f`.

Základní ukázky pocházejí z AGENT_004 (Kakadu). Doplňují je odkaz z EVT_004, jméno agenta OCR v AGENT_005 a celý AGENT_001 pro posouzení typu.

XPath kontrola tohoto souboru nalezla pět Agent a pět odkazů Event → Agent. Každá dvojice typu a hodnoty odkazu odpovídala právě jednomu identifikátoru. Jediná `agentNote` je v AGENT_004: text příkazu `kdu_compress` s původními cestami a parametry. **Příkaz nebyl spuštěn** a není návodem pro uživatelovo prostředí ani zdrojem normativních kompresních parametrů.

AGENT_001 obsahuje označení Plustek OpticBook A300 a typ software, zatímco jeho událost uvádí roli machine. Zachováváme skutečné hodnoty. To je podnět k věcnému posouzení typu původce, nikoli automatický důkaz chyby XSD nebo důvod tiše přepsat typ na hardware; agentType a linkingAgentRole nejsou totožná pole.

## Ověření a meze

Ověřeny jsou přepis tabulek DMF, obecné XSD a přesná shoda XML výřezů včetně XPath a otisku. Testy hlídají kontext SIP/AIP, více identifikátorů, povinnosti M/R/MA, podmínku poznámky, číselník typu i zařazení do filtrů a grafů.

Externí validátor, Kakadu ani jiný nástroj nebyl spuštěn. Nebyla provedena úplná validace SIP nebo ověřování softwarových verzí. Sedm pravidel pokrývá tabulku Agent v DMF, nikoli všechny volitelné konstrukce obecného PREMIS. Další postup ověřování ukázek popisuje [dokumentace XML ukázek](xml-examples.md).
