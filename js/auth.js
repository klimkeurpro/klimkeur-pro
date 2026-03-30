// ============================================================
// auth.js — inloggen, uitloggen, keurmeester koppelen, handleAuthState
// ============================================================
// Detecteer invite-link bij laden
(function detecteerInvite() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  if (params.get('token_hash') && params.get('type') === 'invite') {
    // Verwerk de invite-token via Supabase
    sb.auth.verifyOtp({
      token_hash: params.get('token_hash'),
      type: 'invite',
    }).then(({ data, error }) => {
      if (error) {
        console.error('Invite verificatie fout:', error);
        return;
      }
      // Toon wachtwoord-instellen scherm
      toonResetScherm();
      // Hash wissen
      history.replaceState(null, '', window.location.pathname);
    });
  }
})();

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
 * authWachtwoordVergeten — stuur resetmail naar keurmeester
 */
async function authWachtwoordVergeten() {
  const email = document.getElementById('authEmail').value.trim();
  const errEl = document.getElementById('authError');
  errEl.classList.remove('visible');
  errEl.style.color = '';

  if (!email) {
    errEl.textContent = 'Vul eerst je e-mailadres in.';
    errEl.classList.add('visible');
    return;
  }

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://klimkeurpro.github.io/klimkeur-pro/'
  });

  if (error) {
    errEl.textContent = 'Fout: ' + error.message;
    errEl.classList.add('visible');
  } else {
    errEl.style.color = 'var(--sg-green)';
    errEl.textContent = 'Resetmail verzonden! Controleer je inbox.';
    errEl.classList.add('visible');
    setTimeout(() => { errEl.style.color = ''; }, 5000);
  }
}

/**
 * authNieuwWachtwoord — sla nieuw wachtwoord op
 */
