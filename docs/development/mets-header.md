# Kořen a hlavička hlavního METS

Dvanáct pravidel pro DMF Monografie 2.3 doplňuje [evidenci souborů](mets-files.md) o § 7.2 a 7.3. Kategorie `structure/mets-header` patří pod METS a strukturální metadata. Platí pro **hlavní METS jednoho svazku**, nikoli automaticky pro vedlejší stránkové METS nebo záznamy PREMIS.

Na kořen navazuje také [fyzická mapa hlavního METS](mets-physical.md) s popisem stran, paginace a metadatových vazeb.

## Zdroje

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), s. 18–19, § 7.2–7.3. Povinnosti byly zkontrolovány i vizuálně ve vykreslených tabulkách; s. 5 určuje verzi METS 1.9.1.
- [METS 1.9.1 XSD](https://www.loc.gov/standards/mets/version191/mets.xsd): kořen, metsHdr, agent, name a příslušné atributy. Obecná kardinalita a datové typy jsou oddělené od požadavků DMF.
- [W3C XML Schema 1.0, Structures, § 4.3.2](https://www.w3.org/TR/xmlschema-1/#schema-loc): význam dvojic namespace a umístění schématu v `xsi:schemaLocation`.

## Skupina pravidel

| Pravidlo | Povinnost | Četnost v daném kontextu |
|---|---|---|
| Kořen mets | M | 1–1 |
| Kořenové LABEL | M | 1–1 |
| Kořenové TYPE=Monograph | M | 1–1 |
| Odkazy na použitá schémata | Slovní požadavek | Podle použitých schémat |
| Hlavička metsHdr | M | 1–1 |
| CREATEDATE | M | 1–1 |
| LASTMODDATE | M | 1–1 |
| Agent tvůrce s ROLE=CREATOR | M | Alespoň jeden v hlavičce |
| Agent vlastníka s ROLE=ARCHIVIST | M | Alespoň jeden v hlavičce |
| TYPE=ORGANIZATION u těchto dvou rolí | M | 1–1 u každého příslušného agenta |
| name tvůrce | M | 1–1 u každého CREATOR |
| name vlastníka | M | 1–1 u každého ARCHIVIST |

Kód M je převzat z tabulek. Jedinou výjimkou je úvodní věta o odkazech na schémata: registr ji označuje `obligation: mandatory`, `obligation_source: prose`, bez domyšleného původního kódu. Povinnost agenta a jeho konkrétní ROLE je spojena v jednom pravidle pro každou roli; shodný požadavek TYPE obou rolí je v jednom společném pravidle. Skupina tak pokrývá všechny požadavky těchto dvou oddílů, ale počty pravidel nejsou mechanickým počtem řádků tabulky.

### Kořen a popis dokumentu

Kořen musí být element mets v namespace `http://www.loc.gov/METS/`; konkrétní XML prefix není předepsán. TYPE má přesnou hodnotu `Monograph`, zatímco LABEL nese název a rok vydání oddělené čárkami. Nejde o TYPE strukturální mapy ani o TYPE agenta.

Vzor má LABEL `Tomáš Alva Edison a jeho fonograf, [1890]`. Hranaté závorky zachováváme a nevnucujeme zjednodušující regex pouze pro čtyři číslice. Tato skupina také nezavádí povinné OBJID, ID nebo PROFILE, které tabulka § 7.2 neuvádí.

### Hlavička popisuje záznam, ne digitalizační událost

CREATEDATE a LASTMODDATE jsou data vzniku a poslední úpravy **METS záznamu**, v ISO 8601 včetně sekund. XSD oba atributy dovoluje vynechat, DMF je vyžaduje. Nevymýšlíme povinné časové pásmo, shodu s exportem SIP nebo s PREMIS eventDateTime.

Ve vzoru jsou `2025-11-20T15:56:25` a `2026-06-29T13:27:53`. Samotná odlišnost od data vzniku balíčku nebo skenování není prokázanou chybou.

### Tvůrce a vlastník jsou dvě role

Hlavička potřebuje oba záznamy: CREATOR a ARCHIVIST. Dva tvůrci nenahradí vlastníka. Stejná organizace však může být v obou rolích, jako ABA001 ve vzoru. Z požadavku na dvě role neodvozujeme přesný celkový počet dvou agentů ani zákaz dalších rolí obecného METS.

U obou povinných rolí DMF vyžaduje ORGANIZATION. Jméno tvůrce označuje dodavatele nebo siglu knihovny; u vlastníka se v knihovním kontextu také používá sigla. ABA001 není univerzální hodnota pro všechny instituce. ARCHIVIST v tomto oddílu označuje vlastníka METS, nikoli automaticky držitele autorských práv.

`mets:agent` v hlavičce není `premis:agent` v digiprovMD. Neplatí pro něj PREMIS číselník organization/person/software/hardware ani PREMIS pravidla pro agentNote. `info/creator` zase popisuje tvůrce balíčku, jehož shodu s tvůrcem METS nelze předpokládat bez dalšího kontextu.

## Odkazy na schémata a zjištění ve vzoru

DMF požaduje odkazy na použitá schémata, ale neuvádí v této větě neměnné doslovné URL ani konkrétní serializaci. Vzor používá `xsi:schemaLocation`. Ten obsahuje dvojice namespace URI a adresy XSD; samotná deklarace xmlns není odkazem na konkrétní XSD. Odkaz na obecné `mets.xsd` neprokazuje konkrétní verzi 1.9.1.

Při čtení kořenového `/mets:mets/@xsi:schemaLocation` bylo zjištěno **11 URI**, tedy pět kompletních dvojic a poslední nepárová adresa:

`http://www.cdlib.org/groups/rmg/docs/copyrightMD.xsd`

Namespace copyrightMD `http://www.cdlib.org/inside/diglib/copyrightMD` je sice deklarován pomocí xmlns, ale chybí ve dvojici schemaLocation. Jde o vadu seznamu lokalizačních nápověd. XML je parsovatelné; toto zjištění není výsledkem externího validátoru ani důkazem poškození obrazových dat. Zdrojový SIP nebyl opraven a neověřovali jsme dostupnost všech historických URL.

## Ukázky a jejich původ

Devět přesných XML výřezů je připojeno k osmi pravidlům hlavičky: úplný metsHdr, jednotliví agenti nebo jejich name. Typ ORGANIZATION má příklad tvůrce i vlastníka.

Čtyři kořenová pravidla nemají vložený XML výřez. Celý kořen je zároveň celý hlavní METS, přesahující limit 20 000 znaků pro ukázku. Neměníme jej na prázdný element ani nepřidáváme výpustku vydávanou za přesný zdroj. Pozorované atributy jsou popsány zde a nesrovnalost také v pravidle SCHEMA-LINKS.

Zdroj je [uživatelem dodaný vzorový SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), deklarující DMF 2.3:

`mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`

SHA-256: `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`.

Výřezy zachovávají XPath, namespace a hodnoty. Změnit lze pouze jejich odsazení a doplnit potřebnou namespace deklaraci, nikoli údaje ve vzoru.

## Kontext kontrol a meze ověření

Základní podmínky jsou `object_type=monograph` a `document_role=main_mets`. Pravidla přítomnosti kořene, hlavičky a obou rolí se nepodmiňují existencí kontrolovaného prvku. U typu a jména agenta se používá `mets_header_agent_role`: ROLE právě vybraného metsHdr/agent; nikoli jeho TYPE, kořenové TYPE nebo role PREMIS agenta. Chybějící role se zachytí samostatným pravidlem role.

Obecné entity agent a name jsou sdílené mezi pravidly tvůrce a vlastníka, netvoří dva odlišné XML elementy. Taxonomie je odvozena od METS jako vlastníka entity, nikoli od citovaných souvisejících standardů.

Ověřen je přepis zdrojů, obsah hlavičky, kořenové atributy a přesná shoda XML ukázek. Nebyl spuštěn externí NDK validátor ani provedena úplná validace SIP. `custom` kontroly popisují budoucí implementaci; registr je nevykonává.
