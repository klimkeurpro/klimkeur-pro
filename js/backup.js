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
  if (!file) { toast('Selecteer eerst een Excel bestand', 'error'); return; }

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

      const getVal = (cell) => {
        if (!ws[cell]) return '';
        const v = ws[cell].v;
        if (v instanceof Date) return v.toISOString().split('T')[0];
        return v != null ? String(v).trim() : '';
      };

      let keuringsDatum = '';
      let certificaatNr = '';
      let eigenaar = '';

      const datumCellA2 = ws['A2'];
      if (datumCellA2) {
        if (datumCellA2.t === 'd' || (datumCellA2.t === 'n' && datumCellA2.v > 25000)) {
          const d = XLSX.SSF.parse_date_code(datumCellA2.v);
          if (d) keuringsDatum = String(d.d).padStart(2,'0') + '-' + String(d.m).padStart(2,'0') + '-' + d.y;
        } else {
          keuringsDatum = String(datumCellA2.v || '').trim();
        }
      }
      const eigenaarCelB4 = ws['B4'];
      if (eigenaarCelB4) eigenaar = String(eigenaarCelB4.v || '').trim();

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
      if (!keuringsDatum && certificaatNr) {
        const m = String(certificaatNr).match(/^(\d{4})(\d{2})(\d{2})-/);
        if (m) keuringsDatum = m[3] + '-' + m[2] + '-' + m[1];
      }

      let headerRow = 13;
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:T200');
      outerLoop:
      for (let r = 0; r <= Math.min(range.e.r, 30); r++) {
        for (let c = 0; c <= Math.min(range.e.c, 15); c++) {
          const cell = ws[XLSX.utils.encode_cell({r:r, c:c})];
          if (cell && String(cell.v || '').toLowerCase().includes('omschrijving')) {
            headerRow = r + 1;
            break outerLoop;
          }
        }
      }

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
              if (colMap[mapped] === undefined) {
                colMap[mapped] = c;
              }
              break;
            }
          }
        }
      }

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

        let status = 'goedgekeurd';
        let afkeurcode = '';
        const goedVal = getCellVal('goed');
        const afkeurVal = getCellVal('afkeur');
        if (afkeurVal && afkeurVal !== '0' && afkeurVal !== '') {
          status = 'afgekeurd';
          afkeurcode = afkeurVal;
        }

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

      showImportPreview(eigenaar, keuringsDatum, certificaatNr, items, sheetName);

    } catch(err) {
      console.error(err);
      toast('Fout bij lezen Excel: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function showImportPreview(eigenaar, datum, certNr, items, sheetName) {
  if (datum && datum.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const parts = datum.split('-');
    datum = parts[2] + '-' + parts[1] + '-' + parts[0];
  }
  const goed = items.filter(i => i.status === 'goedgekeurd').length;
  const afk  = items.filter(i => i.status === 'afgekeurd').length;

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const eigenaarLower = (eigenaar || '').toLowerCase().trim();
  const exacteMatch = (store.klanten || []).find(
    k => (k.bedrijf || '').toLowerCase().trim() === eigenaarLower && eigenaarLower !== ''
  );

  const alleKlanten = [...(store.klanten || [])].sort(
    (a, b) => (a.bedrijf || '').localeCompare(b.bedrijf || '')
  );

  let defaultKeuze = 'handmatig';
  if (exacteMatch) defaultKeuze = 'bestaand';
  else if (eigenaar) defaultKeuze = 'nieuw';

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

    <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;margin-bottom:16px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:10px;">Klant koppelen</div>

      ${exacteMatch ? `
        <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;cursor:pointer;">
          <input type="radio" name="impKlantKeuze" value="bestaand" ${defaultKeuze==='bestaand'?'checked':''} onchange="_impKlantKeuzeWissel()">
          <span>Koppelen aan bestaande klant: <strong>${esc(exacteMatch.bedrijf)}</strong> <span class="badge badge-green" style="font-size:10px;">match</span></span>
        </label>
      ` : ''}

      <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;cursor:pointer;">
        <input type="radio" name="impKlantKeuze" value="nieuw" ${defaultKeuze==='nieuw'?'checked':''} onchange="_impKlantKeuzeWissel()">
        <span>Nieuwe klant aanmaken</span>
      </label>
      <div id="impKlantNieuwWrap" style="margin-top:4px;margin-bottom:8px;margin-left:24px;display:${defaultKeuze==='nieuw'?'block':'none'};">
        <input class="form-input" id="impKlantNieuwNaam" value="${esc(eigenaar)}" placeholder="Bedrijfsnaam" style="max-width:400px;">
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Adres, email en overige gegevens kun je later aanvullen via Klanten.</div>
      </div>

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

function _impKlantKeuzeWissel() {
  const keuze = document.querySelector('input[name="impKlantKeuze"]:checked')?.value;
  const handWrap = document.getElementById('impKlantHandmatigWrap');
  const nieuwWrap = document.getElementById('impKlantNieuwWrap');
  if (handWrap) handWrap.style.display = (keuze === 'handmatig') ? 'block' : 'none';
  if (nieuwWrap) nieuwWrap.style.display = (keuze === 'nieuw') ? 'block' : 'none';
}

async function _verwerkCertificaatImport(eigenaarUitExcel, items) {
  try {
    const keurmeesterNaam = (store.settings && store.settings.keurmeester) || '';
    if (!keurmeesterNaam) {
      toast('Geen keurmeester ingesteld — stel eerst in via Instellingen', 'error');
      return;
    }
    if (!_huidigBedrijfId) {
      toast('Geen bedrijf bekend — opnieuw inloggen', 'error');
      return;
    }

    const keuze = document.querySelector('input[name="impKlantKeuze"]:checked')?.value;
    const keuringDatum  = document.getElementById('importDatum').value || new Date().toISOString().split('T')[0];
    const keuringCertNr = document.getElementById('importCertNr').value || '';

    let klant = null;

    if (keuze === 'bestaand') {
      const eigenaarLower = (eigenaarUitExcel || '').toLowerCase().trim();
      klant = (store.klanten || []).find(
        k => (k.bedrijf || '').toLowerCase().trim() === eigenaarLower
      );
      if (!klant) { toast('Bestaande klant niet meer gevonden', 'error'); return; }

    } else if (keuze === 'handmatig') {
      const klantId = document.getElementById('impKlantHandmatig').value;
      if (!klantId) { toast('Kies eerst een klant uit de lijst', 'error'); return; }
      klant = (store.klanten || []).find(k => k.id === klantId);
      if (!klant) { toast('Gekozen klant niet gevonden', 'error'); return; }

    } else if (keuze === 'nieuw') {
      const naam = (document.getElementById('impKlantNieuwNaam')?.value || '').trim();
      if (!naam) { toast('Vul een bedrijfsnaam in voor de nieuwe klant', 'error'); return; }

      const naamLower = naam.toLowerCase();
      const duplicaat = (store.klanten || []).find(
        k => (k.bedrijf || '').toLowerCase().trim() === naamLower
      );
      if (duplicaat) {
        const kies = confirm(
          `Er bestaat al een klant met de naam "${duplicaat.bedrijf}".\n\n` +
          `OK = bestaande klant gebruiken\n` +
          `Annuleren = stoppen`
        );
        if (!kies) return;
        klant = duplicaat;
      } else {
        const nieuweKlant = {
          id: generateId(),
          bedrijf: naam,
          contactpersoon: '',
          klantnummer: '',
          telefoon: '',
          email: '',
          straat: '',
          huisnummer: '',
          postcode: '',
          plaats: '',
          land: 'Nederland',
          adres: '',
          opmerkingen: 'Aangemaakt via certificaat-import',
          auth_user_id: null,
        };
        try {
          await sbUpsertKlant(nieuweKlant);
        } catch (err) {
          console.error('sbUpsertKlant fout:', err);
          toast('Klant kon niet worden opgeslagen — import geannuleerd', 'error');
          return;
        }
        store.klanten.push(nieuweKlant);
        klant = nieuweKlant;
      }

    } else {
      toast('Maak eerst een keuze hoe de klant gekoppeld moet worden', 'error');
      return;
    }

    const keuring = {
      id:            generateId(),
      datum:         keuringDatum,
      certificaatNr: keuringCertNr,
      klantId:       klant.id,
      klantNaam:     klant.bedrijf,
      keurmeester:   keurmeesterNaam,
      opmerkingen:   'Geïmporteerd uit Excel',
      items:         items.map(i => ({ ...i, id: i.id || generateId() })),
      afgerond:      true,
    };

    try {
      await sbUpsertKeuring(keuring);
    } catch (err) {
      console.error('sbUpsertKeuring fout:', err);
      toast('Keuring kon niet worden opgeslagen — import geannuleerd', 'error');
      return;
    }

    try {
      await sbSyncAllKeuringItems(keuring);
    } catch (err) {
      console.error('sbSyncAllKeuringItems fout:', err);
      toast('Items konden niet worden opgeslagen — zie console', 'warning', 6000);
    }

    store.keuringen.push(keuring);
    saveStore(store);

    closeModal();
    toast(`Certificaat geïmporteerd: ${keuring.items.length} items voor ${klant.bedrijf}`, 'success');
    navigateTo('keuringen');

  } catch (err) {
    console.error('Certificaat import onverwachte fout:', err);
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
  const s = store.settings;
  const rows = [];

  rows.push(['Keuringsdatum:', k.datum, '', 'KEURINGS-CERTIFICAAT', '', '', '', 'Certificaatnummer:', k.certificaatNr]);
  rows.push([]);
  rows.push(['', s.bedrijfsnaam || 'Safety Green B.V.']);
  rows.push(['Eigenaar materialen:', k.klantNaam]);
  rows.push([]);
  rows.push([s.certificaatTekst || '']);
  rows.push([]);
  rows.push([]);

  rows.push(['Afkeurcodes:']);
  getAfkeurcodes().forEach(c => {
    rows.push(['', c.code, c.tekst]);
  });
  rows.push([]);

  rows.push(['Omschrijving', 'Merk', 'Materiaal', 'Serie nummer', 'Fabr. Jaar', 'Fabr. Maand', 'Goed', 'Afkeur', 'Opmerking', 'Gebruiker']);

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

  rows.push([]);
  rows.push(['Eigenaar materiaal:', k.klantNaam]);
  rows.push(['Certificaatnummer:', k.certificaatNr]);
  rows.push(['Gekeurd door:', k.keurmeester]);
  rows.push(['Keuringsdatum:', k.datum]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
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
// EXCEL EXPORT — Producten van een specifiek bedrijf (admin)
// ============================================================
// Haalt producten direct uit Supabase (niet uit lokale store, want
// de lokale store bevat alleen producten van het ingelogde bedrijf).
async function exportProductenVoorBedrijf(bedrijfId, bedrijfNaam) {
  if (!bedrijfId) { toast('Geen bedrijf opgegeven', 'error'); return; }

  try {
    const { data, error } = await sb
      .from('producten')
      .select('*')
      .eq('bedrijf_id', bedrijfId)
      .order('omschrijving', { ascending: true });

    if (error) { toast('Fout bij ophalen producten: ' + error.message, 'error'); return; }
    if (!data || data.length === 0) {
      toast(`${bedrijfNaam} heeft nog geen producten in de database`, 'warning');
      return;
    }

    const wb = XLSX.utils.book_new();
    const headers = ['Omschrijving','Merk','Materiaal','Bijzonderheden','Max Leeftijd','Max USE','Max MFR','EN-Norm','Breuksterkte','Handleiding'];
    const rows = [headers];
    data.forEach(p => {
      rows.push([
        p.omschrijving || '',
        p.merk || '',
        p.materiaal || '',
        p.bijzonderheden || '',
        p.max_leeftijd || '',
        p.max_leeftijd_use || '',
        p.max_leeftijd_mfr || '',
        p.norm || '',
        p.breuksterkte || '',
        p.handleiding || ''
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{wch:30},{wch:16},{wch:18},{wch:20},{wch:12},{wch:10},{wch:10},{wch:18},{wch:12},{wch:40}];
    XLSX.utils.book_append_sheet(wb, ws, 'Producten');

    const veiligeBedrijfNaam = String(bedrijfNaam).replace(/[^a-zA-Z0-9_-]/g, '_');
    XLSX.writeFile(wb, `Producten_${veiligeBedrijfNaam}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast(`${data.length} producten van ${bedrijfNaam} geëxporteerd`);

  } catch (err) {
    console.error('exportProductenVoorBedrijf fout:', err);
    toast('Onverwachte fout: ' + err.message, 'error');
  }
}

// ============================================================
// EXCEL IMPORT — Producten (eigen bedrijf, voor keurmeester/admin)
// ============================================================
function importKlantJSON(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);

      if (!data._format || !data._format.startsWith('klimkeur-aanmelding')) {
        if (!data.items || !Array.isArray(data.items)) {
          toast('Ongeldig bestandsformaat — geen KlimKeur aanmelding herkend', 'error');
          return;
        }
      }

      function escHtml(s) {
        return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }

      function normaliseerNaam(n) {
        if (!n) return '';
        return n.trim().replace(/\s+/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }

      const klantNaamRaw = data.klant?.naam || data.klantNaam || '';
      const klantNaam = normaliseerNaam(klantNaamRaw) || 'Onbekend';
      const klantId = data.klant?.id || '';
      const items = data.items || [];

      let importSortCol = 'gebruiker';
      let importSortDir = 1;

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

          const year = datum.split('-')[0];
          const existing = store.keuringen.filter(k => k.certificaatNr?.startsWith(year)).length;
          const certNr = `${year}-${String(existing + 1).padStart(3, '0')}`;

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

// ============================================================
// EXCEL IMPORT — Producten (eigen bedrijf via Instellingen)
// ============================================================
function importProductenExcel(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      _verwerkProductenExcelImport(e.target.result, _huidigBedrijfId, store.settings.bedrijfsnaam || 'eigen bedrijf', /*isAdminVoorAnderBedrijf=*/false);
    } catch(err) {
      toast('Fout bij importeren: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
  input.value = '';
}

// ============================================================
// EXCEL IMPORT — Producten voor een specifiek bedrijf (admin)
// ============================================================
// Wordt aangeroepen vanuit het bedrijf-modal in bedrijven.js.
// Schrijft producten naar de opgegeven bedrijf_id i.p.v. de
// ingelogde gebruiker. Werkt alleen voor platform-admins.
function importProductenExcelVoorBedrijf(input, bedrijfId, bedrijfNaam) {
  if (!_isPlatformAdmin) {
    toast('Alleen platform-beheerders kunnen producten voor andere bedrijven importeren', 'error');
    return;
  }
  if (!bedrijfId) { toast('Geen bedrijf opgegeven', 'error'); return; }

  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      _verwerkProductenExcelImport(e.target.result, bedrijfId, bedrijfNaam, /*isAdminVoorAnderBedrijf=*/true);
    } catch(err) {
      toast('Fout bij importeren: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
  input.value = '';
}

// ============================================================
// GEDEELDE PRODUCT-IMPORT LOGICA
// ============================================================
// Eén functie voor zowel "eigen import" (importProductenExcel)
// als "admin importeert voor ander bedrijf" (importProductenExcelVoorBedrijf).
// Het bedrijfId bepaalt waar de producten naartoe gaan.
async function _verwerkProductenExcelImport(arrayBuffer, bedrijfId, bedrijfNaam, isAdminVoorAnderBedrijf) {
  if (!bedrijfId) { toast('Geen bedrijf bekend — opnieuw inloggen', 'error'); return; }

  const wb = XLSX.read(arrayBuffer, { type: 'array' });

  // Smart sheet selection: prefer 'Bronlijst', or find sheet with 'Omschrijving' column
  let sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('bronlijst'));
  if (!sheetName) {
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

  // Detect header row
  let headerIdx = -1;
  let headerRow = [];
  for (let tryR = 0; tryR < Math.min(20, rows.length); tryR++) {
    const tryH = rows[tryR].map(h => String(h).toLowerCase().trim());
    if (tryH.some(h => h === 'omschrijving')) { headerIdx = tryR; headerRow = tryH; break; }
  }
  if (headerIdx < 0) {
    for (let tryR = 0; tryR < Math.min(20, rows.length); tryR++) {
      const tryH = rows[tryR].map(h => String(h).toLowerCase().trim());
      if (tryH.some(h => h.includes('omschrijving'))) { headerIdx = tryR; headerRow = tryH; break; }
    }
  }
  if (headerIdx < 0) { toast('Kolom "Omschrijving" niet gevonden in de eerste 20 rijen.', 'error'); return; }

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
    const merk = iMerk >= 0 ? String(row[iMerk]||'').trim() : '';
    if (iMerk >= 0 && !merk && iMat >= 0 && !String(row[iMat]||'').trim()) continue;

    let handVal = iHand >= 0 ? String(row[iHand]||'').trim() : '';
    let linkVal = iLink >= 0 ? String(row[iLink]||'').trim() : '';
    if (handVal && !handVal.startsWith('http') && !handVal.startsWith('file:') && handVal.endsWith('.pdf')) {
      handVal = PCLOUD_BASE + handVal;
    }
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

  // Tel huidige producten van DIT bedrijf in Supabase
  let huidigAantal = 0;
  try {
    const { count, error: countErr } = await sb
      .from('producten')
      .select('id', { count: 'exact', head: true })
      .eq('bedrijf_id', bedrijfId);
    if (!countErr && typeof count === 'number') huidigAantal = count;
  } catch (e) {
    console.warn('Kon huidig aantal niet bepalen:', e);
  }

  // Veiligheidswaarschuwing als het nieuwe aantal véél kleiner is
  let extraWaarschuwing = '';
  if (huidigAantal > 50 && nieuweProducten.length < huidigAantal / 3) {
    extraWaarschuwing =
      `\n\n⚠ LET OP: de nieuwe Excel bevat veel minder producten dan de huidige database ` +
      `(${nieuweProducten.length} vs ${huidigAantal}).\n` +
      `Controleer of dit klopt — mogelijk is er een fout in het Excel-bestand.`;
  }

  const bevestigingsTekst =
    `Productdatabase voor "${bedrijfNaam}" vervangen?\n\n` +
    `• Huidig: ${huidigAantal} producten\n` +
    `• Nieuw:  ${nieuweProducten.length} producten (uit Excel)\n\n` +
    `Alle huidige producten van dit bedrijf worden verwijderd en vervangen door de nieuwe set.\n` +
    `Dit kan niet ongedaan worden gemaakt.` +
    extraWaarschuwing;

  if (!confirm(bevestigingsTekst)) return;

  // Bouw rijen voor Supabase
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
    bedrijf_id:       bedrijfId,   // ← cruciaal: schrijft naar opgegeven bedrijf
  }));

  try {
    // Stap 1: nieuwe producten upserten in batches van 200
    const BATCH = 200;
    for (let i = 0; i < sbProductRows.length; i += BATCH) {
      const batch = sbProductRows.slice(i, i + BATCH);
      const { error } = await sb.from('producten').upsert(batch, { onConflict: 'id' });
      if (error) throw error;
    }

    // Stap 2: oude producten van DIT bedrijf opruimen die niet in de
    // nieuwe import voorkomen. Eerst ophalen welke er nu staan.
    const nieuweIds = sbProductRows.map(r => r.id);

    const { data: huidigeRows, error: selErr } = await sb
      .from('producten')
      .select('id')
      .eq('bedrijf_id', bedrijfId);

    if (selErr) {
      console.error('Ophalen huidige producten mislukt:', selErr);
      toast('Import gelukt, opruimen mislukt — controleer database', 'warning');
    } else {
      const teVerwijderen = (huidigeRows || [])
        .map(r => r.id)
        .filter(id => !nieuweIds.includes(id));

      if (teVerwijderen.length > 0) {
        const { error: delErr } = await sb.from('producten')
          .delete()
          .eq('bedrijf_id', bedrijfId)
          .in('id', teVerwijderen);
        if (delErr) {
          console.error('Opruimen oude producten mislukt:', delErr);
          toast('Import gelukt, opruimen oude producten mislukt', 'warning');
        }
      }
    }

    // Stap 3: lokale store alleen bijwerken als we voor het EIGEN bedrijf importeerden
    if (!isAdminVoorAnderBedrijf) {
      store.products = nieuweMetId;
      saveStore(store);
      toast(`${nieuweMetId.length} producten geïmporteerd en opgeslagen`);
      navigateTo('producten');
    } else {
      toast(`${nieuweMetId.length} producten geïmporteerd voor ${bedrijfNaam}`);
    }

  } catch (err) {
    console.error('Supabase product import fout:', err);
    toast('Import mislukt: ' + (err.message || 'onbekende fout') + ' — bestaande producten zijn NIET gewijzigd', 'error', 6000);
  }
}

// ============================================================
// EXCEL EXPORT — Klanten + Klant App
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
