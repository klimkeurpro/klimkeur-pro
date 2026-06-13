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
- Het hoofdmenu en de rolverdeling van de klant-app staan uitgewerkt in §8
  (makeover, 2026-06-13).

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

**Visuele stijl (Jos, 2026-06-13, zie meegestuurde schets):** grote
gekleurde icoon-tegels in een grid op een kaart, bovenin een statusregel
("X items goed gekeurd") en een zoekbalk, onderin max. 4 navigatie-items —
dit beeld past op de hoofdmenu-opzet hierboven (de exacte knop-labels in de
schets zijn illustratief, niet 1-op-1 de lijst hierboven).

- **Achtergrondfoto van klimmers/gebruikers** als sfeerbeeld achter het
  menu — community-gevoel, "merk met een glimlach" (blauwdruk).
- **Crowdsourced en roulerend:** klanten mogen foto's insturen om erop te
  staan; de foto met de meeste likes op Instagram wordt gekozen, en elk
  halfjaar (of zo) wisselt de foto. Praktisch: een simpel veld/tabel voor
  "huidige hero-foto" dat een platform-/god-rol kan bijwerken — geen
  geautomatiseerde Instagram-koppeling nodig, gewoon handmatig wisselen op
  basis van wat Jos ziet.

**Belangrijke koerswijziging (Jos, 2026-06-13):** "we houden nu niks meer
simpel" — dit hoofdmenu is geen MVP-schets maar het startpunt van de
**professionele app die in één keer goed en sterk gebouwd wordt**. Dat
betekent: de keurbedrijf-admin-functies (eigen keurmeesters + hun
certificaten beheren, eigen kop/voettekst met juridische standaardtekst)
horen vanaf fase 1/2 in het datamodel en de rollen, niet als latere
toevoeging.

## 8. Klant-app — makeover (besloten, 2026-06-13)

Zelfde lijn als het keurmeester-hoofdmenu (§7): kaal, KISS, grote knoppen,
goed werkbaar op pc/telefoon/tablet, maar dan vanuit de klant gedacht. De
klant-app is gratis en is tegelijk de **leadmotor** (blauwdruk §7): een
klant zonder keurbedrijf moet in een paar tikken bij een keurbedrijf
uitkomen. De §3-kernflow ("ben ik in orde?") blijft het hart; deze §8 maakt
hem strakker en professioneler en legt het hoofdmenu vast.

**Twee soorten klantgebruikers (DATAMODEL: `customer_members`):**

- **Klantbedrijf-admin** — beheert de eigen ploeg en de eigen materiaallijst.
- **Medewerker/eindgebruiker** — kijkt, zoekt, vraagt aan; geen beheer.

De knoppen die zichtbaar zijn, hangen af van die rol (een monteur ziet geen
"medewerkers beheren").

**Hoofdmenu klant-app (knoppen):**

1. **Ben ik in orde?** — het dashboard uit §3 als primair scherm: één blik,
   "alles in orde" of "3 artikelen hebben aandacht" → tik → de artikelen in
   kwestie. Geen statistiek-etalage, net als bij de keurmeester (§4 punt 4).
   Nooit-gekeurde artikelen: uitnodigend, geen rood alarm (blauwdruk §7).

2. **Mijn materiaal** — de eigen artikelen (incl. zelf toegevoegde). Per
   artikel: status, volgende keuring, historie, certificaten (PDF download),
   handleiding-link. Zoeken/scannen op serienummer net als bij de keurmeester.

3. **Keuring aanvragen** — de leadmotor, primaire actie wanneer relevant:
   - keurbedrijf al gekoppeld → aanvraag in twee tikken (vervangt het huidige
     e-mailmechanisme; in-app, blauwdruk §7).
   - nog geen keurbedrijf → openbare lijst / naam-zoeken / uitnodigingscode of
     QR (vindbaarheid los van bereikbaarheid, blauwdruk §7).

4. **Certificaten** — alle PDF's op een rij, downloadbaar; bewijsbaar echt
   via de verificatie-QR (DATAMODEL: `certificates.verify_token`).

5. **Beheer** *(alleen klantbedrijf-admin)* — verzameld op één plek:
   - **Medewerkers**: eigen mensen toevoegen/verwijderen.
   - **Artikelen toevoegen**: catalogus-autocomplete; onbekend product →
     wachtrij voor de god-curator (DATAMODEL, blauwdruk §7).
   - **Mijn data / overstappen**: keurbedrijf koppelen/ontkoppelen; bij
     overstap gaat de eigen artikel- en keuringshistorie mee (data-eigendom,
     blauwdruk). Dit vervangt het oude e-mailverzoek.

