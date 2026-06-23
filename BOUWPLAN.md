# Bouwplan Gearonimo

Hoort bij `BLAUWDRUK.md`, `DATAMODEL.md`, `UX-FLOW.md` en
`ONDERZOEK-CERTIFICAATEISEN.md`. Status: vastgesteld 2026-06-12.

---

## Voortgang (bijgewerkt 2026-06-23)

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
  vrije tekst — zie DATAMODEL `articles`). Nog te bouwen: artikeldetail/bewerken,
  echte sets + medewerkers, en de keuring-wizard (het hart van fase 2), plus de
  overige tegels (keuringen, SN-zoeken, instellingen).
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
