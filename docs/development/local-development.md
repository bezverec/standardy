# Lokální vývoj registru

## Požadavky

- Node.js 22 nebo novější,
- Python 3.12 nebo novější,
- balíčky z `requirements.txt`.

## Bootstrap

```bash
python -m pip install -r requirements.txt
npm ci
npm run registry:validate
npm run typecheck
npm test
npm run build
npm run registry:reset
```

`registry:reset` aplikuje migrace na lokální emulaci D1 a nahradí všechny odvozené řádky sestaveným datasetem. YAML soubory nikdy negeneruje z databáze. Po změně YAML nejprve spusťte `npm run build` a potom import/reset: pokud `dist/registry/import.sql` již existuje, importní skript jej sám znovu nesestavuje.

## Vývojové servery

```bash
npm run dev
```

Registry Explorer běží na `http://localhost:5173/registry/`, Worker API na `http://localhost:8787/api/v1/`. Vite proxy přeposílá `/api` Workeru.

Jednotlivé části lze spustit pomocí `npm run dev:web`, `npm run dev:worker` a `python -m mkdocs serve`.

Po úplném sestavení zpřístupní `npm run dev:worker` také dokumentaci na `http://localhost:8787/development/`, sestavený registr na `http://localhost:8787/registry/rules` a Swagger na `http://localhost:8787/api-docs/`. Samotný `mkdocs serve` neposkytuje Worker API ani D1.

`npm run build` postupně validuje YAML, sestaví MkDocs, exporty registru, React/Vite a Swagger/OpenAPI. Samostatný `npm run build:docs` čistí adresář `site/`; před nasazením proto vždy použijte celé sestavení, jinak by v artefaktu mohly chybět ostatní části aplikace.

## CLI

| Příkaz | Význam |
|---|---|
| `npm run registry:validate` | YAML parse, JSON Schema a sémantické reference |
| `npm run registry:check-relations` | pouze referenční a vztahové kontroly |
| `npm run registry:build` | normalizovaný JSON, veřejné exporty a `import.sql` |
| `npm run registry:import` | migrace + import do lokální D1 |
| `npm run registry:reset` | úplné nahrazení odvozeného datasetu v lokální D1 |
| `npm run registry:import -- --remote` | import do nakonfigurované vzdálené D1 |
| `npm test` | testy modelu, compileru, API, OpenAPI a konkrétních pravidel |
| `npm run typecheck` | TypeScript kontrola |
| `npm run build` | celé sestavení včetně přísné kontroly MkDocs a OpenAPI |
| `npm run deploy` | celé sestavení a publikování Workeru/assetů; neprovádí import D1 |

## Cloudflare konfigurace

Repozitář již obsahuje produkční binding databáze i doménu v `wrangler.jsonc`. Lokální příkazy bez `--remote` pracují s emulací; `--remote` míří na nakonfigurovanou skutečnou databázi. Pro vlastní prostředí použijte samostatnou konfiguraci s vlastní D1, Workerem a doménou.

Tokeny `CLOUDFLARE_API_TOKEN` a `CLOUDFLARE_ACCOUNT_ID` nastavujte pouze v prostředí nebo GitHub Secrets. Alternativou pro ruční práci je přihlášení `npx wrangler login`. Importní wrapper používá vlastní `XDG_CONFIG_HOME` v `.wrangler/config`, a proto nemusí vidět OAuth přihlášení běžného Wrangleru. Pro tento případ použijte přímé příkazy níže; nekopírujte přihlašovací soubory do repozitáře.

Produkční API je read-only. Token pro import není dostupný Workeru ani prohlížeči.

Soukromý editor má samostatný binding `EDITOR_DB` a migrace `migrations-editor/`. Veřejný import/reset musí vždy cílit jen na `DB`; nikdy na koncepty. Produkční redakční databáze je `standardy-editor` (jurisdikce EU). Přístup řídí příznak `EDITOR_ENABLED`, přesný `EDITOR_ORIGIN`, serverový Clerk secret a explicitní členství. Při přípravě CI konfigurace se odmítne stejné ID veřejné a soukromé databáze. Postup lokální zkoušky a omezení uvádí [MVP editoru](editor-mvp.md).

## Nasazení {#nasazeni}

### Ruční publikování

Nejprve zkontrolujte cílovou konfiguraci a dokončete commit, který chcete publikovat. Build z něj odvozuje identitu datasetu; po commitu sestavte artefakty znovu. Před importem si zaznamenejte obnovovací bod D1:

```bash
npm run typecheck
npm test
npm run build
npx wrangler d1 time-travel info DB --json
npx wrangler d1 migrations apply EDITOR_DB --remote
npx wrangler d1 migrations apply DB --remote
npx wrangler d1 execute DB --remote --file dist/registry/import.sql
npx wrangler deploy
```

Pokračujte vždy jen po úspěšném dokončení předchozího kroku. Import kompletně nahrazuje odvozená data, neprovádějte jej proti jiné databázi. Nasazujte data i statické exporty ze stejného sestavení. Zkontrolujte `/development/`, `/registry/rules`, `/api-docs/` a shodu `dataset_version` v `/api/v1/meta` s `/data/meta.json`.

### GitHub Actions

- `registry-ci.yml` kontroluje typy, testy a celé sestavení.
- `deploy-cloudflare.yml` se spouští po push do `main` nebo ručně; deployment job je podmíněn variable `CLOUDFLARE_D1_DATABASE_ID`. Potřebuje také secrets `CLOUDFLARE_API_TOKEN` a `CLOUDFLARE_ACCOUNT_ID` v odpovídajícím prostředí. Provede migrace, import D1 i nasazení assetů.
- `pages.yml` publikuje pouze dokumentaci MkDocs na GitHub Pages. Jeho úspěch není potvrzením nasazení celé aplikace na Cloudflare.

Bez konfigurace Cloudflare workflow samotný push produkci neaktualizuje. Úspěšný build ani CI samy nepotvrzují, že je změna veřejně nasazená.
