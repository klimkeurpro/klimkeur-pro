# Blauwdruk: KlimKeur 2.0 (werktitel)

Levend document. Hier denken we de herbouw van KlimKeur Pro + KlimKeur Klant door
voordat er gebouwd wordt. Per onderwerp staat de huidige stand: **besloten**,
**voorstel** (wacht op akkoord) of **open vraag**.

Laatst bijgewerkt: 2026-06-12 (v2: databezit, prijsmodel, twee apps besloten)

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

- **Databezit (besloten 2026-06-12):** het klantbedrijf/de eindgebruiker bezit
  de eigen artikelen en keuringshistorie. Stapt een klant over naar een ander
  keurbedrijf, dan gaan data en historie mee ("dat bedrijf heeft geluk, minder
  invulwerk"). Gevolg voor het schema: artikelen en historie hangen aan het
  klantbedrijf; het keurbedrijf is een wisselbare koppeling, geen eigenaar.
  Certificaten blijven altijd zichtbaar voor de klant, ook na overstap.

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

**Voorstel (nog bevestigen):**

- **Basisabonnement + tikken:** naast de prijs per artikel een laag vast
  bedrag (bijv. per keurmeester per maand) als bodem, zodat ook kleine
  keurbedrijven de vaste kosten dekken. Facturatie via Stripe metered billing
  (gekeurde items per maand tellen).
- **Klant-app gratis** voor medewerkers die via een keurbedrijf zijn
  uitgenodigd (indirect al betaald via de tikken). Betaalde adoptiedrempel bij
  medewerkers zou de waarde voor het keurbedrijf ondergraven.
- **B2C-variant à ±€10/jaar via in-app purchase:** individuen zónder
  keurbedrijf (zzp'er, arborist, sportklimmer) houden eigen materiaal bij.
  Apple/Google-commissie (15% onder $1M omzet) is bij dat bedrag acceptabel.

**Technisch:**

- PWA verpakt met Capacitor voor App Store/Play Store.
- B2B-abonnementen via de website (Stripe, geen storecommissie); in de app
  alleen inloggen. Alleen de B2C-variant loopt via in-app purchase.

## 8. Techniek (open, voorkeur nog bepalen)

- Backend: Supabase (auth, database met RLS, storage) — bewezen in huidige apps.
- Frontend: nader te bepalen. Afweging: bewust simpel (huidige vanilla-aanpak,
  maar dan gestructureerd) versus een licht framework. Capacitor-verpakking en
  i18n wegen mee in de keuze.
- Eén Supabase-project voor alle markten (met markt-kolom) of per markt een
  eigen project — voorkeur: één project, anders wordt de catalogus dubbel
  beheerd.

## 9. Open vragen

1. Akkoord op het prijsvoorstel in §7 (basisabonnement + tikken, klant-app
   gratis, B2C-variant ±€10/jaar)? En welk bedrag wordt het: €0,05 of €0,10
   per artikel?
2. Mag een klantbedrijf-admin producten toevoegen aan de globale catalogus, of
   alleen eigen artikelen aanmaken (voorstel: alleen artikelen; catalogus is
   aan catalogusbeheerders)?
3. Naamgeving database/code: Nederlands houden of Engels (voorstel bij
   internationale ambitie: Engels in code en schema, vertaling alleen in UI)?
4. Migratie: huidige klanten, artikelen en keuringshistorie meenemen naar het
   nieuwe schema — wanneer en hoe testen we dat?
5. Hoe werkt een overstap praktisch: vraagt het nieuwe keurbedrijf toegang aan
   en bevestigt de klantbedrijf-admin (voorstel), of regelt het platform dit?

### Beantwoord

- ~~Wie bezit de data bij overstap?~~ → De klant (zie §3, databezit).
- ~~Eén of twee apps?~~ → Twee (zie §7).
- ~~Wie betaalt wat?~~ → Richting bepaald: keurbedrijf betaalt per gekeurd
  artikel en berekent door; details in §7.

## 10. Bronmateriaal

- Huidige apps als functionele specificatie: `klimkeur-pro`, `klimkeur-klant`.
- Analyse vertaalomvang (2026-06-12): ±400–500 strings in Pro, ±100–120 in
  Klant; geen bestaande i18n-infrastructuur; `nl-NL` en 12-maandsinterval
  hardcoded op enkele plekken.
