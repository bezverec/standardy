# Původci a role v MODS jednosvazkové monografie

Devět pravidel `metadata/mods-names` navazuje na [názvové údaje](mods-titles.md). Popisuje explicitně pojmenované původce a jejich role přímo v bibliografickém MODS záznamu svazku jednosvazkové monografie.

## Podklady a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 49–50: tabulky name a role ověřené textově i vizuálně.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): nameDefinition, namePartDefinition, roleDefinition, roleTermDefinition a authorityAttributeGroup.
- [MARC Code List for Relators](https://www.loc.gov/marc/relators/relaterm.html): identifikátor slovníku marcrelator a význam kódů rolí.

Ověřeno 6. 10. 2026. Pravidla neplatí automaticky pro titul či svazek vícesvazku, stránku, přílohu nebo vnitřní část. Neřeší jména v subject či relatedItem, originInfo ani digitalizační agenty PREMIS. Samostatnou zástupnou konstrukci etal a alternativeName popisuje [navazující sada](mods-name-details.md); požadavek na jmenné údaje nesmí vynucovat namePart u etal.

## Pravidla a povinnosti

Prefix ID je `NDK-MONO-MODS-SINGLE-`.

| Pravidlo | Pole | Povinnost |
|---|---|---|
| NAME | name | MA, jsou-li dostupné údaje o původci |
| NAME-TYPE | name/@type | MA, je-li dostupný typ původce |
| NAME-USAGE | name/@usage | O, při použití primary |
| NAME-PART | name/namePart | MA, jsou-li dostupné jmenné údaje |
| NAME-IDENTIFIER | name/nameIdentifier | MA, je-li dostupné číslo národní autority |
| ROLE | name/role | MA, je-li dostupná role |
| ROLE-TERM | name/role/roleTerm | M uvnitř uvedené role, kód ze slovníku LOC |
| ROLE-TERM-TYPE | roleTerm/@type | M, code |
| ROLE-TERM-AUTHORITY | roleTerm/@authority | M, marcrelator |

Zachováváme pět MA, jeden O a tři M. MA rodiče nesnižuje M jeho uvedených potomků. Národní požadavek a obecnou deklaraci MODS držíme odděleně.

## Kontext a dostupnost

Základní kontext tvoří `object_type=monograph`, `document_role=main_mets` a `bibliographic_level=single_volume`. `element_role` rozlišuje záznam (`mods_record`), konkrétní pojmenovanou odpovědnost (`mods_contributor_name`), její roli (`mods_contributor_role`) a termín role (`mods_contributor_role_term`). Jde o sémantický kontext katalogu pravidel, nikoli nové XML atributy.

Podmínky `contributor_metadata_available`, `contributor_type_available`, `contributor_name_available`, `national_authority_id_available` a `contributor_role_available` vycházejí nezávisle ze zdrojového popisu. Chybějící pole ve výstupním XML není důkaz nedostupnosti. Neznámá dostupnost není false. U M uvnitř již uvedené role není další podmínka dostupnosti, která by mohla obejít kontrolu.

DMF odkazuje na odpovědnost v MARC 1XX a 7XX. Nejde o slepý převod všech polí 7XX na osoby. Zachovat se musejí také další tvůrci a přiřazení jejich rolí; kontrola se nesmí omezit na prvního autora.

## Jméno, typ a autorita

Name/@type rozlišuje personal, corporate, conference a family. Není totožné s namePart/@type ani roleTerm/@type. Pouhé členství v číselníku nestačí bez věcné shody se zdrojem.

Volitelné usage=primary označuje primární autoritu podle zdroje (DMF uvádí MARC 100/110/111). Neznamená automaticky autora ani osobu a neplyne z prvního místa v XML. Tato sada nevyžaduje právě jedno usage v každém záznamu.

Jméno se při možnosti rozlišení zapisuje po částech. Není-li rozlišení křestního jména a příjmení možné, DMF připouští jeden namePart bez type. Z iniciály J. nelze vymyslet celé křestní jméno. Detailní povinnosti namePart/@type, včetně RA pro date a termsOfAddress, nejsou nahrazeny plošným MA; popisuje je [navazující sada](mods-name-details.md) spolu s alternativeName a etal.

NameIdentifier je textový identifikátor národní autority, ne celočíselná hodnota. Není totožný s UUID balíčku, bibliografickým identifikátorem dokumentu ani s roleTerm/@authority. Registr nevymýšlí regex nebo povinný atribut type. Dostupný identifikátor musí být přiřazen správnému původci; autoritní služba nebyla v této sadě dotazována.

## Role a obecné MODS

Kód aut ve vzoru znamená author. Není jedinou povolenou rolí: ROLE-TERM odkazuje na celý slovník LOC a nemá neúplný uzavřený seznam allowed_values. Slovník je průběžně spravovaný; budoucí validátor musí evidovat použitý stav a zohlednit historický kontext dat. Třípísmenný tvar sám neprokazuje platnost ani věcnou správnost kódu.

Obecné MODS 3.8 dovoluje opakovat jmenné položky a role. RoleDefinition vyžaduje jeden nebo více roleTerm. Jeho type je v obecném XSD volitelné a dovoluje code i text; NDK vyžaduje code. Také authority je v XSD volitelné, zatímco NDK vyžaduje marcrelator. AuthorityURI nebo valueURI samy tento požadavek nenahrazují. XSD nekontroluje členství hodnoty ve slovníku MARC.

Elementy používají namespace `http://www.loc.gov/mods/v3`, atributy type, usage a authority jsou bez namespace. Verze 3.8 je doložena zdrojem; samotný namespace v3 nevybírá konkrétní verzi.

## Vzorový SIP a kontrola

Devět pravidel obsahuje devět zdrojových výřezů. Vzor dokládá jméno Mařík, J., type=personal, usage=primary, nameIdentifier=jx20101005005 a roli aut s type=code a authority=marcrelator. Výřez celého name je použit u tří pravidel, roleTerm rovněž u tří; nejde o devět různých původců.

Zdroj: [dodaný SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`. Základní XPath:

```text
/mets:mets/mets:dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:name
```

Ukázka nerozhoduje, zda bylo ve zdrojovém katalogu možné rozdělit jméno, ani neověřuje převod MARC nebo přiřazení autority. Kontrola výřezů není validací celého SIP. Registr nyní obsahuje 207 pravidel a 196 zdrojových ukázek u 153 pravidel.

Testy kontrolují datovou strukturu, povinnosti, kontexty, číselníky, vazby a zařazení v API a mapě. **Custom kontroly registr nevykonává**; implementace ProArcu, Krameria ani Komplexního validátoru nebyly pro tuto skupinu ověřeny.
