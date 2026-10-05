# Případ `iccProfileVersion`

## Závěr a hranice ověření

Je nutné oddělit dva údaje:

- **ICC hlavičková verze** je číselná verze formátu, se kterým je binární profil kompatibilní. ICC.1:2022, § 7.2.4, ji definuje v bajtech 8–11; například `2.1.0` nebo `4.4.0.0`.
- **`mix:iccProfileVersion`** je řetězcový prvek. NISO Z39.87-2006 (R2017), § 7.1.3.2.1.2, uvádí příklady `1998`, `sRGB IEC61966-2.1` a `1976`. Ty lze vyložit jako vydání známého profilu či označení barevného standardu, nikoli jako ICC hlavičkovou verzi.

Ekvivalence těchto údajů není potvrzena správci standardu. Příklady NISO mohou být chybné, ale mohou také odrážet jiný zamýšlený význam. Registr proto neeviduje chybu NISO/MIX jako prokázanou a nepředepisuje obecný číselný regulární výraz.

DMF Monografie 2.3, § 7.5.4, s. 83, vyžaduje v přítomném `IccProfile` verzi pro MC i PS, ale uvádí příklad `sRGB IEC61966-2.1`. [Issue NLCR/Standard_NDK #255](https://github.com/NLCR/Standard_NDK/issues/255), § 9.7, dokládá odlišné mapování v metodice SIP NDK 2.0, s. 106:

```text
properties/jp2HeaderBox/colourSpecificationBox/icc/profileVersion
    → mix:iccProfileVersion
```

Lokátor metodiky je převzat z issue; PDF zde nebylo nezávisle znovu ověřeno. Mapování na číselnou hlavičkovou verzi je proto popsané jako NDK-specifický výklad, ne jako nesporná sémantika MIX.

## Strojový požadavek registru

Pro monografii, role MC / PS a přítomný blok `mix:IccProfile` se vyžaduje právě jeden `mix:iccProfileVersion`. Strojová deklarace nyní obsahuje pouze kontrolu přítomnosti a kardinalitu 1–1. Záměrně neodmítá nečíselné hodnoty jen kvůli jejich tvaru.

`verification.status: verified` označuje ověření přepisu požadavku na přítomnost; `status: disputed` zachycuje sporný význam hodnoty. Nejde o potvrzení číselného výkladu.

## Skutečné mapování a kontrola v nástrojích

Zdrojový kód a konfigurace níže byly zkontrolovány 2026-10-05 na uvedených commitech. Empirické výsledky TIFF/JP2 jsou převzaté z experimentu v issue #255 ze dne 2026-08-25; v rámci této úpravy nebyly nástroje nad obrazovými soubory znovu spuštěny. Závěry nelze automaticky přenést na jiné verze nebo jiné cesty zpracování.

| Nástroj / rozsah | Získání hlavičkové verze | Zápis nebo kontrola `mix:iccProfileVersion` |
|---|---|---|
| Komplexní validátor, konfigurace monografie 2.3 MC a PS | Nejde o extraktor ani mapování. | Pole má `mandatory="true"`, `repeatable="false"` a prázdné `expectedContent`. Konfigurace předepisuje přítomnost, ne číselný tvar či porovnání s ICC hlavičkou. |
| JHOVE 1.34.0 – TIFF | `extractIccProfileDescription` načte major/minor, ale jen je zaloguje. | Datový model neuchová verzi; XML handler ji nevypíše do MIX. |
| JHOVE 1.34.0 – JP2, restricted ICC | `ColorSpecBox` přeskočí 128B ICC hlavičku. | Hlavičková verze není mapována do MIX. |
| jpylyzer 2.2.1 – parser | `boxvalidator.py` vytvoří `profileVersion` v podobě major.minor.bugfix v `properties/…/icc/profileVersion`. | Údaj je dostupný v properties. |
| jpylyzer 2.2.1 – transformace MIX | `mix.py` přebírá `icc/description`. | Zapíše `iccProfileName`, nikoli `iccProfileVersion`, i při `--mix 2`. |
| ProArc 5.1.0 – cesta `MixEditor.write` → `JhoveUtility.getMix` | Přebírá výstup JHOVE; zde není vlastní ICC enrichment. | První uzel `mix` se unmarshaluje. `mergeMix` doplňuje pouze `ImageCaptureMetadata`; chybějící ICC verze zůstane chybějící. |

Issue uvádí stejnou absenci verze také pro JHOVE 1.20.1 v lokálním obrazu ProArc 5.1.0. Tento údaj je převzatý, nikoli nezávisle ověřený test tohoto registru. ProArc v popsané cestě existující verzi nemaže; nelze z toho tvrdit, že se stejně chovají všechny importy, exporty či ruční editace.

### Pevné odkazy na kontrolovaný kód

- [Validátor: MIX MC a PS, commit cde62bc](https://github.com/NLCR/komplexni-validator/tree/cde62bc936956809aaa26b1bb5c6afec71e07b0f/modules/sharedModule/src/main/resources/nkp/pspValidator/shared/validatorConfig/fDMF/monograph_2.3/techProfiles)
- [JHOVE 1.34.0: NisoImageMetadata](https://github.com/openpreserve/jhove/blob/38115c6071a158b750c6bf2ce552240455e68fcc/jhove-core/src/main/java/edu/harvard/hul/ois/jhove/NisoImageMetadata.java)
- [JHOVE 1.34.0: ColorSpecBox](https://github.com/openpreserve/jhove/blob/38115c6071a158b750c6bf2ce552240455e68fcc/jhove-modules/jpeg2000-hul/src/main/java/edu/harvard/hul/ois/jhove/module/jpeg2000/ColorSpecBox.java)
- [JHOVE 1.34.0: XmlHandler](https://github.com/openpreserve/jhove/blob/38115c6071a158b750c6bf2ce552240455e68fcc/jhove-core/src/main/java/edu/harvard/hul/ois/jhove/handler/XmlHandler.java)
- [jpylyzer 2.2.1: boxvalidator.py](https://github.com/openpreserve/jpylyzer/blob/c2b6f6f215961576effdf1af316ae3c8ac47a693/jpylyzer/boxvalidator.py)
- [jpylyzer 2.2.1: mix.py](https://github.com/openpreserve/jpylyzer/blob/c2b6f6f215961576effdf1af316ae3c8ac47a693/jpylyzer/mix.py)
- [ProArc 5.1.0: MixEditor](https://github.com/proarc/proarc/blob/89b8bdb3c2894c4d0dd06d5bbf199916e11c0380/proarc-common/src/main/java/cz/cas/lib/proarc/common/storage/MixEditor.java)
- [ProArc 5.1.0: JhoveUtility](https://github.com/proarc/proarc/blob/89b8bdb3c2894c4d0dd06d5bbf199916e11c0380/proarc-common/src/main/java/cz/cas/lib/proarc/common/process/export/mets/JhoveUtility.java)

## Doporučení

Správci NISO/MIX a NDK by měli výslovně odlišit vydání známého profilu od ICC hlavičkové verze a sjednotit DMF s metodikou SIP. Do té doby lze doplnění hodnoty z hlavičky zavést jako zdokumentovanou politiku SIP NDK 2.0. Zachovat původní výstup extraktoru, neodvozovat číslo z názvu a nepřepisovat existující hodnoty bez rozhodnutí.

Absence povinného údaje v NDK je problém zpracovatelské cesty. Sama o sobě však nedokazuje, že obecná transformace MIX musí převádět ICC hlavičkovou verzi do stejně pojmenovaného prvku.

## Specifikace a diskuse

- [DMF Monografie 2.3, s. 83, § 7.5.4](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf)
- [MIX 2.0 XML Schema](https://www.loc.gov/standards/mix/mix20/mix20.xsd)
- [ANSI/NISO Z39.87-2006 (R2017)](https://www.niso.org/publications/ansiniso-z3987-2006-r2017-data-dictionary-technical-metadata-digital-still-images)
- [ICC.1:2022, s. 20, § 7.2.4](https://www.color.org/specification/ICC.1-2022-05.pdf)
- [Metodika pro tvorbu balíčků SIP 2.0](https://invenio.nusl.cz/record/538239/files/000095839_1.pdf)
- [Issue #255, diskuse a převzatý experiment](https://github.com/NLCR/Standard_NDK/issues/255)
