# Neveřejný editor — MVP

Implementace k 7. 10. 2026 na `/editor/`: samostatná Clerk aplikace Standardy v režimu **Invite-only**, explicitní členství a soukromé koncepty. Produkční D1 `standardy-editor` je v jurisdikci EU a má vlastní redakční migrace. Produkční DNS, SSL, e-mail a Google OAuth byly ověřeny pomocí Clerk CLI. Vývojové a produkční identity se nepřenášejí. Další etapy popisuje [redakční postup](editorial-workflow.md).

## Co funguje v implementaci

- Samostatný frontend `/editor/`, přihlášení přes `@clerk/react` a serverové ověření session přes `@clerk/backend`. Veřejný frontend Clerk nenačítá.
- Členství podle stabilního Clerk `user_id`; pouhé přihlášení nestačí. Editor vidí vlastní koncepty, recenzent a správce mohou číst všechny. Všichni upravují jen vlastní koncepty. Správa členů a schvalování zatím nemají API ani UI.
- Výběr publikovaného pravidla, základní formulář požadavku, výkladu a pramene, výběr verze a pokročilý JSON celého dokumentu. Editor a správce mohou také založit úplně nové pravidlo z prázdného formuláře: ID, národní standard/verze, cílový prvek, kategorie, povinnost a přítomnost. Nový návrh začíná jako `draft` / `unverified`, bez převzatých pramenů, příkladů nebo ověření. Neúplný formulář nelze uložit.
- Recenzent může nadále navrhovat změny existujících pravidel, ale nesmí vytvářet ani upravovat koncepty úplně nových pravidel. Oprávnění vynucuje server i při přímém API požadavku nebo změně ID v JSON; klientská schopnost `create_rules` slouží jen pro UI. Po změně role se oprávnění znovu kontroluje při zápisu.
- Stejné JSON Schema a sémantické kontroly jako CLI. Pro Workers se schema předkompiluje při buildu; validátor nepoužívá runtime `eval`.
- Strukturovaný diff proti publikovanému základu, ruční uložení do soukromé D1, hash obsahu a historie všech uložených revizí. SQLite triggery ukládají historii ve stejné transakci jako změnu.
- Optimistický zámek: změna očekávané revize nebo Git SHA výchozího datasetu vrací 409, nikoli přepsání.

Uložení vyžaduje validní celý dokument. Neúplný formulář a neaplikovaný JSON jsou pouze v paměti prohlížeče; nejde o autosave. Validace nepotvrzuje odbornou správnost, shodu XML/SIP ani pravdivost převzatého `verification.status`. Koncept není publikované pravidlo.

## Lokální spuštění

