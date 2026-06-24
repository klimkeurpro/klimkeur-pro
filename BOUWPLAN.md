# Bouwplan Gearonimo

Hoort bij `BLAUWDRUK.md`, `DATAMODEL.md`, `UX-FLOW.md` en
`ONDERZOEK-CERTIFICAATEISEN.md`. Status: vastgesteld 2026-06-12.

---

## Voortgang (bijgewerkt 2026-06-24)

- **GitHub:** github.com/Gearonimo-app/gearonimo · **Supabase:**
  buitfeiclivzzldfdelp.supabase.co (EU).
- **Fase 1 (skelet):** monorepo (packages/core+ui, apps/inspector+customer),
  i18n nl/en, domeinlogica met tests (status/next_due/regimes),
  e-mail+wachtwoord-login werkend in de inspector-app. ✅ grotendeels af.
- **Fase 2 — in uitvoering:** hoofdmenu werkt; **Klanten-lijst + uitgebreid
  klantformulier af** (zie DATAMODEL `customers`); **klantdetailscherm**
  `/customers/:id` af (bekijken/bewerken/verwijderen); **artikelen per klant**
  met catalogus-zoeken (fuzzy `search_products` + merkfilter, toetsenbord-nav)
  en velden gebruiker/ingebruikname/set/opmerkingen (gebruiker+set voorlopig
  vrije tekst — zie DATAMODEL `articles`); **artikeldetailscherm**
  `/articles/:id` af (bekijken/bewerken/afvoeren, geen harde delete); **echte
  sets af** — samengestelde artikelen (bv. een fliplijn van lijn + lijnklem +
  karabiner) groeperen via `article_sets`/`article_set_members`, los van het
  tijdelijke vrije-tekstveld `set_label` op artikelen zelf. **Medewerkers af**
  — eerste slice van `customer_members` (naam, functie, telefoon, e-mail,
  actief/inactief) op de klantkaart, simpeler dan het einddoel uit DATAMODEL
  (nog geen eigen account/uitnodigingscode per medewerker — zie DATAMODEL
  §`customer_members`). **Keuring-wizard af** (het hart van fase 2, zie
  UX-FLOW §9.3-9.5): Start/Hervat-knop op de klantpagina, en de wizard zelf
  in 4 stappen (artikelen kiezen, per artikel goed-/afkeuren met
  vorige-keuring-context en recall/levensduur-vlaggen, overzicht met
  aanpasbare volgende-keuringsdatum, afronden). Hiervoor is meteen de echte
  multi-tenant basis uit DATAMODEL aangelegd — `inspection_companies`,
  `inspectors` (automatisch aangemaakt per gebruiker, geen apart
  beheerscherm nodig), `customer_links` (automatisch gekoppeld, ook voor
  nieuwe klanten) — ook al is er vandaag nog maar één keurbedrijf; dit
  voorkomt dat dit straks alsnog moet worden rechtgetrokken.
  **Certificaat-PDF af (2026-06-24):** bij het afronden van een keuring
  (stap 4) wordt nu automatisch een PDF gegenereerd — kop/voettekst van het
  keurbedrijf (`inspection_companies.cert_header/footer`, nieuwe velden
  address/postal_code/city/email/phone), per artikel goed/afgekeurd met
  SN, afkeurcode/opmerking en "volgende keuring uiterlijk" + wettelijke
  basis (`packages/core` regimes), en een verificatie-QR. De PDF wordt
  **client-side** gebouwd (`pdf-lib` + `qrcode`, geen edge-function-infra
  nodig — dit verandert niets aan de juridische onveranderlijkheid) en
  éénmalig naar de publieke Storage-bucket `certificates` geüpload; een
  `certificates`-record (`number`, `storage_path`, `pdf_hash`, `verify_token`)
  wordt aangemaakt en `inspections.certificate_number` gezet. Scan van de
  QR (of het delen van de link) opent `/verify/:token`, een publieke pagina
  (geen account nodig) die via de nieuwe `verify_certificate`-RPC
  (security definer, beperkte velden) laat zien dat het certificaat echt is
  — zonder de volledige klant-/keuringdata aan anonieme bezoekers te geven.
  Certificaatnummer-formaat volgt Jos' huidige praktijk
  (`JJJJMMDD-KLANTNAAM`). Migratie: `supabase/migrations/20260624_certificates.sql`.
  **Echte bedrijfsgegevens + afkeurcodes ingevuld (2026-06-25):** Jos heeft
  de echte naam/adres/kop-/voettekst van Safety Green B.V. en de 8
  afkeurcodes uit de huidige praktijk aangeleverd (1 slijtage/opgebruikt,
  2 mechanisch beschadigd, 3 brand- of smeltplekken, 4 roest, 5 leeftijd of
  label, 6 defecte sluiting, 7 modificatie, 8 anders/zie opmerkingen) — zie
  `supabase/migrations/20260625_company_details_and_rejection_codes.sql`,
  uitgevoerd in Supabase. Afkeurcodes zijn nog **niet** door de gebruiker
  zelf te beheren (geen instellingenscherm); dat staat nog open.
  **Gemerged naar `main` en live (2026-06-25):** de feature-branch is
  fast-forward gemerged naar `main` en gepusht; gearonimo.net (GitHub
  Pages, auto-deploy bij push naar `main`) draait nu met de
  certificaat-functionaliteit. **We staan op het punt van de eerste echte
  test**: Jos gaat een volledige keuring afronden op
  https://gearonimo.net en controleren of het certificaat klopt
  (PDF-inhoud, QR-link naar `/verify/:token`, downloadlink). Resultaat van
  die test nog niet teruggekoppeld — vervolgsessie begint hiermee.
  Bewust nog buiten scope: foto's bij afkeuring, instellingenscherm voor
  afkeurcodes.
  Nog te bouwen: UI-opmaak/styling-pas, plus de overige tegels
  (keuringen-overzicht is een eerste opzet, SN-zoeken, instellingen).
  > Detailvelden staan in **DATAMODEL.md**, niet in dit bouwplan: het bouwplan
  > is de fasering, het datamodel is de veldenbron.
