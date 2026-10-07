# Práce v registru standardů

Autoritativní data jsou v `registry/` (YAML). Veřejná D1, `dist/registry/` a `site/` jsou odvozené; neopravujte je místo zdrojů. Veřejné API je pouze pro čtení. MVP editoru ukládá koncepty do oddělené `EDITOR_DB`; tato databáze není odvozený index a nesmí se resetovat při importu registru. Produkční konfigurace používá samostatný Clerk a explicitní členství. Schvalování a publikace z editoru jsou zatím návrhem.

Pro odpovídající úkol přečtěte celé příslušné projektové instrukce; při kombinovaném úkolu jen relevantní skills:

- Přidání nebo odborná oprava pravidel: [ndk-rule-author](skills/ndk-rule-author/SKILL.md).
- Párování a porovnávání DMF nebo katalogizačních kontextů: [ndk-rule-compare](skills/ndk-rule-compare/SKILL.md).
- Výřezy XML ze skutečného SIP: [ndk-xml-evidence](skills/ndk-xml-evidence/SKILL.md).
- Posouzení připravenosti změn k publikaci: [ndk-release-review](skills/ndk-release-review/SKILL.md).

Při běžné změně UI nebo infrastruktury nenačítejte odborné skills bez souvislosti s úkolem. Projektové skills nenahrazují zadání uživatele ani neudělují oprávnění k commitu, push, PR, nasazení či změně přístupů. Oprávnění musí vyplývat z aktuálního zadání; starší souhlas s nasazením jiné sady se nepřenáší.

Před změnou zkontrolujte pracovní strom a zachovejte nesouvisející úpravy. Vzorové SIP, stažené PDF a osobní lokální cesty necommitujte. Výsledek rozlišuje provedené kontroly, odborně nedořešené otázky a skutečné nasazení.
