'use strict';

// HTML escape hulpfunctie
function escB(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// bedrijven.js — Platform-admin pagina voor bedrijvenbeheer
// ============================================================

async function renderBedrijven(el) {
  if (!_isPlatformAdmin) {
    el.innerHTML = '<div class="card"><div class="card-body">Geen toegang.</div></div>';
    return;
  }

  el.innerHTML = `
    <div class="fade-in">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div>
          <h2 style="font-size:18px;font-weight:700;">Bedrijven</h2>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">Alle keuringsbedrijven op het platform</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openNieuwBedrijfModal()">+ Nieuw bedrijf</button>
      </div>
      <div id="bedrijvenLijst">
        <div style="color:var(--text-muted);font-size:13px;">Laden...</div>
      </div>
    </div>
  `;

  await laadBedrijvenLijst();
}

async function laadBedrijvenLijst() {
  const container = document.getElementById('bedrijvenLijst');
  if (!container) return;

  try {
    const { data, error } = await sb
      .from('bedrijven')
      .select('*')
      .order('naam', { ascending: true });

    if (error) {
      container.innerHTML = `<div style="color:var(--danger);">Fout bij laden: ${escB(error.message)}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted);font-size:13px;">Nog geen bedrijven aangemaakt.</div>`;
      return;
    }

    container.innerHTML = data.map(b => `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-body" style="display:flex;align-items:center;gap:16px;">
          <div style="width:52px;height:52px;background:var(--bg-input);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
            ${b.logo_url
              ? `<img src="${escB(b.logo_url)}" style="max-width:48px;max-height:48px;object-fit:contain;">`
              : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`
            }
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:15px;">${escB(b.naam || '—')}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${escB(b.kvk || '')}${b.kvk && b.email ? ' · ' : ''}${escB(b.email || '')}</div>
            <div style="display:flex;gap:6px;margin-top:6px;align-items:center;">
              <div style="width:14px;height:14px;border-radius:50%;background:${escB(b.kleur_primair || '#5B9A2F')};border:1px solid var(--border);"></div>
              <div style="width:14px;height:14px;border-radius:50%;background:${escB(b.kleur_primair_donker || '#3D7A1A')};border:1px solid var(--border);"></div>
              <div style="width:14px;height:14px;border-radius:50%;background:${escB(b.kleur_accent || '#8BC53F')};border:1px solid var(--border);"></div>
              <span style="font-size:11px;color:var(--text-muted);margin-left:4px;">huisstijl</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0;">
            <button class="btn btn-sm" onclick="openBedrijfBewerken('${escB(b.id)}')">Bewerken</button>
            <button class="btn btn-sm" style="color:var(--danger);border-color:var(--danger);" onclick="verwijderBedrijf('${escB(b.id)}','${escB(b.naam)}')">Verwijderen</button>
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger);">Onverwachte fout: ${escB(err.message)}</div>`;
  }
}

function openNieuwBedrijfModal() {
  toonBedrijfModal(null);
}

async function openBedrijfBewerken(bedrijfId) {
  try {
    const { data, error } = await sb
      .from('bedrijven')
      .select('*')
      .eq('id', bedrijfId)
      .maybeSingle();

    if (error || !data) { toast('Bedrijf niet gevonden', 'error'); return; }
    toonBedrijfModal(data);
  } catch (err) {
    toast('Fout bij laden bedrijf', 'error');
  }
}

