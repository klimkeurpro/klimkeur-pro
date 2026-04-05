// ============================================================
// store.js — lokale datastructuur, constanten, Supabase data laden en mappen
//
// ARTIKEL_ID FIX (v3):
// Elk keuring_item heeft nu twee ID's:
//   - rowId   → uniek per database-rij (= kolom 'id' in keuring_items)
//   - itemId  → persistent per fysiek artikel (= kolom 'artikel_id')
//
// Bij overnemen naar nieuwe keuring: itemId blijft, rowId wordt nieuw.
// Zo blijft de keuringshistorie per artikel behouden in de database.
//
// DB-VERVUILING FIX (v4):
// Bij afronden van een keuring worden onaangeraakte items (lege status,
// geen afkeurcode, geen opmerking, niet afgevoerd) uit de database
// verwijderd via sbDeleteOnaangeraakteItems(). Zo blijven er geen lege
// rijen achter van items die tijdens de keuring nooit beoordeeld zijn.
// De historie van die artikelen blijft bestaan in eerdere keuringen.
// ============================================================

DEFAULT_PRODUCTS = [];

SN_DATA = [{"merk": "ART", "voorbeeld": "21,1601001", "formaat": "xxYYxx xxx", "link": "Manual-RopeGuide-2010.pdf"}, {"merk": "CT-Climbing", "voorbeeld": "2211-122-22", "formaat": "xxxx-DDD-YY", "link": "CTClimbing.pdf"}, {"merk": "DMM", "voorbeeld": "210321234E", "formaat": "YYDDDxxxx#", "link": "https://dmmwales.com/pages/dmm-product-markings-and-packaging"}, {"merk": "Edelrid", "voorbeeld": "verschild", "formaat": "MMYY-xx-xxx-xxxx", "link": "Edelrid.pdf"}, {"merk": "FallSave", "voorbeeld": "121844", "formaat": "MM/YYYY", "link": "FallSave.pdf"}, {"merk": "ISC", "voorbeeld": "22/45654/1234", "formaat": "YY/xxxxx/xxx", "link": "https://www.iscwales.com/News/Blog/New-Serial-Numbering-Implementation/"}, {"merk": "Kask", "voorbeeld": "21,1234567.1234", "formaat": "YY.xxxxxxx.xxxx", "link": "superplasma-pl-het-user-manual.pdf"}, {"merk": "Kask", "voorbeeld": "21,1234,5678", "formaat": "YY.xxxx.xxxx", "link": "kask zenith.pdf"}, {"merk": "Kong", "voorbeeld": "456218 22 6543", "formaat": "xxxxxxYYxxxx", "link": "Kong.pdf"}, {"merk": "Kong conectors", "voorbeeld": "123456 2206 1234", "formaat": "xxxxxxMMYYxxxx", "link": "KONG_CONNECTORS.pdf"}, {"merk": "Miller by Honneywell", "voorbeeld": "23/20 123415678/005", "formaat": "WWYYxxxxxx", "link": "handleidingDownL\\Tractel.pdf"}, {"merk": "Petzl", "voorbeeld": "18E45654123", "formaat": "YYMxxxxxx", "link": "PetzlVertex.pdf"}, {"merk": "Petzl pre2016", "voorbeeld": "12122AV6543", "formaat": "YYDDDxxxxxx", "link": "PetzlVertex.pdf"}, {"merk": "RockExotica", "voorbeeld": "22123A001", "formaat": "YYDDDaxxx", "link": "RockExotica.pdf"}, {"merk": "Simond", "voorbeeld": "010622", "formaat": "xxMMYY", "link": "https://www.simond.com/user-guide-connectors-quickdraw-straps#80f2999d-56a1-4258-a3d1-289397b08731"}, {"merk": "Taz", "voorbeeld": "S01 220629 0001", "formaat": "xxxYYMMDDxxxx", "link": "Taz.pdf"}, {"merk": "Tractel", "voorbeeld": "DEM202000001", "formaat": "Bij f: YY/MM", "link": "Tractel.pdf"}, {"merk": "TreeRunner_Lacd", "voorbeeld": "productie jaar zijn laatste 2 van lot nummer", "formaat": "xxxxYY", "link": "Tree-Runner_Lacd.pdf"}, {"merk": "XSPlatforms", "voorbeeld": "verschild", "formaat": "", "link": "XSPlatforms.pdf"}, {"merk": "Courant klimlijn", "voorbeeld": "test", "formaat": "", "link": ""}];

