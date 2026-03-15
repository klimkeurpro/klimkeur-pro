// ============================================================
// supabase.js — alle schrijf-functies naar Supabase (upsert, delete, sync)
// ============================================================

// HELPERS
// ============================================================
function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

function toast(msg, type='success', duration=3000) {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast ' + (type==='warning' ? 'warn' : type);
  t.innerHTML = (type==='success'?'&#10003;':type==='error'?'&#10007;':'&#9888;') + ' ' + msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 300); }, duration);
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('nl-NL');
}





















function navigateTo(page) {
  // Sluit sidebar op mobiel bij navigeren
  if (window.innerWidth <= 768) closeSidebar();
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });
  const titles = {
    dashboard: 'Dashboard', klanten: 'Klanten', keurmeesters: 'Keurmeesters', producten: 'Productdatabase',
    keuringen: 'Keuringen', snzoeken: 'SN Zoeken', recall: 'Recall Zoeken', snref: 'SN Referentie', instellingen: 'Instellingen'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  renderPage();
}

function renderPage() {
  const el = document.getElementById('pageContent');
  switch(currentPage) {
    case 'dashboard': renderDashboard(el); break;
    case 'klanten': renderKlanten(el); setTimeout(laadAangemeldBadges, 300); break;
    case 'keurmeesters': renderKeurmeesters(el); break;
    case 'producten': renderProducten(el); break;
    case 'keuringen': renderKeuringen(el); break;
    case 'snzoeken': renderSNZoeken(el); break;
    case 'recall': renderRecallZoeken(el); break;
    case 'snref': renderSNRef(el); break;
    case 'instellingen': renderInstellingen(el); break;
  }
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard(el) {
  const s = store;
  const totalProducts = s.products.length;
  const totalKlanten = s.klanten.length;
  const totalKeuringen = s.keuringen.length;
  const afgekeurd = s.keuringen.reduce((sum, k) => sum + (k.items || []).filter(i => i.status === 'afgekeurd').length, 0);
  const goedgekeurd = s.keuringen.reduce((sum, k) => sum + (k.items || []).filter(i => i.status === 'goedgekeurd').length, 0);
  const merken = new Set(s.products.map(p => p.merk)).size;

  // Supabase verbindingsstatus banner
  let storageBanner = '';
  const isFromSupabase = store._fromSupabase;
  if (!isFromSupabase) {
    storageBanner = `
      <div style="background:rgba(243,156,18,0.12);border:1px solid var(--warning);border-radius:var(--radius-lg);padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:20px;">⚠️</span>
        <div>
          <div style="font-weight:600;color:var(--warning);">Offline modus</div>
          <div style="font-size:12px;color:var(--text-secondary);">Supabase niet bereikbaar. Data wordt geladen vanuit lokale cache.</div>
        </div>
      </div>
    `;
  }
  const backupBanner = storageBanner;

  el.innerHTML = `
    <div class="fade-in">
    ${backupBanner}
    <div class="stats-grid">
      <div class="stat-card clickable" onclick="navigateTo('producten')" title="Ga naar Producten">
        <div class="stat-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
        <div class="stat-info"><div class="stat-value">${totalProducts}</div><div class="stat-label">Producten</div></div>
      </div>
      <div class="stat-card clickable" onclick="navigateTo('klanten')" title="Ga naar Klanten">
        <div class="stat-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
        <div class="stat-info"><div class="stat-value">${totalKlanten}</div><div class="stat-label">Klanten</div></div>
      </div>
      <div class="stat-card clickable" onclick="navigateTo('keuringen')" title="Ga naar Keuringen">
        <div class="stat-icon orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
        <div class="stat-info"><div class="stat-value">${totalKeuringen}</div><div class="stat-label">Keuringen</div></div>
      </div>
      <div class="stat-card clickable" onclick="navigateTo('keuringen')" title="Ga naar Keuringen">
        <div class="stat-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
        <div class="stat-info"><div class="stat-value">${goedgekeurd}</div><div class="stat-label">Goedgekeurd</div></div>
      </div>
      <div class="stat-card clickable" onclick="navigateTo('keuringen')" title="Ga naar Keuringen">
        <div class="stat-icon red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
        <div class="stat-info"><div class="stat-value">${afgekeurd}</div><div class="stat-label">Afgekeurd</div></div>
      </div>
      <div class="stat-card clickable" onclick="navigateTo('producten')" title="Ga naar Producten">
        <div class="stat-icon purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></div>
        <div class="stat-info"><div class="stat-value">${merken}</div><div class="stat-label">Merken</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div class="card fade-in">
        <div class="card-header"><h3>Recente Keuringen</h3></div>
        <div class="card-body">
          ${s.keuringen.length === 0 ? '<p style="color:var(--text-muted);font-size:14px;">Nog geen keuringen uitgevoerd.</p>' :
            s.keuringen.slice(-5).reverse().map(k => `
              <div class="clickable" onclick="navigateTo('keuringen');setTimeout(()=>openKeuringDetail('${k.id}'),50)" style="display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid var(--border);font-size:13px;border-radius:4px;">
                <span><strong>${k.klantNaam || 'Onbekend'}</strong> — ${k.certificaatNr||''}</span>
                <span style="color:var(--text-secondary)">${formatDate(k.datum)} <span class="badge ${k.afgerond?'badge-green':'badge-orange'}" style="font-size:10px;">${k.afgerond?'Afgerond':'Lopend'}</span></span>
              </div>
            `).join('')}
        </div>
      </div>
      <div class="card fade-in">
        <div class="card-header"><h3>Producten per Materiaaltype (Top 10)</h3></div>
        <div class="card-body">
          ${(() => {
            const counts = {};
            s.products.forEach(p => { if(p.materiaal) counts[p.materiaal] = (counts[p.materiaal]||0)+1; });
            return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([m,c]) => `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="width:140px;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m}</span>
                <div style="flex:1;height:20px;background:var(--bg-input);border-radius:4px;overflow:hidden;">
                  <div style="height:100%;width:${(c/s.products.length*100*3).toFixed(0)}%;background:var(--sg-green);border-radius:4px;min-width:20px;display:flex;align-items:center;justify-content:flex-end;padding-right:6px;">
                    <span style="font-size:11px;color:white;font-weight:600;">${c}</span>
                  </div>
                </div>
              </div>
            `).join('');
          })()}
        </div>
      </div>
    </div>
    </div>
  `;
}

// ============================================================
// KLANTEN
// ============================================================
// ============================================================
// KEURMEESTERS PAGINA
// ============================================================
function renderKeurmeesters(el) {
  const kms = store.keurmeesters || [];
  el.innerHTML = `
    <div class="fade-in">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2 style="font-size:20px;">Keurmeesters</h2>
        <button class="btn btn-primary" onclick="openKeurmeesterModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:6px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Keurmeester toevoegen
        </button>
      </div>

      ${kms.length === 0 ? `
        <div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-muted);">
          Nog geen keurmeesters toegevoegd. Klik op "Keurmeester toevoegen" om te beginnen.
        </div></div>
      ` : `
        <div style="display:grid;gap:12px;">
          ${kms.map((km, i) => `
            <div class="card">
              <div class="card-body" style="display:flex;align-items:center;gap:20px;padding:16px 20px;">
                <div style="background:white;border:1px solid var(--border);border-radius:var(--radius);padding:10px;min-width:130px;text-align:center;height:64px;display:flex;align-items:center;justify-content:center;">
                  ${km.handtekening
                    ? `<img src="${km.handtekening}" style="max-height:52px;max-width:120px;">`
                    : `<span style="color:var(--text-muted);font-size:11px;">Geen handtekening</span>`}
                </div>
                <div style="flex:1;">
                  <div style="font-size:16px;font-weight:600;">${km.naam}</div>
                  ${store.settings.keurmeester === km.naam
                    ? `<span class="badge badge-green" style="font-size:11px;margin-top:4px;display:inline-block;">Standaard</span>`
                    : `<button class="btn btn-sm" style="margin-top:6px;font-size:11px;" onclick="setStandaardKeurmeester('${km.naam}')">Instellen als standaard</button>`}
                </div>
                <div style="display:flex;gap:8px;">
                  <button class="btn btn-sm" onclick="openKeurmeesterModal(${i})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Bewerken
                  </button>
                  <button class="btn btn-sm" style="color:var(--danger);border-color:var(--danger);" onclick="verwijderKeurmeester(${i})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;margin-right:4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    Verwijderen
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function setStandaardKeurmeester(naam) {
  store.settings.keurmeester = naam;
  saveStore(store);
  sbSaveSettings(store.settings).catch(console.error);
  toast(`${naam} ingesteld als standaard keurmeester`);
  renderKeurmeesters(document.getElementById('pageContent'));
}

function filterKlantDropdown() {
  const zoek = document.getElementById('klantZoek')?.value.toLowerCase() || '';
  const sel = document.getElementById('keuringKlant');
  if (!sel) return;
  const opties = [...sel.options];
  opties.forEach(opt => {
    if (!opt.value) return; // keep placeholder
    opt.style.display = opt.text.toLowerCase().includes(zoek) ? '' : 'none';
  });
  // Auto-select if only one match
  const zichtbaar = opties.filter(o => o.value && o.style.display !== 'none');
  if (zichtbaar.length === 1) {
    sel.value = zichtbaar[0].value;
    checkVorigeKeuring();
    updateCertNr();
  }
}
