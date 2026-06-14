# Blauwdruk: KlimKeur 2.0 (werktitel)

Levend document. Hier denken we de herbouw van KlimKeur Pro + KlimKeur Klant door
voordat er gebouwd wordt. Per onderwerp staat de huidige stand: **besloten**,
**voorstel** (wacht op akkoord) of **open vraag**.

Laatst bijgewerkt: 2026-06-12 (v5: lijst-spelregels definitief —
uitnodigingscode + "open voor nieuwe klanten"-schakelaar; CSV-import met
fuzzy-matching uitgewerkt)

---

## 1. Visie (besloten)

Eén product, opnieuw opgebouwd vanaf een schone basis, met de huidige apps als
functionele specificatie. Doelen:

- Commercieel product: verkoop via de app stores aan eindgebruikers en
  abonnementen aan keurmeesters/keurbedrijven.
- Meertalig vanaf dag één (NL + EN-GB, uitbreidbaar), inclusief
  marktspecifieke keuringsregimes (NL 12 mnd, VK vaak 6 mnd voor PPE).
- Sterke, onderhoudbare broncode in plaats van organisch gegroeide losse delen.
- De huidige versies blijven onaangeraakt in productie draaien tot de nieuwe
  bewezen is.

De keuringsplanner valt buiten scope en komt eventueel later als optie/module.

## 2. Rollenmodel (voorstel, op basis van gesprek 2026-06-12)

| Rol | Hoort bij | Betaalt | Kan |
|---|---|---|---|
| Platformbeheer (eigenaar) | platform | — | alles, incl. abonnementen en catalogusbeheer |
| Catalogusbeheerder ("god"-keurmeester) | platform | gratis (tegenprestatie: data) | globale productdatabase bewerken en uitbreiden |
| Keurbedrijf-admin | keurbedrijf | abonnement | keurmeesters beheren, klantbedrijven aanmaken, eigen branding |
| Keurmeester | keurbedrijf | via keurbedrijf | keuringen uitvoeren, certificaten afgeven |
| Klantbedrijf-manager (`manager`) | klantbedrijf | (zie open vraag 9.3) | eigen personeel beheren, eigen artikelen toevoegen |
| Eindgebruiker (`end_user`) | klantbedrijf | gratis | al het materiaal van het klantbedrijf inzien en basisbeheer (zie 9.4), keuringsstatus, PDF's downloaden |
| Zelfstandige gebruiker | — (nog geen keurbedrijf) | gratis | eigen materiaal invoeren, keuring aanvragen bij een keurbedrijf |

Hiërarchie: platform → keurbedrijven (tenants) → klantbedrijven → medewerkers.

Aandachtspunten bij dit model:

- **"God"-versie en kwaliteitsbewaking (besloten 2026-06-12).** Alleen
  catalogusbeheerders ("god-keurmeesters") mogen de globale catalogus
  aanpassen. Voert een klant(bedrijf) een product in dat niet in de catalogus
  staat, dan ontstaat een "vrij artikel" dat in een **wachtrij** voor de
  catalogusbeheerders komt; zij kunnen het opschonen en promoveren tot
  catalogusproduct, waarna het artikel eraan gekoppeld wordt. Zo groeit de
  database zelfvoedend uit echt gebruik. Wijzigingen worden gelogd met
  versiegeschiedenis (wie, wat, wanneer) zodat fouten terug te draaien zijn.
- **Catalogus-versionering is ook juridisch nodig:** een certificaat moet de
  productgegevens tonen zoals ze waren op de keuringsdatum. Keuringsitems
  verwijzen daarom naar een snapshot/versie van het product, niet naar de
  live catalogusrij.
- **Vrij artikel: opt-in voor de catalogus-wachtrij** (besloten 2026-06-14).
  Niet elk vrij artikel hoort in de wachtrij — soms is iets eenmalig of
  persoonlijk en voegt het niets toe aan de globale catalogus. Daarom krijgt
  een vrij artikel een vinkje **"voeg toe aan de productendatabase"**. Pas bij
  aanvinken wordt het een wachtrij-item voor de catalogusbeheerders, en worden
  een paar velden verplicht (merk, omschrijving, link naar de handleiding) —
  zo blijft het verwerken voor de catalogusbeheerders behapbaar. Niet
  aangevinkt = blijft een puur eigen artikel, buiten de wachtrij.
