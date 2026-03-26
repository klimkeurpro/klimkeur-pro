// ============================================================
// pdf.js — PDF certificaat generatie en export
// ============================================================

function generateCertPDF(k, items, subtitle) {
  // Shared PDF generation for full cert and per-gebruiker
  const s = store.settings;
  const { jsPDF } = window.jspdf;

  // Smart orientation: portrait for ≤25 items (fits better on 1 page), landscape for more
  const itemCount = items.length;
  const usePortrait = itemCount <= 25;
  const doc = new jsPDF({ orientation: usePortrait ? 'portrait' : 'landscape', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentW = pageW - margin * 2;
  let y = margin;

  const brandColor = [91, 154, 47];
  const textDark = [30, 30, 30];
  const textGray = [100, 100, 100];
  const lineColor = [200, 200, 200];

  // ---- HEADER ----
  if (s.logo) {
    try { doc.addImage(s.logo, 'PNG', margin, y, 30, 15); } catch(e) {}
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandColor);
  doc.text('KEURINGS-CERTIFICAAT', pageW - margin, y + 5, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textGray);
  doc.text(s.bedrijfsnaam || 'Safety Green B.V.', pageW - margin, y + 11, { align: 'right' });
  if (subtitle) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...brandColor);
    doc.text('Gebruiker: ' + subtitle, pageW - margin, y + 16, { align: 'right' });
  }

  y += 20;
  doc.setDrawColor(...brandColor);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  // ---- KEURING INFO ----
  doc.setFontSize(9);
  doc.setTextColor(...textDark);

  const klant = store.klanten.find(kl => kl.id === k.klantId);
  const klantAdres = klant ? [klant.straat, klant.huisnummer].filter(Boolean).join(' ') : '';
  const klantPlaats = klant ? [klant.postcode, klant.plaats].filter(Boolean).join(' ') : '';

  const col1x = margin;
  const col2x = pageW / 2 + 10;

  const infoLeft = [
    ['Eigenaar materialen:', k.klantNaam || ''],
    klantAdres ? ['Adres:', klantAdres] : null,
    klantPlaats ? ['', klantPlaats] : null,
  ].filter(Boolean);

  const infoRight = [
    ['Certificaatnummer:', k.certificaatNr || ''],
    ['Keuringsdatum:', formatDate(k.datum)],
    ['Keurmeester:', k.keurmeester || ''],
  ].filter(Boolean);

  for (let r = 0; r < Math.max(infoLeft.length, infoRight.length); r++) {
    if (infoLeft[r]) {
      doc.setFont('helvetica', 'bold');
      doc.text(infoLeft[r][0], col1x, y);
      doc.setFont('helvetica', 'normal');
      doc.text(infoLeft[r][1], col1x + 38, y);
    }
    if (infoRight[r]) {
      doc.setFont('helvetica', 'bold');
      doc.text(infoRight[r][0], col2x, y);
      doc.setFont('helvetica', 'normal');
      doc.text(infoRight[r][1], col2x + 33, y);
    }
    y += 4.5;
  }
  y += 2;

  // ---- CERTIFICAAT TEKST BOVEN ----
  const koptekst = s.certificaatTekst || _bedrijfInfo?.cert_koptekst || '';
  if (koptekst) {
    doc.setFontSize(7.5);
    doc.setTextColor(...textGray);
    const txtLines = doc.splitTextToSize(koptekst, contentW);
    doc.text(txtLines, margin, y);
    y += txtLines.length * 3.2 + 2;
  }

  // ---- AFKEURCODES LEGENDA (compact) ----
  const codes = getAfkeurcodes();
  if (codes.length > 0) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textGray);
    doc.text('Afkeurcodes:', margin, y);
    doc.setFont('helvetica', 'normal');
    const codeStr = codes.map(c => c.code + '=' + c.tekst).join('  ·  ');
    const codeLines = doc.splitTextToSize(codeStr, contentW - 22);
    doc.text(codeLines, margin + 22, y);
    y += codeLines.length * 2.8 + 3;
  }

  // ---- ITEMS TABLE ----
  const certCols = s.certColumns || { materiaal: false, enNorm: false, breuksterkte: false };

  // Filter: only rated items on certificate
  const ratedItems = items.filter(item => item.status === 'goedgekeurd' || item.status === 'afgekeurd');

  // Sort using current table sort state
  const sortedItems = [...ratedItems].sort((a, b) => {
    const col = keuringItemSort.col;
    const cmp = (x, y) => (x||'').localeCompare(y||'', 'nl', {sensitivity:'base'});
    const val = (obj) => {
      if (col === 'fabrJaar') return String(obj.fabrJaar||'');
      if (col === 'inGebruik') return obj.inGebruik||'';
      return obj[col]||'';
    };
    const result = cmp(val(a), val(b));
    return keuringItemSort.asc ? result : -result;
  });

  // Smart hiding: check if columns have any non-empty values
  const hasGebruiker = subtitle ? false : sortedItems.some(item => item.gebruiker && item.gebruiker.trim());
  const hasOpmerking = sortedItems.some(item => item.opmerking && item.opmerking.trim());
  const hasInGebruik = sortedItems.some(item => item.inGebruik && item.inGebruik.trim());

  // Build dynamic column list
  const colDefs = [];
  colDefs.push({ key: '#', label: '#', fixed: 7, halign: 'center' });
  colDefs.push({ key: 'omschrijving', label: 'Omschrijving', width: 'auto', minW: 30 });
  colDefs.push({ key: 'merk', label: 'Merk', fixed: 22 });
  if (certCols.materiaal) colDefs.push({ key: 'materiaal', label: 'Materiaal', fixed: 22 });
  if (certCols.enNorm) colDefs.push({ key: 'enNorm', label: 'EN-norm', fixed: 22 });
  if (certCols.breuksterkte) colDefs.push({ key: 'breuksterkte', label: 'Breuksterkte', fixed: 18 });
  colDefs.push({ key: 'serienummer', label: 'Serienummer', fixed: 28, font: 'courier', fontSize: 6.5 });
  colDefs.push({ key: 'fabrJaar', label: 'Fabr.', fixed: 14, halign: 'center' });
  if (hasInGebruik) colDefs.push({ key: 'inGebruik', label: 'In gebruik', fixed: 20 });
  colDefs.push({ key: 'goed', label: 'Goed', fixed: 12, halign: 'center', bold: true, color: brandColor });
  colDefs.push({ key: 'afkeur', label: 'Afkeur', fixed: 14, halign: 'center', bold: true, color: [200,40,40] });
  if (hasOpmerking) colDefs.push({ key: 'opmerking', label: 'Opmerking', width: 'auto', minW: 18 });
  if (hasGebruiker) colDefs.push({ key: 'gebruiker', label: 'Gebruiker', fixed: 20 });

  const tableHeaders = colDefs.map(c => c.label);

  const tableData = sortedItems.map((item, i) => {
    const fabrStr = item.fabrJaar ? (item.fabrJaar + (item.fabrMaand ? '/' + String(item.fabrMaand).padStart(2,'0') : '')) : '';
    return colDefs.map(c => {
      if (c.key === '#') return String(i + 1);
      if (c.key === 'fabrJaar') return fabrStr;
      if (c.key === 'inGebruik') return item.inGebruik ? formatDate(item.inGebruik) : '';
      if (c.key === 'goed') return item.status === 'goedgekeurd' ? 'X' : '';
      if (c.key === 'afkeur') return item.status === 'afgekeurd' ? (item.afkeurcode || 'X') : '';
      return item[c.key] || '';
    });
  });

  // Automatische schaling: probeer alles op één pagina te krijgen
  const availableH = pageH - y - 40; // 40mm voor footer en handtekening
  const rowHeightBase = 6; // mm per rij bij fontSize 7.5
  const headerH = 8;
  const estimatedH = headerH + tableData.length * rowHeightBase;
  
  let tableFontSize = 7.5;
  let tableCellPadding = 2;
  
  if (estimatedH > availableH && tableData.length > 0) {
    // Probeer eerst met kleinere font
    const scaleFactor = availableH / estimatedH;
    tableFontSize = Math.max(5, 7.5 * scaleFactor);
    tableCellPadding = Math.max(0.8, 2 * scaleFactor);
  }

  doc.autoTable({
    startY: y,
    head: [tableHeaders],
    body: tableData,
    margin: { left: margin, right: margin },
    tableWidth: 'auto',
    styles: {
      fontSize: tableFontSize,
      cellPadding: tableCellPadding,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
      textColor: textDark,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: brandColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: tableFontSize,
    },
    alternateRowStyles: {
      fillColor: [245, 248, 242],
    },
    columnStyles: Object.fromEntries(colDefs.map((c, i) => {
      const style = {};
      if (c.fixed) style.cellWidth = c.fixed;
      else if (c.width === 'auto') { style.cellWidth = 'auto'; if (c.minW) style.minCellWidth = c.minW; }
      if (c.halign) style.halign = c.halign;
      if (c.font) style.font = c.font;
      if (c.fontSize) style.fontSize = c.fontSize;
      if (c.bold) style.fontStyle = 'bold';
      if (c.color) style.textColor = c.color;
      return [i, style];
    })),
    didParseCell: function(data) {
      if (data.section === 'body') {
        const goodIdx = colDefs.findIndex(c => c.key === 'goed');
        const afkIdx = colDefs.findIndex(c => c.key === 'afkeur');
        if (data.column.index === goodIdx && data.cell.raw === 'X') {
          data.cell.styles.fillColor = [230, 245, 220];
        }
        if (data.column.index === afkIdx && data.cell.raw) {
          data.cell.styles.fillColor = [250, 225, 225];
        }
      }
    },
  });

  y = doc.lastAutoTable.finalY + 6;

  // ---- SUMMARY ----
  const goed = items.filter(i => i.status === 'goedgekeurd').length;
  const afk = items.filter(i => i.status === 'afgekeurd').length;
  const open = items.filter(i => !i.status).length;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`Totaal: ${items.length} items`, margin, y);
  doc.setTextColor(...brandColor);
  doc.text(`Goedgekeurd: ${goed}`, margin + 35, y);
  doc.setTextColor(200, 40, 40);
  doc.text(`Afgekeurd: ${afk}`, margin + 70, y);
  y += 6;

  // ---- CERTIFICAAT TEKST ONDER ----
  const voettekst = s.certificaatTekstOnder || _bedrijfInfo?.cert_voettekst || '';
  if (voettekst) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textGray);
    const txtLines = doc.splitTextToSize(voettekst, contentW);
    doc.text(txtLines, margin, y);
    y += txtLines.length * 3.2 + 5;
  }

  // ---- SIGNATURE ----
  // Handtekening nodig minstens ~30mm, controleer of het past
  if (y > pageH - 38) { doc.addPage(); y = margin; }

  const sigW = (contentW - 20) / 2;
  const sigX2 = pageW / 2 + 10;

  // Handtekening — gebruik handtekening van de actieve keurmeester, anders die van instellingen
  const actieveKm = (store.keurmeesters||[]).find(km => km.naam === k.keurmeester);
  const handtekeningBron = (actieveKm?.handtekening) || s.handtekening;
  if (handtekeningBron) {
    try { doc.addImage(handtekeningBron, 'PNG', margin + 5, y, 30, 12); } catch(e) {}
  }

  doc.setDrawColor(...lineColor);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 14, margin + sigW, y + 14);
  doc.line(sigX2, y + 14, sigX2 + sigW, y + 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textGray);
  doc.text('Keurmeester: ' + (k.keurmeester || ''), margin, y + 19);
  doc.text('Datum: ' + formatDate(k.datum), margin, y + 23);
  doc.text('Eigenaar materialen: ' + (k.klantNaam || ''), sigX2, y + 19);

  // ---- FOOTER on all pages ----
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textGray);
    doc.text(
      `${s.bedrijfsnaam || 'Safety Green B.V.'} — Certificaat ${k.certificaatNr || ''} — Pagina ${p}/${totalPages}`,
      pageW / 2, pageH - 6, { align: 'center' }
    );
    doc.setDrawColor(...brandColor);
    doc.setLineWidth(0.5);
    doc.line(margin, pageH - 9, pageW - margin, pageH - 9);
  }

  return doc;
}

