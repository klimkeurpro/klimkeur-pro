// ============================================================
// store.js — lokale datastructuur, constanten, Supabase data laden en mappen
// ============================================================

DEFAULT_PRODUCTS = [];
SN_DATA = [{"merk": "ART", "voorbeeld": "21,1601001", "formaat": "xxYYxx xxx", "link": "Manual-RopeGuide-2010.pdf"}, {"merk": "CT-Climbing", "voorbeeld": "2211-122-22", "formaat": "xxxx-DDD-YY", "link": "CTClimbing.pdf"}, {"merk": "DMM", "voorbeeld": "210321234E", "formaat": "YYDDDxxxx#", "link": "https://dmmwales.com/pages/dmm-product-markings-and-packaging"}, {"merk": "Edelrid", "voorbeeld": "verschild", "formaat": "MMYY-xx-xxx-xxxx", "link": "Edelrid.pdf"}, {"merk": "FallSave", "voorbeeld": "121844", "formaat": "MM/YYYY", "link": "FallSave.pdf"}, {"merk": "ISC", "voorbeeld": "22/45654/1234", "formaat": "YY/xxxxx/xxx", "link": "https://www.iscwales.com/News/Blog/New-Serial-Numbering-Implementation/"}, {"merk": "Kask", "voorbeeld": "21,1234567.1234", "formaat": "YY.xxxxxxx.xxxx", "link": "superplasma-pl-ce-user-manual.pdf"}, {"merk": "Kask", "voorbeeld": "21,1234,5678", "formaat": "YY.xxxx.xxxx", "link": "kask zenith.pdf"}, {"merk": "Kong", "voorbeeld": "456218 22 6543", "formaat": "xxxxxxYYxxxx", "link": "Kong.pdf"}, {"merk": "Kong conectors", "voorbeeld": "123456 2206 1234", "formaat": "xxxxxxMMYYxxxx", "link": "KONG_CONNECTORS.pdf"}, {"merk": "Miller by Honneywell", "voorbeeld": "23/20 123415678/005", "formaat": "WWYYxxxxxx", "link": "handleidingDownL\\Tractel.pdf"}, {"merk": "Petzl", "voorbeeld": "18E45654123", "formaat": "YYMxxxxxx", "link": "PetzlVertex.pdf"}, {"merk": "Petzl pre2016", "voorbeeld": "12122AV6543", "formaat": "YYDDDxxxxxx", "link": "PetzlVertex.pdf"}, {"merk": "RockExotica", "voorbeeld": "22123A001", "formaat": "YYDDDaxxx", "link": "RockExotica.pdf"}, {"merk": "Simond", "voorbeeld": "010622", "formaat": "xxMMYY", "link": "https://www.simond.com/user-guide-connectors-quickdraw-straps#80f2999d-56a1-4258-a3d1-289397b08731"}, {"merk": "Taz", "voorbeeld": "S01 220629 0001", "formaat": "xxxYYMMDDxxxx", "link": "Taz.pdf"}, {"merk": "Tractel", "voorbeeld": "DEM202000001", "formaat": "Bij f: YY/MM", "link": "Tractel.pdf"}, {"merk": "TreeRunner_Lacd", "voorbeeld": "productie jaar zijn laatste 2 van lot nummer", "formaat": "xxxxYY", "link": "Tree-Runner_Lacd.pdf"}, {"merk": "XSPlatforms", "voorbeeld": "verschild", "formaat": "", "link": "XSPlatforms.pdf"}, {"merk": "Courant klimlijn", "voorbeeld": "test", "formaat": "", "link": ""}];
CERT_INFO = {"afkeurcodes": [{"code": 1, "tekst": "Slijtage, opgebruikt"}, {"code": 2, "tekst": "Mechanisch beschadigd"}, {"code": 3, "tekst": "Brand-, verharde- en/of smeltplekken"}, {"code": 4, "tekst": "Deformatie, knelplekken"}, {"code": 5, "tekst": "Leeftijd en herkomst onbekend"}, {"code": 6, "tekst": "Defecte sluiting, sluiting ontbreekt"}, {"code": 7, "tekst": "CE kenmerk, -label ontbreekt / is incorrect"}, {"code": 8, "tekst": "Roest, oxidatie, vervuild"}, {"code": 9, "tekst": "Verkeerde knoop"}, {"code": 10, "tekst": "Leeftijd, veroudering"}, {"code": 11, "tekst": "Foute, defecte, losgelaten splits"}, {"code": 12, "tekst": "Defecte lijnklem"}, {"code": 13, "tekst": "Defecte oprolautomaat"}, {"code": 14, "tekst": "Gemodificeerd of veranderd"}], "keurmeesters": ["C. M. van den Hoogen", "E. Bottenheft"], "bedrijfsnaam": "Safety Green B.V.", "kvk": "10042517"};
LOGO_B64 = "data:image/jpeg;base64,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";
HANDTEKENING_B64 = "data:image/png;base64,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";

