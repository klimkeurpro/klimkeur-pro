# Onderzoek: wettelijke eisen aan keuringsrapporten in VK, NL, DE en VS

Datum: 2026-06-12 · Hoort bij `BLAUWDRUK.md` en `DATAMODEL.md`.
Doel: bepalen wat de certificaat-PDF en de database moeten ondersteunen om in
deze vier markten een geldig keuringsrapport te leveren voor valbeveiliging-PPE,
klim-/riggingmateriaal, hoogwerkers en machines.

**Betrouwbaarheid:** vijf parallelle onderzoeken met voorkeur voor primaire
bronnen (wetteksten, HSE, DGUV, OSHA). De primaire sites blokkeerden directe
toegang vanuit deze omgeving (HTTP 403); citaten komen uit zoekmachine-extracties
van die pagina's en zijn waar mogelijk via meerdere onafhankelijke bronnen
gekruist. Kernfeiten (intervallen, regimes, veldenlijsten): betrouwbaarheid
hoog. Exacte wetsformuleringen: vóór lancering per markt juridisch laten
verifiëren — zie §7.

---

## 1. De rode draad: EN 365 is het fundament

De Europese norm **EN 365:2004** (algemene eisen aan gebruiksaanwijzing,
onderhoud, periodieke inspectie van PPE tegen vallen) geldt in NL, VK en DE en
schrijft voor:

- **Periodieke inspectie minimaal elke 12 maanden**, door een *competent
  person*, volgens de procedures van de fabrikant.
- **Per artikel een registratie** met: productidentificatie, bouwjaar (of
  einde-levensduurdatum), aankoopdatum, datum eerste ingebruikname, en de
  volledige historie van periodieke inspecties en reparaties (datum, details,
  resultaat, naam van de competent person).
- Fabrikantformulieren (Petzl) gebruiken als uitkomstcategorieën:
  **goed / monitoren / repareren / afkeuren** — let op: dit is
  Petzl-formulierpraktijk, **géén EN 365-eis**; de norm eist alleen dát
  resultaat en details geregistreerd worden.

→ Wie EN 365-conform registreert, voldoet aan de gemeenschappelijke kern van
NL, VK en DE. De landen verschillen vooral in **interval, ondertekening en
bewaartermijn**.

## 2. Verenigd Koninkrijk

**Twee regimes naast elkaar:**

| | Hoogwerkers (MEWP) | PPE/touwen/harnassen |
|---|---|---|
| Wet | LOLER 1998 (lifting equipment voor personen) | PUWER 1998 + Work at Height Regs 2005; richtlijn HSE INDG367 |
| Interval | **6 mnd** thorough examination | **6 mnd** detailed inspection; **3 mnd bij zwaar gebruik** (scherpe randen, demolitie); plus pre-use checks |
| Rapport | LOLER Schedule 1: **11 verplichte punten** | registratie van detailed/interim inspections (WAHR Schedule 7 bij platforms: 8 punten) |
| Keurder | "competent person" met kennis én voldoende onafhankelijkheid (niet de eigen onderhoudsmonteur); MEWP's: doorgaans IPAF CAP | competent person (EN 365-definitie) |
| Bewaren | tot volgend rapport of 2 jaar; accessoires 2 jaar | tot volgende inspectie geregistreerd is |
| Digitaal | **ja** — elektronisch bewaren expliciet toegestaan, mits reproduceerbaar en beschermd tegen wijziging | idem |

LOLER Schedule 1-punten (gereconstrueerd, exacte tekst verifiëren): werkgever
naam+adres; locatie van onderzoek; identificatie van het materieel incl.
bouwjaar (indien bekend); datum laatste onderzoek; safe working load; datum van
dít onderzoek; gevonden defecten die gevaar (kunnen) opleveren + beschrijving;
vereiste reparaties/vervangingen; eventuele testgegevens; **uiterste datum
volgende keuring**; naam, adres en kwalificaties van de rapporteur + diens
werkgever.

## 3. Nederland

- **Arbobesluit art. 7.4a**: arbeidsmiddelen die aan verslechtering onderhevig
  zijn worden gekeurd "zo dikwijls dit ter waarborging van de goede staat
  noodzakelijk is" (frequentie volgt uit RI&E); plus keuring na installatie,
  verplaatsing en uitzonderlijke gebeurtenissen (ongeval, wijziging, lang
  buiten gebruik). Géén generieke jaartermijn in de wet zelf — de 12 maanden
  voor PPE komt uit **EN 365**; hoogwerkers jaarlijks (praktijk/EN 280);
  hijsgereedschap jaarlijks (art. 7.20).
