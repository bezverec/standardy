# Datový model registru

## Identita a verze

Každý YAML dokument má `schema_version: "1.0"`, `kind` a stabilní `id`. ID pravidla neobsahuje verzi. Verze národního standardu a konkrétní podoba požadavku jsou položky pole `versions`.

```yaml
kind: rule
id: NDK-MONO-MIX-ICC-PROFILE-VERSION
national_standard:
  id: ndk-monograph
versions:
  - version: "2.3"
    status: disputed
```

To umožní sémanticky porovnat dvě verze téhož národního standardu podle polí, nikoli podle textového YAML diffu.

## Entity

- **Standard** popisuje zdrojovou specifikaci a její verzované entity (element, atribut, formát, vlastnost nebo koncept).
- **NationalStandard** reprezentuje národní standard, který vybírá, zpřísňuje nebo rozšiřuje zdrojové standardy. Dědičnost je explicitní přes `inherits`; pravidla se nekopírují.
- **Rule** je stabilní významová identita.
- **RuleVersion** obsahuje požadavek platný pro konkrétní verzi národního standardu.
- **Vocabulary** je řízený seznam hodnot, na který může pravidlo odkazovat.

V uživatelském rozhraní i datovém modelu se důsledně rozlišují **zdrojové standardy** (`standard`) a **národní standardy** (`national_standard`). Národní standard může mít technickou roli aplikačního profilu, ale tato role již neurčuje jeho veřejný ani interní název.

## Provenance a epistemický stav

Každá normativně relevantní verze nese úplný blok `source` a samostatný blok `verification`. `status: normative` říká roli obsahu ve zdrojovém standardu; `verification.status` říká, zda byl přepis do registru ověřen. Tyto pojmy nejsou zaměnitelné.

```yaml
source:
  document: DMF Monografie
  version: "2.3"
  page: 83
  section: "7.5.4 Technická metadata MIX"
  url: "https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf"
verification:
  status: verified
  date: "2026-09-14"
  reference: Ověřeno proti primárnímu zdroji; rozpor v příkladu je popsán samostatně.
```

Neověřené údaje nejsou prezentovány jako potvrzené normativní závěry.

## Oddělené vrstvy významu

`normative_requirement` zachycuje požadavek zdroje. `interpretation`, `validator_behaviour`, `implementations`, `discrepancies` a `fix_recommendation` jsou nenormativní vrstvy a nikdy nemění význam požadavku.

## Podmínky a validace

`obligation` vyjadřuje úroveň povinnosti v citované verzi standardu. `obligation_code` zachovává původní kód NDK, nikoli kód odhadnutý z chování nástroje:

| Kód NDK | `obligation` | Význam |
|---|---|---|
| M | `mandatory` | Povinné |
| MA | `mandatory_if_available` | Povinné, pokud je údaj dostupný / lze jej plnit |
| R | `recommended` | Doporučené |
| RA | `recommended_if_available` | Doporučené, pokud je údaj dostupný / lze jej plnit |
| O | `optional` | Volitelné |

Obecný model navíc podporuje `forbidden` (**v daném kontextu se nepoužívá**) a `unspecified` (neurčeno); těm se žádný z kódů NDK nepřiřazuje. Mimo NDK lze `obligation_code` vynechat. Sémantická validace vyžaduje původní kód pro známé úrovně M/MA/R/RA/O u pravidel národních standardů s prefixem `ndk-` a kontroluje jeho soulad s obecnou úrovní. Pokud je požadavek v prameni pouze slovní, pravidlo výslovně uvádí `obligation_source: prose` a kód vynechá; tato pole nelze kombinovat. Například skupina METS má `obligation: mandatory` podle slovního požadavku, nikoli domyšlené `obligation_code: M`. U neurčené povinnosti se kód nevymýšlí. Pole jsou součástí konkrétní `RuleVersion` a její provenance `source`, exportu a OpenAPI kontraktu.

### Nepoužití není totéž co odlišnost standardů

`forbidden` zůstává interní hodnotou pro požadovanou nepřítomnost, nikoli názvem relace mezi standardy. Vyžaduje `requirement.presence: forbidden` a blok `non_use` s vysvětlením a `basis: explicit` (zdroj nepoužití výslovně požaduje) nebo `basis: interpretation` (redakční výklad omezení zdroje). Pramen je v `source`, rozsah v národním standardu/verzi, případně `cataloguing_rules` a `condition`. Kód neprokazuje obecnou neplatnost XML.