// ============================================================
// BEDRIJF MODAL
// ============================================================
function toonBedrijfModal(bedrijf) {
  const isNieuw = !bedrijf;
  const b = bedrijf || {};

  // cert_kolommen parsen (staat als JSON-string in de database)
  let certCols = { materiaal: false, enNorm: false, breuksterkte: false };
  if (b.cert_kolommen) {
    try { certCols = { ...certCols, ...JSON.parse(b.cert_kolommen) }; }
    catch(e) { console.warn('cert_kolommen kon niet worden geparsed:', e); }
  }

  showModal(isNieuw ? 'Nieuw bedrijf' : `${escB(b.naam)} bewerken`, `
    <div style="display:flex;flex-direction:column;gap:16px;">

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Bedrijfsnaam <span style="color:var(--danger)">*</span></label>
          <input class="form-input" id="bNaam" value="${escB(b.naam || '')}" placeholder="Naam van het keuringsbedrijf">
        </div>
        <div class="form-group">
          <label class="form-label">KvK nummer</label>
          <input class="form-input" id="bKvk" value="${escB(b.kvk || '')}" placeholder="12345678">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">E-mailadres</label>
          <input class="form-input" id="bEmail" type="email" value="${escB(b.email || '')}" placeholder="info@bedrijf.nl">
        </div>
        <div class="form-group">
          <label class="form-label">Telefoon</label>
          <input class="form-input" id="bTelefoon" value="${escB(b.telefoon || '')}" placeholder="+31 6 12345678">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Adres</label>
        <input class="form-input" id="bAdres" value="${escB(b.adres || '')}" placeholder="Straat 1, 1234 AB Stad">
      </div>

      <div style="border-top:1px solid var(--border);padding-top:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;">Huisstijl</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Primaire kleur</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="color" id="bKleurPrimair" value="${b.kleur_primair || '#5B9A2F'}" style="width:44px;height:36px;border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;padding:2px;">
              <input class="form-input" id="bKleurPrimairHex" value="${b.kleur_primair || '#5B9A2F'}" style="font-family:monospace;" oninput="document.getElementById('bKleurPrimair').value=this.value">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Donkere kleur</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="color" id="bKleurDonker" value="${b.kleur_primair_donker || '#3D7A1A'}" style="width:44px;height:36px;border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;padding:2px;">
              <input class="form-input" id="bKleurDonkerHex" value="${b.kleur_primair_donker || '#3D7A1A'}" style="font-family:monospace;" oninput="document.getElementById('bKleurDonker').value=this.value">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Accentkleur</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="color" id="bKleurAccent" value="${b.kleur_accent || '#8BC53F'}" style="width:44px;height:36px;border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;padding:2px;">
              <input class="form-input" id="bKleurAccentHex" value="${b.kleur_accent || '#8BC53F'}" style="font-family:monospace;" oninput="document.getElementById('bKleurAccent').value=this.value">
            </div>
          </div>
        </div>
        <div class="form-group" style="margin-top:8px;">
          <label class="form-label">Logo URL</label>
          <input class="form-input" id="bLogoUrl" value="${escB(b.logo_url || '')}" placeholder="https://... (directe link naar afbeelding)">
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Gebruik een directe link naar een afbeelding (PNG of SVG aanbevolen)</div>
        </div>
      </div>

      <!-- ============================================================
           CERTIFICAAT-INSTELLINGEN
           ============================================================ -->
      <div style="border-top:1px solid var(--border);padding-top:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;">Certificaat</div>

        <div class="form-group">
          <label class="form-label">Certificaat tekst (boven)</label>
          <textarea class="form-textarea" id="bCertKop" rows="4" placeholder="Tekst die boven de productenlijst op het certificaat verschijnt">${escB(b.cert_koptekst || '')}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Certificaat tekst (onder)</label>
          <textarea class="form-textarea" id="bCertVoet" rows="3" placeholder="Optionele tekst onderaan het certificaat">${escB(b.cert_voettekst || '')}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label" style="margin-bottom:10px;display:block;">Certificaat kolommen</label>
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
              <input type="checkbox" id="bCertColMateriaal" ${certCols.materiaal ? 'checked' : ''}>
              Materiaal
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
              <input type="checkbox" id="bCertColEnNorm" ${certCols.enNorm ? 'checked' : ''}>
              EN-norm
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
              <input type="checkbox" id="bCertColBreuksterkte" ${certCols.breuksterkte ? 'checked' : ''}>
              Breuksterkte
            </label>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px;">Gebruiker, Opmerking en In gebruik worden automatisch verborgen als ze leeg zijn.</div>
        </div>
      </div>

      <!-- ============================================================
           PRODUCTDATABASE — alleen bij bestaande bedrijven
           ============================================================ -->
      ${isNieuw ? '' : `
      <div style="border-top:1px solid var(--border);padding-top:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;">Productdatabase</div>

        <div id="bProductenInfo" style="background:var(--bg-input);border-radius:var(--radius);padding:12px 14px;margin-bottom:10px;font-size:12px;color:var(--text-secondary);">
          Aantal producten ophalen…
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <label class="btn btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Excel importeren
            <input type="file" accept=".xlsx,.xls,.csv" style="display:none;"
              onchange="importProductenExcelVoorBedrijf(this, '${escB(b.id)}', '${escB(b.naam || '')}'); setTimeout(()=>laadProductAantalInModal('${escB(b.id)}'), 1500);">
          </label>

          <button type="button" class="btn btn-sm"
            onclick="exportProductenVoorBedrijf('${escB(b.id)}', '${escB(b.naam || '')}')">
            ↓ Excel exporteren
          </button>
        </div>

        <div style="font-size:11px;color:var(--text-muted);margin-top:8px;">
          Importeren vervangt de volledige productendatabase van dit bedrijf.
          Eigen toevoegingen door het bedrijf gaan daarbij verloren — exporteer eerst als je ze wilt bewaren.
        </div>
      </div>
      `}

      <!-- ============================================================
           KEURMEESTERS SECTIE
           ============================================================ -->
      <div style="border-top:1px solid var(--border);padding-top:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;">Keurmeesters</div>

        ${isNieuw ? '' : `
        <div id="bKmLijst" style="margin-bottom:12px;">
          <div style="font-size:12px;color:var(--text-muted);">Laden...</div>
        </div>
        `}

        <div style="background:var(--bg-input);border-radius:var(--radius);padding:14px;">
          <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--text-secondary);">
            ${isNieuw ? 'Eerste keurmeester uitnodigen' : 'Nieuwe keurmeester uitnodigen'}
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Naam</label>
              <input class="form-input" id="bKmNaam" placeholder="Naam Achternaam">
            </div>
            <div class="form-group">
              <label class="form-label">E-mailadres</label>
              <input class="form-input" id="bKmEmail" type="email" placeholder="keurmeester@bedrijf.nl">
            </div>
          </div>
          <div id="bKmStatus" style="font-size:12px;margin-top:4px;min-height:18px;"></div>
        </div>
      </div>

      <input type="hidden" id="bId" value="${escB(b.id || '')}">
    </div>
  `, () => slaaBedrijfOp(isNieuw));

  // Bij bewerken: keurmeesters + productaantal laden
  if (!isNieuw && b.id) {
    setTimeout(() => {
      laadKmLijstInModal(b.id);
      laadProductAantalInModal(b.id);
    }, 100);
  }
}

