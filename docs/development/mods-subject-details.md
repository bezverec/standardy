# Kartografické a jmenné věcné údaje MODS

Navazující sada obsahuje šest pravidel pro přímý subject MODS záznamu svazku **jednosvazkové monografie** v hlavním METS. Kategorie `metadata/mods-subject-details` doplňuje [základní věcné údaje](mods-subject.md); neslučuje jmenné záhlaví s [původci dokumentu](mods-names.md).

## Prameny

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 56; text a celá vykreslená stránka ověřeny 11. 10. 2026.
- S. 24 téhož DMF: povinnost potomka platí uvnitř použitého rodiče; černě vyznačená pravidla jsou společná AACR2/RDA.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): subjectDefinition, cartographicsDefinition, subjectNameDefinition, namePartDefinition, identifierDefinition a stringPlusLanguage.
- [LOC: subject](https://www.loc.gov/standards/mods/userguide/subject.html): sémantika kartografických a jmenných věcných údajů. Obecná doporučení nepřepisují národní mapování.

## Pravidla a kontext rodiče

ID mají prefix `NDK-MONO-MODS-SINGLE-`.

| Suffix | Pole | Kód | Kardinalita v platném kontextu |
|---|---|---|---|
| SUBJECT-CARTOGRAPHICS | subject/cartographics | R | 0..n na subject |
| SUBJECT-CARTOGRAPHICS-COORDINATES | cartographics/coordinates | MA | 1..n při dostupnosti údaje |
| SUBJECT-CARTOGRAPHICS-SCALE | cartographics/scale | MA | 1..1 při dostupnosti údaje |
| SUBJECT-NAME | subject/name | R | 0..n na subject |
| SUBJECT-NAME-PART | subject/name/namePart | M | 1..n na použité name |
| SUBJECT-NAME-IDENTIFIER | subject/name/nameIdentifier | MA | 1..n při dostupnosti autority |

R u kontejneru není změněno na M jen proto, že má povinného potomka. MA je zachováno jako vlastní kód, nikoli obecné M. U MA se podmínka dostupnosti posuzuje pro konkrétní kartografický popis nebo jméno ze zdrojových údajů, ne z přítomnosti cílového XML. Neznámá dostupnost není prokázaná nedostupnost. Platný kontext se nesmí dovozovat jen z právě kontrolované hodnoty.

### Kartografický popis

Cartographics se předpokládá zejména u map a vedut; slovo „zejména“ nevykládáme jako zákaz u ostatních předloh v rozsahu DMF. Není přidána vymyšlená podmínka „pouze mapa“.

Kontejner odkazuje na MARC 034, souřadnice na 034$d/$e/$f/$g, ale měřítko výslovně na **255$a**. Čtyři podpole nejsou požadavkem čtyř elementů coordinates. Přesná serializace souřadnic z těchto podpolí není tímto řádkem určena; sada nepředstírá hotovou konverzní šablonu.

Obecné MODS má v cartographics sekvenci scale, projection, coordinates, cartographicExtension. Scale je nejvýše jeden, coordinates mohou být opakované. Obě pole jsou textová, ne povinně číslo či jediný formát 1:n. Pořadí a horní kardinality jsou vlastností XSD; národní MA je samostatný požadavek. Souřadnice předlohy nejsou pixely ALTO a její měřítko není DPI skenu. Pro projection a cartographicExtension zde nejsou vytvořeny nové národní požadavky.

### Jmenné věcné záhlaví

Subject/name popisuje jmenný předmět obsahu, nikoli automaticky autora. DMF uvádí osobní autoritu či MARC 600; jmenná část odkazuje na 600$a. Řádek namePart zároveň používá slovo „autor“ a zmiňuje název korporace. Tyto formulace zachováváme s výkladem podle rodičovského kontextu; nepřidáváme neověřené mapování korporací na jiné MARC pole.

NamePart musí obsahovat vlastní jméno. Pouhá životní data type=date je nenahradí; zároveň se nezaměňují s subject/temporal. Sada nevynucuje dělení given/family ani obecný zákaz type.

**SubjectNameDefinition není top-level nameDefinition.** V MODS 3.8 neobsahuje etal ani alternativeName. Nepřebíráme sem pravidla pro role původců jen na základě shodného názvu elementu.

NameIdentifier označuje dostupnou národní autoritu konkrétního jména. Není to automaticky celé číslo, UUID SIP, kód slovníku czenas ani identifikátor jiného původce. DMF v tomto řádku neukládá regex nebo povinný type. Správnost autoritního přiřazení nebyla ověřena.

Všechny požadavky jsou společné AACR2/RDA podle černých řádků a legendy. Nevytvářejí se nové významové klíče pro porovnávač ani pravidla DC podle sloupce dc:subject. Classification zůstává pro další sadu.

## Tři skutečné XML výřezy

[Vzorový SIP monografie](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download) deklaruje DMF 2.3, MODS 3.8 a descriptionStandard=aacr. Záznam MODSMD_VOLUME_0001 obsahuje genre=volume, issuance=single unit a vazby DMDID z fyzické i logické mapy.

Zdroj je hlavní METS s otiskem SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`. V druhém subject je osobní záhlaví Edisona se dvěma namePart:

- vlastní jméno „Edison, Thomas A. (Thomas Alva)“;
- životní data „1847-1931“ s type=date.

Tři výřezy u dvou pravidel tvoří celé name a obě jeho části. U výřezu dat je výslovně uvedeno, že sám nesplňuje požadavek vlastního jména. Nejde o ukázku původce knihy.

V příslušném MODS svazku nejsou cartographics ani subject/name/nameIdentifier. Chybějící identifikátor nedokládá nedostupnost autority; nehodnotíme tím splnění MA. Ukázky se nevymýšlejí. Původní MARC, autoritní služba, RDA ani celý SIP nebyly validovány.

## Kontroly a omezení

Lokální ověření 11. 10. 2026:

- validace 298 zdrojových YAML dokumentů a typová kontrola prošly;
- všech 328 testů ve 47 souborech prošlo, včetně významových hranic nové sady;
- celé sestavení prošlo: 288 pravidel (270 monografických a 18 periodických), 226 entit a 1562 relací;
- registr obsahuje 250 XML ukázek u 196 pravidel; všech 243 monografických výřezů prošlo kontrolou syntaxe, SHA-256, jednoznačnosti XPath a shody se zdrojovým SIP;
- kontrola diffu prošla.

Registr neprovádí deklarativní custom kontroly nad SIP. Odborně otevřená zůstává přesná serializace kartografických souřadnic a rozšíření nejednoznačného mapování korporací; tato sada nic z toho nevydává za implementovanou konverzi. Záznam lokálních kontrol sám nepotvrzuje nasazení; publikovanou revizi určuje shoda dataset_version ve veřejném API a exportech.
