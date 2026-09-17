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