// ============================================================
// PRODUCT AANTAL TONEN IN MODAL
// ============================================================
async function laadProductAantalInModal(bedrijfId) {
  const el = document.getElementById('bProductenInfo');
  if (!el) return;

  try {
    const { count, error } = await sb
      .from('producten')
      .select('id', { count: 'exact', head: true })
      .eq('bedrijf_id', bedrijfId);

    if (error) {
      el.innerHTML = `<span style="color:var(--danger);">Fout bij ophalen aantal: ${escB(error.message)}</span>`;
      return;
    }

    const aantal = typeof count === 'number' ? count : 0;
    el.innerHTML = aantal === 0
      ? `<strong>0 producten</strong> — dit bedrijf heeft nog geen productdatabase. Importeer een Excel om te beginnen.`
      : `<strong>${aantal} ${aantal === 1 ? 'product' : 'producten'}</strong> in de database voor dit bedrijf.`;

  } catch (err) {
    el.innerHTML = `<span style="color:var(--danger);">Fout: ${escB(err.message)}</span>`;
  }
}

// ============================================================
// KEURMEESTERS LADEN IN MODAL
// ============================================================
async function laadKmLijstInModal(bedrijfId) {
  const container = document.getElementById('bKmLijst');
  if (!container) return;

  try {
    const { data, error } = await sb
      .from('keurmeesters')
      .select('id, naam, email, bedrijf_id, auth_user_id')
      .eq('bedrijf_id', bedrijfId)
      .order('naam', { ascending: true });

    if (error) {
      container.innerHTML = `<div style="color:var(--danger);font-size:12px;">Fout: ${escB(error.message)}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="font-size:12px;color:var(--text-muted);">Nog geen keurmeesters gekoppeld.</div>`;
      return;
    }

    container.innerHTML = data.map(km => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bg-input);border-radius:var(--radius);margin-bottom:6px;gap:10px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;">${escB(km.naam || '—')}</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;word-break:break-all;">${escB(km.email || 'geen e-mail')}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${km.auth_user_id ? '✓ Account actief' : '⚠ Geen account'}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
          <button class="btn btn-sm" onclick="opnieuwUitnodigen('${escB(km.id)}','${escB(km.email || '')}','${escB(km.naam || '')}','${escB(bedrijfId)}')" title="Stuur opnieuw een activatie- of wachtwoord-mail">Opnieuw uitnodigen</button>
          <button class="btn btn-sm" style="color:var(--danger);border-color:var(--danger);" onclick="verwijderKmUitBedrijf('${escB(km.id)}','${escB(km.naam || '')}')">Verwijder</button>
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger);font-size:12px;">Fout: ${escB(err.message)}</div>`;
  }
}