- **Keurder**: "een deskundige natuurlijke persoon, rechtspersoon of
  instelling" — geen wettelijk vastgelegd certificaat vereist (fabrikantentraining
  is praktijk, geen wetseis). Uitzondering: bepaalde TCVT-categorieën.
- **Bewijsstuk**: "Schriftelijke bewijsstukken van de uitgevoerde keuringen
  zijn op de arbeidsplaats aanwezig en worden desgevraagd getoond aan de
  toezichthouder." → **herleidbaarheid + direct kunnen tonen** is de kern;
  digitaal is geaccepteerd mits snel toonbaar.
- **Bewaartermijn**: wet noemt geen termijn; praktijk/verzekeraars: 5 jaar,
  bij claims tot 10 jaar. → ontwerpkeuze: nooit weggooien.
- **NEN 3140** (elektrisch gereedschap): risicogebaseerd interval (bouwplaats
  3–6 mnd, kantoor 1–2+ jaar), registratie van visuele controle + metingen
  (isolatieweerstand e.d.), keuringssticker met volgende datum; keurder VOP/VP.

## 4. Duitsland

- **BetrSichV §14**: wiederkehrende Prüfung door een *zur Prüfung befähigte
  Person*; werkgever bepaalt interval via Gefährdungsbeurteilung (Anhang
  3-maxima waar van toepassing).
- **Prüfaufzeichnung moet bevatten (§14 Abs. 7)**: art van de keuring, omvang,
  resultaat, **naam en handtekening van de keurder — bij uitsluitend
  elektronische documenten een elektronische handtekening**. Elektronisch
  bewaren expliciet toegestaan. Bewaren: minimaal tot de volgende keuring.
- **PSA gegen Absturz (DGUV Regel 112-198)**: minimaal **elke 12 maanden**
  door een **Sachkundiger** (opleiding volgens DGUV Grundsatz 312-906, met
  examen en landelijk erkend certificaat).
- **Hubarbeitsbühnen**: jaarlijkse Prüfung door befähigte Person; Prüfbuch
  per machine, **digitaal (EDV) expliciet toegestaan** (DGUV Grundsatz 308-002/003).
- **Elektrisch gereedschap (DGUV Vorschrift 3)**: risicogebaseerd (bouw 3–6
  mnd, kantoor 1–2 jaar), Elektrofachkraft (of onder diens toezicht).

→ Duitsland is het strengst op **wie** keurt (Sachkundige met certificaat) en
op de **elektronische handtekening** bij digitale rapporten.

## 5. Verenigde Staten

- **OSHA (29 CFR 1910.140 / 1926.502)** verplicht inspectie vóór elk gebruik
  en na valbelasting (dan door competent person), maar **verplicht géén
  geschreven keuringsrapport** voor valbeveiliging-PPE — ook geen
  bewaartermijn. Idem kettingzagen (1910.266: inspectie per dienst, geen
  registratieplicht).
- De **jaarlijkse gedocumenteerde keuring door een competent person komt uit
  ANSI/ASSP Z359.2** (vrijwillige consensusnorm, "not to exceed one year", of
  korter als de fabrikant dat zegt) — de facto industriestandaard en
  verzekeringseis, geen federale wet.
- **Hoogwerkers**: OSHA eist dagelijkse controle; de frequente (3-mnd) en
  jaarlijkse (≤13 mnd) inspecties komen uit ANSI A92.22 (vrijwillig).
- **Competent person** (OSHA-definitie): kan gevaren herkennen én is bevoegd
  om corrigerend op te treden.
- **Productboodschap VS**: verkoop het als "ANSI Z359.2-conform programma" en
  verzekeringsdossier, niet als "wettelijk verplicht certificaat".

## 6. Vergelijking en gevolgen voor het product

### Intervallen (defaults voor `inspection_regimes`)

| producttype | NL | VK | DE | VS |
|---|---|---|---|---|
| PPE tegen vallen | 12 mnd (EN 365) | **6 mnd**; 3 mnd zwaar gebruik (INDG367) | 12 mnd (DGUV 112-198) | 12 mnd (ANSI Z359.2, vrijwillig) |
| Hoogwerker | 12 mnd | **6 mnd** (LOLER) | 12 mnd | 12 mnd (ANSI A92, vrijwillig) |
| Elektrische machine | NEN 3140: risicogebaseerd, default 12 mnd | PAT: risicogebaseerd | DGUV V3: risicogebaseerd, default 12 mnd | — |
| Extra triggers (alle landen) | na uitzonderlijke gebeurtenis: val/belasting, reparatie, lang buiten gebruik → extra keuring | | | |