- **Live:** de inspector-app draait op **https://gearonimo.net** (GitHub
  Pages; auto-deploy bij elke push naar `main`, zie
  `.github/workflows/deploy.yml`). De repo is daarvoor **openbaar** gemaakt.
- **Let op — beveiliging:** RLS staat momenteel **UIT** op `customers`
  (tijdelijk, voor testen); tabelrechten zijn toegekend aan de rol
  `authenticated`. RLS moet later aan, met scope op `customer_id` (zie
  BLAUWDRUK). Dit was ook de "permission denied" die deze sessie is opgelost:
  een GRANT-kwestie, geen sessie-/RLS-probleem.

Uitgangspunten:

- **Elke fase eindigt met iets dat Jos kan vasthouden en testen.** Geen
  maanden bouwen in het donker.
- **De huidige apps blijven onaangeraakt draaien** tot GearCert zich in de
  praktijk bewezen heeft (schaduwdraaien, zie fase 2).
- **Veiligheidskritische rekenregels eerst en met tests**: next_due,
  statusberekening, regimes — daar mag nooit een fout in sluipen.
- Rolverdeling: Claude bouwt; Jos test, levert productkennis (catalogus,
  afkeurcodes, certificaatteksten) en regelt accounts/registraties.

---

## Fase 0 — Zakelijke fundering (acties Jos, ±een dagdeel)

Privé en zakelijk gescheiden vanaf dag één (besluit Jos 2026-06-12):

1. ~~**Domeinen registreren**~~ — uitgevoerd: **gearonimo.net** geregistreerd
   (bij Porkbun) en in gebruik als live-adres. (Oorspronkelijk plan noemde
   .io/.app/.nl/.eu; uiteindelijk .net gekozen.)
2. ~~**Zakelijk e-mailadres**~~ — uitgevoerd: **info@gearonimo.net** (via Zoho
   Mail). (Oorspronkelijk plan noemde jos@gearonimo.app/.nl.)
3. ~~**GitHub-organisatie**~~ — uitgevoerd: org **Gearonimo-app**.
4. ~~**Supabase-account**, nieuw project in EU-regio~~ — uitgevoerd:
   project buitfeiclivzzldfdelp (EU).
5. ~~Merkcheck~~ gedaan (TMview: alleen beëindigd Mattel-merk klasse 28 —
   geen blokkade). Nog doen: **naam checken in App Store en Play Store**.