Z dosavadních pěti záznamů mají čtyři výslovné nepoužití podle citovaného DMF: MDTYPEVERSION u DC, type u hlavního názvu, type u příslušných částí jména a role u události z MARC 264_4. U AACR2/eventType je zaznamenán **výklad** vyhrazení atributu pouze pro RDA. Jeho ověřený přepis není samostatné potvrzení správnosti výkladu. Normativní texty, kardinality, podmínky a zdrojové XML se touto změnou nepřepisují.

Vztah k mezinárodnímu standardu se posuzuje samostatně: `restricts` označuje užší výběr možností, `extends` rozšíření a `conflicts_with` doložený nesoulad. Pouhý rozdíl nebo užší výběr není automaticky rozpor ani zákaz. Nepoužití může dokonce odpovídat obecnému standardu; samotná existence takového pravidla neprokazuje omezení oproti němu. Pokud byl doložen jen rozdíl, uvede se s prameny v interpretační vrstvě a případně k odbornému posouzení, nikoli automaticky jako `forbidden`.

Povinnost se nesmí odvozovat ze závažnosti hlášení validátoru; nahrazuje původní ručně přidělené pole `severity`. API filtr a řazení používají `obligation`, přesný zdrojový kód lze filtrovat přes `obligation_code`. Migrace 0003 přejmenovala indexovaný sloupec; nové MA/RA nevyžadují další migraci. Původní kód se uchovává v JSON záznamu a aktualizuje importem YAML.