// Safety Green afkeurcodes — bewaard voor achterwaartse compatibiliteit
CERT_INFO = {"afkeurcodes": [{"code": 1, "tekst": "Slijtage, opgebruikt"}, {"code": 2, "tekst": "Mechanisch beschadigd"}, {"code": 3, "tekst": "Brand-, verharde- en/of smeltplekken"}, {"code": 4, "tekst": "Deformatie, knelplekken"}, {"code": 5, "tekst": "Leeftijd en herkomst onbekend"}, {"code": 6, "tekst": "Defecte sluiting, sluiting ontbreekt"}, {"code": 7, "tekst": "CE kenmerk, -label ontbreekt / is incorrect"}, {"code": 8, "tekst": "Roest, oxidatie, vervuild"}, {"code": 9, "tekst": "Verkeerde knoop"}, {"code": 10, "tekst": "Leeftijd, veroudering"}, {"code": 11, "tekst": "Foute, defecte, losgelaten splits"}, {"code": 12, "tekst": "Defecte lijnklem"}, {"code": 13, "tekst": "Defecte oprolautomaat"}, {"code": 14, "tekst": "Gemodificeerd of veranderd"}], "keurmeesters": [], "bedrijfsnaam": "", "kvk": ""};

// ============================================================
// STANDAARD AFKEURCODES — voor nieuwe bedrijven op het platform
// Safety Green houdt zijn eigen 14 codes uit de afkeurcodes tabel.
// ============================================================
const STANDAARD_AFKEURCODES = [
  { code: 1, tekst: 'Slijtage / opgebruikt' },
  { code: 2, tekst: 'Mechanisch beschadigd' },
  { code: 3, tekst: 'Hitte- / brandschade' },
  { code: 4, tekst: 'Roest / oxidatie / vervuild' },
  { code: 5, tekst: 'Label of CE-markering ontbreekt / incorrect' },
  { code: 6, tekst: 'Defecte of ontbrekende sluiting' },
  { code: 7, tekst: 'Leeftijd / veroudering' },
  { code: 8, tekst: 'Zie opmerkingen' },
];

// ============================================================
// CACHE SLEUTEL — per bedrijf geïsoleerd
// Elk bedrijf krijgt zijn eigen localStorage-sleutel zodat
// Safety Green-data nooit de cache van een ander bedrijf besmet.
// ============================================================
function getStoreKey() {
  return _huidigBedrijfId ? DB_KEY + '_' + _huidigBedrijfId : DB_KEY;
}

// ============================================================
// SUPABASE LEES-FUNCTIES
// ============================================================

