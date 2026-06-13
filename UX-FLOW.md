# UX & Flows — KlimKeur 2.0

Hoort bij `BLAUWDRUK.md` en `DATAMODEL.md`. Status: **in bespreking**
(gestart 2026-06-12). Doel: een intuïtievere app — "minder knoppen, maar
veel kunnen doen" (Jos).

Aanleiding uit de praktijk: in de huidige app staan dingen dubbel, en het is
voorgekomen dat een óude keuring werd geopend terwijl de bedoeling was een
níeuwe keuring voor dat bedrijf te starten. Dat soort verwarring ontwerpen we
eruit.

---

## 1. Ontwerpprincipes

1. **Eén primaire actie per scherm.** Elk scherm heeft één grote,
   onmiskenbare knop voor de meest waarschijnlijke vervolgstap; al het andere
   is visueel secundair. Nooit twee knoppen die op elkaar lijken.
2. **Taakgericht, niet tabelgericht.** De app vraagt "wat kom je doen?" in
   plaats van lijsten met data te tonen waarin je zelf je weg moet vinden.
3. **Historie is een archief, geen werkplek.** Afgeronde keuringen zijn
   read-only, visueel duidelijk anders (gedempt, "afgerond"-badge met datum)
   en staan nooit op dezelfde hoogte als de knop voor een nieuwe keuring.
4. **Concepten hervatten is expliciet.** Staat er nog een openstaande
   (concept-)keuring voor een klant, dan verandert de primaire knop in
   "Hervat keuring (concept van 12 juni)" met daaronder klein "of start een
   nieuwe". Per ongeluk in een oude keuring belanden kan dan niet meer.
5. **Scannen is de snelweg.** Serienummer scannen (camera/QR) is overal de
   snelste route naar een artikel — bij keuren, zoeken en historie.
6. **Het systeem signaleert, de keurmeester beslist.** Vlaggen (recall,
   levensduur bijna verlopen, nog niet beoordeeld) zijn niet te missen maar
   blokkeren nooit; het oordeel blijft bij de mens.
7. **Maximaal 4 navigatie-items** onderin per app. Al het overige zit achter
   de juiste context, niet in menu's.
