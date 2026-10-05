# XML ukázky ze vzorového SIP

U 31 pravidel DMF Monografie 2.3 jsou dostupné XML ukázky: osm pro `info.xml`, devět pro rozměry, barvu a vzorkování v MIX a čtrnáct pro soubory a vazby v hlavním METS. Některá pravidla sdílejí stejný výřez; nejde o 31 různých souborů. Detail pravidla umožňuje kód zkopírovat a zobrazit jeho původ. Ukázky jsou uložené ve verzovaném poli `examples` příslušného YAML pravidla, a proto jsou také součástí API a JSON exportů. Nemění normativní požadavek ani počet pravidel.

## Původ a meze ověření

Zdrojem je uživatelem dodaný rozbalený balíček `75faba8d-c629-11f0-8950-12e8557df20e`, označený jako oficiální vzor, s [odkazem na stažení z CESNET](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download). Obsahuje monografii *Tomáš Alva Edison a jeho fonograf*, [1890], a v `info.xml` deklaruje metadatovou verzi 2.3. Kontrola proběhla 5. 10. 2026 nad dodanou lokální kopií; identita kopie s aktuálním obsahem vzdáleného archivu nebyla nezávisle ověřena. Celý balíček ani obrazové soubory se do registru nekopírují.

Ukázka typu `source_excerpt` je pozorovaný výřez, **nikoli potvrzení validity nebo univerzální šablona**. Mění se pouze odsazení a přidávají se zděděné deklarace namespace pro samostatné čtení. Hodnoty a pořadí elementů zůstávají zachované. XPath označuje uzel v původním celém dokumentu, ne cestu v osamostatněném výřezu.

Každá ukázka obsahuje:

- stabilní `id`, lokalizované `title` a `note`, `language: xml`, `kind: source_excerpt` a text `code`;
- `source` s odkazem a deklarovanou verzí balíčku;
- relativní `file_path`, `file_sha256` celého původního souboru a `checked_on`;
- `source_xpath` a mapu `namespaces` pro opakovatelné dohledání výřezu.

Otisk SHA-256 identifikuje konkrétní soubor. Neprokazuje autorství ani správnost jeho obsahu. Původní normativní `source` a `verification` pravidla jsou nezávislé na původu ukázky.

## Důležité příklady

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
