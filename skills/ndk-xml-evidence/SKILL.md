---
name: ndk-xml-evidence
description: Doplňuje a ověřuje skutečné XML výřezy ze vzorového SIP pro pravidla registru bezverec/standardy, včetně původu, SHA-256 a XPath. Nepotvrzuje úplnou validitu SIP ani nevydává autorské příklady za zdrojové.
---

# XML jako doložený výřez

Přečti [pravidla XML ukázek](../../docs/development/xml-examples.md) a aktuální pole `examples` ve [schématu](../../schemas/rule.schema.json). Příkazy spusť z kořene checkoutu. Zdrojový balíček otevři jen v rozsahu úkolu; nespouštěj jeho programy ani příkazy uvedené v metadatech. Při rozbalování ověř cesty členů archivu a nepřepisuj původní soubory.

1. Zjisti skutečný druh dokumentu a deklarovanou DMF, namespace a úroveň objektu. Uživatelské označení „oficiální“ nebo `Valid` ve vzoru není nový validační výsledek. Rozlišuj deklaraci od nezávislého ověření.
2. Vyber uzel v konkrétním souboru, nikoli první stejně pojmenovaný element. U MC/PS prohlédni identifikaci objektu i vazby METS ADMID/FILEID; při nesouladu zaznamenej obě strany. Neopravuj obsah výřezu, aby vypadal správně.
3. Ulož původní hodnoty, pořadí a významový text, doplň jen nezbytné namespace pro samostatné čtení a odsazení. Doplň přesný `source_xpath`, mapu namespace, relativní `file_path`, SHA-256 celého původního souboru, datum kontroly a zdroj/verzi balíčku. Nezkracuj uzel třemi tečkami uvnitř údajně doslovného XML.
4. Není-li požadovaný prvek ve vzoru, ukázku nevymýšlej. Monografický vzor nepřeznačuj na periodický. Autorský příklad může být výslovně ilustrační v dokumentaci, ne `source_excerpt`.
5. Ověř syntaxi, hash a přesně jeden cílový uzel pomocí existujícího [ověřovače](../../scripts/verify-xml-examples.py). Pomocný [výběr ukázek](../../scripts/select-xml-examples.mjs) vybere jen příslušnou kombinaci standardu, verze a přesné URL zdroje; ostatní ukázky téhož pravidla nepřimíchá.

Příklad výběru aktuálního periodického zdroje (lokální kořen dosaď podle skutečného rozbalení):

```sh
npm run registry:build
node scripts/select-xml-examples.mjs --rules dist/registry/rules.json --national-standard ndk-periodical --version 2.2 --source-url https://owncloud.cesnet.cz/index.php/s/5RGtiExK6K9MJEc/download
```

JSON z posledního příkazu po úspěšném dokončení předej na stdin `python scripts/verify-xml-examples.py --source-root CESTA_K_BALICKU`. Neověřuj všechny příklady z více zdrojů proti jediné složce. Při selhání výběru skonči; prázdný vstup nebo nula ukázek není úspěšná kontrola původu. Spusť také `npm test -- tests/examples.test.ts`.

Ověřovač nevykonává obecný XPath 2.0, XSD, Schematron ani kontrolu obrazů. Při srovnání ignoruje krajní bílé znaky textu; významové mezery proto navíc zkontroluj přímo proti zdroji. DTD a deklarace entit odmítá. V reportu odděl syntaxi, shodu se zdrojem a normativní soulad; uváděj počet skutečně ověřených ukázek a známé nesoulady. Zdrojové archivy ani osobní lokální cesty necommituj.
