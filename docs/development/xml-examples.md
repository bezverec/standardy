# XML ukázky ze vzorového SIP

U 166 pravidel DMF Monografie 2.3 je dostupných 212 XML ukázek. Pravidla s ukázkami zahrnují osm pro `info.xml`, devět pro MIX, padesát čtyři pro hlavní METS, osm pro vedlejší METS, dvacet devět pro MODS, třicet pět pro PREMIS Object, šestnáct pro PREMIS Event a sedm pro PREMIS Agent. Pravidlo file/@ADMID ve vedlejším METS má pět výřezů pro porovnání odkazů s cílovými metadaty; PREMIS format má ukázku MC i ALTO. CreatingApplication a originalName mají ukázky MC, PS i ALTO; preservationLevelValue ukazuje dvě úrovně ochrany. Některá pravidla sdílejí stejný výřez; nejde o 212 různých souborů. Detail pravidla umožňuje kód zkopírovat a zobrazit jeho původ. Ukázky jsou uložené ve verzovaném poli `examples` příslušného YAML pravidla, a proto jsou také součástí API a JSON exportů. Nemění normativní požadavek ani počet pravidel.

Skupina [vnitřních částí](mets-internal-parts.md) nepřidává zdrojové XML ukázky: dodaný SIP neobsahuje kapitoly ani obrazové logické uzly. Ilustrativní zápis v dokumentaci je výslovně autorský, není výřezem balíčku a nezapočítává se do 212 ukázek.

## Původ a meze ověření

Zdrojem je uživatelem dodaný rozbalený balíček `75faba8d-c629-11f0-8950-12e8557df20e`, označený jako oficiální vzor, s [odkazem na stažení z CESNET](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download). Obsahuje monografii *Tomáš Alva Edison a jeho fonograf*, [1890], a v `info.xml` deklaruje metadatovou verzi 2.3. Kontrola proběhla 5. 10. 2026 nad dodanou lokální kopií; identita kopie s aktuálním obsahem vzdáleného archivu nebyla nezávisle ověřena. Celý balíček ani obrazové soubory se do registru nekopírují.

Ukázka typu `source_excerpt` je pozorovaný výřez, **nikoli potvrzení validity nebo univerzální šablona**. Mění se pouze odsazení a přidávají se zděděné deklarace namespace pro samostatné čtení. Hodnoty a pořadí elementů zůstávají zachované. XPath označuje uzel v původním celém dokumentu, ne cestu v osamostatněném výřezu.

Každá ukázka obsahuje:

- stabilní `id`, lokalizované `title` a `note`, `language: xml`, `kind: source_excerpt` a text `code`;
- `source` s odkazem a deklarovanou verzí balíčku;
- relativní `file_path`, `file_sha256` celého původního souboru a `checked_on`;
- `source_xpath` a mapu `namespaces` pro opakovatelné dohledání výřezu.

Otisk SHA-256 identifikuje konkrétní soubor. Neprokazuje autorství ani správnost jeho obsahu. Původní normativní `source` a `verification` pravidla jsou nezávislé na původu ukázky.

[Podrobnosti jmen MODS](mods-name-details.md) nepřidávají další zdrojové ukázky: přímý původce svazku nemá typované namePart, alternativeName ani etal. Životopisná data Edisona jsou v subject/name, nikoli u původce, a nesmějí být vydávána za ukázku této skupiny.

## Důležité příklady

- [Data vydání a dalších událostí MODS](mods-origin-dates.md) přidávají tři ukázky u dvou pravidel: textové [1890] a kódované 1890. Dva zápisy nejsou dvěma mezemi intervalu; vzor nedokládá point, qualifier, calendar ani dateOther.
- [Copyright, vznik a vydávání MODS](mods-origin-completion.md) přidává výřez issuance=single unit. Vzor nedokládá copyrightDate, dateCreated ani edition; původní MARC nebyl analyzován.
- [Nakladatelé a výrobci MODS](mods-origin-agents.md) doplňují čtyři výřezy u čtyř pravidel: agent, jeho jméno a textovou roli publisher. Ukázky nedokládají distributora ani větev copyright.
- [Původ a místa vydání MODS](mods-origin.md) přidávají osm ukázek u šesti pravidel: AACR originInfo bez eventType, place a kódový i textový placeTerm. Dodaný vzor nedokládá větev RDA.
- [Typ dokumentu a žánr MODS](mods-resource-genre.md) přidávají šest ukázek u čtyř pravidel: text, volume a dvojici czenas/biografie a marcgt/biography. Druhá autorita není splněním doporučení czenas; ukázka není univerzálním potvrzením správnosti.

