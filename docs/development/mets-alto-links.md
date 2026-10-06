# Blokové vazby METS–ALTO

Osm pravidel `structure/mets-alto-links` navazuje na [vnitřní části monografie](mets-internal-parts.md). Zachycuje vazby z dílčích logických uzlů přes fptr/area do textových a obrazových bloků ALTO. Jde o pravidla strukturálního METS, nikoli úplný předpis OCR nebo všech elementů ALTO.

## Zdroje a verze

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), s. 4–5 (rozsah projektu a verze), s. 93 a 95–98 (§ 7.7.1.2.1, blokové vazby). Tabulky byly vizuálně ověřeny.
- [METS XSD 1.9.1](https://www.loc.gov/standards/mets/version191/mets.xsd), divType/fptr a areaType, včetně dokumentace FILEID.
- [ALTO XSD 2.0](https://www.loc.gov/standards/alto/v2/alto-2-0.xsd) a [ALTO XSD 4.4](https://www.loc.gov/standards/alto/v4/alto-4-4.xsd), deklarace TextBlock, ComposedBlock a ID bloků. Jde o verze odkazované DMF 2.3.
- [Library of Congress: Using ALTO with METS](https://www.loc.gov/standards/alto/techcenter/use-with-mets.html), doplňující vysvětlení odlišné role FILEID a BEGIN; způsob uložení ALTO v NDK určují DMF a souborová pravidla.

Ověřeno 6. 10. 2026. Stav verified označuje kontrolu přepisu a zdrojů, nikoli plnou validaci SIP či implementace externího nástroje.

## Dva rozsahy identifikátorů

| Údaj | Rozsah hledání | Význam |
|---|---|---|
| area/@FILEID | Hlavní METS, fileSec | ID záznamu souboru ALTO |
| file/FLocat/@xlink:href | Umístění souboru v SIP | Cesta ke konkrétnímu ALTO |
| area/@BEGIN | Pouze vybraný soubor ALTO | ID konkrétního bloku |
| area/@BETYPE | Způsob interpretace BEGIN | Pevná hodnota IDREF |
| smLink/@xlink:to | Fyzická mapa v METS | ID stránky, nikoli bloku ALTO |

Stejné ID bloku může existovat v různých samostatných souborech ALTO. Nestačí je najít někde v balíčku: musí být ve správném souboru a odpovídat popisovanému obsahu. Ani shoda prefixu ID nebo MIME typu text/xml nestačí k určení správného souboru.

BEGIN je v METS XSD **xs:string**, ne xs:IDREF. BETYPE=IDREF určuje jeho význam, ale nenutí samotné METS XSD otevřít druhý dokument a prověřit jeho ID. Jde o kontrolu mezi soubory. BEGIN není XPath, souřadnice ani URI fragment se znakem `#`.

## Přehled

Prefix ID je `NDK-MONO-METS-ALTO-`.

| Pravidlo | Co zachycuje |
|---|---|
| FPTR | Přítomnost blokového odkazu pro popisovaný obsah |
| AREA | Přímý area v jednoduchém blokovém fptr |
| FILEID | Vazbu na záznam správného ALTO souboru |
| BEGIN | Identifikátor uvnitř tohoto souboru |
| BETYPE | Hodnotu IDREF |
| TEXT-BLOCK | Textový cíl TextBlock |
| IMAGE-BLOCK | Obrazový cíl ComposedBlock |
| BLOCK-TYPE | Významový typ dílčího logického div |

Všech osm pravidel má slovní povinnost `mandatory` a `obligation_source: prose`. Kódy M/MA u nadřazených druhů uzlů se nepřenášejí na každou vazbu nebo atribut. Sada nepožaduje existenci všech druhů bloků v každé knize; požaduje správný odkaz pro obsah zahrnutý do blokového popisu.

### Kontext

Pravidla platí pouze pro hlavní METS monografie, logickou mapu a režim `logical_description_mode=internal_parts_alto`. Režim se určuje podle zadání projektu, ne podle přítomnosti fptr. Pro režim `internal_parts_pages` platí naopak [vyloučení fptr/area z logické mapy](mets-internal-parts.md).

`logical_content_role=text_block/image_block/image_only_page` označuje význam obsahu. Poslední role odpovídá situaci ze s. 93, kdy stránka obsahuje pouze obraz a žádný text. Není to každá ilustrace mimo kapitolu. `element_role=alto_block_pointer/alto_block_area` určuje uzel posuzované vazby. Jde o kontexty registru, nikoli nové XML atributy. Nesmějí být vyhodnoceny jen podle úspěšné přítomnosti kontrolovaného atributu či správného TYPE.

## FILEID na area, nikoli náhrada atributem rodiče

METS XSD vyžaduje FILEID na area. FILEID na fptr je naproti tomu volitelný a dokumentace METS doporučuje použít jej jen bez potomka area/par/seq. Samotné schéma nevyjadřuje zákaz souběhu obou atributů, takže jej nevydáváme za XSD chybu.

Tabulky DMF místy vizuálně spojují FILEID s fptr (např. s. 96). Tuto odchylku vysvětlujeme v pravidle FILEID: atribut pouze na rodiči nemůže nahradit povinný area/@FILEID. Nevynucujeme jeho duplicitní uvedení na obou elementech.

Obecné METS umožňuje také par/seq pro složené odkazy. Tato sada popisuje jednoduchou přímou větev fptr/area uvedenou v tabulce DMF, nikoli všechny možnosti složených odkazů. Přímý fptr nemůže mít několik sourozeneckých area; pro tuto větev stanoví XSD nejvýše jeden výskyt.

## Text, obraz a typ div

Textový odkaz vede na TextBlock, ne na TextLine, String, Page nebo náhodný uzel se shodným ID. Obrazový odkaz podle DMF vede na ComposedBlock reprezentující vlastní obraz, ne na jeho textový popisek nebo přímo na Illustration. Obecné ALTO může ComposedBlock využít i pro jiné seskupení; název elementu sám nedokládá správný význam cíle.

U stránky pouze s obrazem připouští DMF přímou vazbu ze samostatného PICTURE na ComposedBlock. Nevyžadujeme umělou textovou kapitolu ani vložený IMAGE jen kvůli uniformní hierarchii.

Dílčí logické typy zahrnují TITLE, SUBTITLE, AUTHOR, TRANSLATOR, NORMAL_TEXT, NOTE, CAPTION, PICT_AUTHOR, PICT_TITLE a IMAGE. Toto není úplný číselník všech div: nadřazené CHAPTER, CHAPTER_PART, PICTURE, PAGE, VOLUME a MONOGRAPH mají jiné role. Samotné členství v číselníku nestačí bez shody s obsahem. Kompletní povinnosti vzniku všech podtypů a jejich další atributy zůstávají mimo tuto sadu.

XML prefix není určující. Pravidla musí rozlišovat namespace ALTO 2 (`http://www.loc.gov/standards/alto/ns-v2#`) a ALTO 4 (`http://www.loc.gov/standards/alto/ns-v4#`). Namespace nerozliší například ALTO 4.0 od 4.4; verzi nelze určit jen z jeho názvu.

Výčty stran kapitol a celku v structLink zůstávají povinné i při blokových vazbách. Fptr/area je nenahrazují.

## Ukázka zápisu a skutečné zdrojové výřezy

Následující **autorská ilustrace** skládá blokový odkaz s ID pozorovanými ve vzoru. Tento div ani vazba ve zdrojovém SIP nejsou; jde pouze o ukázku mechanismu, ne o zdrojový výřez či úplný normativní uzel:

```xml
<mets:div xmlns:mets="http://www.loc.gov/METS/" TYPE="TITLE" ID="title-example">
  <mets:fptr>
    <mets:area FILEID="alto_0001" BEGIN="Page1_Block1" BETYPE="IDREF" />
  </mets:fptr>
</mets:div>
```

Sada přidává **čtyři přesné výřezy u tří pravidel**: záznam `file ID=alto_0001` a `TextBlock ID=Page1_Block1`, opakovaně tam, kde pomáhají ukázat obě úrovně cíle. Ukázky nedokládají existenci logické vazby ve vzoru. Celý registr nyní obsahuje 190 zdrojových ukázek u 149 pravidel.

Zdroj: [dodaný SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download).

| Soubor | SHA-256 |
|---|---|
| mets_75faba8d-c629-11f0-8950-12e8557df20e.xml | `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473` |
| alto/alto_75faba8d-c629-11f0-8950-12e8557df20e_0001.xml | `a130c403cfbcf41119e3eba49cba65cd0a831d47a1d4f74e4a399edb54f6d326` |

První ALTO má namespace v4, ale neuvádí minor verzi. Nepřipisujeme mu proto ověřenou verzi 4.4. V šestnácti dodaných ALTO souborech nebyl nalezen ComposedBlock; obrazovému pravidlu proto není přiřazena vymyšlená ukázka.

Původ výřezů se kontroluje pomocí [XPath a otisků zdrojů](xml-examples.md). Testy ověřují data, kontexty, cílové entity, číselníky, vazby a API filtry; **registr custom kontroly nevykonává**. Nejde o plnou validaci balíčku ani test externího validátoru.
