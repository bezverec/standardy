# Periodika a monografie: první porovnávací sada MIX

Zpracováno 7. 10. 2026: deset pravidel **DMF pro digitalizaci periodik 2.2**
(vydání 22. 12. 2025), § 7.5.4. Nejde o standard pro elektronická periodika.
Pravidla mají vlastní identitu `NDK-PER-MIX-*`, standard `ndk-periodical`,
verzi 2.2 a prameny. Po první sadě registr obsahoval 232 monografických a deset periodických
pravidel; nejde o úplný přepis ani jednoho DMF.

## Ověřené dvojice

Text i sloupce povinnosti a MC/PS byly ověřeny ve vykreslených stránkách obou PDF.
Stránky níže odpovídají stránkám PDF. Struktura XML a datové typy byly ověřeny
samostatně proti MIX 2.0 XSD; obecná volitelnost elementu v XSD neruší povinnost NDK.

| Prvek MIX | Monografie 2.3, strana | Periodika 2.2, strana | Kód v obou DMF |
|---|---:|---:|---|
| `imageWidth` | 83 | 70 | M |
| `imageHeight` | 83 | 70 | M |
| `colorSpace` | 83 | 70 | M |
| `samplingFrequencyPlane` | 87 | 74 | R |
| `samplingFrequencyUnit` | 87 | 74 | M |
| `xSamplingFrequency` | 87 | 74–75 | MA |
| `ySamplingFrequency` | 87–88 | 75 | MA |
| `bitsPerSampleValue` | 88 | 75 | M |
| `bitsPerSampleUnit` | 88 | 75 | R |
| `samplesPerPixel` | 88 | 75 | M |

Šest M, dvě MA a dvě R. V této sadě se shodují přepsané technické požadavky
i podmínky MC/PS. Frekvence X/Y jsou podmíněné jednotkou `in.` nebo `cm`;
jejich čitatel a jmenovatel jsou M. Příklad `300/1` není minimální PPI.
`bitsPerSampleValue` je opakovatelný kladný integer, nikoli seznam v jednom elementu.
`colorSpace` není omezeno jen na ilustrační RGB a příklady počtu složek pixelu
nejsou uzavřeným výčtem. Šířka/výška v pixelech není fyzikální rozlišení.

## Jak porovnání číst

[Otevřít Monografie 2.3 proti Periodikům 2.2](https://standardy.digitalizaty.cz/registry/compare?national_standard_a=ndk-monograph&version_a=2.3&national_standard_b=ndk-periodical&version_b=2.2).
Stejný odkaz nabízí úvod porovnávací obrazovky. Pro tuto sadu zadejte do hledání
výsledků `mix.mc-ps.`. Katalogizační režim není nutné omezovat.

- Každý pár má ručně přidělený klíč `mix.mc-ps.*`; nejde o automatické párování
  všech stejně pojmenovaných XML elementů. Rozbalení „Proč jsou pravidla porovnávána“
  obsahuje zdůvodnění a oba prameny.
- **Shodný požadavek** u těchto deseti dvojic znamená shodné evidované technické
  podmínky a požadavky. Rozsah `monograph` / `periodical` je právě osou porovnání:
  zůstává v původních pravidlech a API jej uvádí zvlášť v `scope_changes`.
  Obrazovka jej ukazuje pod „Rozdílný rozsah dokumentů“. Není sám o sobě rozdílem
  požadavku. Jiné podmínky ani povinnosti se neignorují.
- Oba kontexty obsahují MC a PS, nikoli UC. Kardinality a XPath se vztahují
  k jednotlivému `mix:mix` v namespace `http://www.loc.gov/mix/v20`, ne ke všem
  obrazovým souborům balíčku současně.
- Jde o nezávislé technické požadavky. Volba AACR2 či RDA je nevylučuje;
  nezávislost se ale nepřenáší na budoucí bibliografická pravidla periodik.
- Bez katalogizačního filtru může další klíč `mods.descriptive-origin.event-type`
  ukázat více monografických kandidátů. Periodický protějšek zatím není zpracován.
  Není to důkaz, že periodický DMF údaj neřeší nebo zakazuje.

U ověřených dvojic je slovní formulace požadavku sjednocena bez vloženého názvu
DMF; konkrétní standard, verze a prameny zůstávají u každého pravidla.
Porovnávač žádné jiné rozdíly přirozeného jazyka automaticky nemaže.

Tato sada neprokázala technický rozpor mezi DMF. Shoda deseti položek však není
ekvivalence celých DMF. Registry nekontrolují SIP; zaznamenané kontroly nejsou
implementovaným validačním enginem.

## Prameny a meze ověření

- [DMF Periodika 2.2](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_periodika_2.2_final.pdf):
  identita vydání s. 1, standard MIX s. 5, MC/PS a kódy s. 6, technické tabulky s. 70, 74–75.
- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf):
  odpovídající tabulky s. 83, 87–88.
- [MIX 2.0 XSD](https://www.loc.gov/standards/mix/mix20/mix20.xsd):
  XML hierarchie, typy a obecné výčty. Nenahrazuje národní povinnost.

SHA-256 kontrolovaných kopií:

| Pramen | SHA-256 |
|---|---|
| Periodika 2.2 PDF | `b5684bc394cbd957c81521ab285fcea3d884df1dc6e415507f0108e48a41f43d` |
| Monografie 2.3 PDF | `77671bf58d0ea816c8bcad658b26cab23555d3a56ce5570cc1303c1627605313` |
| MIX 2.0 XSD | `aaff5ad9b49e7116b1a3f521e4f3aaa2e75df9f38a2cf708379679c53a107dac` |

Při této první sadě periodický SIP ani chování nástrojů ověřeny nebyly; tehdejších 212 XML ukázek u 166 monografických pravidel zůstalo beze změny. Navazující [sada základních údajů MIX](mix-basic-information.md) již používá samostatný periodický vzor: přidává osm dvojic pravidel a sedm XML výřezů z každého druhu SIP. Registr nyní obsahuje 226 ukázek u 180 pravidel.

Regresní testy kontrolují zdroje, kódy, podmíněné frekvence, opakovatelnost,
ruční klíče, zachování kontextu, nezávislost na katalogizaci, API/D1/OpenAPI
i odkaz a vysvětlení párování v rozhraní. Registr má po navazující sadě celkem 258 pravidel.