- [Původci a role MODS](mods-names.md) přidávají devět výřezů u devíti pravidel: jméno Mařík, J., jeho autoritní identifikátor a role aut. Nejde o ověření autoritní služby nebo původního MARC záznamu.
- [Názvové údaje MODS](mods-titles.md) přidávají tři výřezy u tří pravidel. Vzor dokládá hlavní titleInfo a title, nikoli variantní název, nonSort, podnázev či názvové údaje části.
- [Obálky MODS/DC](mets-dmd.md) přidávají čtrnáct výřezů u osmi pravidel: úplné sekce, obálky a XML kontejnery první stránky, s odlišenými ID a verzemi.
- [Blokové vazby METS–ALTO](mets-alto-links.md) přidávají čtyři výřezy u tří pravidel. Jde pouze o záznam souboru ALTO a skutečný TextBlock, ne o existující logický odkaz fptr/area. Vzor neobsahuje ComposedBlock; namespace v4 sám nepotvrzuje minor verzi 4.4.

- [Logická mapa a výčet stran](mets-logical.md) přidávají 13 výřezů u devíti pravidel; pravidlo titulu vícesvazkové monografie nemá ukázku, protože dodaný SIP je jednodílný. Úplný structLink zachovává všech 16 vazeb, nikoli předepsaný počet pro jiné knihy.
- [Fyzická mapa](mets-physical.md) přidává 17 výřezů u 12 pravidel, včetně porovnání s MODS a doloženého rozdílu mezi cílem ADMID v DMF a dokumentaci METS. Plné mapy obsahují všech 16 stran vzoru; číslo 16 není normativní požadavek.

- [Vedlejší METS](mets-amd.md) obsahuje doložené nevyhovující ukázky: čtyři fileGrp namísto jedné skupiny a ADMID, která odkazují na existující, ale sémanticky nesprávné technické záznamy. Výřezy se záměrně neopravují. Identifikátory PREMIS a základní informace MIX jsou připojené jako další ukázky důkazu.
- [PREMIS Object](premis-object.md) přidává 17 výřezů MC z OBJ_003 a jeden výřez formátu ALTO z OBJ_004. Velikost i MD5 první stránky byly ověřeny proti skutečným souborům, nikoli podle chybného ADMID. Slovník identifikátorů a přiřazení PUID ve vzoru nejsou tímto ověřeny.
- [Vznik a ochrana souboru](premis-provenance.md) přidávají dalších třináct výřezů u osmi pravidel. CreatingApplication a originalName mají ukázky MC, PS i ALTO. Původní názvy se zachovávají včetně dvojitých přípon, nikoli nahrazují současným pojmenováním v SIP.
- [Vazby objektů a událostí](premis-relationships.md) přidávají čtrnáct výřezů u deseti pravidel. ALTO odkazuje na MC, nikoli přímo na PS. Ukázka relationship u PS dokládá vnořené události, ale absenci přímého linkingEventIdentifier prokazuje až XPath kontrola celého objektu. Pro chybějící děti přímého odkazu a neuvedené doporučené pořadí se ukázky nevymýšlejí.
- [PREMIS Event](premis-events.md) přidává 23 výřezů u 16 pravidel: identifikaci, typy, čas, upřesnění, výsledek a vazby na agenty a objekty. Zachovává i OK, machine a celé řetězce typ/upřesnění; jejich výskyt není důkazem příslušnosti ke konkrétnímu číselníku ani předepsané syntaxe.
- [PREMIS Agent](premis-agents.md) přidává deset výřezů u sedmi pravidel včetně páru odkaz–identita a původního příkazu Kakadu v agentNote. Příkaz je textový doklad, nebyl vykonán; cesty ani kompresní parametry se nepřebírají jako požadavky standardu.
- [Kořen a hlavička METS](mets-header.md) přidávají devět přesných výřezů u osmi pravidel hlavičky. Čtyři pravidla kořene nemají uměle zkrácený XML příklad: celý kořen je celý rozsáhlý hlavní METS a přesahuje limit příkladu. Jeho atributy a vada schemaLocation jsou popsány v rozboru se zdrojovým otiskem.

