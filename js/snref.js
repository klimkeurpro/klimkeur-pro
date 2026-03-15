// ============================================================
// snref.js — serienummer zoeken, recall zoeken, SN referentie
// ============================================================

function renderRecallZoeken(el) {
  // Collect unique merken from all keuringen items
  const allMerken = new Set();
  const allOmschrijvingen = new Set();
  for (const k of store.keuringen) {
    for (const item of (k.items || [])) {
      if (item.merk) allMerken.add(item.merk);
      if (item.omschrijving) allOmschrijvingen.add(item.omschrijving);
    }
  }
  const merkenSorted = [...allMerken].sort((a,b) => a.localeCompare(b));

  el.innerHTML = `
    <div class="fade-in">
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><h3>🔔 Recall / Terugroepactie Zoeken</h3></div>
        <div class="card-body" style="padding:20px;">
          <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">
            Zoek producten die onder een recall of terugroepactie vallen. Filter op merk, product(naam), en fabricagedatum.
            Handig voor bijv. Petzl Astro recall (alle harnassen vóór oktober 2023).
          </p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">Merk</label>
              <select id="recallMerk" style="width:100%;padding:10px;font-size:14px;background:var(--bg-input);color:var(--text);border:1px solid var(--border);border-radius:var(--radius);">
                <option value="">-- Alle merken --</option>
                ${merkenSorted.map(m => `<option value="${m}">${m}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">Product (naam of deel)</label>
              <input type="text" id="recallProduct" placeholder="bijv. Astro, Vertex, Vesper..." style="width:100%;padding:10px;font-size:14px;background:var(--bg-input);color:var(--text);border:1px solid var(--border);border-radius:var(--radius);box-sizing:border-box;">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">Fabricage vóór (jaar)</label>
              <input type="number" id="recallVoorJaar" placeholder="bijv. 2023" min="1990" max="2099" style="width:100%;padding:10px;font-size:14px;background:var(--bg-input);color:var(--text);border:1px solid var(--border);border-radius:var(--radius);box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">Fabricage vóór (maand)</label>
              <select id="recallVoorMaand" style="width:100%;padding:10px;font-size:14px;background:var(--bg-input);color:var(--text);border:1px solid var(--border);border-radius:var(--radius);">
                <option value="">-- Heel jaar --</option>
                <option value="1">Januari</option><option value="2">Februari</option><option value="3">Maart</option>
                <option value="4">April</option><option value="5">Mei</option><option value="6">Juni</option>
                <option value="7">Juli</option><option value="8">Augustus</option><option value="9">September</option>
                <option value="10">Oktober</option><option value="11">November</option><option value="12">December</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">Fabricage vanaf (jaar, optioneel)</label>
              <input type="number" id="recallVanafJaar" placeholder="bijv. 2020" min="1990" max="2099" style="width:100%;padding:10px;font-size:14px;background:var(--bg-input);color:var(--text);border:1px solid var(--border);border-radius:var(--radius);box-sizing:border-box;">
            </div>
          </div>

          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="doRecallZoeken()" style="padding:10px 24px;font-size:14px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Zoek recall producten
            </button>
            <button class="btn btn-sm" onclick="exportRecallCSV()" id="recallExportBtn" style="display:none;">↓ Exporteer lijst (CSV)</button>
            <span id="recallCount" style="font-size:13px;color:var(--text-muted);"></span>
          </div>
        </div>
      </div>

      <div id="recallSortBar" style="display:none;margin-bottom:8px;padding:8px 12px;background:var(--bg-card);border-radius:var(--radius);border:1px solid var(--border);">
        <span style="font-size:12px;color:var(--text-muted);margin-right:12px;">Sorteer:</span>
        <button class="btn btn-sm" onclick="sortRecall('omschrijving')" style="font-size:11px;padding:4px 8px;">A-Z Product</button>
        <button class="btn btn-sm" onclick="sortRecall('merk')" style="font-size:11px;padding:4px 8px;">A-Z Merk</button>
        <button class="btn btn-sm" onclick="sortRecall('fabrJaar')" style="font-size:11px;padding:4px 8px;">Fabricage ↑</button>
        <button class="btn btn-sm" onclick="sortRecall('fabrJaarDesc')" style="font-size:11px;padding:4px 8px;">Fabricage ↓</button>
        <button class="btn btn-sm" onclick="sortRecall('klant')" style="font-size:11px;padding:4px 8px;">A-Z Klant</button>
        <button class="btn btn-sm" onclick="sortRecall('datum')" style="font-size:11px;padding:4px 8px;">Keuring ↓</button>
      </div>

      <div id="recallResultaten"></div>
    </div>
  `;
}

// Store recall results for sorting/export
window._recallResults = [];
window._recallSortCol = 'fabrJaar';

function doRecallZoeken() {
  const merk = document.getElementById('recallMerk').value.trim();
  const productQ = document.getElementById('recallProduct').value.trim().toLowerCase();
  const voorJaar = parseInt(document.getElementById('recallVoorJaar').value) || 0;
  const voorMaand = parseInt(document.getElementById('recallVoorMaand').value) || 0;
  const vanafJaar = parseInt(document.getElementById('recallVanafJaar').value) || 0;

  if (!merk && !productQ && !voorJaar) {
    toast('Vul minimaal een merk, productnaam of fabricagejaar in', 'error');
    return;
  }

  const results = [];
  for (const keuring of store.keuringen) {
    for (const item of (keuring.items || [])) {
      // Filter: merk
      if (merk && (item.merk || '').toLowerCase() !== merk.toLowerCase()) continue;

      // Filter: productnaam (deel van omschrijving)
      if (productQ && !(item.omschrijving || '').toLowerCase().includes(productQ)) continue;

      // Filter: fabricage vóór datum
      if (voorJaar) {
        const ij = parseInt(item.fabrJaar);
        if (!ij) continue; // skip items without fabricage jaar
        const im = parseInt(item.fabrMaand) || 0;

        if (voorMaand) {
          // Vergelijk jaar+maand: item moet VOOR voorJaar/voorMaand zijn
          const itemVal = ij * 100 + (im || 12); // als geen maand bekend, neem einde jaar
          const filterVal = voorJaar * 100 + voorMaand;
          if (itemVal >= filterVal) continue;
        } else {
          // Alleen jaar: item fabricagejaar moet <= voorJaar zijn
          if (ij > voorJaar) continue;
        }
      }

      // Filter: fabricage vanaf jaar (optioneel)
      if (vanafJaar) {
        const ij = parseInt(item.fabrJaar);
        if (!ij || ij < vanafJaar) continue;
      }

      results.push({
        omschrijving: item.omschrijving || '?',
        merk: item.merk || '',
        serienummer: item.serienummer || '',
        fabrJaar: item.fabrJaar || '',
        fabrMaand: item.fabrMaand || '',
        gebruiker: item.gebruiker || '',
        inGebruik: item.inGebruik || '',
        status: item.status || '',
        klantNaam: keuring.klantNaam || 'Onbekend',
        klantId: keuring.klantId || '',
        keuringDatum: keuring.datum || '',
        certificaatNr: keuring.certificaatNr || '',
        keuringId: keuring.id,
      });
    }
  }

  window._recallResults = results;
  window._recallSortCol = 'fabrJaar';
  renderRecallResultaten();
}

function sortRecall(col) {
  window._recallSortCol = col;
  renderRecallResultaten();
}

function renderRecallResultaten() {
  const results = [...window._recallResults];
  const col = window._recallSortCol;
  const container = document.getElementById('recallResultaten');
  const countEl = document.getElementById('recallCount');
  const sortBar = document.getElementById('recallSortBar');
  const exportBtn = document.getElementById('recallExportBtn');

  if (results.length === 0) {
    container.innerHTML = `
      <div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-muted);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:12px;opacity:0.4;">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div style="font-size:15px;">Geen producten gevonden</div>
        <div style="font-size:13px;margin-top:4px;">Pas de filters aan en probeer opnieuw.</div>
      </div></div>`;
    sortBar.style.display = 'none';
    exportBtn.style.display = 'none';
    countEl.textContent = '0 resultaten';
    return;
  }

  // Sort
  results.sort((a, b) => {
    switch(col) {
      case 'omschrijving': return (a.omschrijving).localeCompare(b.omschrijving);
      case 'merk': return (a.merk).localeCompare(b.merk) || (a.omschrijving).localeCompare(b.omschrijving);
      case 'fabrJaar': return (parseInt(a.fabrJaar)||9999) - (parseInt(b.fabrJaar)||9999);
      case 'fabrJaarDesc': return (parseInt(b.fabrJaar)||0) - (parseInt(a.fabrJaar)||0);
      case 'klant': return (a.klantNaam).localeCompare(b.klantNaam);
      case 'datum': return (b.keuringDatum||'').localeCompare(a.keuringDatum||'');
      default: return 0;
    }
  });

  // Unique klanten count
  const uniqKlanten = new Set(results.map(r => r.klantId || r.klantNaam));

  sortBar.style.display = 'block';
  exportBtn.style.display = 'inline-flex';
  countEl.innerHTML = `<strong>${results.length}</strong> product${results.length!==1?'en':''} bij <strong>${uniqKlanten.size}</strong> klant${uniqKlanten.size!==1?'en':''}`;

  container.innerHTML = `
    <div class="table-scroll" style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th style="cursor:pointer;" onclick="sortRecall('omschrijving')">Product</th>
            <th style="cursor:pointer;" onclick="sortRecall('merk')">Merk</th>
            <th>Serienummer</th>
            <th style="cursor:pointer;" onclick="sortRecall('fabrJaar')">Fabricage</th>
            <th>Gebruiker</th>
            <th style="cursor:pointer;" onclick="sortRecall('klant')">Klant</th>
            <th style="cursor:pointer;" onclick="sortRecall('datum')">Laatste keuring</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(r => {
            const fabrStr = r.fabrJaar ? (r.fabrJaar + (r.fabrMaand ? '/' + String(r.fabrMaand).padStart(2,'0') : '')) : '?';
            const statusBadge = r.status === 'goedgekeurd'
              ? '<span class="badge badge-green" style="font-size:11px;">OK</span>'
              : r.status === 'afgekeurd'
                ? '<span class="badge badge-red" style="font-size:11px;">Afg.</span>'
                : '<span class="badge badge-orange" style="font-size:11px;">?</span>';
            return `<tr>
              <td style="font-weight:600;">${r.omschrijving}</td>
              <td>${r.merk}</td>
              <td style="font-family:monospace;font-size:12px;">${r.serienummer || '—'}</td>
              <td style="font-weight:600;color:var(--warning);">${fabrStr}</td>
              <td style="font-size:12px;">${r.gebruiker || '—'}</td>
              <td><a href="#" onclick="event.preventDefault();navigateTo('keuringen');setTimeout(()=>{const el=document.querySelector('[data-keuring-id=&quot;${r.keuringId}&quot;]');if(el)el.click();},100);" style="color:var(--sg-green);">${r.klantNaam}</a></td>
              <td style="font-size:12px;">${r.keuringDatum ? formatDate(r.keuringDatum) : '—'}</td>
              <td>${statusBadge}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function exportRecallCSV() {
  const results = window._recallResults || [];
  if (results.length === 0) return;
  const header = 'Product;Merk;Serienummer;FabricageJaar;FabricageMaand;Gebruiker;Klant;LaatsteKeuring;Status';
  const rows = results.map(r =>
    [r.omschrijving, r.merk, r.serienummer, r.fabrJaar, r.fabrMaand, r.gebruiker, r.klantNaam, r.keuringDatum, r.status]
      .map(v => '"' + String(v||'').replace(/"/g,'""') + '"').join(';')
  );
  const csv = '\uFEFF' + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recall_resultaten_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV geëxporteerd', 'success');
}

// SN ZOEKEN - zoek op serienummer door alle keuringen
// ============================================================
function renderSNZoeken(el) {
  el.innerHTML = `
    <div class="fade-in">
      <div class="card" style="margin-bottom:20px;">
        <div class="card-body" style="padding:20px;">
          <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">
            Zoek op (deel van) een serienummer om de eigenaar, keuring en status te vinden.
            Handig bij verlies, diefstal, of een pakketje zonder afzender.
          </p>
          <div class="search-box" style="max-width:100%;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="snZoekenInput" placeholder="Typ serienummer of deel ervan..." oninput="doSNZoeken(this.value)" autofocus style="font-size:16px;padding:12px;">
          </div>
        </div>
      </div>
      <div id="snZoekenResultaten"></div>
    </div>
  `;
}

function doSNZoeken(query) {
  const container = document.getElementById('snZoekenResultaten');
  if (!container) return;
  const q = query.trim().toLowerCase();

  if (q.length < 2) {
    container.innerHTML = q.length > 0
      ? '<p style="color:var(--text-muted);text-align:center;padding:20px;">Typ minimaal 2 tekens...</p>'
      : '';
    return;
  }

  // Search through all keuringen items
  const results = [];
  for (const keuring of store.keuringen) {
    for (const item of (keuring.items || [])) {
      if (item.serienummer && item.serienummer.toLowerCase().includes(q)) {
        results.push({
          ...item,
          klantNaam: keuring.klantNaam,
          klantId: keuring.klantId,
          keuringDatum: keuring.datum,
          keuringCertNr: keuring.certificaatNr,
          keuringId: keuring.id,
          keurmeester: keuring.keurmeester,
          afgerond: keuring.afgerond,
        });
      }
    }
  }

  if (results.length === 0) {
    container.innerHTML = `
      <div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-muted);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:12px;opacity:0.4;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <div style="font-size:15px;">Geen resultaten voor "${query}"</div>
        <div style="font-size:13px;margin-top:4px;">Controleer het serienummer en probeer opnieuw.</div>
      </div></div>`;
    return;
  }

  // Group by serienummer
  const grouped = {};
  for (const r of results) {
    const key = r.serienummer;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  container.innerHTML = `
    <div style="margin-bottom:12px;color:var(--text-secondary);font-size:13px;">
      <strong>${results.length}</strong> resultaat${results.length!==1?'en':''} gevonden voor "${query}" in <strong>${Object.keys(grouped).length}</strong> uniek${Object.keys(grouped).length!==1?'e':''} serienummer${Object.keys(grouped).length!==1?'s':''}
    </div>
    ${Object.entries(grouped).map(([sn, items]) => {
      // Sort by date newest first
      items.sort((a, b) => (b.keuringDatum||'').localeCompare(a.keuringDatum||''));
      const latest = items[0];
      const statusBadge = latest.status === 'goedgekeurd'
        ? '<span class="badge badge-green">Goedgekeurd</span>'
        : latest.status === 'afgekeurd'
          ? '<span class="badge badge-red">Afgekeurd</span>'
          : '<span class="badge badge-orange">Onbeoordeeld</span>';

      return `
        <div class="card" style="margin-bottom:12px;">
          <div class="card-body" style="padding:16px 20px;">
            <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
              <div>
                <div style="font-family:monospace;font-size:18px;font-weight:700;color:var(--sg-lime);letter-spacing:1px;">${sn}</div>
                <div style="font-size:15px;margin-top:4px;font-weight:600;">${latest.omschrijving||''}</div>
                <div style="font-size:13px;color:var(--text-secondary);">${latest.merk||''} ${latest.materiaal ? '— ' + latest.materiaal : ''}</div>
              </div>
              <div style="text-align:right;">
                ${statusBadge}
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Laatste keuring</div>
              </div>
            </div>

            <div style="background:var(--bg-input);border-radius:var(--radius);padding:12px;margin-top:8px;">
              <div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;font-weight:600;">Keuringshistorie (${items.length})</div>
              ${items.map(r => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;gap:8px;" class="clickable" onclick="navigateTo('keuringen');setTimeout(()=>openKeuringDetail('${r.keuringId}'),50)">
                  <div>
                    <strong style="color:var(--text-primary);">${r.klantNaam||'Onbekend'}</strong>
                    <span style="color:var(--text-muted);margin-left:8px;">${r.keuringCertNr||''}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="color:var(--text-muted);font-size:12px;">${r.keurmeester||''}</span>
                    <span>${r.status === 'goedgekeurd' ? '<span class="badge badge-green" style="font-size:10px;">Goed</span>' : r.status === 'afgekeurd' ? '<span class="badge badge-red" style="font-size:10px;">Afkeur' + (r.afkeurcode ? ' ' + r.afkeurcode : '') + '</span>' : '<span class="badge badge-orange" style="font-size:10px;">Open</span>'}</span>
                    <span style="color:var(--text-secondary);font-size:12px;min-width:80px;text-align:right;">${formatDate(r.keuringDatum)}</span>
                  </div>
                </div>
              `).join('')}
            </div>

            ${latest.gebruiker ? `<div style="font-size:12px;color:var(--text-muted);margin-top:8px;">Gebruiker: <strong>${latest.gebruiker}</strong></div>` : ''}
            ${latest.fabrJaar ? `<div style="font-size:12px;color:var(--text-muted);">Fabricage: ${latest.fabrJaar}${latest.fabrMaand ? ' — ' + MAANDEN[latest.fabrMaand] : ''}</div>` : ''}
          </div>
        </div>`;
    }).join('')}
  `;
}

// ============================================================
// SN REFERENTIE
// ============================================================
function renderSNRef(el) {
  const snItems = store.snData || SN_DATA;
  el.innerHTML = `
    <div class="fade-in">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div>
          <p style="color:var(--text-secondary);font-size:14px;margin:0;">
            Spiekbriefje voor het aflezen van serienummers per merk.
            <br><em style="font-size:12px;">Y=Jaar, M=Maand, D=Dag, W=Week, x=overig cijfer, #=letter</em>
          </p>
        </div>
        <button class="btn btn-primary" onclick="openSNModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Toevoegen
        </button>
      </div>
      <div class="sn-grid">
        ${snItems.map((s, i) => `
          <div class="sn-card">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div class="sn-card-merk">${s.merk}</div>
              <div style="display:flex;gap:4px;">
                <button class="btn-icon" title="Bewerken" onclick="openSNModal(${i})">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon" title="Verwijderen" onclick="deleteSN(${i})">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div class="sn-card-row">Voorbeeld: <span>${s.voorbeeld}</span></div>
            <div class="sn-card-row">Formaat: <span>${s.formaat}</span></div>
            ${s.opmerking ? `<div class="sn-card-row">Opmerking: <span style="color:var(--warning);">${s.opmerking}</span></div>` : ''}
            ${s.link ? `<div class="sn-card-row"><a href="${s.link.startsWith('http')?s.link:'#'}" target="_blank" style="color:var(--sg-green);font-size:12px;">${s.link.startsWith('http')?'Handleiding link':s.link}</a></div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openSNModal(idx) {
  const snItems = store.snData || [];
  const s = idx !== undefined ? snItems[idx] : null;
  showModal(s ? 'SN Kaart Bewerken' : 'Nieuwe SN Kaart', `
    <input type="hidden" id="snIdx" value="${idx !== undefined ? idx : -1}">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Merk</label>
        <input class="form-input" id="snMerk" value="${s?.merk || ''}" placeholder="Merknaam">
      </div>
      <div class="form-group">
        <label class="form-label">Voorbeeld Serienummer</label>
        <input class="form-input" id="snVoorbeeld" value="${s?.voorbeeld || ''}" placeholder="bijv. 18E45654123">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Formaat</label>
        <input class="form-input" id="snFormaat" value="${s?.formaat || ''}" placeholder="bijv. YYMxxxxxx">
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Y=Jaar, M=Maand, D=Dag, W=Week, x=overig cijfer, #=letter</div>
      </div>
      <div class="form-group">
        <label class="form-label">Link / Handleiding</label>
        <input class="form-input" id="snLink" value="${s?.link || ''}" placeholder="URL of bestandsnaam">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Opmerking (optioneel)</label>
      <input class="form-input" id="snOpmerking" value="${s?.opmerking || ''}" placeholder="Extra toelichting">
    </div>
  `, () => {
    const i = parseInt(document.getElementById('snIdx').value);
    const data = {
      merk: document.getElementById('snMerk').value,
      voorbeeld: document.getElementById('snVoorbeeld').value,
      formaat: document.getElementById('snFormaat').value,
      link: document.getElementById('snLink').value,
      opmerking: document.getElementById('snOpmerking').value,
    };
    if (!data.merk) { toast('Vul een merknaam in', 'error'); return; }
    if (!store.snData) store.snData = JSON.parse(JSON.stringify(SN_DATA));
    if (i >= 0) store.snData[i] = data;
    else store.snData.push(data);
    saveStore(store);
    sbSaveSnData(store.snData).catch(console.error);
    closeModal();
    toast(i >= 0 ? 'SN kaart bijgewerkt' : 'SN kaart toegevoegd');
    renderSNRef(document.getElementById('pageContent'));
  });
}

function deleteSN(idx) {
  if (!confirm('Weet je zeker dat je deze SN kaart wilt verwijderen?')) return;
  if (!store.snData) store.snData = JSON.parse(JSON.stringify(SN_DATA));
  store.snData.splice(idx, 1);
  saveStore(store);
  sbSaveSnData(store.snData).catch(console.error);
  toast('SN kaart verwijderd');
  renderSNRef(document.getElementById('pageContent'));
}

// ============================================================
// INSTELLINGEN
// ============================================================
