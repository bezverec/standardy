# Metodika tvorby preservation masterů obrazových dat kulturního dědictví

**Verze:** 0.2.3  
**Poslední aktualizace:** 2026-04-08  
**Formát:** markdown  
**Licence:** <a href="https://standardy.digitalizaty.cz">Metodika tvorby preservation masterů obrazových dat kulturního dědictví</a> © 2026 by <a href="https://github.com/bezverec">Jan Houserek</a> is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">

---

## Abstrakt

Tento dokument představuje pracovní návrh metodiky pro tvorbu preservation masterů při digitalizaci kulturního dědictví. Jeho cílem je formulovat odborně konzistentní a terminologicky přesný rámec pro vznik digitálních reprodukcí, které budou dlouhodobě použitelné jako archivní reprezentace fyzických předloh. Metodika vychází z mezinárodně uznávaných doporučení a standardů v oblasti obrazové kvality, správy barev, technické kontroly a dlouhodobé správy digitálních objektů, zejména z dokumentů FADGI, Metamorfoze, ISO 19264 a z principů ICC color managementu.^1^,^2^,^3^,^4^,^5

Dokument je koncipován jako podrobný odborný text. Neomezuje se na stručný soupis parametrů, ale usiluje také o výklad důvodů jednotlivých požadavků, jejich vzájemných vazeb a jejich významu pro institucionální praxi. Zvláštní pozornost je věnována rozdílu mezi device-dependent a device-independent přístupy, roli ICC profilů, vztahu mezi technickou měřitelností a vizuálním hodnocením, odlišení preservation masteru od pracovních a uživatelských derivátů a stručnému vysvětlení různých typů ICC charakterizace, zejména matrix/TRC a LUT profilů.^1^,^2^,^4^,^5

---

## 1. Úvod

Digitalizace kulturního dědictví již dávno nepředstavuje pouze technický proces převodu analogové předlohy do digitálního obrazového souboru. V současném institucionálním prostředí je chápána jako řízená odborná činnost, jejímž výsledkem má být standardizovaná, věrohodná, měřitelná a dlouhodobě spravovatelná digitální reprezentace originálu. Tato reprezentace musí vyhovět nejen bezprostředním potřebám zpřístupnění nebo badatelského využití, ale také budoucím požadavkům na re-use, migraci, reprocessing, validaci a důvěryhodnou archivaci.^1^,^2^,^3

Klíčovým pojmem v tomto kontextu je preservation master, tedy archivní master soubor první generace, z něhož mají být odvozovány další reprodukce, deriváty a uživatelské výstupy. Preservation master nelze chápat jako libovolný „nejlepší dostupný soubor“, nýbrž jako výsledek řízeného pracovního postupu, který zahrnuje kalibraci zařízení, standardizovanou správu barev, kontrolu obrazové kvality, důslednou dokumentaci a institucionálně obhajitelná rozhodnutí o formátu, barevném prostoru, bitové hloubce, samplingu a přípustných zásazích do obrazu.^1^,^2

---

## 2. Účel dokumentu a působnost

Účelem tohoto dokumentu je formulovat odborný metodický rámec pro tvorbu preservation masterů v procesu digitalizace kulturního dědictví. Dokument má sloužit jako základ pro vznik interních směrnic, projektových specifikací a provozních pracovních postupů na úrovni jednotlivých institucí nebo digitalizačních pracovišť.

Tato metodika je primárně určena pro digitalizaci plošných předloh, zejména rukopisů, starých tisků, novodobých knih, periodik, archiválií, grafických listů, fotografií, map a plánů, volných listů a obdobných dokumentových předloh. Dokument se zaměřuje na obrazová data vznikající skenováním nebo reprografickým fotografováním. Nevztahuje se plně na audiovizuální digitalizaci, 3D záznam, multispektrální zobrazování ani na specializované konzervační či forenzní zobrazovací metody, pokud nejsou výslovně začleněny do konkrétního projektového režimu.

---

## 3. Terminologické a koncepční vymezení

### 3.1 Preservation master

Preservation master je první generační archivní obrazový soubor určený pro dlouhodobé uchování. Musí představovat technicky kontrolovanou, standardizovanou a dokumentovanou digitální reprezentaci originálu.^2

### 3.2 Produkční nebo pracovní soubor

Pracovní soubor je mezivýstup vznikající v průběhu zpracování, validace nebo interní produkce. Může být technicky užitečný pro lokální pracovní postup, ale sám o sobě nemusí splňovat všechny požadavky preservation masteru.

### 3.3 Uživatelský derivát

Uživatelský derivát je odvozený soubor vytvořený z preservation masteru pro konkrétní účel užití, například webové zpřístupnění, OCR pracovní postup, studijní potřeby, tiskové náhledy nebo publikační výstupy.

### 3.4 Device-dependent a device-independent data

Device-dependent data jsou taková obrazová data, jejichž barevný význam je bezprostředně vázán na konkrétní zařízení nebo na úzce definovaný produkční řetězec. Device-independent data jsou naopak interpretovatelná prostřednictvím standardizovaného barevného popisu a nejsou závislá pouze na znalosti konkrétního zařízení.^4^,^5

### 3.5 ICC profil

ICC profil je standardizovaný popis barevné charakteristiky zařízení, barevného prostoru nebo transformačního vztahu, umožňující řízenou interpretaci a převod barevných dat. V praxi je vhodné rozlišovat zejména profily založené na matici a tónových přenosových křivkách (matrix/TRC) a profily využívající tabulkové transformace (LUT).^4

### 3.6 White balance, neutralita a color cast

White balance označuje míru neutrality neutrálních tónů v obrazu. Color cast představuje systematickou odchylku barevné neutrality, například teplý, studený, zelený nebo purpurový nádech. V kontextu preservation masterů je třeba chápat white balance jako samostatný parametr kvality, který nelze redukovat na obecnou color accuracy celého targetu.^2

### 3.7 Slovník pojmů

#### Adobe RGB (1998)
Standardní RGB barevný prostor s širším gamutem než sRGB.

#### Barevná přesnost / color accuracy
Míra shody mezi referenčními barevnými hodnotami targetu a jejich digitální reprodukcí.

#### Bitová hloubka
Počet bitů použitých pro zápis jedné barevné složky nebo tonální úrovně.

#### Claimed sampling rate
Nominálně deklarované rozlišení nebo sampling digitalizačního systému.

#### Color misregistration
Nesouosost barevných kanálů vedoucí k barevným lemům nebo nepřesnému překrytí obrazové informace.

#### DeltaE / ΔE
Souhrnné označení pro metriky vyjadřující barevnou odchylku mezi dvěma body v barevném prostoru.

#### eciRGB v2
Standardní RGB barevný prostor doporučovaný v evropském prostředí pro archivní a kvalitní produkční pracovní postup.

#### Embedded ICC profil
ICC profil vložený přímo do obrazového souboru.

#### Expozice
V kontextu digitalizace míra využití tonálního rozsahu pro zachycení předlohy bez ztráty informace ve světlech nebo stínech.

#### Gain modulation
Míra tonální rovnoměrnosti a reprodukční správnosti v průběhu jasové škály.

#### Geometrická přesnost
Míra, s jakou digitální reprodukce zachovává tvarové a rozměrové vlastnosti originálu bez zkreslení.

#### LUT profil
ICC profil využívající tabulkové transformace (look-up tables), který může detailněji modelovat nelineární barevné chování zařízení než jednoduchý matrix/TRC model.

#### MTF / SFR
Modulation Transfer Function, resp. Spatial Frequency Response. Soubor parametrů popisujících schopnost systému přenášet kontrast a detail při různých prostorových frekvencích.^2^,^3

#### PCS
Profile Connection Space. Referenční mezilehlý prostor používaný v ICC pracovním postupu při transformacích mezi zdrojovým a cílovým profilem.^4

#### Profil monitoru
ICC profil charakterizující konkrétní monitor pro účely správného zobrazení.

#### RAW data
Zdrojová obrazová data vzniklá při snímání před plnou interpretací nebo normalizací do standardního pracovního prostoru.

#### Rendering intent
Pravidlo nebo strategie převodu barev mezi prostory s různým gamutem.^1^,^4

#### Reproduction scale accuracy
Přesnost měřítka reprodukce, tedy shoda mezi skutečnými rozměry originálu a rozměry v digitálním záznamu.^1

#### Sampling efficiency
Míra, s jakou digitalizační systém skutečně využívá deklarované rozlišení k přenosu užitečného detailu.^1^,^2

#### Sharpening
Softwarové nebo hardwarové zvýraznění hran a lokálního kontrastu.

#### Target
Fyzický testovací obrazec nebo vzorník používaný ke kalibraci, měření a validaci kvality digitalizačního systému.^1^,^2

#### TIFF 6.0
Dlouhodobě zavedený rastrový obrazový formát široce používaný pro archivní a produkční obrazy.

---

## 4. Normativní a metodická východiska

Tento dokument vychází z kombinace standardů, doporučení a metodik, které představují současný mezinárodní referenční rámec pro digitalizaci kulturního dědictví.

### 4.1 FADGI

Doporučení FADGI představují komplexní technický rámec pro digitalizaci kulturního dědictví, zejména v oblasti obrazové kvality, samplingu, tonality, správy barev a dokumentace pracovního postupu.^1

### 4.2 Metamorfoze

Metamorfoze je evropská metodika preservation imagingu, která propojuje požadavky na objektivní i subjektivní hodnocení kvality, definuje kvalitativní režimy, stanovuje technické parametry a rozpracovává pořadí testování i interpretaci výsledků.^2

### 4.3 ISO 19264 a příbuzné normy

Normy ISO 19264 poskytují standardizovaný rámec pro měření obrazové kvality digitalizačních systémů. Důležité jsou zejména pro definování samplingu, MTF, noise, tonality, color accuracy a dalších parametrů technické výkonnosti zobrazovacího řetězce.^3

### 4.4 ICC Consortium

Dokumenty ICC Consortium poskytují teoretický i praktický rámec pro správu barev v RGB pracovním postupu.^4^,^5

---

## 5. Základní principy tvorby preservation masteru

1. Preservation master musí být chápán jako standardizovaný archivní objekt, nikoli jako nahodilý vedlejší produkt digitalizačního procesu.^2  
2. Cílem preservation masteru není vytvořit „vizuálně nejpůsobivější“ obraz, ale takový soubor, který co nejlépe a nejspolehlivěji reprezentuje originál v rámci definovaného technického režimu.^1^,^2  
3. Metodika musí preferovat postupy, které lze opakovat, validovat a obhájit.^1  
4. Je nutné důsledně rozlišovat mezi legitimní technickou kalibrací zobrazovacího řetězce a takovou manipulací obrazu, která mění informační obsah nebo povahu vizuálního svědectví.^1^,^2  
5. V rámci jednoho projektu musí být použity konzistentní postupy, technické cíle, targety, barevné prostory a pravidla kontroly kvality.^1^,^2

---

## 6. Barevné řízení a role ICC profilů

### 6.1 Správa barev jako součást preservation workflow

Správa barev není volitelným doplňkem, ale základní součástí workflow tvorby preservation masterů.^1^,^4^,^5

### 6.2 Role vstupního profilu zařízení

Vstupní profil zařízení má charakteristiku snímacího systému popsat a umožnit řízenou transformaci do cílového pracovního prostoru. Není automaticky optimálním dlouhodobým prostorem pro archivaci masteru.^1^,^4^,^5 Vstupní profil zařízení slouží k charakterizaci snímacího systému; preservation master se však zpravidla neukládá v device-dependent prostoru zařízení, ale po řízené transformaci do standardního pracovního RGB prostoru.

