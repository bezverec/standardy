# Názvové údaje jednotlivé stránky v MODS

Pět pravidel pro úroveň PAGE v hlavním METS zachycuje názvové údaje uvedené přímo na stránce monografie. Popis stránky je povinný, ale vyplnění jejího názvu závisí na předloze. Požadavky na název celého svazku mají vlastní rozsah. [DMF Monografie 2.3, § 7.4.1.6, s. 72](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf#page=72)

| Element | Povinnost | Co posoudit na stránce |
|---|---|---|
| `titleInfo` | RA | Dostupné názvové údaje stránky se doporučuje zachytit. |
| `titleInfo/title` | RA | Je-li na stránce nadpis nebo název, doporučuje se jej přepsat. |
| `titleInfo/title` | Slovní pokyn k vynechání | Pokud stránka neobsahuje nadpis ani název, element se vynechá. |
| `titleInfo/subTitle` | RA | V použitém `titleInfo` se doporučuje přepsat existující podnázev stránky. |
| `titleInfo/nonSort` | O | Při použití se zachová mezera potřebná ke spojení s názvem. U přiléhajícího členu se mezera nevkládá. |

Obě pravidla pro `title` mají stejný cílový element. Podmínka `page_heading_available` vyjadřuje zjištění z předlohy. Hodnota `true` aktivuje doporučení RA, hodnota `false` výslovný pokyn k vynechání. Jestliže předloha nebyla posouzena, zůstává výsledek otevřený. Prázdný element nesplňuje požadavek na vynechání. U podnázvu se dostupnost posuzuje zvlášť.

Všechny potomky posuzujeme v použitém `titleInfo` stránky. XSD modeluje jeho obsah jako opakovatelnou volbu. U `nonSort` připouští `xml:space`. Při přepisu je podstatná samotná koncová mezera, je-li potřebná pro správné zobrazení. Poznámka 9 v DMF na s. 72 popisuje samostatný převod dostupných složek názvu do jednoho `dc:title` s interpunkcí ISBD. Tato sada eviduje zdrojové elementy MODS. [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd)

Řádky pro názvové údaje stránky mají v DMF černé písmo. Podle legendy na s. 24 je bibliografický předpis v tomto rozsahu společný AACR2 i RDA. Pro `nonSort` vychází zápis z názvu stránky. Mapování svazkového názvu z MARC 245 má vlastní pravidlo. [Legenda DMF, s. 24](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf#page=24)

Ve vzorovém hlavním souboru METS bylo 6. 11. 2026 prověřeno všech 16 sekcí `MODSMD_PAGE_0001` až `0016`. Žádný z jejich záznamů MODS 3.8 neobsahuje přímý `mods:titleInfo`, takže z nich nelze převzít zdrojovou XML ukázku. O přítomnosti nadpisu na předloze by rozhodlo až porovnání s obrazem. [Vzorový monografický SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download)