6. *(gereserveerd)* — niet nu invullen, kiss.

**Navigatie onderin** (max 4, §1.7): **Overzicht · Mijn materiaal ·
Certificaten · Meer** (onder "Meer" valt Aanvragen + Beheer voor wie dat mag).

**Koerslijn (Jos, 2026-06-13):** ook hier "niks meer simpel houden om het
simpel te houden" — de klant-app wordt in één keer goed gebouwd, met
rolonderscheid, data-eigendom en de leadmotor vanaf fase 3 volwaardig
ingericht, niet als latere toevoeging.

## 9. Schermschetsen en velddekking (uitgewerkt, 2026-06-13)

Tekstuele wireframes (illustratief, geen pixel-ontwerp) plus per scherm de
koppeling naar `DATAMODEL.md`, als basis voor de wireframe-sessie en de
bouw van fase 2/3. Iconen/labels zijn placeholders.

### 9.1 Keurmeester — Hoofdmenu (§7)

```
┌───────────────────────────────────────┐
│ KlimKeur Pro                     [≡]   │
│ ✅ 14 items goed gekeurd vandaag       │
│ 🔍 [ Zoek klant / serienummer...   ]   │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │    🆕    │  │    📋    │            │
│  │  Nieuwe  │  │ Bestaande│            │
│  │  keuring │  │ keuringen│            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │    👥    │  │    🔎    │            │
│  │  Klanten │  │ SN zoeken│            │
│  │          │  │ / Recall │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │    ⚙️    │  │    ➕    │            │
│  │ Instel-  │  │ (gereser-│            │
│  │  lingen  │  │  veerd)  │            │
│  └──────────┘  └──────────┘            │
│         [achtergrondfoto klimmers]     │
└───────────────────────────────────────┘
```

| Element | Bron / velden (DATAMODEL) |
|---|---|
| Statusregel "X items goed gekeurd vandaag" | `inspection_items.result = 'passed'` waar `inspections.completed_at` = vandaag en `inspections.company_id` = huidig bedrijf |
| Zoekbalk | `customers` (naam, adres, telefoon, e-mail) + `customer_links.customer_number`, gefilterd op actieve links van dit bedrijf; en `articles.serial_number` (bevat-match, zie §4.2) |
| Nieuwe keuring | opent klantzoekscherm → Klantpagina (9.3) |
| Bestaande keuringen | `inspections` waar `company_id` = huidig, `draft` + `completed` naast elkaar |
| Klanten | `customers` via `customer_links` waar `company_id` = huidig en `status = 'active'` |
| SN zoeken / Recall | `articles.serial_number` (suffix/bevat) → toont gekoppeld `products.recall_url` / `inspection_notice_url` als vlag |
| Instellingen | `inspection_companies` (settings, cert_header/footer, branding, listed) + `inspectors`/`inspector_qualifications` beheer |
| (gereserveerd) | leeg — later: catalogus-wachtrij (god-rol), rapportages |

### 9.2 Klant-app — Hoofdmenu (§8)

```
┌───────────────────────────────────┐
│ [logo keurbedrijf]      KlimKeur   │
│                                     │
│  ┌───────────────────────────┐    │
│  │  ✅ Alles in orde            │    │
│  │  (of: 3 artikelen hebben    │    │
│  │   aandacht)            →    │    │
│  └───────────────────────────┘    │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │    🧰    │  │    📅    │        │
│  │   Mijn   │  │  Keuring │        │
│  │ materiaal│  │ aanvragen│        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐        │
│  │    📄    │  │    ⚙️    │        │
│  │ Certifi- │  │  Beheer  │        │
│  │  caten   │  │ (admin)  │        │
│  └──────────┘  └──────────┘        │
├─────────────────────────────────────┤
│ Overzicht · Mijn materiaal ·         │
│ Certificaten · Meer                  │
└─────────────────────────────────────┘
```