### 6.3 Standardní pracovní a archivní RGB prostor

FADGI doporučuje vytvářet master obrazové soubory ve standardním barevném prostoru a výslovně uvádí Adobe RGB (1998), ProPhoto a eciRGB v2 jako vhodné profily pro ukládání RGB image files.^1 Metamorfoze stanovuje, že preservation masters mají používat v rámci projektu konzistentní barevný prostor; pro Full je povinný eciRGB v2, pro Light je přípustný eciRGB v2 nebo Adobe RGB (1998), pro Extra Light též sRGB IEC61966-2.1.^2

### 6.3a Praktické postavení eciRGB v2 mimo paměťové instituce

Pro tuto metodiku je důležité rozlišovat mezi **metodickou preferencí** a **obecnou rozšířeností v komerční praxi**. eciRGB v2 má silnou legitimitu v evropském standardizačním, polygrafickém a paměťovém kontextu; samotná ECI jej na svém webu výslovně uvádí jako **pracovní barevný prostor doporučený ECI**. Současně však tato metodika nepracuje s tvrzením, že by eciRGB v2 byl dominantním pracovním RGB prostorem v celém širším komerčním prostředí.

V běžném komerčním ekosystému Adobe jsou mnohem viditelnější především **sRGB**, **Adobe RGB (1998)** a **ProPhoto RGB**. Photoshop uvádí, že je obecně nejlepší volit pro RGB working space spíše **Adobe RGB nebo sRGB** než profil konkrétního zařízení, a současně říká, že v nabídce pracovních prostorů standardně zobrazuje profily doporučené a otestované Adobe pro většinu workflow. Adobe Camera Raw mezi „standard color spaces“ z dřívějších verzí uvádí **Adobe RGB (1998), ColorMatch RGB, ProPhoto RGB a sRGB**. Lightroom Classic pak používá **Adobe RGB** v řadě modulů a **ProPhoto RGB** v modulu Develop.

Z toho plyne praktický závěr pro tuto metodiku: **eciRGB v2 je vhodné preferovat jako institucionálně a metodicky zdůvodněnou volbu pro preservation workflow, nikoli jako domněle univerzální komerční standard**. Současně je vhodné výslovně uznat, že **Adobe RGB (1998)** je v širší profesionální praxi velmi běžná a legitimní alternativa, zejména tam, kde organizace pracuje převážně v Adobe ekosystému.

### 6.3b Matrix/TRC profil a LUT profil

V praxi ICC správy barev je důležité rozlišovat mezi dvěma základními typy profilové charakterizace: **matrix/TRC profilem** a **LUT profilem**.

**Matrix/TRC profil** popisuje barevné chování zařízení nebo pracovního prostoru pomocí kombinace:
- barevných primárek nebo ekvivalentní maticové transformace,
- bílého bodu,
- a tónových přenosových křivek (**TRC**, tone response curves) pro jednotlivé kanály.

Tento typ profilu je výpočetně jednodušší, transparentnější a velmi rozšířený u standardních RGB pracovních prostorů, jako jsou **sRGB**, **Adobe RGB (1998)** nebo **eciRGB v2**. Je vhodný tam, kde lze barevné chování prostoru nebo zařízení dostatečně dobře popsat relativně jednoduchým modelem.

**LUT profil** (**Look-Up Table profile**) naproti tomu používá tabulkové transformace, které mohou detailněji modelovat nelineární a vzájemně provázané barevné chování reálného zařízení. V ICC architektuře bývají tyto převody reprezentovány zejména pomocí tabulek typu **A2B** a **B2A**, tedy transformací mezi zařízením definovaným prostorem a referenčním prostorem ICC workflow přes PCS.

Z metodického hlediska to znamená, že:
- **matrix/TRC profil** bývá vhodný pro standardní pracovní RGB prostory a pro jednodušší, dobře predikovatelné transformace,
- **LUT profil** bývá vhodný zejména pro přesnější charakterizaci vstupních a výstupních zařízení, pokud jednoduchý maticový model nestačí.

U digitalizačních zařízení může LUT profil lépe popsat:
- nelinearity snímacího řetězce,
- složitější vztahy mezi kanály,
- lokální odchylky v barevném chování,
- a problematická místa gamutu, která jednoduchá matice s TRC vystihuje jen přibližně.

Současně je však třeba upozornit, že LUT profil není automaticky „lepší“ ve všech ohledech. Oproti maticovým profilům může být:
- méně transparentní při odborné interpretaci,
- více závislý na kvalitě konkrétní profilace,
- a v některých softwarech nebo workflow méně předvídatelný z hlediska interoperability.

Pro tuto metodiku z toho plyne důležitý závěr:

**Volba mezi matrix/TRC a LUT profilem nemá být vedena představou, že jeden typ je absolutně správný, ale tím, zda zvolený profil dostatečně přesně, stabilně a opakovatelně charakterizuje konkrétní zařízení a zda je kompatibilní s institucionálním workflow.**

V institucionální praxi lze doporučit tento princip:
1. **pracovní RGB prostory preservation masterů** mají být standardní a široce interpretovatelné, typicky založené na dobře definovaném ICC prostoru,  
2. **vstupní profil zařízení** může být maticový nebo LUT podle výsledku profilace a chování zařízení,  
3. rozhodující je, aby převod ze vstupního profilu do standardního archivního RGB prostoru byl **řízený, dokumentovaný a reprodukovatelný**.

### 6.4 Profil monitoru

Profil monitoru slouží k řízenému zobrazení obrazu na konkrétním displeji. Nesmí být zaměňován s pracovním prostorem obrazového souboru.^4^,^5

### 6.5 Přiřadit profil a převést do profilu

Rozlišování mezi „Assign Profile“ a „Convert to Profile“ je zásadní. ICC white paper o roli profilů vychází z toho, že profil definuje význam numerických dat a že vlastní transformaci provádí CMM mezi zdrojovým a cílovým profilem přes PCS.^4

### 6.6 Rendering intent

FADGI uvádí, že perceptual intent obvykle funguje lépe pro fotografické obrazy, zatímco absolute colorimetric často pro textové dokumenty a grafiku; současně doporučuje intent ověřovat podle konkrétního souboru nebo skupiny souborů.^1

### 6.7 Praktická poznámka k širokým gamutům a bitové hloubce

Širší gamut sám o sobě automaticky neznamená vyšší věrnost nebo vyšší archivní kvalitu. Jeho přínos se projeví pouze tehdy, pokud je workflow dostatečně disciplinované, barevně řízené a pracuje s odpovídající bitovou hloubkou. U širokých pracovních prostorů proto obecně roste význam 16bitového zpracování a opatrného zacházení s převody, editací i exportem.

---

## 7. Formátové a technické parametry preservation masteru

### 7.1 Souborový formát

Metamorfoze předpokládá pro preservation masters primárně TIFF 6.0 uncompressed pro všechny tři úrovně kvality.^2

### 7.2 Bitová hloubka

Metamorfoze Full vyžaduje 16 bitů; Light a Extra Light 8 bitů na kanál. Zároveň uvádí, že fotografie a výtvarné předlohy by měly být vždy digitalizovány a ukládány při 16 bitech na kanál.^2 FADGI doporučuje pracovat co nejdéle ve 48-bit RGB nebo 16-bit grayscale a snížení bitové hloubky provádět až na konci workflow.^1

### 7.3 Rozlišení a sampling

Metamorfoze uvádí 300 ppi pro originály ≥ DIN A5 a maximálně 600 ppi pro menší originály; současně upozorňuje, že u předloh s vyšší informační hustotou může být vhodný vyšší sampling rate.^2

### 7.4 Embedded metadata a technická identifikace

Metamorfoze řadí kontrolu file format, technical metadata, embedded barevný prostor a bit depth do prvního kroku technického hodnocení.^2

---

## 8. Kalibrace, targety a měřicí infrastruktura

Metamorfoze uvádí přehled vhodných targetů pro jednotlivé testy: UTT, ColorChecker Digital SG / DCSG, Golden Thread FADGI 19264 target, QA-62 MTF test target a QA-2 Metric.^2 FADGI požaduje rutinní digital image conformance evaluation a doporučuje snímat appropriate target na začátku snímací session; target má být zkontrolován a musí projít ještě před zahájením produkčního snímání.^1

FADGI navíc doporučuje testovat na začátku každého pracovního dne nebo na začátku každé dávky, podle toho, co nastane dříve, a testování opakovat po aktualizaci software/device drivers i při indikaci problému.^1

### 8.5 Je nutné snímat target u každého dokumentu?

Tato otázka vyžaduje přesnou odpověď, protože v praxi se často směšují dva různé požadavky:
1. **průběžná technická kontrola digitalizačního systému**,  
2. **přítomnost targetu v každém jednotlivém obrazovém souboru nebo u každého digitalizovaného objektu**.

Pro tuto metodiku se doporučuje následující rozlišení:

- **Target není nutné chápat jako absolutně povinnou součást každého jednotlivého master souboru**, pokud instituce používá stabilní a dokumentovaný systém průběžné validace.
- **Targetově založená kontrola je však nutná jako součást řízení kvality**: minimálně na začátku snímací session, na začátku pracovního dne nebo dávky a vždy po změně nastavení, zařízení, software nebo podmínek snímání.
- **Silnější režim** představuje workflow, v němž je referenční target zachycen přímo s digitalizovaným objektem nebo v bezprostřední vazbě na něj; to je zvlášť vhodné u náročných předloh, fotografického materiálu, výtvarných děl, zakázek s vysokými požadavky na auditovatelnost nebo tam, kde to vyžaduje projektový standard.

FADGI doporučuje po zavedení systému provádět digital image conformance evaluation na začátku každého pracovního dne nebo na začátku každé dávky, podle toho, co nastane dříve; target má být před produkčním snímáním zkontrolován a musí projít. Současně FADGI ve svých doporučeních uvádí i silnější variantu: zahrnout referenční targety do každého snímku originálu, minimálně šedou škálu, barevnou referenci a měřítko, přičemž access deriváty lze následně o target oříznout.

Z toho pro institucionální praxi plyne tento závěr:

- **není nutné tvrdit, že bez targetu v každém jednotlivém dokumentu je digitalizace automaticky metodicky chybná**,  
- **je však nutné trvat na tom, že bez pravidelné targetové validace nelze prokázat stabilitu a konformitu systému**.

Pro běžnou metodickou formulaci lze doporučit tuto větu:

**Každý digitalizační workflow musí používat pravidelné targetové měření a validaci. Přítomnost targetu v každém jednotlivém souboru se řídí typem projektu, požadavky na auditovatelnost a institucionální politikou, nikoli jediným absolutním pravidlem.**

## 9. Hodnocení obrazové kvality

### 9.1 Obecné zásady

Hodnocení obrazové kvality preservation masteru musí kombinovat objektivní měření s kvalifikovaným vizuálním posouzením.^1^,^2

### 9.2 Pořadí vyhodnocení

Metamorfoze výslovně uvádí pořadí technického hodnocení: file format/metadata/barevný prostor/bit depth, vizuální kontrola targetů a referenčních dat, white balance, exposure, gain modulation, noise, illumination, color cast, color accuracy, sampling rate, MTF10/sampling efficiency/MTF50/maximum modulation/color misregistration a geometric distortion.^2

### 9.3 White balance a neutralita

