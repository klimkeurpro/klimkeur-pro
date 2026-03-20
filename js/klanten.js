// ============================================================
// klanten.js — klantenbeheer, uitnodigingen, aangemeld materiaal
// ============================================================

function renderKlanten(el) {
  const klanten = store.klanten;
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;" class="fade-in">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="klantSearch" placeholder="Zoek klant..." oninput="filterKlanten()">
      </div>
      <button class="btn btn-primary" onclick="openKlantModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nieuwe Klant
      </button>
    </div>
    <div class="card fade-in">
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Bedrijf / Naam</th><th>Klantnr.</th><th>Contactpersoon</th><th>Telefoon</th><th>Email</th><th>Keuringen</th><th>Aangemeld</th><th></th>
          </tr></thead>
          <tbody id="klantenBody">
            ${klanten.length === 0 ? '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px;">Nog geen klanten. Voeg een klant toe om te beginnen.</td></tr>' :
              klanten.map(k => `
                <tr>
                  <td><strong>${k.bedrijf || k.naam || ''}</strong></td>
                  <td>${k.klantnummer || ''}</td>
                  <td>${k.contactpersoon || ''}</td>
                  <td>${k.telefoon || ''}</td>
                  <td>${k.email || ''}</td>
                  <td><span class="badge badge-blue">${store.keuringen.filter(ke => ke.klantId === k.id).length}</span></td>
                  <td id="aangemeld-${k.id}"><span class="badge badge-gray">—</span></td>
                  <td>
                    <button class="btn btn-sm" onclick="openKlantModal('${k.id}')">Bewerk</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteKlant('${k.id}')">Verwijder</button>
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openKlantModal(id) {
  const klant = id ? store.klanten.find(k => k.id === id) : null;
  showModal(id ? 'Klant Bewerken' : 'Nieuwe Klant', `
    <input type="hidden" id="klantId" value="${id || ''}">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Bedrijf / Naam</label>
        <input class="form-input" id="klantBedrijf" value="${klant?.bedrijf || ''}" placeholder="Bedrijfsnaam">
      </div>
      <div class="form-group">
        <label class="form-label">Contactpersoon</label>
        <input class="form-input" id="klantContact" value="${klant?.contactpersoon || ''}" placeholder="Contactpersoon">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Klantnummer <span style="font-weight:400;color:var(--text-muted);">(optioneel — bijv. uit boekhoudprogramma)</span></label>
        <input class="form-input" id="klantNummer" value="${klant?.klantnummer || ''}" placeholder="bijv. 1042">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Telefoon</label>
        <input class="form-input" id="klantTel" value="${klant?.telefoon || ''}" placeholder="Telefoonnummer">
      </div>
      <div class="form-group">
        <label class="form-label">Email <span style="font-weight:400;color:var(--text-muted);">wordt ook gebruikt voor klant-login</span></label>
        <input class="form-input" id="klantEmail" value="${klant?.email || ''}" placeholder="naam@voorbeeld.nl">
      </div>
    </div>
    <div class="form-row" style="grid-template-columns:3fr 1fr;">
      <div class="form-group">
        <label class="form-label">Straatnaam</label>
        <input class="form-input" id="klantStraat" value="${klant?.straat || ''}" placeholder="Straatnaam">
      </div>
      <div class="form-group">
        <label class="form-label">Huisnr.</label>
        <input class="form-input" id="klantHuisnr" value="${klant?.huisnummer || ''}" placeholder="Nr.">
      </div>
    </div>
    <div class="form-row" style="grid-template-columns:1fr 2fr 1fr;">
      <div class="form-group">
        <label class="form-label">Postcode</label>
        <input class="form-input" id="klantPostcode" value="${klant?.postcode || ''}" placeholder="1234 AB">
      </div>
      <div class="form-group">
        <label class="form-label">Plaatsnaam</label>
        <input class="form-input" id="klantPlaats" value="${klant?.plaats || ''}" placeholder="Plaatsnaam">
      </div>
      <div class="form-group">
        <label class="form-label">Land</label>
        <input class="form-input" id="klantLand" value="${klant?.land || 'Nederland'}" placeholder="Land">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Opmerkingen</label>
      <textarea class="form-textarea" id="klantOpm">${klant?.opmerkingen || ''}</textarea>
    </div>
    <div class="form-group">
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="zoekAuthUser()" style="white-space:nowrap;">Opzoeken</button>
        <button type="button" class="btn btn-primary btn-sm" onclick="verstuurKlantUitnodiging()" style="white-space:nowrap;" ${!id ? 'disabled title="Sla de klant eerst op"' : ''}>✉ Uitnodigen</button>
      </div>
      <input type="hidden" id="klantAuthEmail" value="${klant?.email || klant?.authEmail || ''}">
      <input type="hidden" id="klantAuthUserId" value="${klant?.auth_user_id || ''}">
      <div id="authUserStatus" style="font-size:12px;margin-top:4px;color:var(--text-muted);">${klant?.auth_user_id ? '✓ Account gekoppeld' : ''}</div>
    </div>
  `, () => {
    const data = {
      id: document.getElementById('klantId').value || generateId(),
      bedrijf: document.getElementById('klantBedrijf').value,
      contactpersoon: document.getElementById('klantContact').value,
      klantnummer: document.getElementById('klantNummer').value,
      telefoon: document.getElementById('klantTel').value,
      email: document.getElementById('klantEmail').value,
      straat: document.getElementById('klantStraat').value,
      huisnummer: document.getElementById('klantHuisnr').value,
      postcode: document.getElementById('klantPostcode').value,
      plaats: document.getElementById('klantPlaats').value,
      land: document.getElementById('klantLand').value,
      adres: `${document.getElementById('klantStraat').value} ${document.getElementById('klantHuisnr').value}, ${document.getElementById('klantPostcode').value} ${document.getElementById('klantPlaats').value}`.trim().replace(/^,\s*|,\s*$/g, ''),
      opmerkingen: document.getElementById('klantOpm').value,
      auth_user_id: document.getElementById('klantAuthUserId').value || null,
      authEmail: document.getElementById('klantEmail').value || '',
    };
    if (!data.bedrijf) { toast('Vul een bedrijfsnaam in', 'error'); return; }
    const idx = store.klanten.findIndex(k => k.id === data.id);
    if (idx >= 0) store.klanten[idx] = data;
    else store.klanten.push(data);
    saveStore(store);
    sbUpsertKlant(data).catch(console.error);
    closeModal();
    toast(idx >= 0 ? 'Klant bijgewerkt' : 'Klant toegevoegd');
    renderKlanten(document.getElementById('pageContent'));
  });
}

async function laadAangemeldBadges() {
  // Laad aantallen aangemeld materiaal per klant (keuring_id IS NULL, status = 'nieuw')
  try {
    const { data, error } = await sb
      .from('keuring_items')
      .select('klant_id')
      .is('keuring_id', null)
      .eq('status', 'nieuw');
    if (error) throw error;
    // Tel per klant
    const tellers = {};
    (data || []).forEach(r => {
      if (r.klant_id) tellers[r.klant_id] = (tellers[r.klant_id] || 0) + 1;
    });
    // Update badges
    Object.entries(tellers).forEach(([klantId, count]) => {
      const el = document.getElementById(`aangemeld-${klantId}`);
      if (el) el.innerHTML = `<span class="badge badge-green" style="cursor:pointer;" onclick="toonAangemeldMateriaal('${klantId}','')">${count} nieuw</span>`;
    });
  } catch(e) { console.warn('Kon aangemeld materiaal niet laden:', e); }
}

async function toonAangemeldMateriaal(klantId, klantNaam) {
  try {
    const { data, error } = await sb
      .from('keuring_items')
      .select('*')
      .eq('klant_id', klantId)
      .is('keuring_id', null)
      .order('aangemaakt_op', { ascending: false });

    if (error) throw error;
    const items = data || [];

    if (items.length === 0) {
      toast('Geen aangemeld materiaal voor deze klant');
      return;
    }

    const html = `
      <p style="margin-bottom:12px;color:var(--text-muted);font-size:13px;">${items.length} artikel${items.length !== 1 ? 'en' : ''} aangemeld door klant</p>
      <div style="max-height:400px;overflow-y:auto;">
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <thead><tr style="border-bottom:2px solid var(--border);">
            <th style="padding:8px;text-align:left;">Omschrijving</th>
            <th style="padding:8px;text-align:left;">Merk</th>
            <th style="padding:8px;text-align:left;">Serienummer</th>
            <th style="padding:8px;text-align:left;">In gebruik</th>
            <th style="padding:8px;text-align:left;">Status</th>
          </tr></thead>
          <tbody>
            ${items.map(i => {
              const ks = keuringNodigStatus(i.in_gebruik);
              return `<tr style="border-bottom:1px solid var(--border);">
                <td style="padding:8px;">${i.omschrijving || '—'}<br><span style="font-size:11px;color:var(--text-muted);">${i.materiaal || ''}</span></td>
                <td style="padding:8px;">${i.merk || '—'}</td>
                <td style="padding:8px;font-family:monospace;">${i.serienummer || '—'}</td>
                <td style="padding:8px;">${i.in_gebruik ? formatDate(i.in_gebruik) : '—'}</td>
                <td style="padding:8px;"><span class="badge ${ks === 'overdue' ? 'badge-red' : ks === 'soon' ? 'badge-orange' : 'badge-green'}">${ks === 'overdue' ? 'Keuring nodig' : ks === 'soon' ? 'Keuring binnenkort' : 'OK'}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    showModal(`Aangemeld materiaal — ${klantNaam || klantId}`, html, null, true);
  } catch(e) {
    console.error('Fout bij laden aangemeld materiaal:', e);
    toast('Fout bij laden materiaal', 'error');
  }
}

function keuringNodigStatus(inGebruik) {
  if (!inGebruik) return 'ok';
  const maanden = (new Date() - new Date(inGebruik)) / (1000 * 60 * 60 * 24 * 30.44);
  if (maanden >= 12) return 'overdue';
  if (maanden >= 10) return 'soon';
  return 'ok';
}

async function zoekAuthUser() {
  const email = document.getElementById('klantEmail')?.value?.trim() || document.getElementById('klantAuthEmail')?.value?.trim() || '';
  const statusEl = document.getElementById('authUserStatus');
  if (!email) { statusEl.textContent = 'Vul eerst een e-mailadres in'; statusEl.style.color = 'var(--danger)'; return; }

  statusEl.textContent = 'Zoeken...';
  statusEl.style.color = 'var(--text-muted)';

  try {
    // Zoek of dit email al gekoppeld is aan een klant
    const { data, error } = await sb.from('klanten').select('id, auth_user_id, bedrijf').eq('email', email).maybeSingle();
    if (data?.auth_user_id) {
      document.getElementById('klantAuthUserId').value = data.auth_user_id;
      statusEl.innerHTML = '✓ Account gevonden en gekoppeld';
      statusEl.style.color = 'var(--success)';
    } else {
      document.getElementById('klantAuthUserId').value = '';
      statusEl.innerHTML = 'Geen bestaand account gevonden. Gebruik <strong>✉ Uitnodigen</strong> om een uitnodiging te sturen.';
      statusEl.style.color = 'var(--warning)';
    }
  } catch(e) {
    statusEl.textContent = 'Fout bij opzoeken';
    statusEl.style.color = 'var(--danger)';
  }
}

async function verstuurKlantUitnodiging() {
  const email = document.getElementById('klantEmail')?.value?.trim() || document.getElementById('klantAuthEmail')?.value?.trim() || '';
  const klantId = document.getElementById('klantId').value;
  const klantNaam = document.getElementById('klantBedrijf').value.trim();
  const statusEl = document.getElementById('authUserStatus');

  if (!email) {
    statusEl.textContent = 'Vul eerst een e-mailadres in';
    statusEl.style.color = 'var(--danger)';
    return;
  }
  if (!klantId) {
    statusEl.textContent = 'Sla de klant eerst op voordat je een uitnodiging verstuurt';
    statusEl.style.color = 'var(--warning)';
    return;
  }

  statusEl.textContent = 'Uitnodiging versturen...';
  statusEl.style.color = 'var(--text-muted)';

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
        klant_id: klantId,
        klant_naam: klantNaam,
        redirect_to: 'https://klimkeurpro.github.io/klimkeur-klant/',
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      if (result.error?.includes('already been invited') || result.error?.includes('already registered')) {
        statusEl.innerHTML = '⚠ Dit e-mailadres heeft al een account of uitnodiging. Gebruik <em>Opzoeken</em> om te koppelen.';
        statusEl.style.color = 'var(--warning)';
      } else {
        statusEl.textContent = `Fout: ${result.error || 'Onbekende fout'}`;
        statusEl.style.color = 'var(--danger)';
      }
      return;
    }

    // Succes — sla auth_user_id direct op in Supabase zodat de klant direct gekoppeld is
    if (result.user_id) {
      document.getElementById('klantAuthUserId').value = result.user_id;
      try {
        const { error } = await sb.from('klanten')
          .update({ auth_user_id: result.user_id, email: email })
          .eq('id', klantId);
        if (error) throw error;
        const klant = store.klanten.find(k => k.id === klantId);
        if (klant) {
          klant.auth_user_id = result.user_id;
          klant.email = email;
          saveStore(store);
        }
      } catch(saveErr) {
        console.error('auth_user_id opslaan mislukt:', saveErr);
      }
    }
    statusEl.innerHTML = `✓ Uitnodiging verstuurd naar <strong>${email}</strong>`;
    statusEl.style.color = 'var(--success)';
    toast(`Uitnodiging verstuurd naar ${email}`);

  } catch(e) {
    console.error('Uitnodiging fout:', e);
    statusEl.textContent = 'Fout bij versturen uitnodiging';
    statusEl.style.color = 'var(--danger)';
  }
}

function deleteKlant(id) {
  if (!confirm('Weet je zeker dat je deze klant wilt verwijderen?')) return;
  store.klanten = store.klanten.filter(k => k.id !== id);
  saveStore(store);
  sbDeleteKlant(id).catch(console.error);
  toast('Klant verwijderd');
  renderKlanten(document.getElementById('pageContent'));
}

// ============================================================
// PRODUCTEN
// ============================================================
