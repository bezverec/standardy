# Copyright, vznik a vydávání v MODS jednosvazkové monografie

Pět pravidel `metadata/mods-origin-completion` navazuje na [data vydání](mods-origin-dates.md): doplňuje copyrightDate, dateCreated, edition a issuance. Dodatečné omezení copyrightDate pro RDA je samostatný záznam, nikoli vlastnost celého MODS nebo všech katalogizačních režimů.

## Podklady a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 53–54; legenda AACR2/RDA na s. 24.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd): originInfoDefinition, dateDefinition, edition a issuanceDefinition.
- [MARC 008](https://www.loc.gov/marc/bibliographic/bd008a.html), May 2026; [264](https://www.loc.gov/marc/bibliographic/bd264.html), July 2022; [250](https://www.loc.gov/marc/bibliographic/bd250.html), July 2022; [Leader](https://www.loc.gov/marc/bibliographic/bdleader.html), November 2016.
- [Výklad issuance v MODS](https://www.loc.gov/standards/mods/userguide/origininfo.html#issuance).

Ověřeno 7. 10. 2026, včetně vizuální kontroly barev a pokračování tabulky. Rozsah tvoří přímá originInfo v MODS svazku jednosvazkové monografie. Nezahrnuje automaticky relatedItem, subject, stránku či titul vícesvazku. Přepis DMF, obecná pravidla MODS, interpretace a neověřené chování nástrojů zůstávají oddělené.

## Nová pravidla

Prefix ID je `NDK-MONO-MODS-SINGLE-`.

| Pravidlo | Požadavek | Povinnost | Katalogizační rozsah |
|---|---|---|---|
| COPYRIGHT-DATE | Datum copyrightu, zejména 008/11–14 při 008/06=t | R | Společný, s výslovně odlišenou větví RDA |
| COPYRIGHT-DATE-RDA-SOURCE | Nepoužití bez doloženého 264_4$c | Slovní omezení, bez domyšleného kódu | Pouze RDA |
| DATE-CREATED | Vznik rukopisné předlohy, LDR/06=d/f/t | R | Společný; nejasnost zdrojového mapování evidována |
| EDITION | Textový údaj o vydání z 250$a | R | Společný |
| ISSUANCE | Způsob vydávání podle LDR/07 | M | Společný |

Společné mapování není tvrzení, že se samotný katalogizační obsah AACR2 a RDA shoduje. Všech pět pravidel má vlastní doložené posouzení `cataloguing_scope`. Sada nepřidává významové klíče pro párování, které zatím nebyly samostatně ověřeny.

## Významové hranice a nejasnosti DMF

### Copyright není datum vydání ani právní posouzení

Při 008/06=t se copyrightové datum bere z 008/11–14; první datum z 008/07–10 má jiný význam. CopyrightDate nenahrazuje dateIssued, nevyjadřuje datum digitalizace ani samo neurčuje dobu ochrany díla.

Tabulka uvádí R, ale její text při 008/06=t požaduje převzetí „vždy“. Uchováváme R s minimem 0 a konkrétní slovní požadavek v custom kontrole. Nepovyšujeme celý řádek na M. U RDA DMF navíc omezuje použití na výskyt 264_4$c. Kolize zdrojů (např. 008/06=t bez 264_4$c v RDA) není automaticky vyřešená: oba předpisy jsou evidovány, záznam vyžaduje posouzení, nikoli vymyšlení data nebo svévolné určení priority.

Samostatné RDA pravidlo pracuje s nezávisle určeným režimem a **doloženou absencí** zdrojového 264_4$c. Neznámý původní MARC není absence a samotné pole 264 neprokazuje RDA. Existence 264_4$c nečiní z doporučení povinnost M. Jde o nepoužití v kontextu DMF, ne obecný zákaz v MODS.

### DateCreated a rukopisná předloha

Kontext LDR/06=d/f/t zahrnuje rukopisnou hudebninu, kartografický dokument a text. Je jiný než bibliografická úroveň LDR/07. Datum vzniku rukopisu není datum skenování ani výroby publikovaného exempláře.

DMF s. 53 tiskne dvakrát `264_0$c`, podruhé červeně. Možný překlep výslovně evidujeme; první odkaz bez oficiální opravy nepřepisujeme na `260$c`. Ověření přepisu neznamená ověření domnělé opravy. R se nemění na MA a datum se při absenci podkladu nevymýšlí. Obecné MODS umožňuje dateCreated i mimo tuto národní větev; pravidlo toto použití obecně nezakazuje.

### Edition není číslo svazku

Edition je textové označení vydání z 250$a, nikoli nutně celé číslo. Nepřipojujeme automaticky 250$b, nevytváříme „první vydání“ při chybějícím údaji a nezaměňujeme vydání za partNumber, nakladatelskou řadu ani verzi digitálního souboru.

### Issuance: doslovný výčet versus správný význam

DMF uvádí `monographic` nebo podrobnější `multipart monograph` a `single unit`. Obecné MODS rozlišuje monografický celek, jednu jednotku a vícedílný celek; samotné LDR/07=m poslední dvě možnosti nerozliší. Pro jednosvazkový objekt odpovídá podrobná hodnota `single unit`; obecné `monographic` zůstává možné. Nevyžadujeme oba zápisy současně.

Výskyt `multipart monograph` přímo v tabulce jednosvazku je zaznamenán jako nejasnost. Výčet bez opory nezkracujeme, ale členství ve výčtu není důkaz správné sémantiky. Takový výskyt vyžaduje kontrolu popisované jednotky. Národní výčet také neobsahuje další tři hodnoty obecného XSD (`continuing`, `serial`, `integrating resource`). Povinnost M se kontroluje na úrovni záznamu, ne duplikací issuance v každém originInfo pro jinou událost.

## XML ukázka a ověření

V dodaném vzorovém SIP je doložen jeden nový výřez:

```xml
<mods:issuance xmlns:mods="http://www.loc.gov/mods/v3">single unit</mods:issuance>
```

Zdrojový soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml` má SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`. Výřez je ukotven XPath:

```text
/mets:mets/mets:dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:originInfo/mods:issuance
```

Vzor neobsahuje copyrightDate, dateCreated ani edition. Nepřidáváme k nim vymyšlené zdrojové ukázky. Původní MARC nebyl analyzován, proto výřez nepotvrzuje správnost převodu LDR/07 ani celý SIP.

Registr po této sadě obsahuje 232 pravidel, z toho 55 pro MODS, a 212 XML ukázek u 166 pravidel. Testy kontrolují povinnosti, kontexty, katalogizační rozsah, vazby, API filtry a mapu registru. **Custom kontroly registr nevykonává**; sada není implementací validátoru SIP.
