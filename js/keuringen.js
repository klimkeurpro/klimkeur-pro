// ============================================================
// keuringen.js — keuringen aanmaken, items beheren, beoordelen, afkeurcodes
//
// ARTIKEL_ID FIX:
// Items hebben nu twee ID's (zie store.js):
//   - rowId   = uniek per database-rij
//   - itemId  = persistent per fysiek artikel (= artikel_id in DB)
//
// Gewijzigde plekken t.o.v. origineel staan gemarkeerd met:
//   // ── ARTIKEL_ID FIX ──
//
// DB-VERVUILING FIX (v4):
// finishKeuring() ruimt bij afronden alle onaangeraakte items op
// via sbDeleteOnaangeraakteItems() in store.js. Zo blijven er geen
// lege rijen van overgenomen-maar-nooit-beoordeelde items achter.
// ============================================================

// Lokale HTML escape — voorkomt dat user-data uit HTML-attributen breekt
function escKr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Afgevoerde item-IDs opgehaald uit Supabase — gevuld in checkVorigeKeuring()
let _afgevoerdeItemIds = new Set();

// Zoekterm in keuringsdetail — bewaard zodat herrender na beoordeling de zoekterm niet kwijtraakt
let _keuringItemZoek = '';

function renderKeuringen(el) {
  _keuringItemZoek = ''; // reset zoekterm bij teruggaan naar overzicht
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;" class="fade-in">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="keuringSearch" placeholder="Zoek keuring..." oninput="filterKeuringenTable(this.value)">
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn" onclick="document.getElementById('keuringImportFile').click()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Importeer Excel
        </button>
        <input type="file" id="keuringImportFile" accept=".xlsx,.xls" style="display:none" onchange="importCertificaatExcel(this)">
        <button class="btn btn-primary" onclick="openKeuringModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nieuwe Keuring
        </button>
      </div>
    </div>
    <div class="card fade-in">
      <div class="table-container" style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <table style="min-width:650px;">
          <thead><tr>
            <th>Datum</th><th>Klant</th><th>Certificaat Nr.</th><th>Items</th><th>Goed</th><th>Afgekeurd</th><th>Status</th><th></th>
          </tr></thead>
          <tbody id="keuringenTableBody">
            ${renderKeuringenRows(store.keuringen)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderKeuringenRows(keuringen) {
  if (keuringen.length === 0) return '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px;">Nog geen keuringen. Start een nieuwe keuring of importeer een Excel.</td></tr>';
  return keuringen.map(k => {
    const goed = (k.items||[]).filter(i=>i.status==='goedgekeurd').length;
    const afk  = (k.items||[]).filter(i=>i.status==='afgekeurd').length;
    // Alleen echte lege items tellen als open (niet pensioen)
    const open = (k.items||[]).filter(i=>!i.status && !i.afgevoerd).length;
    return `<tr class="clickable" onclick="openKeuringDetail('${k.id}')" style="cursor:pointer;">
      <td>${formatDate(k.datum)}</td>
      <td><strong>${escKr(k.klantNaam||'')}</strong></td>
      <td>${escKr(k.certificaatNr||'')}</td>
      <td>${(k.items||[]).length}${open > 0 ? ` <span style="color:var(--warning);font-size:11px;">(${open} open)</span>` : ''}</td>
      <td><span class="badge badge-green">${goed}</span></td>
      <td><span class="badge badge-red">${afk}</span></td>
      <td><span class="badge ${k.afgerond?'badge-green':'badge-orange'}">${k.afgerond?'Afgerond':'Lopend'}</span></td>
      <td onclick="event.stopPropagation()">
        <button class="btn btn-sm btn-danger" onclick="deleteKeuring('${k.id}')">Verwijder</button>
      </td>
    </tr>`;
  }).join('');
}

function filterKeuringenTable(q) {
  const s = q.toLowerCase();
  const filtered = s ? store.keuringen.filter(k =>
    (k.klantNaam||'').toLowerCase().includes(s) ||
    (k.certificaatNr||'').toLowerCase().includes(s) ||
    (k.datum||'').includes(s)
  ) : store.keuringen;
  const tbody = document.getElementById('keuringenTableBody');
  if (tbody) tbody.innerHTML = renderKeuringenRows(filtered);
}

// ============================================================
// ZOEKEN IN KEURINGSITEMS
// ============================================================
function zoekKeuringItems(val) {
  _keuringItemZoek = val.trim().toLowerCase();
  filterKeuringItemsTable();
}

function filterKeuringItemsTable() {
  const q = _keuringItemZoek;
  const zoekInput = document.getElementById('keuringItemZoek');
  if (zoekInput && zoekInput.value !== _keuringItemZoek) zoekInput.value = _keuringItemZoek;

  const tbody = document.querySelector('.keuring-items-tbody');
  if (!tbody) return;

  const rijen = Array.from(tbody.querySelectorAll('tr[data-item-idx]'));
  if (rijen.length === 0) return;

  if (!q) {
    rijen.forEach(r => r.style.display = '');
    const teller = document.getElementById('zoekResultaatTeller');
    if (teller) teller.style.display = 'none';
    return;
  }

  const gescoord = rijen.map(rij => {
    const sn        = (rij.dataset.sort_serienummer || '').toLowerCase();
    const omschr    = (rij.dataset.sort_omschrijving || '').toLowerCase();
    const merk      = (rij.dataset.sort_merk || '').toLowerCase();
    const materiaal = (rij.dataset.sort_materiaal || '').toLowerCase();
    const gebruiker = (rij.dataset.sort_gebruiker || '').toLowerCase();

    let score = 999;
    if (sn === q)                   score = 0;
    else if (sn.endsWith(q))        score = 1;
    else if (sn.includes(q))        score = 2;
    else if (omschr.includes(q))    score = 3;
    else if (merk.includes(q))      score = 4;
    else if (materiaal.includes(q)) score = 5;
    else if (gebruiker.includes(q)) score = 6;

    return { rij, score, zichtbaar: score < 999 };
  });

  let aantalZichtbaar = 0;
  gescoord.forEach(({ rij, zichtbaar }) => {
    rij.style.display = zichtbaar ? '' : 'none';
    if (zichtbaar) aantalZichtbaar++;
  });

  const zichtbareRijen = gescoord
    .filter(g => g.zichtbaar)
    .sort((a, b) => a.score - b.score);
  zichtbareRijen.forEach(({ rij }) => tbody.appendChild(rij));

  const teller = document.getElementById('zoekResultaatTeller');
  if (teller) {
    teller.textContent = aantalZichtbaar === 0
      ? 'Geen resultaten'
      : `${aantalZichtbaar} artikel${aantalZichtbaar !== 1 ? 'en' : ''}`;
    teller.style.display = 'inline';
    teller.style.color = aantalZichtbaar === 0 ? 'var(--danger)' : 'var(--text-muted)';
  }
}

function openKeuringModal() {
  const klantOptions = store.klanten.map(k => `<option value="${escKr(k.id)}">${escKr(k.bedrijf)}</option>`).join('');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCert = todayStr.replace(/-/g, '');

  showModal('Nieuwe Keuring', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Keuringsdatum</label>
        <input class="form-input" type="date" id="keuringDatum" value="${todayStr}" onchange="updateCertNr()">
      </div>
      <div class="form-group">
        <label class="form-label">Certificaatnummer</label>
        <input class="form-input" id="keuringCertNr" value="${todayCert}" placeholder="Wordt automatisch ingevuld">
        <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">Formaat: YYYYMMDD-Klantnaam</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Klant <span style="color:var(--danger);">*</span></label>
        <input class="form-input" id="klantZoek" placeholder="Zoek klant op naam..." oninput="filterKlantDropdown()" autocomplete="off" style="margin-bottom:4px;">
        <select class="form-select" id="keuringKlant" onchange="checkVorigeKeuring();updateCertNr()">
          <option value="">-- Selecteer klant --</option>
          ${klantOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Keurmeester</label>
        <select class="form-select" id="keuringKeurmeester">
          ${(store.keurmeesters||[]).map(k => `<option value="${escKr(k.naam)}" ${k.naam===store.settings.keurmeester?'selected':''}>${escKr(k.naam)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div id="vorigeKeuringBox" style="display:none;margin-bottom:16px;padding:14px;background:rgba(91,154,47,0.1);border:1px solid var(--sg-green);border-radius:var(--radius-lg);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--sg-green);">Vorige keuring gevonden</div>
          <div id="vorigeKeuringInfo" style="font-size:12px;color:var(--text-secondary);margin-top:2px;"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;white-space:nowrap;">
            <input type="checkbox" id="keuringOvernemen" style="accent-color:var(--sg-green);" checked>
            Items overnemen
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;white-space:nowrap;color:var(--text-secondary);">
            <input type="checkbox" id="inclAfgevoerd" style="accent-color:var(--warning);">
            Inclusief afgevoerde artikelen
          </label>
        </div>
      </div>
    </div>

    <div id="aangemeldBox" style="display:none;margin-bottom:16px;padding:14px;background:rgba(243,156,18,0.08);border:1px solid var(--warning);border-radius:var(--radius-lg);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--warning);">Klant heeft materiaal aangemeld</div>
          <div id="aangemeldInfo" style="font-size:12px;color:var(--text-secondary);margin-top:2px;"></div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;white-space:nowrap;">
          <input type="checkbox" id="aangemeldOvernemen" style="accent-color:var(--warning);" checked>
          Ook overnemen
        </label>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Opmerkingen</label>
      <textarea class="form-textarea" id="keuringOpm" placeholder="Eventuele opmerkingen"></textarea>
    </div>
  `, () => {
    const klantId = document.getElementById('keuringKlant').value;
    if (!klantId) {
      document.getElementById('keuringKlant').style.borderColor = 'var(--danger)';
      toast('Selecteer eerst een klant — zonder klant kan geen keuring worden aangemaakt', 'error');
      return;
    }
    const klant = store.klanten.find(k => k.id === klantId);
    const overnemen    = document.getElementById('keuringOvernemen')?.checked;
    const inclAfgevoerd = document.getElementById('inclAfgevoerd')?.checked;

    const keuring = {
      id: generateId(),
      datum: document.getElementById('keuringDatum').value,
      certificaatNr: document.getElementById('keuringCertNr').value,
      klantId: klantId,
      klantNaam: klant?.bedrijf || 'Onbekend',
      keurmeester: document.getElementById('keuringKeurmeester').value,
      opmerkingen: document.getElementById('keuringOpm').value,
      items: [],
      afgerond: false
    };

    // ── ARTIKEL_ID FIX ── Items overnemen uit vorige keuring
    // itemId (artikel-ID) blijft hetzelfde — het is hetzelfde fysieke artikel.
    // rowId wordt gewist zodat sbSyncAllKeuringItems een NIEUWE rij aanmaakt.
    // Zo blijft de oude keuring-rij behouden → historie werkt.
    if (overnemen && klantId) {
      const result = getAllKlantItems(klantId, inclAfgevoerd);
      if (result.items.length > 0) {
        keuring.items = result.items.map(item => ({
          ...item,
          rowId: undefined,   // ← NIEUW: forceer nieuwe database-rij
          status: '',
          afkeurcode: '',
          opmerking: '',
          afgevoerd: false,
        }));
      }
    }

    // ── ARTIKEL_ID FIX ── Aangemeld materiaal overnemen
    const reedsToegevoegdeItemIds = new Set(
      keuring.items.map(it => it.itemId).filter(Boolean).map(String)
    );
    const aangemeldBox = document.getElementById('aangemeldBox');
    const aangemeldOvernemen = document.getElementById('aangemeldOvernemen')?.checked;
    if (aangemeldOvernemen && aangemeldBox?._items?.length > 0) {
      aangemeldBox._items.forEach(item => {
        const itemId = item.artikel_id || item.id;
        if (itemId && reedsToegevoegdeItemIds.has(String(itemId))) {
          return;
        }
        keuring.items.push({
          itemId:         itemId,
          omschrijving:   item.omschrijving || '',
          merk:           item.merk || '',
          materiaal:      item.materiaal || '',
          serienummer:    item.serienummer || '',
          productieDatum: item.productie_datum || '',
          fabrJaar:       item.fabr_jaar || '',
          fabrMaand:      item.fabr_maand || '',
          inGebruik:      item.in_gebruik || '',
          gebruiker:      item.gebruiker || '',
          opmerking:      item.opmerking || '',
          status:         '',
          afkeurcode:     '',
          afgevoerd:      false,
        });
        if (itemId) reedsToegevoegdeItemIds.add(String(itemId));
      });
    }

    store.keuringen.push(keuring);
    saveStore(store);
    sbUpsertKeuring(keuring)
      .then(() => keuring.items.length > 0 ? sbSyncAllKeuringItems(keuring) : Promise.resolve())
      .catch(console.error);
    closeModal();
    toast(keuring.items.length > 0
      ? `Keuring aangemaakt met ${keuring.items.length} overgenomen items`
      : 'Keuring aangemaakt');
    openKeuringDetail(keuring.id);
  });
}

function getAllKlantItems(klantId, inclAfgevoerd = false) {
  const keuringen = store.keuringen
    .filter(k => k.klantId === klantId && k.items && k.items.length > 0)
    .sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));

  if (keuringen.length === 0) return { items: [], keuringenCount: 0, totalRaw: 0 };

  const seen = new Map();
  for (const keuring of keuringen) {
    for (const item of keuring.items) {
      if (!inclAfgevoerd) {
        if (item.afgevoerd === true) continue;
        if (item.itemId && _afgevoerdeItemIds.has(String(item.itemId))) continue;
      }

      const key = item.itemId
        ? `id:${item.itemId}`
        : `sn:${(item.serienummer||'').toLowerCase()}|${(item.omschrijving||'').toLowerCase()}`;

      if (!seen.has(key)) {
        seen.set(key, {
          ...item,
          vorigeStatus:     item.status,
          vorigeAfkeurcode: item.afkeurcode || '',
          vorigeDatum:      keuring.datum,
        });
      }
    }
  }

  return {
    items:         Array.from(seen.values()),
    keuringenCount: keuringen.length,
    totalRaw:      keuringen.reduce((sum, k) => sum + k.items.length, 0)
  };
}

function updateCertNr() {
  const datumEl = document.getElementById('keuringDatum');
  const klantEl = document.getElementById('keuringKlant');
  const certEl  = document.getElementById('keuringCertNr');
  if (!datumEl || !certEl) return;

  const datum    = datumEl.value.replace(/-/g, '');
  const klantId  = klantEl?.value;
  const klant    = klantId ? store.klanten.find(k => k.id === klantId) : null;
  const klantNaam = klant ? klant.bedrijf.replace(/[^a-zA-Z0-9\-]/g, '') : '';

  let certNr = datum;
  if (klantNaam) {
    certNr += '-' + klantNaam;
    const existing = store.keuringen.filter(k => k.certificaatNr && k.certificaatNr.startsWith(certNr));
    if (existing.length > 0) certNr += '-' + (existing.length + 1);
  }
  certEl.value = certNr;
}

async function checkVorigeKeuring() {
  const klantId = document.getElementById('keuringKlant').value;
  const box     = document.getElementById('vorigeKeuringBox');
  const info    = document.getElementById('vorigeKeuringInfo');
  if (!klantId || !box) { if(box) box.style.display='none'; return; }

  try {
    const { data: afgevoerd } = await sb
      .from('keuring_items')
      .select('id, artikel_id')
      .eq('klant_id', klantId)
      .eq('afgevoerd', true);
    _afgevoerdeItemIds = new Set(
      (afgevoerd || []).map(r => String(r.artikel_id || r.id))
    );
  } catch(e) {
    console.warn('Kon afgevoerde items niet ophalen:', e);
    _afgevoerdeItemIds = new Set();
  }

  const result = getAllKlantItems(klantId, false);
  if (result.items.length > 0) {
    const goed           = result.items.filter(i => i.vorigeStatus === 'goedgekeurd').length;
    const afk            = result.items.filter(i => i.vorigeStatus === 'afgekeurd').length;
    const aantalAfgevoerd = _afgevoerdeItemIds.size;
    box.style.display = 'block';
    info.innerHTML = `${result.keuringenCount} eerdere keuring${result.keuringenCount>1?'en':''} — <strong>${result.items.length} unieke items</strong> (${goed} goed, ${afk} afgekeurd)${aantalAfgevoerd > 0 ? ` · <span style="color:var(--text-muted)">${aantalAfgevoerd} op pensioen</span>` : ''}`;
  } else {
    box.style.display = 'none';
  }

  const aangemeldBox  = document.getElementById('aangemeldBox');
  const aangemeldInfo = document.getElementById('aangemeldInfo');
  if (!aangemeldBox) return;

  try {
    const { data: losse } = await sb.from('keuring_items')
      .select('id, artikel_id, omschrijving, merk, materiaal, serienummer, productie_datum, fabr_jaar, fabr_maand, in_gebruik, gebruiker, opmerking, afgevoerd')
      .eq('klant_id', klantId)
      .is('keuring_id', null);

    const actief = (losse || []).filter(item => !item.afgevoerd);

    if (actief.length > 0) {
      aangemeldBox.style.display = 'block';
      aangemeldInfo.textContent  = `${actief.length} item${actief.length > 1 ? 's' : ''} aangemeld door klant`;
      aangemeldBox._items        = actief;
    } else {
      aangemeldBox.style.display = 'none';
      aangemeldBox._items        = [];
    }
  } catch(e) {
    console.error('Aangemeld materiaal ophalen mislukt:', e);
    aangemeldBox.style.display = 'none';
  }
}

function openKeuringDetail(id) {
  const k = store.keuringen.find(ke => ke.id === id);
  if (!k) return;

  const el = document.getElementById('pageContent');

  const goed     = (k.items||[]).filter(i => i.status === 'goedgekeurd').length;
  const afk      = (k.items||[]).filter(i => i.status === 'afgekeurd').length;
  const pensioen = (k.items||[]).filter(i => i.afgevoerd).length;
  const open     = (k.items||[]).filter(i => !i.status && !i.afgevoerd).length;

  el.innerHTML = `
    <div class="fade-in">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
        <button class="btn btn-sm" onclick="_keuringItemZoek='';renderKeuringen(document.getElementById('pageContent'))">← Terug</button>
        <h2 style="font-size:20px;">Keuring ${escKr(k.certificaatNr)} — ${escKr(k.klantNaam)}</h2>
        <button class="btn btn-sm" onclick="wijzigEigenaar('${id}')" title="Eigenaar aanpassen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Eigenaar aanpassen
        </button>
        <span class="badge ${k.afgerond?'badge-green':'badge-orange'}" style="font-size:13px;padding:4px 12px;">${k.afgerond?'Afgerond':'Lopend'}</span>
        ${k.afgerond ? `<button class="btn btn-sm" onclick="reopenKeuring('${id}')" title="Keuring heropenen om wijzigingen te maken">Heropenen</button>` : ''}
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));gap:16px;margin-bottom:20px;">
        <div class="card"><div class="card-body" style="padding:14px 20px;">
          <div style="font-size:12px;color:var(--text-secondary);text-transform:uppercase;">Datum</div>
          <div style="font-size:16px;font-weight:600;">${formatDate(k.datum)}</div>
        </div></div>
        <div class="card"><div class="card-body" style="padding:14px 20px;">
          <div style="font-size:12px;color:var(--text-secondary);text-transform:uppercase;">Keurmeester</div>
          <div style="font-size:16px;font-weight:600;">${escKr(k.keurmeester)}</div>
        </div></div>
        <div class="card"><div class="card-body" style="padding:14px 20px;">
          <div style="font-size:12px;color:var(--text-secondary);text-transform:uppercase;">Goedgekeurd</div>
          <div style="font-size:16px;font-weight:600;color:var(--sg-green);">${goed}</div>
        </div></div>
        <div class="card"><div class="card-body" style="padding:14px 20px;">
          <div style="font-size:12px;color:var(--text-secondary);text-transform:uppercase;">Afgekeurd</div>
          <div style="font-size:16px;font-weight:600;color:var(--danger);">${afk}</div>
        </div></div>
        ${pensioen > 0 ? `<div class="card"><div class="card-body" style="padding:14px 20px;">
          <div style="font-size:12px;color:var(--text-secondary);text-transform:uppercase;">Op pensioen</div>
          <div style="font-size:16px;font-weight:600;color:var(--text-muted);">${pensioen}</div>
        </div></div>` : ''}
        ${open > 0 ? `<div class="card"><div class="card-body" style="padding:14px 20px;">
          <div style="font-size:12px;color:var(--text-secondary);text-transform:uppercase;">Nog beoordelen</div>
          <div style="font-size:16px;font-weight:600;color:var(--warning);">${open}</div>
        </div></div>` : ''}
      </div>

      <!-- Dag/Week omrekenhulpje -->
      <details style="margin-bottom:16px;" class="converter-panel">
        <summary style="cursor:pointer;padding:10px 16px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);font-size:13px;color:var(--text-secondary);display:flex;align-items:center;gap:8px;user-select:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Dag / Week omrekenen — spiekbriefje
        </summary>
        <div style="padding:14px 16px;background:var(--bg-card);border:1px solid var(--border);border-top:none;border-radius:0 0 var(--radius-lg) var(--radius-lg);display:flex;gap:20px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <label class="form-label" style="margin-bottom:6px;">Dag van het jaar → Datum</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input class="form-input" type="number" id="convDag" placeholder="Dag (1-366)" min="1" max="366" style="width:100px;" oninput="convertDag()">
              <input class="form-input" type="number" id="convDagJaar" placeholder="Jaar" value="${new Date().getFullYear()}" style="width:80px;" oninput="convertDag()">
              <span style="font-size:13px;color:var(--text-muted);">=</span>
              <span id="convDagResult" style="font-size:14px;font-weight:600;color:var(--sg-lime);min-width:120px;">—</span>
            </div>
          </div>
          <div style="flex:1;min-width:200px;">
            <label class="form-label" style="margin-bottom:6px;">Weeknummer → Datumbereik</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input class="form-input" type="number" id="convWeek" placeholder="Week (1-53)" min="1" max="53" style="width:100px;" oninput="convertWeek()">
              <input class="form-input" type="number" id="convWeekJaar" placeholder="Jaar" value="${new Date().getFullYear()}" style="width:80px;" oninput="convertWeek()">
              <span style="font-size:13px;color:var(--text-muted);">=</span>
              <span id="convWeekResult" style="font-size:14px;font-weight:600;color:var(--sg-lime);min-width:180px;">—</span>
            </div>
          </div>
        </div>
      </details>

      ${!k.afgerond ? `
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><h3>Item Toevoegen</h3></div>
        <div class="card-body">
          <div class="form-row" style="grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr;">
            <div class="form-group">
              <label class="form-label">Omschrijving</label>
              <div style="position:relative;" id="omschrWrapper">
                <input class="form-input" id="itemOmschr" placeholder="Type of selecteer product" tabindex="1"
                  autocomplete="off"
                  oninput="onItemOmschrInput(this.value)"
                  onkeydown="onOmschrKeydown(event)"
                  onfocus="onItemOmschrInput(this.value)"
                  onblur="setTimeout(()=>hideOmschrDropdown(),180)">
                <div id="omschrDropdown" style="display:none;position:fixed;z-index:9999;
                  background:var(--bg-card);border:1px solid var(--primary);border-radius:6px;
                  box-shadow:0 4px 20px rgba(0,0,0,.7);max-height:320px;overflow-y:auto;"></div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Merk</label>
              <input class="form-input" id="itemMerk" list="merkList" placeholder="Merk" tabindex="2" oninput="filterItemLists()">
              <datalist id="merkList"></datalist>
            </div>
            <div class="form-group">
              <label class="form-label">Materiaal</label>
              <input class="form-input" id="itemMateriaal" list="materiaalList" placeholder="Materiaal" tabindex="3" oninput="filterItemLists()">
              <datalist id="materiaalList"></datalist>
            </div>
            <div class="form-group">
              <label class="form-label">Serienummer</label>
              <div style="display:flex;gap:4px;"><input class="form-input" id="itemSerial" placeholder="Serienummer" tabindex="4" style="flex:1;"><button type="button" class="btn btn-sm" onclick="openScanner('itemSerial')" title="Scan barcode/DataMatrix" style="padding:4px 8px;white-space:nowrap;">📷</button></div>
            </div>
            <div class="form-group">
              <label class="form-label">Fabr. Jaar</label>
              <input class="form-input" type="number" id="itemJaar" placeholder="JJJJ" min="1990" max="2030" tabindex="5" oninput="checkItemAge()">
            </div>
            <div class="form-group">
              <label class="form-label">Fabr. Maand</label>
              <select class="form-select" id="itemMaand" tabindex="6">
                ${MAANDEN.map((m,i) => `<option value="${i}">${m||'-- Optioneel --'}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">In gebruik</label>
              <input class="form-input" type="date" id="itemInGebruik" tabindex="7" oninput="checkItemAge()">
            </div>
          </div>

          <div id="itemInfoBar" style="display:none;margin-bottom:12px;padding:10px 14px;border-radius:var(--radius);font-size:12px;border:1px solid;"></div>

          <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr 1fr auto;">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="itemStatus" tabindex="8">
                <option value="goedgekeurd">Goed</option>
                <option value="afgekeurd">Afgekeurd</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Afkeurcode</label>
              <select class="form-select" id="itemCode" disabled tabindex="9">
                <option value="">--</option>
                ${getAfkeurcodes().map(c => `<option value="${escKr(c.code)}">${escKr(c.code)} - ${escKr(c.tekst)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Opmerking</label>
              <input class="form-input" id="itemOpm" placeholder="Optionele opmerking" tabindex="10">
            </div>
            <div class="form-group">
              <label class="form-label">Gebruiker</label>
              <input class="form-input" id="itemGebruiker" list="gebruikerList" placeholder="Naam gebruiker" tabindex="11" onblur="this.value=normalizeGebruiker(this.value)">
              <datalist id="gebruikerList"></datalist>
            </div>
            <div class="form-group" style="display:flex;align-items:flex-end;">
              <button class="btn btn-primary" onclick="addKeuringItem('${id}')" tabindex="12" title="Item opslaan">+ Opslaan</button>
            </div>
          </div>
        </div>
      </div>` : ''}

      <div class="card">
        <div class="card-header">
          <div style="display:flex;align-items:center;gap:12px;flex:1;flex-wrap:wrap;">
            <h3 style="white-space:nowrap;">Keuringsitems (${(k.items||[]).length})</h3>
            <div style="position:relative;flex:1;min-width:200px;max-width:360px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                style="position:absolute;left:9px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--text-muted);pointer-events:none;">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" id="keuringItemZoek"
                value="${escKr(_keuringItemZoek)}"
                placeholder="Zoek op SN, naam, merk..."
                oninput="zoekKeuringItems(this.value)"
                onkeydown="if(event.key==='Escape'){zoekKeuringItems('');this.value='';}"
                style="width:100%;padding:6px 10px 6px 30px;border:1.5px solid var(--border);border-radius:var(--radius);font-size:13px;background:var(--bg-input);color:var(--text-primary);">
            </div>
            <span id="zoekResultaatTeller" style="font-size:12px;display:none;"></span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
            ${!k.afgerond ? `<button class="btn btn-sm btn-primary" onclick="finishKeuring('${id}')">Afronden</button>` : ''}
            <button class="btn btn-sm" onclick="exportKeuringPDF('${id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              PDF Certificaat
            </button>
            <button class="btn btn-sm" onclick="exportKeuringPDFPerGebruiker('${id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              PDF per Gebruiker
            </button>
            <button class="btn btn-sm" onclick="exportKeuringJSON('${id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
              JSON Certificaat
            </button>
            <button class="btn btn-sm" onclick="exportKeuringJSONPerGebruiker('${id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              JSON per Gebruiker
            </button>
            <button class="btn btn-sm" onclick="exportSingleKeuringExcel('${id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Excel Data
            </button>
          </div>
        </div>
        <div class="table-container" id="keuringDetailTable" style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
          <table style="min-width:900px;">
            <thead><tr>
              <th>#</th>
              <th style="color:var(--text-muted);font-size:11px;min-width:50px;">ID</th>
              ${['omschrijving','merk','materiaal','serienummer','fabrJaar','inGebruik'].map(col => {
                const labels = {omschrijving:'Omschrijving',merk:'Merk',materiaal:'Materiaal',serienummer:'Serienummer',fabrJaar:'Fabr.',inGebruik:'In gebruik'};
                const isActive = keuringItemSort.col === col;
                return `<th class="${isActive?'sorted':''}" data-sort-col="${col}" style="cursor:pointer;user-select:none;" onclick="sortKeuringItems('${id}','${col}')">${labels[col]} <span class="sort-arrow">${isActive?(keuringItemSort.asc?'▲':'▼'):'▲'}</span></th>`;
              }).join('')}
              <th style="min-width:200px;">Beoordeling</th><th>Opmerking</th><th class="${keuringItemSort.col==='gebruiker'?'sorted':''}" data-sort-col="gebruiker" style="cursor:pointer;user-select:none;" onclick="sortKeuringItems('${id}','gebruiker')">Gebruiker <span class="sort-arrow">${keuringItemSort.col==='gebruiker'?(keuringItemSort.asc?'▲':'▼'):'▲'}</span></th><th>Vorig</th><th></th>
            </tr></thead>
            <tbody class="keuring-items-tbody">
              ${(k.items||[]).length === 0 ? '<tr><td colspan="12" style="text-align:center;color:var(--text-muted);padding:30px;">Nog geen items. Voeg items toe via het formulier hierboven.</td></tr>' :
                (k.items||[]).map((item, i) => ({item, i}))
                .sort((a, b) => {
                  const col = keuringItemSort.col;
                  const cmp = (x, y) => (x||'').localeCompare(y||'', 'nl', {sensitivity:'base'});
                  const val = (obj) => {
                    if (col === 'fabrJaar') return String(obj.item.fabrJaar||'');
                    if (col === 'inGebruik') return obj.item.inGebruik||'';
                    return obj.item[col]||'';
                  };
                  const result = cmp(val(a), val(b));
                  return keuringItemSort.asc ? result : -result;
                })
                .map(({item, i}, displayIdx) => {
                  const isGoed     = item.status === 'goedgekeurd';
                  const isAfk      = item.status === 'afgekeurd';
                  const isPensioen = item.afgevoerd === true;
                  const isOpen     = !item.status && !isPensioen;
                  const isAfgerond = k.afgerond;

                  const rijStijl = isPensioen
                    ? 'background:rgba(150,150,150,0.08);opacity:0.7;'
                    : isOpen ? 'background:rgba(243,156,18,0.05);' : '';

                  const historieKnoopje = (item.itemId || item.serienummer)
                    ? `<button class="btn-icon" title="Keuringshistorie artikel ID ${escKr(item.itemId||'')}" onclick="showHistoriePopup('${(item.itemId||'').toString().replace(/'/g,"\\'")}','${(item.serienummer||'').replace(/'/g,"\\'")}','${(item.omschrijving||'').replace(/'/g,"\\'")}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button>`
                    : '';

                  const vorigBadge = (item.vorigeStatus === 'goedgekeurd'
                    ? '<span class="badge badge-green" style="opacity:0.6;font-size:10px;">Goed</span>'
                    : item.vorigeStatus === 'afgekeurd'
                      ? '<span class="badge badge-red" style="opacity:0.6;font-size:10px;">Afk ' + escKr(item.vorigeAfkeurcode||'') + '</span>'
                      : '<span style="color:var(--text-muted);font-size:11px;">—</span>') + historieKnoopje;

                  const prod = store.products.find(p => p.omschrijving === item.omschrijving);
                  const maxMfr = parseInt(prod?.maxLeeftijdMFR) || parseInt(prod?.maxLeeftijd) || 0;
                  const maxUse = parseInt(prod?.maxLeeftijdUSE) || 0;
                  const fabrJaar = parseInt(item.fabrJaar);
                  const currentYear = new Date().getFullYear();
                  let ageIcon = '';
                  if (maxMfr && fabrJaar && (currentYear - fabrJaar) >= maxMfr) {
                    ageIcon = '<span title="Over datum (fabricage)" style="color:var(--danger);font-weight:700;"> ⛔</span>';
                  } else if (maxMfr && fabrJaar && (currentYear - fabrJaar) >= maxMfr - 1) {
                    ageIcon = '<span title="Bijna verlopen (fabricage)" style="color:var(--warning);"> ⚠</span>';
                  }
                  if (maxUse && item.inGebruik) {
                    const useYears = (new Date() - new Date(item.inGebruik)) / (365.25*24*60*60*1000);
                    if (useYears >= maxUse) ageIcon = '<span title="Over datum (gebruik)" style="color:var(--danger);font-weight:700;"> ⛔</span>';
                    else if (useYears >= maxUse - 1) ageIcon += '<span title="Bijna verlopen (gebruik)" style="color:var(--warning);"> ⚠</span>';
                  }

                  const fabrStr = item.fabrJaar ? (item.fabrJaar + (item.fabrMaand ? '/' + String(item.fabrMaand).padStart(2,'0') : '')) : '';

                  const pensioenKnopStijl = isPensioen
                    ? 'border-color:var(--warning);color:var(--warning);opacity:1;'
                    : 'opacity:0.5;';
                  const pensioenLabel = isPensioen ? '🏖 Pensioen ✓' : '🏖 Pensioen';

                  const beoordelingHtml = `
                    <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
                      <button class="btn btn-sm ${isGoed?'btn-goed-active':'btn-goed'}"
                        onclick="quickBeoordeel('${id}',${i},'goedgekeurd')"
                        ${isAfgerond?'disabled style="opacity:0.4;cursor:not-allowed;"':''}>✓ Goed</button>
                      <button class="btn btn-sm ${isAfk?'btn-afk-active':'btn-afk'}"
                        onclick="quickBeoordeel('${id}',${i},'afgekeurd')"
                        ${isAfgerond?'disabled style="opacity:0.4;cursor:not-allowed;"':''}>✗ Afkeur</button>
                      ${isAfk ? `<select class="form-select" style="width:auto;min-width:60px;height:28px;font-size:11px;padding:2px 4px;"
                        onchange="setAfkeurCode('${id}',${i},this.value)" ${isAfgerond?'disabled':''}>
                        <option value="">Code</option>
                        ${getAfkeurcodes().map(c => `<option value="${escKr(c.code)}" ${String(item.afkeurcode)==String(c.code)?'selected':''}>${escKr(c.code)}</option>`).join('')}
                      </select>` : ''}
                      <button class="btn btn-sm btn-secondary"
                        onclick="togglePensioen('${id}',${i})"
                        ${isAfgerond?'disabled style="opacity:0.4;cursor:not-allowed;"':`style="${pensioenKnopStijl}"`}
                        title="${isPensioen?'Pensioen ongedaan maken':'Artikel met pensioen sturen — komt niet meer terug in nieuwe keuringen'}"
                        >${pensioenLabel}</button>
                    </div>`;

                  return `<tr style="${rijStijl}" data-item-idx="${i}" data-sort_omschrijving="${escKr((item.omschrijving||'').toLowerCase())}" data-sort_merk="${escKr((item.merk||'').toLowerCase())}" data-sort_materiaal="${escKr((item.materiaal||'').toLowerCase())}" data-sort_serienummer="${escKr((item.serienummer||'').toLowerCase())}" data-sort_fabrjaar="${escKr(item.fabrJaar||'')}" data-sort_ingebruik="${escKr(item.inGebruik||'')}" data-sort_gebruiker="${escKr((item.gebruiker||'').toLowerCase())}">
                    <td class="row-num">${displayIdx+1}</td>
                    <td style="font-size:11px;color:var(--text-muted);font-family:monospace;">${escKr(item.itemId || '—')}</td>
                    <td>${escKr(item.omschrijving||'')}${ageIcon}${isPensioen?' <span style="font-size:10px;color:var(--text-muted);">(pensioen)</span>':''}</td>
                    <td>${escKr(item.merk||'')}</td>
                    <td>${escKr(item.materiaal||'')}</td>
                    <td style="font-family:monospace;font-size:12px;">${escKr(item.serienummer||'')}</td>
                    <td style="font-size:12px;">${escKr(fabrStr)}</td>
                    <td style="font-size:12px;">${item.inGebruik ? formatDate(item.inGebruik) : ''}</td>
                    <td>${beoordelingHtml}</td>
                    <td title="${escKr(item.opmerking||'')}" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;font-size:12px;">${escKr(item.opmerking||'')}</td>
                    <td style="font-size:12px;">${escKr(item.gebruiker||'')}</td>
                    <td>${vorigBadge}</td>
                    <td style="white-space:nowrap;">
                      ${(() => {
                        const p = store.products.find(pr => pr.omschrijving === item.omschrijving);
                        const link = p?.handleiding || p?.link || '';
                        return link && link.startsWith('http') ? `<a href="${escKr(link)}" target="_blank" class="btn-icon" title="Handleiding openen" style="color:var(--sg-green);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></a>` : '';
                      })()}
                      <button class="btn-icon" title="Bewerken" onclick="editKeuringItem('${id}',${i})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      ${!k.afgerond ? `
                      <button class="btn-icon" title="Dupliceren" onclick="duplicateKeuringItem('${id}',${i})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                      <button class="btn-icon" title="Verwijderen" onclick="removeKeuringItem('${id}',${i})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ''}
                    </td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const statusSel = document.getElementById('itemStatus');
  const codeSel   = document.getElementById('itemCode');
  if (statusSel && codeSel) {
    statusSel.onchange = () => {
      codeSel.disabled = statusSel.value !== 'afgekeurd';
      if (statusSel.value !== 'afgekeurd') codeSel.value = '';
    };
  }

  laadMerkMateriaalCache();
  buildGebruikerList(id);

  if (_keuringItemZoek) filterKeuringItemsTable();
}

function normalizeGebruiker(val) {
  if (!val) return '';
  let name = val.trim().replace(/\s+/g, ' ');
  name = name.replace(/\b\w/g, c => c.toUpperCase()).replace(/\b(\w)(\w*)/g, (m, first, rest) => first + rest.toLowerCase());
  return name;
}

function buildGebruikerList(keuringId) {
  const el = document.getElementById('gebruikerList');
  if (!el) return;
  const namen = new Set();
  store.keuringen.forEach(k => {
    (k.items || []).forEach(item => {
      if (item.gebruiker) namen.add(normalizeGebruiker(item.gebruiker));
    });
  });
  el.innerHTML = [...namen].sort().map(n => `<option value="${escKr(n)}">`).join('');
}

function getAfkeurcodes() {
  return store.afkeurcodes || CERT_INFO.afkeurcodes;
}

_merkCache    = null;
_materiaalCache = null;

async function laadMerkMateriaalCache() {
  if (_merkCache && _materiaalCache) return;
  try {
    const [merkRes, matRes] = await Promise.all([
      sb.from('producten').select('merk').not('merk', 'is', null).order('merk'),
      sb.from('producten').select('materiaal').not('materiaal', 'is', null).order('materiaal'),
    ]);
    _merkCache     = [...new Set((merkRes.data || []).map(r => r.merk).filter(Boolean))].sort();
    _materiaalCache = [...new Set((matRes.data || []).map(r => r.materiaal).filter(Boolean))].sort();
    vulMerkMateriaalDatalist();
  } catch(e) {
    console.warn('Kon merk/materiaal niet laden:', e);
    _merkCache     = [];
    _materiaalCache = [];
  }
}

function vulMerkMateriaalDatalist() {
  const merkList = document.getElementById('merkList');
  if (merkList && _merkCache) merkList.innerHTML = _merkCache.map(m => `<option value="${escKr(m)}">`).join('');
  const materiaalList = document.getElementById('materiaalList');
  if (materiaalList && _materiaalCache) materiaalList.innerHTML = _materiaalCache.map(m => `<option value="${escKr(m)}">`).join('');
}

function filterItemLists() { vulMerkMateriaalDatalist(); }

omschrDropIndex      = -1;
_omschrDebounceTimer = null;
_lastSelectedProduct = null;

function onItemOmschrInput(val) {
  clearTimeout(_omschrDebounceTimer);
  _omschrDebounceTimer = setTimeout(() => _doOmschrZoeken(val), 300);
}

async function _doOmschrZoeken(val) {
  const q = val.trim();
  const dropdown = document.getElementById('omschrDropdown');
  if (!dropdown) return;

  const input = document.getElementById('itemOmschr');
  if (input) {
    const rect = input.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top      = (rect.bottom + 2) + 'px';
    dropdown.style.left     = rect.left + 'px';
    dropdown.style.width    = rect.width + 'px';
    dropdown.style.right    = 'auto';
  }

  if (q.length === 0) { hideOmschrDropdown(); return; }

  dropdown.style.display = 'block';
  dropdown.innerHTML = '<div style="padding:10px 12px;font-size:13px;color:var(--text-muted);">Zoeken...</div>';

  try {
    const merkVal = document.getElementById('itemMerk')?.value?.trim() || '';
    const matVal  = document.getElementById('itemMateriaal')?.value?.trim() || '';

    let query = sb.from('producten')
      .select('omschrijving, merk, materiaal, max_leeftijd, max_leeftijd_use, max_leeftijd_mfr, norm, bijzonderheden, handleiding, breuksterkte')
      .ilike('omschrijving', `%${q}%`)
      .limit(50);

    if (!_isPlatformAdmin && _huidigBedrijfId) query = query.eq('bedrijf_id', _huidigBedrijfId);
    if (merkVal && matVal) query = query.ilike('merk', `%${merkVal}%`).ilike('materiaal', `%${matVal}%`);
    else if (merkVal) query = query.ilike('merk', `%${merkVal}%`);
    else if (matVal)  query = query.ilike('materiaal', `%${matVal}%`);

    const { data, error } = await query;
    if (error) throw error;

    const ql = q.toLowerCase();
    const gesorteerd = (data || []).sort((a, b) => {
      const aBegin = a.omschrijving.toLowerCase().startsWith(ql) ? 0 : 1;
      const bBegin = b.omschrijving.toLowerCase().startsWith(ql) ? 0 : 1;
      if (aBegin !== bBegin) return aBegin - bBegin;
      return a.omschrijving.localeCompare(b.omschrijving, 'nl');
    }).slice(0, 15);

    if (gesorteerd.length === 0) {
      dropdown.innerHTML = '<div style="padding:10px 12px;font-size:13px;color:var(--text-muted);font-style:italic;">Geen producten gevonden — typ zelf in</div>';
      return;
    }

    omschrDropIndex = -1;
    dropdown.innerHTML = gesorteerd.map((p, i) => {
      const o  = p.omschrijving;
      const lo = o.toLowerCase();
      const idx = lo.indexOf(ql);
      let label;
      if (idx >= 0) {
        label = escKr(o.slice(0, idx)) + '<strong style="color:var(--sg-green);">' + escKr(o.slice(idx, idx + q.length)) + '</strong>' + escKr(o.slice(idx + q.length));
      } else {
        label = escKr(o);
      }
      const sub = [p.merk, p.materiaal].filter(Boolean).join(' · ');
      return `<div class="omschr-drop-item" data-val="${escKr(o)}" data-idx="${i}"
        onmousedown="selectOmschrItem(this)"
        style="padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.07);color:var(--text-primary);transition:background 0.1s;"
        onmouseover="highlightOmschrItem(${i})"
        onmouseout="if(omschrDropIndex!==${i})this.style.background=''">
        <div>${label}</div>
        ${sub ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${escKr(sub)}</div>` : ''}
      </div>`;
    }).join('');

    gesorteerd.forEach((p, i) => {
      const el = dropdown.querySelectorAll('.omschr-drop-item')[i];
      if (el) el._prodData = p;
    });
  } catch(e) {
    console.error('Productzoeking mislukt:', e);
    dropdown.innerHTML = '<div style="padding:10px 12px;font-size:13px;color:var(--text-muted);">Fout bij zoeken — typ zelf in</div>';
  }
}

function hideOmschrDropdown() {
  const d = document.getElementById('omschrDropdown');
  if (d) d.style.display = 'none';
  omschrDropIndex = -1;
}

function highlightOmschrItem(idx) {
  omschrDropIndex = idx;
  document.querySelectorAll('.omschr-drop-item').forEach((el, i) => {
    el.style.background = i === idx ? 'rgba(91,154,47,0.18)' : '';
    if (i === idx) el.scrollIntoView({ block: 'nearest' });
  });
}

function selectOmschrItem(el) {
  let val, prod;
  if (typeof el === 'string') {
    val = el;
    document.querySelectorAll('.omschr-drop-item').forEach(item => { if (item.dataset.val === val) prod = item._prodData; });
  } else {
    val  = el.dataset.val;
    prod = el._prodData;
  }
  const input = document.getElementById('itemOmschr');
  if (input) input.value = val;
  hideOmschrDropdown();
  onItemOmschrChange(val, prod);
}

function onOmschrKeydown(e) {
  const items = document.querySelectorAll('.omschr-drop-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown')  { e.preventDefault(); omschrDropIndex = Math.min(omschrDropIndex + 1, items.length - 1); highlightOmschrItem(omschrDropIndex); }
  else if (e.key === 'ArrowUp')   { e.preventDefault(); omschrDropIndex = Math.max(omschrDropIndex - 1, 0); highlightOmschrItem(omschrDropIndex); }
  else if (e.key === 'Enter' && omschrDropIndex >= 0)  { e.preventDefault(); selectOmschrItem(items[omschrDropIndex]); }
  else if (e.key === 'Tab'   && omschrDropIndex >= 0)  { e.preventDefault(); selectOmschrItem(items[omschrDropIndex]); document.getElementById('itemMerk')?.focus(); }
  else if (e.key === 'Escape') hideOmschrDropdown();
}

function onItemOmschrChange(val, prod) {
  _lastSelectedProduct = prod || null;
  const merkEl = document.getElementById('itemMerk');
  const matEl  = document.getElementById('itemMateriaal');
  if (prod) {
    if (merkEl && !merkEl.value) merkEl.value = prod.merk || '';
    if (matEl  && !matEl.value)  matEl.value  = prod.materiaal || '';
  }
  showItemInfoBar(prod);
  checkItemAge();
}

function showItemInfoBar(prod) {
  const bar = document.getElementById('itemInfoBar');
  if (!bar) return;
  if (!prod) { bar.style.display = 'none'; return; }

  const parts = [];
  if (prod.bijzonderheden) parts.push(`<span style="color:var(--warning);"><strong>⚠ Bijzonderheden:</strong> ${escKr(prod.bijzonderheden)}</span>`);
  const ages = [];
  if (prod.max_leeftijd)     ages.push(`Max leeftijd: <strong>${escKr(prod.max_leeftijd)} jaar</strong>`);
  if (prod.max_leeftijd_use) ages.push(`Max vanaf gebruik: <strong>${escKr(prod.max_leeftijd_use)} jaar</strong>`);
  if (prod.max_leeftijd_mfr) ages.push(`Max vanaf fabricage: <strong>${escKr(prod.max_leeftijd_mfr)} jaar</strong>`);
  if (ages.length > 0) parts.push(ages.join(' · '));
  if (prod.norm) parts.push(`EN-norm: ${escKr(prod.norm)}`);
  if (parts.length === 0) { bar.style.display = 'none'; return; }

  const hasWarning = !!prod.bijzonderheden;
  bar.style.display     = 'block';
  bar.style.background  = hasWarning ? 'rgba(243,156,18,0.1)' : 'rgba(91,154,47,0.08)';
  bar.style.borderColor = hasWarning ? 'var(--warning)' : 'var(--sg-green)';
  bar.style.color       = 'var(--text-secondary)';
  bar.innerHTML = parts.join('<span style="margin:0 8px;opacity:0.3;">|</span>');
}

function checkItemAge() {
  const prod = _lastSelectedProduct;
  if (!prod) return;

  const fabrJaarStr  = document.getElementById('itemJaar')?.value || '';
  const fabrJaar     = parseInt(fabrJaarStr);
  const inGebruik    = document.getElementById('itemInGebruik')?.value;
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const validFabrJaar = fabrJaarStr.length === 4 && fabrJaar >= 1900 && fabrJaar <= 2099;
  const warnings     = [];

  const maxMfr = parseInt(prod.max_leeftijd_mfr) || parseInt(prod.max_leeftijd) || 0;
  if (maxMfr && validFabrJaar) {
    const ageMfr = currentYear - fabrJaar;
    if (ageMfr >= maxMfr) warnings.push(`<strong style="color:var(--danger);">⛔ OVER DATUM:</strong> fabricagejaar ${fabrJaar}, max ${maxMfr} jaar vanaf fabricage (${ageMfr} jaar oud)`);
    else if (ageMfr >= maxMfr - 1) warnings.push(`<strong style="color:var(--warning);">⚠ Bijna verlopen:</strong> nog ${maxMfr - ageMfr} jaar resterend vanaf fabricage`);
  }

  const maxUse = parseInt(prod.max_leeftijd_use) || 0;
  if (maxUse && inGebruik) {
    const useYears = (now - new Date(inGebruik)) / (365.25 * 24 * 60 * 60 * 1000);
    if (useYears >= maxUse) warnings.push(`<strong style="color:var(--danger);">⛔ OVER DATUM:</strong> in gebruik sinds ${formatDate(inGebruik)}, max ${maxUse} jaar vanaf gebruik (${useYears.toFixed(1)} jaar)`);
    else if (useYears >= maxUse - 1) warnings.push(`<strong style="color:var(--warning);">⚠ Bijna verlopen:</strong> nog ${(maxUse - useYears).toFixed(1)} jaar resterend vanaf gebruik`);
  }

  const bar = document.getElementById('itemInfoBar');
  if (!bar) return;
  if (warnings.length > 0) {
    showItemInfoBar(prod);
    const prodInfo = bar.innerHTML;
    bar.innerHTML         = warnings.join('<br>') + (prodInfo ? '<br>' + prodInfo : '');
    bar.style.display     = 'block';
    bar.style.background  = 'rgba(231,76,60,0.1)';
    bar.style.borderColor = 'var(--danger)';
  } else {
    showItemInfoBar(prod);
  }
}

function addKeuringItem(keuringId) {
  const k = store.keuringen.find(ke => ke.id === keuringId);
  if (!k || k.afgerond) return;

  const omschr = document.getElementById('itemOmschr').value;
  if (!omschr) { toast('Vul een omschrijving in', 'error'); return; }

  const prod   = store.products.find(p => p.omschrijving === omschr);
  const status = document.getElementById('itemStatus').value;

  // ── ARTIKEL_ID FIX ── Nieuw artikel: nieuw itemId, geen rowId
  const item = {
    itemId:      generateId(),
    omschrijving: omschr,
    merk:        document.getElementById('itemMerk')?.value || prod?.merk || '',
    materiaal:   document.getElementById('itemMateriaal')?.value || prod?.materiaal || '',
    serienummer: document.getElementById('itemSerial').value,
    fabrJaar:    document.getElementById('itemJaar').value || '',
    fabrMaand:   parseInt(document.getElementById('itemMaand').value) || 0,
    inGebruik:   document.getElementById('itemInGebruik')?.value || '',
    status:      status,
    afkeurcode:  status === 'afgekeurd' ? document.getElementById('itemCode').value : '',
    opmerking:   document.getElementById('itemOpm').value,
    gebruiker:   normalizeGebruiker(document.getElementById('itemGebruiker').value),
    maxLeeftijd: prod?.maxLeeftijd || '',
    enNorm:      prod?.enNorm || '',
    afgevoerd:   false,
  };

  if (!k.items) k.items = [];
  k.items.push(item);
  saveStore(store);
  sbUpsertKeuringItem(item, keuringId, k.klantId).catch(console.error);
  toast('Item toegevoegd');
  openKeuringDetail(keuringId);
}

function duplicateKeuringItem(keuringId, idx) {
  const k = store.keuringen.find(ke => ke.id === keuringId);
  if (!k || k.afgerond) return;
  const original = k.items[idx];
  if (!original) return;

  // ── ARTIKEL_ID FIX ── Duplicaat = nieuw fysiek artikel
  const kopie = {
    ...JSON.parse(JSON.stringify(original)),
    itemId:           generateId(),
    rowId:            undefined,
    serienummer:      '',
    status:           '',
    afkeurcode:       '',
    opmerking:        '',
    afgevoerd:        false,
    vorigeStatus:     '',
    vorigeAfkeurcode: '',
  };

  k.items.splice(idx + 1, 0, kopie);
  saveStore(store);
  sbUpsertKeuringItem(kopie, keuringId, k.klantId).catch(console.error);
  toast('Item gedupliceerd — vul serienummer in');
  openKeuringDetail(keuringId);
}

function removeKeuringItem(keuringId, idx) {
  const k = store.keuringen.find(ke => ke.id === keuringId);
  if (!k || k.afgerond) return;
  if (!confirm('Item verwijderen?')) return;
  if (!k.auditLog) k.auditLog = [];
  k.auditLog.push({...k.items[idx], removedAt: new Date().toISOString()});

  // ── ARTIKEL_ID FIX ── Verwijder op rowId (database rij-ID)
  const removedRowId = k.items[idx].rowId;
  k.items.splice(idx, 1);
  saveStore(store);
  if (removedRowId) sbDeleteKeuringItem(removedRowId).catch(console.error);
  toast('Item verwijderd (bewaard in audit log)');
  openKeuringDetail(keuringId);
}

function quickBeoordeel(keuringId, idx, newStatus) {
  const k = store.keuringen.find(ke => ke.id === keuringId);
  if (!k) return;
  if (k.afgerond) { toast('Keuring is afgerond — heropen eerst om wijzigingen te maken', 'error'); return; }
  const item = k.items[idx];
  if (!item) return;

  const oldStatus = item.status;
  if (item.status === newStatus) {
    item.status    = '';
    item.afkeurcode = '';
  } else {
    item.status = newStatus;
    if (newStatus !== 'afgekeurd') item.afkeurcode = '';
  }

  if (oldStatus !== item.status) {
    if (!k.auditLog) k.auditLog = [];
    k.auditLog.push({ actie: 'status_gewijzigd', item: item.omschrijving, van: oldStatus || 'onbeoordeeld', naar: item.status || 'onbeoordeeld', datum: new Date().toISOString(), door: store.settings.keurmeester });
  }

  saveStore(store);
  sbUpsertKeuringItem(item, keuringId, k.klantId).catch(console.error);
  openKeuringDetail(keuringId);
}

// ============================================================
// PENSIOEN TOGGLE
// ============================================================
function togglePensioen(keuringId, idx) {
  const k = store.keuringen.find(ke => ke.id === keuringId);
  if (!k) return;
  if (k.afgerond) { toast('Keuring is afgerond — heropen eerst om wijzigingen te maken', 'error'); return; }
  const item = k.items[idx];
  if (!item) return;

  if (item.afgevoerd) {
    item.afgevoerd = false;
    toast('Pensioen ongedaan gemaakt — artikel komt de volgende keer weer terug');
  } else {
    item.afgevoerd = true;
    if (item.status === 'afgekeurd') {
      toast('Artikel op pensioen — staat nog op dit certificaat maar komt niet meer terug');
    } else {
      toast('Artikel op pensioen — komt niet meer terug in nieuwe keuringen');
    }
  }

  if (!k.auditLog) k.auditLog = [];
  k.auditLog.push({ actie: item.afgevoerd ? 'op_pensioen' : 'pensioen_ongedaan', item: item.omschrijving, datum: new Date().toISOString(), door: store.settings.keurmeester });

  saveStore(store);
  sbUpsertKeuringItem(item, keuringId, k.klantId).catch(console.error);
  openKeuringDetail(keuringId);
}

function setAfkeurCode(keuringId, idx, code) {
  const k = store.keuringen.find(ke => ke.id === keuringId);
  if (!k || k.afgerond) return;
  k.items[idx].afkeurcode = code;
  saveStore(store);
  sbUpsertKeuringItem(k.items[idx], keuringId, k.klantId).catch(console.error);
}

function convertDag() {
  const dag  = parseInt(document.getElementById('convDag')?.value);
  const jaar = parseInt(document.getElementById('convDagJaar')?.value) || new Date().getFullYear();
  const el   = document.getElementById('convDagResult');
  if (!el) return;
  if (!dag || dag < 1 || dag > 366) { el.textContent = '—'; return; }
  const date = new Date(jaar, 0, dag);
  if (date.getFullYear() !== jaar) { el.textContent = 'Ongeldig'; return; }
  el.innerHTML = `<strong>${date.toLocaleDateString('nl-NL', {day:'numeric', month:'long'})}</strong> <span style="opacity:0.7;">(maand ${date.getMonth()+1})</span>`;
}

function convertWeek() {
  const week = parseInt(document.getElementById('convWeek')?.value);
  const jaar = parseInt(document.getElementById('convWeekJaar')?.value) || new Date().getFullYear();
  const el   = document.getElementById('convWeekResult');
  if (!el) return;
  if (!week || week < 1 || week > 53) { el.textContent = '—'; return; }
  const jan4      = new Date(jaar, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('nl-NL', {day:'numeric', month:'short'});
  el.innerHTML = `<strong>${fmt(weekStart)} — ${fmt(weekEnd)}</strong> <span style="opacity:0.7;">(maand ${weekStart.getMonth()+1})</span>`;
}

// ============================================================
// KEURING AFRONDEN — DB-VERVUILING FIX
// ============================================================
function finishKeuring(id) {
  const k = store.keuringen.find(ke => ke.id === id);
  if (!k) return;

  const onaangeraakteItems = (k.items || []).filter(isItemOnaangeraakt);
  const onaangeraakteRowIds = onaangeraakteItems
    .map(item => item.rowId)
    .filter(Boolean);
  const aantalOnaangeraakt = onaangeraakteItems.length;

  if (aantalOnaangeraakt > 0) {
    const meervoud = aantalOnaangeraakt > 1;
    const vraag =
      `${aantalOnaangeraakt} ${meervoud ? 'items zijn' : 'item is'} niet beoordeeld en ${meervoud ? 'worden' : 'wordt'} niet opnieuw opgeslagen. Akkoord?\n\n` +
      `(De keuringshistorie van ${meervoud ? 'deze artikelen' : 'dit artikel'} blijft gewoon bestaan.)`;
    if (!confirm(vraag)) {
      return;
    }
  }

  if (aantalOnaangeraakt > 0) {
    k.items = (k.items || []).filter(item => !isItemOnaangeraakt(item));
  }

  k.afgerond      = true;
  k.afgerondDatum = new Date().toISOString();
  saveStore(store);

  sbUpsertKeuring(k).catch(console.error);
  if (onaangeraakteRowIds.length > 0) {
    sbDeleteOnaangeraakteItems(id, onaangeraakteRowIds).catch(console.error);
  }
  sbSyncAllKeuringItems(k).catch(console.error);

  const beoordeeldeItemIds = (k.items || [])
    .filter(item => !isItemOnaangeraakt(item))
    .map(item => item.itemId)
    .filter(Boolean);
  if (beoordeeldeItemIds.length > 0 && k.klantId) {
    sbCleanupVerwerkteAanmeldingen(k.klantId, beoordeeldeItemIds).catch(console.error);
  }

  if (aantalOnaangeraakt > 0) {
    const meervoud = aantalOnaangeraakt > 1;
    toast(`✓ Keuring afgerond — ${aantalOnaangeraakt} onbeoordeeld ${meervoud ? 'items' : 'item'} niet opnieuw opgeslagen`);
  } else {
    toast('✓ Keuring afgerond');
  }

  openKeuringDetail(id);
}

function reopenKeuring(id) {
  const k = store.keuringen.find(ke => ke.id === id);
  if (!k) return;
  if (!confirm('Weet je zeker dat je deze keuring wilt heropenen?')) return;
  if (!k.auditLog) k.auditLog = [];
  k.auditLog.push({ actie: 'heropend', datum: new Date().toISOString(), door: store.settings.keurmeester });
  k.afgerond = false;
  saveStore(store);
  sbUpsertKeuring(k).catch(console.error);
  toast('Keuring heropend');
  openKeuringDetail(id);
}

function editKeuringItem(keuringId, idx) {
  const k = store.keuringen.find(ke => ke.id === keuringId);
  if (!k) return;
  const item = k.items[idx];
  if (!item) return;

  const allProds = store.products.map(p => p.omschrijving).filter(Boolean);

  showModal('Item Bewerken — #' + (idx+1), `
    <div class="form-row" style="grid-template-columns: 2fr 1fr 1fr 1fr 1fr;">
      <div class="form-group">
        <label class="form-label">Omschrijving</label>
        <input class="form-input" id="editOmschr" list="editProdList" value="${escKr(item.omschrijving||'')}">
        <datalist id="editProdList">${allProds.map(p=>`<option value="${escKr(p)}">`).join('')}</datalist>
      </div>
      <div class="form-group">
        <label class="form-label">Merk</label>
        <input class="form-input" id="editMerk" value="${escKr(item.merk||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Materiaal</label>
        <input class="form-input" id="editMateriaal" value="${escKr(item.materiaal||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Serienummer</label>
        <input class="form-input" id="editSerial" value="${escKr(item.serienummer||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Fabr. Jaar</label>
        <input class="form-input" type="number" id="editJaar" value="${escKr(item.fabrJaar||'')}" min="1990" max="2030">
      </div>
    </div>
    <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;">
      <div class="form-group">
        <label class="form-label">Fabr. Maand</label>
        <select class="form-select" id="editMaand">
          ${MAANDEN.map((m,i) => `<option value="${i}" ${(item.fabrMaand||0)==i?'selected':''}>${m||'-- Optioneel --'}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">In gebruik</label>
        <input class="form-input" type="date" id="editInGebruik" value="${escKr(item.inGebruik||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Status${k.afgerond?' <span style="font-size:11px;color:var(--text-muted);">(vergrendeld)</span>':''}</label>
        <select class="form-select" id="editStatus" ${k.afgerond?'disabled':''} onchange="document.getElementById('editCode').disabled=this.value!=='afgekeurd';if(this.value!=='afgekeurd')document.getElementById('editCode').value='';">
          <option value="" ${!item.status?'selected':''}>— Nog beoordelen —</option>
          <option value="goedgekeurd" ${item.status==='goedgekeurd'?'selected':''}>Goedgekeurd</option>
          <option value="afgekeurd"   ${item.status==='afgekeurd'  ?'selected':''}>Afgekeurd</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Afkeurcode</label>
        <select class="form-select" id="editCode" ${k.afgerond||item.status!=='afgekeurd'?'disabled':''}>
          <option value="">--</option>
          ${getAfkeurcodes().map(c => `<option value="${escKr(c.code)}" ${String(item.afkeurcode)==String(c.code)?'selected':''}>${escKr(c.code)} - ${escKr(c.tekst)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Opmerking</label>
        <input class="form-input" id="editOpm" value="${escKr(item.opmerking||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Gebruiker</label>
        <input class="form-input" id="editGebruiker" value="${escKr(item.gebruiker||'')}" list="editGebruikerList" onblur="this.value=normalizeGebruiker(this.value)">
        <datalist id="editGebruikerList">${[...new Set(store.keuringen.flatMap(ke => (ke.items||[]).map(it => it.gebruiker).filter(Boolean)).map(n => normalizeGebruiker(n)))].sort().map(n => `<option value="${escKr(n)}">`).join('')}</datalist>
      </div>
    </div>
    ${item.afgevoerd ? `
    <div style="margin-top:8px;padding:8px 14px;background:rgba(150,150,150,0.1);border-radius:var(--radius);font-size:12px;color:var(--text-muted);">
      🏖 Dit artikel staat op pensioen — het komt niet meer terug in nieuwe keuringen.
    </div>` : ''}
    ${item.vorigeStatus ? `
    <div style="margin-top:8px;padding:8px 14px;background:var(--bg-input);border-radius:var(--radius);font-size:12px;color:var(--text-secondary);">
      Vorige keuring: <span class="badge ${item.vorigeStatus==='goedgekeurd'?'badge-green':'badge-red'}" style="font-size:11px;">
        ${item.vorigeStatus==='goedgekeurd'?'Goed':'Afkeur'} ${escKr(item.vorigeAfkeurcode||'')}
      </span>
    </div>` : ''}
  `, () => {
    const newOmschr  = document.getElementById('editOmschr').value;
    const prod       = store.products.find(p => p.omschrijving === newOmschr);
    const newStatus  = document.getElementById('editStatus').value;
    const oldStatus  = item.status;

    if (oldStatus !== newStatus && (oldStatus || newStatus)) {
      if (!k.auditLog) k.auditLog = [];
      k.auditLog.push({ actie: 'status_gewijzigd', item: item.omschrijving, van: oldStatus || 'onbeoordeeld', naar: newStatus || 'onbeoordeeld', datum: new Date().toISOString(), door: store.settings.keurmeester });
    }

    item.omschrijving = newOmschr;
    item.merk         = document.getElementById('editMerk').value || prod?.merk || item.merk;
    item.materiaal    = document.getElementById('editMateriaal').value || prod?.materiaal || item.materiaal;
    item.serienummer  = document.getElementById('editSerial').value;
    item.fabrJaar     = document.getElementById('editJaar').value || '';
    item.fabrMaand    = parseInt(document.getElementById('editMaand').value) || 0;
    item.inGebruik    = document.getElementById('editInGebruik')?.value || '';
    item.status       = newStatus;
    item.afkeurcode   = newStatus === 'afgekeurd' ? document.getElementById('editCode').value : '';
    item.opmerking    = document.getElementById('editOpm').value;
    item.gebruiker    = normalizeGebruiker(document.getElementById('editGebruiker').value);
    if (prod) { item.max_leeftijd = prod.max_leeftijd || item.max_leeftijd; item.norm = prod.norm || item.norm; }

    saveStore(store);
    sbUpsertKeuringItem(item, keuringId, k.klantId).catch(console.error);
    closeModal();
    toast('Item bijgewerkt');
    openKeuringDetail(keuringId);
  });
}

function showHistoriePopup(itemId, sn, omschrijving) {
  const historie = getHistorieVoorItemId(itemId, sn);
  const bodyHtml = `
    <div style="margin-bottom:12px;">
      <div style="font-family:monospace;font-size:16px;font-weight:700;color:var(--sg-lime);">${escKr(sn || '—')}</div>
      <div style="font-size:14px;color:var(--text-secondary);margin-top:4px;">${escKr(omschrijving)}</div>
      ${itemId ? `<div style="font-size:11px;color:var(--text-muted);margin-top:3px;">Artikel ID: <strong>${escKr(itemId)}</strong></div>` : ''}
    </div>
    ${historie.length === 0
      ? '<p style="color:var(--text-muted);text-align:center;padding:20px;">Geen keuringshistorie gevonden.</p>'
      : `<div style="max-height:300px;overflow-y:auto;">
          ${historie.map((r, idx) => `
            <div style="padding:10px 12px;border-radius:var(--radius);background:var(--bg-input);margin-bottom:8px;cursor:pointer;" onclick="closeModal();navigateTo('keuringen');setTimeout(()=>openKeuringDetail('${r.keuringId}'),50)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  ${idx === 0 ? '<span style="font-size:10px;background:var(--sg-green);color:white;padding:1px 6px;border-radius:10px;">Laatste</span>' : ''}
                  <strong style="font-size:13px;">${formatDate(r.datum)}</strong>
                  <span style="font-size:12px;color:var(--text-muted);">${escKr(r.certificaatNr)}</span>
                </div>
                <div>
                  ${r.afgevoerd ? '<span class="badge" style="background:var(--text-muted);color:white;font-size:10px;">🏖 Pensioen</span>' : ''}
                  ${r.status === 'goedgekeurd' ? '<span class="badge badge-green">Goedgekeurd</span>'
                    : r.status === 'afgekeurd' ? `<span class="badge badge-red">Afgekeurd ${r.afkeurcode ? '— ' + escKr(r.afkeurcode) : ''}</span>`
                    : r.status === 'pensioen'  ? '<span class="badge" style="background:var(--text-muted);color:white;">Pensioen</span>'
                    : '<span class="badge badge-orange">Onbeoordeeld</span>'}
                </div>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);">${escKr(r.klantNaam)} · ${escKr(r.keurmeester)}${r.gebruiker ? ' · Gebruiker: ' + escKr(r.gebruiker) : ''}</div>
              ${r.opmerking ? `<div style="font-size:12px;color:var(--warning);margin-top:4px;">Opmerking: ${escKr(r.opmerking)}</div>` : ''}
            </div>
          `).join('')}
        </div>`}
  `;
  showModal(`Keuringshistorie — ${escKr(omschrijving || sn)}`, bodyHtml, null);
  const footer = document.querySelector('#modalOverlay .modal-footer');
  if (footer) footer.innerHTML = `<button class="btn btn-primary" onclick="closeModal()">Sluiten</button>`;
}

function wijzigEigenaar(keuringId) {
  const k = store.keuringen.find(ke => ke.id === keuringId);
  if (!k) return;
  const klantOptions = store.klanten.map(kl => `<option value="${escKr(kl.id)}" ${kl.id === k.klantId ? 'selected' : ''}>${escKr(kl.bedrijf)}</option>`).join('');

  showModal('Eigenaar aanpassen', `
    <div style="margin-bottom:16px;padding:12px 14px;background:var(--bg-input);border-radius:var(--radius);font-size:13px;color:var(--text-secondary);">
      <strong>Huidige eigenaar:</strong> ${escKr(k.klantNaam || 'Onbekend')}<br>
      <span style="font-size:12px;color:var(--text-muted);">Certificaat: ${escKr(k.certificaatNr || '')}</span>
    </div>
    <div class="form-group">
      <label class="form-label">Nieuwe eigenaar <span style="color:var(--danger);">*</span></label>
      <select class="form-select" id="nieuweEigenaarSelect">
        <option value="">-- Selecteer klant --</option>
        ${klantOptions}
      </select>
    </div>
  `, () => {
    const nieuweKlantId = document.getElementById('nieuweEigenaarSelect').value;
    if (!nieuweKlantId) { toast('Selecteer een nieuwe eigenaar', 'error'); return; }
    const nieuweKlant = store.klanten.find(kl => kl.id === nieuweKlantId);
    if (!nieuweKlant) return;
    const oudeNaam = k.klantNaam;
    k.klantId  = nieuweKlantId;
    k.klantNaam = nieuweKlant.bedrijf;
    if (!k.auditLog) k.auditLog = [];
    k.auditLog.push({ actie: 'eigenaar_gewijzigd', van: oudeNaam, naar: nieuweKlant.bedrijf, datum: new Date().toISOString(), door: store.settings.keurmeester });
    saveStore(store);
    sbUpsertKeuring(k).catch(console.error);
    closeModal();
    toast('Eigenaar gewijzigd naar ' + nieuweKlant.bedrijf);
    openKeuringDetail(keuringId);
  });
}

function deleteKeuring(id) {
  if (!confirm('Weet je zeker dat je deze keuring wilt verwijderen?')) return;
  store.keuringen = store.keuringen.filter(k => k.id !== id);
  saveStore(store);
  sbDeleteKeuring(id).catch(console.error);
  toast('Keuring verwijderd');
  renderKeuringen(document.getElementById('pageContent'));
}

// ============================================================
// RECALL ZOEKEN
// ============================================================
