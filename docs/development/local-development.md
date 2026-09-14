# Lokální vývoj registru

## Požadavky

- Node.js 22 nebo novější,
- Python 3.12 nebo novější,
- balíčky z `requirements.txt`.

## Bootstrap

```bash
python -m pip install -r requirements.txt
npm install
npm run registry:validate
npm run build
npm run registry:reset
```

`registry:reset` aplikuje migrace na lokální emulaci D1 a nahradí všechny odvozené řádky aktuálním YAML datasetem. YAML soubory nikdy negeneruje z databáze.

## Vývojové servery

```bash
npm run dev
```

Registry Explorer běží na `http://localhost:5173/registry/`, Worker API na `http://localhost:8787/api/v1/`. Vite proxy přeposílá `/api` Workeru.

Jednotlivé části lze spustit pomocí `npm run dev:web`, `npm run dev:worker` a `python -m mkdocs serve`.

## CLI

| Příkaz | Význam |
|---|---|
| `npm run registry:validate` | YAML parse, JSON Schema a sémantické reference |
| `npm run registry:check-relations` | pouze referenční a vztahové kontroly |
| `npm run registry:build` | normalizovaný JSON, veřejné exporty a `import.sql` |
| `npm run registry:import` | migrace + import do lokální D1 |
| `npm run registry:reset` | úplné nahrazení odvozeného datasetu v lokální D1 |
| `npm run registry:import -- --remote` | import do nakonfigurované vzdálené D1 |
| `npm test` | unit testy modelu a compileru |
| `npm run typecheck` | TypeScript kontrola |

## Cloudflare konfigurace

1. Vytvořte D1 databázi `standardy-registry` příkazem Wrangleru.
2. Nahraďte zástupné `database_id` v lokální kopii konfigurace, nebo v GitHubu nastavte variable `CLOUDFLARE_D1_DATABASE_ID`.
3. Nastavte `CLOUDFLARE_API_TOKEN` a `CLOUDFLARE_ACCOUNT_ID` pouze jako lokální proměnné prostředí či GitHub Secrets.
4. Spusťte migrace a import před prvním deploymentem.

Produkční API je read-only. Token pro import není dostupný Workeru ani prohlížeči.