function exportKeuringJSON(id) {
  const k = store.keuringen.find(ke => ke.id === id);
  if (!k) return;
  const s = store.settings;

  // Build clean JSON certificaat in fixed format for klantapp
  const cert = {
    _format: 'klimkeur-certificaat-v1',
    _gegenereerd: new Date().toISOString(),
    certificaat: {
      nr: k.certificaatNr || '',
      datum: k.datum,
      afgerond: k.afgerond || false,
      keurmeester: k.keurmeester || '',
      bedrijf: s.bedrijfsnaam || '',
      kvk: s.kvk || '',
    },
    klant: {
      naam: k.klantNaam || '',
      id: k.klantId || '',
    },
    items: (k.items || [])
      .filter(i => !i.inactive)
      .map(i => ({
        itemId: i.itemId || null,
        omschrijving: i.omschrijving || '',
        merk: i.merk || '',
        materiaal: i.materiaal || '',
        serienummer: i.serienummer || '',
        fabrJaar: i.fabrJaar || '',
        fabrMaand: i.fabrMaand || '',
        inGebruik: i.inGebruik || '',
        gebruiker: i.gebruiker || '',
        status: i.status || '',
        afkeurcode: i.afkeurcode || '',
        opmerking: i.opmerking || '',
        enNorm: i.enNorm || '',
        maxLeeftijd: i.maxLeeftijd || '',
        handleiding: i.handleiding || '',
      }))
  };

  const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Certificaat_${k.certificaatNr || k.klantNaam || 'keuring'}_${k.datum}.json`;
  a.click();
  toast('JSON certificaat geëxporteerd');
}

function exportKeuringJSONPerGebruiker(id) {
  const k = store.keuringen.find(ke => ke.id === id);
  if (!k) return;
  const s = store.settings;
  const cols = s.certColumns || {};

  const bouwItem = (i) => {
    const item = {
      itemId:        i.itemId || null,
      omschrijving:  i.omschrijving || '',
      merk:          i.merk || '',
      serienummer:   i.serienummer || '',
      fabrJaar:      i.fabrJaar || '',
      fabrMaand:     i.fabrMaand || '',
      inGebruik:     i.inGebruik || '',
      gebruiker:     i.gebruiker || '',
      status:        i.status || '',
      afkeurcode:    i.afkeurcode || '',
      opmerking:     i.opmerking || '',
    };
    if (cols.materiaal)    item.materiaal    = i.materiaal    || '';
    if (cols.enNorm)       item.norm       = i.enNorm       || '';
    if (cols.breuksterkte) item.breuksterkte = i.breuksterkte || '';
    if (cols.handleiding)  item.handleiding  = i.handleiding  || '';
    return item;
  };

  // 3 jaar limiet op historie
  const drieJaarGeleden = new Date();
  drieJaarGeleden.setFullYear(drieJaarGeleden.getFullYear() - 3);
  const drieJaarStr = drieJaarGeleden.toISOString().split('T')[0];

  const alleKeuringen = store.keuringen
    .filter(ke => (ke.klantId === k.klantId || ke.klantNaam === k.klantNaam) && (ke.datum || '') >= drieJaarStr)
    .sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));

  // Groepeer huidige items per gebruiker
  const groepen = {};
  (k.items || []).filter(i => !i.inactive).forEach(item => {
    const g = item.gebruiker || 'Algemeen';
    if (!groepen[g]) groepen[g] = [];
    groepen[g].push(item);
  });

  const gebruikers = Object.keys(groepen);
  if (gebruikers.length <= 1) {
    // Maar 1 gebruiker, gewoon normaal exporteren
    exportKeuringJSON(id);
    return;
  }

  // Genereer een JSON per gebruiker
  gebruikers.forEach(gebruiker => {
    const itemsVoorGebruiker = groepen[gebruiker];
    const cert = {
      _format: 'klimkeur-certificaat-v1',
      _gegenereerd: new Date().toISOString(),
      _gebruiker: gebruiker,
      _aantalKeuringen: alleKeuringen.length,
      klant: { naam: k.klantNaam || '', id: k.klantId || '' },
      afkeurcodes: getAfkeurcodes().map(c => ({ code: c.code, tekst: c.tekst })),
      certificaat: {
        nr:          k.certificaatNr || '',
        datum:       k.datum,
        afgerond:    k.afgerond || false,
        keurmeester: k.keurmeester || '',
        bedrijf:     s.bedrijfsnaam || '',
      },
      items: itemsVoorGebruiker.map(bouwItem),
      // Historie gefilterd op deze gebruiker
      historie: alleKeuringen.map(ke => ({
        certificaatNr: ke.certificaatNr || '',
        datum:         ke.datum,
        afgerond:      ke.afgerond || false,
        keurmeester:   ke.keurmeester || '',
        items: (ke.items || [])
          .filter(i => !i.inactive && (i.gebruiker || 'Algemeen') === gebruiker)
          .map(bouwItem),
      })).filter(ke => ke.items.length > 0),
    };

    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const safeName = gebruiker.replace(/[^a-zA-Z0-9]/g, '_');
    const klantName = (k.klantNaam || 'klant').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `KlimKeur_${klantName}_${safeName}_${k.datum}.json`;
    a.click();
  });

  toast(`${gebruikers.length} JSON bestanden geëxporteerd (per gebruiker)`);
}

function exportKeuringPDF(id) {
  const k = store.keuringen.find(ke => ke.id === id);
  if (!k) return;
  const onbeoordeeld = (k.items||[]).filter(i => !i.status).length;
  if (onbeoordeeld > 0) {
    toast(`⚠ Let op: ${onbeoordeeld} onbeoordeeld${onbeoordeeld>1?'e':''} item${onbeoordeeld>1?'s worden':' wordt'} NIET meegenomen in het certificaat.`, 'warning', 5000);
  }
  previewCertPDF(id);
}

function previewCertPDF(id) {
  const k = store.keuringen.find(ke => ke.id === id);
  if (!k) return;
  const doc = generateCertPDF(k, k.items || []);
  const dataUri = doc.output('datauristring');
  // Open in nieuw tabblad zodat de app open blijft
  const nieuwTabblad = window.open('', '_blank');
  if (nieuwTabblad) {
    nieuwTabblad.document.write(
      '<html><head><title>Certificaat ' + (k.certificaatNr || k.klantNaam) + '</title></head>' +
      '<body style="margin:0;padding:0;">' +
      '<iframe src="' + dataUri + '" style="width:100%;height:100vh;border:none;"></iframe>' +
      '</body></html>'
    );
    nieuwTabblad.document.close();
  } else {
    toast('Sta popups toe in je browser, of gebruik de Downloaden-knop', 'warning', 5000);
  }
}

function downloadCertPDF(id) {
  const k = store.keuringen.find(ke => ke.id === id);
  if (!k) return;
  const doc = generateCertPDF(k, k.items || []);
  const filename = `Certificaat_${k.certificaatNr || k.klantNaam || 'keuring'}_${k.datum}.pdf`;
  doc.save(filename);
  toast('PDF certificaat geëxporteerd');
}

function exportKeuringPDFPerGebruiker(id) {
  const k = store.keuringen.find(ke => ke.id === id);
  if (!k || !(k.items||[]).length) return;
  const onbeoordeeld = (k.items||[]).filter(i => !i.status).length;
  if (onbeoordeeld > 0) {
    toast(`⚠ Let op: ${onbeoordeeld} onbeoordeeld${onbeoordeeld>1?'e':''} item${onbeoordeeld>1?'s worden':' wordt'} NIET meegenomen in de certificaten.`, 'warning', 5000);
  }

  // Groepeer items per gebruiker (alleen beoordeelde items)
  const groepen = {};
  (k.items || []).filter(item => item.status === 'goedgekeurd' || item.status === 'afgekeurd').forEach(item => {
    const gebr = item.gebruiker || 'Onbekend';
    if (!groepen[gebr]) groepen[gebr] = [];
    groepen[gebr].push(item);
  });

  const gebruikers = Object.keys(groepen);
  if (gebruikers.length <= 1) {
    // Maar 1 gebruiker, gewoon normaal exporteren
    exportKeuringPDF(id);
    return;
  }

  // Genereer een PDF per gebruiker
  let count = 0;
  gebruikers.forEach(gebr => {
    const items = groepen[gebr];
    const doc = generateCertPDF(k, items, gebr);
    const safeName = gebr.replace(/[^a-zA-Z0-9\-]/g, '_');
    const filename = `Certificaat_${k.certificaatNr || ''}_${safeName}.pdf`;
    doc.save(filename);
    count++;
  });

  toast(`${count} PDF certificaten geëxporteerd (per gebruiker)`);
}

function exportSingleKeuringExcel(id) {
  const k = store.keuringen.find(ke => ke.id === id);
  if (!k) return;
  const onbeoordeeld = (k.items||[]).filter(i => !i.status).length;
  if (onbeoordeeld > 0) {
    toast(`⚠ Let op: ${onbeoordeeld} onbeoordeeld${onbeoordeeld>1?'e':''} item${onbeoordeeld>1?'s worden':' wordt'} NIET meegenomen in de export.`, 'warning', 5000);
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: Clean data table - sorted and easy to copy into your own template
  const headers = ['Omschrijving', 'Merk', 'Materiaal', 'Serienummer', 'Fabr. Jaar', 'Fabr. Maand', 'In gebruik', 'Goed', 'Afkeur', 'Afkeurcode', 'Opmerking', 'Gebruiker'];
  const dataRows = [headers];
  const sortedItems = [...(k.items || [])].filter(item => item.status === 'goedgekeurd' || item.status === 'afgekeurd').sort((a, b) => {
    const col = keuringItemSort.col;
    const cmp = (x, y) => (x||'').localeCompare(y||'', 'nl', {sensitivity:'base'});
    const val = (obj) => {
      if (col === 'fabrJaar') return String(obj.fabrJaar||'');
      if (col === 'inGebruik') return obj.inGebruik||'';
      return obj[col]||'';
    };
    const result = cmp(val(a), val(b));
    return keuringItemSort.asc ? result : -result;
  });
  sortedItems.forEach(item => {
    dataRows.push([
      item.omschrijving||'', item.merk||'', item.materiaal||'', item.serienummer||'',
      item.fabrJaar||'', item.fabrMaand ? MAANDEN[item.fabrMaand] : '',
      item.inGebruik||'',
      item.status==='goedgekeurd'?'X':'',
      item.status==='afgekeurd'?'X':'',
      item.status==='afgekeurd'?(item.afkeurcode||''):'',
      item.opmerking||'', item.gebruiker||''
    ]);
  });
  const wsData = XLSX.utils.aoa_to_sheet(dataRows);
  wsData['!cols'] = [{wch:28},{wch:18},{wch:18},{wch:22},{wch:10},{wch:12},{wch:12},{wch:6},{wch:6},{wch:10},{wch:22},{wch:18}];
  XLSX.utils.book_append_sheet(wb, wsData, 'Keuringsdata');

  // Sheet 2: Keuring info (metadata)
  const infoRows = [
    ['Certificaatnummer', k.certificaatNr || ''],
    ['Keuringsdatum', k.datum],
    ['Klant', k.klantNaam || ''],
    ['Keurmeester', k.keurmeester || ''],
    ['Totaal items', (k.items||[]).length],
    ['Goedgekeurd', (k.items||[]).filter(i=>i.status==='goedgekeurd').length],
    ['Afgekeurd', (k.items||[]).filter(i=>i.status==='afgekeurd').length],
    ['Niet aangeboden', (k.items||[]).filter(i=>i.status==='niet_aangeboden').length],
    ['Afgerond', k.afgerond ? 'Ja' : 'Nee'],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
  wsInfo['!cols'] = [{wch:20},{wch:40}];
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Info');

  XLSX.writeFile(wb, `Data_${k.certificaatNr || k.klantNaam}_${k.datum}.xlsx`);
  toast('Excel data geëxporteerd — plak in je eigen template');
}
