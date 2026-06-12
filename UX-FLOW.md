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

## 4. Vragen aan Jos (volgende sparringronde)

1. Beschrijf je typische keuringsdag stap voor stap — van vertrek tot
   's avonds. Waar zitten de momenten die nu onhandig zijn?
2. Welke 5 handelingen doe je het állervaakst in de huidige app? (Die
   verdienen de minste tikken.)
3. Scan je nu serienummers of typ je ze meestal? Hebben de artikelen van
   klanten vaak een leesbare/scanbare code?
4. Keur je meestal per klant op locatie, of komen spullen ook naar jouw
   werkplaats (zoals de keuringsplanner suggereert met binnenkomst/retour)?
5. Wat staat er nu dubbel in de app dat jou het meest irriteert?
