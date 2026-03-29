// ============================================================
// store.js — lokale datastructuur, constanten, Supabase data laden en mappen
// ============================================================

DEFAULT_PRODUCTS = [];
SN_DATA = [{"merk": "ART", "voorbeeld": "21,1601001", "formaat": "xxYYxx xxx", "link": "Manual-RopeGuide-2010.pdf"}, {"merk": "CT-Climbing", "voorbeeld": "2211-122-22", "formaat": "xxxx-DDD-YY", "link": "CTClimbing.pdf"}, {"merk": "DMM", "voorbeeld": "210321234E", "formaat": "YYDDDxxxx#", "link": "https://dmmwales.com/pages/dmm-product-markings-and-packaging"}, {"merk": "Edelrid", "voorbeeld": "verschild", "formaat": "MMYY-xx-xxx-xxxx", "link": "Edelrid.pdf"}, {"merk": "FallSave", "voorbeeld": "121844", "formaat": "MM/YYYY", "link": "FallSave.pdf"}, {"merk": "ISC", "voorbeeld": "22/45654/1234", "formaat": "YY/xxxxx/xxx", "link": "https://www.iscwales.com/News/Blog/New-Serial-Numbering-Implementation/"}, {"merk": "Kask", "voorbeeld": "21,1234567.1234", "formaat": "YY.xxxxxxx.xxxx", "link": "superplasma-pl-ce-user-manual.pdf"}, {"merk": "Kask", "voorbeeld": "21,1234,5678", "formaat": "YY.xxxx.xxxx", "link": "kask zenith.pdf"}, {"merk": "Kong", "voorbeeld": "456218 22 6543", "formaat": "xxxxxxYYxxxx", "link": "Kong.pdf"}, {"merk": "Kong conectors", "voorbeeld": "123456 2206 1234", "formaat": "xxxxxxMMYYxxxx", "link": "KONG_CONNECTORS.pdf"}, {"merk": "Miller by Honneywell", "voorbeeld": "23/20 123415678/005", "formaat": "WWYYxxxxxx", "link": "handleidingDownL\\Tractel.pdf"}, {"merk": "Petzl", "voorbeeld": "18E45654123", "formaat": "YYMxxxxxx", "link": "PetzlVertex.pdf"}, {"merk": "Petzl pre2016", "voorbeeld": "12122AV6543", "formaat": "YYDDDxxxxxx", "link": "PetzlVertex.pdf"}, {"merk": "RockExotica", "voorbeeld": "22123A001", "formaat": "YYDDDaxxx", "link": "RockExotica.pdf"}, {"merk": "Simond", "voorbeeld": "010622", "formaat": "xxMMYY", "link": "https://www.simond.com/user-guide-connectors-quickdraw-straps#80f2999d-56a1-4258-a3d1-289397b08731"}, {"merk": "Taz", "voorbeeld": "S01 220629 0001", "formaat": "xxxYYMMDDxxxx", "link": "Taz.pdf"}, {"merk": "Tractel", "voorbeeld": "DEM202000001", "formaat": "Bij f: YY/MM", "link": "Tractel.pdf"}, {"merk": "TreeRunner_Lacd", "voorbeeld": "productie jaar zijn laatste 2 van lot nummer", "formaat": "xxxxYY", "link": "Tree-Runner_Lacd.pdf"}, {"merk": "XSPlatforms", "voorbeeld": "verschild", "formaat": "", "link": "XSPlatforms.pdf"}, {"merk": "Courant klimlijn", "voorbeeld": "test", "formaat": "", "link": ""}];
CERT_INFO = {"afkeurcodes": [{"code": 1, "tekst": "Slijtage, opgebruikt"}, {"code": 2, "tekst": "Mechanisch beschadigd"}, {"code": 3, "tekst": "Brand-, verharde- en/of smeltplekken"}, {"code": 4, "tekst": "Deformatie, knelplekken"}, {"code": 5, "tekst": "Leeftijd en herkomst onbekend"}, {"code": 6, "tekst": "Defecte sluiting, sluiting ontbreekt"}, {"code": 7, "tekst": "CE kenmerk, -label ontbreekt / is incorrect"}, {"code": 8, "tekst": "Roest, oxidatie, vervuild"}, {"code": 9, "tekst": "Verkeerde knoop"}, {"code": 10, "tekst": "Leeftijd, veroudering"}, {"code": 11, "tekst": "Foute, defecte, losgelaten splits"}, {"code": 12, "tekst": "Defecte lijnklem"}, {"code": 13, "tekst": "Defecte oprolautomaat"}, {"code": 14, "tekst": "Gemodificeerd of veranderd"}], "keurmeesters": ["C. M. van den Hoogen", "E. Bottenheft"], "bedrijfsnaam": "Safety Green B.V.", "kvk": "10042517"};
LOGO_B64 = "data:image/jpeg;base64,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";
HANDTEKENING_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXEAAACbCAMAAACj8VvGAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJzUExURQAAAAAAAAAAAAAAgAAAAAAAVQAAQAAAMwAAZgAAVQAASQAAQAAAYAAATQAAZgAAXQAAVQAAagAAWwAAVQAAZgAAaQAAYwAAXgAAYQAAXQAAZAAAYAAAXAAAYgAAaAAAZAAAYQAAYwAAYAAAYgAAXAAAYwAAYAAAZwAAZQAAXAAAYgAAYAAAZwAAYwAAZgAAYgAAZwAAaAAAZAAAYgAAYwAAaAAAZgAAZAAAYgAAZwAAZQAAYwAAZAAAYwAAYgAAYwAAZwAAZQAAZAAAZgAAYQAAZwAAZQAAYgAAZQAAZAAAYgAAZQAAZAAAZgAAZQAAZAAAYwAAZgAAZQAAZAAAZQAAZgAAZQAAZQAAZAAAYwAAZQAAZQAAZQAAZAAAZAAAYwAAZQAAZAAAZQAAZgAAZQAAZgAAYwAAZAAAZAAAZAAAZgAAZgAAZQAAZQAAZQAAZAAAZgAAYwAAZQAAZQAAZQAAYgAAZgAAZQAAZQAAYwAAZQAAZgAAZAAAZgAAZQAAZAAAYwAAZgAAZQAAZQAAZQAAZQAAZQAAZgAAZQAAZQAAZQAAZAAAZQAAZQAAZAAAZAAAZQAAZAAAZgAAZAAAZQAAYwAAZgAAYwAAZQAAZQAAZAAAZgAAZQAAZQAAZQAAZgAAZAAAZgAAZQAAZQAAZAAAZQAAYwAAZAAAZQAAZgAAZQAAZgAAZAAAZAAAZgAAZgAAZQAAZAAAZQAAZAAAZQAAZQAAZAAAZAAAZgAAZAAAZQAAZQAAZgAAZQAAZQAAZgAAZAAAZQAAZQAAZAAAZQAAZAAAZQAAZQAAZQAAZQAAZAAAZQAAZQAAZgAAZQAAZQAAZoFP/dUAAADQdFJOUwABAgIDAwQFBQYHCAgKCgsMDA4PDxESExUWFxgZGhscHR8gIiQkJSUmJycoKiwtLy8xMzQ2Njc4OTk6Oz0+QENDREVGR0hJTk5PUVFUVVZXWlpbXF1fYGJjZGVoamtub29wcnN0dnl/goSEhYaJi4yPkJKXmJmZmpydnZ6go6Slp6ipqquur7KztLW3uLm7vL/AwMHCw8XIyMnKzs/Q0dHS09TW19fa3Nzd3+Dh4uLj5ebm5+nq6+zt7u7v8PHy8vPz9PX19vb3+Pn6+vv8/f5rhRDxAAAACXBIWXMAACHVAAAh1QEEnLSdAAAJU0lEQVR4Xu2dh7skRRXFZw2si+IqIiAmDBhZVMQcABFdFcWcUMSMCTNgFhSRYFYQTBgwoiCIiCjoisgadu+fZN1bp7qru6vjdNXUvLm/b7/pG6qqT53X783szLx5i03jAkKgJILU8cSo45G4o81YdTwSRDsQ1VDHI/Ec2o6ohjoeC/2pkpo2Z9XxWKjjqVHHU6OOR+ClOAahFmvpNATKaA7vvFxbHD9WL/HptF3FllPD3c45Sjfdjrd4q44vgTqeml7HX47IRx1fgl7HQ211fAmmOP5VujsiZQA1C3sc/1+o3T1lPdj9ZbNzB2pxqK3fe751dPwS3tUoMDEKteV7T7dOjr+AdzOAW87DBIErCGNQX773dIH2zgwdP4c3UueS56HbgxmKKAL1xXtPFujnZvgZrz4M0VQSOm7S9Xd8eXpdmE7dYXXcQvRmRHNTN9jkH0XYAtFORI59W9DxbbH2ZAzehlDov8TNkN8gcmxBw8UJRPNSX3eA459pjNiSjkfaVcNfU3gqwjbuX5/zja3qeIxthRxH1E5zzocRbS1iOB4yfIrjCLYYv59/Y+9qLDnE8LrDg+asJUR7EM1F06vRjl9kZtANSLYcc19L5mF0/VntIY5fTvTW/7LRBWjMR5RFJzC3jOZ6A87AZtRBS6h9I55d7w9BFp15s9OYWQTRgxE5Wrd5xD+tCRVsqwgYry48RgojZcuM8dNiMFYEfQBBibdCYLXmf+AX1Z8fDjQZPyma5vYtKOCmCg9jTkfuw3U+3tmclh6iuyEaApRX8EpEf0XkCE9woLC4ke6KSKisSBf8WHJMuMk2XyNpOc5blPajVGKKLrDHVXLkGBGFch+v1myHZrAr1yAG1UHlHDvd5ZwRHeRiQRI38JhKraAsBZrpIdqHqI+rgnq9YnCzz0LkYcZVBz6umhZdjPPyL5UzeRX3MwsDn8DHcoSD6BFFdCiiVdJUGOYfRJ9C6ONNJ/oZIgecqMNW/RkxUxvlUjcbh7eZo78gr2JTPtisOgIUlUBvFXTKkE248EREFbzZzYVa177VdJ6GmIdV7u/cJDfbHkRKbUGbnlGMs0jiYSsvqrTOj/XqwBCaEgURD8ydkblFo4JX3lOGe+l2PvBUyQP4vdowl9ky3x7Io11SUivu5ZyeLrGPab9TWsXcz3nxCgieXQSWLBYPoI+hVcGbK8MQ2NjcXmpLAby7hTISXGqOHt/j0quI7pCeQaplBKRQ4SB0ilY1WwXlPYvDanKibOQVSnZ5NXd5YfgrwzM8inb9QTsaPN/xbmmgtli8TI7F8sgMKBSgbGgULCgnpnbev7CShyGxGl0gRw+v9IXKKHNj/3VRLiyHgnuYhluG+aQtC7Zi8Z7DITqWK8gKZFidY/wyBiameuKqkJeUmV8GXsV15WCSvXSO3w6ynRdnkA8BMwJzAjWiU3B0SOrl9A5bSYwvlVUgNIioIvyFjUqKoeU4c5CE06Ldihs5B6GF6JcInh08jZx9ptOPwjurL+AG0ePygLLnosajzrSxzBAk45tudpjv8nn4UUBhL05paoqzbisFsBZfTUgZ0SMxkA/8rglJGDsgKSs56URe78Qaq87EUZCipZYKMsZwIJIrbUr0QGknxpwX0RpA9C05PtQaZrmXlDqxAysJg0Jq1snxQiwsW0L7Kre9TpYXHovdx9k4Dbs+dLWcdCRXv+doLFBy1HpZjiAa94VVMcApFtfPto34v/jlyZ6JE60ZyZCTvp/oYgmmg+WiX4GzXORPkmcIRnLucQdj+jSOfMa5WEl2gMNk7Ep978CehalKj4bGPn6F8bExp7o3wglYrUgiQ/RvREM4yUrr4LUYmRw+OcIJmMkfRBidITqfwttpJYeXERnWgjBrumT+gDcR5A0YkRWirHzGOVsCjp8l2pus5L/xQ4HGNbjOv+hpvBOiK3wbzVz5D3QWoJ4v0FnnJrSz5fEQWufX6GcMlILrUM2XP0CpBzrZ83XotaCYL5dDqEfW9ywVLoTiEjRyZDckenwfrbUAmi2vKGo2yIvAe6Dr71UvoPshyInDoVr4OYqCyRFlwcFWos930ArxENPfizgfrG4LSj54DW3lQKEHGm18VgY9GVkm7BFRFpQadLTScLzVV/J3NDpwG0OaB9DEoNLC6nQ/Gvocf0K9GwzOy25IMgx7tRhRQqy6gjeh3AeGG1DIASgyoNBLYvlQB36Kaj+YYDgElQyAIqILURiEGY8oNlac4wBU+8EEBpUcwHvYiE5FYThJ9nEx5AnPR7GX72KCgFoWQBJ9BPk4zEREsTjdyhNQ6mU/xguo5cF1EPU35BOIvCMINKDQB0ZbMnt+DaqWdGzpBbpwvyaCtId/YbQFxWyArMDvUI7khRH39jqWuBtJFwfIZgpQzYhZhY154DCSARqPsFspQDkrrLLfIlueiNtkoQgbPIqbFdDIix0xtMV1vPaZiO4zPCqglR+R5EXcslXcwcMxMEesQiSzcs+IF5lVHeCbGJArViWS2YnoOMOfE1HwExSzZpdIRRKDuKuvHbHtZtTxErY7+NEbs6KOO26Lf3kLiU6TP+mMUMeZwxJeeeq44UaixyKMD9HnEW0u70162W3FP+YwlsQWqOOpHz1svONXpHZg4x1PbsDGPyJPvv8TNtzxQe94nJeNdxxBOtTx1KjjqVHHU6OOp0YdT82GO/5Deh+iZBA9EdFmkv6K2/BrXB1PTvqnOTbd8fQGqOOpHdh4x5M7oI7ri0DJSWy5Or64OakHG/8aEJPUBDWcSWm5Oi4ktFwdF4zjiYwgOgvRhpPMcr3EHYks/5o6XpDGcjXcI4nl6rhPAsvX4mN2ExLd8m16ideIbTnRVxApgC1/MeL5if0ttJZcE/MyV8ODxLNcL/EWYlmuhrfClt+OeEaIHoRIaRDjMtdLvBO2fDvieVDD+2DPEc6BGt4PW976RxXGooYPgj1HuCS3EH0CodLFtTN5fhvRfoRKD2z5yYgnc/1s3ysbwfKX+T41fCRLer78l2zzOHQZ08zUPyJUhvP2yZ6beTsRKqO4aprnU79QiuF34z3nT7JHqEzh1pGej/8SKXU+ziY+E0kPl6nfs3Af9nyIkwOHKQMQz++CpAX1e17E8/YPrZfup5EoMyGuhq5jWx/2FxmVcVhvLZedjUDAAGV+4HCFUX/QUJmAffRieSNqSguLxf8BNaPi1UZK9FUAAAAASUVORK5CYII=";

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
  // Alleen upsert op basis van item id — nooit bulk-delete.
  // Items worden nooit verwijderd; afgevoerde artikelen worden gemarkeerd via het status-veld.
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
