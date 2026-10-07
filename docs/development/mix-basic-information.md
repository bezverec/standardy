# Identifikace, velikost a formát v MIX

Sada z 7. 10. 2026 přidává **16 pravidel: osm pro DMF Monografie 2.3 a osm pro DMF Periodika 2.2**. Jde o základní technické údaje obrazových souborů MC a PS, nikoli UC nebo elektronických publikací. Kategorie je `technical/mix-basic`. Požadavky jsou nezávislé na AACR2/RDA.

## Prameny a povinnosti

Každý národní požadavek má vlastní zdroj a verzi. Hierarchii a obecné datové typy ověřujeme odděleně proti [MIX 2.0 XSD](https://www.loc.gov/standards/mix/mix20/mix20.xsd). Tabulky byly ověřeny také vizuálně ve vykreslených PDF:

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.5.4, s. 82–83.
- [DMF Periodika 2.2](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_periodika_2.2_final.pdf), § 7.5.4, s. 69–70.

| Prvek pod BasicDigitalObjectInformation | Kód v obou DMF | Monografie | Periodika |
| --- | --- | --- | --- |
| ObjectIdentifier | R | 82 | 69 |
| ObjectIdentifier/objectIdentifierType | M | 82 | 69 |
| ObjectIdentifier/objectIdentifierValue | M | 83 | 69 |
| fileSize | R | 83 | 69 |
| FormatDesignation | M | 83 | 69 |
| FormatDesignation/formatName | M | 83 | 69 |
| FormatDesignation/formatVersion | M | 83 | 70 |
| byteOrder | M | 83 | 70 |

Doporučený `ObjectIdentifier` lze opakovat. Jeho děti mají v DMF kód **M uvnitř každého uvedeného kontejneru**, nikoli MA a nikoli povinnost vytvořit samotný kontejner. Podmínka `element_role=mix_object_identifier` vymezuje tento rozsah; kontrola není globálním počtem dětí napříč všemi identifikátory.

`fileSize` je doporučená velikost v bajtech. XSD používá nezáporné celé číslo, nikoli nutně kladné číslo; zaznamenaná lexikální kontrola připouští nulu, počáteční plus, úvodní nuly a zápis záporné nuly. Sama neporovnává hodnotu se skutečným souborem.

`formatName` a `formatVersion` nejsou uzavřené číselníky. Hodnoty image/jp2, 1.0 a revize TIFF jsou příklady; verze formátu není verze ICC, DMF ani aplikace. `byteOrder` má naopak přesný výčet `big endian` a `little endian`. Volitelnost prvků v obecném XSD nezměkčuje povinnost M v národním DMF.

## Porovnání

Osm explicitních klíčů `mix.mc-ps.*` páruje ručně zkontrolované protějšky. Všech osm dvojic má shodný zaznamenaný požadavek; rozdílný druh dokumentu zůstává viditelný jako rozsah platnosti. Spolu s [první sadou](periodical-mix-comparison.md) lze porovnat **18 dvojic MIX**. Nejde o tvrzení, že jsou celé DMF shodné.

Celkem registr obsahuje 258 pravidel (240 monografických a 18 periodických), z toho 39 MIX. Přibylo osm sdílených entit MIX; celkový počet entit je 199.

## Skutečné XML ukázky

Přibylo sedm monografických a sedm periodických výřezů. V kontrolovaných blocích není `fileSize`, proto pro něj nevytváříme umělou ukázku ani nepřebíráme velikost z METS.

Monografický zdroj je [uživatelem dodaný SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download) deklarující 2.3, soubor `amdsec/amd_mets_75faba8d-c629-11f0-8950-12e8557df20e_0001.xml`, blok MIX_003. Jeho identifikátor je MC_1_00010003_2R.

Periodický zdroj je [nově dodaný vzor](https://owncloud.cesnet.cz/index.php/s/5RGtiExK6K9MJEc/download), stažený 7. 10. 2026. Balíček `19abc49f-8c9c-11f1-9b37-7a8cbcd65e2f` deklaruje v info.xml verzi 2.2 a obsahuje číslo Troppauer Zeitung z 4. 1. 1902. Výřezy pocházejí ze souboru `amdsec/amd_mets_19abc49f-8c9c-11f1-9b37-7a8cbcd65e2f_0001.xml`, bloku MIX_003 s identifikátorem MC_1_0008_2R.

**Pozorovaný nesoulad periodického vzoru:** záznam `fileSec` pro MC má `ADMID="OBJ_002 MIX_002"`. MIX_002 přitom uvádí PS a TIFF 6.0, zatímco MIX_003 uvádí MC, image/jp2 a verzi 1.0. Proto výřezy neprezentujeme jako bezchybně navázaný MC záznam. Zdroj se neopravuje a každá periodická ukázka obsahuje upozornění.

Oba použité bloky MIX_003 uvádějí typ identifikátoru JHOVE, image/jp2, verzi 1.0 a big endian. Výskyt JHOVE není novým ověřením jeho implementace. Text Valid a verze validace 2.7 v periodickém info.xml jsou tvrzení balíčku, nikoli náš výsledek.

### Otisky zdrojů SHA-256

| Zdroj | SHA-256 |
| --- | --- |
| Monografie 2.3 PDF | `77671bf58d0ea816c8bcad658b26cab23555d3a56ce5570cc1303c1627605313` |
| Periodika 2.2 PDF | `b5684bc394cbd957c81521ab285fcea3d884df1dc6e415507f0108e48a41f43d` |
| MIX 2.0 XSD | `aaff5ad9b49e7116b1a3f521e4f3aaa2e75df9f38a2cf708379679c53a107dac` |
| Monografický amd_mets | `4a8d9098cb15b621a0dee3fd5501a3eee2b107088dc728dcace2a36f1e2b583f` |
| Periodický ZIP | `ab674beae139a71e76d5a6073339080d3b662449ef9aa3a4d81dc28116f4293d` |
| Periodický amd_mets | `c5b5e451618486b3a333daa1d504a6b48662465903f9cfe0bb6dc98534e870ec` |

Otisky identifikují kontrolované kopie, nikoli autorství či správnost. Kontrola se týká přepisu požadavků a doložených XML uzlů, nikoli úplné validace SIP, obrazů, všech vazeb nebo chování nástrojů. Celé archivy ani obrazy se do repozitáře nepřidávají.

Registr má nyní **226 ukázek u 180 pravidel**: 219 u 173 monografických a sedm u sedmi periodických. [Postup ověřování ukázek](xml-examples.md) odděluje oba zdroje.

