'use strict';

// ============================================================
// branding.js — Bedrijfsbranding laden en toepassen
// ============================================================

const STANDAARD_KLEUREN = {
  kleur_primair:        '#5B9A2F',
  kleur_primair_donker: '#3D7A1A',
  kleur_accent:         '#8BC53F',
};

async function laadBranding(bedrijfId) {
  if (!bedrijfId) {
    pasKleurenToe(STANDAARD_KLEUREN);
    return;
  }

  try {
    const { data, error } = await sb
      .from('bedrijven')
      .select('naam, logo_url, kleur_primair, kleur_primair_donker, kleur_accent')
      .eq('id', bedrijfId)
      .maybeSingle();

    if (error || !data) {
      pasKleurenToe(STANDAARD_KLEUREN);
      return;
    }

    pasKleurenToe(data);

    if (data.logo_url) {
      const logo = document.querySelector('.sidebar-logo img');
      if (logo) logo.src = data.logo_url;
    }

    if (data.naam) {
      const headerSub = document.querySelector('.sidebar-logo span');
      if (headerSub) headerSub.textContent = data.naam;
    }

  } catch (err) {
    console.error('Branding laden fout:', err);
    pasKleurenToe(STANDAARD_KLEUREN);
  }
}

function pasKleurenToe(data) {
  const root = document.documentElement;
  if (data.kleur_primair)        root.style.setProperty('--sg-green',       data.kleur_primair);
  if (data.kleur_primair_donker) root.style.setProperty('--sg-green-dark',  data.kleur_primair_donker);
  if (data.kleur_accent)         root.style.setProperty('--sg-green-light', data.kleur_accent);
}