// ============================================================
// BEDRIJF OPSLAAN
// ============================================================
async function slaaBedrijfOp(isNieuw) {
  const naam = document.getElementById('bNaam').value.trim();
  if (!naam) { toast('Vul een bedrijfsnaam in', 'error'); return; }

  const id = document.getElementById('bId').value || generateId();

  const certKolommen = JSON.stringify({
    materiaal:    document.getElementById('bCertColMateriaal').checked,
    enNorm:       document.getElementById('bCertColEnNorm').checked,
    breuksterkte: document.getElementById('bCertColBreuksterkte').checked,
  });

  const rij = {
    id,
    naam,
    kvk:                  document.getElementById('bKvk').value.trim(),
    email:                document.getElementById('bEmail').value.trim(),
    telefoon:             document.getElementById('bTelefoon').value.trim(),
    adres:                document.getElementById('bAdres').value.trim(),
    kleur_primair:        document.getElementById('bKleurPrimair').value,
    kleur_primair_donker: document.getElementById('bKleurDonker').value,
    kleur_accent:         document.getElementById('bKleurAccent').value,
    logo_url:             document.getElementById('bLogoUrl').value.trim(),
    cert_koptekst:        document.getElementById('bCertKop').value,
    cert_voettekst:       document.getElementById('bCertVoet').value,
    cert_kolommen:        certKolommen,
  };

  try {
    const { error } = await sb
      .from('bedrijven')
      .upsert(rij, { onConflict: 'id' });

    if (error) { toast('Fout bij opslaan: ' + error.message, 'error'); return; }

    if (id === _huidigBedrijfId && typeof pasInstellingenToe === 'function') {
      pasInstellingenToe(rij);
    }

    const kmNaam  = document.getElementById('bKmNaam')?.value.trim();
    const kmEmail = document.getElementById('bKmEmail')?.value.trim();

    if (kmEmail) {
      await nodigKeurmeesterUitVoorBedrijf(kmNaam, kmEmail, id, naam);
    } else {
      toast(isNieuw ? `Bedrijf "${naam}" aangemaakt` : `Bedrijf "${naam}" opgeslagen`, 'success');
      closeModal();
    }

    await laadBedrijvenLijst();

  } catch (err) {
    toast('Onverwachte fout: ' + err.message, 'error');
  }
}

