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

## Mapa registru

Domovská stránka registru `/registry/` nabízí dlaždicovou mapu obsahu; logo, hlavní navigace a vstup z dokumentace vedou sem. Odkaz `/registry/map` zůstává funkčním aliasem. Oblasti metadat obsahují standardy a ty tematické skupiny pravidel. Výběr národního standardu a verze omezuje počty i odkazy do seznamu pravidel. Kliknutí na skupinu přenese také metadatový standard a téma do filtrů seznamu.

Na mobilních šířkách do 650 px se navigace otevírá tlačítkem Menu a filtry seznamu jsou ve výchozím stavu sbalené; tlačítko ukazuje počet aktivních filtrů. Na desktopu jsou navigace i filtry stále viditelné. Zvětšený graf, tabulka vazeb a XML ukázky mají vlastní posouvání, nikoli vodorovné přetečení celé stránky. Zobrazení celého grafu zůstává výchozí; pro čtení hustých vazeb na malém displeji lze přepnout na tabulku nebo graf zvětšit.

Počet pravidel znamená unikátní ID, počet záznamů zahrnuje jednotlivé verze. Barevný pruh znázorňuje rozložení povinností **ve verzovaných záznamech**, nikoli úplnost standardu nebo závažnost chyb. Historické povinnosti se nepřevádějí na budoucí kódy. Číselné hodnoty a textové značky doplňují barvu. Standardy bez pravidel ve vybraném rozsahu se zobrazují zvlášť; cíle mimo katalog se neztrácejí, ale patří do „Ostatní / nezařazené cíle“.

Mapa i radiální síť jsou inspirované vizualizacemi [Permoníku](https://permonik.digitalizaty.cz/). Implementace pro registr používá vlastní React/SVG a současná data API; nepotřebuje novou grafovou knihovnu ani migraci D1.

## Práce s grafem

- Výchozí pohled ukazuje pouze přímé vazby aktuálního pravidla. Lze přepnout na dva kroky nebo celé dostupné okolí.
- **Sloupcový graf**, **Radiální síť** a **Tabulka vazeb** zobrazují stejná filtrovaná data. Radiální síť má aktuální pravidlo uprostřed a jednotlivé druhy uzlů na kružnicích. Rozmístění je stabilní, bez fyzikální simulace; uzly mají stejnou velikost, která nevyjadřuje důležitost nebo povinnost.
- Režim **Celý graf** přizpůsobí všechny viditelné uzly i vazby ploše bez vnitřního posouvání. Uzly jsou rozdělené po obou stranách aktuálního pravidla; výška plochy roste s počtem uzlů od 520 do 1100 px. Rozbalení filtrů plochu nezmenšuje.
- Pro čtení detailů lze zvolit zvětšení 1,5×, 2× nebo 3×; teprve potom může být potřeba graf posouvat. Návrat na **Celý graf** zachová vybrané filtry.
- Zvětšený graf lze posouvat tažením za pozadí, dotykem nebo posuvníky. Tlačítko **Přizpůsobit celý graf** obnoví měřítko a pozici bez změny filtrů. Změna filtrů nebo rozmístění také zobrazí celý graf. **Na celou obrazovku** otevře graf včetně ovládání; návrat je tlačítkem nebo Escape. Pokud prohlížeč celou obrazovku nepovolí, zobrazí se zpráva a běžný pohled zůstane funkční.
- Pod **Skrýt nebo zobrazit vazby a kategorie** jsou přepínače typů vazeb, druhů uzlů, oblastí metadat a témat pravidel.
- Šipky u druhů uzlů mění pořadí radiálních vrstev od středu ven. Skrytí druhu uzlů se promítá i do ostatních režimů.
- Kliknutí na uzel nebo Enter/mezerník zvýrazní jeho přímé sousedy a utlumí ostatní vazby. Panel nad grafem ukáže celý název a ID, odkaz na detail (pokud existuje) a zrušení výběru. Další kliknutí výběr zruší. Tabulka zachovává přímé odkazy.
- Filtry se kombinují. Výchozí pravidlo zůstává viditelné; odpojené uzly se skryjí. Počet viditelných uzlů a vazeb je uveden nad grafem.
- Popisky vazeb lze zapnout. Bez nich je úplný vztah dostupný při najetí na vazbu; textový přehled nabízí **Tabulka vazeb** se sloupci zdroj, vztah a cíl.
- Graf a tabulka používají stejné filtry. **Obnovit výchozí** obnoví přímé vazby a zapne všechny kategorie.

Vzdálenost ve webovém pohledu se počítá od kořene po zbylých vazbách bez ohledu na jejich směr; šipky a tabulka směr zachovávají. Uzly patřící do více oblastí nebo témat zůstávají viditelné, pokud je povolena alespoň jedna z jejich kategorií. Režim zobrazení, pořadí vrstev a skryté druhy uzlů se ukládají pod verzovaným klíčem `standardy-graph-layout-v1` v localStorage prohlížeče. Neplatná data se normalizují a chybějící nové druhy doplní. Při nedostupném úložišti graf dále funguje, pouze se nastavení nezachová po opuštění detailu. Ostatní filtry, přiblížení a výběr uzlu platí jen pro otevřený detail; nic z nastavení grafu se nepřenáší v URL. Naproti tomu filtry seznamu pravidel v URL zůstávají.

API `/rules/{id}/why` dodává nejvýše čtyři odchozí kroky od kořene, nezávisle na pořadí relací. „Celé dostupné okolí“ znamená celý tento výsledek, ne celý registr. Graf obsahuje vazby napříč evidovanými verzemi; není grafem jediné zvolené verze NDK. Úplný nezfiltrovaný výpis přímých vztahů pod grafem je záměrně oddělený.

## API

```bash
curl 'https://standardy.digitalizaty.cz/api/v1/metadata-taxonomy'
curl 'https://standardy.digitalizaty.cz/api/v1/rules?metadata_area=administrative-technical&standard=MIX'
curl 'https://standardy.digitalizaty.cz/api/v1/rules?metadata_area=package'
```

Filtr `metadata_area` se kombinuje s `standard`, `category`, verzí a dalšími filtry. Neznámá oblast vrací HTTP 400 (`unknown_metadata_area`); známá oblast bez pravidel vrací prázdný seznam. Kontrakt API je popsán ve [Swaggeru](https://standardy.digitalizaty.cz/api-docs/). Není potřebná migrace D1 ani ruční doplňování oblastí ke každému pravidlu.

Testy kontrolují shodu API a klientských filtrů, rozlišení cíle od citací, prázdné oblasti, skrytí a opětovné rozbalení okolí, cykly, limit průchodu i nepřekrývající se rozmístění uzlů.
