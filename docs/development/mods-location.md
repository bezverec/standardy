# Uložení předlohy v MODS

Sedm pravidel kategorie `metadata/mods-location` popisuje uložení předlohy **jednosvazkové monografie** v hlavním METS. Nepřenáší se automaticky na titul vícesvazku, přílohu, stránku, vnořené relatedItem ani holdingSimple/copyInformation.

## Podklady

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 58; vizuálně ověřeno 28. 10. 2026.
- Legenda s. 24: povinné děti se posuzují v použitém rodiči; nerozlišený černý text je společným předpisem AACR2/RDA.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): modsGroup, locationDefinition, physicalLocationDefinition, authorityAttributeGroup, shelfLocator, urlDefinition a identifierDefinition.
- [LOC location](https://www.loc.gov/standards/mods/userguide/location.html): odlišení identifikace instituce, signatury a elektronické lokace.

## Pravidla a kontext

Prefix ID je `NDK-MONO-MODS-SINGLE-`.

| Suffix ID | Cíl | Povinnost | Kardinalita a kontext |
|---|---|---|---|
| LOCATION | location | MA | 1..n na záznam, pokud jsou údaje dostupné |
| PHYSICAL-LOCATION | physicalLocation | M | 1..1 v použitém location |
| PHYSICAL-LOCATION-AUTHORITY | @authority | M | 1..1 na physicalLocation |
| SHELF-LOCATOR | shelfLocator | MA | 1..n v location při dostupnosti údaje |
| PHYSICAL-COPY-IDENTIFIER | identifikace fyzického exempláře | slovní povinnost | pokud vlastník signatury vůbec nepřiděluje |
| LOCATION-URL | url | O | 0..n v location |
| LOCATION-URL-NOTE | url/@note | O | 0..1 na url |

MA rodiče není bezpodmínečné M. Dostupnost `location_metadata_available` a `shelf_locator_metadata_available` se zjišťuje ze zdrojových údajů, nikoli z přítomnosti cílového XML. U URL se nevymýšlí uzavřený seznam schémat ani online kontrola dostupnosti; note je volný text.

### Autorita není typ lokace

Tabulka s. 58 předepisuje **authority** s hodnotami `siglaADR`, `ICO` nebo `NARP`. Identifikátor instituce musí odpovídat vybranému systému; příklad ABA001 není univerzální konstanta.

Changelog s. 109 označuje tento atribut jako type. Registr sleduje vlastní tabulku, což odpovídá i rozlišení LOC: authority určuje zdroj kódu, type druh lokace. Nejde o nový zákaz type. Živé registry institucí jsme nekontrolovali.

### Fyzická předloha bez signatury

Podmínka `owner_assigns_shelfmarks=false` znamená, že vlastník signatury vůbec nepřiděluje. Není ekvivalentní chybějícímu shelfLocator nebo neúplnému katalogovému záznamu. Náhradní povinnost se proto posuzuje na úrovni záznamu, nezávisle na existenci location.

Požadován je jiný jednoznačný identifikátor **konkrétního fyzického exempláře**. Barcode a accession v identifier jsou příklady, ne uzavřený výčet ani povinnost uvést oba současně. ISBN vydání, sigla instituce či UUID digitálního objektu bez doložené vazby na fyzický exemplář neprokazují splnění této povinnosti. Pramen nepřikazuje jedinou XML reprezentaci; cílová entita identifier zachycuje uvedený příklad řešení.

## Ukázky a meze

Čtyři výřezy z [dodaného SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download) zachovávají location, physicalLocation (také pro pravidlo authority) a shelfLocator. Záznam MODSMD_VOLUME_0001 má genre=volume, issuance=single unit a descriptionStandard=aacr; info deklaruje DMF 2.3.

Soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256:
`7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`.

Základ XPath:
`/mets:mets/mets:dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:location`.
Namespace: mets = http://www.loc.gov/METS/, mods = http://www.loc.gov/mods/v3.

Vzor obsahuje siglu ABA001 a signaturu 54 H 001617. Neobsahuje zde url ani url/@note; nedokládá IČO, NARP, RDA ani případ vlastníka bez signatur. Správnost signatury, původní MARC a úplná validita SIP nejsou touto kontrolou potvrzeny.

Registr obsahuje deklarativní custom kontroly; nevykonává je nad SIP. Nové mezi-DMF párovací klíče ani tvrzení o implementacích nástrojů tato sada nepřidává. Ověření přepisu a ukázek není nasazení.

## Provedené kontroly

- Validace 315 YAML dokumentů a typová kontrola prošly.
- Všech 447 testů v 51 souborech prošlo, včetně sedmi významových testů této sady a filtrů API.
- Celé sestavení prošlo: 305 pravidel (287 monografických, 18 periodických), 242 entit a 1643 vazeb.
- Všech 250 monografických ukázek prošlo kontrolou syntaxe a shody se zdrojem (SHA-256 a XPath). Celý registr obsahuje 257 ukázek u 202 pravidel.
- Kontrola diffu a validace aktualizovaného skillu prošly. Zůstává dřívější nesouvisející upozornění MkDocs na kotvu poznámky v openexr-preservation-master.md.

Kontroly proběhly lokálně 28. 10. 2026. Původní MARC, živé autoritní registry, správnost signatury a implementace nástrojů nebyly ověřeny. GitHub CI ani produkční nasazení nebyly v tomto kroku spuštěny.
