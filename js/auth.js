// ============================================================
// auth.js — inloggen, uitloggen, keurmeester koppelen, handleAuthState
// ============================================================

async function authLogin() {
  const email    = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const btn      = document.getElementById('authLoginBtn');
  const errEl    = document.getElementById('authError');

  errEl.classList.remove('visible');

  if (!email || !password) {
    errEl.textContent = 'Vul e-mailadres en wachtwoord in.';
    errEl.classList.add('visible');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Inloggen...`;

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Inloggen`;

  if (error) {
    const msgs = {
      'Invalid login credentials': 'Verkeerd e-mailadres of wachtwoord.',
      'Email not confirmed':       'E-mailadres nog niet bevestigd. Controleer je inbox.',
      'Too many requests':         'Te veel pogingen. Wacht even en probeer opnieuw.',
    };
    errEl.textContent = msgs[error.message] || ('Fout: ' + error.message);
    errEl.classList.add('visible');
  }
  // Bij succes: onAuthStateChange handelt de rest af
}

/**
 * authLogout — uitloggen
 */
async function authLogout() {
  if (!confirm('Wil je uitloggen?')) return;
  _appStarted = false;
  await sb.auth.signOut();
  // onAuthStateChange toont het loginscherm
}

/**
 * Naam afleiden uit email-adres
 * bijv. c.van.den.hoogen@safetygreen.nl  →  C. Van Den Hoogen
 *       erik.bottenheft@safetygreen.nl   →  Erik Bottenheft
 */
function naamUitEmail(email) {
  const prefix = (email || '').split('@')[0];
  return prefix
    .split(/[._-]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Koppeling zoeken op basis van user metadata of email-match
 * Geeft { gevonden: bool, naam: string } terug
 */
function zoekKoppeling(user) {
  // 1. Eerder opgeslagen koppeling in user metadata
  const metaNaam = user.user_metadata && user.user_metadata.keurmeester_naam;
  if (metaNaam) return { gevonden: true, naam: metaNaam };

  // 2. Probeer te matchen met een bestaande keurmeester op achternaam
  const email = (user.email || '').toLowerCase();
  const kms   = (store && store.keurmeesters) ? store.keurmeesters : [];
  for (const km of kms) {
    const achternaam = (km.naam || '').toLowerCase().split(' ').pop();
    if (achternaam.length > 3 && email.includes(achternaam)) {
      return { gevonden: true, naam: km.naam };
    }
  }

  return { gevonden: false, naam: null };
}

/**
 * Keurmeester aanmaken en koppelen aan ingelogde user
 */
async function maakKeurmeesterEnKoppel(user) {
  const naam = naamUitEmail(user.email);

  // Voeg toe aan keurmeesters als nog niet aanwezig
  if (!store.keurmeesters) store.keurmeesters = [];
  const bestaatAl = store.keurmeesters.some(
    k => k.naam.toLowerCase() === naam.toLowerCase()
  );
  if (!bestaatAl) {
    store.keurmeesters.push({ naam, handtekening: '' });
    await sbSaveKeurmeesters(store.keurmeesters).catch(console.error);
  }

  // Sla koppeling op in Supabase user metadata
  await sb.auth.updateUser({ data: { keurmeester_naam: naam } });

  // Stel in als actieve keurmeester
  store.settings.keurmeester = naam;
  await sbSaveSettings(store.settings).catch(console.error);
  saveStore(store);

  toast(`Welkom, ${naam}!`);
  return naam;
}

/**
 * Verberg de auth overlay en update de sidebar
 */
function verbergAuthOverlay(keurmeesterNaam) {
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.style.display = 'none';

  const nm = document.getElementById('sidebarUserNaam');
  if (nm) nm.textContent = keurmeesterNaam || (_currentUser && _currentUser.email) || '—';
}

/**
 * Hoofd auth flow — wordt aangeroepen door onAuthStateChange
 */
async function handleAuthState(session) {
  const overlay = document.getElementById('authOverlay');

  if (!session) {
    // Niet ingelogd: toon loginscherm
    _currentUser = null;
    _appStarted  = false;
    _huidigBedrijfId = null;
    _isPlatformAdmin = false;
    _bedrijfInfo = null;
    if (overlay) {
      // Herstel het loginscherm als de overlay overschreven was door de laadindicator
      if (!document.getElementById('authLogin')) {
        overlay.innerHTML = `
          <div class="auth-box fade-in" id="authLogin">
            <div class="auth-logo">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--sg-green)" stroke-width="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <div class="auth-logo-text">
                <strong>KlimKeur Pro</strong>
                <span>Safety Green B.V.</span>
              </div>
            </div>
            <div class="auth-title">Inloggen</div>
            <div class="auth-sub">Log in met je KlimKeur account om door te gaan.</div>
            <div class="auth-field">
              <label>E-mailadres</label>
              <input type="email" id="authEmail" placeholder="naam@safetygreen.nl" autocomplete="email" onkeydown="if(event.key==='Enter')authLogin()">
            </div>
            <div class="auth-field">
              <label>Wachtwoord</label>
              <input type="password" id="authPassword" placeholder="••••••••" autocomplete="current-password" onkeydown="if(event.key==='Enter')authLogin()">
            </div>
            <button class="auth-btn" id="authLoginBtn" onclick="authLogin()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Inloggen
            </button>
            <div class="auth-error" id="authError"></div>
          </div>
        `;
      }
      overlay.style.display = 'flex';
      const loginEl = document.getElementById('authLogin');
      if (loginEl) loginEl.style.display = 'block';
      const errorEl = document.getElementById('authError');
      if (errorEl) errorEl.classList.remove('visible');
      const pwEl = document.getElementById('authPassword');
      if (pwEl) pwEl.value = '';
    }
    return;
  }

  _currentUser = session.user;

  // App al gestart (bijv. token refresh) — alleen sidebar bijwerken
  if (_appStarted) {
    const koppeling = zoekKoppeling(_currentUser);
    verbergAuthOverlay(koppeling.gevonden ? koppeling.naam : _currentUser.email);
    return;
  }

  _appStarted = true;

  // Laad-indicator tonen
  if (overlay) {
    overlay.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--sg-green)" stroke-width="2" style="animation:spin 1s linear infinite">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <div style="color:var(--text-secondary);font-size:14px;">Data laden uit Supabase...</div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
      </div>
    `;
  }

  // Store laden
  try {
    store = await initStore();
  } catch(err) {
    console.error('initStore fout:', err);
    if (overlay) overlay.innerHTML = `
      <div style="text-align:center;">
        <div style="color:var(--danger);font-size:16px;font-weight:600;margin-bottom:8px;">❌ Kon data niet laden</div>
        <div style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">${err.message || 'Onbekende fout'}</div>
        <button onclick="location.reload()" style="padding:8px 16px;background:var(--sg-green);color:#fff;border:none;border-radius:6px;cursor:pointer;">Opnieuw proberen</button>
      </div>
    `;
    _appStarted = false;
    return;
  }

  // Keurmeester koppelen
  let koppeling = zoekKoppeling(_currentUser);
  let keurmeesterNaam;

  if (koppeling.gevonden) {
    keurmeesterNaam = koppeling.naam;
    // Zorg dat de actieve keurmeester klopt
    if (store.settings.keurmeester !== keurmeesterNaam) {
      store.settings.keurmeester = keurmeesterNaam;
      saveStore(store);
    }
  } else {
    // Automatisch aanmaken op basis van email
    keurmeesterNaam = await maakKeurmeesterEnKoppel(_currentUser);
  }

  // Bedrijf_id, admin-status en bedrijfsinfo laden
  try {
    const { data: kmData } = await sb.from('keurmeesters')
      .select('bedrijf_id')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();
    if (kmData) _huidigBedrijfId = kmData.bedrijf_id;
  } catch(err) {
    console.error('Fout bij laden bedrijf_id:', err);
  }

  try {
    const { data: adminCheck } = await sb.from('platform_admins')
      .select('auth_user_id')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();
    _isPlatformAdmin = !!adminCheck;
  } catch(err) {
    console.error('Fout bij admin-check:', err);
  }

  if (_huidigBedrijfId) {
    try {
      const { data: bedrijf } = await sb.from('bedrijven')
        .select('*')
        .eq('id', _huidigBedrijfId)
        .maybeSingle();
      if (bedrijf) _bedrijfInfo = bedrijf;
    } catch(err) {
      console.error('Fout bij laden bedrijfsinfo:', err);
    }
  }

  // App starten
  verbergAuthOverlay(keurmeesterNaam);
  initTheme();
  navigateTo('dashboard');
}

// Start auth listener — dit is het enige startpunt
sb.auth.onAuthStateChange((event, session) => {
  handleAuthState(session);
});

DB_KEY = 'klimkeur_pro_v2'; // nog gebruikt voor theme/backup meta