Metamorfoze stanovuje pro Full a Light toleranci white balance ΔE(ab)* ≤ 3 a pro Extra Light ΔE(ab)* ≤ 5; současně uvádí, že color cast je white balance deviation, která se nemá vyskytovat nikde v obrazovém poli.^2 FADGI uvádí pro white balance for any given gray patch přibližně < 6 / < 4 / < 2 podle hvězdičkové úrovně.^1

### 9.4 Expozice a tonalita

Metamorfoze používá ΔL* a hodnotí expozici primárně v highlights; současně uvádí, že maximální L* v obrazovém poli nemá překročit L* 98.^2

### 9.5 Color accuracy

Metamorfoze používá ColorChecker Digital SG v centru obrazového pole a metriku CIE2000SL=1; pro Full stanovuje Mean ΔE* ≤ 3 a Max ΔE* ≤ 7, pro Light Mean ΔE* ≤ 4 a Max ΔE* ≤ 14.^2 FADGI používá Mean ΔE2000 a 90th percentile ΔE2000; orientačně < 5 / < 3.5 / < 2 pro průměr a < 10 / < 7 / < 4 pro 90. percentil.^1

---

### 9.6 SFR, MTF, sharpening, misregistration a geometrická přesnost

#### 9.6.1 Proč nelze kvalitu redukovat na ppi

Samotné deklarované rozlišení nestačí pro posouzení kvality. FADGI uvádí sampling frequency jako parametr, který informuje o potenciální spatial resolution, ale současně jej váže k dalším metrikám, zejména reproduction scale accuracy a SFR parametrům.^1 Metamorfoze obdobně rozlišuje mezi required sampling rate, difference between claimed and obtained sampling rate, sampling efficiency, MTF50, maximum modulation, color misregistration a geometric distortion.^2

#### 9.6.2 SFR10 a sampling efficiency

FADGI používá SFR10 (Sampling Efficiency) jako ratio %, s orientačními prahy > 70 %, > 80 % a > 90 % podle úrovně.^1 Metamorfoze používá sampling efficiency definovanou jako resolution measured as frequency where 10% modulation is reached (MTF10) according to ISO 16067-1 a stanovuje hranici ≥ 85 % pro Full, Light i Extra Light.^2

#### 9.6.3 Claimed vs. obtained sampling rate a reproduction scale accuracy

Metamorfoze stanovuje rozdíl mezi claimed a obtained sampling rate ≤ 2 %.^2 FADGI používá reproduction scale accuracy jako % difference from header PPI a uvádí přibližně ±3 %, ±2 % a ±1 % podle úrovně.^1

#### 9.6.4 MTF50 a praktický význam ostrosti

Metamorfoze uvádí, že pokud se při tvorbě preservation masteru používá sharpening, má platit MTF50 ≥ 45 % of the minimum required MTF10 performance expressed in lp/mm; při 300 ppi to odpovídá požadovanému MTF50 ≥ 2.25 lp/mm v obou směrech.^2

#### 9.6.5 Maximum modulation a sharpening

Metamorfoze stanovuje maximum modulation ≤ 1.05 pro všechny tři kvalitativní úrovně.^2 FADGI uvádí sharpening (Units Max Modulation) < 1.1 / < 1.05 / < 1.02 podle úrovně.^1 Metamorfoze současně uvádí, že excessive sharpening can cause unwanted artefacts, such as halos, a doporučuje sharpening spíše pro uživatelské deriváty než pro preservation masters.^2

#### 9.6.6 Color misregistration

Metamorfoze stanovuje pro Full color misregistration ≤ 0.35 px a pro Light/Extra Light ≤ 0.50 px per color channel.^2 FADGI uvádí color channel misregistration < 0.8 px / < 0.5 px / < 0.33 px podle úrovně.^1

#### 9.6.7 Geometrická přesnost a zkreslení

Metamorfoze uvádí příklady barrel distortion, pincushion distortion i posunů horizontálních a vertikálních linií a stanovuje pro Full a Light geometric distortion ≤ 2 %, pro Extra Light ≤ 4 %.^2 FADGI používá reproduction scale accuracy jako klíčový měřítkový ukazatel a současně doporučuje průběžné ověřování konformity s technickými targety.^1

#### 9.6.8 Praktická interpretační zásada

Preservation master musí obstát jako celek: claimed sampling, obtained sampling, SFR10, MTF50, modulation, misregistration a geometrie musejí být interpretovány společně.^1^,^2^,^3

---

### 9.7 Srovnávací tabulky standardů, rolí a kvalitativních úrovní

#### 9.7.1 Standardy podle role ve workflow

| Standard nebo metodika | Primární role | Typ normativity | Typické použití v praxi |
|---|---|---|---|
| FADGI | praktický technický rámec a ověřování konformity | doporučení / guidelines | snímací workflow, QA, targetově založené validace |
| Metamorfoze | preservation imaging metodika s kvalitativními režimy | metodika / guidelines | definice preservation masteru, provozní rozhodování |
| ISO 19264-1 | analytický rámec image quality analysis | mezinárodní norma | měření SFR, tonality, noise, color accuracy, geometrie |
| ICC White Papers | teoretický a workflow rámec barevného řízení | odborné doporučení | role profilů, PCS, RGB workflow, konverze |

#### 9.7.2 Standardy podle hlavních rozhodnutí

| Oblast rozhodování | FADGI | Metamorfoze | ISO 19264-1 | ICC |
|---|---|---|---|---|
| Co je preservation master | nepřímo, přes master obrazové soubory | explicitně | neřeší provozně | neřeší |
| Color space masteru | ano | ano, velmi explicitně | ne | nepřímo |
| ICC workflow | ano | ano | ne | ano, zásadně |
| White balance | ano | ano, explicitně | analyticky nepřímo | ne |
| Color accuracy | ano | ano | ano | ne |
| SFR / MTF | ano | ano | ano | ne |
| Geometrie | ano | ano | ano | ne |
| QA frekvence a provoz | ano | částečně | ne | ne |
| Doporučené formáty | ano | ano | ne | ne |

#### 9.7.3 Metamorfoze vs. FADGI – vybrané metriky

| Parametr | Metamorfoze Full | Metamorfoze Light | Metamorfoze Extra Light | FADGI – orientační úrovně |
|---|---|---|---|---|
| White balance | ΔE(ab)* ≤ 3 | ΔE(ab)* ≤ 3 | ΔE(ab)* ≤ 5 | < 2 / < 4 / < 6 |
| Mean color accuracy | ≤ 3 | ≤ 4 | vizuální režim | < 2 / < 3.5 / < 5 |
| Upper metric | Max ≤ 7 | Max ≤ 14 | vizuální režim | 90th percentile < 4 / < 7 / < 10 |
| Sampling efficiency | ≥ 85 % | ≥ 85 % | ≥ 85 % | > 70 / > 80 / > 90 % |
| Sharpening / max modulation | ≤ 1.05 | ≤ 1.05 | ≤ 1.05 | < 1.1 / < 1.05 / < 1.02 |
| Color misregistration | ≤ 0.35 px | ≤ 0.50 px | ≤ 0.50 px | < 0.33 / < 0.5 / < 0.8 px |
| Geometric distortion | ≤ 2 % | ≤ 2 % | ≤ 4 % | zhruba ±1 až ±3 % měřítkové přesnosti |

---

### 9.8 ISO 19264 jako analytický rámec

ISO 19264-1:2021 popisuje metody pro image quality analysis u reflective originals a vztahuje se na skenery i digitální kamery v oblasti kulturního dědictví.^3 Pro tuto metodiku má význam především v tom, že sjednocuje měření více parametrů v rámci jednoho analytického rámce. Metamorfoze se na ISO 19264-1 výslovně odvolává a má samostatnou část věnovanou vztahu „Metamorfoze and ISO 19264-1(E) 2021.“^2 FADGI ISO 19264 výslovně uvádí mezi relevantními standardy pro digital image conformance evaluation.^1

### 9.9 RAW skeny a zdrojová snímací data

Pojem „RAW sken“ je třeba používat opatrně, protože v praxi může označovat dvě různé situace. U kamerových workflow obvykle znamená senzorová data před demosaicingem a před většinou interpretačních kroků. U skenerů bývá význam méně jednoznačný a často označuje spíše minimálně zpracovaný nebo device-dependent výstup zařízení než skutečně „syrová“ data v úzkém technickém smyslu.^1^,^2

FADGI upozorňuje, že i raw image files ze skenerů a kamer nebývají zcela nezpracované a samy o sobě obvykle nepředstavují obraz, který by odpovídal vzhledu originálu při běžném zobrazení.^1 Z toho plyne důležitý metodický závěr: RAW nebo device-dependent snímací data mohou být cenným zdrojovým materiálem pro budoucí reprocessing, kontrolu workflow nebo výzkumné účely, ale samy o sobě obvykle nepředstavují vhodnou hlavní archivní reprezentaci kulturní předlohy.

V rámci této metodiky se proto doporučuje rozlišovat dvě vrstvy uchování:
- **zdrojová snímací data** (RAW, device-dependent nebo jiná interní pracovní data), pokud jejich uchování dává technický nebo výzkumný smysl,
- **preservation master** jako standardizovaný, interpretovatelný a dlouhodobě použitelný archivní soubor se standardním formátem a embedded ICC profilem.^1^,^2^,^4^,^5

Metamorfoze formuluje preservation master explicitně jako soubor první generace určený k dlouhodobému uchování a další derivaci, přičemž požaduje standardizované parametry formátu, bitové hloubky a barevného prostoru.^2 FADGI současně doporučuje používat pro archivní mastery standardní RGB barevné prostory namísto device-dependent vstupních prostorů.^1 Z těchto důvodů tato metodika nepovažuje samotný RAW sken za náhradu preservation masteru.

Uchování RAW dat může být doporučeno zejména tehdy, když:
- instituce používá kamerový systém, jehož RAW workflow je stabilní a dobře zdokumentované,
- instituce chce zachovat možnost budoucího nového vyvolání nebo nové profilace,
- jde o mimořádně náročný materiál, u nějž může být budoucí reprocessing věcně přínosný,
- existuje dostatečná kapacita pro dlouhodobou správu nejen samotných dat, ale i souvisejících technických metadat a dokumentace workflow.

Naopak není vhodné:
- zaměňovat RAW za hotový preservation master,
- uchovávat RAW bez dokumentace, jak vznikl a jak má být interpretován,
- předpokládat, že device-dependent data budou dlouhodobě srozumitelnější než standardizovaný TIFF master,
- používat RAW jako omluvu pro nekonzistentní nebo nedostatečně standardizované preservation workflow.

Z hlediska institucionální praxe tedy tato metodika doporučuje model „**RAW případně navíc, standardizovaný preservation master vždy**“. To znamená, že pokud instituce uchovává RAW nebo jiná zdrojová snímací data, měla by je chápat jako doplňkovou vrstvu archivace a nikoli jako jedinou nebo hlavní archivní reprezentaci digitalizovaného objektu.^1^,^2

### 9.10 Vybrané technické parametry a jejich interpretace

#### 9.10.1 PPI a sampling rate

V digitalizační praxi je třeba důsledně rozlišovat mezi hodnotou PPI zapsanou v hlavičce souboru, deklarovaným sampling rate a skutečně dosaženým přenosem detailu. Samotná hodnota PPI neříká nic o optické kvalitě systému, o vlivu sharpeningu ani o tom, zda je reálně dosažený sampling v souladu s deklarovaným nastavením.^1^,^2^,^3