- [METS soubory a vazby](mets-files.md) používají celou skupinu MC, záznam prvního obrazu, jeho lokátor a první stránkový `div` s pěti odkazy. Výřez skupiny MC nezobrazuje ostatní čtyři skupiny ani celý `fileSec`. Hodnoty součtů a velikostí ve výřezu jsou zachovány ze zdroje; samotné porovnání výřezu není jejich nezávislým přepočtem.

- [Záznam validace](https://standardy.digitalizaty.cz/registry/rules/NDK-MONO-INFO-VALIDATION?version=2.3) zachovává `<validation version="all_pages:1.0">Valid</validation>`. Jde o tvrzení zdroje, nikoli o nově spuštěný validátor.
- [Checksum](https://standardy.digitalizaty.cz/registry/rules/NDK-MONO-INFO-CHECKSUM?version=2.3) ukazuje MD5 souboru se seznamem kontrolních součtů. Atribut byl porovnán se skutečným MD5 tohoto souboru v lokálním balíčku a shoduje se. Kontrolu všech obrazů a všech ostatních vazeb tím netvrdíme.
- [Vzorkování X](https://standardy.digitalizaty.cz/registry/rules/NDK-MONO-MIX-X-SAMPLING-FREQUENCY?version=2.3) ukazuje v bloku `MIX_003` objekt MC s hodnotou `15748/39` při jednotce `in.`. V témže administrativním METS má PS v `MIX_002` hodnotu `400/1`. MC je zachováno beze změny, nikoli zaokrouhleno nebo zaměněno za PS.
- Ve zkontrolovaných souborech `amdsec` nejsou elementy `iccProfileName`, `iccProfileVersion` ani `iccProfileURI`. K pravidlům ICC z tohoto balíčku nejsou doplňovány vymyšlené hodnoty. Absence výřezu není rozhodnutím o souladu balíčku s podmíněnými pravidly ICC.

## Ověření a přidávání dalších ukázek

`npm test` kontroluje XML syntaxi všech ukázek pomocí standardní knihovny Pythonu, schéma původu, unikátnost ID v jedné verzi pravidla a bezpečné zobrazení XML jako textu. Neprovádí XSD ani úplnou validaci NDK. Python je stejně jako pro sestavení MkDocs nutnou součástí vývojového prostředí.

Po sestavení lze výřezy porovnat s rozbaleným zdrojem. Ve Windows PowerShellu například:

```powershell
npm run registry:build
Get-Content -Raw dist/registry/rules.json | python scripts/verify-xml-examples.py --source-root 'D:/75faba8d-c629-11f0-8950-12e8557df20e'
```

Bez `--source-root` skript kontroluje jen XML syntaxi. S ním ověřuje SHA-256 a strukturu vybraného uzlu včetně hodnot a atributů. Nepřistupuje na síť a nic nemění. Podporuje absolutní cesty po elementech a predikáty atributů používané v těchto ukázkách, nikoli obecný XPath 2.0. Při přidávání dalšího balíčku spouštějte porovnání pouze nad pravidly či ukázkami z odpovídajícího zdroje.

Novou ukázku přidejte jen k odpovídající verzi pravidla; zvolte krátký výřez a popište roli objektu (např. MC versus PS). Nepoužívejte automaticky ukázku ze starší DMF pro nové pravidlo. Ukázka se nesmí potichu opravit tak, aby vypadala jako doslovný obsah zdroje.
