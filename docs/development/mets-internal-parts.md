# Kapitoly, obrazy a jejich stránky v METS

Třináct pravidel `structure/mets-internal-parts` navazuje na [logickou mapu a structLink](mets-logical.md). Popisuje vnitřní části monografie, jejich metadata a výčty fyzických stran. Nenahrazuje skupinu pro jednoduchý popis bez kapitol a zatím neimplementuje podrobnou strukturu blokových vazeb ALTO.

## Zdroje

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), s. 4 (§ 1.3, sjednaná granularita), s. 93–98 (§ 7.7.1.2.1–2, vnitřní členění) a s. 99 (§ 7.8.1, výčty stran). Tabulky a relevantní próza byly vizuálně zkontrolovány; interní odkazy 7.6/7.7 v textu nejsou všude aktuální.
- [METS XML Schema 1.9.1](https://www.loc.gov/standards/mets/version191/mets.xsd), divType, structMapType, ORDERLABELS a structLinkType. XSD připouští obecné hodnoty TYPE a nepovinné atributy, jejichž národní použití stanoví DMF.

Ověření z 6. 10. 2026 se týká přepisu pramenů, nikoli chování ProArcu, Krameria nebo NDK validátoru.

## Rozsah podle zvoleného popisu

| Kontext registru | Význam | Co tato sada posuzuje |
|---|---|---|
| `no_internal_parts` | Bez popisu kapitol | Tato sada se neuplatní; platí předchozí skupina |
| `internal_parts_pages` | Kapitoly a obrazy propojené se stránkami | Uzly, metadata, výčty stran; bez fptr/area v logické mapě |
| `internal_parts_alto` | Vnitřní části s vazbami na bloky ALTO | Společné uzly a výčty stran; vlastní blokové odkazy zatím mimo sadu |

Tyto názvy jsou kontexty registru, nikoli předepsané XML atributy METS. Zvolený režim pochází ze zadání projektu podle § 1.3, ne z toho, zda vadný dokument náhodou obsahuje kapitoly nebo blokové odkazy.

`expected_internal_part=chapter/picture` vyjadřuje část očekávanou z předlohy a rozsahu popisu. Není testem existence uzlu, který má pravidlo teprve požadovat. Strukturální role `chapter`, `picture`, `logical_page` vychází z významu uzlu; nesmí být zjištěna pouze podle jeho kontrolovaného TYPE nebo prefixu ID.

## Přehled pravidel

Prefix ID je `NDK-MONO-METS-PARTS-`.

| Pravidlo | Obsah | Povinnost |
|---|---|---|
| CHAPTER | Uzel každého textového oddílu ve sjednaném popisu | M |
| CHAPTER-TYPE | Přítomnost TYPE; rozpor jeho konkrétního zápisu | Slovní, nejednoznačné |
| CHAPTER-LABEL | Název oddílu | Slovní |
| CHAPTER-DMDID | Odkaz na popis oddílu | Slovní |
| CHAPTER-ORDER | Pořadí oddílu | Slovní |
| DIV-ID | ID kapitol, obrazů a vložených logických stran | Slovní |
| PICTURE | Logický obraz, pokud se v rozsahu popisu vyskytuje | MA |
| PICTURE-DMDID | Odkaz na bibliografický popis obrazu | Slovní |
| PICTURE-LABEL | Název obrazu, pokud existuje | Slovní, podmíněná |
| NO-ALTO-POINTERS | V režimu vazeb pouze na strany nejsou v logické mapě fptr ani area | Slovní |
| PART-PAGE-COVERAGE | Výčet stran každé kapitoly a obrazu | Slovní |
| UNIT-PAGE-COVERAGE | Navíc výčet stran celého titulu a případné přílohy | Slovní |
| PAGE | Volitelné logické stránky na nejnižší úrovni | O |

Kódy M, MA a O pocházejí z řádků uzlů v tabulce. Nejsou automaticky kopírovány k jejich atributům, u nichž vlastní kód vytištěn není. Tam používáme `obligation_source: prose`. M u kapitoly neznamená, že každý digitalizační projekt musí mít vnitřní popis. MA u obrazu nepovyšuje sken libovolné textové stránky na logický obraz.

## TYPE kapitoly není její jedinečné ID

Próza na s. 93 a další popis na s. 95 používají TYPE=CHAPTER. Řádek TYPE tabulky na s. 95 ale připojuje pořadové číslo, například CHAPTER_0001. Proto má pravidlo CHAPTER-TYPE stav **ambiguous**, nikoli pevný číselník či regex.

Číslování dává smysl pro rozlišení ID několika kapitol. Více uzlů může sdílet stejný typ; jejich XML ID musí být jedinečná. Pravděpodobným vysvětlením je redakční záměna příkladu ID za TYPE. To je interpretace, **nikoli potvrzená oprava vydavatele DMF**; registr neprovádí automatickou změnu dokumentů.

Následující autorská ilustrace pouze ukazuje rozdíl typu a identity. Není výřezem vzorového SIP, úplným uzlem podle všech pravidel ani potvrzením jediné povolené podoby DMF:

```xml
<mets:div xmlns:mets="http://www.loc.gov/METS/" TYPE="VOLUME" ID="volume-example">
  <mets:div TYPE="CHAPTER" ID="CHAPTER_0001" />
  <mets:div TYPE="CHAPTER" ID="CHAPTER_0002" />
</mets:div>
```

Stejné varování se týká číslovaného příkladu TYPE v řádku PAGE na s. 95. Pravidlo PAGE v této sadě řeší volitelnost a polohu úrovně, nikoli vynucování konkrétního číslovaného TYPE.

## Metadata, pořadí a dvě úrovně výčtů

DMDID se rozděluje jako seznam IDREFS a odkazuje na odpovídající **dmdSec**, nikoli přímo na mods:mods nebo na soubor. Popis celé knihy sám neprokazuje popis kapitoly či obrazu. Četnost atributu 1–1 neomezuje počet jeho tokenů. Samotná pole bibliografického záznamu patří do budoucí skupiny MODS/DC.

ORDER je integer vyjadřující pořadí oddílu. Není to fyzická paginace, ORDERLABEL ani část identifikátoru. Tato sada z něj neodvozuje povinný začátek od jedničky či globálně jedinečnou souvislou řadu.

StructLink podle § 7.8.1 obsahuje dvě úrovně výčtů: stránky jednotlivých kapitol/obrazů **a také** stránky celého titulu a případné přílohy. Pouhé vazby celého svazku nevystihují jednotlivé kapitoly; samotné kapitoly zase nenahrazují celkový výčet.

Jedna kapitola může mít více stran a jedna strana může patřit více vnitřním částem. Sdílené cíle proto nejsou samy o sobě chyba. Kontrola porovnává očekávané množiny stran a jejich přiřazení; pouhá rovnost počtu vazeb a stran nestačí. Neočekáváme přílohu, která neexistuje, ani mechanické opakování vazeb u každého libovolného předka.

Ve variantě `internal_parts_pages` jsou fptr/area zakázány pouze uvnitř logické mapy. Zákaz se nevztahuje na fyzickou mapu, fileSec ani samotné soubory ALTO. V režimu `internal_parts_alto` blokové odkazy výčet stran v structLink nenahrazují.

## Volitelná logická stránka

PAGE je v logické mapě volitelná. Pokud se použije, je nejnižší úrovní pod vyššími celky, nikoli rodičem kapitoly či obrazu. Její absence neruší povinnost fyzických stran a jejich vazeb. Logický a fyzický uzel stejné stránky jsou dva XML uzly, takže nemohou sdílet stejné ID.

Rozdělování oddílu na CHAPTER_PART není automatickým důsledkem toho, že kapitola zabírá více stran. Podrobné podtypy a blokové odkazy ALTO tato sada ještě nepokrývá.

## Ukázky a meze ověření

Dodaný SIP obsahuje jednoduchou logickou mapu bez kapitol. Nová pravidla proto nemají vymyšlené `source_excerpt`; celkový počet zůstává **160 zdrojových ukázek u 126 pravidel**. Autorský příklad výše není zahrnut do těchto počtů.

Testy ověřují kontexty, povinnosti, zachování rozporu TYPE, sémantické cíle DMDID, zařazení do filtrů a mapy i vztahy mezi pravidly. Registr **nevykonává custom kontroly**, není plným validátorem SIP a touto sadou není doloženo chování externích nástrojů.
