// ============================================================
// instellingen.js — instellingen pagina, keurmeesters, afkeurcodes, branding
//
// Keurmeesters worden rechtstreeks beheerd in de keurmeesters
// tabel in Supabase. De oude JSON-blob in de instellingen tabel
// wordt niet meer gebruikt (sbSaveKeurmeesters is uitgefaseerd).
// ============================================================

// Lokale HTML escape — voorkomt dat data uit HTML-attributen breekt
function escI(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInstellingen(el) {
  const s = store.settings;
  el.innerHTML = `
    <div class="fade-in">
      <div class="tabs">
        <div class="tab active"  onclick="switchSettingsTab(this,'general')">Algemeen</div>
        <div class="tab"         onclick="switchSettingsTab(this,'handtekening')">Mijn handtekening</div>
        <div class="tab"         onclick="switchSettingsTab(this,'certificaat')">Certificaat</div>
        <div class="tab"         onclick="switchSettingsTab(this,'database')">Database</div>
      </div>

      <!-- ═══════════════════════════════════════════════
           TAB 1 — ALGEMEEN
      ═══════════════════════════════════════════════ -->
      <div id="settingsGeneral" class="card" style="margin-bottom:20px;">
        <div class="card-header"><h3>Bedrijfsgegevens</h3></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Bedrijfsnaam</label>
              <input class="form-input" id="setBedrijf" value="${escI(s.bedrijfsnaam||'')}">
            </div>
            <div class="form-group">
              <label class="form-label">KvK Nummer</label>
              <input class="form-input" id="setKvk" value="${escI(s.kvk||'')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Adres</label>
              <input class="form-input" id="setAdres" value="${escI(s.adres||'')}">
            </div>
            <div class="form-group">
              <label class="form-label">Telefoon</label>
              <input class="form-input" id="setTel" value="${escI(s.telefoon||'')}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" id="setEmail" value="${escI(s.email||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">Standaard keurmeester</label>
            <select class="form-select" id="setKeurmeester">
              ${(store.keurmeesters||[]).map(k=>`<option value="${escI(k.naam)}" ${s.keurmeester===k.naam?'selected':''}>${escI(k.naam)}</option>`).join('')}
            </select>
          </div>
          <div style="margin-top:16px;">
            <label class="form-label">Bedrijfslogo</label>
            <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;min-width:200px;min-height:60px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px;">
              ${s.logo ? `<img src="${escI(s.logo)}" style="max-height:60px;max-width:180px;object-fit:contain;">` : '<span style="color:var(--text-muted);font-size:13px;">Geen logo</span>'}
            </div>
            <br>
            <input type="file" id="logoUpload" accept="image/*" style="font-size:12px;" onchange="uploadLogo(this)">
          </div>
          <button class="btn btn-primary" style="margin-top:20px;" onclick="saveSettings()">Opslaan</button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════
           TAB 2 — MIJN HANDTEKENING
      ═══════════════════════════════════════════════ -->
      <div id="settingsHandtekening" class="card" style="display:none;margin-bottom:20px;">
        <div class="card-header"><h3>Mijn handtekening</h3></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px;">
            Je handtekening verschijnt op alle certificaten die jij ondertekent.
            Elke keurmeester heeft zijn eigen handtekening.
          </p>

          <div style="margin-bottom:20px;">
            <label class="form-label">Huidige handtekening</label>
            <div id="handtekeningPreviewWrap" style="background:white;border:1px solid var(--border);border-radius:var(--radius);padding:16px;text-align:center;min-height:80px;display:flex;align-items:center;justify-content:center;max-width:320px;">
              ${_getEigenHandtekening()
                ? `<img id="handtekeningPreviewImg" src="${escI(_getEigenHandtekening())}" style="max-height:70px;max-width:280px;">`
                : `<span id="handtekeningLeeg" style="color:var(--text-muted);font-size:13px;">Nog geen handtekening ingesteld</span>`}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Nieuwe handtekening uploaden</label>
            <input type="file" id="handtekeningUpload" accept="image/*" style="font-size:13px;" onchange="previewEigenHandtekening(this)">
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
              PNG met transparante achtergrond werkt het mooist op het certificaat.
            </div>
          </div>

          <div id="handtekeningNieuwPreview" style="display:none;margin-bottom:16px;">
            <label class="form-label">Voorbeeld nieuw</label>
            <div style="background:white;border:1px solid var(--sg-green);border-radius:var(--radius);padding:16px;text-align:center;max-width:320px;">
              <img id="handtekeningNieuwImg" style="max-height:70px;max-width:280px;">
            </div>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-primary" id="handtekeningOpslaanBtn" onclick="slaEigenHandtekeningOp()" style="display:none;">
              Handtekening opslaan
            </button>
            ${_getEigenHandtekening() ? `
            <button class="btn" style="color:var(--danger);border-color:var(--danger);" onclick="verwijderEigenHandtekening()">
              Handtekening verwijderen
            </button>` : ''}
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════
           TAB 3 — CERTIFICAAT
      ═══════════════════════════════════════════════ -->
      <div id="settingsCertificaat" class="card" style="display:none;margin-bottom:20px;">
        <div class="card-header"><h3>Certificaat Instellingen</h3></div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Certificaat tekst (boven)</label>
            <textarea class="form-textarea" id="setCertTekst" rows="5">${escI(s.certificaatTekst||'')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Certificaat tekst (onder)</label>
            <textarea class="form-textarea" id="setCertTekstOnder" rows="3" placeholder="Optionele tekst onder het certificaat">${escI(s.certificaatTekstOnder||'')}</textarea>
          </div>
          <button class="btn btn-primary" style="margin-top:8px;margin-bottom:24px;" onclick="saveCertSettings()">Teksten opslaan</button>

          <div class="form-group" style="margin-bottom:20px;">
            <label class="form-label" style="margin-bottom:10px;display:block;">Certificaat kolommen</label>
            <div style="display:flex;gap:16px;flex-wrap:wrap;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
                <input type="checkbox" id="certColMateriaal" ${s.certColumns?.materiaal ? 'checked' : ''}
                  onchange="store.settings.certColumns.materiaal=this.checked;saveStore(store);sbSlaInstellingenOp(store.settings).catch(console.error);toast('Opgeslagen');">
                Materiaal
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
                <input type="checkbox" id="certColEnNorm" ${s.certColumns?.enNorm ? 'checked' : ''}
                  onchange="store.settings.certColumns.enNorm=this.checked;saveStore(store);sbSlaInstellingenOp(store.settings).catch(console.error);toast('Opgeslagen');">
                EN-norm
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
                <input type="checkbox" id="certColBreuksterkte" ${s.certColumns?.breuksterkte ? 'checked' : ''}
                  onchange="store.settings.certColumns.breuksterkte=this.checked;saveStore(store);sbSlaInstellingenOp(store.settings).catch(console.error);toast('Opgeslagen');">
                Breuksterkte
              </label>
            </div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:6px;">Gebruiker, Opmerking en In gebruik worden automatisch verborgen als ze leeg zijn.</div>
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <label class="form-label" style="margin:0;">Afkeurcodes</label>
              <button class="btn btn-sm btn-primary" onclick="openAfkeurcodeModal()">+ Toevoegen</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;font-size:13px;" id="afkeurcodesGrid">
              ${getAfkeurcodes().map((c, i) => `
                <div style="padding:6px 10px;background:var(--bg-input);border-radius:var(--radius);display:flex;gap:8px;align-items:center;justify-content:space-between;">
                  <div style="display:flex;gap:8px;">
                    <span style="color:var(--sg-green);font-weight:700;min-width:24px;">${escI(c.code)}</span>
                    <span>${escI(c.tekst)}</span>
                  </div>
                  <div style="display:flex;gap:2px;">
                    <button class="btn-icon" title="Bewerken" onclick="openAfkeurcodeModal(${i})">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon" title="Verwijderen" onclick="deleteAfkeurcode(${i})">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════
           TAB 4 — DATABASE
      ═══════════════════════════════════════════════ -->
      <div id="settingsDatabase" class="card" style="display:none;margin-bottom:20px;">
        <div class="card-header"><h3>Database &amp; Backup</h3></div>
        <div class="card-body">

          <div style="margin-bottom:24px;">
            <h4 style="font-size:13px;font-weight:700;color:var(--sg-green);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;">Productendatabase</h4>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
              Exporteer de productendatabase als Excel om te bewerken.
              Importeer het bestand daarna terug om de database bij te werken.
            </p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
              <button class="btn btn-sm" onclick="exportProductenExcel()">↓ Excel downloaden (.xlsx)</button>
            </div>
            <label class="btn btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              ↑ Excel importeren
              <input type="file" accept=".xlsx,.xls,.csv" style="display:none;" onchange="importProductenExcel(this)">
            </label>
            <div style="margin-top:8px;font-size:11px;color:var(--text-muted);">Let op: importeren vervangt de volledige productendatabase (${store.products.length} producten).</div>
          </div>

          <div style="border-top:1px solid var(--border);margin-bottom:24px;"></div>

          <div style="margin-bottom:24px;">
            <h4 style="font-size:13px;font-weight:700;color:var(--sg-green);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;">Historische certificaten importeren</h4>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
              Upload een certificaat-Excel uit het oude systeem.
            </p>
            <div style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;">
              <div>
                <input type="file" id="certImportFile" accept=".xlsx,.xls" style="font-size:12px;">
                <button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="importCertificaatExcel()">
                  Importeer certificaat Excel
                </button>
              </div>
            </div>
          </div>

          <div style="border-top:1px solid var(--border);margin-bottom:24px;"></div>

          <div style="margin-bottom:24px;">
            <h4 style="font-size:13px;font-weight:700;color:var(--sg-green);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;">Noodkopie downloaden</h4>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
              Download een kopie van alle data als JSON-bestand.
            </p>
            <button class="btn btn-sm" onclick="exportAllData()">↓ Download backup (JSON)</button>
          </div>

          <div style="border-top:1px solid var(--border);margin-bottom:24px;"></div>

          <div style="margin-bottom:24px;">
            <h4 style="font-size:13px;font-weight:700;color:var(--sg-green);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;">Klanten exporteren</h4>
            <button class="btn btn-sm" onclick="exportKlantenExcel()">↓ Klanten als Excel (.xlsx)</button>
          </div>

          <div style="border-top:1px solid var(--border);padding-top:20px;">
            <h4 style="font-size:13px;font-weight:700;color:var(--danger);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Gevaarzone</h4>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">Herlaadt alle data vanuit Supabase.</p>
            <button class="btn btn-danger btn-sm" onclick="resetAllData()">Data herladen vanuit Supabase</button>
          </div>

        </div>
      </div>

    </div>
  `;
}

// ============================================================
// HANDTEKENING HULPFUNCTIES
// ============================================================

// Geeft de handtekening van de ingelogde keurmeester terug
function _getEigenHandtekening() {
  if (!store || !store.keurmeesters || !store.settings.keurmeester) return null;
  const km = store.keurmeesters.find(k => k.naam === store.settings.keurmeester);
  return km?.handtekening || null;
}

let _nieuweHandtekeningData = null;

function previewEigenHandtekening(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _nieuweHandtekeningData = e.target.result;
    const preview = document.getElementById('handtekeningNieuwPreview');
    const img     = document.getElementById('handtekeningNieuwImg');
    const btn     = document.getElementById('handtekeningOpslaanBtn');
    if (preview) preview.style.display = 'block';
    if (img)     img.src = e.target.result;
    if (btn)     btn.style.display = '';
  };
  reader.readAsDataURL(file);
}

async function slaEigenHandtekeningOp() {
  if (!_nieuweHandtekeningData) return;
  if (!_currentUser) { toast('Niet ingelogd', 'error'); return; }

  const btn = document.getElementById('handtekeningOpslaanBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Opslaan...'; }

  try {
    // Schrijf naar keurmeesters tabel op basis van auth_user_id
    const { error } = await sb
      .from('keurmeesters')
      .update({ handtekening: _nieuweHandtekeningData })
      .eq('auth_user_id', _currentUser.id);

    if (error) throw error;

    // Ook in lokale store bijwerken
    if (store.keurmeesters) {
      const km = store.keurmeesters.find(k => k.naam === store.settings.keurmeester);
      if (km) km.handtekening = _nieuweHandtekeningData;
      saveStore(store);
    }

    _nieuweHandtekeningData = null;
    toast('Handtekening opgeslagen');
    // Tab herladen zodat preview bijgewerkt is
    renderInstellingen(document.getElementById('pageContent'));
    switchSettingsTab(document.querySelector('.tab:nth-child(2)'), 'handtekening');

  } catch(err) {
    console.error('Handtekening opslaan fout:', err);
    toast('Fout bij opslaan handtekening', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Handtekening opslaan'; }
  }
}

async function verwijderEigenHandtekening() {
  if (!confirm('Handtekening verwijderen?')) return;
  if (!_currentUser) { toast('Niet ingelogd', 'error'); return; }

  try {
    const { error } = await sb
      .from('keurmeesters')
      .update({ handtekening: null })
      .eq('auth_user_id', _currentUser.id);

    if (error) throw error;

    if (store.keurmeesters) {
      const km = store.keurmeesters.find(k => k.naam === store.settings.keurmeester);
      if (km) km.handtekening = null;
      saveStore(store);
    }

    toast('Handtekening verwijderd');
    renderInstellingen(document.getElementById('pageContent'));
    switchSettingsTab(document.querySelector('.tab:nth-child(2)'), 'handtekening');

  } catch(err) {
    console.error('Handtekening verwijderen fout:', err);
    toast('Fout bij verwijderen handtekening', 'error');
  }
}

// ============================================================
// TABS
// ============================================================
function switchSettingsTab(tab, section) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  document.getElementById('settingsGeneral').style.display      = section==='general'      ? '' : 'none';
  document.getElementById('settingsHandtekening').style.display = section==='handtekening' ? '' : 'none';
  document.getElementById('settingsCertificaat').style.display  = section==='certificaat'  ? '' : 'none';
  document.getElementById('settingsDatabase').style.display     = section==='database'     ? '' : 'none';
}

// ============================================================
// OPSLAAN
// ============================================================
function saveSettings() {
  store.settings.bedrijfsnaam = document.getElementById('setBedrijf').value;
  store.settings.kvk          = document.getElementById('setKvk').value;
  store.settings.adres        = document.getElementById('setAdres').value;
  store.settings.telefoon     = document.getElementById('setTel').value;
  store.settings.email        = document.getElementById('setEmail').value;
  store.settings.keurmeester  = document.getElementById('setKeurmeester').value;
  saveStore(store);
  sbSlaInstellingenOp(store.settings).catch(console.error);
  toast('Instellingen opgeslagen');
}

function saveCertSettings() {
  store.settings.certificaatTekst      = document.getElementById('setCertTekst').value;
  store.settings.certificaatTekstOnder = document.getElementById('setCertTekstOnder')?.value || '';
  saveStore(store);
  sbSlaInstellingenOp(store.settings).catch(console.error);
  toast('Certificaat teksten opgeslagen');
}

// ============================================================
// LOGO UPLOAD (bedrijfslogo — apart van handtekening)
// ============================================================
function uploadLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    store.settings.logo = e.target.result;
    saveStore(store);
    sbSlaInstellingenOp(store.settings).catch(console.error);
    toast('Logo bijgewerkt');
    renderInstellingen(document.getElementById('pageContent'));
  };
  reader.readAsDataURL(file);
}

// Verouderde functie — blijft bestaan zodat andere aanroepen niet crashen
function uploadImage(type, input) {
  if (type === 'logo') { uploadLogo(input); return; }
}

// ============================================================
// KEURMEESTER MODAL — schrijft rechtstreeks naar de keurmeesters tabel
// ============================================================
function openKeurmeesterModal(idx) {
  const km = idx !== undefined ? (store.keurmeesters||[])[idx] : null;
  showModal(km ? 'Keurmeester Bewerken' : 'Nieuwe Keurmeester', `
    <input type="hidden" id="kmIdx" value="${idx !== undefined ? idx : -1}">
    <div class="form-group">
      <label class="form-label">Naam</label>
      <input class="form-input" id="kmNaam" value="${escI(km?.naam || '')}" placeholder="Volledige naam">
    </div>
    ${idx === undefined ? `
    <div class="form-group">
      <label class="form-label">E-mailadres</label>
      <input class="form-input" type="email" id="kmEmail" placeholder="naam@bedrijf.nl" autocomplete="off">
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">De keurmeester ontvangt een uitnodigingsmail om in te loggen.</div>
    </div>
    <div id="kmUitnodigingStatus" style="font-size:13px;margin-top:4px;"></div>
    ` : `
    <div class="form-group">
      <label class="form-label">E-mailadres</label>
      <input class="form-input" type="email" id="kmEmail" value="${escI(km?.email || '')}" placeholder="naam@bedrijf.nl" disabled style="opacity:0.6;">
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">E-mailadres kan niet worden gewijzigd.</div>
    </div>
    `}
  `, () => {
    const i = parseInt(document.getElementById('kmIdx').value);
    const naam = document.getElementById('kmNaam').value.trim();
    if (!naam) { toast('Vul een naam in', 'error'); return; }

    if (i >= 0) {
      // ── BEWERKEN — schrijf naar keurmeesters tabel ──
      bewerkKeurmeester(i, naam);
    } else {
      // ── NIEUW — uitnodiging versturen ──
      const email = document.getElementById('kmEmail')?.value?.trim();
      if (!email) { toast('Vul een e-mailadres in', 'error'); return; }
      if ((store.keurmeesters||[]).some(k => k.naam === naam)) { toast('Keurmeester bestaat al', 'error'); return; }
      verstuurKeurmeesterUitnodiging(naam, email);
    }
  });
}

// ============================================================
// KEURMEESTER BEWERKEN — rechtstreeks in de database
// ============================================================
async function bewerkKeurmeester(idx, nieuweNaam) {
  const km = (store.keurmeesters||[])[idx];
  if (!km || !km._id) {
    toast('Kan keurmeester niet bijwerken — geen database ID', 'error');
    return;
  }

  try {
    const { error } = await sb
      .from('keurmeesters')
      .update({ naam: nieuweNaam })
      .eq('id', km._id);

    if (error) throw error;

    // Lokale store bijwerken
    const oudeNaam = km.naam;
    km.naam = nieuweNaam;

    // Als dit de actieve keurmeester is, ook settings bijwerken
    if (oudeNaam === store.settings.keurmeester) {
      store.settings.keurmeester = nieuweNaam;
      if (_currentUser) {
        sb.auth.updateUser({ data: { keurmeester_naam: nieuweNaam } }).catch(console.error);
      }
      const nm = document.getElementById('sidebarUserNaam');
      if (nm) nm.textContent = nieuweNaam;
    }

    saveStore(store);
    closeModal();
    toast('Keurmeester bijgewerkt');
    navigateTo('keurmeesters');

  } catch(err) {
    console.error('Keurmeester bewerken fout:', err);
    toast('Fout bij bijwerken keurmeester', 'error');
  }
}

// ============================================================
// KEURMEESTER UITNODIGEN
// ============================================================
// Browser doet niks meer aan de database — de Edge Function
// 'quick-action' regelt alles: uitnodiging versturen + rij in
// keurmeesters-tabel + dubbel-detectie. Eén plek, één waarheid.
// ============================================================
async function verstuurKeurmeesterUitnodiging(naam, email) {
  const statusEl = document.getElementById('kmUitnodigingStatus');
  if (statusEl) {
    statusEl.textContent = 'Uitnodiging versturen...';
    statusEl.style.color = 'var(--text-muted)';
  }

  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error('Niet ingelogd');

    const res = await fetch(`${SUPABASE_URL}/functions/v1/quick-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email,
        klant_naam: naam,
        rol: 'keurmeester',
        redirect_to: 'https://klimkeurpro.github.io/klimkeur-pro/',
      }),
    });

    const result = await res.json();

    if (!res.ok || result.error) {
      const melding = result.error || 'Onbekende fout';
      if (statusEl) {
        statusEl.textContent = '⚠ ' + melding;
        statusEl.style.color = 'var(--danger)';
      }
      toast(melding, 'error', 6000);
      return;
    }

    // Succes — herlaad de keurmeesters uit Supabase zodat de lijst klopt
    toast(`Uitnodiging verstuurd naar ${email}`, 'success');
    closeModal();
    if (typeof loadFromSupabase === 'function') {
      await loadFromSupabase();
    }
    navigateTo('keurmeesters');

  } catch(e) {
    console.error('Uitnodiging keurmeester fout:', e);
    if (statusEl) {
      statusEl.textContent = 'Fout bij versturen uitnodiging: ' + (e.message || e);
      statusEl.style.color = 'var(--danger)';
    }
    toast('Fout bij versturen uitnodiging', 'error');
  }
}

