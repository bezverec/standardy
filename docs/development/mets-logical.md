# Logická mapa a výčet stran hlavního METS

Deset pravidel `structure/mets-logical` navazuje na [fyzickou mapu](mets-physical.md). Pokrývá společné vazební požadavky a variantu logického popisu **bez vnitřních částí**. Na kapitoly, obrazy a jejich stránky navazuje [samostatná sada vnitřních částí](mets-internal-parts.md). Podrobná struktura blokových odkazů ALTO dosud není pokryta. Pravidla se nevztahují na [vedlejší METS](mets-amd.md).

## Zdroje a verze

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), s. 92 a 94 (logická mapa), s. 98, § 7.7.1.2.3 (bez kapitol), s. 99, § 7.8 a 7.8.2 (výčet stran). Strany 98–99 byly také vizuálně ověřeny.
- [METS XML Schema 1.9.1](https://www.loc.gov/standards/mets/version191/mets.xsd), deklarace structMapType, divType, metsType/structLink a structLinkType/smLink. Jde o verzi odkazovanou DMF, nikoli tvrzení o nejnovějším METS.

DMF v odstavci bez kapitol používá slovo „číslo“; v kontextu monografií jej vykládáme jako svazek. Vnitřní odkazy na oddíl 7.6.1.2.3 jsou zastaralé; odpovídající nadpis je 7.7.1.2.3. Tyto redakční odchylky nezavádějí novou úroveň monografie.

## Přehled

Prefix ID je `NDK-MONO-METS-LOGICAL-`.

| Pravidlo | Požadavek | Rozsah |
|---|---|---|
| MAP | Logická mapa s TYPE=LOGICAL | Hlavní METS |
| MAP-LABEL | LABEL=Logical_Structure | Logická mapa |
| SIMPLE-DIV | Hierarchie svazku a případného titulu | Bez kapitol |
| SIMPLE-VOLUME-DMDID | Vazba svazku na příslušný dmdSec | Bez kapitol |
| SIMPLE-TITLE-DMDID | Vazba titulu na příslušný dmdSec | Bez kapitol, pouze vícesvazková monografie |
| STRUCTLINK | Kontejner propojení map | Hlavní METS |
| SMLINK | Vazby smLink ve výčtu stran | Hlavní METS |
| SMLINK-FROM | ID logického div | Každý smLink |
| SMLINK-TO | ID fyzického stránkového div | Každý smLink |
| SIMPLE-PAGE-COVERAGE | Úplný výčet stran monografie a případné přílohy | Bez vnitřních částí |

Všechna pravidla mají slovní povinnost `mandatory`, `obligation_source: prose`, bez domyšleného kódu M/MA/R/RA/O. U titulových metadat je přítomnost podmíněná vícesvazkovým dokumentem. Tím nevzniká povinnost titulového popisu v každém jednodílném SIP.

## Směr a cíle vazeb

| Údaj | Co označuje | Co jej nenahrazuje |
|---|---|---|
| logický div/@DMDID | ID odpovídajícího dmdSec | ID vnořeného mods:mods |
| smLink/@xlink:from | ID div v logické mapě | LABEL, cesta, file nebo fyzický div |
| smLink/@xlink:to | ID stránky ve fyzické mapě | FILEID nebo rodičovský div svazku |

Vzor propojuje `VOLUME_0001` → `DIV_P_PAGE_0000` až `DIV_P_PAGE_0015`. Nemá zvláštní odkazy z každého nadřazeného uzlu, například MONOGRAPH_0001. Z příkladu proto nevzniká taková univerzální povinnost ani závazný prefix ID. Zápis používá hodnotu ID bez `#`, nikoli URI fragment.

DMDID má v obecném XSD typ IDREFS: jeden atribut může obsahovat více tokenů. Četnost 1–1 označuje atribut, nikoli zákaz seznamu. Nestačí existence libovolného XML ID; musí jít o odpovídající popisná metadata.

### Obecné METS versus DMF

Obecné METS dovoluje structLink vynechat a nabízí také smLinkGrp. DMF předepisuje výčet prostřednictvím smLink. Samotné smLinkGrp proto nenahradí zde popsaný požadavek. Horní mez jednoho structLink pochází z XSD, jeho povinná přítomnost z DMF.

Deklarace smLink vyžaduje atributy xlink:from a xlink:to. Sémantický směr od logického uzlu k fyzické stránce určuje DMF. Do pravidel nepřidáváme povinnost xlink:href ani xlink:type; volný komentář v XSD o href nesmí být zaměněn za deklaraci atributů smLink. Namespace XLink je `http://www.w3.org/1999/xlink`; samotné neprefixované from/to nestačí.

## Úplnost a podmínky

Stejný počet vazeb a stran nestačí. Kontrola musí porovnat **množiny a správné přiřazení**: duplicitní odkaz nesmí zakrýt chybějící stránku, existující ID jiné jednotky neprokazuje správný cíl. Tento oddíl sám nezavádí plošný zákaz duplicitních vazeb.

Očekávané stránky a příslušnost k monografii či příloze musejí vycházet z obsahu a rozsahu dokumentu, ne pouze z již existujících odkazů. Nepožaduje se vytvoření přílohy, která neexistuje, ani popis kapitol ve variantě bez vnitřních částí.

Kontext `logical_description_mode=no_internal_parts` musí vyjadřovat zvolený rozsah popisu. Pouhá absence kapitol není důkazem, že podrobný popis nebyl požadován. `monograph_is_multipart=true` vychází z dokumentu, ne z přítomnosti kontrolovaného titulového div nebo atributu. Chybějící povinný uzel tak kontrolu nevypne. `structural_level=volume` označuje význam uzlu v hierarchii, nikoli test prefixu ID.

## XML ukázky a ověření

Sada obsahuje **13 přesných výřezů u devíti pravidel**: logickou mapu, uzel svazku a jeho dmdSec, celý structLink, první vazbu a první fyzickou stránku. Ukázky zachovávají celý vybraný element. Opakované použití výřezu není další zdrojový soubor.

Zdroj: [dodaný vzorový SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`.

Vzor má 16 fyzických stran a 16 vazeb ze svazku. Jde o pozorování konkrétního SIP, nikoli předepsanou četnost. Vzor je jednodílný; nedokládá titulová metadata vícesvazku ani přiřazení samostatné přílohy. Proto pravidlo SIMPLE-TITLE-DMDID nedostává vymyšlený zdrojový výřez. Ukázky nejsou potvrzením validity celého SIP.

Původ výřezů ověřuje kontrola SHA-256 a XPath popsaná u [XML ukázek](xml-examples.md). Testy registru ověřují data, kontexty, vazby, exporty a zařazení do mapy i filtrů. Registr **nevykonává custom kontroly** a tato sada nedokládá chování NDK validátoru, ProArcu ani dalších nástrojů.