// ============================================================
// KEURMEESTER UITNODIGEN
// ============================================================
async function nodigKeurmeesterUitVoorBedrijf(naam, email, bedrijfId, bedrijfNaam) {
  const statusEl = document.getElementById('bKmStatus');
  if (statusEl) { statusEl.textContent = 'Uitnodiging versturen...'; statusEl.style.color = 'var(--text-muted)'; }

  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { toast('Niet ingelogd', 'error'); return; }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/quick-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email,
        klant_naam: naam || email,
        rol: 'keurmeester',
        bedrijf_id: bedrijfId,
        redirect_to: 'https://klimkeurpro.github.io/klimkeur-pro/',
      }),
    });

    const result = await res.json();

    if (!res.ok || result.error) {
      const melding = result.error || 'Onbekende fout';
      if (statusEl) { statusEl.textContent = '⚠ ' + melding; statusEl.style.color = 'var(--danger)'; }
      toast(melding, 'error', 6000);
      return;
    }

    if (statusEl) { statusEl.textContent = `✓ Uitnodiging verstuurd naar ${email}`; statusEl.style.color = 'var(--success)'; }
    toast(`Uitnodiging verstuurd naar ${email}`, 'success');
    setTimeout(() => { closeModal(); laadBedrijvenLijst(); }, 1500);

  } catch (err) {
    if (statusEl) { statusEl.textContent = 'Fout: ' + err.message; statusEl.style.color = 'var(--danger)'; }
    toast('Fout bij uitnodigen: ' + err.message, 'error');
  }
}

// ============================================================
// OPNIEUW UITNODIGEN
// ============================================================
async function opnieuwUitnodigen(kmId, email, naam, bedrijfId) {
  if (!email) {
    toast('Geen e-mailadres bekend voor deze keurmeester', 'error');
    return;
  }
  if (!confirm(`Opnieuw een activatie- of wachtwoord-mail sturen naar ${email}?`)) return;

  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { toast('Niet ingelogd', 'error'); return; }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/quick-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email,
        klant_naam: naam || email,
        rol: 'keurmeester',
        bedrijf_id: bedrijfId,
        redirect_to: 'https://klimkeurpro.github.io/klimkeur-pro/',
      }),
    });

    const result = await res.json();

    if (!res.ok || result.error) {
      toast('Mail versturen mislukt: ' + (result.error || 'onbekende fout'), 'error', 6000);
      return;
    }

    toast(`Mail verstuurd naar ${email}`, 'success');

  } catch (err) {
    toast('Fout: ' + err.message, 'error');
  }
}

// ============================================================
// KEURMEESTER VERWIJDEREN UIT BEDRIJF
// ============================================================
async function verwijderKmUitBedrijf(kmId, kmNaam) {
  const naam = kmNaam || 'deze keurmeester';
  if (!confirm(
    `${naam} verwijderen uit dit bedrijf?\n\n` +
    `• De koppeling wordt verwijderd — deze persoon kan niet meer inloggen op het keuringssysteem\n` +
    `• Het Supabase-account zelf blijft bestaan (kan later opnieuw gekoppeld worden)\n` +
    `• Bestaande keuringen blijven ongewijzigd`
  )) return;

  try {
    const { error } = await sb
      .from('keurmeesters')
      .delete()
      .eq('id', kmId);

    if (error) { toast('Fout bij verwijderen: ' + error.message, 'error'); return; }

    toast(`${naam} verwijderd`, 'success');
    const bedrijfId = document.getElementById('bId')?.value;
    if (bedrijfId) laadKmLijstInModal(bedrijfId);

  } catch (err) {
    toast('Fout: ' + err.message, 'error');
  }
}

// ============================================================
// BEDRIJF VERWIJDEREN
// ============================================================
async function verwijderBedrijf(bedrijfId, bedrijfNaam) {
  if (bedrijfId === _huidigBedrijfId) {
    toast('Je kunt je eigen bedrijf niet verwijderen', 'error');
    return;
  }
  if (!confirm(`Bedrijf "${bedrijfNaam}" verwijderen?\n\nLet op: keurmeesters, klanten en keuringen van dit bedrijf blijven bestaan maar zijn niet meer gekoppeld.`)) return;

  try {
    const { error } = await sb
      .from('bedrijven')
      .delete()
      .eq('id', bedrijfId);

    if (error) { toast('Fout bij verwijderen: ' + error.message, 'error'); return; }

    toast(`Bedrijf "${bedrijfNaam}" verwijderd`, 'success');
    await laadBedrijvenLijst();

  } catch (err) {
    toast('Fout: ' + err.message, 'error');
  }
}
