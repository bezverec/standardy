# Identifikátory svazku v MODS

Deset pravidel kategorie `metadata/mods-identifiers` doplňuje přímé `identifier` v MODS **svazku jednosvazkové monografie** v hlavním METS. Identifikují popisovaný zdroj; identifikátor katalogového záznamu v recordInfo a identifikátory původců mají vlastní pravidla.

## Prameny a rozsah

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 57–58; vizuálně ověřeno 4. 11. 2026 včetně pokračování seznamu na s. 58.
- Kapitola 4, s. 9–10 téhož DMF: povinné přidělení UUID a URN:NBN pro svazek a zacházení s neplatnými identifikátory. Legenda s. 24 rozlišuje povinnosti rodičů a dětí a katalogizační režimy.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd), modsGroup, identifierDefinition a jednoduchý typ yes: opakovatelný identifier, nepovinný řetězcový type a nepovinný invalid s jedinou hodnotou yes.
- [LOC: identifier](https://www.loc.gov/standards/mods/userguide/identifier.html): identifikátor zdroje, otevřené typy a označení neplatnosti.

Pravidla platí pouze pro vymezený svazek. Nepřenášejí se na titul vícesvazku, stránku, kapitolu, přílohu či relatedItem. Jiné úrovně mají v DMF vlastní povinnosti, například odlišnou povinnost URN:NBN. Obecná ustanovení kapitoly 4 zde slouží jako doplňující pramen, nikoli jako rozšíření rozsahu všech deseti pravidel.

## Přidaná pravidla

Prefix ID je `NDK-MONO-MODS-SINGLE-`.

| Suffix ID | Povinnost | Rozsah a převod |
|---|---|---|
| IDENTIFIER | M | alespoň jeden přímý identifier; uchovat relevantní identifikátory včetně neplatných |
| IDENTIFIER-TYPE | M | jeden type na každém identifier; otevřený seznam dalších typů |
| IDENTIFIER-UUID | M | podmnožina type=uuid; vygeneruje dodavatel |
| IDENTIFIER-URNNBN | M | podmnožina type=urnnbn; přidělené URN:NBN svazku |
| IDENTIFIER-CCNB | MA | dostupné 015$a a 015$z → type=ccnb |
| IDENTIFIER-ISBN | MA | dostupné 020$a a 020$z → type=isbn |
| IDENTIFIER-ISSN | MA | dostupné 022$a a 022$z → type=issn |
| IDENTIFIER-ISMN | MA | dostupné 024, první indikátor 2, $a a $z → type=ismn |
| IDENTIFIER-OTHER | R | další identifikátory, např. barcode, oclc, sysno, permalink, accession |
| IDENTIFIER-INVALID | slovní povinnost | invalid=yes na identifikátoru, který je podle zdroje neplatný nebo zrušený |

První čtyři pravidla zachovávají kód M. Samostatná povinnost invalid je zapsána jako `obligation_source: prose`; tabulka pro atribut neobsahuje vlastní kód. Z hlediska obecného pole obligation má sada pět povinných, čtyři podmíněně povinné a jedno doporučené pravidlo.

Kardinalita konkrétního typu se počítá pouze v odpovídající podmnožině přímých identifier. U povinných a dostupných typů je 1..n, u dalších doporučených 0..n. Tabulka zde neurčuje neopakovatelnost. Atributy mají 1..1 vůči svému rodiči, invalid pouze za své podmínky. Samotná přítomnost barcode nesplňuje požadavek na UUID či URN:NBN.

## Důležité hranice

### Povinnost a katalogizace

Formulace u type „pokud existují“ nečiní UUID a URN:NBN závislými na tom, zda je obsahuje původní katalog. Kapitola 4 ukládá jejich vytvoření či přidělení během digitalizace. Tyto dva předpisy jsou v registru **nezávislé na AACR2/RDA**.

Zbývajících osm pravidel zachycuje společný bibliografický předpis nebo zápis identifikátorů v obou režimech podle tabulky a legendy. Samotný namespace MODS nerozhoduje katalogizační rozsah. Sada nepřidává nové významové párovací klíče pro porovnávač.

MA používá dostupnost ve zdroji pro konkrétní svazek (`ccnb_metadata_available`, `isbn_metadata_available`, `issn_metadata_available`, `ismn_metadata_available`). Dostupné neplatné či zrušené údaje také aktivují MA. Neznámá dostupnost není false a chybějící cílové XML ji nesmí samo vypnout. Nevyžaduje se přidělit chybějící ISBN ani vyplnit všechny typy současně.

### Neplatné identifikátory a MARC

Údaj z $z se při převodu nesmí zahodit jen proto, že není platným identifikátorem. Zachová se jeho hodnota a stav prostřednictvím invalid=yes. Stav pro pravidlo `IDENTIFIER-INVALID` určuje `identifier_invalid_or_cancelled` z nezávislého zdroje; existence atributu v cílovém XML není podmínkou kontroly.

Kapitola 4 na s. 10 obecně připouští evidenci neplatných či nahrazených údajů; konkrétní tabulka jednosvazku na s. 57 uvádí i jejich zaznamenání a označení. Neplatnost hodnoty identifikátoru není sama o sobě neplatností jeho správně označeného XML záznamu. XSD pro invalid připouští pouze yes, nikoli no/false.

DMF na s. 10 zároveň výslovně nepovoluje přenos neplatných identifikátorů do Dublin Core. Tuto hranici uvádíme v interpretaci; **samostatná kontrola převodu do DC není touto sadou implementována**.

ISSN se přebírá z výslovně uvedených 022$a a $z. Řádek neuvádí $y; pravidlo jeho mapování nerozhoduje. U ISMN je podstatný první indikátor 2: nelze převádět libovolné 024. Formulace „využití se nepředpokládá u map a grafik“ nepředstavuje výslovné nepoužití, proto nevzniká `forbidden` ani automatické vyloučení relevantního dostupného údaje u těchto předloh.

### Otevřené typy a syntaktické meze

Příklady dalších typů na s. 58 končí „apod.“. Nejsou uzavřeným číselníkem ani povinností uvádět všech pět. Zvláštní slovní povinnost identifikace fyzické předlohy vlastníka, který vůbec nepřiděluje signatury, zůstává v [samostatném pravidle skupiny location](mods-location.md). Obecné doporučení dalších identifikátorů R se nemění na M.

Příklad urn:nbn:cz:nk-123456 z DMF nepředepisuje výhradně registrátora nk ani číselnou koncovku. Tato sada neimplementuje úplnou syntaxi UUID/URN:NBN, kontrolní součty ISBN/ISSN/ISMN, jejich normalizaci, ověření přidělení ani dostupnost resolveru. Požadavky na přítomnost a převod jsou odděleny od těchto dalších kontrol. Deklarativní custom kontroly registr nad SIP nespouští a implementace nástrojů nebyly ověřeny.

## XML ze vzorového SIP

Přibylo dvanáct ukázek u šesti pravidel. Všechny pocházejí z [monografického vzoru](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download), hlavního souboru `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml`, SHA-256:

`7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`.

Základ XPath je `/mets:mets/mets:dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:identifier`, doplněný predikátem typu. Namespace: mets = http://www.loc.gov/METS/, mods = http://www.loc.gov/mods/v3.

Vybraný záznam deklaruje MODS 3.8, genre=volume, issuance=single unit a descriptionStandard=aacr; info deklaruje DMF 2.3. Má čtyři přímé identifikátory v tomto pořadí:

| type | Původní hodnota |
|---|---|
| urnnbn | urn:nbn:cz:nk-008m3g |
| barcode | 1001888228 |
| uuid | 75faba8d-c629-11f0-8950-12e8557df20e |
| ccnb | cnb002129761 |

Čtyři výřezy se zobrazují u identifier a znovu u type; odpovídající jednotlivé výřezy také u UUID, URN:NBN, čČNB a dalších identifikátorů. Nejde o dvanáct různých hodnot. Ukázky zachovávají původní data; neobsahují ISBN, ISSN, ISMN ani invalid. Jejich absence neprokazuje nedostupnost zdrojových údajů. Původní MARC, věcná platnost a přidělení těchto hodnot nebyly ověřeny.

## Kontroly

Lokální kontroly 4. 11. 2026:

- Validace 340 YAML dokumentů a typová kontrola prošly.
- Všech 471 testů v 53 souborech prošlo s `--maxWorkers=1`. První běh se dvěma procesy měl 470 úspěšných testů a překročil pětisekundový limit souhrnné Python kontroly XML; při opakování nebyl limit zvýšen ani žádný test vynechán.
- Sestavení zahrnuje 330 pravidel (312 monografických, 18 periodických), 259 zdrojových entit a 1735 vazeb.
- Všech 277 monografických ukázek prošlo kontrolou syntaxe i shody se zdrojem (SHA-256 a XPath). Celkem má registr 284 ukázek u 223 pravidel; monografická část je u 216 pravidel.
- Validace aktualizovaného autorského skillu a kontrola diffu prošly.

Původní MARC, skutečné přidělení a platnost identifikátorů, resolver a implementace nástrojů zůstávají neověřené. Uvedené výsledky dokládají lokální přípravu sady; GitHub CI a skutečné nasazení se ověřují samostatně pro konkrétní commit.
