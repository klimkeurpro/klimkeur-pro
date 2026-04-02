// ============================================================
// store.js — lokale datastructuur, constanten, Supabase data laden en mappen
// ============================================================

DEFAULT_PRODUCTS = [];
SN_DATA = [{"merk": "ART", "voorbeeld": "21,1601001", "formaat": "xxYYxx xxx", "link": "Manual-RopeGuide-2010.pdf"}, {"merk": "CT-Climbing", "voorbeeld": "2211-122-22", "formaat": "xxxx-DDD-YY", "link": "CTClimbing.pdf"}, {"merk": "DMM", "voorbeeld": "210321234E", "formaat": "YYDDDxxxx#", "link": "https://dmmwales.com/pages/dmm-product-markings-and-packaging"}, {"merk": "Edelrid", "voorbeeld": "verschild", "formaat": "MMYY-xx-xxx-xxxx", "link": "Edelrid.pdf"}, {"merk": "FallSave", "voorbeeld": "121844", "formaat": "MM/YYYY", "link": "FallSave.pdf"}, {"merk": "ISC", "voorbeeld": "22/45654/1234", "formaat": "YY/xxxxx/xxx", "link": "https://www.iscwales.com/News/Blog/New-Serial-Numbering-Implementation/"}, {"merk": "Kask", "voorbeeld": "21,1234567.1234", "formaat": "YY.xxxxxxx.xxxx", "link": "superplasma-pl-het-user-manual.pdf"}, {"merk": "Kask", "voorbeeld": "21,1234,5678", "formaat": "YY.xxxx.xxxx", "link": "kask zenith.pdf"}, {"merk": "Kong", "voorbeeld": "456218 22 6543", "formaat": "xxxxxxYYxxxx", "link": "Kong.pdf"}, {"merk": "Kong conectors", "voorbeeld": "123456 2206 1234", "formaat": "xxxxxxMMYYxxxx", "link": "KONG_CONNECTORS.pdf"}, {"merk": "Miller by Honneywell", "voorbeeld": "23/20 123415678/005", "formaat": "WWYYxxxxxx", "link": "handleidingDownL\\Tractel.pdf"}, {"merk": "Petzl", "voorbeeld": "18E45654123", "formaat": "YYMxxxxxx", "link": "PetzlVertex.pdf"}, {"merk": "Petzl pre2016", "voorbeeld": "12122AV6543", "formaat": "YYDDDxxxxxx", "link": "PetzlVertex.pdf"}, {"merk": "RockExotica", "voorbeeld": "22123A001", "formaat": "YYDDDaxxx", "link": "RockExotica.pdf"}, {"merk": "Simond", "voorbeeld": "010622", "formaat": "xxMMYY", "link": "https://www.simond.com/user-guide-connectors-quickdraw-straps#80f2999d-56a1-4258-a3d1-289397b08731"}, {"merk": "Taz", "voorbeeld": "S01 220629 0001", "formaat": "xxxYYMMDDxxxx", "link": "Taz.pdf"}, {"merk": "Tractel", "voorbeeld": "DEM202000001", "formaat": "Bij f: YY/MM", "link": "Tractel.pdf"}, {"merk": "TreeRunner_Lacd", "voorbeeld": "productie jaar zijn laatste 2 van lot nummer", "formaat": "xxxxYY", "link": "Tree-Runner_Lacd.pdf"}, {"merk": "XSPlatforms", "voorbeeld": "verschild", "formaat": "", "link": "XSPlatforms.pdf"}, {"merk": "Courant klimlijn", "voorbeeld": "test", "formaat": "", "link": ""}];
CERT_INFO = {"afkeurcodes": [{"code": 1, "tekst": "Slijtage, opgebruikt"}, {"code": 2, "tekst": "Mechanisch beschadigd"}, {"code": 3, "tekst": "Brand-, verharde- en/of smeltplekken"}, {"code": 4, "tekst": "Deformatie, knelplekken"}, {"code": 5, "tekst": "Leeftijd en herkomst onbekend"}, {"code": 6, "tekst": "Defecte sluiting, sluiting ontbreekt"}, {"code": 7, "tekst": "CE kenmerk, -label ontbreekt / is incorrect"}, {"code": 8, "tekst": "Roest, oxidatie, vervuild"}, {"code": 9, "tekst": "Verkeerde knoop"}, {"code": 10, "tekst": "Leeftijd, veroudering"}, {"code": 11, "tekst": "Foute, defecte, losgelaten splits"}, {"code": 12, "tekst": "Defecte lijnklem"}, {"code": 13, "tekst": "Defecte oprolautomaat"}, {"code": 14, "tekst": "Gemodificeerd of veranderd"}], "keurmeesters": ["C. M. van den Hoogen", "E. Bottenheft"], "bedrijfsnaam": "Safety Green B.V.", "kvk": "10042517"};
LOGO_B64 = "data:image/jpeg;base64,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";
HANDTEKENING_B64 = "data:image/png;base64,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";

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
      sb.from('klanten').select('*').order('aangemaakt_op', { ascending: true }),
      sb.from('keuringen').select('*, keuring_items(*)').order('datum', { ascending: false }),
      sb.from('producten').select('*').order('omschrijving'),
      sb.from('afkeurcodes').select('*').order('code'),
      sb.from('keurmeesters').select('naam, handtekening, email').eq('bedrijf_id', _huidigBedrijfId),
    ]);

    if (e1 || e2 || e3 || e4) {
      const err = e1 || e2 || e3 || e4;
      console.error('Supabase laad-fout:', err);
      throw err;
    }

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
      naam:         k.naam || '',
      handtekening: k.handtekening || '',
      email:        k.email || '',
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
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function saveStore(store) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(store)); } catch(e) {}
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
  const { error } = await sb.from('instellingen').upsert(
    { sleutel: 'keurmeesters', waarde: JSON.stringify(keurmeesters), bijgewerkt_op: new Date().toISOString(), bedrijf_id: _huidigBedrijfId },
    { onConflict: 'sleutel,bedrijf_id' }
  );
  if (error) console.error('sbSaveKeurmeesters fout:', error);
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

async function sbDeleteKeuring(id) {
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
    afgevoerd:       item.afgevoerd || false,
    bedrijf_id:      _huidigBedrijfId,
  };
}

async function sbUpsertKeuringItem(item, keuringId, klantId) {
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
  if (!keuring.items || keuring.items.length === 0) return;
  const rows = keuring.items.map(item => {
    if (!item.itemId) item.itemId = generateId();
    return _itemToRow(item, keuring.id, keuring.klantId);
  });
  const { error } = await sb.from('keuring_items').upsert(rows, { onConflict: 'id' });
  if (error) console.error('sbSyncAllKeuringItems fout:', error);
}

async function initStore() {
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
      afkeurcodes:  supabaseData.afkeurcodes.length ? supabaseData.afkeurcodes : localStore.afkeurcodes,
      keurmeesters: supabaseData.keurmeesters.length ? supabaseData.keurmeesters : localStore.keurmeesters,
    };
    store._fromSupabase = true;
    console.log(`✅ Supabase geladen: ${store.klanten.length} klanten, ${store.keuringen.length} keuringen, ${store.products.length} producten, ${store.keurmeesters.length} keurmeesters`);
  } else {
    console.warn('⚠️ Supabase niet beschikbaar, gebruik localStorage als fallback');
    store = getStore();
    if (!store) store = buildDefaultStore();
  }

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
  }

  try { localStorage.setItem(DB_KEY, JSON.stringify(store)); } catch(e) {}
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