| Element | Bron / velden (DATAMODEL) |
|---|---|
| "Alles in orde" / "N artikelen hebben aandacht" | berekend: `articles` van `customer_id` = huidig, status afgeleid uit `inspection_items.next_due` van laatste keuring t.o.v. vandaag (oranje/rood), zie DATAMODEL §3 |
| Tik door → lijst aandachtspunten | dezelfde `articles`, gesorteerd op `next_due` oplopend |
| Mijn materiaal | `articles` (incl. `free_description`/`free_brand` bij vrij artikel); rol `member` ziet primair eigen `assigned_member_id`, kan wisselen naar alles |
| Keuring aanvragen | `inspection_requests` (insert) — gekoppeld: direct naar actieve `customer_link.company_id`; niet gekoppeld: keuze uit `inspection_companies` waar `listed = true`, of `invite_code` |
| Certificaten | `certificates` via `inspections.customer_id` = huidig, met `verify_token` voor QR |
| Beheer (alleen `customer_members.role = 'admin'`) | medewerkers (`customer_members` CRUD), artikelen toevoegen (`products` autocomplete of vrij artikel → `articles`, `status='pending'` bij onbekend product), `customer_links` (overstappen/koppelen) |
| Bottom-nav "Meer" | bundelt Aanvragen + Beheer (rolafhankelijk zichtbaar) |

### 9.3 Klantpagina (keurmeester-app)

```
┌───────────────────────────────────────┐
│ ← Terug            Bedrijf Jansen BV   │
│ 📍 Dorpsstraat 1, Hilversum             │
│ 📞 06-12345678   ✉️ info@jansen.nl     │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  ▶ HERVAT KEURING                  │  │
│  │     concept van 12 juni            │  │
│  │     of: start een nieuwe →         │  │
│  └─────────────────────────────────┘  │
│  (geen concept → primair: START KEURING)│
│                                         │
│  Artikelen (12)                        │
│  ▸ 9 ok · 2 bijna · 1 verlopen         │
│                                         │
│  Historie (archief)                    │
│  ▸ 12 jun 2025 — 11 ok, 1 afgekeurd    │
│  ▸ 15 jun 2024 — 12 ok                 │
│                                         │
│  Gegevens                               │
│  ▸ klantnummer, koppeling/scope        │
└───────────────────────────────────────┘
```

| Element | Bron / velden (DATAMODEL) |
|---|---|
| Header (naam, adres, contact) | `customers` (name, address, postal_code, city, email, phone), via `customer_links` (actief) |
| Primaire knop | check `inspections` waar `customer_id`=X, `company_id`=huidig, `status='draft'` → "Hervat keuring (concept van `inspection_date`)"; anders "Start keuring" (maakt nieuwe `inspections`-rij met `status='draft'`) |
| Artikelen-tab | `articles` waar `customer_id`=X, optioneel beperkt door `customer_links.scope_product_types`; statusbadge = afgeleid van `next_due` van laatste `inspection_items` |
| Historie-tab | `inspections` waar `status='completed'`, `customer_id`=X, desc gesorteerd; telling per `inspection_items.result` |
| Gegevens-tab | `customer_links.customer_number`, `scope_product_types`, `status`, `started_at`/`ended_at` |

### 9.4 Keuring-wizard (4 stappen, §2)

**Stap 1 — artikelen toevoegen**

```
┌───────────────────────────────────────┐
│ ← Keuring Jansen BV         Stap 1/4   │
│                                         │
│  [📷 Scan serienummer]  of typ:        │
│  [ laatste cijfers...            ]    │
│                                         │
│  Klaargezet uit vorige keuring:        │
│  ☑ Petzl Avao Bod   SN ...1234         │
│  ☑ Petzl Vertex     SN ...5678         │
│  ☑ Stihl MS261      SN ...9012         │
│                                         │
│  Filter: [ Alles ▾ ]  PBM  Machines     │
│                                         │
│  + Onbekend artikel toevoegen          │
│                                         │
│                  [ VOLGENDE → ]        │
└───────────────────────────────────────┘
```

**Stap 2 — per artikel beoordelen**

```
┌───────────────────────────────────────┐
│ ← Keuring Jansen BV         Stap 2/4   │
│  Artikel 3 van 12                      │
│                                         │
│  Petzl Avao Bod   SN ...1234           │
│  Vorige keuring: goed (12 jun 2025)    │
│  ⚠ Levensduur: nog 8 mnd               │
│  🚩 Recall: controleer dit SN-bereik   │
│                                         │
│     [ ✅ GOED ]      [ ❌ AFKEUREN ]    │
│                                         │
│  (bij afkeuren:)                       │
│  Code: [ 1 — Scheur in band ▾ ]        │
│  Opmerking: [ ...................  ]   │
│  [📷 Foto toevoegen]  (max 3)          │
│                                         │
│                  [ VOLGENDE → ]        │
└───────────────────────────────────────┘
```

**Stap 3 — overzicht**