Použijte samostatnou vývojovou Clerk aplikaci Standardy. [Hobby plán](https://clerk.com/pricing) umožňuje podle ceníku ověřeného 7. 10. 2026 více aplikací. Není potřeba přebírat účty DigiWorkflow ani zapínat placené organizační role. Integrace vychází z [React quickstartu](https://clerk.com/docs/react/getting-started/quickstart) a [serverového ověřování](https://clerk.com/docs/reference/backend/authenticate-request).

Vývojová aplikace je nastavená na **Invite-only** (`auth_access_control.sign_up_mode = restricted`). [Režim pouze na pozvání](https://clerk.com/docs/guides/secure/restricting-access) je podle aktuálního ceníku součástí Hobby. Pozvání do Clerk stále nepřiděluje roli v D1. Prvního správce určí vlastník projektu; po přijetí pozvánky je nutné ověřit jeho adresu a stabilní Clerk user ID, a teprve tomuto ID přidělit `admin`. Neukládejte osobní email správce jako veřejné pravidlo automatického přidělování oprávnění. Vývojové a produkční účty/ID jsou oddělené.

1. Nainstalujte závislosti (`npm ci`) a spusťte `npm run build`.
2. Do gitignorovaného souboru `.dev.vars` vložte vývojové `CLERK_PUBLISHABLE_KEY` a `CLERK_SECRET_KEY` ze stejné aplikace. Klíče neposílejte do chatu, nevkládejte do YAML ani commitu; secret key nikdy nedávejte do `VITE_*`. Secret key používá jen Worker. Veřejný publishable key vrací konfigurační endpoint. Při použití `clerk env pull --app <APP_ID> --instance dev --file .dev.vars` může CLI zapsat veřejný klíč jako `VITE_CLERK_PUBLISHABLE_KEY`: Worker potřebuje také název `CLERK_PUBLISHABLE_KEY`. Po změně `.dev.vars` restartujte Wrangler.
3. Připravte dvě **lokální** databáze příkazy níže. Ukázková konfigurace používá záměrně neexistující cloudová ID a neobsahuje produkční doménu. Nenasazujte ji a nepoužívejte s ní `--remote`.

```powershell
npx wrangler d1 migrations apply DB --local --config wrangler.editor.example.jsonc --persist-to .wrangler/editor-state
npx wrangler d1 execute DB --local --config wrangler.editor.example.jsonc --persist-to .wrangler/editor-state --file dist/registry/import.sql
npx wrangler d1 migrations apply EDITOR_DB --local --config wrangler.editor.example.jsonc --persist-to .wrangler/editor-state
npx wrangler dev --config wrangler.editor.example.jsonc --persist-to .wrangler/editor-state --ip 127.0.0.1 --port 8788
```

Otevřete `http://127.0.0.1:8788/editor/`. Nemíchejte `localhost` a `127.0.0.1`: `EDITOR_ORIGIN` se kontroluje přesně. Konfiguraci jiného portu/originu lze připravit v gitignorovaném `wrangler.editor.local.jsonc`. Přihlaste se vývojovým účtem; bez explicitního členství se zobrazí zamítnutý přístup. Oprávněný správce po ověření konkrétního Clerk user ID přidá **jen zamýšleného operátora**, například lokálně:

```powershell
# Nahraďte user_REPLACE skutečným schváleným vývojovým Clerk user ID.
npx wrangler d1 execute EDITOR_DB --local --config wrangler.editor.example.jsonc --persist-to .wrangler/editor-state --command "INSERT INTO editor_members (user_id, role, active) VALUES ('user_REPLACE', 'editor', 1)"
```

Členství lze odebrat nastavením `active = 0`; další API požadavek je odmítnut. Nedávejte automaticky přístup podle emailové domény nebo první registrace. Role `admin` nyní není publikační oprávnění.

Editor používá vlastní lokální `--persist-to`, aby nesdílel interní SQLite úložiště simulátoru s jiným běžícím Wranglerem. Při opakovaném buildu/restartu na Windows může workerd narazit na `SQLITE_BUSY`; zastavte příslušný vývojový server a restartujte jej po dokončení buildu. Databázi nemažte.

## API a bezpečnostní hranice

Všechny cesty mají prefix `/api/editor`. Kromě `/config` vyžadují session token a aktivní členství. Tato pracovní API nejsou součástí stabilního veřejného OpenAPI `/api/v1`.

| Metoda a cesta | Výsledek |
| --- | --- |
| `GET /config` | Jen publishable key; bez úplné konfigurace 503 |
| `GET /session` | ID, role a `capabilities.create_rules` přihlášeného člena |
| `GET /catalog`, `GET /rules/:id` | Výchozí publikovaná data a Git SHA; katalog také obsahuje národní standardy/verze a cílové prvky |
| `GET /drafts` | Nejvýše 100 posledních dostupných konceptů |
| `GET /drafts/:id` | Dostupný koncept, základ a diff |
| `POST /validate` | Kontrola `{document, base_commit}` bez uložení |
| `POST /drafts` | Uložení `{document, base_commit}` jako soukromé revize 1 |
| `PUT /drafts/:id` | Uložení `{document, base_commit, revision}` jen vlastníkem |

Identita vlastníka, základ, hash a nová revize se určují na serveru. Chybějící session vrací 401, chybějící členství 403, cizí koncept běžnému editorovi 404, nevalidní dokument 422. Selhání Clerk/databáze vrací obecnou 503 bez interních údajů.

Při zakládání nového pravidla UI posílá na `/validate` a první `POST /drafts` také `new_rule: true`; kolize s publikovaným ID vrací 409 `rule_id_exists`, nikoli tichý přechod na úpravu existujícího pravidla. Role se vždy kontroluje podle skutečného publikovaného základu, i bez tohoto příznaku. Chybějící oprávnění vrací 403 `create_rule_forbidden`. Soukromé koncepty stejného ID mohou mít více návrhů; tento MVP jim ještě nerezervuje veřejné ID. Po prvním uložení je ID konceptu neměnné.

Soukromé odpovědi mají `private, no-store`, bez otevřeného CORS. Zápisy vyžadují přesný Origin a JSON, limit 256 KiB a maximální hloubku 30. Ověřené členské požadavky mají limit 120 za minutu a uživatele. Statický přihlašovací shell není tajný, ale neobsahuje koncepty; má `noindex` a necachuje se. JSON/XML se vykreslují jako text, ne jako HTML.

`EDITOR_DB` musí být skutečně jiná databáze než veřejná `DB`, s vlastními migracemi, retencí a zálohami. Nikdy na ni nemiřte veřejný import/reset. Runtime odmítá i totožný objekt bindingu, ale to nenahrazuje kontrolu rozdílných cloudových database ID při budoucím nasazení. Veřejný export nečte redakční databázi.

## Ověření a zbývající práce

`npm test` zahrnuje kontrolu izolace, odebrání členství, původu požadavků, revizních konfliktů, limitů, atomické historie, validity, escapování a zachování read-only veřejného API. Backendové testy mockují Clerk ověření a používají skutečné SQLite tabulky a triggery; **nenahrazují skutečné E2E přihlášení přes Clerk**. `npm run typecheck`, `npm run build` a `npx wrangler deploy --dry-run` ověřují sestavení, nikoli nasazení.

Každé nasazení musí ověřit login/logout, oprávnění, shodu datasetu v D1 a exportech a izolaci konceptů. Před rozšířením pilotního provozu je potřeba dohodnout dlouhodobou retenci, pravidelné zálohy soukromé databáze a jejich obnovovací zkoušku; veřejný YAML není záloha konceptů. Chybí UI historie, stránkování nad 100 konceptů, rebase při změně datasetu, autosave neúplné práce, dávkové úpravy, odborné schvalování, PR a publikace. Změna veřejného základu a soukromý zápis nejsou transakcí přes dvě D1: návrh eviduje načtené SHA a budoucí publikace musí základ znovu ověřit.

## Produkční provoz

`wrangler.jsonc` obsahuje veřejný publishable key, přesný origin a oba rozdílné D1 bindingy. Tajný `CLERK_SECRET_KEY` patří pouze do Cloudflare Worker secrets. Nikdy nenasazujte vývojové klíče nebo lokální vzorovou konfiguraci. `EDITOR_ENABLED=false` zavře celé soukromé API bez smazání konceptů; po změně konfigurace je nutný deployment. Odebrání jednotlivého členství se provede v `EDITOR_DB` přes `active=0` a platí pro další požadavek bez nového deploymentu. Již stažená data z prohlížeče zpětně odebrat nelze.

Před změnou soukromého schématu zaznamenejte `npx wrangler d1 time-travel info EDITOR_DB --json`. D1 Time Travel je krátkodobá možnost obnovy v rámci limitů aktuálního tarifu, nikoli náhrada dlouhodobé zálohovací politiky. Migrace konceptů a import veřejného datasetu jsou oddělené kroky. Přihlašovací nastavení spravujte v produkční instanci aplikace Standardy; členy zapisujte podle skutečně ověřených produkčních user ID, nikdy podle klientem zaslané role.
