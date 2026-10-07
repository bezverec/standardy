# Rozměry, vzorkování a barevné kódování v MIX

Tato skupina rozšiřuje registr o deset pravidel pro DMF Monografie 2.3. Přepis byl 5. 10. 2026 ověřen proti tabulkám v § 7.5.4 na stranách 83, 87 a 88 a proti oficiálnímu XSD MIX 2.0. Sloupce povinnosti a použití MC/PS byly zkontrolovány i ve vykreslených stránkách PDF.

Od 7. 10. 2026 mají tyto položky samostatně doložené [protějšky pro DMF Periodika 2.2](periodical-mix-comparison.md). Následující tabulka nadále uvádí stránky monografického DMF.

## Pokrytí

Všechna níže uvedená pravidla se vztahují na technická metadata MC a PS. UC do jejich podmínky platnosti nespadá.

| Prvek MIX | Kód NDK | Strana DMF | Kategorie registru |
|---|---|---|---|
| `imageWidth` | M | 83 | Rozměry obrazu |
| `imageHeight` | M | 83 | Rozměry obrazu |
| `colorSpace` | M | 83 | Barevné kódování |
| `samplingFrequencyPlane` | R | 87 | Vzorkování |
| `samplingFrequencyUnit` | M | 87 | Vzorkování |
| `xSamplingFrequency` | MA | 87 | Vzorkování |
| `ySamplingFrequency` | MA | 87–88 | Vzorkování |
| `bitsPerSampleValue` | M | 88 | Barevné kódování |
| `bitsPerSampleUnit` | R | 88 | Barevné kódování |
| `samplesPerPixel` | M | 88 | Barevné kódování |

## Podmínky a zápis

Původní kód NDK je uložen v `obligation_code`. U frekvencí X/Y je MA doplněno podmínkou `samplingFrequencyUnit` v množině `in.`, `cm`. Povinné pravidlo jednotky samostatně zachytí její absenci. Bezrozměrná jednotka sama neznamená zákaz uvedení X/Y.

MIX XSD umísťuje jednotku i obě frekvence vedle sebe do `SpatialMetrics`. Odsazení tabulky DMF se proto nesmí mechanicky převést na strom XML. Frekvence používají `rationalType`: čitatele a jmenovatele typu `xsd:integer`. Jejich přítomnost je zahrnuta do pravidla dané osy. Příklad 300/1 z tabulky není v těchto pravidlech interpretován jako minimální požadované PPI. Samotný typ `xsd:integer` nevylučuje nulový jmenovatel; kontrola použitelnosti poměru je další sémantická vrstva.

Šířka, výška, počet složek pixelu a každá hodnota bitové hloubky používají `positiveIntegerType` z MIX 2.0. Zápis více bitových hloubek opakuje `bitsPerSampleValue`; čárkami oddělený seznam není jednou hodnotou `xsd:positiveInteger`. Přepis neomezuje počet složek jen na příklady 1, 3 a 4 ani `colorSpace` jen na příklad RGB.

U R zůstává přítomnost volitelná. Pokud je hodnota uvedena, příslušný číselník XSD se uplatní. M v NDK zpřísňuje obecnou volitelnost prvků v MIX; rozsah `0–1` v tabulce proto není přepsán jako volitelná přítomnost povinného údaje. Opakovaný `bitsPerSampleValue` má v pravidle minimum 1 a neomezené maximum.

Strojové XPath v této skupině předpokládají samostatný záznam s kořenem `mix:mix` a mapování prefixu `mix` na `http://www.loc.gov/mix/v20`. Při zpracování `amd_mets.xml` je třeba vybrat příslušný MIX záznam a vyhodnotit pravidlo v tomto kontextu. Kardinalita platí pro daný MIX záznam, regex pro každý vybraný výskyt. Registr tato pravidla publikuje; validační engine zatím nespouští.

## Vazby a meze ověření

Každé pravidlo je navázáno na DMF Monografie 2.3 a příslušný prvek MIX 2.0. Relace `related_to` propojují rozměry s odpovídající osou vzorkování, X/Y s jednotkou a barevný prostor s počtem složek a ICC jménem.

Stav `verified` označuje ověření přepisu požadavku a jeho zdrojů. V této skupině nebyly nově ověřovány implementace ProArc, JHOVE, jpylyzer ani Komplexní validátor; nejsou jim proto přiděleny potvrzené implementační vazby. Dosavadní ověření nástrojů u pravidla ICC profile version se na tuto skupinu nepřenáší. Číselné hodnoty je pro kontrolu konkrétního objektu nutné porovnat také s jeho obrazovým souborem.

## Prameny

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.5.4, s. 83, 87–88.
- [MIX 2.0 XSD](https://www.loc.gov/standards/mix/mix20/mix20.xsd): `BasicImageInformationType`, `ImageAssessmentMetadataType`, `positiveIntegerType`, `rationalType` a uvedené číselníky.

SHA-256 kontrolovaných souborů (staženo 5. 10. 2026):

```text
DMF_monografie_2.3_final.pdf
77671bf58d0ea816c8bcad658b26cab23555d3a56ce5570cc1303c1627605313

mix20.xsd
aaff5ad9b49e7116b1a3f521e4f3aaa2e75df9f38a2cf708379679c53a107dac
```
