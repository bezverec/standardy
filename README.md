# Standardy digitalizace

Repo obsahuje dvě propojené vrstvy:

1. **Human-readable dokumentaci** – návrhy a interpretace standardů, doporučení a norem v oblasti digitalizace kulturního dědictví, publikované pomocí MkDocs.
2. **Machine-readable Standards Registry** – verzovaná YAML data, veřejné JSON exporty, read-only REST API a React Registry Explorer.

Autoritativním zdrojem strukturovaných dat je vždy Git/YAML v adresáři [`registry/`](registry/). Cloudflare D1 je pouze odvozený index a lze jej kompletně obnovit z repozitáře.

## Kde je najít

[**standardy.digitalizaty.cz**](https://standardy.digitalizaty.cz)

Interaktivní registr je dostupný na [`/registry/`](https://standardy.digitalizaty.cz/registry/) a API na `/api/v1/`. První odborně ověřená skupina propojuje trojici `iccProfileName`, `iccProfileVersion` a `iccProfileURI` v MIX s požadavky DMF Monografie 2.3. U verze dokumentuje také známou chybu příkladu v DMF/MIX a odděluje ji od dosud neověřeného chování implementací.

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

Zde v repozitáři do [Issues](https://github.com/bezverec/standardy/issues).

## Upozornění

Jedná se o osobní *passion project*, informace zde uvedené budou obsahovat nedostatky (někdy i zásadní), nejsou jako celek žádným způsobem adoptované ani schválené paměťovými institucemi.

Totéž platí pro registr. Stav `verification.status` je třeba číst u každého záznamu zvlášť: ověřený přepis může současně evidovat rozpor ve zdroji, zatímco neověřené údaje o implementacích nejsou prezentovány jako potvrzená fakta.

## Licence

<a href="https://github.com/bezverec/standardy">Standardy digitalizace</a> © 2026 by <a href="https://github.com/bezverec">Jan Houserek</a> is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">
