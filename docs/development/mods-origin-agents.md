# Nakladatelé a výrobci v MODS jednosvazkové monografie

Pět pravidel `metadata/mods-origin-agents` navazuje na [původ a místa vydání](mods-origin.md). Popisuje agent, namePart, role a roleTerm pod přímým originInfo záznamu svazku jednosvazkové monografie. Nejde o autory v top-level name, tematická jména v subject, relatedItem ani původce digitalizace v PREMIS.

## Podklady

- [DMF Monografie 2.3](https://standardy.ndk.cz/ndk/standardy-digitalizace/DMF_monografie_2.3_final.pdf), § 7.4.1.3, s. 52, řádky agent až roleTerm.
- [MODS XSD 3.8](https://www.loc.gov/standards/mods/v3/mods-3-8.xsd), originInfoDefinition, agent, nameDefinition, namePartDefinition, roleDefinition, roleTermDefinition a zděděné textové typy.
- [MARC 260](https://www.loc.gov/marc/bibliographic/bd260.html), September 2011, podpole $b/$f; [MARC 264](https://www.loc.gov/marc/bibliographic/bd264.html), July 2022, druhý indikátor a $b.
- [MODS User Guidelines: originInfo/agent](https://www.loc.gov/standards/mods/userguide/origininfo.html), část agent: zavedení v MODS 3.8 a vztah k publisher.

Ověřeno 7. 10. 2026, včetně vizuální kontroly tabulky DMF. Národní požadavek, obecné schéma, interpretace nejasnosti a stav vzorového SIP jsou rozlišeny.

## Pět pravidel

Prefix je `NDK-MONO-MODS-SINGLE-`.

| Pravidlo | Obsah | Povinnost |
|---|---|---|
| ORIGIN-AGENT | Dostupný agent; samostatný výskyt pro každého vydavatele | MA |
| ORIGIN-AGENT-NAME | Jméno uvnitř použitého agent | M |
| ORIGIN-AGENT-ROLE | Dostupná role mimo 264_4 | MA |
| ORIGIN-AGENT-ROLE-TERM | Povinné pojmenování použité role; nejasný zápis distributora | M, status ambiguous |
| ORIGIN-COPYRIGHT-NO-ROLE | Vynechání role pro zdrojové 264_4 | Slovní zákaz |

Dvě MA a dvě M přebírají kódy tabulky. Zákaz má obligation_source=prose bez domyšleného kódu. Povinné potomky kontrolujeme uvnitř použitého kontejneru: MA agent neoslabuje M namePart a MA role neoslabuje M roleTerm. Elementy jsou opakovatelné; maximum jednoho výskytu se nedomýšlí.

## Jméno, opakování a zdrojové pole

Agent označuje entitu související s vydáním či výrobou předlohy. Pro více vydavatelů z opakovaného $b se opakuje agent, nikoli jen namePart uvnitř jednoho společného agenta. Musí zůstat zachovány vazby na konkrétní událost a místo v originInfo.

NamePart vychází z 260$b/264$b; pro tiskaře DMF dovoluje převzetí 260$f. Jméno nakladatele není jméno autora ani digitalizační organizace. Obecné nameDefinition nevyžaduje namePart, ale národní řádek zde má M. Pravidla pro rodné jméno, příjmení či autoritní identifikátory autorů se na tento kontext automaticky nepřenášejí.

Mapování do dc:publisher uvádí DMF, tato sada však samostatně nekontroluje obsah DC. Původní katalogizační MARC vzoru nebyl analyzován.

## Role versus druh události

| Zdroj podle DMF | roleTerm | Související eventType pro RDA |
|---|---|---|
| 264_0 | producer | production |
| 260$b / 264_1 | publisher | publication pro 264_1 |
| 264_2 | distibutor v PDF; pravděpodobně distributor | distribution |
| 260$f / 264_3 | manufacturer | manufacture pro 264_3 |
| 264_4 | role se nepoužije | copyright |

Role označuje funkci entity; eventType druh události. Producer není production a publisher není publication. Tabulka je přepis konkrétního mapování DMF, nikoli úplný převodní algoritmus MARC. Obecný MARC 260$b má širší význam než samotný nakladatel a může obsahovat i distributora; nelze bez kontroly zdroje tvrdit, že každý převod 260$b je sémanticky vyřešen.

Tato skupina nepředepisuje roleTerm/@type=code, authority=marcrelator ani kódy pbl, prt a dst. Tyto požadavky nelze převzít z jiné skupiny jen proto, že používá stejný název elementu roleTerm. Z jejich nepovinnosti ale také neodvozujeme obecný zákaz atributů.

## Doložený překlep, nikoli tiše opravený číselník

Na s. 52 DMF je skutečně vytištěno **distibutor**. Jde pravděpodobně o překlep slova distributor; zamýšlená funkce u 264_2 je zřejmá. Závazný opravený národní zápis však nebyl potvrzen vydavatelem v ověřených podkladech.

Pravidlo ORIGIN-AGENT-ROLE-TERM proto nese status ambiguous a samostatný popis nesrovnalosti. Jasné M zůstává zachováno. Pole allowed_values není vyplněno: předešlo se tak prohlášení překlepu za jedinou správnou hodnotu nebo naopak neoznámené opravě předpisu. Custom popis ponechává ověřitelné ostatní větve a u dvojice distibutor/distributor nevyžaduje automatický verdikt či opravu. Neznamená to, že je libovolný obsah správný.

Obecné XSD obě textové hodnoty dovoluje a neřeší jejich národní význam. Nejde o zjištěnou chybu či toleranci externího validátoru.

## Výjimka copyright a podmínky

Role má MA, ale DMF výslovně říká, že pro výskyt 264_4 se nepoužije. Zákaz má přednost před dostupností role, zahrnuje i prázdné role a vztahuje se pouze k odpovídajícímu agentovi. Nezakazuje role v dalších událostech téhož záznamu, neodstraňuje copyrightDate a sám nezakazuje nebo nevyžaduje agent.

Společné podmínky jsou object_type=monograph, document_role=main_mets a bibliographic_level=single_volume:

| Kontext | Další podmínky |
|---|---|
| mods_origin_info pro AGENT | origin_agent_available=true |
| mods_origin_agent pro NAME | Bez podmínky již přítomného namePart |
| mods_origin_agent pro ROLE | origin_copyright_notice=false a origin_agent_role_available=true |
| mods_origin_agent_role pro ROLE-TERM | origin_copyright_notice=false |
| mods_origin_agent pro COPYRIGHT-NO-ROLE | origin_copyright_notice=true, bez podmínky dostupnosti role |

Tyto kontexty nejsou nové XML atributy. Dostupnost a původ údaje se stanovují nezávisle z katalogu nebo předlohy. False znamená doložený ne-copyright kontext, ne pouhou nepřítomnost eventType=copyright. Neznámý údaj není false ani potvrzení správnosti. Tak zůstávají možné i role v AACR originInfo, kde se eventType nepoužívá.

## Obecné MODS 3.8

Agent používá nameDefinition a je opakovatelný v originInfo. Publisher zůstává v XSD povolený; řádek DMF pro agent proto nelze vydávat za obecný schématový zákaz publisher.

RoleDefinition vyžaduje alespoň jedno roleTerm a dovoluje opakování. RoleTermDefinition rozšiřuje textový typ a má volitelné type code/text a atributy autority. XSD nestanovuje zdejší národní slovník ani výjimku 264_4. Nové entity mají namespace `http://www.loc.gov/mods/v3`; verze 3.8 je určena zdrojem, nikoli tímto namespace.

## Zdrojové ukázky a ověření

Čtyři ukázky u čtyř pravidel pocházejí ze [vzorového SIP](https://owncloud.cesnet.cz/index.php/s/5ZXf1zfDQYiLgSl/download). Zachycují agenta, jeho jméno Tiskem a nákl. Th. Venty (dříve Jos. Neuberta), role a samotné roleTerm=publisher. Vzor neobsahuje type ani authority u této role. Dokládá AACR větev, nikoli výjimku copyright či zápis distributora; pro ty nevytváříme domnělé zdrojové ukázky.

Soubor `mets_75faba8d-c629-11f0-8950-12e8557df20e.xml` má SHA-256 `7dcc4fe0de7f5eb1f9ea2eb260329957f956657fe5bf6b030fee1807e5741473`. Základ XPath:

```text
/mets:mets/mets:dmdSec[@ID="MODSMD_VOLUME_0001"]/mets:mdWrap/mets:xmlData/mods:mods/mods:originInfo/mods:agent
```

Shoda výřezů se zdrojem není potvrzení správnosti původního převodu nebo validity celého SIP. Registr nyní obsahuje 220 pravidel, z toho 43 pro MODS, a 208 XML ukázek u 163 pravidel. Testy kontrolují přepis, kontext, výjimku, nesrovnalost, vztahy, API filtry a mapu. **Custom kontroly registr nevykonává**; implementace nástrojů nebyly ověřeny.
