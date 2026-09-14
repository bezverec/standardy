# Případ `iccProfileVersion`

Tento záznam je první pravidlo registru dotažené od primárních specifikací přes strojový požadavek až po doporučené chování validátoru.

## Závěr

`mix:iccProfileVersion` má nést **číselnou verzi formátu ICC profilu přečtenou z hlavičky profilu**, například `2`, `2.4`, `4.3` nebo `4.4.0.0`. Hodnoty `sRGB`, `Adobe RGB` nebo `sRGB IEC61966-2.1` jsou názvy či označení profilů/barevných prostorů, nikoli čísla verze formátu.

Specifikace ICC.1:2022 definuje pole verze v bajtech 8–11 hlavičky profilu. První bajt nese hlavní verzi, následující půlbajty vedlejší a opravnou verzi; zbývající bajty jsou rezervované. Registry proto zachovává jednu až čtyři číselné složky, podle přesnosti vrácené zdrojovým nástrojem.

## Známý rozpor ve zdrojích

DMF Monografie 2.3 na straně 83 správně popisuje `iccProfileVersion` jako „verzi profilu“, ale jako příklad uvádí `sRGB IEC61966-2.1`. Tento řetězec nevyjadřuje verzi binárního formátu ICC profilu. Stejné významové směšování je historicky přítomné v dokumentaci MIX/Z39.87 a schéma MIX navíc hodnotu připouští jako obecný řetězec. Samotná validita vůči XSD proto chybu neodhalí.

Rozpor je v pravidle evidován odděleně od ověření přepisu: požadavek a jeho zdroje jsou ověřené, zatímco stav zdrojového popisu je `disputed`.

## Strojový požadavek

Pravidlo se uplatní na monografie a sloupce MC / PS podle terminologie DMF, pokud je přítomen blok `mix:IccProfile`. Potom vyžaduje právě jeden `mix:iccProfileVersion` a kontroluje hodnotu regulárním výrazem:

```regex
^[0-9]+(?:\.[0-9]+){0,3}$
```

Příklady:

| Hodnota | Výsledek | Důvod |
|---|---|---|
| `2.4` | přijmout | číselná verze formátu |
| `4.4.0.0` | přijmout | úplné označení verze podle ICC.1:2022 |
| `sRGB` | odmítnout | název/barevný prostor |
| `Adobe RGB` | odmítnout | název/barevný prostor |
| `sRGB IEC61966-2.1` | odmítnout | označení standardu, nikoli verze ICC formátu |

## Implementace

Z veřejných primárních zdrojů zatím není doloženo, zda ProArc hodnotu čte přímo z ICC hlavičky, přebírá ji z JHOVE, nebo ji očekává ručně. Stejně tak není ověřeno, zda Komplexní validátor kontroluje číselnou sémantiku hodnoty, nebo pouze přítomnost elementu. Obě tvrzení proto zůstávají explicitně `unverified`.

## Primární zdroje

- [NDK: aktuální dokumentace metadat](https://standardy.ndk.cz/ndk/standardy-digitalizace/metadata)
- [DMF Monografie 2.3, str. 83, oddíl 7.5.4](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf)
- [Library of Congress: MIX 2.0](https://www.loc.gov/standards/mix/mix-home.html)
- [ANSI/NISO Z39.87-2006 (R2017)](https://www.niso.org/publications/ansiniso-z3987-2006-r2017-data-dictionary-technical-metadata-digital-still-images)
- [ICC.1:2022, str. 20, oddíl 7.2.4](https://www.color.org/specification/ICC.1-2022-05.pdf)