async function loadStoreFromSupabase() {
  try {
    const [
      { data: klanten,      error: e1 },
      { data: keuringen,    error: e2 },
      { data: producten,    error: e3 },
      { data: afkeurcodes,  error: e4 },
      { data: keurmeesters, error: e5 },
    ] = await Promise.all([
      sb.from('klanten').select('*').eq('bedrijf_id', _huidigBedrijfId).order('aangemaakt_op', { ascending: true }),
      sb.from('keuringen').select('*, keuring_items(*)').eq('bedrijf_id', _huidigBedrijfId).order('datum', { ascending: false }),
      sb.from('producten').select('*').eq('bedrijf_id', _huidigBedrijfId).order('omschrijving'),
      // Gefilterd op bedrijf_id zodat afkeurcodes van andere bedrijven
      // nooit in de verkeerde store terechtkomen
      sb.from('afkeurcodes').select('*').eq('bedrijf_id', _huidigBedrijfId).order('code'),
      sb.from('keurmeesters').select('id, naam, handtekening, email, auth_user_id').eq('bedrijf_id', _huidigBedrijfId),
    ]);

    if (e1 || e2 || e3 || e4 || e5) {
      const err = e1 || e2 || e3 || e4 || e5;
      console.error('Supabase laad-fout:', err);
      throw err;
    }

    const keuringenMapped = (keuringen || []).map(k => {
      const items = (k.keuring_items || []).map(item => ({
        // ── ARTIKEL_ID FIX ──────────────────────────────────────
        // rowId  = unieke database-rij (kolom 'id')
        // itemId = persistent artikel-ID (kolom 'artikel_id')
        // Fallback: als artikel_id nog niet gevuld is (oude data),
        // gebruik dan het rij-id zodat bestaande logica niet breekt.
        // ────────────────────────────────────────────────────────
        rowId:         item.id,
        itemId:        item.artikel_id || item.id,
        omschrijving:  item.omschrijving || '',
        merk:          item.merk || '',
        materiaal:     item.materiaal || '',
        serienummer:   item.serienummer || '',
        productieDatum: item.productie_datum || '',
        fabrJaar:      item.fabr_jaar || '',
        fabrMaand:     item.fabr_maand || '',
        inGebruik:     item.in_gebruik || '',
        gebruiker:     item.gebruiker || '',
        status:        item.status || '',
        afkeurcode:    item.afkeurcode || '',
        opmerking:     item.opmerking || '',
        handleiding:   item.handleiding || '',
        afgevoerd:     item.afgevoerd || false,
      }));
      return {
        id:           k.id,
        klantId:      k.klant_id,
        klantNaam:    k.bedrijf_keurmeester || '',
        datum:        k.datum || '',
        keurmeester:  k.keurmeester || '',
        certificaatNr: k.certificaat_nr || '',
        status:       k.status || 'concept',
        afgerond:     k.afgerond || false,
        opmerkingen:  k.opmerkingen || '',
        items,
      };
    });

    const klantenMapped = (klanten || []).map(k => ({
      id:             k.id,
      bedrijf:        k.bedrijf || '',
      contactpersoon: k.contactpersoon || '',
      klantnummer:    k.klantnummer || '',
      telefoon:       k.telefoon || '',
      email:          k.email || '',
      straat:         k.straat || '',
      huisnr:         k.huisnummer || '',
      postcode:       k.postcode || '',
      plaats:         k.plaats || '',
      land:           k.land || 'Nederland',
      adres:          k.adres || '',
      opmerkingen:    k.opmerkingen || '',
      auth_user_id:   k.auth_user_id || null,
    }));

    const productenMapped = (producten || []).map(p => ({
      id:             p.id,
      omschrijving:   p.omschrijving || '',
      merk:           p.merk || '',
      materiaal:      p.materiaal || '',
      categorie:      p.categorie || '',
      enNorm:         p.norm || '',
      handleiding:    p.handleiding || '',
      maxLeeftijd:    p.max_leeftijd || '',
      maxLeeftijdUSE: p.max_leeftijd_use || '',
      maxLeeftijdMFR: p.max_leeftijd_mfr || '',
      breuksterkte:   p.breuksterkte || '',
      bijzonderheden: p.bijzonderheden || '',
    }));

    const afkeurcodesMapped = (afkeurcodes || []).map(a => ({
      _id:  a.id,
      code: parseInt(a.code) || a.code,
      tekst: a.tekst || '',
    }));

    const keurmeestersMapped = (keurmeesters || []).map(k => ({
      _id:          k.id,
      naam:         k.naam || '',
      handtekening: k.handtekening || '',
      email:        k.email || '',
      auth_user_id: k.auth_user_id || null,
    }));

    return {
      klanten:       klantenMapped,
      keuringen:     keuringenMapped,
      products:      productenMapped,
      afkeurcodes:   afkeurcodesMapped,
      keurmeesters:  keurmeestersMapped,
      _fromSupabase: true,
    };
  } catch(err) {
    console.error('loadStoreFromSupabase mislukt:', err);
    return null;
  }
}

