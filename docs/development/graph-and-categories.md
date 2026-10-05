# Třídění pravidel a graf vztahů

## Tři nezávislé rozměry třídění

Registr rozlišuje **oblast metadat**, **metadatový standard** a **téma pravidla** (`category`, například `technical/icc`). Oblast a metadatový standard se odvozují od vlastníka cílového prvku (`target.entity` → `defined_by` → standard). Citovaný pramen ani související pravidlo zařazení nemění. Pravidlo pro `mix:iccProfileVersion` tak patří do MIX, přestože odkazuje také na ICC a NISO.

| Oblast | Metadatové standardy |
|---|---|
| Strukturální metadata | METS |
| Popisná metadata | MODS, Dublin Core (`DC`) |
| Administrativní a technická metadata | PREMIS, MIX |
| Technická metadata zvuku | AES57 |
| OCR a rozvržení stránky | ALTO |
| Autorskoprávní metadata | copyrightMD |
| Technická metadata e-publikací | documentMD |
| Informace o balíčku | info.xml (`NDK-INFO`) |

Členění vychází z [přehledu metadat NDK](https://standardy.ndk.cz/ndk/standardy-digitalizace/metadata) a slouží k navigaci. Není úplnou ontologií standardů: například [METS](https://www.loc.gov/standards/mets/) zastřešuje také popisná a administrativní metadata. Zařazení nepřidává normativní požadavky.

Sdílený katalog je v `packages/registry-core/src/metadata-taxonomy.ts`; používá jej web i API. Obsahuje odkazy na dokumentaci všech uvedených standardů. Odkaz documentMD vede na historickou archivovanou dokumentaci, nikoli na ověřenou aktuální verzi. Katalog není totéž co seznam konkrétních verzí a prvků evidovaných v YAML.

Nabídka zobrazuje i oblasti bez vložených pravidel, s počtem nula. Počty u filtrů označují všechny verzované záznamy před použitím ostatních filtrů. Pro nový standard použijte shodné stabilní ID v katalogu a YAML; jeho pravidla se zařadí podle cílových entit. Nové oblasti přidejte do společného katalogu a testů, nikoli do samostatných seznamů ve webu a Workeru.

## Práce s grafem

- Výchozí pohled ukazuje pouze přímé vazby aktuálního pravidla. Lze přepnout na dva kroky nebo celé dostupné okolí.
- Režim **Celý graf** přizpůsobí všechny viditelné uzly i vazby ploše bez vnitřního posouvání. Uzly jsou rozdělené po obou stranách aktuálního pravidla; výška plochy roste s počtem uzlů od 520 do 1100 px. Rozbalení filtrů plochu nezmenšuje.
- Pro čtení detailů lze zvolit zvětšení 1,5×, 2× nebo 3×; teprve potom může být potřeba graf posouvat. Návrat na **Celý graf** zachová vybrané filtry.
- Pod **Skrýt nebo zobrazit vazby a kategorie** jsou přepínače typů vazeb, druhů uzlů, oblastí metadat a témat pravidel.
- Filtry se kombinují. Výchozí pravidlo zůstává viditelné; odpojené uzly se skryjí. Počet viditelných uzlů a vazeb je uveden nad grafem.
- Popisky vazeb lze zapnout. Bez nich je úplný vztah dostupný při najetí na vazbu; textový přehled nabízí **Tabulka vazeb** se sloupci zdroj, vztah a cíl.
- Graf a tabulka používají stejné filtry. **Obnovit výchozí** obnoví přímé vazby a zapne všechny kategorie.

Vzdálenost ve webovém pohledu se počítá od kořene po zbylých vazbách bez ohledu na jejich směr; šipky a tabulka směr zachovávají. Uzly patřící do více oblastí nebo témat zůstávají viditelné, pokud je povolena alespoň jedna z jejich kategorií. Nastavení grafu platí pro otevřený detail; nepřenáší se v URL. Naproti tomu filtry seznamu pravidel v URL zůstávají.

API `/rules/{id}/why` dodává nejvýše čtyři odchozí kroky od kořene, nezávisle na pořadí relací. „Celé dostupné okolí“ znamená celý tento výsledek, ne celý registr. Graf obsahuje vazby napříč evidovanými verzemi; není grafem jediné zvolené verze NDK. Úplný nezfiltrovaný výpis přímých vztahů pod grafem je záměrně oddělený.

## API

```bash
curl 'https://standardy.digitalizaty.cz/api/v1/metadata-taxonomy'
curl 'https://standardy.digitalizaty.cz/api/v1/rules?metadata_area=administrative-technical&standard=MIX'
curl 'https://standardy.digitalizaty.cz/api/v1/rules?metadata_area=package'
```

Filtr `metadata_area` se kombinuje s `standard`, `category`, verzí a dalšími filtry. Neznámá oblast vrací HTTP 400 (`unknown_metadata_area`); známá oblast bez pravidel vrací prázdný seznam. Kontrakt API je popsán ve [Swaggeru](https://standardy.digitalizaty.cz/api-docs/). Není potřebná migrace D1 ani ruční doplňování oblastí ke každému pravidlu.

Testy kontrolují shodu API a klientských filtrů, rozlišení cíle od citací, prázdné oblasti, skrytí a opětovné rozbalení okolí, cykly, limit průchodu i nepřekrývající se rozmístění uzlů.