8. **Offline onzichtbaar goed.** Sync gebeurt vanzelf; één duidelijke
   statusindicator ("alles gesynchroniseerd" / "3 keuringen wachten op
   upload") en een handmatige sync-knop. Nooit blokkerende foutmeldingen
   omdat er geen bereik is.

## 2. Keurmeester-app — kernflow "een keuringsdag"

```
VANDAAG (startscherm)
  → geplande klanten / recent / zoek klant / scan serienummer
KLANTPAGINA
  → [ START KEURING ]  (of: HERVAT KEURING — concept 12 juni)
  → daaronder: artikelen (status-overzicht), historie (archief), gegevens
KEURING (wizard)
  1. artikelen toevoegen: scan → artikel verschijnt; onbekend SN →
     nieuw artikel (autocomplete op winkel-catalogus)
  2. per artikel beoordelen: GOED / AFKEUREN (+ code, foto) — recall-vlag
     en levensduur-waarschuwing in beeld waar van toepassing
  3. overzicht: alles beoordeeld? wat is overgeslagen? "volgende keuring"-
     datums (aanpasbaar)
  4. AFRONDEN → certificaat wordt (bij sync) gegenereerd en gearchiveerd
```

- Het overzicht (stap 3) voorkomt het huidige risico dat een getypte
  opmerking zonder beoordeling verloren gaat: niets afronden zolang er
  onbeoordeelde items zijn zonder expliciete bevestiging.
- Navigatie onderin (voorstel): **Vandaag · Klanten · Zoeken/Scan · Meer**
  (instellingen, catalogus, kwalificaties, sync).

## 3. Klant-app — kernflow "ben ik in orde?"

```
DASHBOARD: één blik — "Alles in orde" of "3 artikelen hebben aandacht"
  → tik op het aandachtspunt → de artikelen in kwestie
ARTIKEL: status, volgende keuring, historie, certificaten (PDF), handleiding
PRIMAIRE ACTIE op het dashboard wanneer relevant: [ KEURING AANVRAGEN ]
  → keurbedrijf al gekoppeld: aanvraag in twee tikken
  → nog geen keurbedrijf: lijst/zoeken/code (de leadmotor, blauwdruk §7)
```

- Navigatie onderin (voorstel): **Overzicht · Mijn materiaal · Certificaten
  · Meer**.
- Nooit gekeurde artikelen: uitnodigende tekst, geen rood alarm (blauwdruk §7).

## 4. Praktijkinput Jos (2026-06-12) en wat we ermee doen

**De huidige werkdag (op de zaak):** koffie en e-mail → kijken wat er in de
rij staat om gekeurd te worden → certificaat van vorig jaar openen,
kopiëren, goedgekeurd-markeringen weghalen, afkeurcodes naar een
niet-afgedrukte tabel → opslaan als JJJJMMDD-klantnaam → spullen
controleren: goed = sticker + vinkje, door naar het volgende → product
opzoeken via de **laatste 3 cijfers van het serienummer**. Op locatie
hetzelfde, minus het bureau met waslijn. Serienummers worden meestal
**getypt**, af en toe gescand (nieuwe verkoop, schone barcode). Jos keurt
vooral op de zaak; een collega vooral op locatie.

**Ontwerpgevolgen (vastgesteld):**

1. **Het kopieer-ritueel vervalt.** Artikelen van een klant bestaan als
   entiteit; "Start keuring" zet automatisch alle actieve artikelen klaar —
   onbeoordeeld, met per artikel de uitslag/afkeurcode van de vórige keuring
   als context in beeld (de "niet-afgedrukte tabel", maar dan vanzelf).
   Certificaatnummer/datum genereert het systeem.
2. **Serienummer-zoeken op de laatste cijfers** (suffix/bevat-match) is het
   primaire zoekgedrag in het keurscherm; typen is de norm, scannen de
   optie (camera voor schone barcodes/nieuwe verkoop).
3. **De tik-flow is heilig:** artikel vinden → één tik "goed" → volgende.
   De handeling die honderden keren per dag gebeurt krijgt het minste
   aantal tikken. (Sticker blijft fysiek werk.)
4. **Dashboard wordt actiegericht, geen statistiek-etalage.** Citaat Jos:
   "hoe vol de database zit maakt in de praktijk niet uit, als het maar
   werkt." Het Vandaag-scherm toont: wachtrij van vandaag (op de zaak),
   openstaande concepten, binnenkort verlopende keuringen bij klanten.
   Database-tellers verdwijnen of verhuizen naar "Meer".
5. **Klantzoeken over álle velden:** naam, klantnummer, adres, telefoon,
   e-mail.
6. **Het klik-instinct krijgt gelijk:** op een klantnaam tikken (waar dan
   ook) opent de klantpagina met de grote contextknop Start/Hervat keuring.
   Geen aparte "Nieuwe keuring"-knop rechtsboven die over het hoofd wordt
   gezien.
7. **Geen destructieve knoppen naast archief:** de huidige rode
   "Verwijder"-knop direct naast afgeronde keuringen verdwijnt — afgerond =
   onveranderlijk (DATAMODEL §4); alleen concepten kunnen weg.
8. **Merkenoverzicht met fabrikantlogo's** als visuele polish (nominatief
   merkgebruik: herkenning, geen gesuggereerde sponsoring).
9. Werkplaats- vs locatiemodus verschillen niet in flow, wel in context:
   de wachtrij ("wat staat er vandaag voor aan de rij") is
   werkplaats-specifiek en raakt aan de keuringsplanner (buiten scope,
   later koppelbaar).

## 5. Aanvullingen (2026-06-12, tweede ronde)

1. **Vandaag-scherm: recente keuringen blijven** — praktijkreden: als een
   klant na een keuring vervangend materiaal wil bestellen, moeten de
   afgekeurde items van recente keuringen snel terug te vinden zijn.
   Ontwerp: recente keuringen tonen met direct zichtbaar aantal afgekeurd,
   één tik → de afgekeurde items op een rij (bestelklaar).
2. **Afrondscherm (besloten):** aantallen op een rij — beoordeeld, goed,
   afgekeurd, overgeslagen — met de afkeuringen zichtbaar; daarna één knop
   "OK – opslaan". Geen afronding zolang er onbeoordeelde items zijn zonder
   expliciete bevestiging.

## 7. Hoofdmenu keurmeester-app (besloten, 2026-06-13)

Aanleiding: Jos wil een kaal hoofdmenu met grote, KISS-knoppen — werkt goed
op pc, telefoon én tablet. Dit vervangt het "Vandaag"-overzicht uit §2 als
startscherm: de functies van Vandaag (concepten hervatten, recent
afgekeurde items terugvinden) zijn verdeeld over de knoppen hieronder, zodat
er niet twee concurrerende startpunten zijn.

