# Blauwdruk: KlimKeur 2.0 (werktitel)

Levend document. Hier denken we de herbouw van KlimKeur Pro + KlimKeur Klant door
voordat er gebouwd wordt. Per onderwerp staat de huidige stand: **besloten**,
**voorstel** (wacht op akkoord) of **open vraag**.

Laatst bijgewerkt: 2026-06-12

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
| Klantbedrijf-admin | klantbedrijf | (zie open vraag 9.3) | eigen personeel beheren, eigen artikelen toevoegen |
| Medewerker (eindgebruiker) | klantbedrijf | app store / gratis | eigen materiaal inzien, keuringsstatus, PDF's downloaden |

Hiërarchie: platform → keurbedrijven (tenants) → klantbedrijven → medewerkers.

Aandachtspunten bij dit model:

- **"God"-versie en kwaliteitsbewaking.** Wijzigingen in de globale catalogus
  raken álle gebruikers. Voorstel: bijdragen van catalogusbeheerders komen in
  een wachtrij of worden gelogd met versiegeschiedenis, zodat een fout
  teruggedraaid kan worden en zichtbaar is wie wat wijzigde.
- **Catalogus-versionering is ook juridisch nodig:** een certificaat moet de
  productgegevens tonen zoals ze waren op de keuringsdatum. Keuringsitems
  verwijzen daarom naar een snapshot/versie van het product, niet naar de
  live catalogusrij.

## 3. Datamodel (voorstel, hoofdlijnen)

Kern-entiteiten (namen nog te bepalen, zie 9.6):

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

## 7. Distributie en betalen (voorstel, nog doorspreken)

- Waarschijnlijk twee apps in de stores: een keurmeester-app en een
  eindgebruiker-app (zoals nu pro/klant), op één gedeelde backend.
- Technisch: PWA verpakt met Capacitor voor App Store/Play Store.
- **Let op Apple/Google-commissie (15–30%):** digitale abonnementen die ín de
  app worden afgesloten moeten via in-app purchase. B2B-abonnementen
  (keurbedrijven) kunnen zoals gangbaar via de website (Stripe) worden verkocht;
  in de app log je alleen in. De eindgebruikers-app kan gratis zijn (toegang
  via klantbedrijf). Een eventuele losse B2C-variant (individu beheert eigen
  materiaal) zou wél via in-app purchase moeten.

## 8. Techniek (open, voorkeur nog bepalen)

- Backend: Supabase (auth, database met RLS, storage) — bewezen in huidige apps.
- Frontend: nader te bepalen. Afweging: bewust simpel (huidige vanilla-aanpak,
  maar dan gestructureerd) versus een licht framework. Capacitor-verpakking en
  i18n wegen mee in de keuze.
- Eén Supabase-project voor alle markten (met markt-kolom) of per markt een
  eigen project — voorkeur: één project, anders wordt de catalogus dubbel
  beheerd.

## 9. Open vragen

1. Kunnen eindgebruikers/klantbedrijven zich zelfstandig aanmelden (B2C, eigen
   materiaal bijhouden zonder keurbedrijf), of bestaat een account alleen via
   een keurbedrijf?
2. Eén app of twee apps in de stores? (Voorstel: twee, zie 7.)
3. Wie betaalt wat precies? Keurbedrijf-abonnement per keurmeester? Betaalt een
   klantbedrijf ook, of zit dat in het abonnement van het keurbedrijf? Wat
   kost de eindgebruikers-app in de store?
4. Kan een klantbedrijf overstappen naar een ander keurbedrijf, en wie "bezit"
   dan de keuringshistorie en certificaten?
5. Mag een klantbedrijf-admin producten toevoegen aan de globale catalogus, of
   alleen eigen artikelen aanmaken (voorstel: alleen artikelen; catalogus is
   aan catalogusbeheerders)?
6. Naamgeving database/code: Nederlands houden of Engels (voorstel bij
   internationale ambitie: Engels in code en schema, vertaling alleen in UI)?
7. Migratie: huidige klanten, artikelen en keuringshistorie meenemen naar het
   nieuwe schema — wanneer en hoe testen we dat?
8. Wat wilde je nog noemen na "pdf opslaan, …" in het gesprek? (zin brak af)

## 10. Bronmateriaal

- Huidige apps als functionele specificatie: `klimkeur-pro`, `klimkeur-klant`.
- Analyse vertaalomvang (2026-06-12): ±400–500 strings in Pro, ±100–120 in
  Klant; geen bestaande i18n-infrastructuur; `nl-NL` en 12-maandsinterval
  hardcoded op enkele plekken.