### Superset rapportvelden (certificaat-PDF + database)

| veld | bron/eis | in datamodel |
|---|---|---|
| Uniek rapportnummer | praktijk/fraudebestendigheid | `certificates.number` ✓ |
| Klant: naam + adres | LOLER, WAHR, BetrSichV | `customers` ✓ (adres al aanwezig) |
| Locatie van de keuring | LOLER, WAHR | **ontbreekt** → veld `inspections.location` toevoegen |
| Identificatie artikel: omschrijving, merk, serienummer, bouwjaar | EN 365, LOLER | `articles` + snapshot ✓ |
| Aankoopdatum + datum eerste gebruik | EN 365 | `articles.first_use_date` ✓; **aankoopdatum toevoegen** (`purchase_date`) |
| Datum (laatste én huidige) keuring | LOLER, EN 365 | `inspections.inspection_date` + historie ✓ |
| Soort/omvang keuring (periodiek/na gebeurtenis/interim) | BetrSichV §14, INDG367 | **ontbreekt** → `inspections.examination_type` toevoegen |
| Resultaat per item | alle | `inspection_items.result` ✓ — blijft goed/afgekeurd (besloten 2026-06-12; "monitoren" is Petzl-praktijk, geen normeis — opmerkingenveld volstaat) |
| Defecten + beschrijving + vereiste actie | LOLER, WAHR, BetrSichV | afkeurcode + opmerking ✓; "vereiste actie" zit in afkeurbeleid/opmerking |
| **Uiterste datum volgende keuring** | LOLER (verplicht), EN 365, NEN 3140-sticker | berekend ✓ — moet óók op de PDF |
| Keurmeester: naam + **kwalificaties** + werkgever | LOLER, DGUV (Sachkundennachweis) | naam/bedrijf ✓; **kwalificaties toevoegen** (`inspectors.qualifications`, bijv. "DGUV 312-906", "IPAF CAP") |
| **Handtekening** (elektronisch bij digitaal, DE) | BetrSichV §14 Abs. 7; VK "authenticated" | **ontbreekt** → ondertekenings-/authenticatielaag op de PDF (zie hieronder) |
| Testgegevens (indien getest; metingen NEN 3140/DGUV V3) | LOLER, NEN 3140 | **later**: meetwaardenveld voor elektrische keuringen |
| Wettelijke basis op het rapport | praktijk | `inspection_regimes.legal_reference` ✓ |

### Schema-aanpassingen die hieruit volgen (voorstel)

1. `inspections.location` (tekst) en `inspections.examination_type`
   (`periodic` / `interim` / `after_event` / `pre_first_use`).
2. `articles.purchase_date`.
3. `inspectors.qualifications` (tekst of lijstje: certificaatnaam + nummer +
   geldig tot — DE vereist aantoonbare Sachkunde).
4. `inspection_regimes` krijgt naast `interval_months` een optioneel
   `severe_use_interval_months` (VK: 3 mnd bij zwaar gebruik); per artikel
   aan te zetten met een vlag `severe_use`.
5. ~~Resultaatcategorie "monitoren"~~ — vervalt (besloten 2026-06-12):
   geen EN 365-eis maar Petzl-formulierpraktijk; goed/afgekeurd +
   opmerkingenveld volstaat.
6. **Certificaat-ondertekening**: PDF afsluiten met naam + kwalificatie van de
   keurmeester en een digitale authenticatie. Minimaal: audit-trail
   (ingelogde keurmeester + tijdstip + hash van de PDF) en een
   verificatie-QR-code op het certificaat (scan → toont het echte record).
   Voor Duitsland later uitbreidbaar naar een eIDAS-conforme elektronische
   handtekening. Dit past bij het onveranderlijke archief dat we al hadden
   besloten.
7. Bewaarbeleid: **nooit verwijderen** (NL-praktijk 5–10 jaar, VK 2 jaar/tot
   volgend rapport, DE tot volgende keuring — alles ruimschoots gedekt door
   "alles bewaren", en de klant bezit de data toch al levenslang).

## 7. Openstaande verificatiepunten — bijgewerkt (2026-06-13)

Vier van de zes punten zijn nu opgelost/bevestigd via aanvullend onderzoek;
twee blijven niet-blokkerend openstaan.