// ============================================================
// SUPABASE LEES-FUNCTIES (Stap 2)
// ============================================================

async function loadStoreFromSupabase() {
  try {
    const [
      { data: klanten,     error: e1 },
      { data: keuringen,   error: e2 },
      { data: producten,   error: e3 },
      { data: afkeurcodes, error: e4 },
      { data: instellingen,error: e5 },
    ] = await Promise.all([
      sb.from('klanten').select('*').order('aangemaakt_op', { ascending: true }),
      sb.from('keuringen').select('*, keuring_items(*)').order('datum', { ascending: false }),
      sb.from('producten').select('*').order('omschrijving'),
      sb.from('afkeurcodes').select('*').order('code'),
      sb.from('instellingen').select('*'),
    ]);

    if (e1 || e2 || e3 || e4 || e5) {
      const err = e1 || e2 || e3 || e4 || e5;
      console.error('Supabase laad-fout:', err);
      throw err;
    }

    // Zet Supabase keuringen om naar store-formaat (items genest)
    const keuringenMapped = (keuringen || []).map(k => {
      const items = (k.keuring_items || []).map(item => ({
        itemId:        item.id,
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

    // Zet Supabase klanten om naar store-formaat
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
    }));

    // Producten: map naar store-formaat
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

    // Afkeurcodes: bewaar ook het Supabase id voor updates/deletes
    const afkeurcodesMapped = (afkeurcodes || []).map(a => ({
      _id:  a.id,
      code: parseInt(a.code) || a.code,
      tekst: a.tekst || '',
    }));

    // Instellingen: één rij per sleutel
    const settingsRaw = {};
    (instellingen || []).forEach(row => { settingsRaw[row.sleutel] = row.waarde; });
    const settingsParsed = settingsRaw.settings ? JSON.parse(settingsRaw.settings) : null;
    const snDataParsed   = settingsRaw.snData    ? JSON.parse(settingsRaw.snData)   : null;
    const keurmeesters   = settingsRaw.keurmeesters ? JSON.parse(settingsRaw.keurmeesters) : null;

    return {
      klanten:      klantenMapped,
      keuringen:    keuringenMapped,
      products:     productenMapped,
      afkeurcodes:  afkeurcodesMapped,
      _fromSupabase: true,
      _settings:    settingsParsed,
      _snData:      snDataParsed,
      _keurmeesters: keurmeesters,
    };
  } catch(err) {
    console.error('loadStoreFromSupabase mislukt:', err);
    return null;
  }
}

function getStore() {
  // Lees uit localStorage als snelle fallback (wordt overschreven door Supabase)
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function saveStore(store) {
  // Cache in localStorage als offline fallback
  try { localStorage.setItem(DB_KEY, JSON.stringify(store)); } catch(e) {}
}

// ============================================================
// SUPABASE SCHRIJF-FUNCTIES (Stap 3)
// ============================================================

// --- INSTELLINGEN ---
async function sbSaveSettings(settings) {
  const { error } = await sb.from('instellingen').upsert(
    { sleutel: 'settings', waarde: JSON.stringify(settings), bijgewerkt_op: new Date().toISOString() },
    { onConflict: 'sleutel' }
  );
  if (error) console.error('sbSaveSettings fout:', error);
}

async function sbSaveSnData(snData) {
  const { error } = await sb.from('instellingen').upsert(
    { sleutel: 'snData', waarde: JSON.stringify(snData), bijgewerkt_op: new Date().toISOString() },
    { onConflict: 'sleutel' }
  );
  if (error) console.error('sbSaveSnData fout:', error);
}

async function sbSaveKeurmeesters(keurmeesters) {
  const { error } = await sb.from('instellingen').upsert(
    { sleutel: 'keurmeesters', waarde: JSON.stringify(keurmeesters), bijgewerkt_op: new Date().toISOString() },
    { onConflict: 'sleutel' }
  );
  if (error) console.error('sbSaveKeurmeesters fout:', error);
}

async function sbSaveAfkeurcodes(afkeurcodes) {
  const { error } = await sb.from('instellingen').upsert(
    { sleutel: 'afkeurcodes', waarde: JSON.stringify(afkeurcodes), bijgewerkt_op: new Date().toISOString() },
    { onConflict: 'sleutel' }
  );
  if (error) console.error('sbSaveAfkeurcodes fout:', error);
}

// --- KLANTEN ---
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

// --- PRODUCTEN ---
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

// --- KEURINGEN ---
async function sbUpsertKeuring(keuring) {
  const row = {
    id:                keuring.id,
    klant_id:          keuring.klantId,
    certificaat_nr:    keuring.certificaatNr || '',
    datum:             keuring.datum || null,
    keurmeester:       keuring.keurmeester || '',
    bedrijf_keurmeester: keuring.klantNaam || '',
    status:            keuring.status || 'concept',
    afgerond:          keuring.afgerond || false,
    opmerkingen:       keuring.opmerkingen || '',
    bijgewerkt_op:     new Date().toISOString(),
    bedrijf_id:        _huidigBedrijfId,
  };
  const { error } = await sb.from('keuringen').upsert(row, { onConflict: 'id' });
  if (error) { console.error('sbUpsertKeuring fout:', error); toast('Fout bij opslaan keuring in Supabase', 'error'); }
}

async function sbDeleteKeuring(id) {
  // keuring_items worden via ON DELETE CASCADE automatisch verwijderd
  const { error } = await sb.from('keuringen').delete().eq('id', id);
  if (error) { console.error('sbDeleteKeuring fout:', error); toast('Fout bij verwijderen keuring in Supabase', 'error'); }
}

// --- KEURING ITEMS ---
function _itemToRow(item, keuringId, klantId) {
  return {
    id:              item.itemId || generateId(),
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
    bedrijf_id:      _huidigBedrijfId,
  };
}

async function sbUpsertKeuringItem(item, keuringId, klantId) {
  // Zorg dat item een id heeft
  if (!item.itemId) item.itemId = generateId();
  const row = _itemToRow(item, keuringId, klantId);
  const { error } = await sb.from('keuring_items').upsert(row, { onConflict: 'id' });
  if (error) { console.error('sbUpsertKeuringItem fout:', error); toast('Fout bij opslaan item in Supabase', 'error'); }
}

async function sbDeleteKeuringItem(itemId) {
  const { error } = await sb.from('keuring_items').delete().eq('id', itemId);
  if (error) console.error('sbDeleteKeuringItem fout:', error);
}

async function sbSyncAllKeuringItems(keuring) {
  // Verwijder alle bestaande items en schrijf opnieuw (voor bulk-operaties)
  await sb.from('keuring_items').delete().eq('keuring_id', keuring.id);
  if (!keuring.items || keuring.items.length === 0) return;
  const rows = keuring.items.map(item => {
    if (!item.itemId) item.itemId = generateId();
    return _itemToRow(item, keuring.id, keuring.klantId);
  });
  const { error } = await sb.from('keuring_items').upsert(rows, { onConflict: 'id' });
  if (error) console.error('sbSyncAllKeuringItems fout:', error);
}

async function _syncSettingsToSupabase(settings) {
  await sbSaveSettings(settings);
}

async function initStore() {
  // Bouw default store structuur
  function buildDefaultStore() {
    return {
      version: 2,
      products: DEFAULT_PRODUCTS,
      snData: JSON.parse(JSON.stringify(SN_DATA)),
      afkeurcodes: JSON.parse(JSON.stringify(CERT_INFO.afkeurcodes)),
      klanten: [],
      keuringen: [],
      nextItemId: 1,
      keurmeesters: CERT_INFO.keurmeesters.map(naam => ({ naam, handtekening: '' })),
      settings: {
        bedrijfsnaam: 'Safety Green B.V.',
        adres: '',
        telefoon: '',
        email: '',
        kvk: '10042517',
        logo: LOGO_B64,
        handtekening: HANDTEKENING_B64,
        keurmeester: 'C. M. van den Hoogen',
        certificaatTekst: 'Keuringen worden uitgevoerd door daarvoor opgeleide medewerkers. De uitgevoerde keuring betreft een visuele controle onderstaande punten van de aangeboden materialen. Safety Green B.V. kan nimmer aansprakelijk worden gesteld voor ongevallen, directe of indirecte schade ten gevolge van verkeerd gebruik van de materialen. Een keuring is een momentopname en mag nooit worden gezien als vervanging van de dagelijkse keuring voor en na gebruik van de materialen.',
        visibleColumns: {
          omschrijving: true, merk: true, materiaal: true, bijzonderheden: false,
          maxLeeftijd: true, maxLeeftijdUSE: true, maxLeeftijdMFR: true,
          enNorm: true, breuksterkte: true, handleiding: false, link: false
        },
        certColumns: { materiaal: false, enNorm: false, breuksterkte: false }
      }
    };
  }

  // Laad vanuit Supabase
  const supabaseData = await loadStoreFromSupabase();

  let store;
  if (supabaseData) {
    // Haal bestaande localStorage-store op voor instellingen/snData/keurmeesters
    // die nog niet in Supabase staan
    const localStore = getStore() || buildDefaultStore();

    store = {
      ...buildDefaultStore(),
      ...localStore,
      // Overschrijf met live Supabase data:
      klanten:    supabaseData.klanten,
      keuringen:  supabaseData.keuringen,
      products:   supabaseData.products.length ? supabaseData.products : localStore.products,
      afkeurcodes: supabaseData.afkeurcodes.length ? supabaseData.afkeurcodes : localStore.afkeurcodes,
    };

    // Instellingen uit Supabase hebben prioriteit als ze bestaan
    if (supabaseData._settings) {
      store.settings = { ...store.settings, ...supabaseData._settings };
    }
    if (supabaseData._snData) {
      store.snData = supabaseData._snData;
    }
    if (supabaseData._keurmeesters) {
      store.keurmeesters = supabaseData._keurmeesters;
    }

    store._fromSupabase = true;
    console.log(`✅ Supabase geladen: ${store.klanten.length} klanten, ${store.keuringen.length} keuringen, ${store.products.length} producten`);
  } else {
    // Fallback: gebruik localStorage
    console.warn('⚠️ Supabase niet beschikbaar, gebruik localStorage als fallback');
    store = getStore();
    if (!store) {
      store = buildDefaultStore();
    }
  }

  // Migration: voeg ontbrekende velden toe
  if (!store.snData) store.snData = JSON.parse(JSON.stringify(SN_DATA));
  if (!store.afkeurcodes) store.afkeurcodes = JSON.parse(JSON.stringify(CERT_INFO.afkeurcodes));
  if (!store.settings.certificaatTekstOnder) store.settings.certificaatTekstOnder = '';
  if (!store.keurmeesters) store.keurmeesters = CERT_INFO.keurmeesters.map(naam => ({ naam, handtekening: '' }));
  if (!store.settings.visibleColumns.maxLeeftijdUSE) {
    store.settings.visibleColumns.maxLeeftijdUSE = true;
    store.settings.visibleColumns.maxLeeftijdMFR = true;
    store.settings.visibleColumns.enNorm = true;
    store.settings.visibleColumns.breuksterkte = true;
  }
  if (!store.settings.certColumns) store.settings.certColumns = { materiaal: false, enNorm: false, breuksterkte: false };
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
    // saveStore wordt later aangeroepen
  }

  // Sla gecombineerde store ook op in localStorage als snelle cache
  try { localStorage.setItem(DB_KEY, JSON.stringify(store)); } catch(e) {}

  return store;
}

// Store is initieel leeg; wordt gevuld door initApp()
store = null;

// ============================================================
// INSPECTIE HISTORIE
// Bouwt een opzoektabel: serienummer → [{keuring, datum, status, ...}]
// ============================================================
function buildInspectieHistorie(s) {
  // Geen aparte store, we bouwen on-the-fly vanuit keuringen
  // Dit is een hulpfunctie voor queries
}

function getHistorieVoorItemId(itemId, fallbackSN) {
  // Primaire lookup op item ID — betrouwbaar ook bij niet-unieke serienummers
  // Fallback op serienummer voor oude data zonder ID
  const results = [];
  (store.keuringen || []).forEach(k => {
    (k.items || []).forEach(item => {
      const matchOpId = itemId && item.itemId && item.itemId === itemId;
      const matchOpSN = !itemId && fallbackSN &&
        item.serienummer &&
        item.serienummer.toLowerCase().trim() === fallbackSN.toLowerCase().trim();
      if (matchOpId || matchOpSN) {
        results.push({
          keuringId: k.id,
          certificaatNr: k.certificaatNr || '',
          datum: k.datum,
          klantNaam: k.klantNaam || '',
          status: item.status || '',
          afkeurcode: item.afkeurcode || '',
          opmerking: item.opmerking || '',
          omschrijving: item.omschrijving || '',
          merk: item.merk || '',
          materiaal: item.materiaal || '',
          keurmeester: k.keurmeester || '',
          gebruiker: item.gebruiker || '',
          afgerond: k.afgerond || false,
        });
      }
    });
  });
  results.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
  return results;
}

// ============================================================