// ============================================================
// KEURMEESTER VERWIJDEREN — uit de database
// ============================================================
async function verwijderKeurmeester(idx) {
  const km = (store.keurmeesters||[])[idx];
  if (!km) return;
  if (!confirm(`Keurmeester "${km.naam}" verwijderen?`)) return;

  // Verwijder uit database als we een _id hebben
  if (km._id) {
    try {
      const { error } = await sb
        .from('keurmeesters')
        .delete()
        .eq('id', km._id);

      if (error) {
        console.error('Keurmeester verwijderen fout:', error);
        toast('Fout bij verwijderen in database', 'error');
        return;
      }
    } catch(err) {
      console.error('Keurmeester verwijderen fout:', err);
      toast('Fout bij verwijderen', 'error');
      return;
    }
  }

  // Lokale store bijwerken
  store.keurmeesters.splice(idx, 1);
  if (store.settings.keurmeester === km.naam && store.keurmeesters.length > 0) {
    store.settings.keurmeester = store.keurmeesters[0].naam;
  }
  saveStore(store);
  toast('Keurmeester verwijderd');
  navigateTo('keurmeesters');
}

// ============================================================
// AFKEURCODES
// ============================================================
function openAfkeurcodeModal(idx) {
  const codes = getAfkeurcodes();
  const c = idx !== undefined ? codes[idx] : null;
  showModal(c ? 'Afkeurcode Bewerken' : 'Nieuwe Afkeurcode', `
    <input type="hidden" id="afkeurIdx" value="${idx !== undefined ? idx : -1}">
    <div class="form-row">
      <div class="form-group" style="max-width:100px;">
        <label class="form-label">Code</label>
        <input class="form-input" id="afkeurCode" value="${escI(c?.code || '')}" placeholder="Nr." ${c ? 'readonly style="opacity:0.7;"' : ''}>
      </div>
      <div class="form-group">
        <label class="form-label">Omschrijving</label>
        <input class="form-input" id="afkeurTekst" value="${escI(c?.tekst || '')}" placeholder="Omschrijving van de afkeurcode">
      </div>
    </div>
  `, () => {
    const i = parseInt(document.getElementById('afkeurIdx').value);
    const code = document.getElementById('afkeurCode').value.trim();
    const tekst = document.getElementById('afkeurTekst').value.trim();
    if (!code || !tekst) { toast('Vul code en omschrijving in', 'error'); return; }
    if (!store.afkeurcodes) store.afkeurcodes = JSON.parse(JSON.stringify(CERT_INFO.afkeurcodes));
    if (i >= 0) {
      store.afkeurcodes[i] = { code, tekst };
    } else {
      if (store.afkeurcodes.some(c => c.code === code)) { toast('Code bestaat al', 'error'); return; }
      store.afkeurcodes.push({ code, tekst });
    }
    saveStore(store);
    sbSaveAfkeurcodes(store.afkeurcodes).catch(console.error);
    closeModal();
    toast(i >= 0 ? 'Afkeurcode bijgewerkt' : 'Afkeurcode toegevoegd');
    renderInstellingen(document.getElementById('pageContent'));
    switchSettingsTab(document.querySelector('.tab:nth-child(3)'), 'certificaat');
  });
}

function deleteAfkeurcode(idx) {
  if (!confirm('Afkeurcode verwijderen?')) return;
  if (!store.afkeurcodes) store.afkeurcodes = JSON.parse(JSON.stringify(CERT_INFO.afkeurcodes));
  store.afkeurcodes.splice(idx, 1);
  saveStore(store);
  sbSaveAfkeurcodes(store.afkeurcodes).catch(console.error);
  toast('Afkeurcode verwijderd');
  renderInstellingen(document.getElementById('pageContent'));
  switchSettingsTab(document.querySelector('.tab:nth-child(3)'), 'certificaat');
}
