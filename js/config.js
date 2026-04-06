// ============================================================
// config.js — Supabase verbinding, globale state, constanten
// ============================================================
const SUPABASE_URL    = 'https://vyptkeqcibtgyrnrcxrj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_94HAHA4s4elNEiP3-Mmz3g_UZGd4pgu';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'klimkeur-pro-auth',
    persistSession: true,
    autoRefreshToken: true,
  }
});
// Globale state
let _currentUser     = null;  // Supabase auth user object
let _appStarted      = false; // Voorkomt dubbele init
let _huidigBedrijfId = null;  // bedrijf_id van de ingelogde keurmeester
let _isPlatformAdmin = false; // true als de gebruiker platform-beheerder is (Jos)
let _bedrijfInfo     = null;  // volledig bedrijfsrecord uit de bedrijven-tabel
const DB_KEY = 'klimkeur_pro_v2'; // nog gebruikt voor theme/backup meta
// UI state
let store            = null;
let currentPage      = 'dashboard';
let productSort      = { col: 'omschrijving', asc: true };
let keuringItemSort  = { col: 'omschrijving', asc: true };
let productFilter    = { merk: '', materiaal: '', search: '' };
let productPage      = 0;
const PAGE_SIZE      = 50;
const COLUMN_LABELS  = {
  omschrijving: 'Omschrijving', merk: 'Merk', materiaal: 'Materiaal',
  bijzonderheden: 'Bijzonderheden',
  maxLeeftijdUSE: 'Max USE', maxLeeftijdMFR: 'Max MFR',
  enNorm: 'EN Norm', breuksterkte: 'Breuksterkte',
  handleiding: 'Handleiding', link: 'Link'
};
const MAANDEN = ['','Januari','Februari','Maart','April','Mei','Juni',
                 'Juli','Augustus','September','Oktober','November','December'];
// Overige globale state
let modalCallback        = null;
let pwaInstallPrompt     = null;
let _lastSelectedProduct = null;
let _materiaalCache      = null;
let _merkCache           = null;
let _omschrDebounceTimer = null;
let omschrDropIndex      = -1;
let _prodSearchTimer     = null;