1. **LOLER Schedule 1 — bevestigd.** De reconstructie in §2 (11 punten) klopt:
   werkgever naam+adres, locatie, identificatie + bouwjaar van het materieel,
   datum laatste/huidige onderzoek, safe working load, gevonden defecten,
   vereiste reparaties, testgegevens, uiterste datum volgende keuring, en
   naam/adres/kwalificaties van zowel de rapporteur (+ diens werkgever) als
   degene die het rapport ondertekent/authenticeert (kunnen dezelfde persoon
   zijn). Geen wijziging in datamodel nodig.
   ([legislation.gov.uk](https://www.legislation.gov.uk/uksi/1998/2307/schedules/made))
2. **EN 365 / NEN-EN 365 — nog open.** Officiële normtekst (clausule 4.4 +
   Figure 1) staat nog achter de betaalmuur van NEN/BSI en is niet op te
   halen vanuit deze omgeving. **Niet blokkerend**: de kernfeiten (12
   maanden-interval, registratie-inhoud) zijn via meerdere onafhankelijke
   bronnen bevestigd (§1, §3). Actie: aanschaffen vóór het PDF-sjabloon wordt
   vormgegeven.
3. **DGUV Grundsatz 312-906 — opgelost.** Het Sachkunde-certificaat zelf
   heeft **geen geldigheidsduur/hercertificeringstermijn**; de wettelijke
   eis is de jaarlijkse PPE-keuring dóór zo'n Sachkundiger, niet een
   periodieke herscholing van de Sachkundige zelf. Gevolg: in
   `inspector_qualifications` mag `valid_until` voor dit certificaattype
   leeg blijven — kolom blijft optioneel zoals al ontworpen, geen
   schemawijziging nodig.
4. **NL Arbobesluit vs EN 365 — bevestigd.** De wettelijke basis is
   Arbobesluit art. 7.4a (algemeen: keuringsplicht arbeidsmiddelen) en art.
   8.3 (PBM-specifiek: "deugdelijkheid in stand houden"); EN 365 vult de
   12-maanden-norm en de registratie-inhoud in als geharmoniseerde norm,
   niet als losse wetseis op zichzelf. Gevolg voor `inspection_regimes.legal_reference`
   bij NL/PPE: **"Arbobesluit art. 8.3 jo. NEN-EN 365"** in plaats van alleen
   "EN 365".
5. **VS ANSI A92.22 bewaartermijn — blijft licht tegenstrijdig** (bronnen
   noemen zowel 4 als 5 jaar voor periodieke/jaarlijkse inspecties). **Niet
   blokkerend**: het bewaarbeleid "nooit verwijderen" (§6 punt 7) overtreft
   beide cijfers ruimschoots. Geen actie nodig.
6. **VK elektronische handtekening — bevestigd.** HSE-praktijk (o.a.
   CFTS-richtlijnen) staat elektronische rapporten toe, mits reproduceerbaar
   in schrift en beschermd tegen ongeautoriseerde wijziging — dit is precies
   het al ontworpen `pdf_hash` + `verify_token` audit-trail-model (DATAMODEL
   §4). Geen aanpassing nodig.

   **Verduidelijking (besloten 2026-06-14):** de eis "elektronische
   handtekening bij digitale rapporten" komt het expliciétst uit de Duitse
   BetrSichV §14 Abs. 7, maar het `pdf_hash` + `verify_token`-mechanisme
   (onveranderlijke PDF + naam/gegevens keurmeester + verifieerbare code) is
   **niet DE-specifiek gebouwd en geldt voor alle markten**: het is dezelfde
   laag die voor het VK al als "authenticated record" kwalificeert (zie
   hierboven) en die nergens in de EU/VS-eisen wordt tegengesproken. Met
   andere woorden: elk certificaat dat dit platform aflevert, heeft deze
   elektronische handtekening — niet alleen waar de wet het met name noemt.

Conclusie: **het besloten datamodel staat overeind** — snapshot-model,
regime-tabel per type × land, onveranderlijk PDF-archief en berekende
vervaldatums dekken precies wat deze vier landen vragen. De zeven
schema-aanpassingen in §6 zijn verfijningen, geen verbouwing. Eén kleine
toevoeging volgt uit punt 4: NL-`legal_reference` voor PPE wordt "Arbobesluit
art. 8.3 jo. NEN-EN 365" (tekstwaarde, geen schemawijziging). En ja: wie aan
deze vier landen voldoet, zit voor de meeste andere westerse markten goed —
de EU-landen hangen allemaal aan dezelfde EN 365-kapstok.

**Resterend vóór lancering per markt:** alleen punt 2 (EN 365-volledige tekst
aanschaffen vóór het PDF-sjabloon-ontwerp).