- **Artikelcode van de fabrikant** (besloten 2026-06-14). Veel producten
  hebben een eigen bestel-/modelcode van de fabrikant, los van ons interne
  `id` en het serienummer van het exemplaar. Komt als apart veld
  `manufacturer_code` in de catalogus (zie DATAMODEL §2); exact formaat
  bewust nog open, eerst afwachten wat fabrikanten aanleveren via de
  data-samenwerking (`manufacturer-outreach-email.md`).
- **Materiaal: zichtbaarheid en basisbeheer binnen klantbedrijf**
  (besloten 2026-06-14). Kleine klantbedrijven hebben vaak geen aangewezen
  materiaalbeheerder. Daarom kunnen **alle medewerkers** (rol `manager`
  én `end_user` in `customer_members`) **al het materiaal van het
  klantbedrijf inzien**, inclusief aan wie een artikel is toegewezen
  (`assigned_member_id` → naam) — zo werkt "van wie is dit? → kijk in de
  app → gaat in Jan's tas" voor iedereen.

  Beide rollen mogen ook: een **nieuw artikel toevoegen**, de
  **in-gebruiknamedatum invullen** (eenmalig, daarna niet meer wijzigbaar),
  een artikel **afvoeren** (data blijft bewaard, alleen niet meer actief),
  en **opmerkingen plaatsen** bij een artikel (met naam + datum, zie
  `article_notes` in DATAMODEL). Een `end_user` mag dat laatste alleen bij
  **eigen toegewezen artikelen**; een `manager` mag het bij elk artikel.
  Keuringen blijven uitsluitend voor keurmeesters (Pro-app, niet Klant-app).

  Het verschil tussen `manager` en `end_user` zit verder alleen in
  **beheeracties** (medewerkers toevoegen/verwijderen, koppelingen met
  keurbedrijven beheren, abonnement). Er is **geen limiet** op het aantal
  managers per klantbedrijf — grote klantbedrijven kunnen er meerdere
  aanwijzen (bijv. een magazijnbeheerder naast de eigenaar) zonder dat
  daarvoor een apart rolniveau nodig is.

- **Inloggen en onboarding (besloten 2026-06-14).** Geen gedeeld
  wachtwoord en geen "kies je naam"-systeem — elke gebruiker krijgt een
  **eigen, wachtwoordloos account** (Sign in with Apple/Google, of
  magic-link via e-mail). De eigenaar/manager registreert het klantbedrijf
  en deelt daarna een **uitnodigingscode/QR/link** met collega's (zelfde
  patroon als de keurbedrijf-koppeling, zie §3). Wie die code gebruikt,
  logt in met zijn eigen account en krijgt automatisch een
  `customer_members`-rij (`role='end_user'`) bij dat klantbedrijf. Daarna
  blijft iedereen gewoon ingelogd op zijn eigen toestel, zoals elke andere
  app — geen wachtwoord te onthouden, geen herhaald inloggen. Dit geeft elke
  `manager`/`end_user` een echte identiteit, nodig voor het rolverschil,
  voor attributie (`article_notes`) en voor persoonlijke notificaties.