Metamorfoze používá pojem required sampling rate a současně sleduje rozdíl mezi claimed a obtained sampling rate, který má být pro Full i Light nejvýše 2 %.^2 FADGI obdobně pracuje s reproduction scale accuracy a se sampling-related SFR metrikami.^1 Z metodického hlediska tedy PPI nepředstavuje samostatný cíl, ale pouze jeden z parametrů širšího systému měření kvality.

#### 9.10.2 PPI vs. DPI

V odborné i provozní praxi bývají pojmy **PPI** a **DPI** často zaměňovány, což vede k nejasnostem při popisu digitalizační kvality. Pro účely této metodiky je vhodné tyto pojmy důsledně rozlišovat.

**PPI (pixels per inch)** označuje hustotu obrazových pixelů v digitálním souboru nebo sampling rate při digitalizaci. V kontextu snímání a hodnocení preservation masteru je to relevantní metrika, protože se vztahuje k digitálnímu obrazu, k jeho deklarovanému nebo dosaženému samplingu a k návazným parametrům typu sampling efficiency, obtained sampling rate nebo reproduction scale accuracy.^1^,^2^,^3

**DPI (dots per inch)** naproti tomu tradičně označuje hustotu tiskových bodů na výstupním zařízení, typicky tiskárně nebo osvitovém systému. Jeden obrazový pixel může být při tisku reprodukován více tiskovými body, takže DPI a PPI nejsou vzájemně zaměnitelné ani početně, ani významově.

Pro digitalizační metodiku je tedy správné používat:
- **PPI** pro snímání, sampling a parametry digitálního obrazu,
- **DPI** pouze tehdy, když se skutečně hovoří o tiskovém výstupu.

Tam, kde starší dokumentace nebo software používá z historických důvodů „dpi“ i pro digitální soubor, je vhodné tento zápis v metodice interpretovat jako nepřesný nebo legacy termín a v nových dokumentech dávat přednost pojmu **ppi**. Zároveň je třeba zdůraznit, že ani správně uvedené PPI samo o sobě neprokazuje kvalitu. O kvalitě rozhoduje až souběh PPI se skutečným přenosem detailu, tedy se SFR/MTF, sampling efficiency a dalšími metrikami.^1^,^2

#### 9.10.3 Color space

Volba barevného prostoru je klíčová pro dlouhodobou interpretovatelnost masteru. FADGI doporučuje pro archivní RGB mastery standardní prostory, například Adobe RGB (1998), ProPhoto nebo eciRGB v2, namísto device-dependent vstupních prostorů.^1 Metamorfoze stanovuje pro Full povinně eciRGB v2, pro Light eciRGB v2 nebo Adobe RGB (1998), pro Extra Light také sRGB IEC61966-2.1.^2

Z hlediska institucionální praxe je důležité, aby instituce neřešila volbu barevného prostoru ad hoc po jednotlivých projektech, ale aby zavedla konzistentní interní politiku. Color space není jen technické metadata pole; je to základní podmínka budoucí reprodukovatelnosti, zobrazení a převoditelnosti.

#### 9.10.4 Color depth / bitová hloubka

Bitová hloubka určuje, s jakou jemností mohou být zapsány tonální a barevné rozdíly. Metamorfoze Full vyžaduje 16 bitů na kanál, zatímco Light a Extra Light standardně 8 bitů; současně však doporučuje 16 bitů pro fotografie a výtvarné předlohy.^2 FADGI doporučuje pracovat co nejdéle ve 48-bit RGB nebo 16-bit grayscale a případné snížení provádět až na konci workflow.^1

V metodice kulturního dědictví je vhodné chápat vyšší bitovou hloubku jako prostředek zachování tonální rezervy a snížení rizika posterizace, zejména u materiálů s jemnými přechody, vyšší denzitou nebo nejistým budoucím užitím.

#### 9.10.5 SFR, MTF a praktické čtení výsledků

SFR a MTF nelze číst izolovaně. SFR10 nebo sampling efficiency vypovídá o tom, jak účinně systém převádí deklarovaný sampling do užitečného detailu. MTF50 vypovídá o chování systému v jiné části frekvenční odezvy a může být významně ovlivněna sharpeningem.^1^,^2

Metamorfoze proto správně nesleduje jen jednu ostrostní metriku, ale celý soubor: difference between claimed and obtained sampling rate, sampling efficiency, MTF50, maximum modulation, color misregistration a geometric distortion.^2 FADGI pracuje obdobně se SFR10, SFR50, sharpening a reproduction scale accuracy.^1 V praxi to znamená, že „dobrá ostrost“ musí být posuzována v kontextu celého snímacího a validačního řetězce, nikoli podle jediného čísla.

---

## 10. Specifika podle typu předloh a formátová politika

### 10.1 Specifika podle typu předloh

#### 10.1.1 Rukopisy a knihy

U rukopisů a knih je zásadní především čitelnost textu, věrnost papírového tónu, stabilní neutralita a kontrola geometrie v oblasti textového bloku a okrajů. Zvláštní pozornost vyžaduje vazba, zakřivení listu, stínování v hřbetu a riziko lokálního neostření v krajích stránky. U těchto předloh je třeba hodnotit nejen formální metriky, ale i konzistenci celého produkčního celku, zejména u rozsáhlých sekvencí stran.^1^,^2

#### 10.1.2 Fotografie

U fotografických předloh má zásadní význam tonální bohatost, přesnost barevného podání, práce ve vyšší bitové hloubce a pečlivé zacházení se světly a stíny. Metamorfoze výslovně doporučuje 16 bitů na kanál pro fotografický materiál a výtvarné předlohy.^2 U historických fotografií je navíc nutné rozlišovat mezi barevným nádechem způsobeným degradací originálu a technickým color castem vzniklým při snímání.

#### 10.1.3 Mapy, plány a technická dokumentace

U map, plánů a technických dokumentů je obvykle zvýšený důraz na geometrickou přesnost, reproduction scale accuracy a rovnoměrný přenos jemných lineárních struktur. Tyto materiály bývají citlivé na lokální zkreslení, neostrost v rozích a chyby měřítka. Samotná dobrá barevná reprodukce zde nestačí, pokud systém nevykazuje dostatečnou metrickou spolehlivost.^1^,^2

#### 10.1.4 Grafiky a výtvarná díla

U grafik a výtvarných předloh je důležitá nejen barevná přesnost, ale i schopnost zachytit povrchovou strukturu, jemné tonální vztahy a subtilní přechody v kresbě nebo malbě. Z metodického hlediska je vhodné preferovat 16bitové workflow, standardní archivní RGB prostor a přísnější vizuální posuzování, protože čistě souhrnné technické metriky nemusí plně vystihnout kvalitu výsledku.^1^,^2

### 10.2 Doporučené výchozí parametry podle typů předloh

Následující tabulky nepředstavují absolutní a univerzálně závazné limity pro všechny instituce a všechny projekty. Jejich účelem je nabídnout výchozí orientační rámec pro interní rozhodování tam, kde instituce potřebuje přenést obecné principy FADGI, Metamorfoze a ISO 19264 do typologicky diferencované praxe. Konkrétní projekt se může od těchto parametrů odchýlit, pokud je odchylka věcně odůvodněná, zdokumentovaná a kompatibilní s cílem preservation masteru.^1^,^2^,^3

#### 10.2.1 Knihy, rukopisy, periodika a běžné archiválie

| Parametr | Doporučené výchozí nastavení | Komentář |
|---|---|---|
| Formát masteru | TIFF 6.0 | bezeztrátový archivní formát |
| Barevný prostor | eciRGB v2 | Adobe RGB možné při zdůvodněném workflow |
| Bitová hloubka | 8 nebo 16 bitů/kanál podle režimu projektu | 16 bitů vhodné u náročnějších předloh |
| Sampling | minimálně 300 ppi | vyšší podle velikosti detailu a typu písma |
| White balance | neutralita bez color castu | kontrolovat samostatně vůči color accuracy |
| Geometrie | vysoká důležitost | zejména textový blok, okraje, tabulky |
| Sharpening | minimální | vyhnout se halo efektům v textu |

#### 10.2.2 Fotografické předlohy

| Parametr | Doporučené výchozí nastavení | Komentář |
|---|---|---|
| Formát masteru | TIFF 6.0 | u interního workflow lze navíc uchovávat RAW |
| Barevný prostor | eciRGB v2 | Adobe RGB jako přijatelná alternativa |
| Bitová hloubka | 16 bitů/kanál | silně doporučeno |
| Sampling | minimálně 300 ppi, často více | podle rozměru a jemnosti detailu |
| White balance | velmi vysoká důležitost | nutno odlišovat degradaci originálu od technického castu |
| Color accuracy | vysoká důležitost | hodnotit spolu s tonalitou |
| Sharpening | velmi opatrný | raději až pro deriváty |

#### 10.2.3 Mapy, plány a technické dokumenty

| Parametr | Doporučené výchozí nastavení | Komentář |
|---|---|---|
| Formát masteru | TIFF 6.0 | priorita metrické stability |
| Barevný prostor | eciRGB v2 | podle projektu lze Adobe RGB |
| Bitová hloubka | 8 nebo 16 bitů/kanál | podle barevné a tonální náročnosti |
| Sampling | minimálně 300 ppi, často více | jemné linie a malé popisy mohou vyžadovat vyšší sampling |
| Reproduction scale accuracy | velmi vysoká důležitost | klíčové pro měřítko a přesnost |
| Geometric distortion | velmi vysoká důležitost | zvlášť u velkoformátových předloh |
| Sharpening | omezený | nesmí deformovat lineární kresbu |

#### 10.2.4 Grafiky a výtvarná díla

| Parametr | Doporučené výchozí nastavení | Komentář |
|---|---|---|
| Formát masteru | TIFF 6.0 | standardní archivní varianta |
| Barevný prostor | eciRGB v2 | široký gamut je žádoucí |
| Bitová hloubka | 16 bitů/kanál | doporučeno |
| Sampling | minimálně 300 ppi, podle detailu více | kresba, textura a jemné přechody mohou vyžadovat vyšší sampling |
| Color accuracy | velmi vysoká důležitost | sledovat i vizuální věrnost |
| Tonalita | velmi vysoká důležitost | důležité zejména u akvarelů, kreseb a fotografických tisků |
| Sharpening | minimální | kvůli zachování přirozeného charakteru povrchu |

#### 10.2.5 Zjednodušené doporučení pro institucionální výchozí nastavení

| Typ předlohy | Color space | Bit depth | Sampling | Poznámka |
|---|---|---|---|---|
| Běžné knihy a archiválie | eciRGB v2 | 8/16 bit | 300 ppi+ | rozhoduje čitelnost, neutralita, geometrie |
| Fotografie | eciRGB v2 | 16 bit | 300 ppi+ | vysoká tonalita a barevná citlivost |
| Mapy a plány | eciRGB v2 | 8/16 bit | 300 ppi+ | priorita geometrie a měřítkové přesnosti |
| Grafiky a výtvarná díla | eciRGB v2 | 16 bit | 300 ppi+ | důležitá tonalita, gamut a vizuální věrnost |

### 10.3 Archivní formáty, JPEG 2000 v rámci NDK a volba preservation masteru

Otázku archivních formátů je třeba formulovat přesněji, než bývá zvykem v běžné provozní zkratce. V odborné praxi totiž nejde jen o to, „jaký formát je správný“, ale o tři odlišné roviny rozhodování:

1. **jaký formát je v dané metodice nebo instituci preferován jako výchozí preservation master při vzniku obrazu,**
2. **jaké formáty jsou touto metodikou nebo normativním rámcem vůbec přípustné,**
3. **jaká archivní reprezentace je v konkrétní instituci nebo infrastruktuře skutečně zvolena pro dlouhodobé uložení a správu.**

