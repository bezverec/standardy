# Rozsah AACR2/RDA v registru

Posouzeno 7. 10. 2026: všech 258 evidovaných pravidel: 240 pro DMF Monografie 2.3 a 18 pro DMF Periodika 2.2.
Jde o audit relevance katalogizace, nikoli nové ověření každé technické kontroly,
implementací validátorů nebo úplnosti DMF v registru.

## Podklad a metoda

Rozhodující je [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf),
zejména legenda barev na s. 24 a vizuálně ověřené tabulky jednosvazku na s. 48–54.
Legenda vyhrazuje červené definice pro RDA; nerozlišené předpisy jsou společné
pro AACR2 a RDA. Barvy pro druhy předloh nejsou katalogizační režimy.

Posuzujeme konkrétní požadavek, jeho podmínky a citovaný oddíl. Samotný namespace
není kritériem. [MODS může používat různá katalogizační pravidla](https://www.loc.gov/standards/mods/userguide/introduction.html).
[Metodika NK ČR](https://prirucky.ipk.nkp.cz/katalogizace/monografie/zakladni_standardy)
odděluje katalogizační pravidla, formát a národní interpretace. Tato revize
neaplikuje novější Official RDA zpětně na historické požadavky DMF 2.3.

U periodik je podkladem [DMF Periodika 2.2](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_periodika_2.2_final.pdf), § 7.5.4, s. 69–70, 74–75. Osmnáct požadavků se týká technických vlastností souborů MC/PS, nikoli katalogizace titulu, ročníku či čísla. Jejich nezávislost se nepřenáší na dosud nezpracovaná bibliografická pravidla periodik.

## Výsledek

| Rozsah | Počet | Důvod |
|---|---:|---|
| Nezávislé na katalogizaci | 204 | 39 MIX (21 monografických a 18 periodických), 18 info.xml, 85 METS, 61 PREMIS a strukturální genre v MODS |
| Společný předpis AACR2/RDA | 49 | Bibliografická pravidla s doloženou společnou povinností nebo mapováním |
| Pouze AACR2 | 1 | Nepoužití eventType jako výklad vyhrazení atributu pro RDA |
| Pouze RDA | 4 | eventType, hlavní událost, nepoužití role pro 264_4 a copyrightDate bez 264_4$c |
| Neurčený rozsah | 0 | Stav zůstává dostupný pro nové nebo nedostatečně doložené záznamy |

Každá verze pravidla obsahuje vlastní `cataloguing_scope` se zdůvodněním, datem
a prameny včetně lokátoru. Nejde o runtime výchozí hodnotu podle prefixu ID.
Pravidla bez anotace se nadále považují za neposouzená.

### Důležité hranice

- **Copyright, vznik a vydávání:** [navazující sada](mods-origin-completion.md) přidává čtyři společné požadavky a samostatné RDA omezení copyrightDate. Společný copyrightový předpis zachovává odlišenou větev RDA; nejasnost opakovaného 264_0$c u dateCreated není potichu opravena. Issuance je bibliografický požadavek, ne technicky nezávislý jen proto, že používá řízený výčet.

- **ICC, rozměry, checksum:** kontrola digitálního souboru nezávisí na AACR2/RDA.
- **PREMIS Agent versus MODS name:** původce ochranné události není bibliografický
  autor; společné slovo „jméno“ z nich nedělá stejný druh pravidla.
- **METS LABEL a info/titleid:** kontrola převzetí či sestavení údaje neověřuje
  katalogizační postup, kterým vznikl zdrojový název nebo identifikátor.
- **Paginace a typ strany:** Pravidla pro popis monografií 2.4 nejsou AACR2/RDA.
- **MODS genre:** strukturální model NDK je nezávislý; bibliografický žánr má
  společný předpis. Hodnota `volume` nenahrazuje popisný žánr.
- **Názvy a jména:** společná povinnost převodu neprokazuje stejné katalogizační
  postupy pro výběr názvu, autority či původců. Zdrojový popis se nepřekatalogizuje.
- **etal:** tabulka s. 50 jej nerozlišuje jako AACR2-only. Pravidlo kontroluje
  volitelnou konstrukci, nikoli oprávnění vynechat autory. Nelze dovodit zákaz
  etal v RDA ani univerzální pokračování „pravidla tří“.
- **originInfo, agent a data:** společný předpis může mít dílčí červené větve
  mapování MARC 264 pro RDA. Rozsah `[aacr2, rda]` nedovoluje použít libovolnou
  větev pro libovolný zdroj. Přítomnost jediného pole sama neurčuje režim,
  zejména u částečně aktualizovaných záznamů.
- **264_4 bez role:** červeně vyznačená výjimka na s. 52 dostává rozsah RDA.
  Ostatní události téhož záznamu nepřicházejí o své role.

Audit nemění kódy povinností, zdrojové XML ani stav ověření přepisu. Sporné znění
`distibutor` a interpretační charakter nepoužití eventType v AACR2 zůstávají viditelné.

## Porovnávač

Nezávislé požadavky zůstávají zahrnuté při volbě kteréhokoli režimu. Doložená
společná bibliografická pravidla jsou jiný stav než nezávislost. Neurčený rozsah
se neslučuje ani s jedním z nich. Detail ukazuje zdůvodnění v rozbalovací části.

Relevance katalogizace a významové párování jsou různé osy. Audit nevytváří
automaticky stovky domnělých ekvivalencí. V příkladu AACR2 proti RDA zůstává
jedna dvojice eventType s odlišným kontextem a osmnáct shodných technických aspektů MIX;
217/220 zahrnutých pravidel nemá významový klíč, 4/1 jsou mimo zvolený režim. Neurčených rozsahů je 0/0.
Souhrn uvádí 186/186 nezávislých a 49/49 společných požadavků, nikoli tolik párů.

Testy ověřují úplnost anotací, hranice MODS/METS/PREMIS, zařazení nezávislých
pravidel s klíčem i bez něj, bezpečné zachování neznámého rozsahu, validaci
rozporů, export do D1 a kontrakt OpenAPI. Datum a text redakčního posouzení
nevytvářejí rozdíl normativního požadavku; změna relevance jej vytvářet může.
