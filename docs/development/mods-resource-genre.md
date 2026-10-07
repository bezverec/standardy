# Typ dokumentu a žánr v MODS jednosvazkové monografie

Čtyři pravidla `metadata/mods-resource-genre` rozlišují obecný druh zdroje, strukturální typ NDK a další bibliografický žánr. Všechna platí pro záznam svazku jednosvazkové monografie podle DMF 2.3, nikoli automaticky pro titul vícesvazku, jednotlivou stránku nebo vnitřní část.

## Podklady

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 50–51: typeOfResource, dva samostatné řádky genre a authority bibliografického žánru.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): modsDefinition/modsGroup, typeOfResourceDefinition, genreDefinition a zděděné textové typy s authorityAttributeGroup.

Tabulky byly ověřeny textově i vizuálně 6. 10. 2026. Přepis národních požadavků je oddělený od obecného MODS a od chování implementací.

## Čtyři pravidla

Prefix ID je `NDK-MONO-MODS-SINGLE-`.

| Pravidlo | Obsah | Povinnost |
|---|---|---|
| RESOURCE-TYPE | TypeOfResource podle druhu předlohy | R |
| GENRE-STRUCTURAL | Povinný strukturální typ v genre | M |
| GENRE-DESCRIPTIVE | Další bibliografický žánr v opakovaném genre | R |
| GENRE-AUTHORITY | Doporučená authority=czenas u bibliografického žánru | R |

R se nemění na M ani RA. Doporučená pole mají presence=optional a minimum 0, povinný strukturální genre minimum 1. Obecné MODS umožňuje opakování obou elementů; nevymýšlíme maximum jednoho výskytu. Atribut authority může mít u konkrétního genre nejvýše jeden výskyt.

## Tři různé vrstvy typu

| Druh předlohy | MODS typeOfResource (R) | Strukturální MODS genre (M) | Odpovídající DC typ uvedený v DMF |
|---|---|---|---|
| Textová monografie | text | volume | model:monograph |
| Kartografický dokument | cartographic | cartographic | model:map |
| Grafický dokument | still image | graphic | model:graphic |
| Hudebnina | notated music | sheetmusic | model:sheetmusic |

Tabulka není čtveřice zaměnitelných synonym. Především text/volume/model:monograph a cartographic/model:map ukazují, že převod do DC není prosté přidání prefixu model: k hodnotě MODS. Hodnoty MODS samy tento prefix nemají. Mapování DC je zde vysvětleno podle pravého sloupce DMF; tato sada nepřidává samostatná pravidla obsahu DC ani konverzní engine.

DMF odkazuje při určení typeOfResource na pozici 06 návěští MARC. Nejde o MIME typ ani typ obrazového souboru: sken textové knihy ve formátu JP2 nemění druh předlohy na still image. Ověření členství ve čtyřhodnotovém seznamu bez porovnání s předlohou nestačí.

## Dva významy stejného genre

Povinný strukturální typ a doporučený bibliografický žánr mají stejný XML název, ale nejsou jedním pravidlem. Biography nebo biografie nemohou nahradit chybějící volume a samotné volume nepopisuje konkrétní bibliografický žánr.

GENRE-STRUCTURAL se uplatňuje na celý MODS záznam. Jeho kardinalita a allowed_values se týkají strukturální podmnožiny genre, nikoli všech výskytů tohoto elementu. Budoucí engine musí respektovat rozsah popsaný v custom kontrole a interpretaci; nesmí odmítnout bibliografické biografie jen proto, že není ve strukturálním číselníku. Kontrola nesmí být podmíněna existencí již správného strukturálního genre, jinak by minula právě chybějící údaj.

Druh předlohy a úroveň popisu se určují nezávisle ze zdroje. Neznámý druh není potvrzení správnosti ani důvod tiše přeskočit M. Strukturální role se neurčuje pouze pořadím, nepřítomností authority nebo platností současné hodnoty. Z absence authority u volume ve vzoru neodvozujeme obecný národní zákaz tohoto atributu.

Bibliografické genre podle DMF čerpá z MARC 655, 336 a 008. To není úplná převodní tabulka 1:1: musí se zachovat význam a správný slovník. Neznámý žánr se nevymýšlí jen k vyplnění doporučeného pole. Výčet žánrů není omezen na biografii ze vzoru ani na čtyři strukturální hodnoty. Do dc:type se bibliografický žánr podle DMF nepřevádí s prefixem model:.

## Doporučená autorita není obecný zákaz

Authority=czenas má R a patří bibliografickému genre. Jiná či chybějící autorita nesplňuje toto konkrétní doporučení, sama však nepředstavuje porušení M nebo neplatnost obecného MODS. Ve vzoru jsou současně czenas/biografie a marcgt/biography. Druhý výřez není označen jako splnění doporučení czenas.

Pouhé přepsání marcgt na czenas při zachování termínu bez ověření odpovídajícího slovníku není oprava. Autoritní služba nebyla dotazována; registr touto sadou neověřuje členství termínu ve slovníku. Doporučení se automaticky nepřenáší na strukturální genre.

## Obecné MODS versus NDK

V XSD 3.8 typeOfResourceDefinition i genreDefinition rozšiřují stringPlusLanguagePlusAuthority, odvozený od xs:string. Schéma samo nepředepisuje zdejší čtveřice hodnot ani dva národní významy genre. Authority je volitelné xs:string a XSD nekontroluje slovník czenas.

Elementy mají namespace `http://www.loc.gov/mods/v3`, atribut authority je bez namespace. Konkrétní verze schématu 3.8 je doložena zdrojem, nikoli samotným namespace v3.

Podmínky prvních tří pravidel jsou `object_type=monograph`, `document_role=main_mets`, `bibliographic_level=single_volume` a `element_role=mods_record`. Authority má roli `mods_descriptive_genre`. Monograph v současném slovníku registru označuje použitý DMF, nikoli automaticky textový druh předlohy. Kontexty nejsou nové XML atributy a nevztahují pravidla na relatedItem či subject.

## Zdrojové ukázky a ověření

Šest ukázek u čtyř pravidel zachycuje čtyři skutečné uzly ze [vzorového SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download): text, volume, czenas/biografie a marcgt/biography. Poslední dva jsou použity jak u bibliografického žánru, tak u jeho autority. Pro kartografické, grafické a hudební předlohy nedoplňujeme vymyšlené zdrojové výřezy.

Zdrojový soubor je `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`. Výřezy jsou přímé děti:

```text
/mets:mets/mets:dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods
```

XPath genre[3] pouze ukotvuje konkrétní zdrojový uzel s hodnotou volume, ne pravidlo, že strukturální genre má být třetí. Původní katalogizační MARC nebyl analyzován; shoda výřezu se SIP není potvrzení úplného převodu ani validity celého balíčku.

Registr nyní obsahuje 220 pravidel, 43 pro MODS, a 208 zdrojových XML ukázek u 163 pravidel. Testy kontrolují přepis, kontext, povinnosti, slovníky, vazby a klasifikaci v API a mapě. **Custom kontroly registr nevykonává**; implementace externích nástrojů pro tuto skupinu nebyly ověřeny.