Nerozlišování těchto tří rovin vede v praxi k častým nedorozuměním při posuzování vztahu mezi TIFF, JPEG 2000 a dalšími formáty.

#### 10.3.1 TIFF jako preferovaná výchozí varianta preservation imagingu

Metamorfoze výslovně uvádí, že guidelines „assume that preservation masters are primarily created using the TIFF 6.0 uncompressed file format.“^2 Podobně i v širší preservation imaging praxi představuje TIFF nejčastěji preferovaný výchozí formát pro vznik preservation masteru, protože je široce interoperabilní, technicky transparentní a metodicky přímo spjatý se snímacím workflow.^1^,^2

V rámci této metodiky se proto **TIFF 6.0** nadále považuje za **preferovanou výchozí variantu preservation masteru**, zejména tam, kde instituce neváže své workflow na jiný výslovně definovaný národní nebo institucionální standard.

#### 10.3.2 Přípustné alternativy podle Metamorfoze

Zároveň je však nutné výslovně říci, že Metamorfoze nepřipouští pouze TIFF. Pro **Metamorfoze Full a Light** uvádí jako možné formáty při schválení klientem také:
- **TIFF 6.0 with LZW compression,**
- **JP2 (JPEG 2000 Part 1), lossless and lossy,**
- **JPEG.**

Pro **Metamorfoze Extra Light** jsou navíc uvedeny také:
- **PDF/A,**
- **PDF 1.7.**^2

Z toho plyne, že u Metamorfoze není správné tvrdit, že by JPEG 2000 byl pouze okrajovou nebo nelegitimní výjimkou. Přesnější je říci, že **TIFF je preferovaná výchozí forma**, ale **JP2 patří mezi výslovně povolené alternativy**, pokud to odpovídá projektovému rámci a je to klientem schváleno.^2

#### 10.3.3 FADGI a širší formátová politika

FADGI rovněž nepracuje s představou jediného povoleného archivního formátu. V tabulkách pro **Documents (Unbound): General Collections** uvádí jako master file formats **TIFF, JPEG 2000, PDF/A**; u **Oversize Items** uvádí jako master file formats **TIFF, JPEG 2000**.^1

FADGI tedy podporuje širší formátový rámec, v němž je rozhodující spíše to, zda zvolený formát odpovídá typu materiálu, institucionálnímu workflow a kvalitativnímu režimu, než rigidní vazba na jediný kontejner.

#### 10.3.4 NDK a role JPEG 2000 v českém prostředí

V českém prostředí je nutné zohlednit také standardy a metodické postupy spojené s **NDK**. Ty pracují s **JP2** jako s významným archivním formátem a řeší jeho technickou validaci, mapování technických metadat i jeho roli v institucionální infrastruktuře. V pracovních podkladech z prostředí NDK, které byly při přípravě této metodiky konzultovány, se objevuje model **archivních kopií ve formátu JP2 v bezeztrátové kompresi**, včetně validačních nástrojů **JHOVE** a **jpylyzer** a mapování technických metadat pro **TIFF** i **JP2**. Proto je vhodné s JPEG 2000 v českém prostředí počítat jako s reálně používanou archivní reprezentací; před finální verzí metodiky je však vhodné tuto pasáž opřít o přesně identifikované veřejné zdroje z portálu NDK.

Z hlediska této metodiky proto nelze JPEG 2000 v českém institucionálním prostředí redukovat pouze na distribuční formát. V řadě infrastruktur může být **plnohodnotnou archivní reprezentací**, pokud je jeho použití metodicky definováno a technicky kontrolováno.

#### 10.3.5 Bezeztrátový vs. ztrátový JPEG 2000

Metamorfoze připouští u JPEG 2000 jak **lossless**, tak **lossy** variantu.^2 To je důležitá informace, ale současně je třeba ji interpretovat metodicky obezřetně. Ztrátová komprese může být sice v některých projektech nebo režimech přípustná, avšak její dopad na obrazovou kvalitu musí být vždy hodnocen v souvislosti s technickými parametry výsledného obrazu.

V rámci této metodiky se proto doporučuje:
- **pro archivní a preservation účely preferovat lossless JPEG 2000,**
- **lossy JPEG 2000 připustit pouze tehdy, pokud je tento režim výslovně definován v institucionálním nebo projektovém rámci a je zdokumentováno, proč je takové řešení považováno za akceptovatelné.**

#### 10.3.6 Doporučené rozlišení tří úrovní archivního rozhodnutí

Pro redakční i institucionální čistotu je vhodné v metodice rozlišovat tyto formulace:

- **preferovaný formát preservation masteru:** formát, který je v metodice doporučen jako výchozí řešení;
- **povolené archivní alternativy:** formáty, které jsou přípustné podle metodiky, klientského zadání nebo národního rámce;
- **institucionální archivní reprezentace:** formát, který instituce skutečně používá v repozitáři nebo dlouhodobém úložišti.

Takové rozlišení pomáhá předejít falešnému sporu typu „TIFF versus JP2“. V mnoha případech totiž nejde o vzájemně se vylučující alternativy, ale o různé vrstvy téhož archivního ekosystému.

#### 10.3.7 Doporučení této metodiky

Na základě FADGI, Metamorfoze i českého prostředí NDK doporučuje tato metodika následující formulaci:

1. **Výchozí preferovaná varianta při vzniku preservation masteru:**  
   TIFF 6.0, zpravidla s embedded ICC profilem a standardním barevným prostorem.

2. **Přípustné alternativy:**  
   TIFF s bezeztrátovou kompresí, JPEG 2000 (přednostně lossless), případně další formáty tam, kde jsou výslovně předepsány metodikou projektu nebo institucionálním rámcem.

3. **Institucionální archivní reprezentace:**  
   může být TIFF, lossless JP2 nebo kombinace obou, pokud je toto rozhodnutí zdokumentováno, technicky validováno a dlouhodobě udržitelné.

4. **Distribuční a přístupové reprezentace:**  
   mají být metodicky odděleny od otázky preservation masteru, i když mohou v některých infrastrukturách používat tentýž technický formát.

#### 10.3.8 Srovnávací tabulka archivních formátů

| Formát / rámec | Metamorfoze | FADGI | NDK / české prostředí | Doporučení této metodiky |
|---|---|---|---|---|
| TIFF 6.0 uncompressed | preferovaný výchozí formát preservation masteru | běžný master formát | relevantní a podporovaný formát | výchozí preferovaná varianta |
| TIFF 6.0 LZW | povoleno při schválení klientem | obecně kompatibilní s archivní logikou | možné podle workflow | přípustná bezeztrátová alternativa |
| JP2 lossless | povoleno při schválení klientem | uváděno jako master file format | archivní kopie v JP2 je relevantní a validovaná | plně legitimní archivní alternativa |
| JP2 lossy | povoleno při schválení klientem | formálně možné v širším rámci | nutno posuzovat podle konkrétního standardu a rizika | jen při výslovném zdůvodnění |
| PDF/A | u Extra Light povoleno | v některých tabulkách master file format | významné spíše pro dokumentové balíčky a zpřístupnění | nikoli výchozí preservation imaging master |
| JPEG | povoleno v některých režimech Metamorfoze | spíše nearchivní nebo omezené použití | obvykle nevhodné jako hlavní preservation master | pouze výjimečně, pokud to rámec výslovně připouští |

#### 10.3.9 Praktický závěr

Praktickým závěrem této kapitoly je, že **TIFF má být v textu metodiky formulován jako preferovaný výchozí formát preservation masteru, nikoli jako jediný legitimní archivní formát.** JPEG 2000 je třeba vnímat jako metodicky obhajitelnou a v některých institucionálních kontextech plně legitimní archivní reprezentaci. Rozhodující není samotný název formátu, ale to, zda je jeho použití standardizované, zdokumentované, validovatelné a dlouhodobě udržitelné.^1^,^2

### 10.4 Institucionální formátová politika

Vedle samotné volby formátu preservation masteru je vhodné, aby každá instituce formulovala vlastní **institucionální formátovou politiku**. Ta má vyjasnit, jaké formáty instituce používá při vzniku digitálních obrazů, jaké formáty jsou určeny pro dlouhodobé uložení, jaké pro repozitářovou reprezentaci a jaké pro zpřístupnění. Bez takové politiky vzniká riziko, že stejný formát bude v různých projektech chápán různě a bez dostatečné dokumentace.

#### 10.4.1 Minimální otázky, které má formátová politika zodpovědět

Institucionální formátová politika by měla alespoň výslovně stanovit:

- jaký je **preferovaný výchozí formát preservation masteru při vzniku snímku**,
- které formáty jsou **přípustné jako archivní reprezentace**,
- zda instituce rozlišuje mezi **capture masterem**, **archivní kopií**, **repozitářovou reprezentací** a **uživatelským derivátem**,
- jaké formáty a kompresní režimy jsou dovoleny pro **JPEG 2000**,
- jaké validační nástroje a kontrolní mechanismy jsou povinné,
- jak jsou formátová rozhodnutí zapisována do metadat a projektové dokumentace.

#### 10.4.2 Doporučený minimální model

Pro většinu institucí lze jako výchozí model doporučit následující schéma:

| Vrstva objektu | Doporučený formát | Charakteristika |
|---|---|---|
| Původní snímek / capture master | TIFF nebo RAW/TIFF podle systému | primární výstup snímání |
| Preservation master | TIFF 6.0 jako preferovaná varianta | standardizovaný archivní master první generace |
| Archivní kopie / repozitářová reprezentace | lossless JP2 nebo TIFF podle institucionální politiky | dlouhodobé uložení a správa |
| Uživatelský derivát | JP2, JPEG, PDF/A, případně další | zpřístupnění a distribuce |

Tento model není závazný, ale pomáhá vyjasnit role jednotlivých vrstev. Zvlášť důležité je, aby instituce nepoužívala termín „master“ současně pro capture TIFF, archivní JP2 i uživatelskou kopii bez dalšího rozlišení.

#### 10.4.3 Validační a metadata politika ve vztahu k formátům

Formátová politika musí být provázána s politikou validace a metadat. Pokud instituce používá TIFF i JP2, měla by:
- určit, které validační nástroje jsou povinné pro každý formát,
- stanovit, které technické parametry se povinně evidují,
- rozhodnout, jak se zapisují události formátové identifikace, validace a případné migrace,
- definovat, které výstupy z validátorů se archivují a v jaké podobě.

V prostředí repozitářových standardů typu NDK je právě vazba mezi formátem, validací a PREMIS/MIX metadata vrstvou klíčová pro dlouhodobou důvěryhodnost objektu.

#### 10.4.4 Praktické doporučení této metodiky

Tato metodika doporučuje, aby každá instituce přijala krátkou, ale výslovnou formátovou politiku alespoň v následující podobě:

1. **Výchozí formát preservation masteru při vzniku obrazu:** TIFF 6.0, pokud projekt výslovně nestanoví jinak.  
2. **Archivní reprezentace v repozitáři:** TIFF, lossless JP2 nebo kombinace obou podle institucionální infrastruktury.  
3. **Kompresní politika:** lossless jako výchozí režim pro archivní reprezentace; odchylky musí být zdůvodněny.  
4. **Validační politika:** pro TIFF a JP2 používat definované validační nástroje a ukládat výsledky validace.  
5. **Metadata politika:** všechny formátové konverze, validace a identifikace zapisovat do odpovídajících technických a administrativních metadat.