```
┌───────────────────────────────────────┐
│ ← Keuring Jansen BV         Stap 3/4   │
│                                         │
│  12 artikelen totaal                   │
│  ✅ 9 goed  ❌ 2 afgekeurd  ⏳ 1 over   │
│                                         │
│  ⚠ Nog niet beoordeeld:                │
│   - Stihl MS261 SN ...9012             │
│     [ Beoordelen ]                     │
│                                         │
│  Volgende keuring (aanpasbaar):        │
│   - Petzl Avao Bod  → 12 jun 2026      │
│   - Petzl Vertex    → 12 jun 2026      │
│   - ...                                │
│                                         │
│      [ AFRONDEN → ]                    │
│      (disabled tot alles beoordeeld)   │
└───────────────────────────────────────┘
```

| Element | Bron / velden (DATAMODEL) |
|---|---|
| Stap 1 — start | nieuwe rij `inspections` (`customer_id`, `company_id`, `inspector_id`, `inspection_date`, `location`, `examination_type`, `status='draft'`) |
| Stap 1 — vooraf ingevuld | `inspection_items` aangemaakt per actief `article` van de klant (`result='not_assessed'`), met de uitslag van de vórige keuring als context (laatste `inspection_items.result`/`comment` per `article_id`) |
| Stap 1 — SN-zoeken | `articles.serial_number` suffix/bevat-match binnen `customer_id`=X |
| Stap 1 — type-filter PBM/machines | filtert op `products.product_type` (`ppe` vs `machine`/`aerial_platform`/…) |
| Stap 1 — onbekend artikel | nieuwe `articles`-rij zonder `product_id` (`free_description`/`free_brand`/`free_material`), of nieuw `products`-voorstel met `status='pending'` |
| Stap 2 — beoordeling | `inspection_items.result` (`passed`/`rejected`), `rejection_code_id` (uit `rejection_codes`, bedrijfseigen of platformstandaard), `comment` |
| Stap 2 — productsnapshot | `inspection_items.product_version_id` (huidige `product_versions` van het product) + `article_snapshot` (jsonb kopie van het artikel op dat moment) |
| Stap 2 — vlaggen | `products.recall_url`/`inspection_notice_url` (recall/inspection notice), `articles.severe_use` + naderende `next_due` (levensduur) |
| Stap 2 — foto | `photos` (`inspection_item_id`, `storage_path`, `taken_by`), client-side verkleind, max 3 |
| Stap 3 — overzicht/telling | aggregatie over `inspection_items.result` voor deze `inspection_id` |
| Stap 3 — volgende-keuring-datum | `inspection_items.next_due`, default = vroegste van (inspectiedatum + regime-interval uit `inspection_regimes`) en (einde levensduur uit productdata), handmatig aanpasbaar |

### 9.5 Afrondscherm (stap 4, §5.2)

```
┌───────────────────────────────────────┐
│ ← Keuring Jansen BV         Stap 4/4   │
│                                         │
│  Beoordeeld:        12                 │
│  ✅ Goed:           10                 │
│  ❌ Afgekeurd:       2                 │
│  ⏳ Overgeslagen:    0                 │
│                                         │
│  Afgekeurd:                            │
│   - Stihl MS261 SN ...9012 (code 3)    │
│   - Honda EU22i SN ...4455 (code 1)    │
│                                         │
│             [ OK – OPSLAAN ]           │
└───────────────────────────────────────┘
```

| Element | Bron / velden (DATAMODEL) |
|---|---|
| Aantallenregel | aggregatie `inspection_items.result` voor deze `inspection_id` (`passed`/`rejected`/`not_assessed` — knop disabled bij `not_assessed > 0`) |
| Afgekeurd-lijst | `inspection_items` waar `result='rejected'`, met `article_snapshot` (naam/SN) en `rejection_code_id` |
| OK – opslaan | `inspections.status='completed'`, `completed_at=now()` (onveranderlijk vanaf hier); bij sync: `certificates` aanmaken (`number`, `storage_path`, `pdf_hash`, `verify_token`) en `usage_counters.items_inspected` ophogen met aantal beoordeelde items |

## 10. Open punten volgende sparringronde

1. Visuele wireframes/mockups (Figma of vergelijkbaar) op basis van de
   tekstuele schetsen in §9, zodra het bouwplan dat toelaat.
2. Tijdens fase 1/2-bouw: bovenstaande velddekking toetsen aan de
   daadwerkelijke RLS-policies en formulieren; aanvullen waar nodig.
