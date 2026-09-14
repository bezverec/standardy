# Datový model registru

## Identita a verze

Každý YAML dokument má `schema_version: "1.0"`, `kind` a stabilní `id`. ID pravidla neobsahuje verzi. Verze profilu a konkrétní podoba požadavku jsou položky pole `versions`.

```yaml
kind: rule
id: NDK-MONO-MIX-ICC-PROFILE-VERSION
profile:
  id: ndk-monograph
versions:
  - version: "2.4"
    status: draft
```

To umožní sémanticky porovnat dvě verze téhož profilu podle polí, nikoli podle textového YAML diffu.

## Entity

- **Standard** popisuje specifikaci a její verzované entity (element, atribut, formát, vlastnost nebo koncept).
- **Profile** vybírá, zpřísňuje nebo rozšiřuje standardy. Dědičnost je explicitní přes `inherits`; pravidla se nekopírují.
- **Rule** je stabilní významová identita.
- **RuleVersion** obsahuje požadavek platný pro konkrétní verzi profilu.
- **Vocabulary** je řízený seznam hodnot, na který může pravidlo odkazovat.

## Provenance a epistemický stav

Každá normativně relevantní verze nese úplný blok `source` a samostatný blok `verification`. `status: normative` říká roli obsahu ve zdrojovém standardu; `verification.status` říká, zda byl přepis do registru ověřen. Tyto pojmy nejsou zaměnitelné.

```yaml
source:
  document: DMF Monografie
  version: "2.4"
  page: null
  section: null
  url: null
verification:
  status: unverified
  date: null
  reference: Demo záznam.
```

Neověřené údaje nejsou prezentovány jako potvrzené normativní závěry.

## Oddělené vrstvy významu

`normative_requirement` zachycuje požadavek zdroje. `interpretation`, `validator_behaviour`, `implementations`, `discrepancies` a `fix_recommendation` jsou nenormativní vrstvy a nikdy nemění význam požadavku.

## Podmínky a validace

Podmínky jsou rekurzivní AST s uzly `all`, `any`, `not` a listy `field` + `operator` + `value`. Operátory jsou `exists`, `equals`, `matches`, `in`, `greater_than`, `less_than`.

Typ validace je otevřený pro budoucí engine, ale schéma dnes rozlišuje `xpath`, `regex`, `value_set`, `file_exists`, `checksum`, `custom`, `external_tool`, `jpylyzer`, `jhove` a `schematron`. Registry žádný validační engine zatím nespouští.

## Relace

Compiler normalizuje deklarované i odvozené vazby do hran `{from, to, type}`. Kontrola referenční integrity odmítne build s neexistujícím cílem. První verze podporuje všechny dohodnuté typy včetně `restricts`, `extends`, `defined_by`, `validated_by` a `generated_by`.

## Přidání záznamu

1. Přidejte YAML do odpovídajícího podadresáře `registry/`.
2. Uveďte stabilní ID, provenance a skutečný stav ověření.
3. Spusťte `npm run registry:validate`.
4. Spusťte `npm test` a `npm run registry:build`.
5. Změnu navrhněte pull requestem; vlastní CMS není součástí systému.