Takto formulovaná politika zajišťuje, že formátové rozhodnutí není jen technickým detailem uvnitř digitalizačního software, ale součástí transparentního institucionálního rámce.

### 10.5 Oděv operátora a prevence odlesků

Vedle parametrů zařízení, osvětlení a targetů může výslednou kvalitu digitální reprodukce ovlivnit také samotné chování operátora v bezprostřední blízkosti snímané předlohy. To platí zejména u materiálů s vyšší odrazivostí, lesklým povrchem, ochrannými fóliemi, fotografickými vrstvami, laminovanými dokumenty nebo předlohami snímanými pod sklem. V těchto situacích může být zdrojem nežádoucích odlesků a barevných reflexů nejen okolní prostředí, ale i oděv operátora.

Z provozního hlediska se proto doporučuje, aby operátor při digitalizaci používal **tmavý, nejlépe matný a vizuálně nenápadný oděv**, který snižuje riziko sekundárních odrazů do obrazového pole. Nevhodné může být zejména:
- bílé nebo velmi světlé oblečení,
- výrazně barevné plochy,
- lesklé materiály,
- reflexní prvky,
- kovové doplňky v blízkosti snímané předlohy.

Toto doporučení je zvlášť důležité u:
- reprografických pracovišť s otevřeným snímáním,
- snímání pod ochranným sklem,
- fotografických předloh s lesklým povrchem,
- výtvarných děl a grafik,
- případů, kdy se operátor při manipulaci pohybuje těsně nad předlohou nebo v odrazové dráze světla.

Z metodického hlediska nejde o okrajový detail, ale o součást širší kontroly prostředí digitalizačního pracoviště. Stejně jako je třeba kontrolovat osvětlení, odrazy od okolních ploch a čistotu optické dráhy, je vhodné považovat také **oděv operátora** za jeden z praktických faktorů, které mohou ovlivnit vizuální čistotu preservation masteru.

Pro interní provozní pravidla lze doporučit jednoduchou formulaci:

**Operátor má při digitalizaci používat tmavý, matný a nereflexní oděv, zejména při snímání lesklých, fotografických nebo jinak odrazivých předloh, aby se minimalizovalo riziko odlesků a parazitních reflexů v digitální reprodukci.**

---

## 11. Workflow tvorby preservation masteru

1. Příprava instituce, zařízení a předlohy.  
2. Kontrola prostředí a ověření kalibračního stavu zařízení.  
3. Snímání a vyhodnocení technického targetu.  
4. Nastavení white balance, expozice a základních parametrů snímání.  
5. Ověření neutrality, tonality a základní barevné správnosti.  
6. Capture originálu ve vysoké bitové hloubce.  
7. Řízená profilace a konverze do standardního archivního RGB prostoru.  
8. Uložení preservation masteru ve standardním formátu s embedded ICC profilem.  
9. Objektivní a vizuální kontrola kvality.  
10. Tvorba derivátů až z validovaného preservation masteru.^1^,^2

---

## 12. Kontrola kvality, QA protokol a provozní doporučení

FADGI doporučuje vytvořit quality monitoring system založený na digital image conformance evaluation a vést záznamy kvality i kvantity.^1 Metamorfoze rozlišuje denní a týdenní targety a výslovně uvádí, že preservation master musí být hodnocen analyzováním více technických image criteria ve správném pořadí.^2

Z toho pro interní praxi plyne minimálně toto:

- na začátku snímací session nebo dávky snímat a vyhodnotit target,
- po aktualizaci software/driverů znovu charakterizovat zařízení,
- při podezření na problém opakovat conformance test,
- vést průběžný záznam o white balance, color accuracy, SFR/MTF, misregistration a geometrii,
- neměnit workflow po potvrzení konformity bez nového testování.^1^,^2

---

## 13. Přílohy

### Příloha A. Návrh protokolu měření: denní technická kontrola

**Účel:** ověřit, že systém je před zahájením digitalizace v konformním stavu.

**Minimální položky protokolu:**
- datum a čas měření,
- identifikace instituce,
- operátor,
- zařízení, objektiv / skenerová hlava,
- verze capture software,
- použitý ICC workflow,
- použitý target,
- pozice targetu,
- white balance výsledek,
- exposure / ΔL*,
- color accuracy,
- sampling efficiency / SFR10,
- MTF50,
- max modulation,
- color misregistration,
- geometric distortion,
- vyhodnocení: prošel / neprošel,
- nápravné opatření.

### Příloha B. Návrh protokolu měření: týdenní / periodická rozšířená kontrola

**Rozšířené položky oproti denní kontrole**
- kontrola rovnoměrnosti osvětlení v obrazovém poli,
- ověření neutrality v různých částech obrazu,
- reproduction scale accuracy,
- kontrola targetů na fyzické poškození a znečištění,
- kontrola monitoru a data poslední kalibrace,
- revize změn ve workflow od poslední kontroly,
- podpis odpovědné osoby za QA.

### Příloha C. Doporučené targety

| Oblast testu | Doporučené targety | Poznámka |
|---|---|---|
| Color accuracy | ColorChecker Digital SG / DCSG | s odpovídajícím L*a*b* referenčním souborem |
| White balance / neutralita | UTT, DCSG, Golden Thread target | důležité sledovat i neutrální pole |
| SFR / MTF / sampling efficiency | QA-62 MTF test target, Golden Thread FADGI 19264 target | podle workflow a použitého analyzačního software |
| Geometrie / měřítko | QA-2 Metric a další metrické targety | pro scale accuracy i lokální zkreslení |
| Rovnoměrnost / color cast | frame-filling white sheet, UTT | vhodné pro více míst v obrazovém poli |

### Příloha D. Povolené a doporučené targety

Za doporučené se považují targety, které:
- mají jasně dohledatelný původ a referenční data,
- jsou kompatibilní s používaným analyzačním softwarem,
- odpovídají měřené metrice,
- jsou fyzicky v dobrém stavu a nejsou znečištěné nebo degradované,
- jsou používány konzistentně v rámci projektu.^1^,^2

Za nevhodné nebo nepřípustné se považují targety:
- bez spolehlivých referenčních hodnot,
- poškozené, vyšisované nebo neudržované,
- používané mimo svůj určený účel,
- zaměňované mezi workflow bez validace s používaným softwarem.

### Příloha E. Doporučený software

| Oblast | Doporučený typ software | Poznámka |
|---|---|---|
| Capture | software výrobce zařízení nebo validovaný snímací software instituce | musí podporovat stabilní a dokumentovaný workflow |
| QA analýza | software kompatibilní s ISO 19264 / FADGI / Metamorfoze targety | klíčová je konzistence a validace měření |
| Správa barev / profilace | ICC-kompatibilní software pro profilaci vstupu a konverzi | musí umožňovat kontrolu embedded profilů a řízenou konverzi |
| Obrazová kontrola a editace | Adobe Photoshop nebo ekvivalent s plnou ICC správou | pouze pro kontrolované a zdokumentované operace |
| Metadata / archivace | software podporující technická a administrativní metadata | musí být napojen na institucionální workflow |

### Příloha F. Minimální doporučené nastavení software

**Capture software**
- vypnout nezdokumentované automatické korekce,
- evidovat sharpening, noise reduction a tonal corrections,
- udržovat konzistentní nastavení mezi dávkami.

**QA software**
- používat stejné referenční soubory pro stejné targety,
- neměnit výpočetní režimy bez validace,
- archivovat exporty výsledků měření.

**Obrazový editor**
- preserve embedded profiles,
- warnings on profile mismatch / missing profile,
- nepoužívat profil monitoru jako pracovní prostor,
- odlišovat assign profile a convert to profile.

---

### Příloha G. Jednoduchý textový protokol z validačního software

Tato příloha předpokládá, že validační software standardně exportuje tabulku nebo report s měřenými hodnotami, které lze převést do textového dokumentu bez zásahu do samotných dat.

**Doporučená minimální textová podoba protokolu**

**Identifikace měření**
- datum a čas
- instituce
- operátor
- zařízení
- verze software
- identifikace targetu
- soubor / dávka

**Naměřené hodnoty**
- white balance
- exposure / ΔL*
- mean color accuracy
- upper metric (max nebo 90th percentile podle metodiky)
- claimed sampling rate
- obtained sampling rate
- sampling efficiency / SFR10
- MTF50
- maximum modulation
- color misregistration
- geometric distortion

**Vyhodnocení**
- splněno / nesplněno
- stručný komentář
- navržené nápravné opatření

Tento formát je vhodný tam, kde instituce nechce nebo nemůže archivovat proprietární QA report ve finální podobě, ale chce zachovat čitelný a dlouhodobě srozumitelný textový záznam.

### Příloha H. Jednoduchý souhrnný protokol pro textový dokument

**Název projektu:**  
**Signatura / identifikátor objektu:**  
**Datum měření:**  
**Operátor:**  
**Zařízení a workflow:**  

**Použitý target a validace referenčních dat:**  
...  

**Souhrn výsledků:**  
- White balance:...  
- Exposure:...  
- Color accuracy:...  
- Sampling efficiency / SFR10:...  
- MTF50:...  
- Max modulation:...  
- Color misregistration:...  
- Geometric distortion:...  

**Celkové posouzení:**  
...  

**Rozhodnutí:**  
- preservation master přijat / vrácen k nápravě

### Příloha I. Doporučení k transformaci SW výstupů do textového protokolu

Při převodu výstupů validačního software do textového dokumentu se doporučuje:
- zachovat původní názvy metrik nebo uvést jejich jasný ekvivalent,
- nepřepisovat numerické hodnoty bez kontroly jednotek,
- uvést, zda jde o mean, maximum, percentile nebo jiný typ horní metriky,
- zaznamenat verzi software a verzi referenčního target datasetu,
- přiložit nebo archivovat i původní export, pokud je to technicky možné.

Smyslem textového protokolu není nahradit originální report, ale vytvořit dlouhodobě srozumitelnou, citovatelnou a institucionálně přenositelnou podobu validačního výsledku.^1^,^2

---

## 14. Závěr

Tvorba preservation masterů kulturního dědictví vyžaduje propojení technické disciplíny, odborného úsudku a institucionální odpovědnosti. Nestačí dosáhnout pouze nominálně vysokého rozlišení nebo obrazu, který na první pohled působí přesvědčivě. Rozhodující je, zda je digitální reprezentace standardizovaná, měřitelná, barevně interpretovatelná, dokumentovaná a dlouhodobě důvěryhodná.^1^,^2^,^3

---

## 15. Odkazy na přílohy v této verzi

Pro lepší orientaci se v této verzi doporučuje používat v hlavním textu tyto ustálené odkazy:

- **Příloha A** – ICC profily, barevné prostory a související výkladové schéma
- **Příloha B** – TIFF 6.0 a související technické minimum

## 16. Redakční a terminologické zásady této verze

Tato redakce vychází ze sloučení obsahu předchozích verzí 0.1.2 a 0.1.3 do jedné pracovní verze.

V této verzi dokumentu jsou některé mezinárodně ustálené odborné termíny ponechány v angličtině, pokud pro ně v českém prostředí neexistuje jednoznačně přijatý a současně dostatečně přesný ekvivalent. Týká se to zejména termínů *preservation master*, *workflow*, *RAW*, *white balance*, *color cast*, *sampling efficiency*, *sharpening* nebo *rendering intent*. Tam, kde je to možné, jsou tyto termíny v textu průběžně doprovázeny českým výkladem nebo zasazeny do české větné stavby.

