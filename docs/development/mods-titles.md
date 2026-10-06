# Názvové údaje MODS pro jednosvazkovou monografii

Osm pravidel `metadata/mods-titles` popisuje názvové údaje svazku **jednosvazkové monografie**. Jde o první skupinu registru zařazenou pod popisná metadata / MODS. Na rozdíl od [obálek MODS/DC](mets-dmd.md) kontroluje obsah záznamu, nikoli jeho uložení do METS.

## Podklady a hranice platnosti

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 48–49: tabulky titleInfo a potomků byly ověřeny textově i vizuálně.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd), titleInfoDefinition: opakovatelná volba potomků a číselník atributu type.

Ověřeno 6. 10. 2026. Verze MODS je 3.8, nikoli libovolná verze z namespace v3. Pravidla nesmějí být automaticky přenesena na titul vícesvazku, svazek vícesvazku, stránku, přílohu ani vnitřní část. Základní kontext tvoří `object_type=monograph`, `document_role=main_mets` a `bibliographic_level=single_volume`. Poslední hodnota označuje skutečnou úroveň popisu, ne prefix ID nebo přítomnost kontrolovaného pole.

Sada řeší přímé titleInfo bibliografického záznamu svazku, nikoli titleInfo vložené do subject či relatedItem. Nedoplňuje ještě root ID/version, odpovědnost, žánr, nakladatelské údaje ani úplný převod do Dublin Core.

## Pravidla a povinnosti

Prefix ID je `NDK-MONO-MODS-SINGLE-`.

| Pravidlo | Pole | Povinnost a rozsah |
|---|---|---|
| TITLEINFO | titleInfo | M, názvové údaje z katalogizačního záznamu; opakování pro další druhy názvů |
| MAIN-NO-TYPE | titleInfo/@type | Slovní zákaz u hlavního názvu |
| TYPE | titleInfo/@type | MA, dostupný typ dalšího názvu |
| TITLE | titleInfo/title | M, název uvnitř každého titleInfo |
| NONSORT | titleInfo/nonSort | O, pravidla plnění se uplatní při použití |
| SUBTITLE | titleInfo/subTitle | MA, je-li podnázev dostupný |
| PARTNUMBER | titleInfo/partNumber | MA, je-li číslo části dostupné |
| PARTNAME | titleInfo/partName | MA, je-li název části dostupný |

Zachovány jsou dva kódy M, čtyři MA a jeden O. Zákaz type u hlavního názvu má `obligation=forbidden` a `obligation_source=prose`, bez domyšleného kódu. MA neznamená volitelnost bez ohledu na dostupný zdrojový údaj.

## Hlavní a další názvy

| Význam názvu | Hodnota type | Zdroj uvedený v DMF |
|---|---|---|
| Hlavní | Atribut se nepíše | MARC 245 $a |
| Zkrácený | abbreviated | MARC 210 |
| Variantní | alternative | MARC 246 |
| V jiném jazyce | translated | MARC 242 |
| Unifikovaný | uniform | MARC 130 nebo 240 |

Číselník není dostatečnou kontrolou sám o sobě: například uniform u zdroje, který představuje variantní název, je věcně nesprávně. Hodnota primary není hodnotou type. Obecný MODS má samostatný atribut usage; tato sada jej ani nevyžaduje, ani nezakazuje.

`title_role=main/additional` musí vycházet z významu názvu ve zdroji. Nesmí se určovat pouze testem, zda už type existuje: tím by chybně uvedený atribut vypnul kontrolu hlavního názvu. Podmínka `title_type_available=true` zachycuje dostupnost klasifikace dalšího názvu ve zdrojovém popisu, nikoli úspěšně validovanou hodnotu v XML. Neznámá klasifikace se nesmí tiše vydávat za správnou.

TitleInfo se opakuje pro jednotlivé druhy názvů; title, subTitle a údaje o části musejí zůstat přiřazené ke správnému názvu. Tabulka DMF není úplnou konverzní šablonou MARC: tato sada neimplementuje automatické mapování 1:1.

## nonSort a bílé znaky

NonSort je volitelný. Jeho použití ale musí zachovat správné spojení s title. Podle příkladů DMF následuje po samostatném členu The mezera, zatímco přiléhající L´ ji nemá. Nelze tedy bez rozlišení ořezat konec nonSort ani vždy přidat mezeru.

Při převodu hlavního názvu z MARC 245 $a vymezuje neřadicí znaky druhý indikátor. Při hodnotě 0 se nonSort nepoužije. Nejde o požadavek vytvářet nonSort pro každý název začínající členem ani o pevný slovník povolených členů. Ostatní atributy a případná specifika dalších druhů názvů se neposuzují mechanickým použitím pravidla MARC 245.

## Dostupnost podnázvu a údajů o části

Kontexty `subtitle_available`, `title_part_number_available` a `title_part_name_available` se zjišťují ze zdrojového bibliografického popisu. Chybějící element ve výstupním XML není důkazem, že údaj nebyl dostupný. Neznámá dostupnost není false.

PartName není podmíněn existencí partNumber; každý údaj má vlastní dostupnost. PartNumber se nevyrábí z pořadí skenu ani ID balíčku. Není totéž jako part/detail/number, stejně jako partName není personální namePart. Názvový údaj o části sám nemění jednosvazkový dokument na svazek vícesvazkové monografie.

## MODS XSD versus národní požadavek

TitleInfoDefinition v MODS 3.8 má opakovatelnou volbu potomků s minOccurs=0. Samotné XSD tak nevynucuje title. Povinnost M přidává NDK. Registr nevymýšlí horní mez jeden výskyt pro title nebo ostatní potomky, protože citovaná deklarace je opakovatelná. Atribut type může mít nejvýše jeden výskyt; jeho absence u hlavního názvu je samostatné pravidlo.

Namespace elementů je `http://www.loc.gov/mods/v3`. Atribut type je bez namespace. Prefix mods je pouze alias; metadata zařazuje registr podle vlastníka cílové entity, ne podle citací METS v souvisejících pravidlech.

## Vzorový SIP a ověření

Dodaná monografie obsahuje jedno titleInfo svazku s názvem Tomáš Alva Edison a jeho fonograf a bez atributu type. Z něj přidáváme **tři výřezy u tří pravidel**: titleInfo pro TITLEINFO a MAIN-NO-TYPE a samostatný title pro TITLE. Vzor neobsahuje další druh názvu, nonSort, subTitle, partNumber ani partName; k těmto pravidlům nepřidáváme vymyšlenou ukázku. Celkem má registr 190 zdrojových ukázek u 149 pravidel.

Zdroj: [dodaný SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`. XPath k titleInfo:

```text
/mets:mets/mets:dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:titleInfo
```

Výřezy jsou porovnávány se zdrojem, nejde však o ověření převodu z původního MARC záznamu, který tato sada neanalyzuje. Kontrola ukázek neprokazuje validitu celého SIP. Testy ověřují data registru, kontexty, povinnosti, číselník, vazby a klasifikaci v API a mapě. **Custom kontroly registr nevykonává**; chování ProArcu, Krameria a Komplexního validátoru nebylo pro tuto skupinu ověřeno.
