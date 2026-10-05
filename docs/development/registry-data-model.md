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

Obecný model navíc podporuje `forbidden` (zakázané) a `unspecified` (neurčeno); těm se žádný z kódů NDK nepřiřazuje. Mimo NDK lze `obligation_code` vynechat. Sémantická validace vyžaduje původní kód pro známé úrovně M/MA/R/RA/O u pravidel národních standardů s prefixem `ndk-` a kontroluje jeho soulad s obecnou úrovní. U neurčené povinnosti se kód nevymýšlí. Obě pole jsou součástí konkrétní `RuleVersion` a její provenance `source`.

Povinnost se nesmí odvozovat ze závažnosti hlášení validátoru; nahrazuje původní ručně přidělené pole `severity`. API filtr a řazení používají `obligation`, přesný zdrojový kód lze filtrovat přes `obligation_code`. Migrace 0003 přejmenovala indexovaný sloupec; nové MA/RA nevyžadují další migraci. Původní kód se uchovává v JSON záznamu a aktualizuje importem YAML.

[Issue NDK #258](https://github.com/NLCR/Standard_NDK/issues/258), zveřejněné 30. 9. 2026, plánuje v dalších verzích DMF ponechat M, MA a R a sjednotit RA/O na R. Konkrétní cílové verze v návrhu nejsou určeny. Registr proto **neprovádí zpětný ani automatický převod**. Po vydání a ověření příslušné nové DMF vznikne nová verze pravidla s vlastním kódem a zdrojem; stará verze si ponechá RA či O. Sémantické porovnání zachytí změnu obou polí. Issue je podkladem pro plánování, nikoli normativním pramenem pro již vydané DMF.

Povinnost se uplatňuje jen za podmínek `condition`. Dostupnost údaje u MA/RA není totéž jako podmínka platnosti pravidla a nesmí být bez opory ve zdroji redukována na existenci XML elementu. U ICC jména a verze jde o `obligation_code: M`, u URI o `obligation_code: R` podle DMF Monografie 2.3 pro MC/PS, je-li přítomen blok `IccProfile`. `presence: optional` u doporučeného URI vyjadřuje, že absence není zakázaná; nezaměňuje se s úrovní doporučení R. Sporná sémantika verze ani ověření přepisu nemění povinnost přítomnosti.

Podmínky jsou rekurzivní AST s uzly `all`, `any`, `not` a listy `field` + `operator` + `value`. Operátory jsou `exists`, `equals`, `matches`, `in`, `greater_than`, `less_than`.

Typ validace je otevřený pro budoucí engine, ale schéma dnes rozlišuje `xpath`, `regex`, `value_set`, `file_exists`, `checksum`, `custom`, `external_tool`, `jpylyzer`, `jhove` a `schematron`. Pole `validations` umožňuje složit více kontrol, například povinnou přítomnost elementu a číselný tvar jeho hodnoty. Registr žádný validační engine zatím nespouští.

## Relace

Compiler normalizuje deklarované i odvozené vazby do hran `{from, to, type}`. Kontrola referenční integrity odmítne build s neexistujícím cílem. První verze podporuje všechny dohodnuté typy včetně `restricts`, `extends`, `defined_by`, `validated_by` a `generated_by`.

## Přidání záznamu

1. Přidejte YAML do odpovídajícího podadresáře `registry/`.
2. Uveďte stabilní ID, provenance a skutečný stav ověření.
3. Spusťte `npm run registry:validate`.
4. Spusťte `npm test` a `npm run registry:build`.
5. Změnu navrhněte pull requestem; vlastní CMS není součástí systému.