Dokument se současně snaží důsledně rozlišovat mezi:
- normativním rámcem mezinárodních norem,
- metodickými doporučeními typu FADGI a Metamorfoze,
- a interním institucionálním rozhodnutím, které z těchto zdrojů vychází, ale musí být vždy výslovně formulováno.

Tabulky v této verzi mají orientační a rozhodovací funkci. Nenahrazují plný výklad v hlavním textu, ale slouží jako rychlá referenční vrstva pro provozní praxi a připomínkové řízení.

V této verzi 0.2.3 byly oproti verzi 0.2.2 provedeny pouze omezené redakční zásahy. Hlavní změnou je doplnění stručného výkladu rozdílu mezi **matrix/TRC** a **LUT** profily v rámci ICC workflow a sjednocení číslování hlavních kapitol v závěrečné části dokumentu.

---

## 17. Poznámka k bibliografii

Bibliografie v této verzi plní dvojí funkci: jednak identifikuje hlavní normativní a metodické opory dokumentu, jednak slouží jako pracovní základ pro budoucí zpřesnění citačního aparátu. U mezinárodních dokumentů je zápis stabilnější; u některých českých metodických materiálů, zejména v prostředí NDK, je vhodné v další fázi doplnit definitivní bibliografické údaje podle zvoleného citačního standardu a podle způsobu, jakým budou tyto dokumenty v instituci evidovány.

---

## Příloha A. ICC profily a barevné prostory

### A.1 Účel této přílohy

Tato příloha rozšiřuje hlavní metodický text o souvislejší vysvětlení role ICC profilů, pracovních barevných prostorů a jejich praktických důsledků pro digitalizaci kulturního dědictví. Jejím cílem není nahradit specializované dokumenty ICC, ECI ani Adobe, ale nabídnout institucionálně použitelný výklad, který propojuje teorii barevného řízení s praxí preservation masterů.

Diagramy v této příloze jsou záměrně **schematické**. Nejde o plnou kolorimetrickou analýzu ani o přesné geometrické rekonstrukce gamutů. Mermaid zde slouží jako čitelná textová vrstva pro metodický dokument.

### A.2 ICC profil a barevný prostor nejsou totéž

ICC profil je standardizovaný datový popis, který umožňuje interpretovat barevná data a převádět je mezi zdrojovým a cílovým prostředím. Profil nefunguje jako „vylepšovač obrazu“, ale jako popis významu číselných hodnot a transformačních pravidel mezi barevnými reprezentacemi.

Barevný prostor je naopak definovaný systém, v němž mají obrazová data význam. V praxi je nutné odlišovat:
- profil zařízení,
- profil monitoru,
- pracovní RGB prostor,
- výstupní nebo tiskový prostor.

### A.3 PCS, CIE XYZ a CIE Lab

ICC workflow používá **PCS (Profile Connection Space)** jako mezilehlý referenční prostor, přes který se provádějí převody mezi zdrojem a cílem. V klasickém ICC modelu jde o prostor založený na **CIE XYZ** nebo **CIE Lab**.

Pro účely metodiky je důležité rozumět rozdílu mezi těmito vrstvami:
- **CIE XYZ** je kolorimetrický referenční model,
- **CIE Lab** je device-independent prostor navržený tak, aby byl přibližně perceptuálně uniformní,
- **RGB pracovní prostory** jsou praktické kódovací prostory pro editaci, ukládání a výměnu obrazů.

### A.4 Schéma vztahu mezi zdrojem, pracovním RGB prostorem, PCS a cílem

```mermaid
flowchart LR
    A[Zdrojová data]
    B[Pracovní RGB prostor]
    C[PCS]
    D[Cílový výstup]

    A -->|konverze| B
    B -->|CMM| C
    C -->|rendering intent| D
```

**Legenda:** PCS = Profile Connection Space; CMM = Color Management Module. PCS je referenční mezivrstva ICC workflow, typicky CIE XYZ nebo CIE Lab. CMM je modul, který provádí barevnou transformaci mezi profily.

**Smysl schématu je jednoduchý:** pracovní RGB prostor není totéž co profil monitoru ani totéž co profil zařízení. ICC workflow používá PCS jako referenční mezivrstvu pro řízené převody mezi zdrojem a cílem.

### A.5 Gamut a vztah k lidskému vidění

Gamut barevného prostoru vyjadřuje množinu barev, které lze v daném prostoru reprezentovat. Různé RGB prostory mají různě velký gamut a různý tvar v kolorimetrických diagramech. To má praktické důsledky při převodech, při editaci i při volbě pracovního prostoru.

Je užitečné rozlišovat tři tvrzení, která se v praxi často směšují:
1. větší gamut není automaticky „věrnější“,
2. menší gamut může být pro některé workflow stabilnější,
3. žádný běžný RGB pracovní prostor není totožný s plným rozsahem lidského vidění.

### A.6 Schematické srovnání vybraných RGB prostorů

```mermaid
mindmap
  root((Pracovní RGB prostory))
    sRGB
      nejběžnější distribuce
      web a běžné displeje
      menší gamut
      vhodné pro deriváty
    Adobe_RGB
      širší gamut než sRGB
      profesionální editace
      tisková workflow
      gamma 2.2
    eciRGB_v2
      doporučený pracovní prostor ECI
      silná vazba na archivní workflow
      D50
      L-star orientovaná tone response
    ProPhoto_RGB
      velmi široký gamut
      náročná fotografická editace
      vyšší nároky na disciplínu workflow
```

### A.7 Matrix/TRC a LUT v praktické správě barev

Vedle rozdílů mezi samotnými pracovními prostory je vhodné rozlišovat také rozdíl mezi **typem profilu** a **typem pracovního prostoru**. Standardní RGB prostory, jako **sRGB**, **Adobe RGB (1998)** nebo **eciRGB v2**, jsou typicky reprezentovány jako relativně jednoduché **matrix/TRC profily**. To znamená, že jejich chování lze popsat pomocí primárek, bílého bodu a tónových přenosových křivek.

Naproti tomu profily konkrétních zařízení — zejména vstupních a výstupních — mohou být vytvářeny jako **LUT profily**, pokud je třeba zachytit složitější a méně lineární barevné chování. LUT profil může být přesnější, ale současně bývá méně názorný a více závislý na kvalitě konkrétní profilace.

Pro tuto metodiku je proto důležité nezaměňovat:
- **standardní pracovní RGB prostor**, který slouží k ukládání a dlouhodobé interpretaci preservation masteru,
- a **vstupní profil zařízení**, který má co nejlépe charakterizovat konkrétní snímací řetězec.

Jinými slovy: preservation master může být uložen v dobře definovaném standardním RGB prostoru, i když samotná vstupní profilace zařízení využívá LUT charakterizaci.

### A.8 Tone response, gamma a L\*

Pracovní RGB prostory se neliší jen gamutem, ale také **tone response curve**, tedy přenosovou charakteristikou. V běžném provozu se to často zjednodušeně označuje jako „gamma“, i když přesnější popis může být složitější než jediná mocninná hodnota.

- **sRGB** používá standardizovanou přenosovou charakteristiku určenou pro běžné zobrazovací workflow.
- **Adobe RGB (1998)** používá přenosovou charakteristiku odpovídající jednoduchému gamma modelu 2.2.
- **eciRGB v2** je podle ECI doporučený pracovní prostor s tone response založenou na přístupu odvozeném od **L\***, nikoli na běžné jednoduché gamma křivce.
- **ROMM / ProPhoto RGB** pracuje s velmi širokým gamutem a historicky se váže k gamma 1.8.

### A.9 Schematické srovnání tonálního chování

```mermaid
xychart-beta
    title "Schematické srovnání tone response / přenosových křivek"
    x-axis "Relativní lineární světlo" 0 --> 1
    y-axis "Zakódovaná hodnota" 0 --> 1
    line "sRGB TRC" [0.00, 0.20, 0.48, 0.67, 0.82, 0.93, 1.00]
    line "Gamma 2.2 (Adobe RGB)" [0.00, 0.18, 0.45, 0.64, 0.79, 0.91, 1.00]
    line "Gamma 1.8 (ROMM / ProPhoto)" [0.00, 0.24, 0.51, 0.69, 0.83, 0.93, 1.00]
    line "L* odvozená křivka (eciRGB v2)" [0.00, 0.27, 0.52, 0.70, 0.84, 0.93, 1.00]
```

Tento diagram je pouze orientační. Má ukázat rozdíl mezi jednoduchými gamma křivkami a L\*-odvozeným chováním, ne přesnou matematickou definici jednotlivých TRC.

### A.10 D50 a D65

Volba bílého bodu souvisí s tím, k jakému referenčnímu prostředí je pracovní prostor orientován.

- **D65** je běžný pro zobrazovací a monitorová workflow, například u sRGB a Adobe RGB.
- **D50** je běžný v tiskových a některých archivních workflow a používá se například u eciRGB v2 a ROMM/ProPhoto RGB.

```mermaid
flowchart TB
    A["Bílé body"]
    A --> B["D65"]
    A --> C["D50"]

    B --> B1["sRGB"]
    B --> B2["Adobe RGB (1998)"]

    C --> C1["eciRGB_v2"]
    C --> C2["ROMM / ProPhoto RGB"]
```

### A.11 Dokumentový, fotografický a tiskový workflow

Stejné snímání může vést k různým následným rozhodnutím podle toho, zda je cílem čitelný dokumentový derivát, fotograficky věrný master nebo příprava na konkrétní tiskový výstup.

```mermaid
flowchart TB
    A[Snímání]

    A --> B[Dokumentový cíl]
    A --> C[Fotografický cíl]
    A --> D[Tiskový cíl]

    B --> B1[Preservation master]
    B1 --> B2[sRGB derivát / PDF / web]

    C --> C1[16bit RGB master]
    C1 --> C2[Širší gamut / prezentační deriváty]

    D --> D1[RGB master]
    D1 --> D2[Softproof / tiskový výstup]
```

### A.12 Praktické srovnání pracovních prostorů

| Prostor | Typické použití | Silná stránka | Riziko / omezení |
|---|---|---|---|
| sRGB | web, běžné zobrazení, deriváty | široká kompatibilita | menší gamut a menší rezerva |
| Adobe RGB (1998) | profesionální editace, tisk, některé mastery | dobrý kompromis mezi rozsahem a stabilitou | na necitlivých systémech hrozí chybná interpretace |
| eciRGB v2 | archivní a kvalitní workflow | silná metodická volba pro paměťové instituce | vyšší nároky na důsledné ICC workflow |
| ROMM / ProPhoto RGB | náročná fotografická editace | velmi široký gamut | větší riziko chyb v méně kontrolovaném prostředí |

### A.13 Stručný slovník pojmů

**CIE**  
Commission Internationale de l'Éclairage. Mezinárodní komise pro osvětlování, která vytvořila základní kolorimetrické modely a standardy používané v ICC workflow i v popisu barevných prostorů.

**CIE 1931**  
Základní kolorimetrický systém zavedený v roce 1931, z něhož vychází zejména CIE XYZ a dvourozměrný diagram chromatičnosti x,y.

**CIE 1976**  
Soubor pozdějších CIE úprav, který zahrnuje mimo jiné prostor CIE L\*a\*b\* a další perceptuálně užitečnější reprezentace.

**CIE 2000**  
Obvykle zkratka pro novější způsob vyjadřování barevné odchylky Delta E 2000 (CIEDE2000).

**CIE 2000 SL1**  
Způsob použití metriky CIEDE2000, při němž jsou parametry váhování nastaveny na standardní hodnoty 1. V Metamorfoze se tento zápis používá při hodnocení color accuracy.