**De knoppen (4–6, uitbreidbaar):**

1. **Nieuwe keuring**
   - Klant kiezen via slim zoekveld (alle velden: naam, klantnummer, adres,
     telefoon, e-mail — zie §4 punt 5).
   - Daarna: overzicht van bestaande artikelen van die klant (incl. door de
     klant zelf toegevoegde artikelen), elk met een vinkje — overnemen in
     deze keuring of niet (zoals nu).
   - **Nieuw — type-filter PBM/machines:** een extra schakelaar/vinkje per
     artikel-categorie waarmee je in één keer alleen PBM's of alleen
     machines (kettingzagen e.d.) selecteert/deselecteert. Praktijknut:
     keurmeester en monteur werken dezelfde dag bij dezelfde klant, ieder
     met het complementaire deel van de artikelen — geen tijd verspillen
     aan losse vinkjes voor elk artikel.
   - Hierna de normale wizard (scan/SN-zoeken, tik-flow, afronden — §2).

2. **Bestaande keuringen**
   - Eén lijst, afgerond én concept naast elkaar (visueel onderscheiden,
     archiefprincipe uit §1.3 blijft gelden voor afgeronde keuringen — geen
     bewerken, wel inzien).
   - Per keuring: aantallen goed/afgekeurd direct zichtbaar (dit vervangt de
     "recente keuringen"-functie uit §5.1 — zelfde praktijkdoel: afgekeurde
     items snel teruvinden voor nabestelling, nu via deze lijst).
   - Concepten zijn hier te hervatten en af te ronden.

3. **Klanten** — aanmaken en bewerken (bestaand gedrag, klik-op-naam-opent-
   klantpagina-principe uit §4 punt 6 blijft staan).

4. **Serienummer zoeken / Recall** — eigen knop (was eerder een
   subfunctie); blijft een opzoekfunctie, geen wijziging in het
   recall-ontwerp uit DATAMODEL (vlag, geen automatische melding).

5. **Instellingen** — uitgebreid vanuit "alleen certificaat + keurmeesters"
   naar volledige keurbedrijf-admin:
   - **Keurmeesters beheren**: keurbedrijf-admin voegt eigen keurmeesters
     toe/verwijdert ze, en **uploadt zelf hun kwalificatiecertificaten**
     (koppelt aan `inspector_qualifications` uit DATAMODEL §... — naam,
     nummer, geldig-tot, bestand).
   - **Certificaat-template**: kop- en voettekst zelf instelbaar door het
     keurbedrijf; **standaard staat er een juridisch correcte standaardtekst**
     klaar (per land/regime), die het keurbedrijf kan overnemen of aanpassen.

6. *(gereserveerd)* — extra knop(pen) toevoegen zodra de praktijk dat
   uitwijst (bijv. catalogus-wachtrij voor god-rol, rapportages). Niet nu al
   invullen — kiss.

**Belangrijke koerswijziging (Jos, 2026-06-13):** "we houden nu niks meer
simpel" — dit hoofdmenu is geen MVP-schets maar het startpunt van de
**professionele app die in één keer goed en sterk gebouwd wordt**. Dat
betekent: de keurbedrijf-admin-functies (eigen keurmeesters + hun
certificaten beheren, eigen kop/voettekst met juridische standaardtekst)
horen vanaf fase 1/2 in het datamodel en de rollen, niet als latere
toevoeging.

## 8. Klant-app — makeover (te bevestigen)

Jos vroeg of het document met de klant-app-makeover al gelezen is. In deze
sessie is alleen `UX-FLOW.md` (incl. §3, de bestaande klant-app-kernflow),
`BLAUWDRUK.md`, `DATAMODEL.md` en `BOUWPLAN.md` beschikbaar — een apart
"makeover"-document voor de klant-app is hier niet aangetroffen. Mogelijk
is dat in een andere chat/sessie voorbereid en nog niet in deze repo
beland. **Open vraag aan Jos:** kun je dat document delen of hierheen
kopiëren, zodat §3 ermee aangevuld kan worden?

## 9. Open punten volgende sparringronde

1. Klant-app-makeover verwerken zodra het document (zie §8) beschikbaar is.
2. Schermschetsen/wireframes maken van het hoofdmenu (§7), Klantpagina,
   Keuring-wizard en Afrondscherm zodra het bouwplan er is.
