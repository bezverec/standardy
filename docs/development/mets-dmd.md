# Obálky bibliografických metadat MODS/DC v METS

Osm pravidel `structure/mets-dmd` doplňuje strukturální METS o obálky popisných záznamů. Navazuje na odkazy DMDID ve [fyzické](mets-physical.md) a [logické mapě](mets-logical.md). Nejde ještě o katalog jednotlivých bibliografických polí MODS nebo Dublin Core.

## Zdroje a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4, s. 19–22; tabulka a obecné pokyny na s. 21–22 byly ověřeny také vizuálně. S. 23 rozlišuje ID samotných záznamů od ID obálek.
- [METS XSD 1.9.1](https://www.loc.gov/standards/mets/version191/mets.xsd), metsType/dmdSec, mdSecType, METADATA a FILECORE.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd) a [OAI DC XSD](https://www.openarchives.org/OAI/2.0/oai_dc.xsd), kořenové elementy a jejich namespace. OAI-PMH 2.0 označuje obálku, nikoli verzi DC zapsanou v MDTYPEVERSION.

Ověřeno 6. 10. 2026. Pravidla platí pro monografii a hlavní METS (`document_role=main_mets`). Neaplikují stejné číselníky na techMD, rightsMD nebo vedlejší amd_mets. `element_role=descriptive_section/descriptive_wrapper` označuje posuzovanou obálku. `descriptive_format=MODS/DC` vyjadřuje skutečný formát bibliografického obsahu, nikoli správnost kontrolovaného MDTYPE. Chybějící nebo nesprávný atribut tak nesmí vypnout příslušnou kontrolu.

## Přehled pravidel

Prefix ID je `NDK-MONO-METS-DMD-`.

| Pravidlo | Požadavek | Povinnost |
|---|---|---|
| SECTION | Bibliografické záznamy v dmdSec, samostatná sekce pro každý MODS | M |
| ID | Jedinečné ID obálky podle formátu a úrovně popisu | M |
| WRAP | Jeden mdWrap v každé popisné sekci | M |
| MDTYPE | MODS nebo DC, v souladu se skutečným obsahem | M |
| MODS-VERSION | MDTYPEVERSION=3.8 na obálce MODS | M |
| DC-VERSION | MDTYPEVERSION se na obálce DC nevyskytuje | zákaz ze slovního pokynu |
| MIMETYPE | text/xml pro obě větve | M |
| XMLDATA | Vložený XML záznam, nikoli binData, text nebo pouhý odkaz | M |

U zákazu verze DC se nepřebírá M z tabulkové povinnosti verze MODS: používá se `obligation=forbidden`, `obligation_source=prose`, `presence=forbidden` a kardinalita 0–0. Záznam DC tím není zakázán. Kód M u MODS se nemění na MA jen proto, že má pravidlo konkrétní kontext.

## ID obálky není ID vloženého záznamu

| Popis | ID dmdSec pro MODS | ID dmdSec pro DC |
|---|---|---|
| Titul vícesvazku | MODSMD_TITLE_0001 | DCMD_TITLE_0001 |
| Svazek | MODSMD_VOLUME_0001 | DCMD_VOLUME_0001 |
| Kapitola | MODSMD_CHAP_XXXX | DCMD_CHAP_XXXX |
| Obraz | MODSMD_PICT_XXXX | DCMD_PICT_XXXX |
| Příloha | MODSMD_SUPPL_XXXX | DCMD_SUPPL_XXXX |
| Strana | MODSMD_PAGE_XXXX | DCMD_PAGE_XXXX |

XXXX zastupuje čtyřmístné pořadí příslušné části, nikoli doslovný text. Neznamená, že všechny kapitoly mají mít číslo 0001. Toto pravidlo nepřikazuje automatické přečíslování existujícího SIP ani neřeší překročení čtyřmístného rozsahu. ID musí být jedinečné v celém XML dokumentu, nejen mezi dmdSec.

Ve vzoru má obálka ID `MODSMD_PAGE_0001`, zatímco vložený mods:mods má ID `MODS_PAGE_0001` a samostatný identifikátor UUID. DMDID míří na obálku, ne na vnitřní MODS ID ani UUID. Předepsané názvy TITLE a VOLUME nejsou požadavkem na existenci obou úrovní u každého dokumentu: jednosvazková monografie nemá titulovou vrstvu vícesvazku. Úplnost popisu se posuzuje podle skutečného dokumentu a zadání, nikoli jen nalezených sekcí.

## Co dovoluje obecné METS

Obecné schéma dovoluje dmdSec vynechat a dovoluje vložené i externě odkazované metadata. DMF požaduje mdWrap; samotný mdRef tedy nestačí. Nevydáváme to však za obecný XSD zákaz mdRef ani za zákaz jeho souběhu s vloženými metadaty.

Anotace METS XSD slovně označuje mdWrap za opakovatelný, ale konkrétní deklarace v xsd:all má minOccurs=0 a výchozí maxOccurs=1. Opakují se dmdSec, ne několik mdWrap uvnitř téže sekce. Národní povinnost a horní mez XSD společně dávají kardinalitu 1–1. ID sekce a MDTYPE jsou povinné už v XSD; MIMETYPE a MDTYPEVERSION obecně nejsou.

XmlData má obecně obsah s `processContents=lax`. Validita samotné obálky neprokazuje úplnou validitu vloženého formátu, správné mapování MARC/MODS/DC ani správnost názvu, žánru či paginace. Bibliografická validace zůstává samostatnou vrstvou. Verze MODS 3.8 na mdWrap se také nezaměňuje s mods:mods/@version, verzí METS nebo DMF.

DC vzoru používá kořen oai_dc:dc v namespace `http://www.openarchives.org/OAI/2.0/oai_dc/`, ale jeho pole dc:identifier apod. jsou v `http://purl.org/dc/elements/1.1/`. Prefix je volitelný alias, nikoli identita standardu. Z pouhého názvu dc nelze odvodit namespace. Přesnou podobu všech DC polí a jejich mapování tato sada neřeší.

## Doložené ukázky a meze ověření

Přidáno je **14 zdrojových výřezů u osmi pravidel**: sekce, mdWrap a xmlData první stránky, v podobě MODS i DC. Opakované výřezy u různých pravidel umožňují číst detail samostatně. Celý registr obsahuje 208 ukázek u 163 pravidel.

Zdroj: [dodaný SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`.

Výběr je ukotven XPath `/mets:mets/mets:dmdSec[@ID="MODSMD_PAGE_0001"]` nebo odpovídajícím DCMD_PAGE_0001, případně pokračováním `/mets:mdWrap` a `/mets:xmlData`. Jde o úplné vybrané uzly, nikoli zkrácené obálky s domyšleným obsahem. Normalizováno je pouze formátování a nepotřebné deklarace namespace. Zdrojová data se neopravují, ani když jiná část záznamu může být problematická.

Testy kontrolují data registru, rozsah pravidel, povinnosti, hodnoty, entity, vazby, filtry API a původ ukázek. **Custom kontroly registr nevykonává**; jde o katalog požadavků pro budoucí validátor, ne o test ProArcu, Krameria nebo Komplexního validátoru.