**CIE Lab**  
Zařízení-nezávislý kolorimetrický prostor navržený tak, aby vzdálenosti mezi body přibližně odpovídaly vizuálním rozdílům.

**L\***  
Složka v prostoru CIE Lab reprezentující světlost.

**a\***  
Složka v prostoru CIE Lab vyjadřující osu mezi zelenou a červenou.

**b\***  
Složka v prostoru CIE Lab vyjadřující osu mezi modrou a žlutou.

**D50**  
Standardní referenční bílý bod odpovídající přibližně 5000 K.

**D65**  
Standardní referenční bílý bod odpovídající přibližně 6500 K.

**PCS**  
Profile Connection Space. Referenční mezivrstva ICC workflow, přes kterou se provádějí převody mezi zdrojovým a cílovým profilem.

**Gamma**  
Zjednodušený popis přenosové křivky mezi lineárním světlem a zakódovanou hodnotou.

**TRC**  
Tone Response Curve. Přenosová charakteristika barevného prostoru nebo zařízení.

**Gamut**  
Soubor barev, které lze v daném barevném prostoru nebo zařízení reprezentovat.

**LUT**  
Look-Up Table. Tabulkový způsob popisu nebo transformace barev, používaný zejména u složitějších ICC profilů zařízení.

### A.14 Doporučení této metodiky

Na základě FADGI, Metamorfoze, ICC a ECI lze pro institucionální digitalizační praxi formulovat toto doporučení:

1. pro preservation master preferovat standardní, zařízení-nezávislý pracovní prostor,
2. za výchozí volbu považovat eciRGB v2,
3. Adobe RGB (1998) připustit jako legitimní alternativu v dobře zdokumentovaném workflow,
4. sRGB používat primárně pro deriváty, zpřístupnění a běžné zobrazovací scénáře,
5. pracovat s ICC profily jako s nástrojem interpretace a konverze, nikoli jako s náhradou za správně nastavené snímání a kalibraci.

### A.15 eciRGB v2 v praxi mimo paměťové instituce

Tato metodika preferuje eciRGB v2 z důvodů metodických a standardizačních, nikoli proto, že by šlo o dominantní praktický standard ve veškerém komerčním prostředí. ECI jej výslovně uvádí jako pracovní barevný prostor doporučený ECI, což je silná opora pro evropský standardizační a archivní kontext. Současně však nelze bez dalšího tvrdit, že je eciRGB v2 běžnější než Adobe RGB v širším profesionálním kreativním workflow.

Adobe dokumentace ukazuje, že v běžném Adobe prostředí jsou nejviditelnější především **sRGB**, **Adobe RGB (1998)** a **ProPhoto RGB**. Photoshop obecně doporučuje volit jako RGB working space spíše Adobe RGB nebo sRGB než profil konkrétního zařízení. Camera Raw mezi standardními prostory uvádí Adobe RGB (1998), ColorMatch RGB, ProPhoto RGB a sRGB. Lightroom Classic používá Adobe RGB v některých modulech a ProPhoto RGB v modulu Develop. To podporuje opatrný závěr, že mimo specializované standardizační a paměťové prostředí je eciRGB v2 pravděpodobně méně rozšířený než Adobe RGB (1998).

Pro tuto metodiku je proto vhodné formulovat doporučení takto: **eciRGB v2 je preferovaná volba pro preservation workflow této metodiky, zatímco Adobe RGB (1998) je uznána jako legitimní a v širší profesionální praxi často běžnější alternativa.**

### A.16 Praktický závěr

Pro potřeby této metodiky je zásadní, že ICC profil a pracovní barevný prostor nejsou totéž co profil monitoru ani totéž co profil konkrétního snímacího zařízení. Správná archivní praxe nespočívá v „uložení všeho v profilu skeneru“, ale ve standardizovaném, zařízení-nezávislém RGB workflow, které umožňuje dlouhodobou interpretovatelnost, kontrolovanou konverzi a důvěryhodnou archivaci.

## Příloha B. TIFF 6.0 – základní technické minimum pro tuto metodiku

### B.1 Účel této přílohy

Tato příloha neslouží jako úplný opis nebo náhrada TIFF 6.0 specification. Jejím cílem je shrnout základní technické body, které jsou pro digitalizační metodiku prakticky důležité, a současně odkázat na dva referenční zdroje:

1. **TIFF Revision 6.0. Final — June 3, 1992**  
2. **LibTIFF Coverage of the TIFF 6.0 Specification**

První dokument představuje základní technickou specifikaci formátu. Druhý je užitečný jako praktický implementační přehled, který ukazuje, jaké části specifikace jsou pokryty v běžně používané open-source knihovně libtiff.

### B.2 Co TIFF 6.0 pro tuto metodiku znamená

Z hlediska této metodiky je TIFF především:

- **rastrový obrazový formát** vhodný pro ukládání master obrazových souborů,
- **tagově orientovaný formát**, v němž je význam obrazu a jeho technických parametrů popsán pomocí definovaných tagů,
- formát podporující **různé barevné režimy, komprese a metadata vrstvy**,
- formát, který je dlouhodobě dobře čitelný v archivním a paměťovém prostředí.

Pro preservation workflow je důležité, že TIFF není jen „obraz v kontejneru“, ale strukturovaný formát, jehož technická interpretace závisí na správné kombinaci dat a tagů.

### B.3 Prakticky důležité oblasti TIFF 6.0

Pro digitalizační metodiku kulturního dědictví jsou v TIFF 6.0 nejdůležitější zejména tyto oblasti:

#### a) Struktura souboru a IFD

TIFF používá strukturu založenou na **Image File Directories (IFD)**. To je důležité, protože technické vlastnosti obrazu nejsou „někde implicitně“, ale jsou popsány pomocí záznamů a tagů navázaných na konkrétní obrazovou reprezentaci.

#### b) Tagy

TIFF 6.0 definuje řadu tagů, které popisují například:
- rozměry obrazu,
- bitovou hloubku,
- kompresi,
- fotometrickou interpretaci,
- rozlišení,
- organizaci dat,
- stripy nebo tiles,
- textové a další doprovodné informace.

Z metodického hlediska je důležité, že správná interpretace TIFF souboru závisí právě na těchto tagách, nikoli pouze na příponě souboru.

#### c) Komprese

TIFF 6.0 umožňuje více kompresních režimů. Pro tuto metodiku je důležité především rozlišovat:
- **nekomprimovaný TIFF**,
- **bezeztrátově komprimovaný TIFF**,
- a takové režimy, které by nebyly vhodné pro preservation master bez výslovného zdůvodnění.

V hlavním textu metodiky je TIFF 6.0 chápán jako preferovaný výchozí formát preservation masteru; konkrétní kompresní politika se však má řídit institucionálními pravidly a validací workflow.

#### d) Stripy a tiles

TIFF podporuje ukládání dat po **stripech** i po **tiles**. To je technicky důležité zejména pro:
- práci s velkými obrazy,
- interoperabilitu mezi softwarem,
- výkon při čtení a zpracování,
- některé validační a repozitářové postupy.

#### e) Barevná interpretace a bitová hloubka

TIFF může nést data v různých barevných režimech a s různou bitovou hloubkou. Pro preservation master je však rozhodující nikoli samotný TIFF jako kontejner, ale:
- jaká barevná data nese,
- jaká je jejich bitová hloubka,
- jaká je fotometrická interpretace,
- a zda je workflow doplněno o správný ICC profil nebo jinou odpovídající barevnou charakterizaci.

### B.4 Co z toho plyne pro preservation master

Pro tuto metodiku je vhodné chápat TIFF 6.0 takto:

- TIFF je **doporučený výchozí kontejner** pro preservation master,
- samotné označení „TIFF“ ale **automaticky nezaručuje správnost nebo archivní vhodnost**,
- archivně důležitá je vždy konkrétní kombinace:
  - struktury souboru,
  - tagů,
  - komprese,
  - bitové hloubky,
  - barevného prostoru,
  - embedded profilu nebo jiné barevné charakterizace,
  - a výsledku validace.

Jinými slovy: **správný preservation master není dán jen tím, že jde o TIFF, ale tím, že jde o metodicky správně vytvořený a interpretovatelný TIFF.**

### B.5 Praktické využití libtiff coverage

Stránka **LibTIFF Coverage of the TIFF 6.0 Specification** je pro tuto metodiku užitečná zejména jako praktický doplněk. Nepředstavuje náhradu původní specifikace, ale pomáhá rychle zjistit:

- které části TIFF 6.0 jsou v libtiff pokryty,
- jaké tagy a funkce jsou podporovány,
- které oblasti mohou být omezené nebo implementačně specifické.

To je cenné zejména pro:
- správce workflow,
- vývoj a testování validačních nástrojů,
- kontrolu interoperability,
- a technické pracovníky zodpovědné za dlouhodobou správu obrazových souborů.

### B.6 Praktický závěr

Pro běžnou institucionální praxi není nutné, aby každý operátor studoval plnou TIFF 6.0 specification. Je však vhodné, aby:

- metodika vycházela z jejích základních principů,
- správci workflow a validace znali specifikaci podrobněji,
- a instituce měla jasně definováno, jaké varianty TIFF jsou v jejím preservation workflow přípustné.

## 18. Bibliografie

Aldus Corporation. *TIFF Revision 6.0. Final — June 3, 1992*. Autor/editor/arbitrátor: Steve Carlsen. Volně dostupné PDF přes veřejný dokumentový server ITU.

LibTIFF Project. *LibTIFF Coverage of the TIFF 6.0 Specification*. Dokumentace LibTIFF 4.7.1.

Federal Agencies Digital Guidelines Initiative. *Technical Guidelines for Digitizing Cultural Heritage Materials: Creation of Raster Image Files*. 3rd ed. Washington, DC: FADGI, 2023.

International Color Consortium. *RGB Workflow*. ICC White Paper 23. International Color Consortium.

International Color Consortium. *The Role of ICC Profiles*. ICC White Paper 7. International Color Consortium.

International Organization for Standardization. *ISO 19264-1:2021 Photography—Archiving Systems—Image Quality Analysis—Part 1: Reflective Originals*. Geneva: ISO, 2021.

Kočišová, Pavlína, Zdeněk Vašek, Václav Jiroušek, Vojtěch Kopský, Jan Bilwachs, Filip Pavčík a Petr Cajthaml. *Zachováno navěky? Teorie a praxe dlouhodobého uchování digitálních dokumentů*. Praha: Národní knihovna České republiky, 2023.

Van Dormolen, Hans. *Metamorfoze Preservation Imaging Guidelines: Image Quality*. Version 2.0. The Hague: Metamorfoze, April 2025.

---

## 19. Poznámky

1. Federal Agencies Digital Guidelines Initiative, *Technical Guidelines for Digitizing Cultural Heritage Materials: Creation of Raster Image Files*, 3rd ed. (Washington, DC: FADGI, 2023).
2. Hans van Dormolen, *Metamorfoze Preservation Imaging Guidelines: Image Quality*, version 2.0 (The Hague: Metamorfoze, April 2025).
3. International Organization for Standardization, *ISO 19264-1:2021 Photography—Archiving Systems—Image Quality Analysis—Part 1: Reflective Originals* (Geneva: ISO, 2021).
4. International Color Consortium, *The Role of ICC Profiles*, ICC White Paper 7.
5. International Color Consortium, *RGB Workflow*, ICC White Paper 23.
6. Pavlína Kočišová et al., *Zachováno navěky? Teorie a praxe dlouhodobého uchování digitálních dokumentů* (Praha: Národní knihovna České republiky, 2023).