function getStore() {
  try {
    const raw = localStorage.getItem(getStoreKey());
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function saveStore(store) {
  try { localStorage.setItem(getStoreKey(), JSON.stringify(store)); } catch(e) {}
}

// ============================================================
// SUPABASE SCHRIJF-FUNCTIES
// ============================================================

async function sbSaveSettings(settings) {
  // Uitgefaseerd — instellingen worden nu opgeslagen via sbSlaInstellingenOp() in bedrijven tabel
  // Deze functie blijft bestaan zodat bestaande aanroepen niet crashen
}

async function sbSaveSnData(snData) {
  const { error } = await sb.from('instellingen').upsert(
    { sleutel: 'snData', waarde: JSON.stringify(snData), bijgewerkt_op: new Date().toISOString(), bedrijf_id: _huidigBedrijfId },
    { onConflict: 'sleutel,bedrijf_id' }
  );
  if (error) console.error('sbSaveSnData fout:', error);
}

async function sbSaveKeurmeesters(keurmeesters) {
  // Uitgefaseerd — keurmeesters worden nu rechtstreeks in de keurmeesters tabel beheerd
  // Deze functie blijft bestaan zodat bestaande aanroepen niet crashen
}

async function sbSaveAfkeurcodes(afkeurcodes) {
  const { error } = await sb.from('instellingen').upsert(
    { sleutel: 'afkeurcodes', waarde: JSON.stringify(afkeurcodes), bijgewerkt_op: new Date().toISOString(), bedrijf_id: _huidigBedrijfId },
    { onConflict: 'sleutel,bedrijf_id' }
  );
  if (error) console.error('sbSaveAfkeurcodes fout:', error);
}

async function sbUpsertKlant(klant) {
  const row = {
    id:             klant.id,
    bedrijf:        klant.bedrijf || '',
    contactpersoon: klant.contactpersoon || '',
    klantnummer:    klant.klantnummer || '',
    telefoon:       klant.telefoon || '',
    email:          klant.email || '',
    straat:         klant.straat || '',
    huisnummer:     klant.huisnummer || klant.huisnr || '',
    postcode:       klant.postcode || '',
    plaats:         klant.plaats || '',
    land:           klant.land || 'Nederland',
    adres:          klant.adres || '',
    opmerkingen:    klant.opmerkingen || '',
    auth_user_id:   klant.auth_user_id || null,
    bedrijf_id:     _huidigBedrijfId,
  };
  const { error } = await sb.from('klanten').upsert(row, { onConflict: 'id' });
  if (error) { console.error('sbUpsertKlant fout:', error); toast('Fout bij opslaan klant in Supabase', 'error'); }
}

async function sbDeleteKlant(id) {
  const { error } = await sb.from('klanten').delete().eq('id', id);
  if (error) { console.error('sbDeleteKlant fout:', error); toast('Fout bij verwijderen klant in Supabase', 'error'); }
}

async function sbUpsertProduct(product) {
  const row = {
    id:               product.id || generateId(),
    omschrijving:     product.omschrijving || '',
    merk:             product.merk || '',
    materiaal:        product.materiaal || '',
    categorie:        product.categorie || '',
    norm:             product.enNorm || '',
    handleiding:      product.handleiding || '',
    max_leeftijd:     product.maxLeeftijd ? String(product.maxLeeftijd) : '',
    max_leeftijd_use: product.maxLeeftijdUSE || '',
    max_leeftijd_mfr: product.maxLeeftijdMFR || '',
    breuksterkte:     product.breuksterkte || '',
    bijzonderheden:   product.bijzonderheden || '',
    bedrijf_id:       _huidigBedrijfId,
  };
  if (!product.id) product.id = row.id;
  const { error } = await sb.from('producten').upsert(row, { onConflict: 'id' });
  if (error) { console.error('sbUpsertProduct fout:', error); toast('Fout bij opslaan product in Supabase', 'error'); }
}

async function sbDeleteProduct(id) {
  if (!id) return;
  const { error } = await sb.from('producten').delete().eq('id', id);
  if (error) console.error('sbDeleteProduct fout:', error);
}

async function sbUpsertKeuring(keuring) {
  const row = {
    id:                  keuring.id,
    klant_id:            keuring.klantId,
    certificaat_nr:      keuring.certificaatNr || '',
    datum:               keuring.datum || null,
    keurmeester:         keuring.keurmeester || '',
    bedrijf_keurmeester: keuring.klantNaam || '',
    status:              keuring.status || 'concept',
    afgerond:            keuring.afgerond || false,
    opmerkingen:         keuring.opmerkingen || '',
    bijgewerkt_op:       new Date().toISOString(),
    bedrijf_id:          _huidigBedrijfId,
  };
  const { error } = await sb.from('keuringen').upsert(row, { onConflict: 'id' });
  if (error) { console.error('sbUpsertKeuring fout:', error); toast('Fout bij opslaan keuring in Supabase', 'error'); }
}

// ── DB-VERVUILING FIX ──────────────────────────────────────
// sbDeleteKeuring ruimt nu eerst alle keuring_items van deze keuring op,
// daarna pas de keuring zelf. Zo blijven er geen weeskinderen achter
// als je een lopende keuring verwijdert waar al items voor aangemaakt
// zijn (inclusief lege overgenomen items).
// ─────────────────────────────────────────────────────────────
async function sbDeleteKeuring(id) {
  // Stap 1: items van deze keuring verwijderen
  const { error: itemErr } = await sb.from('keuring_items').delete().eq('keuring_id', id);
  if (itemErr) {
    console.error('sbDeleteKeuring (items cascade) fout:', itemErr);
    toast('Fout bij verwijderen keuring items in Supabase', 'error');
    return;
  }
  // Stap 2: keuring zelf verwijderen
  const { error } = await sb.from('keuringen').delete().eq('id', id);
  if (error) { console.error('sbDeleteKeuring fout:', error); toast('Fout bij verwijderen keuring in Supabase', 'error'); }
}

// --- KEURING ITEMS ---

// ── ARTIKEL_ID FIX ──────────────────────────────────────────
// _itemToRow vertaalt een item-object naar een database-rij.
//
// Twee ID's:
//   item.rowId  → database kolom 'id'         (uniek per rij)
//   item.itemId → database kolom 'artikel_id' (persistent per fysiek artikel)
//
// Bij overnemen naar een nieuwe keuring krijgt het item een
// nieuwe rowId maar behoudt dezelfde itemId. Zo ontstaat er
// een rij per keuring per artikel, en kun je de volledige
// keuringshistorie opvragen via artikel_id.
// ─────────────────────────────────────────────────────────────
function _itemToRow(item, keuringId, klantId) {
  return {
    id:              item.rowId || generateId(),
    artikel_id:      item.itemId || null,
    keuring_id:      keuringId,
    klant_id:        klantId || null,
    omschrijving:    item.omschrijving || '',
    merk:            item.merk || '',
    materiaal:       item.materiaal || '',
    serienummer:     item.serienummer || '',
    productie_datum: item.productieDatum || '',
    fabr_jaar:       item.fabrJaar ? parseInt(item.fabrJaar) : null,
    fabr_maand:      item.fabrMaand || null,
    in_gebruik:      item.inGebruik || null,
    gebruiker:       item.gebruiker || '',
    status:          item.status || '',
    afkeurcode:      Array.isArray(item.afkeurcode)
                       ? item.afkeurcode.join(',')
                       : (item.afkeurcode || ''),
    opmerking:       item.opmerking || '',
    handleiding:     item.handleiding || '',
    afgevoerd:       item.afgevoerd || false,
    bedrijf_id:      _huidigBedrijfId,
  };
}

async function sbUpsertKeuringItem(item, keuringId, klantId) {
  // Zorg dat beide ID's bestaan
  if (!item.itemId) item.itemId = generateId();
  if (!item.rowId)  item.rowId  = generateId();
  const row = _itemToRow(item, keuringId, klantId);
  const { error } = await sb.from('keuring_items').upsert(row, { onConflict: 'id' });
  if (error) { console.error('sbUpsertKeuringItem fout:', error); toast('Fout bij opslaan item in Supabase', 'error'); }
}

async function sbDeleteKeuringItem(rowId) {
  // Let op: parameter is rowId (database rij-id), NIET itemId (artikel-id)
  const { error } = await sb.from('keuring_items').delete().eq('id', rowId);
  if (error) console.error('sbDeleteKeuringItem fout:', error);
}

async function sbSyncAllKeuringItems(keuring) {
  if (!keuring.items || keuring.items.length === 0) return;
  const rows = keuring.items.map(item => {
    // Zorg dat beide ID's bestaan
    if (!item.itemId) item.itemId = generateId();
    if (!item.rowId)  item.rowId  = generateId();
    return _itemToRow(item, keuring.id, keuring.klantId);
  });
  const { error } = await sb.from('keuring_items').upsert(rows, { onConflict: 'id' });
  if (error) console.error('sbSyncAllKeuringItems fout:', error);
}

// ── DB-VERVUILING FIX ──────────────────────────────────────
// isItemOnaangeraakt — controleert of een item tijdens deze keuring
// niet is beoordeeld. Een item telt als onaangeraakt als:
//   - status is leeg (niet goedgekeurd, niet afgekeurd) EN
//   - afgevoerd is false (niet op pensioen gezet)
//
// Let op: opmerking en afkeurcode worden NIET gecheckt. Een losse
// opmerking zonder beoordeling telt dus niet als "aangeraakt" — als
// je een opmerking hebt getypt maar niet hebt beoordeeld, gaat die
// opmerking verloren bij afronden. De bevestigings-popup in
// finishKeuring waarschuwt daarvoor.
//
// Pensioen (afgevoerd=true) telt WEL als aangeraakt: als je een item
// op pensioen hebt gezet zonder het te beoordelen, moet dat bewaard
// blijven — anders komt het artikel de volgende keuring gewoon terug.
// ─────────────────────────────────────────────────────────────
function isItemOnaangeraakt(item) {
  if (!item) return false;
  const statusLeeg    = !item.status || item.status === '';
  const nietAfgevoerd = item.afgevoerd !== true;
  return statusLeeg && nietAfgevoerd;
}

// ── DB-VERVUILING FIX ──────────────────────────────────────
// sbDeleteOnaangeraakteItems — verwijdert expliciet opgegeven rijen
// uit één specifieke keuring.
//
// De aanroeper (finishKeuring in keuringen.js) bepaalt in de app zelf
// welke items onaangeraakt zijn, en geeft hun rowIds door. Dit is veel
// betrouwbaarder dan in Supabase te filteren op "lege" tekstvelden,
// wat in PostgREST lastig goed te krijgen is.
//
// VEILIG omdat:
//   1. Filter op keuring_id → zelfs bij een verkeerd doorgegeven rowId
//      kan deze query nooit iets buiten deze ene keuring raken
//   2. Filter op expliciete id-lijst → alleen exact de rijen die de
//      app als onaangeraakt heeft geïdentificeerd worden verwijderd
//   3. Items uit eerdere keuringen blijven onaangeroerd — de historie
//      van elk artikel blijft dus bestaan
//
// Parameters:
//   keuringId → de keuring waartoe de rijen moeten behoren
//   rowIds    → array van database rij-IDs (item.rowId) om te verwijderen
//
// Retourneert het aantal verwijderde rijen, of null bij een fout.
// ─────────────────────────────────────────────────────────────
async function sbDeleteOnaangeraakteItems(keuringId, rowIds) {
  if (!keuringId) return 0;
  if (!Array.isArray(rowIds) || rowIds.length === 0) return 0;
  try {
    const { data, error } = await sb
      .from('keuring_items')
      .delete()
      .eq('keuring_id', keuringId)
      .in('id', rowIds)
      .select('id');
    if (error) {
      console.error('sbDeleteOnaangeraakteItems fout:', error);
      return null;
    }
    return (data || []).length;
  } catch(err) {
    console.error('sbDeleteOnaangeraakteItems onverwachte fout:', err);
    return null;
  }
}

// ── AANGEMELD MATERIAAL CLEANUP ────────────────────────────
// sbCleanupVerwerkteAanmeldingen — verwijdert originele aangemelde
// rijen (keuring_id IS NULL) zodra het bijbehorende artikel in een
// afgeronde keuring is beoordeeld.
//
// Waarom nodig:
// Als een klant een artikel aanmeldt in KlantKeur komt er een rij
// met keuring_id=NULL in keuring_items. Bij het aanmaken van een
// keuring wordt daarvan een kopie in de keuring gezet (met keuring_id
// gevuld). De originele rij bleef tot nu toe staan, waardoor het
// artikel bij de volgende keuring opnieuw als "aangemeld materiaal"
// werd aangeboden — dubbel werk en duplicaten.
//
// Deze functie wordt aangeroepen vanuit finishKeuring. Voor elk
// beoordeeld item (niet onaangeraakt) zoekt hij de matchende
// aangemelde rij en verwijdert die.
//
// VEILIG omdat:
//   1. Filter op keuring_id IS NULL → raakt alleen losse aanmeldingen,
//      nooit items die al in een keuring zitten
//   2. Filter op klant_id → raakt alleen rijen van deze ene klant
//   3. Filter op expliciete itemIds → alleen artikelen die nu echt
//      zijn beoordeeld in de zojuist afgeronde keuring
//
// We doen twee deletes: één op artikel_id (het gewone geval) en één
// op id (voor de fallback waar de itemId gelijk is aan de rowId van
// de oorspronkelijke aangemelde rij omdat artikel_id toen nog niet
// was ingevuld).
// ─────────────────────────────────────────────────────────────
async function sbCleanupVerwerkteAanmeldingen(klantId, itemIds) {
  if (!klantId) return 0;
  if (!Array.isArray(itemIds) || itemIds.length === 0) return 0;
  let totaal = 0;
  try {
    // Ronde 1: match op artikel_id
    const { data: viaArtikelId, error: e1 } = await sb
      .from('keuring_items')
      .delete()
      .is('keuring_id', null)
      .eq('klant_id', klantId)
      .in('artikel_id', itemIds)
      .select('id');
    if (e1) {
      console.error('sbCleanupVerwerkteAanmeldingen (artikel_id) fout:', e1);
    } else {
      totaal += (viaArtikelId || []).length;
    }
    // Ronde 2: match op id (fallback)
    const { data: viaId, error: e2 } = await sb
      .from('keuring_items')
      .delete()
      .is('keuring_id', null)
      .eq('klant_id', klantId)
      .in('id', itemIds)
      .select('id');
    if (e2) {
      console.error('sbCleanupVerwerkteAanmeldingen (id) fout:', e2);
    } else {
      totaal += (viaId || []).length;
    }
    return totaal;
  } catch(err) {
    console.error('sbCleanupVerwerkteAanmeldingen onverwachte fout:', err);
    return null;
  }
}

// ============================================================
// STANDAARD STORE — neutrale lege defaults
// Geen bedrijfsspecifieke data. Alles komt uit de bedrijven
// tabel via pasInstellingenToe() na het inloggen.
// ============================================================
function buildDefaultStore() {
  return {
    version: 2,
    products: DEFAULT_PRODUCTS,
    snData: JSON.parse(JSON.stringify(SN_DATA)),
    afkeurcodes: JSON.parse(JSON.stringify(STANDAARD_AFKEURCODES)),
    klanten: [],
    keuringen: [],
    nextItemId: 1,
    keurmeesters: [],
    settings: {
      bedrijfsnaam:         '',
      adres:                '',
      telefoon:             '',
      email:                '',
      kvk:                  '',
      logo:                 null,
      handtekening:         null,
      keurmeester:          '',
      certificaatTekst:     '',
      certificaatTekstOnder:'',
      visibleColumns: {
        omschrijving: true, merk: true, materiaal: true, bijzonderheden: false,
        maxLeeftijd: true, maxLeeftijdUSE: true, maxLeeftijdMFR: true,
        enNorm: true, breuksterkte: true, handleiding: false, link: false
      },
      certColumns: { materiaal: false, enNorm: false, breuksterkte: false }
    }
  };
}

async function initStore() {
  const supabaseData = await loadStoreFromSupabase();

  let store;
  if (supabaseData) {
    const localStore = getStore() || buildDefaultStore();
    store = {
      ...buildDefaultStore(),
      ...localStore,
      klanten:      supabaseData.klanten,
      keuringen:    supabaseData.keuringen,
      products:     supabaseData.products.length ? supabaseData.products : localStore.products,
      // Afkeurcodes: uit DB als aanwezig, anders STANDAARD_AFKEURCODES via buildDefaultStore
      afkeurcodes:  supabaseData.afkeurcodes.length ? supabaseData.afkeurcodes : (localStore.afkeurcodes && localStore.afkeurcodes.length ? localStore.afkeurcodes : JSON.parse(JSON.stringify(STANDAARD_AFKEURCODES))),
      keurmeesters: supabaseData.keurmeesters.length ? supabaseData.keurmeesters : (localStore.keurmeesters || []),
    };
    store._fromSupabase = true;
    console.log(`✅ Supabase geladen: ${store.klanten.length} klanten, ${store.keuringen.length} keuringen, ${store.products.length} producten, ${store.keurmeesters.length} keurmeesters, ${store.afkeurcodes.length} afkeurcodes`);
  } else {
    console.warn('⚠️ Supabase niet beschikbaar, gebruik localStorage als fallback');
    store = getStore();
    if (!store) store = buildDefaultStore();
  }

  // Veiligheidsnetten voor ontbrekende velden
  if (!store.snData)       store.snData       = JSON.parse(JSON.stringify(SN_DATA));
  if (!store.afkeurcodes || !store.afkeurcodes.length) {
    store.afkeurcodes = JSON.parse(JSON.stringify(STANDAARD_AFKEURCODES));
  }
  if (!store.settings.certificaatTekstOnder) store.settings.certificaatTekstOnder = '';
  if (!store.keurmeesters) store.keurmeesters = [];
  if (!store.settings.visibleColumns) {
    store.settings.visibleColumns = {
      omschrijving: true, merk: true, materiaal: true, bijzonderheden: false,
      maxLeeftijd: true, maxLeeftijdUSE: true, maxLeeftijdMFR: true,
      enNorm: true, breuksterkte: true, handleiding: false, link: false
    };
  }
  if (!store.settings.visibleColumns.maxLeeftijdUSE) {
    store.settings.visibleColumns.maxLeeftijdUSE = true;
    store.settings.visibleColumns.maxLeeftijdMFR = true;
    store.settings.visibleColumns.enNorm = true;
    store.settings.visibleColumns.breuksterkte = true;
  }
  if (!store.settings.certColumns) {
    store.settings.certColumns = { materiaal: false, enNorm: false, breuksterkte: false };
  }
  if (!store.nextItemId) {
    let maxId = 0;
    (store.keuringen || []).forEach(k => {
      (k.items || []).forEach(item => {
        if (item.itemId && item.itemId > maxId) maxId = item.itemId;
      });
    });
    store.nextItemId = maxId + 1;
  }
  if (!store._historieGebouwd) {
    buildInspectieHistorie(store);
    store._historieGebouwd = true;
  }

  try { localStorage.setItem(getStoreKey(), JSON.stringify(store)); } catch(e) {}
  return store;
}

store = null;

// ============================================================
// INSPECTIE HISTORIE
// ============================================================
function buildInspectieHistorie(s) {
  // on-the-fly via keuringen
}

function getHistorieVoorItemId(itemId, fallbackSN) {
  const results = [];
  (store.keuringen || []).forEach(k => {
    (k.items || []).forEach(item => {
      const matchOpId = itemId && item.itemId && item.itemId === itemId;
      const matchOpSN = !itemId && fallbackSN &&
        item.serienummer &&
        item.serienummer.toLowerCase().trim() === fallbackSN.toLowerCase().trim();
      if (matchOpId || matchOpSN) {
        results.push({
          keuringId:     k.id,
          certificaatNr: k.certificaatNr || '',
          datum:         k.datum,
          klantNaam:     k.klantNaam || '',
          status:        item.status || '',
          afkeurcode:    item.afkeurcode || '',
          opmerking:     item.opmerking || '',
          omschrijving:  item.omschrijving || '',
          merk:          item.merk || '',
          materiaal:     item.materiaal || '',
          keurmeester:   k.keurmeester || '',
          gebruiker:     item.gebruiker || '',
          afgerond:      k.afgerond || false,
          afgevoerd:     item.afgevoerd || false,
        });
      }
    });
  });
  results.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
  return results;
}

// ============================================================
