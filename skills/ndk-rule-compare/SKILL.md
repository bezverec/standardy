---
name: ndk-rule-compare
description: Odborně páruje a porovnává požadavky různých DMF, verzí nebo AACR2/RDA v registru bezverec/standardy. Rozlišuje shodný požadavek, rozsah platnosti, neověřený protějšek a rozdíl k posouzení.
---

# Porovnání významu pravidel

Přečti část Porovnávání v [datovém modelu](../../docs/development/registry-data-model.md) a při změně párování aktuální [implementaci porovnání](../../packages/registry-core/src/rule-comparison.ts). Pro katalogizační rozdíly také [audit rozsahu](../../docs/development/cataloguing-scope-audit.md). Pracuj z kořene checkoutu.

Nejdřív urč obě strany: národní standard, verzi, případný katalogizační režim a roli elementu. Požadavek „porovnej“ opravňuje k analýze, ne sám ke změně YAML. Veřejné API porovnává evidované záznamy; chybějící záznam nedokazuje absenci požadavku v DMF.

## Párování

- Začni primárními prameny obou stran. Stejný lokální název XML nebo ID bez prefixu nestačí: `name` původce není `subject/name`, MC není UC, svazek není automaticky titul periodika.
- Jednomu doloženému aspektu dej společný `comparison.key` a oběma stranám zdrojově podloženou `comparison.note`. Neodstraňuj rozdíly formulací nebo podmínek jen proto, aby engine vrátil shodu. Nepárované a víceznačné záznamy přiznej.
- Rozdílný druh dokumentu může být pouze rozdílem rozsahu (`scope_changes`). Zachovej jej v původních datech; neodstraňuj podmínky OR/NOT, rozporné typy, MC/PS, úroveň objektu ani katalogizaci pro dosažení shody.
- Shoda evidovaného požadavku není ekvivalence celých standardů. Strukturální diff neřeší významovou ekvivalenci libovolných XPath, regexů ani odlišných formulací.
- `difference_for_review` není potvrzená chyba a `different_context` není důkaz úmyslu autorů DMF. Doložený rozpor patří do odděleného odborného posouzení s oběma prameny. Nedoložené párování nesmí být prezentované jako ověřené.

## Výstup a ověření

V reportu uváděj pro každou dvojici aspekt, oba požadavky/povinnosti, podmínky, zdroje a rozdíl. Odděl nezmapované položky, vyloučené režimy, neověřené záznamy a nejednoznačné kandidáty. Výchozí katalogizační filtr neodvozuj z absence XML dat.

Pokud zadání zahrnuje změnu párování, přidej test obou pořadí A/B a mezních kontextů. Spusť validaci registru a alespoň:

```sh
npm test -- tests/rule-comparison.test.ts tests/cataloguing-scope.test.ts tests/periodical-mix.test.ts tests/mix-basic-information.test.ts --maxWorkers=2
```

Před předáním změn proveď také celé testy a build podle [lokálního vývoje](../../docs/development/local-development.md). Normativní obsah nepřepisuj jako vedlejší efekt analýzy a bez zadání nepublikuj.
