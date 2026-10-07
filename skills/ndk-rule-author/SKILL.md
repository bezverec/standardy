---
name: ndk-rule-author
description: Přidává nebo odborně opravuje verzovaná pravidla v registru bezverec/standardy podle primárních DMF a zdrojových standardů. Použij pro převod požadavků do YAML, nikoli pro samotné úpravy UI či validaci celého SIP.
---

# Zpracování pravidel NDK

Pracuj v checkoutu `bezverec/standardy`. Cesty příkazů jsou relativní ke kořeni repozitáře; odkazy níže k tomuto souboru. Nejprve přečti [datový model](../../docs/development/registry-data-model.md) a [schéma pravidla](../../schemas/rule.schema.json). Jako tvarový vzor vyber existující pravidlo podobné úrovně, ne jako důkaz nového požadavku.

## Z pramene do návrhu

1. Urči DMF a verzi, druh a úroveň dokumentu, roli souboru/záznamu a rozsah požadované sady. Při libovolném výběru navrhni souvislou dosud nepopsanou skupinu; ověř duplicity v YAML, nejen ve veřejném indexu.
2. Otevři původní DMF v požadované verzi a příslušné XSD/specifikace. V PDF tabulkách ověř i vizuálně přiřazení kódu, pokračování na další stránce a hlavičku MC/PS. Zapiš dokument, verzi, stránku/oddíl, URL a co bylo ověřeno. Nedostupný pramen znamená omezení důkazu, ne svolení domyslet obsah.
3. Odděl obecný standard, národní požadavek, redakční výklad, implementaci konkrétní verze nástroje a pozorování vzoru. Issue může doložit spor, ne samo změnit vydaný DMF. `verified` označuje ověřený přepis, ne bezchybnost standardu ani SIP.
4. Udrž stabilní ID; změna DMF patří do vlastní verze. Opravu přepisu stejného vydání vysvětli v diffu. Cílovou entitu a relaci ověř samostatně; odlišnost není automaticky `conflicts_with` či `forbidden`.
5. Zachovej M/MA/R/RA/O citované verze. Slovní požadavek bez tabulkového kódu použije `obligation_source: prose`, nikoli vymyšlené M. Plánované zjednodušení kódů nepřenášej zpět do starších DMF.
6. Kardinalitu vztahuj k přesně určenému rodiči. M uvnitř doporučeného kontejneru není automaticky MA ani požadavek založit kontejner. Příklady nejsou číselníky; číslo v ukázce nemusí určovat datový typ.
7. Posuď `cataloguing_scope` z pramene: technická nezávislost není totéž jako společný bibliografický předpis AACR2/RDA. Neurčený rozsah neoznačuj jako obě varianty. Pokud přidáváš párování nebo skutečné XML výřezy, použij příslušný skill z [rozcestníku](../../AGENTS.md).

## Kontrola a předání

Uprav zdrojové YAML, související entity, dokumentaci sady a testy významových hranic. Netvoř testy pouze potvrzující opsaný počet: zahrň rozsah, rodičovský kontext, podmíněnou povinnost a odlišení příkladu od požadavku. Spusť z kořene:

```sh
npm run registry:validate
npm run typecheck
npm test -- --maxWorkers=2
npm run build
git diff --check
```

Pokračuj jen po vyhodnocení chyb; při chybě prostředí uveď, co zůstalo neověřeno. Build zapisuje lokální odvozené artefakty, nenasazuje. Počet pravidel a ukázek odvoď z aktuálních dat, nekopíruj jej ze starého rozboru. Předání obsahuje rozsah sady, prameny, důležité výjimky, výsledky kontrol a zbývající nejistoty. Odborné schválení, commit/push a publikace nejsou automatickým důsledkem přidání pravidel.
