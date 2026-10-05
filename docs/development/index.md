# Vývoj registru pravidel

Registr propojuje požadavky národních standardů s původními specifikacemi, interpretacemi a doloženým chováním nástrojů. Tato sekce popisuje jeho současné pokrytí, datový model, API a postupy pro přispěvatele a vývojáře.

[Otevřít registr – domovskou mapu](https://standardy.digitalizaty.cz/registry/){ .md-button }
[Swagger / API](https://standardy.digitalizaty.cz/api-docs/){ .md-button }

## Současný stav

K 5. 10. 2026 registr obsahuje **45 pravidel pro DMF Monografie 2.3**: 13 pro technická metadata MIX pro MC a PS, 18 pro obsah info.xml a 14 pro soubory a jejich vazby v hlavním METS. Nejde o úplné pokrytí monografií ani o hotový validační engine.

| Skupina | Počet pravidel | Obsah a podklady |
|---|---:|---|
| ICC | 3 | Jméno, verze a URI profilu; [rozbor sporného významu verze a mapování nástrojů](icc-profile-version.md) |
| Rozměry obrazu | 2 | Šířka a výška v pixelech |
| Vzorkování | 4 | Referenční rovina, jednotka a frekvence X/Y |
| Barevné kódování | 4 | Barevný prostor, počet bitů na vzorek, jejich jednotka a počet složek pixelu |
| info.xml | 18 | [Informace o SIP, identifikátory, seznam souborů a checksum](info-xml.md); včetně rozdílů DMF a XSD 1.1 |
| METS – soubory a vazby | 14 | [fileSec, skupiny, atributy souborů, FLocat a fyzické odkazy FILEID](mets-files.md); oddělení DMF 2.3 od METS 1.9.1 |

Deset pravidel rozměrů, vzorkování a barevného kódování je popsáno v [rozboru obrazových metadat MIX](mix-image-characteristics.md), včetně stránek DMF, XSD typů, podmínek a mezí ověření. Frekvence X/Y mají MA s konkrétní podmínkou fyzikální jednotky `in.` nebo `cm`. Nová skupina METS zachycuje slovní požadavky bez domýšlení původního kódu povinnosti.

Ověřený přepis požadavku není potvrzením správnosti souboru ani všech implementací. U ICC jsou doloženy konkrétní verze a cesty nástrojů; u nové obrazové skupiny jejich chování zatím ověřeno nebylo. Demo standard `ndk-base` již není součástí datasetu.

## Orientace v dokumentaci

- [Architektura](architecture.md) — Git/YAML, compiler, Cloudflare D1, Worker a společný web MkDocs/React/Swagger.
- [Datový model](registry-data-model.md) — identity, verze, povinnosti M/MA/R/RA/O, podmínky, zdroje a vztahy.
- [Kategorie a graf vztahů](graph-and-categories.md) — oblasti metadat, standardy, skrývání vazeb a tabulkový pohled.
- [XML ukázky ze vzorového SIP](xml-examples.md) — kopírovatelný kód, původ výřezů a opakovatelné ověření.
- [Lokální vývoj a nasazení](local-development.md) — instalace, sestavení, testy, import dat a publikování.
- [Případ ICC profile version](icc-profile-version.md) — oddělení požadavku, sporné sémantiky a implementací.
- [Rozměry, vzorkování a barva v MIX](mix-image-characteristics.md) — metodika přepisu nové skupiny.
- [Informace o balíčku info.xml](info-xml.md) — povinnosti M/MA/R/O, vazby na soubory a rozpory DMF/XSD.
- [Soubory a jejich vazby v METS](mets-files.md) — hlavní METS, inventář souborů a fyzická mapa.

## Rozhraní registru a API

Web nabízí hledání bez diakritiky, kombinovatelné filtry, sdílené odkazy, detail konkrétní verze pravidla a interaktivní graf vztahů. Tlačítko **Navrhnout změnu** otevře předvyplněný návrh GitHub issue; samo nic neodesílá.

Pravidla lze filtrovat podle oblasti metadat i metadatového standardu (METS, MODS, Dublin Core, PREMIS, MIX, AES57, ALTO, copyrightMD, documentMD a info.xml). Nabídka rozlišuje dosud prázdné oblasti. Graf začíná přímými vazbami, umožňuje skrývat typy vztahů a kategorie uzlů a přepnout do tabulky.

[Veřejné API](https://standardy.digitalizaty.cz/api-docs/) je pouze pro čtení, bez přihlášení. [OpenAPI kontrakt](https://standardy.digitalizaty.cz/openapi.json) popisuje dostupné operace, filtry a datové typy. Swagger je součástí stejného nasazení jako dokumentace a registr.

```bash
curl 'https://standardy.digitalizaty.cz/api/v1/rules?category=technical%2Fsampling'
curl 'https://standardy.digitalizaty.cz/api/v1/rules?obligation_code=MA'
curl 'https://standardy.digitalizaty.cz/api/v1/meta'
```

„Počet pravidel“ znamená počet unikátních ID. Počet verzovaných záznamů se může lišit; právě ten počítá `pagination.total` v API. Verze NDK, verze kontraktu API, `schema_version` a identita datasetu `git-<SHA>` jsou různé údaje. Úroveň povinnosti není závažnost validačního hlášení.

## Jak přidat nebo opravit pravidlo

1. Určete standard, jeho verzi, rozsah platnosti a přesný lokátor původního zdroje.
2. Zapište pravidlo do YAML v `registry/`; oddělte požadavek od výkladu, rozporů a implementací.
3. Zachovejte původní kód povinnosti a zdokumentujte podmínky. Ověření nástroje nepřenášejte na jinou verzi nebo jiné pravidlo.
4. Doplňte vazby na zdrojové entity a testy důležitých podmínek.
5. Spusťte validaci, typovou kontrolu, testy a celé sestavení podle [návodu](local-development.md).
6. Navrhněte změnu v [repozitáři](https://github.com/bezverec/standardy). D1 a JSON exporty jsou odvozené; neopravujte je místo zdrojového YAML.
