// ============================================================
// app.js — initialisatie, navigatie, modals, global search, sidebar, utilities
// ============================================================

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.products) throw new Error('Ongeldig bestand');
      store = imported;
      saveStore(store);

      // Sync alles naar Supabase
      const syncBeloften = [];
      (store.klanten || []).forEach(k => syncBeloften.push(sbUpsertKlant(k)));
      (store.keuringen || []).forEach(k => {
        syncBeloften.push(sbUpsertKeuring(k).then(() => sbSyncAllKeuringItems(k)));
      });
      if (store.settings) syncBeloften.push(sbSaveSettings(store.settings));
      if (store.keurmeesters) syncBeloften.push(sbSaveKeurmeesters(store.keurmeesters));
      if (store.snData) syncBeloften.push(sbSaveSnData(store.snData));
      if (store.afkeurcodes) syncBeloften.push(sbSaveAfkeurcodes(store.afkeurcodes));

      Promise.all(syncBeloften)
        .then(() => toast('Data geïmporteerd en gesynchroniseerd met Supabase'))
        .catch(err => {
          console.error('Supabase sync na import mislukt:', err);
          toast('Data geïmporteerd (lokaal — Supabase sync mislukt)', 'warning');
        });

      navigateTo('dashboard');
    } catch(err) {
      toast('Fout bij importeren: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (!confirm('WAARSCHUWING: Dit verwijdert alle klanten, keuringen en wijzigingen. Weet je het zeker?')) return;
  if (!confirm('Echt zeker? Dit kan niet ongedaan worden gemaakt.')) return;
  localStorage.removeItem(DB_KEY);
  initStore().then(s => {
    store = s;
    toast('Data gereset naar standaard');
    navigateTo('dashboard');
  });
}

// ============================================================
// MODAL SYSTEM
// ============================================================
modalCallback = null;

function showModal(title, bodyHtml, onSave) {
  modalCallback = onSave;
  let overlay = document.getElementById('modalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="btn-icon" onclick="closeModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">Annuleren</button>
        <button class="btn btn-primary" onclick="modalCallback && modalCallback()">Opslaan</button>
      </div>
    </div>
  `;
  requestAnimationFrame(() => overlay.classList.add('active'));
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  }
  modalCallback = null;
}

// ============================================================
// GLOBAL SEARCH
// ============================================================
function openGlobalSearch() {
  document.getElementById('globalSearchOverlay').classList.add('active');
  document.getElementById('globalSearchInput').value = '';
  document.getElementById('globalSearchInput').focus();
  document.getElementById('globalSearchResults').innerHTML = '';
}

function closeGlobalSearch() {
  document.getElementById('globalSearchOverlay').classList.remove('active');
}

function handleGlobalSearch(query) {
  const results = document.getElementById('globalSearchResults');
  if (!query || query.length < 2) { results.innerHTML = ''; return; }
  const q = query.toLowerCase();
  let items = [];

  // Search products
  store.products.forEach(p => {
    if (Object.values(p).some(v => String(v).toLowerCase().includes(q))) {
      items.push({type:'Product', label: p.omschrijving, sub: `${p.merk} — ${p.materiaal}`, action: () => { navigateTo('producten'); productFilter.search = p.omschrijving; }});
    }
  });

  // Search klanten
  store.klanten.forEach(k => {
    if (Object.values(k).some(v => String(v).toLowerCase().includes(q))) {
      items.push({type:'Klant', label: k.bedrijf, sub: k.contactpersoon || '', action: () => navigateTo('klanten')});
    }
  });

  // Search serienummers in keuringen
  store.keuringen.forEach(keuring => {
    (keuring.items||[]).forEach(item => {
      if (item.serienummer && item.serienummer.toLowerCase().includes(q)) {
        items.push({
          type:'SN',
          label: `${item.serienummer} — ${item.omschrijving||''}`,
          sub: `${keuring.klantNaam||''} — ${formatDate(keuring.datum)} — ${item.status==='goedgekeurd'?'Goed':item.status==='afgekeurd'?'Afgekeurd':'Open'}`,
          action: () => { navigateTo('keuringen'); setTimeout(()=>openKeuringDetail(keuring.id),50); }
        });
      }
    });
  });

  items = items.slice(0, 15);
  results.innerHTML = items.length === 0 ?
    '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:14px;">Geen resultaten</div>' :
    items.map(i => `
      <div class="global-search-item" onclick="closeGlobalSearch();(${i.action.toString()})()">
        <span class="gsi-type">${i.type}</span>
        <div>
          <div style="font-size:14px;">${i.label}</div>
          <div style="font-size:12px;color:var(--text-muted);">${i.sub}</div>
        </div>
      </div>
    `).join('');
}

// ============================================================
// ASYNC APP STARTUP (Supabase)
// ============================================================
// initApp is vervangen door handleAuthState (via onAuthStateChange)
// De functie blijft beschikbaar als helper voor herinitialisatie
async function initApp() {
  // Wordt nu aangestuurd vanuit handleAuthState
  // Direct aanroepen alleen als er al een ingelogde user is
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;
  if (!_appStarted) {
    await handleAuthState(session);
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openGlobalSearch();
  }
  if (e.key === 'Escape') {
    closeGlobalSearch();
    closeModal();
  }
});

// App wordt gestart door onAuthStateChange listener (bovenaan in auth sectie)
// Geen directe initApp() aanroep meer nodig



// PWA install prompt
pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  pwaInstallPrompt = e;
  // Toon install knop in topbar
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm';
  btn.style.borderColor = 'var(--sg-green)';
  btn.style.color = 'var(--sg-green)';
  btn.title = 'Installeer als app';
  btn.innerHTML = '⬇ App';
  btn.onclick = async () => {
    if (!pwaInstallPrompt) return;
    pwaInstallPrompt.prompt();
    const { outcome } = await pwaInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      btn.remove();
      toast('KlimKeur Pro geïnstalleerd als app!');
    }
    pwaInstallPrompt = null;
  };
  document.querySelector('.topbar-actions').prepend(btn);
});

// Responsive sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
  } else {
    sidebar.classList.add('open');
    backdrop.classList.add('active');
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('active');
}

function checkResponsive() {
  const btn = document.getElementById('menuBtn');
  if (window.innerWidth <= 768) {
    btn.style.display = 'flex';
  } else {
    btn.style.display = 'none';
    closeSidebar();
  }
}
window.addEventListener('resize', checkResponsive);
checkResponsive();
