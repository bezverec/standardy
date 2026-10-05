# Pravidla pro info.xml

Skupina obsahuje 18 pravidel přepsaných z DMF Monografie 2.3, § 7.1, s. 17–18. Tabulky byly 5. 10. 2026 zkontrolovány i vizuálně a porovnány s oficiálně zveřejněným XSD info 1.1 pro tištěné dokumenty. Verze schématu **1.1 není verzí DMF** ani hodnotou, která se automaticky zapisuje do `metadataversion`.

[Otevřít skupinu v registru](https://standardy.digitalizaty.cz/registry/rules?category=metadata%2Finfo)

## Přepsané požadavky

| Prvek nebo údaj | Povinnost DMF 2.3 |
|---|---|
| Kořen `info`, `created`, `metadataversion`, `packageid`, `mainmets` | M |
| `validation` | MA |
| `validation/@version` | M uvnitř přítomného `validation` |
| Textový výsledek `validation` | R uvnitř přítomného `validation` |
| Opakovaný `titleid` s typem a hodnotou | M |
| `collection`, `institution` | R |
| `creator`, `size`, `itemlist`, `itemlist/@itemtotal`, opakovaný `itemlist/item` | M |
| `checksum` s odkazem a atributy `type` a `checksum` | M |
| `note` | O |

O u poznámky zůstává zachováno podle této verze DMF; budoucí změny povinností se nepřenášejí zpětně.

## Rozdíly DMF a XSD

| Místo | DMF Monografie 2.3 | XSD info 1.1 | Zápis v registru |
|---|---|---|---|
| `validation` | MA | Bez `minOccurs=0`, tedy povinný výskyt | Zachováno MA a explicitní rozpor; z absence nelze automaticky odvodit nedostupnost informace |
| `titleid/@type` | Také `ismn` nebo interní identifikátor | Uzavřený seznam `isbn`, `issn`, `ccnb`, `urnnbn`, `uuid` | Číselník XSD se nevydává za úplný seznam povolený DMF |
| `creator` | M | `minOccurs=0` | Povinnost NDK je přísnější než XSD |

U `titleid` DMF požaduje UUID a pro jednosvazkový dokument i URN:NBN. Komentář v XSD naopak popisuje UUID jako náhradní identifikátor; komentář však není validační omezení. Pravidla `validation` a `titleid` jsou označena jako sporná kvůli rozporu mezi zdroji, nikoli kvůli neověřenému přepisu tabulky.

## Kontroly v kontextu celého balíčku

- `packageid` se porovnává s názvem adresáře, `mainmets` se skutečným hlavním METS.
- Identifikátory se porovnávají s MODS na úrovni TITLE u vícesvazkového a VOLUME u jednosvazkového dokumentu.
- `itemlist` musí zahrnout i info.xml a soubor MD5. Samotný počet položek nestačí k ověření úplnosti ani jedinečnosti.
- `size` nezahrnuje info.xml. Registr bez dalšího podkladu nepředepisuje převod kB ani způsob zaokrouhlení.
- Atribut `checksum/@checksum` je MD5 otisk **odkazovaného souboru MD5**, nikoli otisk samotného info.xml. Odkaz a oba atributy musí být přítomny; `type` je `md5`.

Označení info.xml je označení role souboru, nikoli požadavek na doslovný název. DMF § 6 stanovuje názvovou konvenci, např. `info_nk-00027x.xml`. Tato skupina přepisuje obsah § 7.1; samostatné strojové pravidlo existence a názvu souboru zatím nepřidává.

## Strojový kontext a meze ověření

Podmínka `document_role: info` znamená dokument informací o SIP, nikoli obrazovou roli MC/PS. XPath se vyhodnocují nad tímto samostatným XML dokumentem. Schéma nemá `targetNamespace`, proto se používají cesty `/info/...` bez prefixu. U atributů se kardinalita vztahuje k jejich rodičovskému prvku; `titleid` a `item` se mohou opakovat.

MA nemá v tabulce přesnou algoritmickou podmínku dostupnosti. `presence: conditional` a kardinalita 1–1 popisují povinnost při její splnitelnosti; registr neobsahuje bezpodmínečnou kontrolu existence `validation`. U R/O není přítomnost vyžadována. Hodnoty OK/Valid jsou pouze příklady.

Deklarace `custom` jsou popisy dalších nutných kontrol, nikoli spustitelný kód. XPath kontroly přítomnosti samy nekontrolují typy XSD, správnost dat, úplnost seznamu ani shodu s balíčkem. Registr je publikuje, ale nespouští validační engine. Ověřena je provenance a přepis požadavků; chování ProArcu a validátorů pro tuto skupinu ani konkrétní SIP nebyly testovány.

## Prameny

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.1, s. 17–18; kontext § 5.1, s. 12, a § 6, s. 15–16.
- [Oficiální přehled metadatových standardů NDK](https://standardy.ndk.cz/ndk/standardy-digitalizace/metadata), XML schéma pro info.xml, verze 1.1 pro tištěné dokumenty.
- [XSD info 1.1](https://standardy.ndk.cz/ndk/spec2014/info1_1.xsd), staženo 5. 10. 2026; SHA-256 `0ecfd8beeb0db60808e04380357a1c65a858f62de96d10dc17ba1cfa9b0a1648`.
