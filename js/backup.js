// ============================================================
// backup.js — exporteren en importeren van data (JSON, Excel, CSV)
// ============================================================

function exportAllData() {
  const exportData = JSON.parse(JSON.stringify(store));
  if (!_isPlatformAdmin) {
    exportData.products = [];
    toast('Backup zonder productdatabase (alleen beschikbaar voor beheerders)', 'warning', 4000);
  }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `klimkeur_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  // Reset backup reminder counter
  localStorage.setItem(DB_KEY + '_changesSinceBackup', '0');
  localStorage.setItem(DB_KEY + '_lastBackup', Date.now().toString());
  toast('Backup geëxporteerd');
  // Refresh dashboard if open
  if (currentPage === 'dashboard') renderPage();
}

function exportProductsCSV() {
  const headers = Object.keys(COLUMN_LABELS);
  let csv = headers.map(h => COLUMN_LABELS[h]).join(';') + '\n';
  store.products.forEach(p => {
    csv += headers.map(h => '"' + String(p[h]||'').replace(/"/g,'""') + '"').join(';') + '\n';
  });
  const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `producten_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  toast('Producten geëxporteerd als CSV');
}

// ============================================================
// EXCEL IMPORT - Certificaat
// ============================================================
function importCertificaatExcel(inputEl) {
  // Can be called from keuringen page (with inputEl) or from instellingen (with #certImportFile)
  const fileInput = inputEl || document.getElementById('certImportFile');
  const file = fileInput?.files?.[0];
  if (!file) {
    // Geen bestand gekozen. Als er nog een onafgeronde import in de wacht staat,
    // bied dan aan om die te hervatten.
    if (_certImportState && _certImportState.items && _certImportState.items.length > 0) {
      const hervatten = confirm(
        `Er staat nog een onafgeronde certificaat-import klaar voor "${_certImportState.eigenaarUitExcel}" ` +
        `met ${_certImportState.items.length} items.\n\n` +
        `OK = hervatten (kies een andere klant)\n` +
        `Annuleren = wissen en opnieuw beginnen`
      );
      if (hervatten) {
        const st = _certImportState;
        showImportPreview(st.eigenaarUitExcel, st.keuringDatum, st.keuringCertNr, st.items, 'hervat');
        return;
      } else {
        _certImportState = null;
      }
    }
    toast('Selecteer eerst een Excel bestand', 'error');
    return;
  }

  // Reset the file input so the same file can be re-selected
  setTimeout(() => { if (fileInput) fileInput.value = ''; }, 100);

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, {type: 'array', cellDates: true});

      // Try to find the certificate sheet (look for common names)
      let sheetName = wb.SheetNames.find(n =>
        n.toLowerCase().includes('keur') || n.toLowerCase().includes('cert')
      ) || wb.SheetNames[0];

      const ws = wb.Sheets[sheetName];
      if (!ws) { toast('Kan geen blad vinden in het bestand', 'error'); return; }

      // Parse the certificate - based on the known template format
      // Row 1: Keuringsdatum in A1/A2, Certificaatnummer in H1/K1
      // Row 4: Eigenaar in A4 (value in B4 or merged)
      // Row 13: Header row for items
      // Row 14+: Item data

      const getVal = (cell) => {
        if (!ws[cell]) return '';
        const v = ws[cell].v;
        if (v instanceof Date) return v.toISOString().split('T')[0];
        return v != null ? String(v).trim() : '';
      };

      // Extract header info
      let keuringsDatum = '';
      let certificaatNr = '';
      let eigenaar = '';

      // Datum altijd in A2 - kan Excel date serial zijn
      const datumCellA2 = ws['A2'];
      if (datumCellA2) {
        if (datumCellA2.t === 'd' || (datumCellA2.t === 'n' && datumCellA2.v > 25000)) {
          const d = XLSX.SSF.parse_date_code(datumCellA2.v);
          if (d) keuringsDatum = String(d.d).padStart(2,'0') + '-' + String(d.m).padStart(2,'0') + '-' + d.y;
        } else {
          keuringsDatum = String(datumCellA2.v || '').trim();
        }
      }
      // Eigenaar altijd in B4
      const eigenaarCelB4 = ws['B4'];
      if (eigenaarCelB4) eigenaar = String(eigenaarCelB4.v || '').trim();

      // Certificaatnummer: zoek label "Certificaatnummer:" en pak cel rechts ervan
      const scanRangeCert = XLSX.utils.decode_range(ws['!ref'] || 'A1:T250');
      for (let r2 = 0; r2 <= scanRangeCert.e.r && !certificaatNr; r2++) {
        for (let c2 = 0; c2 <= Math.min(scanRangeCert.e.c, 4); c2++) {
          const lc = ws[XLSX.utils.encode_cell({r: r2, c: c2})];
          if (lc && String(lc.v||'').toLowerCase().trim() === 'certificaatnummer:') {
            const rc = ws[XLSX.utils.encode_cell({r: r2, c: c2+1})];
            if (rc) { certificaatNr = String(rc.v||'').trim(); }
            break;
          }
        }
      }
      // Fallback: datum uit certificaatnummer (formaat yyyymmdd-bedrijfsnaam)
      if (!keuringsDatum && certificaatNr) {
        const m = String(certificaatNr).match(/^(\d{4})(\d{2})(\d{2})-/);
        if (m) keuringsDatum = m[3] + '-' + m[2] + '-' + m[1];
      }

      // Find the header row (look for "Omschrijving" in ANY column)
      let headerRow = 13; // default based on template
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:T200');
      outerLoop:
      for (let r = 0; r <= Math.min(range.e.r, 30); r++) {
        for (let c = 0; c <= Math.min(range.e.c, 15); c++) {
          const cell = ws[XLSX.utils.encode_cell({r:r, c:c})];
          if (cell && String(cell.v || '').toLowerCase().includes('omschrijving')) {
            headerRow = r + 1; // 1-indexed
            break outerLoop;
          }
        }
      }

      // Read column headers to map positions
      const colMap = {};
      const headerNames = {
        'omschrijving': 'omschrijving', 'merk': 'merk', 'materiaal': 'materiaal',
        'serie': 'serienummer', 'serienummer': 'serienummer', 'serie nummer': 'serienummer',
        'fabr. jaar': 'fabrJaar', 'fabr.jaar': 'fabrJaar', 'fabr': 'fabrJaar',
        'goed': 'goed', 'afkeur': 'afkeur', 'afgekeurd': 'afkeur',
        'opmerking': 'opmerking', 'opmerkingen': 'opmerking',
        'gebruiker': 'gebruiker', 'code': 'afkeurcode'
      };

      for (let c = 0; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({r: headerRow - 1, c: c})];
        if (cell) {
          const val = String(cell.v || '').toLowerCase().trim();
          for (const [key, mapped] of Object.entries(headerNames)) {
            if (val.includes(key)) {
              // Only set if not already mapped (first/best match wins)
              if (colMap[mapped] === undefined) {
                colMap[mapped] = c;
              }
              break;
            }
          }
        }
      }

      // Read items starting from row after header
      const items = [];
      for (let r = headerRow; r <= range.e.r; r++) {
        const omschrCell = ws[XLSX.utils.encode_cell({r: r, c: colMap.omschrijving ?? 0})];
        if (!omschrCell || !omschrCell.v) continue;
        const omschr = String(omschrCell.v).trim();
        if (!omschr || omschr.toLowerCase().includes('afgekeurd wegens')) break;

        const getCellVal = (field) => {
          if (colMap[field] === undefined) return '';
          const cell = ws[XLSX.utils.encode_cell({r: r, c: colMap[field]})];
          return cell ? String(cell.v ?? '').trim() : '';
        };

        // Determine status
        let status = 'goedgekeurd';
        let afkeurcode = '';
        const goedVal = getCellVal('goed');
        const afkeurVal = getCellVal('afkeur');
        if (afkeurVal && afkeurVal !== '0' && afkeurVal !== '') {
          status = 'afgekeurd';
          afkeurcode = afkeurVal;
        }

        // Lookup product in database for extra info
        const prod = store.products.find(p => p.omschrijving === omschr);

        items.push({
          omschrijving: omschr,
          merk: getCellVal('merk') || prod?.merk || '',
          materiaal: getCellVal('materiaal') || prod?.materiaal || '',
          serienummer: getCellVal('serienummer'),
          fabrJaar: getCellVal('fabrJaar'),
          fabrMaand: 0,
          status: status,
          afkeurcode: afkeurcode,
          opmerking: getCellVal('opmerking'),
          gebruiker: getCellVal('gebruiker'),
          maxLeeftijd: prod?.maxLeeftijd || '',
          enNorm: prod?.enNorm || '',
        });
      }

      if (items.length === 0) {
        toast('Geen keuringsitems gevonden in het bestand. Controleer het formaat.', 'error');
        return;
      }

      // Show preview before confirming import
      showImportPreview(eigenaar, keuringsDatum, certificaatNr, items, sheetName);

    } catch(err) {
      console.error(err);
      toast('Fout bij lezen Excel: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function showImportPreview(eigenaar, datum, certNr, items, sheetName) {
  // Converteer dd-mm-yyyy naar yyyy-mm-dd voor <input type="date">
  if (datum && datum.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const parts = datum.split('-');
    datum = parts[2] + '-' + parts[1] + '-' + parts[0];
  }
  const goed = items.filter(i => i.status === 'goedgekeurd').length;
  const afk  = items.filter(i => i.status === 'afgekeurd').length;

  // Veilig escapen voor in HTML attributen
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Exacte match (case-insensitive) op klantnaam
  const eigenaarLower = (eigenaar || '').toLowerCase().trim();
  const exacteMatch = (store.klanten || []).find(
    k => (k.bedrijf || '').toLowerCase().trim() === eigenaarLower && eigenaarLower !== ''
  );

  // Sorteer alle klanten alfabetisch voor de dropdown
  const alleKlanten = [...(store.klanten || [])].sort(
    (a, b) => (a.bedrijf || '').localeCompare(b.bedrijf || '')
  );

  // Bepaal de standaard-keuze
  // - Match? → "bestaand" voorgeselecteerd
  // - Geen match maar wél een eigenaar uit Excel? → "nieuw" voorgeselecteerd
  // - Geen eigenaar? → "handmatig" voorgeselecteerd
  let defaultKeuze = 'handmatig';
  if (exacteMatch) defaultKeuze = 'bestaand';
  else if (eigenaar) defaultKeuze = 'nieuw';

  // Ingelogde keurmeester bepalen — NOOIT hardcoden
  const ingelogdeKeurmeester = (store.settings && store.settings.keurmeester) || '';

  showModal('Certificaat Import — Controleer', `
    <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;margin-bottom:16px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">
        <div><span style="color:var(--text-secondary);">Blad:</span> <strong>${esc(sheetName)}</strong></div>
        <div><span style="color:var(--text-secondary);">Eigenaar uit Excel:</span> <strong>${esc(eigenaar) || '(niet gevonden)'}</strong></div>
        <div><span style="color:var(--text-secondary);">Datum:</span> <strong>${esc(datum) || '(niet gevonden)'}</strong></div>
        <div><span style="color:var(--text-secondary);">Certificaat Nr:</span> <strong>${esc(certNr) || '(niet gevonden)'}</strong></div>
        <div><span style="color:var(--text-secondary);">Items:</span> <strong>${items.length}</strong></div>
        <div>
          <span class="badge badge-green" style="margin-right:4px;">${goed} goed</span>
          <span class="badge badge-red">${afk} afgekeurd</span>
        </div>
      </div>
    </div>

    <!-- KLANT KOPPELEN -->
    <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;margin-bottom:16px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:10px;">Klant koppelen</div>

      ${exacteMatch ? `
        <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;cursor:pointer;">
          <input type="radio" name="impKlantKeuze" value="bestaand" ${defaultKeuze==='bestaand'?'checked':''} onchange="_impKlantKeuzeWissel()">
          <span>Koppelen aan bestaande klant: <strong>${esc(exacteMatch.bedrijf)}</strong> <span class="badge badge-green" style="font-size:10px;">match</span></span>
        </label>
      ` : ''}

      ${eigenaar ? `
        <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;cursor:pointer;">
          <input type="radio" name="impKlantKeuze" value="nieuw" ${defaultKeuze==='nieuw'?'checked':''} onchange="_impKlantKeuzeWissel()">
          <span>Nieuwe klant aanmaken met naam: <strong>${esc(eigenaar)}</strong></span>
        </label>
      ` : ''}

      <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;cursor:pointer;">
        <input type="radio" name="impKlantKeuze" value="handmatig" ${defaultKeuze==='handmatig'?'checked':''} onchange="_impKlantKeuzeWissel()">
        <span>Kies handmatig een bestaande klant</span>
      </label>

      <div id="impKlantHandmatigWrap" style="margin-top:8px;margin-left:24px;display:${defaultKeuze==='handmatig'?'block':'none'};">
        <select class="form-input" id="impKlantHandmatig" style="max-width:400px;">
          <option value="">— kies klant —</option>
          ${alleKlanten.map(k => `<option value="${esc(k.id)}">${esc(k.bedrijf)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Keuringsdatum ${!datum ? '<span style="color:var(--warning);font-size:11px;">⚠ niet gevonden — controleer handmatig</span>' : ''}</label>
        <input class="form-input" type="date" id="importDatum" value="${esc(datum)}" style="${!datum ? 'border-color:var(--warning);background:rgba(255,165,0,0.08);' : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Certificaatnummer</label>
        <input class="form-input" id="importCertNr" value="${esc(certNr)}">
      </div>
    </div>

    <div style="background:var(--bg-input);border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;font-size:12px;">
      <span style="color:var(--text-secondary);">Keurmeester:</span>
      <strong>${esc(ingelogdeKeurmeester) || '<span style="color:var(--danger);">⚠ geen keurmeester ingesteld</span>'}</strong>
      <div style="color:var(--text-muted);font-size:11px;margin-top:2px;">Het certificaat wordt op naam van de ingelogde keurmeester geïmporteerd.</div>
    </div>

    <div style="font-size:13px;font-weight:600;margin:12px 0 8px;">Eerste 10 items ter controle:</div>
    <div style="max-height:200px;overflow-y:auto;font-size:12px;">
      <table>
        <thead><tr><th>Omschrijving</th><th>Merk</th><th>Serienummer</th><th>Jaar</th><th>Status</th></tr></thead>
        <tbody>
          ${items.slice(0, 10).map(i => `
            <tr>
              <td>${esc(i.omschrijving)}</td>
              <td>${esc(i.merk)}</td>
              <td style="font-family:monospace;">${esc(i.serienummer)}</td>
              <td>${esc(i.fabrJaar)}</td>
              <td><span class="badge ${i.status==='goedgekeurd'?'badge-green':'badge-red'}">${i.status==='goedgekeurd'?'Goed':'Afkeur'}</span></td>
            </tr>
          `).join('')}
          ${items.length > 10 ? `<tr><td colspan="5" style="color:var(--text-muted);text-align:center;">...en nog ${items.length - 10} meer</td></tr>` : ''}
        </tbody>
      </table>
    </div>
  `, () => {
    _verwerkCertificaatImport(eigenaar, items);
  });
}

// Toggle voor het handmatige klant-dropdown
function _impKlantKeuzeWissel() {
  const keuze = document.querySelector('input[name="impKlantKeuze"]:checked')?.value;
  const wrap = document.getElementById('impKlantHandmatigWrap');
  if (wrap) wrap.style.display = (keuze === 'handmatig') ? 'block' : 'none';
}

// Tijdelijke opslag voor de import-state als we via het klant-modal gaan
// (de import-modal sluit dan, en we heropenen hem na het opslaan van de klant)
let _certImportState = null;

// Verwerkt de bevestiging van de import — bepaalt de klant en routeert door
async function _verwerkCertificaatImport(eigenaarUitExcel, items) {
  try {
    // 1. Veiligheid: er moet een ingelogde keurmeester zijn
    const keurmeesterNaam = (store.settings && store.settings.keurmeester) || '';
    if (!keurmeesterNaam) {
      toast('Geen keurmeester ingesteld — stel eerst in via Instellingen', 'error');
      return;
    }
    if (!_huidigBedrijfId) {
      toast('Geen bedrijf bekend — opnieuw inloggen', 'error');
      return;
    }

    // 2. Lees import-velden uit het modal
    const keuze = document.querySelector('input[name="impKlantKeuze"]:checked')?.value;
    const keuringDatum  = document.getElementById('importDatum').value || new Date().toISOString().split('T')[0];
    const keuringCertNr = document.getElementById('importCertNr').value || '';

    // 3. Routering op basis van keuze
    if (keuze === 'bestaand') {
      const eigenaarLower = (eigenaarUitExcel || '').toLowerCase().trim();
      const klant = (store.klanten || []).find(
        k => (k.bedrijf || '').toLowerCase().trim() === eigenaarLower
      );
      if (!klant) { toast('Bestaande klant niet meer gevonden', 'error'); return; }
      await _rondCertificaatImportAf(klant, items, keuringDatum, keuringCertNr, keurmeesterNaam);
      return;
    }

    if (keuze === 'handmatig') {
      const klantId = document.getElementById('impKlantHandmatig').value;
      if (!klantId) { toast('Kies eerst een klant uit de lijst', 'error'); return; }
      const klant = (store.klanten || []).find(k => k.id === klantId);
      if (!klant) { toast('Gekozen klant niet gevonden', 'error'); return; }
      await _rondCertificaatImportAf(klant, items, keuringDatum, keuringCertNr, keurmeesterNaam);
      return;
    }

    if (keuze === 'nieuw') {
      // Duplicaat-check: bestaat er al een klant met (bijna) dezelfde naam?
      const naam = (eigenaarUitExcel || '').trim();
      if (!naam) { toast('Geen klantnaam beschikbaar', 'error'); return; }

      const naamLower = naam.toLowerCase();
      const duplicaat = (store.klanten || []).find(
        k => (k.bedrijf || '').toLowerCase().trim() === naamLower
      );
      if (duplicaat) {
        const kies = confirm(
          `Er bestaat al een klant met de naam "${duplicaat.bedrijf}".\n\n` +
          `OK = bestaande klant gebruiken\n` +
          `Annuleren = toch doorgaan en nieuwe klant aanmaken`
        );
        if (kies) {
          await _rondCertificaatImportAf(duplicaat, items, keuringDatum, keuringCertNr, keurmeesterNaam);
          return;
        }
        // anders: gebruiker wil toch een nieuwe — ga door naar klant-modal
      }

      // Sla import-state op, sluit import-modal, open klant-modal
      _certImportState = {
        eigenaarUitExcel: naam,
        items,
        keuringDatum,
        keuringCertNr,
        keurmeesterNaam,
      };
      closeModal();

      // Open het normale klant-modal. De tweede parameter is onze callback die
      // na succesvol opslaan wordt aangeroepen met de nieuwe klant.
      openKlantModal(undefined, async (nieuweKlant) => {
        // De klant is al door openKlantModal naar Supabase gestuurd en in
        // store.klanten gepusht. Wij hoeven alleen de import af te ronden.
        const st = _certImportState;
        _certImportState = null;
        if (!st) { toast('Import-state verloren', 'error'); return; }
        await _rondCertificaatImportAf(
          nieuweKlant, st.items, st.keuringDatum, st.keuringCertNr, st.keurmeesterNaam
        );
      });

      // Vul de velden in het klant-modal voor met wat we al weten uit Excel.
      // setTimeout 0 zorgt dat het modal eerst in de DOM staat.
      setTimeout(() => {
        const bedrijfVeld = document.getElementById('klantBedrijf');
        if (bedrijfVeld) bedrijfVeld.value = naam;
        const opmVeld = document.getElementById('klantOpm');
        if (opmVeld && !opmVeld.value) opmVeld.value = 'Aangemaakt via certificaat-import';
      }, 0);
      return;
    }

    toast('Maak eerst een keuze hoe de klant gekoppeld moet worden', 'error');

  } catch (err) {
    console.error('Certificaat import onverwachte fout:', err);
    toast('Onverwachte fout: ' + (err.message || err), 'error');
  }
}

// Rondt de certificaat-import af met een bekende klant — slaat de keuring en
// items veilig op in Supabase en de lokale store.
async function _rondCertificaatImportAf(klant, items, keuringDatum, keuringCertNr, keurmeesterNaam) {
  try {
    // Keuring opbouwen
    const keuring = {
      id:            generateId(),
      datum:         keuringDatum,
      certificaatNr: keuringCertNr,
      klantId:       klant.id,
      klantNaam:     klant.bedrijf,
      keurmeester:   keurmeesterNaam,    // ingelogde keurmeester — nooit hardcoded
      opmerkingen:   'Geïmporteerd uit Excel',
      items:         items.map(i => ({ ...i, id: i.id || generateId() })),
      afgerond:      true,
    };

    // Keuring naar Supabase
    try {
      await sbUpsertKeuring(keuring);
    } catch (err) {
      console.error('sbUpsertKeuring fout:', err);
      toast('Keuring kon niet worden opgeslagen — import geannuleerd', 'error');
      return;
    }

    // Items via veilige bulk-upsert (gebruikt onConflict: 'id', geen delete)
    try {
      await sbSyncAllKeuringItems(keuring);
    } catch (err) {
      console.error('sbSyncAllKeuringItems fout:', err);
      toast('Items konden niet worden opgeslagen — zie console', 'warning', 6000);
      // niet terugdraaien — keuring staat al
    }

    // Pas NU lokaal toevoegen
    store.keuringen.push(keuring);
    saveStore(store);

    closeModal();
    toast(`Certificaat geïmporteerd: ${keuring.items.length} items voor ${klant.bedrijf}`, 'success');
    navigateTo('keuringen');

  } catch (err) {
    console.error('Certificaat afronden onverwachte fout:', err);
    toast('Onverwachte fout: ' + (err.message || err), 'error');
  }
}

// ============================================================
// EXCEL EXPORT — Keuring als Certificaat
// ============================================================
function exportKeuringExcel() {
  const sel = document.getElementById('exportKeuringSelect');
  if (!sel || !sel.value) { toast('Selecteer eerst een keuring', 'error'); return; }
  const k = store.keuringen.find(ke => ke.id === sel.value);
  if (!k) return;
  const onbeoordeeld = (k.items||[]).filter(i => !i.status).length;
  if (onbeoordeeld > 0) {
    toast(`⚠ Let op: ${onbeoordeeld} onbeoordeeld${onbeoordeeld>1?'e':''} item${onbeoordeeld>1?'s worden':' wordt'} NIET meegenomen in het certificaat.`, 'warning', 5000);
  }

  const wb = XLSX.utils.book_new();

  // Build certificate data
  const s = store.settings;
  const rows = [];

  // Header section
  rows.push(['Keuringsdatum:', k.datum, '', 'KEURINGS-CERTIFICAAT', '', '', '', 'Certificaatnummer:', k.certificaatNr]);
  rows.push([]);
  rows.push(['', s.bedrijfsnaam || 'Safety Green B.V.']);
  rows.push(['Eigenaar materialen:', k.klantNaam]);
  rows.push([]);
  rows.push([s.certificaatTekst || '']);
  rows.push([]);
  rows.push([]);

  // Afkeurcodes header
  rows.push(['Afkeurcodes:']);
  getAfkeurcodes().forEach(c => {
    rows.push(['', c.code, c.tekst]);
  });
  rows.push([]);

  // Items header
  rows.push(['Omschrijving', 'Merk', 'Materiaal', 'Serie nummer', 'Fabr. Jaar', 'Fabr. Maand', 'Goed', 'Afkeur', 'Opmerking', 'Gebruiker']);
  const itemHeaderRow = rows.length; // 1-indexed after push

  // Items (sorted, only rated items)
  [...(k.items || [])].filter(item => item.status === 'goedgekeurd' || item.status === 'afgekeurd').sort((a, b) => {
    const col = keuringItemSort.col;
    const cmp = (x, y) => (x||'').localeCompare(y||'', 'nl', {sensitivity:'base'});
    const val = (obj) => {
      if (col === 'fabrJaar') return String(obj.fabrJaar||'');
      if (col === 'inGebruik') return obj.inGebruik||'';
      return obj[col]||'';
    };
    const result = cmp(val(a), val(b));
    return keuringItemSort.asc ? result : -result;
  }).forEach(item => {
    rows.push([
      item.omschrijving || '',
      item.merk || '',
      item.materiaal || '',
      item.serienummer || '',
      item.fabrJaar || '',
      item.fabrMaand ? MAANDEN[item.fabrMaand] : '',
      item.status === 'goedgekeurd' ? 'X' : '',
      item.status === 'afgekeurd' ? (item.afkeurcode || 'X') : '',
      item.opmerking || '',
      item.gebruiker || ''
    ]);
  });

  // Footer
  rows.push([]);
  rows.push(['Eigenaar materiaal:', k.klantNaam]);
  rows.push(['Certificaatnummer:', k.certificaatNr]);
  rows.push(['Gekeurd door:', k.keurmeester]);
  rows.push(['Keuringsdatum:', k.datum]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    {wch:25},{wch:16},{wch:16},{wch:18},{wch:10},{wch:12},{wch:6},{wch:8},{wch:20},{wch:16}
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Keurings-Certificaat');
  XLSX.writeFile(wb, `Certificaat_${k.certificaatNr || k.klantNaam}_${k.datum}.xlsx`);
  toast('Certificaat geëxporteerd als Excel');
}

// ============================================================
// EXCEL EXPORT — Producten
// ============================================================
function exportProductenExcel() {
  const wb = XLSX.utils.book_new();
  const headers = ['Omschrijving','Merk','Materiaal','Bijzonderheden','Max Leeftijd','Max USE','Max MFR','EN-Norm','Breuksterkte','Handleiding'];
  const rows = [headers];
  store.products.forEach(p => {
    rows.push([
      p.omschrijving||'', p.merk||'', p.materiaal||'', p.bijzonderheden||'',
      p.maxLeeftijd||'', p.maxLeeftijdUSE||'', p.maxLeeftijdMFR||'',
      p.enNorm||'', p.breuksterkte||'', p.handleiding||p.link||''
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:30},{wch:16},{wch:18},{wch:20},{wch:12},{wch:10},{wch:10},{wch:18},{wch:12},{wch:40}];
  XLSX.utils.book_append_sheet(wb, ws, 'Producten');
  XLSX.writeFile(wb, `Producten_${new Date().toISOString().split('T')[0]}.xlsx`);
  toast('Producten geëxporteerd als Excel');
}

// ============================================================
// EXCEL IMPORT — Producten
// ============================================================
function importKlantJSON(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);

      // Validate format
      if (!data._format || !data._format.startsWith('klimkeur-aanmelding')) {
        // Try to be flexible - check for items array
        if (!data.items || !Array.isArray(data.items)) {
          toast('Ongeldig bestandsformaat — geen KlimKeur aanmelding herkend', 'error');
          return;
        }
      }

      // Lokale HTML escape helper (Pro gebruikt esc() maar niet escHtml)
      function escHtml(s) {
        return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }

      // Normaliseer klantnaam: trim, dubbele spaties weg, eerste letter hoofdletter per woord
      function normaliseerNaam(n) {
        if (!n) return '';
        return n.trim().replace(/\s+/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }

      const klantNaamRaw = data.klant?.naam || data.klantNaam || '';
      const klantNaam = normaliseerNaam(klantNaamRaw) || 'Onbekend';
      const klantId = data.klant?.id || '';
      const items = data.items || [];

      // Sorteerbare staat voor de importdialoog
      let importSortCol = 'gebruiker';
      let importSortDir = 1;

      // Zoek matching klant — op ID eerst, dan op genormaliseerde naam
      const klant = store.klanten.find(k =>
        (klantId && k.id === klantId) ||
        normaliseerNaam(k.bedrijf).toLowerCase() === klantNaam.toLowerCase()
      );

      function renderImportItems(sortCol, sortDir) {
        const gesorteerd = [...items].sort((a, b) => {
          const va = String(a[sortCol] || '').toLowerCase();
          const vb = String(b[sortCol] || '').toLowerCase();
          return va < vb ? -sortDir : va > vb ? sortDir : 0;
        });
        const kolommen = [
          { key: 'omschrijving', label: 'Omschrijving', flex: '2' },
          { key: 'gebruiker',    label: 'Gebruiker',    flex: '1' },
          { key: 'serienummer',  label: 'Serienr.',     flex: '1' },
          { key: 'inGebruik',    label: 'In gebruik',   flex: '1' },
        ];
        const pijl = (k) => k === sortCol ? (sortDir === 1 ? ' ▲' : ' ▼') : ' ⇅';
        return `
          <div style="background:var(--bg-input);border-radius:var(--radius);overflow:hidden;max-height:260px;overflow-y:auto;">
            <div style="display:flex;gap:4px;padding:6px 8px;background:var(--bg-card);border-bottom:2px solid var(--border);position:sticky;top:0;">
              ${kolommen.map(k => `
                <div style="flex:${k.flex};font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;cursor:pointer;user-select:none;"
                  onclick="importSorteer('${k.key}')">
                  ${k.label}<span style="color:var(--sg-green);">${pijl(k.key)}</span>
                </div>
              `).join('')}
            </div>
            ${gesorteerd.map((i, idx) => `
              <div style="font-size:12px;padding:6px 8px;border-bottom:1px solid var(--border);display:flex;gap:4px;align-items:center;">
                <div style="flex:2;">${escHtml(i.omschrijving || '?')}</div>
                <div style="flex:1;color:var(--text-muted);">${escHtml(i.gebruiker || '—')}</div>
                <div style="flex:1;color:var(--text-muted);font-family:monospace;font-size:11px;">${escHtml(i.serienummer || '')}</div>
                <div style="flex:1;color:var(--text-muted);">${i.inGebruik ? formatDate(i.inGebruik) : ''}</div>
              </div>
            `).join('')}
          </div>`;
      }

      // Maak sorteer functie globaal beschikbaar voor onclick
      window.importSorteer = function(col) {
        if (importSortCol === col) importSortDir *= -1;
        else { importSortCol = col; importSortDir = 1; }
        const container = document.getElementById('importItemsContainer');
        if (container) container.innerHTML = renderImportItems(importSortCol, importSortDir);
      };

      showModal('Klantaanmelding importeren', `
        <div style="margin-bottom:16px;">
          <div style="font-size:14px;font-weight:600;margin-bottom:4px;">Klant: ${escHtml(klantNaam)}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">${items.length} item${items.length !== 1 ? 's' : ''} aangemeld</div>
          ${klant
            ? `<div style="color:var(--sg-green);font-size:12px;margin-bottom:8px;">✓ Klant gevonden: ${escHtml(klant.bedrijf)}</div>`
            : klantNaam !== 'Onbekend'
              ? `<div style="color:var(--warning);font-size:12px;margin-bottom:8px;">⚠ "${escHtml(klantNaam)}" niet gevonden — selecteer hieronder</div>`
              : `<div style="color:var(--warning);font-size:12px;margin-bottom:8px;">⚠ Klant niet gevonden — selecteer hieronder</div>`
          }
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">Koppel aan klant:</div>
          <select class="form-select" id="importKlantSelect" style="margin-bottom:12px;">
            <option value="">-- Selecteer klant --</option>
            ${store.klanten
              .slice()
              .sort((a,b) => a.bedrijf.localeCompare(b.bedrijf,'nl'))
              .map(k => `<option value="${k.id}" ${k.id === klant?.id ? 'selected' : ''}>${escHtml(k.bedrijf)}</option>`)
              .join('')}
          </select>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">Keuringsdatum:</div>
          <input type="date" class="form-input" id="importKeuringDatum" value="${new Date().toISOString().split('T')[0]}" style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;margin-bottom:6px;">Items (klik kolom om te sorteren):</div>
          <div id="importItemsContainer">${renderImportItems(importSortCol, importSortDir)}</div>
        </div>
      `, () => {
          const selectedKlantId = document.getElementById('importKlantSelect').value;
          const datum = document.getElementById('importKeuringDatum').value;
          if (!selectedKlantId) { toast('Selecteer eerst een klant', 'error'); return; }

          const geselecteerdeKlant = store.klanten.find(k => k.id === selectedKlantId);
          const keuringId = 'k_' + Date.now();

          // Auto-generate certificate number
          const year = datum.split('-')[0];
          const existing = store.keuringen.filter(k => k.certificaatNr?.startsWith(year)).length;
          const certNr = `${year}-${String(existing + 1).padStart(3, '0')}`;

          // Assign item IDs and enrich from product database
          const enrichedItems = items.map(i => {
            const prod = store.products.find(p =>
              p.omschrijving?.toLowerCase() === (i.omschrijving || '').toLowerCase()
            );
            return {
              itemId: store.nextItemId++,
              omschrijving: i.omschrijving || '',
              merk: i.merk || prod?.merk || '',
              materiaal: i.materiaal || prod?.materiaal || '',
              serienummer: i.serienummer || '',
              fabrJaar: i.fabrJaar || '',
              fabrMaand: i.fabrMaand || 0,
              inGebruik: i.inGebruik || '',
              gebruiker: i.gebruiker || '',
              status: '',
              afkeurcode: '',
              opmerking: '',
              maxLeeftijd: prod?.maxLeeftijd || '',
              maxLeeftijdUSE: prod?.maxLeeftijdUSE || '',
              enNorm: prod?.enNorm || i.enNorm || '',
              handleiding: prod?.handleiding || '',
            };
          });

          const keuring = {
            id: keuringId,
            klantId: selectedKlantId,
            klantNaam: geselecteerdeKlant.bedrijf,
            datum: datum,
            certificaatNr: certNr,
            keurmeester: store.settings.keurmeester,
            afgerond: false,
            items: enrichedItems,
            auditLog: [{ actie: 'aangemaakt via klant JSON', datum: new Date().toISOString(), door: store.settings.keurmeester, bron: file.name }]
          };

          store.keuringen.push(keuring);
          saveStore(store);
          sbUpsertKeuring(keuring)
            .then(() => sbSyncAllKeuringItems(keuring))
            .catch(console.error);
          closeModal();
          toast(`Keuring aangemaakt met ${enrichedItems.length} items — item ID's ${enrichedItems[0]?.itemId} t/m ${enrichedItems[enrichedItems.length-1]?.itemId}`);
          navigateTo('keuringen');
          setTimeout(() => openKeuringDetail(keuringId), 100);
      });
    } catch(err) {
      toast('Fout bij inlezen JSON: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function importProductenExcel(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      // Smart sheet selection: prefer 'Bronlijst', or find sheet with 'Omschrijving' column
      let sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('bronlijst'));
      if (!sheetName) {
        // Try each sheet to find one with 'omschrijving' in first 20 rows
        for (const sn of wb.SheetNames) {
          const testRows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '' });
          for (let r = 0; r < Math.min(20, testRows.length); r++) {
            if (testRows[r].some(c => String(c).toLowerCase().trim() === 'omschrijving')) { sheetName = sn; break; }
          }
          if (sheetName) break;
        }
      }
      if (!sheetName) sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (rows.length < 2) { toast('Geen producten gevonden in bestand', 'error'); return; }

      // Detect header row - scan first 20 rows for 'omschrijving'
      let headerIdx = -1;
      let headerRow = [];
      for (let tryR = 0; tryR < Math.min(20, rows.length); tryR++) {
        const tryH = rows[tryR].map(h => String(h).toLowerCase().trim());
        if (tryH.some(h => h === 'omschrijving')) { headerIdx = tryR; headerRow = tryH; break; }
      }
      if (headerIdx < 0) {
        // Fallback: try partial match
        for (let tryR = 0; tryR < Math.min(20, rows.length); tryR++) {
          const tryH = rows[tryR].map(h => String(h).toLowerCase().trim());
          if (tryH.some(h => h.includes('omschrijving'))) { headerIdx = tryR; headerRow = tryH; break; }
        }
      }
      if (headerIdx < 0) { toast('Kolom "Omschrijving" niet gevonden in de eerste 20 rijen. Zorg dat het Excel-bestand een rij heeft met kolomnamen (Omschrijving, Merk, Materiaal, etc.)', 'error'); return; }

      const col = name => {
        const idx = headerRow.findIndex(h => h.includes(name));
        return idx >= 0 ? idx : -1;
      };

      const iOmschr  = col('omschrijving');
      const iMerk    = col('merk');
      const iMat     = col('materiaal');
      const iBijz    = col('bijzonderheden');
      const iAge     = col('max leeftijd') >= 0 ? col('max leeftijd') : col('leeftijd');
      const iAgeUse  = col('max use') >= 0 ? col('max use') : col('use');
      const iAgeMfr  = col('max mfr') >= 0 ? col('max mfr') : col('mfr');
      const iEN      = col('en-norm') >= 0 ? col('en-norm') : (col('en norm') >= 0 ? col('en norm') : col('norm'));
      const iBreuk   = col('breuksterkte') >= 0 ? col('breuksterkte') : col('breuk');
      const iHand    = col('handleiding');
      const iLink    = col('link');

      const PCLOUD_BASE = 'https://filedn.eu/l2g18dcAx9UkaWPxITqj1nH/manual/';
      const nieuweProducten = [];
      for (let r = headerIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        const omschr = String(row[iOmschr]||'').trim();
        if (!omschr) continue;
        // Skip category header rows (no merk)
        const merk = iMerk >= 0 ? String(row[iMerk]||'').trim() : '';
        if (iMerk >= 0 && !merk && iMat >= 0 && !String(row[iMat]||'').trim()) continue;

        // Process handleiding: convert .pdf filenames to pCloud URLs
        let handVal = iHand >= 0 ? String(row[iHand]||'').trim() : '';
        let linkVal = iLink >= 0 ? String(row[iLink]||'').trim() : '';
        if (handVal && !handVal.startsWith('http') && !handVal.startsWith('file:') && handVal.endsWith('.pdf')) {
          handVal = PCLOUD_BASE + handVal;
        }
        // If no handleiding but link has URL, use link
        if (!handVal && linkVal.startsWith('http')) handVal = linkVal;

        nieuweProducten.push({
          omschrijving: omschr,
          merk:         merk,
          materiaal:    iMat   >= 0 ? String(row[iMat]||'').trim()   : '',
          bijzonderheden: iBijz >= 0 ? String(row[iBijz]||'').trim() : '',
          maxLeeftijd:  iAge   >= 0 ? String(row[iAge]||'').trim()   : '',
          maxLeeftijdUSE: iAgeUse >= 0 ? String(row[iAgeUse]||'').trim() : '',
          maxLeeftijdMFR: iAgeMfr >= 0 ? String(row[iAgeMfr]||'').trim() : '',
          enNorm:       iEN    >= 0 ? String(row[iEN]||'').trim()    : '',
          breuksterkte: iBreuk >= 0 ? String(row[iBreuk]||'').trim() : '',
          handleiding:  handVal,
          link:         linkVal.startsWith('http') ? linkVal : '',
        });
      }

      if (nieuweProducten.length === 0) { toast('Geen geldige producten gevonden', 'error'); return; }

      const keuze = confirm(
        `${nieuweProducten.length} producten gevonden.\n\n` +
        `VERVANGEN: vervangt de volledige productdatabase (${store.products.length} huidige producten worden overschreven).\n\n` +
        `Klik OK om te VERVANGEN, of Annuleren om te annuleren.`
      );
      if (!keuze) return;

      // Veilige import: eerst upsert naar Supabase met bedrijf_id, pas daarna
      // oude producten van DIT bedrijf opruimen die niet in de nieuwe set zitten.
      // NOOIT eerst delete en dan insert — als de insert faalt ben je alles kwijt.
      if (!_huidigBedrijfId) {
        toast('Geen bedrijf bekend — opnieuw inloggen', 'error');
        return;
      }

      const nieuweMetId = nieuweProducten.map(p => ({ ...p, id: p.id || generateId() }));

      const sbProductRows = nieuweMetId.map(p => ({
        id:               p.id,
        omschrijving:     p.omschrijving || '',
        merk:             p.merk || '',
        materiaal:        p.materiaal || '',
        categorie:        p.categorie || '',
        norm:             p.enNorm || '',
        handleiding:      p.handleiding || '',
        max_leeftijd:     p.maxLeeftijd ? String(p.maxLeeftijd) : '',
        max_leeftijd_use: p.maxLeeftijdUSE || '',
        max_leeftijd_mfr: p.maxLeeftijdMFR || '',
        breuksterkte:     p.breuksterkte || '',
        bijzonderheden:   p.bijzonderheden || '',
        bedrijf_id:       _huidigBedrijfId,
      }));

      // Upsert in batches van 200 — voorkomt time-outs en geeft duidelijkere fouten
      (async () => {
        try {
          const BATCH = 200;
          for (let i = 0; i < sbProductRows.length; i += BATCH) {
            const batch = sbProductRows.slice(i, i + BATCH);
            const { error } = await sb.from('producten').upsert(batch, { onConflict: 'id' });
            if (error) throw error;
          }

          // Pas NA succesvolle upsert: oude producten van dit bedrijf opruimen
          // die niet in de nieuwe import voorkomen.
          const nieuweIds = sbProductRows.map(r => r.id);
          const teVerwijderen = (store.products || [])
            .filter(p => !nieuweIds.includes(p.id))
            .map(p => p.id);

          if (teVerwijderen.length > 0) {
            const { error: delErr } = await sb.from('producten')
              .delete()
              .eq('bedrijf_id', _huidigBedrijfId)
              .in('id', teVerwijderen);
            if (delErr) {
              console.error('Opruimen oude producten mislukt:', delErr);
              toast('Import gelukt, opruimen oude producten mislukt', 'warning');
            }
          }

          // Lokale store pas bijwerken NA succesvolle Supabase-write
          store.products = nieuweMetId;
          saveStore(store);
          toast(`${store.products.length} producten geïmporteerd en opgeslagen`);
          navigateTo('producten');
        } catch (err) {
          console.error('Supabase product import fout:', err);
          toast('Import mislukt: ' + (err.message || 'onbekende fout') + ' — bestaande producten zijn NIET gewijzigd', 'error', 6000);
        }
      })();
    } catch(err) {
      toast('Fout bij importeren: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
  input.value = '';
}

// ============================================================
// EXCEL EXPORT — Klanten
// ============================================================
async function exportKlantApp() {
  const lijst = store.products
    .filter(p => p.omschrijving)
    .map(p => ({
      omschrijving: p.omschrijving || '',
      merk: p.merk || '',
      materiaal: p.materiaal || '',
    }))
    .sort((a, b) => a.omschrijving.localeCompare(b.omschrijving, 'nl'));

  // Klant App template — geladen uit extern bestand KlantKeur_App.html
  const appTemplateResponse = await fetch('KlantKeur_App.html');
  if (!appTemplateResponse.ok) {
    toast('KlantKeur_App.html niet gevonden. Zorg dat dit bestand naast KlimKeur_Pro staat.', 'error');
    return;
  }
  const appTemplate = await appTemplateResponse.text();

  const productenJSON = JSON.stringify(lijst);
  const gegenereerd = new Date().toLocaleDateString('nl-NL');

  const appMetData = appTemplate
    .replace('%%PRODUCTEN_JSON%%', productenJSON)
    .replace(
      '<div class="header-sub">Mijn Materiaal</div>',
      '<div class="header-sub">Mijn Materiaal \u00b7 ' + lijst.length + ' producten \u00b7 ' + gegenereerd + '</div>'
    );

  const blob = new Blob([appMetData], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'KlimKeur_Klant_App_' + new Date().toISOString().split('T')[0] + '.html';
  a.click();
  toast('Klant app geexporteerd met ' + lijst.length + ' producten');
}

function exportKlantProductlijst() {
  // Exporteert alleen omschrijving, merk en materiaal — veilig voor klanten
  const lijst = store.products
    .filter(p => p.omschrijving)
    .map(p => ({
      omschrijving: p.omschrijving || '',
      merk: p.merk || '',
      materiaal: p.materiaal || '',
    }))
    .sort((a, b) => a.omschrijving.localeCompare(b.omschrijving, 'nl'));

  const exportObj = {
    _format: 'klimkeur-producten-v1',
    _gegenereerd: new Date().toISOString(),
    _aantalProducten: lijst.length,
    producten: lijst,
  };

  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'klimkeur_producten.json';
  a.click();
  toast(`Productlijst geëxporteerd — ${lijst.length} producten (omschrijving, merk, materiaal)`);
}

function exportKlantenExcel() {
  const wb = XLSX.utils.book_new();
  const headers = ['Bedrijf','Contactpersoon','Telefoon','Email','Adres','Opmerkingen','Aantal Keuringen'];
  const rows = [headers];
  store.klanten.forEach(k => {
    const aantalKeuringen = store.keuringen.filter(ke => ke.klantId === k.id).length;
    rows.push([k.bedrijf||'', k.contactpersoon||'', k.telefoon||'', k.email||'', k.adres||'', k.opmerkingen||'', aantalKeuringen]);
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:25},{wch:20},{wch:16},{wch:25},{wch:30},{wch:20},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws, 'Klanten');
  XLSX.writeFile(wb, `Klanten_${new Date().toISOString().split('T')[0]}.xlsx`);
  toast('Klanten geëxporteerd als Excel');
}

// ============================================================
// PDF CERTIFICAAT GENERATIE
// ============================================================