async function authNieuwWachtwoord() {
  const ww1   = document.getElementById('authNieuwWw').value;
  const ww2   = document.getElementById('authNieuwWw2').value;
  const errEl = document.getElementById('authResetError');
  const btn   = document.getElementById('authResetBtn');

  errEl.classList.remove('visible');

  if (!ww1 || ww1.length < 6) {
    errEl.textContent = 'Wachtwoord moet minimaal 6 tekens zijn.';
    errEl.classList.add('visible');
    return;
  }
  if (ww1 !== ww2) {
    errEl.textContent = 'Wachtwoorden komen niet overeen.';
    errEl.classList.add('visible');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Opslaan...';

  const { error } = await sb.auth.updateUser({ password: ww1 });

  btn.disabled = false;
  btn.textContent = 'Wachtwoord instellen';

  if (error) {
    errEl.textContent = 'Fout: ' + error.message;
    errEl.classList.add('visible');
  } else {
    const resetOverlay = document.getElementById('authResetOverlay');
    if (resetOverlay) resetOverlay.remove();
    toast('Wachtwoord succesvol ingesteld!');
  }
}

/**
 * toonResetScherm — toon wachtwoord-instellen overlay
 */
function toonResetScherm() {
  let overlay = document.getElementById('authResetOverlay');
  if (overlay) { overlay.style.display = 'flex'; return; }
  overlay = document.createElement('div');
  overlay.id = 'authResetOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:var(--bg-primary);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div class="auth-box fade-in">' +
    '<div class="auth-logo">' +
    '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--sg-green)" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>' +
    '<div class="auth-logo-text"><strong>KlimKeur Pro</strong><span>Nieuw wachtwoord</span></div>' +
    '</div>' +
    '<div class="auth-title">Wachtwoord instellen</div>' +
    '<div class="auth-sub">Kies een nieuw wachtwoord voor je account.</div>' +
    '<div class="auth-field"><label>Nieuw wachtwoord</label>' +
    '<input type="password" id="authNieuwWw" placeholder="Minimaal 6 tekens" autocomplete="new-password"></div>' +
    '<div class="auth-field"><label>Herhaal wachtwoord</label>' +
    '<input type="password" id="authNieuwWw2" placeholder="Herhaal wachtwoord" autocomplete="new-password"></div>' +
    '<button class="auth-btn" id="authResetBtn" onclick="authNieuwWachtwoord()">Wachtwoord instellen</button>' +
    '<div class="auth-error" id="authResetError"></div>' +
    '</div>';
  document.body.appendChild(overlay);
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

  // ── BEVEILIGINGSCHECK ──
  // Controleer of deze gebruiker een geregistreerde keurmeester is
  // met een geldig bedrijf_id. Zo niet → uitloggen en foutmelding tonen.
  // Dit voorkomt dat klant-accounts toegang krijgen tot KlimKeur Pro.
  try {
    const { data: kmCheck } = await sb.from('keurmeesters')
      .select('bedrijf_id')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();

    if (!kmCheck || !kmCheck.bedrijf_id) {
      // Geen keurmeester-record of geen bedrijf_id → geen toegang
      console.warn('Geen keurmeester-record gevonden voor:', session.user.email);
      _appStarted = false;
      await sb.auth.signOut();
      // Toon loginscherm met foutmelding
      if (overlay) {
        // Herstel loginscherm (handleAuthState wordt opnieuw aangeroepen door signOut)
        // maar we tonen alvast de foutmelding
        setTimeout(() => {
          const errEl = document.getElementById('authError');
          if (errEl) {
            errEl.textContent = 'Geen toegang. Dit account is niet gekoppeld als keurmeester. Neem contact op met je beheerder.';
            errEl.classList.add('visible');
          }
        }, 500);
      }
      return;
    }

    // Keurmeester gevonden — sla bedrijf_id alvast op
    _huidigBedrijfId = kmCheck.bedrijf_id;
    await laadBranding(_huidigBedrijfId);
  } catch(err) {
    console.error('Beveiligingscheck fout:', err);
    // Bij een fout toch doorlaten (bijv. netwerkprobleem) —
    // de RLS policies in Supabase beschermen de data sowieso
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
    // Keurmeester staat in de database (beveiligingscheck hierboven is geslaagd)
    // maar is nog niet gekoppeld in de lokale store. Koppel nu.
    keurmeesterNaam = naamUitEmail(_currentUser.email);

    if (!store.keurmeesters) store.keurmeesters = [];
    const bestaatAl = store.keurmeesters.some(
      k => k.naam.toLowerCase() === keurmeesterNaam.toLowerCase()
    );
    if (!bestaatAl) {
      store.keurmeesters.push({ naam: keurmeesterNaam, handtekening: '' });
      await sbSaveKeurmeesters(store.keurmeesters).catch(console.error);
    }

    // Sla koppeling op in Supabase user metadata
    await sb.auth.updateUser({ data: { keurmeester_naam: keurmeesterNaam } });

    // Stel in als actieve keurmeester
    store.settings.keurmeester = keurmeesterNaam;
    await sbSaveSettings(store.settings).catch(console.error);
    saveStore(store);

    toast(`Welkom, ${keurmeesterNaam}!`);
  }

  // Admin-status laden
  try {
    const { data: adminCheck } = await sb.from('platform_admins')
      .select('auth_user_id')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();
    _isPlatformAdmin = !!adminCheck;
  } catch(err) {
    console.error('Fout bij admin-check:', err);
  }

  // Bedrijfsinfo laden
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
    // Platform-admin nav-items tonen
  if (_isPlatformAdmin) {
    const navBedrijven = document.getElementById('navBedrijven');
    const navSectie = document.getElementById('navSectieAdmin');
    if (navBedrijven) navBedrijven.style.display = '';
    if (navSectie) navSectie.style.display = '';
  }
  verbergAuthOverlay(keurmeesterNaam);
  initTheme();
  navigateTo('dashboard');
}

// Start auth listener — dit is het enige startpunt
sb.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
    toonResetScherm();
    return;
  }
  handleAuthState(session);
});

