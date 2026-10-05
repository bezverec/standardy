# PREMIS Object: vznik a ochrana souboru

Navazující skupina obsahuje **osm pravidel DMF Monografie 2.3** pro MC, PS a ALTO. Doplňuje [identifikaci, fixity a formát](premis-object.md) o původ souboru a jeho úroveň ochrany. V registru má kategorii `technical/premis-provenance` v oblasti administrativních a technických metadat, pod standardem PREMIS.

## Podklady a rozsah

Požadavky vycházejí z [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.5.1, s. 77–78, s legendou povinností na s. 75 a vymezením souborových objektů na s. 76. Obecné typy a kardinality byly ověřeny v [XSD PREMIS 2.2](https://www.loc.gov/standards/premis/v2/premis-v2-2.xsd). Číselná volitelnost obecného schématu neruší písmeno M v DMF.

Podmínky jsou monografie, vedlejší METS, role MC/PS/ALTO a typ objektu PREMIS file. ALTO odpovídá označení XML v tabulce DMF. Zmínka XML/TXT v popisu aplikace **nerozšiřuje rozsah na OCR.TXT**, pro které § 7.5.1 PREMIS Object nevytváří. UC je rovněž mimo rozsah. Další reprezentace, včetně originalcapture, nejsou touto skupinou kompletně zpracovány.

## Pravidla

| Prvek | Povinnost | Kardinalita NDK | Význam |
|---|---|---|---|
| preservationLevel | M | 1–n | Blok úrovně ochrany souboru |
| preservationLevelValue | M | 1–1 | MC a ALTO: preservation; PS: deleted |
| preservationLevelDateAssigned | R | 0–1 | Datum přiřazení ochrany, RRRR-MM-DD |
| creatingApplication | M | 1–n | Aplikace nebo zařízení vzniku souboru |
| creatingApplicationName | M | 1–1 | Název aplikace |
| creatingApplicationVersion | M | 1–1 | Řetězcová verze aplikace |
| dateCreatedByApplication | M | 1–1 | Datum a čas vzniku v ISO 8601 na sekundy |
| originalName | M | 1–1 | Původní název popisovaného souboru |

Kardinality se vztahují vždy k bezprostřednímu rodiči: například název, verze a čas se kontrolují **v každém** creatingApplication. Obecné XSD dovoluje různé kombinace údajů tohoto bloku, nikoli prázdný blok; DMF vyžaduje všechny tři uvedené údaje.

Datum přiřazení ochrany je skutečně doporučené, nikoli povinné. Pokud je přítomno, kontroluje se zápis i platnost kalendářního data. Naopak u vzniku aplikací nestačí samotný rok nebo datum, přestože je obecné `edtfSimpleType` připouští. DMF zde nepožaduje konkrétní časové pásmo ani automatický převod na UTC.

Úroveň ochrany se posuzuje podle role souboru, ne pouze podle příslušnosti hodnoty k seznamu. DMF navíc uvádí `bit-level` pro původní soubory uchovávané v originalcapture; tato podmínka se nepřenáší na MC/PS/ALTO. Hodnota `deleted` je historický údaj o PS, nikoli pokyn mazat soubor. Úroveň ochrany není úrovní povinnosti pravidla ani úrovní zabalení `compositionLevel`.

## Doložené ukázky

Skupina přidává **13 přesných XML výřezů u osmi pravidel** z první stránky [dodaného vzorového SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download). U creatingApplication jsou ukázány tři reprezentace:

| Objekt | Reprezentace | Uvedená aplikace | Uvedená verze |
|---|---|---|---|
| OBJ_002 | PS | Book Pavilion 6.0.1.0 | 6.0.1.0 |
| OBJ_003 | MC | Kakadu | 8.6.1 |
| OBJ_004 | ALTO | ABBYY FineReader Server | 14.0.4.682 |

Jde o obsah konkrétního SIP, nikoli o povinné aplikace nebo důkaz jejich obecného exportního chování. Verze aplikace není číslo formátu ani povinně SemVer. Verze zahrnutá do názvu aplikace nenahrazuje samostatné creatingApplicationVersion.

Také originalName je doloženo třemi výřezy: PS má `1_00010003_2R.tif`, MC `1_00010003_2R.tif.jp2` a ALTO `1_00010003_2R.tif.xml`. Původní názvy se liší od současného pojmenování souborů v SIP. Dvojité přípony se zachovávají beze změny; nejsou předepsaným vzorem názvu ani samy o sobě nesouladem. Tato kontrola první stránky nepotvrzuje obsah všech stran balíčku.

Ověřený zdroj:

- soubor `amdsec/amd_mets_75faba8d-c629-11f0-8950-12e8557df20e_0001.xml`;
- SHA-256 `4a8d9098cb15b621a0dee3fd5501a3eee2b107088dc728dcace2a36f1e2b583f`;
- kontrola 5. 10. 2026;
- výběr objektů: `/mets:mets/mets:amdSec/mets:techMD[@ID='OBJ_002']/mets:mdWrap/mets:xmlData/premis:object`, analogicky OBJ_003 a OBJ_004;
- v každém z nich byl pomocí XPath ověřen právě jeden přímý potomek `premis:originalName` a jeho hodnota;
- namespace METS: `http://www.loc.gov/METS/`, PREMIS: `info:lc/xmlns/premis-v2`.

Původní název nelze bez další evidence doplnit současným názvem v SIP, hodnotou objectIdentifierValue ani cestou FLocat. Objekty byly vybrány podle jejich identity, nikoli podle [nesprávných odkazů ADMID ve vzoru](mets-amd.md).

## Meze ověření

Zápis timestampu není důkaz správnosti časové osy. V této skupině se nepředepisuje automatická rovnost s METS CREATED ani s časem změny souboru v souborovém systému. Datum přiřazení ochrany a datum vytvoření mají odlišný význam.

Ověřeny byly požadavky DMF, obecné XSD a obsah ukázek. Nebyl spuštěn externí validátor a nebylo nově doloženo chování JHOVE, jpylyzeru, ProArcu ani Komplexního validátoru. Popisy kontrol `custom` jsou určeny budoucím implementacím; registr je nevykonává. [Vazby mezi objekty a událostmi](premis-relationships.md) popisuje navazující samostatná skupina.
