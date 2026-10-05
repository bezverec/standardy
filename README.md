# Standardy digitalizace

Repo obsahuje dvě propojené vrstvy:

1. **Human-readable dokumentaci** – návrhy a interpretace standardů, doporučení a norem v oblasti digitalizace kulturního dědictví, publikované pomocí MkDocs.
2. **Machine-readable Standards Registry** – verzovaná YAML data, veřejné JSON exporty, read-only REST API a React Registry Explorer.

Autoritativním zdrojem strukturovaných dat je vždy Git/YAML v adresáři [`registry/`](registry/). Cloudflare D1 je pouze odvozený index a lze jej kompletně obnovit z repozitáře.

## Kde je najít

[**standardy.digitalizaty.cz**](https://standardy.digitalizaty.cz)

Interaktivní registr je dostupný na [`/registry/`](https://standardy.digitalizaty.cz/registry/) a API na `/api/v1/`. [Swagger UI](https://standardy.digitalizaty.cz/api-docs/) umožňuje prohlédnout datové typy a vyzkoušet veřejné GET operace. Kontrakt [OpenAPI 3.1](https://standardy.digitalizaty.cz/openapi.json) se sestavuje spolu s webem a validuje při buildu; datové definice přebírá z JSON schémat registru. Swagger je hostován lokálně bez závislosti na CDN nebo externím validátoru.

První odborně ověřená skupina propojuje trojici `iccProfileName`, `iccProfileVersion` a `iccProfileURI` v MIX s požadavky DMF Monografie 2.3. U verze rozlišuje číselnou verzi v hlavičce ICC od sporného významu MIX a dokumentuje mapování v konkrétních verzích nástrojů; podrobnosti a meze ověření jsou v [rozboru ICC](docs/development/icc-profile-version.md).

„Počet pravidel“ počítá unikátní ID. Jedno pravidlo může mít více verzovaných záznamů pro různé verze NDK, proto se jejich počet uvádí zvlášť. `pagination.total` v API počítá verzované záznamy. Verze kontraktu API, verze standardu NDK a identita datasetu (`/api/v1/meta`) nejsou tyto počty.

Pravidla lze hledat bez diakritiky a filtrovat podle národního i zdrojového standardu, verze, typu dokumentu, kategorie, závažnosti a stavu ověření. Dotaz a filtry jsou součástí URL. Klikací graf propojuje pravidla, prvky standardů a jejich zdroje; detail zdrojového standardu nabízí související pravidla. NISO Z39.87 je evidován jako samostatný zdroj, jeho nově doplněné položky zatím zůstávají neověřené.

## Vývoj

```bash
npm install
npm run registry:validate
npm run build
npm run registry:reset
npm run dev
```

Podrobnosti jsou v [architektuře](docs/development/architecture.md), [datovém modelu](docs/development/registry-data-model.md) a [návodu pro lokální vývoj](docs/development/local-development.md).

## Kde hlásit chyby a návrhy

Zde v repozitáři do [Issues](https://github.com/bezverec/standardy/issues). Tlačítko „Navrhnout změnu“ v registru otevře nový návrh; u detailu předvyplní ID pravidla, vybranou verzi NDK a odkaz. Uživatel musí návrh sám odeslat (je potřeba účet GitHub).

## Upozornění

Jedná se o osobní *passion project*, informace zde uvedené budou obsahovat nedostatky (někdy i zásadní), nejsou jako celek žádným způsobem adoptované ani schválené paměťovými institucemi.

Totéž platí pro registr. Stav `verification.status` je třeba číst u každého záznamu zvlášť: ověřený přepis může současně evidovat rozpor ve zdroji, zatímco neověřené údaje o implementacích nejsou prezentovány jako potvrzená fakta.

## Licence

<a href="https://github.com/bezverec/standardy">Standardy digitalizace</a> © 2026 by <a href="https://github.com/bezverec">Jan Houserek</a> is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">