[Issue NDK #258](https://github.com/NLCR/Standard_NDK/issues/258), zveřejněné 30. 9. 2026, plánuje v dalších verzích DMF ponechat M, MA a R a sjednotit RA/O na R. Konkrétní cílové verze v návrhu nejsou určeny. Registr proto **neprovádí zpětný ani automatický převod**. Po vydání a ověření příslušné nové DMF vznikne nová verze pravidla s vlastním kódem a zdrojem; stará verze si ponechá RA či O. Sémantické porovnání zachytí změnu obou polí. Issue je podkladem pro plánování, nikoli normativním pramenem pro již vydané DMF.

Povinnost se uplatňuje jen za podmínek `condition`. Dostupnost údaje u MA/RA není totéž jako podmínka platnosti pravidla a nesmí být bez opory ve zdroji redukována na existenci XML elementu. U ICC jména a verze jde o `obligation_code: M`, u URI o `obligation_code: R` podle DMF Monografie 2.3 pro MC/PS, je-li přítomen blok `IccProfile`. `presence: optional` u doporučeného URI vyjadřuje, že absence není zakázaná; nezaměňuje se s úrovní doporučení R. Sporná sémantika verze ani ověření přepisu nemění povinnost přítomnosti.

Podmínky jsou rekurzivní AST s uzly `all`, `any`, `not` a listy `field` + `operator` + `value`. Operátory jsou `exists`, `equals`, `matches`, `in`, `greater_than`, `less_than`.

Typ validace je otevřený pro budoucí engine, ale schéma dnes rozlišuje `xpath`, `regex`, `value_set`, `file_exists`, `checksum`, `custom`, `external_tool`, `jpylyzer`, `jhove` a `schematron`. Pole `validations` umožňuje složit více kontrol, například povinnou přítomnost elementu a číselný tvar jeho hodnoty. Registr žádný validační engine zatím nespouští.

## Vyhodnocovací kontext obrazové skupiny MIX

U [rozměrů, vzorkování a barevného kódování](mix-image-characteristics.md) se XPath vztahují k samostatnému záznamu s kořenem `mix:mix` a prefixem `mix` pro `http://www.loc.gov/mix/v20`. Při práci s `amd_mets.xml` je třeba vybrat odpovídající MIX záznam. Kardinalita se počítá v tomto kontextu a regex se vztahuje na každý vybraný výskyt.

Pravidla frekvencí X/Y zachovávají MA a mají podmínku hodnoty `samplingFrequencyUnit` v množině `in.`, `cm`; povinná jednotka má vlastní pravidlo. Doporučené prvky R nemají bezpodmínečnou kontrolu přítomnosti. Opakovaný `bitsPerSampleValue` používá `max: null` pro neomezenou horní mez, nikoli čárkami oddělený seznam v jednom elementu.

## Relace

Compiler normalizuje deklarované i odvozené vazby do hran `{from, to, type}`. Kontrola referenční integrity odmítne build s neexistujícím cílem. První verze podporuje všechny dohodnuté typy včetně `restricts`, `extends`, `defined_by`, `validated_by` a `generated_by`.

## Porovnávání DMF a AACR2/RDA

Porovnání musí oddělit několik nezávislých os:

| Osa | Zápis |
|---|---|
| Druh DMF a jeho verze | `national_standard.id` + `versions[].version` |
| Objekt a bibliografická úroveň | `object_types` a podmínky `object_type`, `bibliographic_level` |
| Relevance katalogizace | `cataloguing_scope.applicability`: `independent`, `applicable`, `undetermined`; zdůvodnění, datum a prameny posouzení |
| Katalogizační pravidla | pro `applicable` povinné `cataloguing_rules: [aacr2]`, `[rda]` nebo `[aacr2, rda]` |
| Role záznamu/elementu a technický kontext | `condition`, například `document_role`, `element_role`, role souboru |
| Srovnávaný význam a aspekt | explicitní `comparison.key` + zdůvodnění `comparison.note` |

Dosavadní `monograph` v číselníku označuje rozsah DMF Monografie; není univerzální klasifikací všech fyzických předloh. Existující kontexty se nepřepisují ani neslučují do jediné kategorie.

Chybějící `cataloguing_scope` nebo hodnota `undetermined` znamená **neurčený rozsah**, nikoli obě varianty ani nezávislost. Doložené `independent` zůstává zahrnuto při volbě AACR2 i RDA a nemá `cataloguing_rules` ani katalogizační podmínku. `applicable` vyžaduje neprázdné `cataloguing_rules`; dvě hodnoty znamenají společný předpis v relevantní bibliografické oblasti, nikoli irelevanci katalogizace. Každé posouzení má `note`, `reviewed_on` a `sources` s lokátorem; jde o redakční závěr oddělený od `verification` přepisu požadavku. Seznam i případné katalogizační podmínky se uplatňují současně; validace odmítá jejich rozpor i kombinaci nezávislosti s katalogizačním omezením. Interní podmínka používá `aacr2`; doslovný kód `aacr` v MODS `descriptionStandard`, zdrojových výřezech a stabilních ID zůstává zachován. Režim nelze odvozovat z existence kontrolovaného eventType nebo jediného MARC pole. Katalogizační podmínky používají `equals`/`in` a řízené hodnoty; `all`/`any`/`not` zachovávají neznámé ostatní okolnosti.

[První mezi-DMF sada](periodical-mix-comparison.md) přidává deset explicitních klíčů `mix.mc-ps.*` pro Monografie 2.3 a Periodika 2.2. Technické požadavky těchto dvojic se shodují; `object_types` a podmínka dokumentového rozsahu však zůstávají odlišné. Engine odděluje jednoznačný rozdíl druhu dokumentu do `scope_changes` a pro těchto deset dvojic vrací `same_recorded_requirement`. Jde o shodu požadavku, nikoli ekvivalenci celých DMF. Poznámka `comparison.note` dokládá důvod párování a je viditelná v porovnávači.

První zmapovanou dvojicí je `mods.descriptive-origin.event-type`: nepoužití v AACR2 versus požadavek pro RDA. [Audit všech 263 pravidel](cataloguing-scope-audit.md) rozlišuje 204 nezávislých požadavků, 54 společných bibliografických předpisů, jeden AACR2 a čtyři RDA předpisy. Relevance se neodvozuje za běhu z namespace ani kategorie. Audit rozsahu není mapování ekvivalence: klíče se nepřidělují odstraněním prefixu ID nebo shodou lokálního názvu elementu. Různé role `name` či `type` nejsou automaticky ekvivalentní. Původní podmínky se vždy vracejí celé. U dvojice různých DMF se ze srovnání požadavku oddělí pouze jednoznačná kladná podmínka druhu dokumentu odpovídající jedinému typu ve stejném slovníku `object_types`. Podmínky uvnitř OR/NOT, rozporné či vícečetné typy se nezjednodušují. MC/PS, jednotky, bibliografické úrovně a AACR2/RDA se nadále porovnávají.

### Čtecí API a výsledek

Endpoint `/api/v1/compare/contexts` dovoluje nezávisle vybrat `national_standard_a`, `version_a`, `national_standard_b`, `version_b` a volitelně `cataloguing_a`/`cataloguing_b`. Existující diff verzí jednoho standardu zůstává beze změny. Kontrakt a zkoušení endpointu jsou ve Swaggeru; uživatelské rozhraní je na `/registry/compare` v hlavní navigaci pod **Porovnání**.

Obrazovka nabízí dva nezávislé výběry, prohození stran a odkaz obsahující aplikovaný výběr. Změny formuláře se provedou tlačítkem **Porovnat**; do té doby je původní výsledek označen vlastním kontextem A/B a upozorněním na změnu výběru. Funguje i historie prohlížeče. Neplatný sdílený výběr se nevymění potichu za jiný standard či verzi. Bez parametrů je předvolen příklad Monografie 2.3 AACR2 versus RDA, pokud je v seznamu dostupný.

Výsledky lze filtrovat podle stavu a hledat podle klíče, názvu, ID a normativního textu. Obě strany mají požadavek, povinnost, zdroj s lokátorem, odkaz na konkrétní verzi pravidla a rozbalitelné podmínky. Další detail ukazuje změněná pole A/B. Nezmapované, katalogizačně neprověřené a vyloučené záznamy mají oddělené sbalené seznamy s počty a postupným načítáním do zobrazení po 20 položkách. Na úzké obrazovce jsou strany pod sebou. Nejde o načtení dalších pravidel ze serveru: API vrací úplný výběr, stránkováno je jeho zobrazení. Filtry výsledků nejsou součástí sdíleného odkazu.

```bash
curl 'https://standardy.digitalizaty.cz/api/v1/compare/contexts?national_standard_a=ndk-monograph&version_a=2.3&cataloguing_a=aacr2&national_standard_b=ndk-monograph&version_b=2.3&cataloguing_b=rda'
```

Výstup obsahuje obě kompletní pravidla včetně pramenů, změněná pole a stav:

- `same_recorded_requirement`: stejný zaznamenaný požadavek a kontext; nikoli důkaz obecné sémantické ekvivalence.
- `different_context`: liší se podmínky nebo katalogizační rozsah, případně nelze bezpečně oddělit druh dokumentu. Nejde automaticky o zamýšlenou odlišnost.
- `difference_for_review`: ostatní rozdíl k posouzení, nikoli potvrzená chyba.
- `no_counterpart`: ve výběru nebyl nalezen protějšek se společným klíčem.
- `ambiguous_mapping`: klíč má na některé straně více kandidátů; žádný se potichu nevybere.
- `unverified`: alespoň jeden spárovaný požadavek není ověřený a normativní; tento stav brání vykázání potvrzené shody.

Samostatně se vracejí zahrnutá pravidla bez významového klíče (`unmapped`, včetně nezávislých), neurčený katalogizační rozsah (`unresolved_context`) a pravidla vyloučená zvoleným režimem (`excluded_context`). Obrazovka uvádí počty zahrnutých nezávislých a společných pravidel odděleně od počtu spárovaných aspektů. Pro Monografie 2.3 AACR2/RDA nyní není žádný neurčený rozsah, ale 222/225 záznamů ještě nemá párovací klíč. Bez katalogizačního filtru zůstávají zahrnuta i neposouzená pravidla. **Nenalezené pravidlo neznamená, že zdrojový DMF mlčí, údaj dovoluje nebo zakazuje.** Neexistující standard/verze vrací 404, neúplný výběr či neznámý katalogizační kód 400.

Porovnání je strukturální: zahrnuje normativní text, strojové požadavky, povinnost, cíl a podmínky; ignoruje rozdíly stránkování zdroje, data přepisu či ukázek. Nerozhoduje ekvivalenci různě formulovaných kontrol ani různě uspořádaných polí. Nevyhodnocuje XML, další kontextové podmínky ani dědičnost standardů. Přidání druhé DMF je ověřeno syntetickým testem, nikoli vymyšlenými produkčními záznamy.

Další kroky: rozšířit odborně ověřené mapování na další DMF a pravidla a doplnit evidenci výsledku odborného posouzení (zamýšlený rozdíl, podezření, potvrzený nesoulad). Automatická detekce rozdílu tento redakční závěr nenahrazuje.

## Přidání záznamu

1. Přidejte YAML do odpovídajícího podadresáře `registry/`.
2. Uveďte stabilní ID, provenance a skutečný stav ověření.
3. Spusťte `npm run registry:validate`.
4. Spusťte `npm test` a `npm run registry:build`.
5. Změnu navrhněte pull requestem; vlastní CMS není součástí systému.