- **Overige spullen — zelf te (laten) keuren** (besloten 2026-06-14). Naast
  PBM/materieel uit de catalogus heeft een bedrijf vaak spullen met een eigen
  keuringsplicht die niets met het keurbedrijf te maken hebben: EHBO-trommel,
  brandblusser, kettingzaag bij de eigen dealer, **auto-APK**. Deze komen in
  een eigen, vrije lijst (`articles.self_managed = true`, zie DATAMODEL §3)
  met eigen herinneringen en een "zelf afgemeld"-knop (`self_checks`,
  optioneel met bijlage van het externe rapport). **Belangrijk:** deze
  artikelen komen nooit in de keuring-wizard van de keurmeester terecht —
  ook niet via een actieve `customer_link`. Voor de keurmeester verandert er
  niets; voor de klant wordt het overzicht compleet ("alles wat aandacht
  nodig heeft op één plek").

## 3. Datamodel (uitgewerkt voorstel in `DATAMODEL.md`)

Het detailontwerp (tabellen, kolommen, rechten per rol, migratie) staat in
**`DATAMODEL.md`** (voorstel v1, 2026-06-12). Hieronder de hoofdlijnen.

Kern-entiteiten (namen nog te bepalen, zie 9.6):

- **Databezit (besloten 2026-06-12):** het klantbedrijf/de eindgebruiker bezit
  de eigen artikelen en keuringshistorie. Stapt een klant over naar een ander
  keurbedrijf, dan gaan data en historie mee ("dat bedrijf heeft geluk, minder
  invulwerk"). Gevolg voor het schema: artikelen en historie hangen aan het
  klantbedrijf; het keurbedrijf is een wisselbare koppeling, geen eigenaar.
  Certificaten blijven altijd zichtbaar voor de klant, ook na overstap.

- **Keuring aanvragen & overstappen (besloten 2026-06-12, verduidelijkt
  2026-06-14):** de huidige mailknop "keuring aanvragen" in KlimKeur Klant
  wordt een in-app **toegangsverzoek**, geen dataverzending. De gebruiker
  kiest het gewenste keurbedrijf uit een openbare lijst van deelnemende
  bedrijven (per regio/land, puur voor vindbaarheid) en stuurt een verzoek;
  het keurbedrijf accepteert, waarna er een nieuwe `customer_links`-rij
  ontstaat. Er wordt **niets gedupliceerd**: de artikelen blijven één
  record, eigendom van de klant (zie "Databezit" hierboven) — het
  geaccepteerde keurbedrijf krijgt er alleen **inzage/bewerkrechten** bij.
  Het verschil met de huidige mail: vroeger moest het keurbedrijf alle
  artikelgegevens handmatig overtypen in hun eigen systeem; nu zien ze de
  bestaande artikelen direct, zonder overtypen. Hetzelfde mechanisme dient
  voor nieuwe (zelfstandige) gebruikers én voor overstappen/erbij-koppelen
  van een ander keurbedrijf (meerdere actieve links mogen, zie
  `customer_links`).

- **Naamgeving (besloten 2026-06-12):** databaseschema en code in het Engels
  (`customers`, `inspections`, `items`, …); Nederlands bestaat alleen nog in
  de UI-taalbestanden. Onderstaande Nederlandse namen zijn dus werknamen.

- `keurbedrijven` (tenant) — branding, abonnement, land/markt
- `keurmeesters` — gekoppeld aan keurbedrijf; vlag `is_catalogusbeheerder`
- `klantbedrijven` — gekoppeld aan keurbedrijf; eigen admin(s)
- `medewerkers` (eindgebruikers) — gekoppeld aan klantbedrijf
- `producten` (globale catalogus) — met versiegeschiedenis
- `artikelen` — fysiek exemplaar bij een klantbedrijf (serienummer, gebruiker,
  in gebruik sinds, …)
- `keuringen` + `keuring_items` — items verwijzen naar productversie
- `certificaten` — gegenereerde PDF, onveranderlijk opgeslagen (zie 5)
- `keuringsregimes` — interval per producttype × markt (zie 4)

Toegangscontrole via Supabase Row Level Security per tenant: een keurbedrijf
ziet alleen eigen klanten, een klantbedrijf alleen eigen artikelen, een
medewerker alleen eigen materiaal.

## 4. Productcatalogus en keuringsregimes (voorstel)

Huidige kolommen (omschrijving, merk, materiaal, categorie, norm, handleiding,
max. leeftijd kalender/gebruik/fabrikant, breuksterkte, bijzonderheden) blijven,
plus:

- `type` — PPE / rigging / hoogwerker / … (bepaalt standaardregime)
- Keuringsinterval niet als losse kolommen ("ppe 12mnd", "6mnd") maar via een
  regime-tabel: producttype × markt → interval in maanden. Per product of per
  artikel desgewenst te overschrijven. Een nieuw land = één regel toevoegen.
- Norm kan per markt verschillen (EN-normen zijn gelijk, maar wettelijk kader
  verschilt: NL Arbowet vs. VK LOLER/PUWER) — certificaatteksten per markt.

## 5. Certificaten / PDF-archief (besloten van richting)

Bij afronden van een keuring wordt de PDF gegenereerd en **vastgelegd in
Supabase Storage**. Nooit achteraf opnieuw genereren: het archief is
onveranderlijk en juridisch houdbaar. Klant-app en keurbedrijf kunnen PDF's
terugvinden en downloaden. Metadata in tabel `certificaten` (nummer, datum,
keurmeester, verwijzing naar bestand).

## 6. Meertaligheid (besloten van richting)

- Alle UI-teksten in taalbestanden (NL, EN-GB), geen hardcoded strings.
- Datum-/getalnotatie via locale (`nl-NL`, `en-GB`).
- Marktspecifiek: keuringsregime (zie 4), veldlabels (KvK ↔ Company
  Registration Number), standaardland, placeholders voor postcode/telefoon.
- Certificaat-PDF in de taal van de markt van het keurbedrijf.

## 7. Distributie en betalen

**Besloten (2026-06-12):**

- **Twee apps** in de stores: een keurmeester-app en een eindgebruiker-app
  (zoals nu pro/klant), op één gedeelde backend. De klant-app stáát in de
  stores — dat oogt betrouwbaar.
- **Prijsrichting B2B:** het keurbedrijf betaalt het platform per gekeurd
  artikel, orde van grootte €0,05–0,10 per artikel per keuring, en berekent
  dat door aan de eigen klant.

- **Abonnement per keurmeester + tikken met staffelkorting.** Werkgetallen
  (besloten van richting, 2026-06-12): **€5 per keurmeester per maand**;
  per gekeurd artikel **€0,10 voor de eerste 1.000** en **€0,05 daarboven**
  (staffel per keurbedrijf per kalenderjaar). Rekenvoorbeeld: 2 keurmeesters,
  8.000 keuringen/jaar → €120 + €100 + €350 = €570/jaar. Facturatie via
  Stripe metered billing; let op vaste transactiekosten bij kleine
  maandbedragen → jaarlijks of per kwartaal incasseren.
- **Klant-app gratis en vrij te downloaden — de leadmotor.** Geen betaalde
  B2C-variant en geen uitnodigingsplicht: iedereen kan de app installeren en
  eigen materiaal invoeren, en klopt daarna via de app aan bij een keurbedrijf
  om alles te laten keuren (zie aanvraagmechanisme in §3). Zo brengt de app
  keurbedrijven nieuwe klanten aan, en verdient het platform pas zodra er
  gekeurd wordt.
- **UX-afspraak hierbij:** materiaal dat nog nooit gekeurd is toont geen rood
  alarm maar "nog niet gekeurd — vraag een keuring aan". Rood is alleen voor
  verlópen keuringen, zodat de gratis app uitnodigt in plaats van afschrikt.
- **Niet-gekoppelde klantaccounts: zachte limiet + vrijwillige bijdrage**
  (besloten 2026-06-14, n.a.v. het scenario "viraal bij eindgebruikers, geen
  betalende keurmeesters"). Een klantaccount zonder actieve koppeling aan een
  keurbedrijf is gratis tot **50 artikelen**. Daarboven: optioneel **€5/jaar
  per 200 extra artikelen**, of een vrijwillige bijdrage — drempel laag voor
  particulieren en kleine klanten, maar geen onbeperkte gratis groei zonder
  betalende kant. Bijgehouden via een artikelteller per niet-gekoppelde
  `customer` (zie DATAMODEL §`usage_counters`). Werkt de klant via een
  betalende keurmeester, dan blijft deze limiet voor die klant irrelevant.

**Spelregels openbare keurbedrijven-lijst** (besloten 2026-06-12).
Kernprincipe: *vindbaarheid* (op de lijst staan) en *bereikbaarheid* (eigen
klanten kunnen koppelen) zijn losgekoppeld:

1. **Uitnodigingscode/QR/link per keurbedrijf** — het normale kanaal voor de
   eigen klanten (keurmeester geeft hem bij de keuring, op de factuur, per
   mail). Koppelen via code werkt altijd, ook als het bedrijf niet op de
   lijst staat.
2. **De lijst is opt-in via een schakelaar "Open voor nieuwe klanten:
   aan/uit"** in de instellingen van het keurbedrijf. Te druk → uit, geen
   nieuwe leads; weer ruimte → aan. Zelf te bedienen, op elk moment.
3. **Zoeken op (exacte) bedrijfsnaam vindt ook niet-gelijste bedrijven**,
   zodat een bestaande klant die de code kwijt is zijn keurbedrijf altijd
   kan vinden. Wie een bedrijf bij naam kent is geen lead van een ander.
4. **Betaalachterstand → automatisch van de lijst** en nieuwe koppelingen
   geblokkeerd tot er betaald is; bestaande klanten houden inzage in hun
   eigen data (die bezitten zij).
5. Bestaande klanten zien de lijst nooit spontaan: wie gekoppeld is ziet
   overal de branding van het eigen keurbedrijf. De lijst verschijnt alleen
   bij een actieve keuze ("keuring aanvragen" als nieuwe gebruiker, of
   bewust "ander keurbedrijf kiezen").
6. Geen rankings of reviews (zeker initieel); sorteren op afstand/regio.

**Technisch:**

- PWA verpakt met Capacitor voor App Store/Play Store.
- Abonnementen via de website (Stripe, geen storecommissie); in de apps wordt
  alleen ingelogd. Geen in-app purchases nodig.

## 8. Techniek (voorstel 2026-06-12, ter bespreking)

**Opzet: monorepo — één codebasis, twee apps, gedeelde kern.**

```
packages/core   → domeinlogica (statusberekening, next_due, regimes),
                  Supabase-client, vertalingen (nl, en-GB), types
packages/ui     → gedeelde componenten en huisstijl
apps/inspector  → keurmeester-app
apps/customer   → klant-app
```

Bouwstenen en motivatie:

- **Backend: Supabase, één project voor alle markten** (anders dubbel
  catalogusbeheer). Auth, Postgres + RLS per rol (zie DATAMODEL §7), Storage
  (certificaten, foto's, kwalificatiebewijzen), Edge Functions.
  **Bewust géén zelf-hosting** (NAS/eigen server besproken en verworpen
  2026-06-12: uptime-, beveiligings- en AVG-verantwoordelijkheid staat niet
  in verhouding tot ~€25/mnd cloudkosten). Vluchtroute bestaat: Supabase is
  open source op PostgreSQL — desnoods later zelf te hosten met volledige
  data-overname. **Eigen-databezit geregeld via automatische periodieke
  back-up (database-dump + certificaten) naar de NAS van Jos.**
- **Frontend: Vue 3 + TypeScript + Vite.** Overzichtelijk, breed gangbaar,
  volwassen i18n (vue-i18n). TypeScript vangt fouten tijdens het bouwen —
  passend bij een veiligheidsproduct. (Alternatief met grootste
  ontwikkelaarspool: React; functioneel gelijkwaardig.)
- **Capacitor** verpakt beide apps voor App Store/Play Store; zelfde code
  draait als website/PWA. Eén codebase, drie kanalen.
- **PDF-generatie server-side** (Edge Function) bij het afronden van een
  keuring: identieke opbouw ongeacht apparaat, hash + verificatie-QR direct
  erbij, archivering rechtstreeks in Storage. Duits cryptografisch zegel
  later op dezelfde plek toe te voegen.
- **Stripe** voor abonnementen + metered billing (tikken), afgehandeld via
  Edge Functions (webhooks).
- **Testen:** unit-tests op de domeinlogica (statusberekening, next_due,
  regimes — de veiligheidskritische rekenregels), end-to-end-tests op de
  kernflows (keuring afronden, certificaat genereren).
- **Hosting web/PWA:** statische hosting met eigen domein (bijv. Cloudflare
  Pages); Supabase doet de rest.

**Architectuurbesluiten (2026-06-12):**

1. **Offline-first (besloten).** De keurmeester-app werkt volledig zonder
   internet: klant + artikelen worden vooraf gesynchroniseerd, keuren kan
   offline, en zodra er verbinding is wordt **automatisch** geüpload (met
   daarnaast een zichtbare "nu synchroniseren"-knop voor 's avonds thuis).
   **Sync-aanpak (akkoord Jos 2026-06-12):** pragmatische eigen sync-laag
   in de app (dataset per keurbedrijf is klein); PowerSync als vluchtweg
   als dat tegenvalt. Geaccepteerde consequentie: na een offline keurdag
   staat de certificaat-PDF pas ná synchronisatie klaar.
   Gevolgen: lokale opslag + sync-engine in `packages/core`;
   certificaatnummers worden gereserveerd vóór vertrek (offline geen nummers
   uitdelen die kunnen botsen); de certificaat-PDF wordt bij synchronisatie
   server-side gegenereerd; foto's wachten in de upload-wachtrij. De klant-app
   blijft online-first (lezen met cache volstaat daar).
2. **Internationale merknaam: Gearonimo (besloten 2026-06-12).**
   Memorabel, internationaal uitspreekbaar, met humor — en het bezwaar
   "gezag op het certificaat" vervalt omdat het certificaat de naam en
   huisstijl van het kéurbedrijf draagt (branding per tenant, DATAMODEL);
   het platform staat hooguit klein als "powered by Gearonimo" in de voet.
   Merkcheck (TMview, door Jos): enige treffer is een **beëindigd**
   Mattel-merk in klasse 28 (speelgoed) — blokkeert niet (dood + andere
   klasse). Domeinen: gearonimo.io/.app/.nl/.eu vrij; gearonimo.com bezet
   maar geparkeerd (eventueel later via broker aankopen).
   Actiepunten Jos: domeinen registreren (.io/.app/.nl/.eu; .com-aankoop
   verkennen), naam checken in App Store/Play Store, zakelijk e-mailadres.
   EU-merkregistratie (~€850, klasse 9 + 42) bij lancering.
   Eerder overwogen: GearCert (serieuze nummer twee, domeinfamilie vrij),
   GearCheck (bezet/generiek), GearProof, CertaGear, NextCheck, Inspecta,
   VeriTag, Knot Bad, MurphyProof, GravityCheck.

## 9. Migratie en onboarding (besloten van richting, 2026-06-12)

- **Safety Green (eigen data):** eenmalig migratiescript dat de huidige
  Supabase-tabellen (klanten, producten, keuringen, keuring_items, bedrijven,
  afkeurcodes) rechtstreeks omzet naar het nieuwe schema. Volledige historie
  gaat mee; geen handmatig invoerwerk en geen "achterdeur" nodig.
- **Andere keurbedrijven (later): CSV-import met fuzzy-matching, geen AI**
  (besloten 2026-06-14). Iedereen heeft een eigen schrijfwijze ("Petzl I'D S"
  / "PETZL ID small"), dus een starre import volstaat niet — maar dat hoeft
  geen AI/LLM te zijn. Opzet in drie stappen, allemaal gewone
  database-functionaliteit (Postgres trigram-zoeken), deterministisch en
  zonder externe aanroepen:
  1. kolommen koppelen — herkenning op kopregel-tekst ("serienummer"/"sn"/
     "serial" → serienummer-kolom), gebruiker bevestigt/corrigeert;
  2. rijen fuzzy matchen tegen de globale catalogus (merk + omschrijving) en
     de beste treffers als "bedoelt u dit?"-dropdown tonen;
  3. de gebruiker kiest uit de dropdown of laat het leeg (→ vrij artikel,
     catalogus-wachtrij, §2); bij de eerste keuring kan de keurmeester de
     koppeling nog corrigeren tegenover het fysieke item.
  Hoe voller de catalogus, hoe beter de suggesties — zelfversterkend. Niet
  nodig in versie één.
- **Gratis gebruikers:** voeren zelf in, geholpen door autocomplete op de
  globale catalogus (zo min mogelijk typwerk).

## 10. Open vragen

1. Prijzen zijn werkgetallen — definitief bevestigen vóór lancering (en
   doorrekenen tegen verwachte kosten: hosting, stores, support, tijd
   god-keurmeesters).
2. Volgende uitwerkthema: het datamodel in detail (tabellen, kolommen,
   rechten per rol).

### Beantwoord

- ~~Wie bezit de data bij overstap?~~ → De klant (zie §3, databezit).
- ~~Eén of twee apps?~~ → Twee (zie §7).
- ~~Wie betaalt wat?~~ → Abonnement per keurmeester + tikken met staffel;
  klant-app gratis (§7).
- ~~Zelfregistratie zonder keurbedrijf?~~ → Ja, gratis; de app is de
  leadmotor richting keurbedrijven (§7).
- ~~Betaalde B2C-variant?~~ → Nee, vervallen (§7).
- ~~Hoe werkt overstappen?~~ → In-app aanvraag met bedrijfskeuze, data gaat
  mee (§3).
- ~~Naamgeving code/schema?~~ → Engels (§3).
- ~~Concrete bedragen?~~ → Werkgetallen: €5/keurmeester/maand; €0,10 per
  artikel t/m 1.000 per jaar, daarna €0,05 (§7).
- ~~Catalogusrechten klantbedrijf-admin?~~ → Alleen eigen artikelen;
  onbekende producten gaan via de wachtrij naar catalogusbeheerders (§2).
- ~~Migratie?~~ → Script voor Safety Green, later CSV-import met
  kolomkoppeling voor anderen (§9).
- ~~Moet een betalend bedrijf op de lijst?~~ → Nee: lijst is een eigen
  schakelaar ("open voor nieuwe klanten"); eigen klanten koppelen altijd via
  uitnodigingscode of naam-zoeken (§7).
- ~~Niet-gekoppelde klantaccounts bij virale groei zonder betalende
  keurmeesters?~~ → Zachte limiet van 50 artikelen gratis, daarna optioneel
  €5/jaar per 200 extra of vrijwillige bijdrage (§7).

## 11. Bronmateriaal

- Huidige apps als functionele specificatie: `klimkeur-pro`, `klimkeur-klant`.
- Analyse vertaalomvang (2026-06-12): ±400–500 strings in Pro, ±100–120 in
  Klant; geen bestaande i18n-infrastructuur; `nl-NL` en 12-maandsinterval
  hardcoded op enkele plekken.