6. *Pas later nodig:* Stripe-account (fase 5), Apple Developer $99/jaar en
   Google Play $25 eenmalig (fase 5), EU-merkregistratie ~€850, klasse 9 +
   42 (bij lancering).

## Fase 1 — Skelet en kern (±2–3 bouwsessies)

- Monorepo opzetten (packages/core, packages/ui, apps/inspector,
  apps/customer) met automatische bouw/test-pijplijn op GitHub.
- Databaseschema als migraties (rechtstreeks uit `DATAMODEL.md`), RLS-regels
  per rol, seed met de keuringsregime-tabel (NL/VK-defaults uit het
  onderzoek).
- Vertaalskelet nl + en-GB; domeinlogica (next_due, statusberekening,
  regime-resolutie) **met unit-tests**.
- Inloggen + rollen werkend in beide apps (web).
- **Testbaar resultaat:** Jos kan inloggen in twee lege maar echte apps.

## Fase 2 — De keurmeester-flow, het hart (±4–6 bouwsessies)

- Klanten, artikelen, winkel-catalogus (eenmalige import van de huidige
  producten-tabel van Safety Green als startcatalogus).
- Keuring-wizard volgens `UX-FLOW.md`: Start/Hervat-contextknop, artikelen
  klaargezet uit vorige keuring, SN-suffix-zoeken, tik-flow,
  afrondscherm met aantallen, recall-vlag.
- **Offline:** lokale opslag op het toestel + sync-laag (route 1),
  automatische upload bij verbinding + handmatige sync-knop.
- **Certificaat-PDF server-side** met hash + verificatie-QR, archivering in
  Storage; verificatiepagina (scan → echt record).
- **Mijlpaal — schaduwdraaien:** Jos doet één echte keurdag volledig in
  GearCert náást de huidige werkwijze en vergelijkt: sneller? niets gemist?
  certificaat goed? Pas door naar fase 3 als dit klopt.

## Fase 3 — De klant-app (±2–3 bouwsessies)

- Dashboard "ben ik in orde", artikelen + historie, certificaten downloaden,
  handleiding-links.
- Keuring aanvragen: uitnodigingscode/QR, openbare lijst met
  "open voor nieuwe klanten"-schakelaar, naam-zoeken (leadmotor,
  blauwdruk §7).
- Klantbedrijf-admin: medewerkers beheren, artikelen toevoegen
  (catalogus-autocomplete; onbekend product → wachtrij).
- **Mijlpaal:** één echte klant van Safety Green als pilotgebruiker.

## Fase 4 — Migratie en overstap Safety Green (±2 bouwsessies)

- Migratiescript: huidige Supabase-data (klanten, producten, keuringen,
  keuring_items, klant-accounts) → nieuw schema; artikelen afleiden door
  groeperen op klant + serienummer (DATAMODEL §8).
- Proefmigratie + controle door Jos (kloppen aantallen, historie,
  certificaatnummers?); daarna definitieve overstap.
- Catalogus-wachtrij + god-rol actief; NAS-back-up ingeregeld
  (blauwdruk §8).
- **De oude apps blijven als noodrem beschikbaar** (alleen-lezen).

## Fase 5 — Commercieel en de stores (±3–4 bouwsessies)

- Stripe: abonnement per keurmeester + metered tikken met staffel
  (blauwdruk §7).
- Capacitor-builds; store-registraties (App Store / Play Store) voor beide
  apps; marketing-/aanmeldsite op gearcert.com.
- En-GB vertaling afronden + VK-regime activeren; kwalificatie-uploads
  zichtbaar voor klanten.
- **Mijlpaal: lancering** — eerst NL, daarna VK.

## Daarna (bewust buiten het plan)

- Duitsland (DE-vertaling + elektronisch zegel op PDF), VS.
- CSV-import met fuzzy-matching voor nieuwe keurbedrijven (zie BLAUWDRUK §9).
- Keuringsplanner als optionele module.
- B2B-rapportages, NEN 3140-meetwaarden.

## Ritme en doorlooptijd

Totaal ±13–18 bouwsessies. Het tempo bepaalt Jos: elke fase eindigt met
testwerk voor hem, en pas na zijn akkoord gaat de volgende fase open. Bij
een ritme van 2–3 sessies per week is fase 2 (schaduwdraaien) binnen een
maand bereikbaar.
