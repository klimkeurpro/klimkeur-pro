// ============================================================
// handleiding.js — In-app handleiding voor KlimKeur Pro
//
// Toont een ? knop in de topbar. Bij klikken opent een overlay
// met uitleg over alle onderdelen van de app. Als je op een
// specifieke pagina zit, scrollt de handleiding automatisch
// naar dat onderdeel.
// ============================================================

function openHandleiding() {
  // Verwijder bestaande overlay als die er al is
  let overlay = document.getElementById('handleidingOverlay');
  if (overlay) { overlay.remove(); }

  overlay = document.createElement('div');
  overlay.id = 'handleidingOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity 0.3s;';
  overlay.onclick = (e) => { if (e.target === overlay) sluitHandleiding(); };

  const sectieId = _getSectieVoorPagina();

  overlay.innerHTML = `
    <div class="handleiding-box" style="
      background:var(--bg-card);
      border:1px solid var(--border);
      border-radius:var(--radius-lg);
      width:100%;
      max-width:700px;
      max-height:85vh;
      display:flex;
      flex-direction:column;
      box-shadow:var(--shadow-lg);
      transform:translateY(20px);
      transition:transform 0.3s;
    ">
      <!-- Header -->
      <div style="
        padding:20px;
        border-bottom:1px solid var(--border);
        display:flex;
        align-items:center;
        justify-content:space-between;
        flex-shrink:0;
      ">
        <div style="display:flex;align-items:center;gap:10px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--sg-green)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <h2 style="font-size:18px;font-weight:700;margin:0;">Handleiding</h2>
        </div>
        <button class="btn-icon" onclick="sluitHandleiding()" style="padding:4px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Snelle navigatie -->
      <div style="
        padding:12px 20px;
        border-bottom:1px solid var(--border);
        display:flex;
        flex-wrap:wrap;
        gap:6px;
        flex-shrink:0;
      ">
        <button class="handleiding-nav-btn" onclick="scrollNaarSectie('hlp-dashboard')">Dashboard</button>
        <button class="handleiding-nav-btn" onclick="scrollNaarSectie('hlp-klanten')">Klanten</button>
        <button class="handleiding-nav-btn" onclick="scrollNaarSectie('hlp-keurmeesters')">Keurmeesters</button>
        <button class="handleiding-nav-btn" onclick="scrollNaarSectie('hlp-producten')">Producten</button>
        <button class="handleiding-nav-btn" onclick="scrollNaarSectie('hlp-keuringen')">Keuringen</button>
        <button class="handleiding-nav-btn" onclick="scrollNaarSectie('hlp-snzoeken')">SN Zoeken</button>
        <button class="handleiding-nav-btn" onclick="scrollNaarSectie('hlp-snref')">SN Referentie</button>
        <button class="handleiding-nav-btn" onclick="scrollNaarSectie('hlp-instellingen')">Instellingen</button>
        <button class="handleiding-nav-btn" onclick="scrollNaarSectie('hlp-tips')">Tips</button>
      </div>

      <!-- Content -->
      <div id="handleidingContent" style="
        padding:20px;
        overflow-y:auto;
        flex:1;
        font-size:14px;
        line-height:1.7;
        color:var(--text-primary);
      ">

        <!-- ── DASHBOARD ── -->
        <div id="hlp-dashboard" class="hlp-sectie">
          <h3 class="hlp-titel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </h3>
          <p>Het dashboard geeft je een overzicht van je belangrijkste cijfers: hoeveel klanten, keuringen, goedgekeurde en afgekeurde items, en hoeveel merken je in je productdatabase hebt.</p>
          <p><strong>Recente keuringen</strong> — De laatste 5 keuringen. Klik op een keuring om direct naar de details te gaan.</p>
          <p><strong>Backup herinnering</strong> — Als je langer dan een week geen backup hebt gemaakt, zie je hier een melding. Een regelmatige backup is je vangnet.</p>
        </div>

        <!-- ── KLANTEN ── -->
        <div id="hlp-klanten" class="hlp-sectie">
          <h3 class="hlp-titel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Klanten
          </h3>
          <p>Hier beheer je al je klanten. Elke klant is een bedrijf of organisatie waarvoor je keuringen uitvoert.</p>
          <p><strong>Klant toevoegen</strong> — Klik op de groene knop "+ Nieuwe klant". Vul minimaal de bedrijfsnaam in.</p>
          <p><strong>Klant bewerken</strong> — Klik op een klant in de lijst om de gegevens te wijzigen.</p>
          <p><strong>KlantKeur uitnodigen</strong> — Via het menu bij een klant kun je een uitnodiging versturen. De klant kan dan via KlantKeur zijn eigen materiaal inzien en nieuwe items aanmelden.</p>
          <p><strong>Aangemeld materiaal</strong> — Als een klant via KlantKeur nieuw materiaal aanmeldt, zie je een oranje badge bij die klant. Dit materiaal moet je nog verwerken in een keuring.</p>
        </div>

        <!-- ── KEURMEESTERS ── -->
        <div id="hlp-keurmeesters" class="hlp-sectie">
          <h3 class="hlp-titel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/><polyline points="9 11 12 14 15 11"/></svg>
            Keurmeesters
          </h3>
          <p>Overzicht van alle keurmeesters die voor je bedrijf werken. Elke keurmeester heeft een eigen account.</p>
          <p><strong>Uitnodigen</strong> — Klik op "+ Keurmeester uitnodigen" en vul het e-mailadres in. De keurmeester ontvangt een e-mail om zijn account te activeren.</p>
          <p><strong>Handtekening</strong> — Elke keurmeester kan zijn eigen handtekening uploaden via Instellingen. Deze verschijnt automatisch op certificaten.</p>
        </div>

        <!-- ── PRODUCTDATABASE ── -->
        <div id="hlp-producten" class="hlp-sectie">
          <h3 class="hlp-titel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            Productdatabase
          </h3>
          <p>De productdatabase bevat alle productsoorten die je kunt keuren. Dit zijn géén individuele artikelen — het zijn de "blauwdrukken" met normen, maximale leeftijden en materiaalsoorten.</p>
          <p><strong>Zoeken en filteren</strong> — Gebruik het zoekveld om snel een product te vinden. Je kunt ook filteren op merk of materiaal.</p>
          <p><strong>Kolommen aanpassen</strong> — Klik op "Kolommen" om te kiezen welke kolommen je in de tabel wilt zien.</p>
          <p><strong>Excel import</strong> — Je kunt een volledige productdatabase importeren vanuit Excel. Let op: dit <em>vervangt</em> de bestaande database. Er verschijnt altijd een bevestigingsscherm met hoeveel producten oud en nieuw zijn.</p>
          <p><strong>Product bewerken</strong> — Klik op het potloodje achter een product om de gegevens aan te passen. Klik op een cel om deze direct te bewerken.</p>
          <p><strong>Handleiding-link</strong> — Als een product een handleiding-link heeft, kun je deze tijdens de keuring direct openen.</p>
        </div>

        <!-- ── KEURINGEN ── -->
        <div id="hlp-keuringen" class="hlp-sectie">
          <h3 class="hlp-titel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Keuringen
          </h3>
          <p>Het hart van de app. Hier voer je keuringen uit en beheer je alle certificaten.</p>

          <p><strong>Nieuwe keuring starten</strong></p>
          <ol class="hlp-stappen">
            <li>Klik op "+ Nieuwe keuring"</li>
            <li>Selecteer de klant</li>
            <li>Er wordt een nieuw certificaatnummer aangemaakt</li>
            <li>Items uit de vorige keuring worden automatisch overgenomen</li>
          </ol>

          <p><strong>Items beoordelen</strong> — Elk item krijgt een status: goedgekeurd (groen) of afgekeurd (rood). Bij afkeuring selecteer je een afkeurcode.</p>

          <p><strong>Scanner</strong> — Gebruik de scannerknop om serienummers te scannen via de camera. De app herkent barcodes, QR-codes en DataMatrix-codes.</p>

          <p><strong>Nieuw item toevoegen</strong> — Klik op "+ Item" om een nieuw artikel toe te voegen. Begin met het serienummer of scan het. Selecteer daarna het producttype uit de database.</p>

          <p><strong>Keuring afronden</strong> — Als alle items beoordeeld zijn, klik je op "Keuring afronden". Hierna kun je het certificaat genereren als PDF.</p>

          <p><strong>Certificaat</strong> — Na afronden kun je het certificaat downloaden als PDF en per e-mail versturen naar de klant.</p>

          <p><strong>Afgevoerd</strong> — Items die niet meer in gebruik zijn kun je "afvoeren". Ze verdwijnen uit de actieve lijst maar blijven bewaard in de historie. Er wordt nooit iets definitief verwijderd.</p>
        </div>

        <!-- ── SN ZOEKEN ── -->
        <div id="hlp-snzoeken" class="hlp-sectie">
          <h3 class="hlp-titel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="4" rx="1"/><rect x="2" y="10" width="20" height="4" rx="1"/><rect x="2" y="16" width="20" height="4" rx="1"/></svg>
            SN Zoeken
          </h3>
          <p>Zoek een specifiek serienummer op door alle keuringen heen. Handig als een klant belt met een vraag over een specifiek artikel.</p>
          <p>Typ (een deel van) het serienummer in en je ziet direct bij welke klant, keuring en met welke status het artikel is geregistreerd.</p>
        </div>

        <!-- ── RECALL ZOEKEN ── -->
        <div id="hlp-recall" class="hlp-sectie">
          <h3 class="hlp-titel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Recall Zoeken
          </h3>
          <p>Zoek op producttype of merk om snel te vinden bij welke klanten dat product in gebruik is. Essentieel bij een fabrikant-recall: je vindt in één keer alle getroffen artikelen bij al je klanten.</p>
        </div>

        <!-- ── SN REFERENTIE ── -->
        <div id="hlp-snref" class="hlp-sectie">
          <h3 class="hlp-titel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            SN Referentie
          </h3>
          <p>Naslagwerk voor serienummer-formaten per merk. Handig als je twijfelt hoe een serienummer gelezen moet worden.</p>
          <p>Elk merk heeft zijn eigen opbouw: sommige beginnen met het productiejaar, andere met een volgnummer. De referentiekaarten laten zien hoe je het serienummer moet interpreteren.</p>
        </div>

        <!-- ── INSTELLINGEN ── -->
        <div id="hlp-instellingen" class="hlp-sectie">
          <h3 class="hlp-titel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Instellingen
          </h3>
          <p>Hier kun je je bedrijfsgegevens en certificaat-instellingen aanpassen.</p>
          <p><strong>Bedrijfsgegevens</strong> — Naam, KvK-nummer, adres, telefoon, e-mail. Deze verschijnen op je certificaten.</p>
          <p><strong>Logo</strong> — Upload je bedrijfslogo. Dit wordt weergegeven op certificaten en in de app.</p>
          <p><strong>Certificaat teksten</strong> — De koptekst en voettekst die op elk certificaat verschijnen. Pas deze aan naar je eigen wensen.</p>
          <p><strong>Certificaat kolommen</strong> — Bepaal welke kolommen op het certificaat staan (bijv. serienummer, omschrijving, merk, productiejaar, status).</p>
          <p><strong>Afkeurcodes</strong> — Beheer de lijst met afkeurcodes. Je kunt codes toevoegen, bewerken of verwijderen.</p>
          <p><strong>Handtekening</strong> — Upload je eigen handtekening. Deze verschijnt automatisch op certificaten die jij afrondt.</p>
          <p><strong>Backup</strong> — Download een JSON-backup van al je data. Dit is je noodkopie mocht er ooit iets misgaan.</p>
        </div>

        <!-- ── TIPS & SNELTOETSEN ── -->
        <div id="hlp-tips" class="hlp-sectie">
          <h3 class="hlp-titel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            Tips &amp; Sneltoetsen
          </h3>
          <p><strong>Ctrl + K</strong> — Open de globale zoekfunctie. Zoek door producten, klanten en serienummers vanuit elke pagina.</p>
          <p><strong>Escape</strong> — Sluit het huidige venster, modal of deze handleiding.</p>
          <p><strong>Thema wisselen</strong> — Klik op het maantje/zonnetje linksboven om te schakelen tussen licht en donker thema.</p>
          <p><strong>Mobiel gebruik</strong> — De app is volledig bruikbaar op je telefoon. Het menu open je via het hamburger-icoontje linksboven.</p>
          <p><strong>Scanner</strong> — De scanner werkt het beste met voldoende licht en een scherpe camera. Houd het serienummer op 10-15 cm afstand.</p>
        </div>

        <!-- Versie -->
        <div style="text-align:center;padding:20px 0 8px;color:var(--text-muted);font-size:12px;">
          KlimKeur Pro V4.0
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    const box = overlay.querySelector('.handleiding-box');
    if (box) box.style.transform = 'translateY(0)';

    // Scroll naar de juiste sectie als je op een specifieke pagina zit
    if (sectieId) {
      setTimeout(() => scrollNaarSectie(sectieId, false), 100);
    }
  });
}

function sluitHandleiding() {
  const overlay = document.getElementById('handleidingOverlay');
  if (!overlay) return;
  overlay.style.opacity = '0';
  const box = overlay.querySelector('.handleiding-box');
  if (box) box.style.transform = 'translateY(20px)';
  setTimeout(() => overlay.remove(), 300);
}

function scrollNaarSectie(id, smooth) {
  const el = document.getElementById(id);
  const container = document.getElementById('handleidingContent');
  if (!el || !container) return;

  // Highlight de aangeklikte nav-knop
  document.querySelectorAll('.handleiding-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === el.querySelector('.hlp-titel')?.textContent?.trim());
  });

  el.scrollIntoView({ behavior: smooth !== false ? 'smooth' : 'auto', block: 'start' });
}

/**
 * Bepaal welke handleiding-sectie past bij de huidige pagina
 */
function _getSectieVoorPagina() {
  if (typeof currentPage === 'undefined') return null;
  const map = {
    dashboard:    'hlp-dashboard',
    klanten:      'hlp-klanten',
    keurmeesters: 'hlp-keurmeesters',
    producten:    'hlp-producten',
    keuringen:    'hlp-keuringen',
    snzoeken:     'hlp-snzoeken',
    recall:       'hlp-recall',
    snref:        'hlp-snref',
    instellingen: 'hlp-instellingen',
    bedrijven:    null, // platform admin — geen aparte handleiding nodig
  };
  return map[currentPage] || null;
}

// Sluit met Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('handleidingOverlay')) {
    sluitHandleiding();
  }
});
