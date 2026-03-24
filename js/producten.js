// ============================================================
// producten.js — productdatabase, autocomplete, kolom-instellingen
// ============================================================

function renderProducten(el) {
  const vis = store.settings.visibleColumns;
  const cols = Object.keys(COLUMN_LABELS).filter(c => vis[c]);

  // Filter
  let prods = [...store.products];
  if (productFilter.search) {
    const s = productFilter.search.toLowerCase();
    prods = prods.filter(p => Object.values(p).some(v => String(v).toLowerCase().includes(s)));
  }
  if (productFilter.merk) prods = prods.filter(p => p.merk === productFilter.merk);
  if (productFilter.materiaal) prods = prods.filter(p => p.materiaal === productFilter.materiaal);

  // Sort
  prods.sort((a, b) => {
    let va = a[productSort.col] || '', vb = b[productSort.col] || '';
    if (typeof va === 'number' && typeof vb === 'number') return productSort.asc ? va - vb : vb - va;
    return productSort.asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  const totalPages = Math.ceil(prods.length / PAGE_SIZE);
  if (productPage >= totalPages) productPage = Math.max(0, totalPages - 1);
  const pageProds = prods.slice(productPage * PAGE_SIZE, (productPage + 1) * PAGE_SIZE);

  // Unique merken/materialen for filters
  const allMerken = [...new Set(store.products.map(p => p.merk))].filter(Boolean).sort();
  const allMateriaal = [...new Set(store.products.map(p => p.materiaal))].filter(Boolean).sort();

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;" class="fade-in">
      <div class="search-box" style="min-width:250px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="prodSearch" placeholder="Zoek product..." value="${productFilter.search}" oninput="handleProductSearch(this)">
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select class="form-select" style="width:auto;min-width:140px;" onchange="productFilter.merk=this.value;productPage=0;renderProducten(document.getElementById('pageContent'))">
          <option value="">Alle Merken</option>
          ${allMerken.map(m => `<option value="${m}" ${productFilter.merk===m?'selected':''}>${m}</option>`).join('')}
        </select>
        <select class="form-select" style="width:auto;min-width:140px;" onchange="productFilter.materiaal=this.value;productPage=0;renderProducten(document.getElementById('pageContent'))">
          <option value="">Alle Materialen</option>
          ${allMateriaal.map(m => `<option value="${m}" ${productFilter.materiaal===m?'selected':''}>${m}</option>`).join('')}
        </select>
        <button class="btn btn-sm" onclick="openColVisModal()">Kolommen</button>
        <button class="btn btn-primary btn-sm" onclick="openProductModal()">+ Product</button>
      </div>
    </div>

    ${(productFilter.merk || productFilter.materiaal) ? `
    <div class="filter-bar fade-in" id="prodFilterBar">
      <span style="font-size:12px;color:var(--text-muted);">Filters:</span>
      ${productFilter.merk ? `<div class="filter-chip">${productFilter.merk} <button onclick="productFilter.merk='';productPage=0;renderProducten(document.getElementById('pageContent'))">×</button></div>` : ''}
      ${productFilter.materiaal ? `<div class="filter-chip">${productFilter.materiaal} <button onclick="productFilter.materiaal='';productPage=0;renderProducten(document.getElementById('pageContent'))">×</button></div>` : ''}
    </div>` : '<div id="prodFilterBar"></div>'}

    <div class="card fade-in">
      <div class="table-container" style="max-height:calc(100vh - 280px);overflow-y:auto;">
        <table>
          <thead><tr>
            ${cols.map(c => `<th class="${productSort.col===c?'sorted':''}" onclick="sortProducts('${c}')">${COLUMN_LABELS[c]} <span class="sort-arrow">${productSort.col===c?(productSort.asc?'▲':'▼'):'▲'}</span></th>`).join('')}
            <th style="width:80px;"></th>
          </tr></thead>
          <tbody id="prodTableBody">
            ${pageProds.length === 0 ? `<tr><td colspan="${cols.length+1}" style="text-align:center;color:var(--text-muted);padding:40px;">Geen producten gevonden.</td></tr>` :
              pageProds.map((p, idx) => `
                <tr>
                  ${cols.map(c => {
                    let v = p[c] || '';
                    if (c === 'link' || c === 'handleiding') {
                      if (v && v.startsWith('http')) return `<td><a href="${v}" target="_blank" style="color:var(--sg-green);font-size:12px;">Link</a></td>`;
                      return `<td style="font-size:12px;color:var(--text-muted);">${v}</td>`;
                    }
                    return `<td title="${v}">${v}</td>`;
                  }).join('')}
                  <td>
                    <button class="btn-icon" title="Bewerken" onclick="openProductModal(${productPage * PAGE_SIZE + idx})">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination" style="padding:12px 20px;">
        <span id="prodPagInfo">${prods.length} producten${productFilter.search||productFilter.merk||productFilter.materiaal?' (gefilterd)':''}</span>
        <div class="pagination-btns">
          <button class="btn btn-sm" ${productPage===0?'disabled':''} onclick="productPage=0;renderProducten(document.getElementById('pageContent'))">«</button>
          <button class="btn btn-sm" ${productPage===0?'disabled':''} onclick="productPage--;renderProducten(document.getElementById('pageContent'))">‹</button>
          <span id="prodPagText" style="padding:5px 12px;font-size:13px;">${productPage+1} / ${totalPages||1}</span>
          <button class="btn btn-sm" ${productPage>=totalPages-1?'disabled':''} onclick="productPage++;renderProducten(document.getElementById('pageContent'))">›</button>
          <button class="btn btn-sm" ${productPage>=totalPages-1?'disabled':''} onclick="productPage=${totalPages-1};renderProducten(document.getElementById('pageContent'))">»</button>
        </div>
      </div>
    </div>
  `;
}

function sortProducts(col) {
  if (productSort.col === col) productSort.asc = !productSort.asc;
  else { productSort.col = col; productSort.asc = true; }
  renderProducten(document.getElementById('pageContent'));
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem(DB_KEY + '_theme', isLight ? 'light' : 'dark');
  document.getElementById('themeBtn').textContent = isLight ? '☀️' : '🌙';
}

function initTheme() {
  const saved = localStorage.getItem(DB_KEY + '_theme');
  if (saved === 'light') {
    document.body.classList.add('light-theme');
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = '☀️';
  }
}

function sortKeuringItems(keuringId, col) {
  if (keuringItemSort.col === col) keuringItemSort.asc = !keuringItemSort.asc;
  else { keuringItemSort.col = col; keuringItemSort.asc = true; }

  // Update header arrows zonder hele pagina te herladen
  document.querySelectorAll('th[data-sort-col]').forEach(th => {
    const c = th.dataset.sortCol;
    const arrow = th.querySelector('.sort-arrow');
    if (c === keuringItemSort.col) {
      th.classList.add('sorted');
      if (arrow) arrow.textContent = keuringItemSort.asc ? '\u25b2' : '\u25bc';
    } else {
      th.classList.remove('sorted');
      if (arrow) arrow.textContent = '\u25b2';
    }
  });

  // Alleen tbody herschikken
  const k = store.keuringen.find(ke => ke.id === keuringId);
  if (!k) return;
  const tbody = document.querySelector('.keuring-items-tbody');
  if (!tbody) { openKeuringDetail(keuringId); return; }

  const rows = [...tbody.querySelectorAll('tr[data-item-idx]')];
  const cmp = (x, y) => (String(x)||'').localeCompare(String(y)||'', 'nl', {sensitivity:'base'});
  rows.sort((a, b) => {
    const attrCol = keuringItemSort.col === 'inGebruik' ? 'ingebruik' : keuringItemSort.col === 'fabrJaar' ? 'fabrjaar' : keuringItemSort.col.toLowerCase();
    const valA = a.getAttribute('data-sort_' + attrCol) || '';
    const valB = b.getAttribute('data-sort_' + attrCol) || '';
    const result = cmp(valA, valB);
    return keuringItemSort.asc ? result : -result;
  });
  rows.forEach((r, i) => {
    const numCell = r.querySelector('.row-num');
    if (numCell) numCell.textContent = i + 1;
    tbody.appendChild(r);
  });
}

_prodSearchTimer = null;
function handleProductSearch(input) {
  productFilter.search = input.value;
  clearTimeout(_prodSearchTimer);
  _prodSearchTimer = setTimeout(() => {
    productPage = 0;
    updateProductTable();
  }, 150);
}

function getFilteredProducts() {
  let prods = [...store.products];
  if (productFilter.search) {
    const s = productFilter.search.toLowerCase();
    prods = prods.filter(p => Object.values(p).some(v => String(v).toLowerCase().includes(s)));
  }
  if (productFilter.merk) prods = prods.filter(p => p.merk === productFilter.merk);
  if (productFilter.materiaal) prods = prods.filter(p => p.materiaal === productFilter.materiaal);
  prods.sort((a, b) => {
    let va = a[productSort.col] || '', vb = b[productSort.col] || '';
    if (typeof va === 'number' && typeof vb === 'number') return productSort.asc ? va - vb : vb - va;
    return productSort.asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
  return prods;
}

function updateProductTable() {
  const vis = store.settings.visibleColumns;
  const cols = Object.keys(COLUMN_LABELS).filter(c => vis[c]);
  const prods = getFilteredProducts();
  const totalPages = Math.ceil(prods.length / PAGE_SIZE);
  if (productPage >= totalPages) productPage = Math.max(0, totalPages - 1);
  const pageProds = prods.slice(productPage * PAGE_SIZE, (productPage + 1) * PAGE_SIZE);

  const tbody = document.getElementById('prodTableBody');
  if (tbody) {
    tbody.innerHTML = pageProds.length === 0 ?
      `<tr><td colspan="${cols.length+1}" style="text-align:center;color:var(--text-muted);padding:40px;">Geen producten gevonden.</td></tr>` :
      pageProds.map((p, idx) => `
        <tr>
          ${cols.map(c => {
            let v = p[c] || '';
            if (c === 'link' || c === 'handleiding') {
              if (v && String(v).startsWith('http')) return `<td><a href="${v}" target="_blank" style="color:var(--sg-green);font-size:12px;">Link</a></td>`;
              return `<td style="font-size:12px;color:var(--text-muted);">${v}</td>`;
            }
            return `<td title="${v}">${v}</td>`;
          }).join('')}
          <td>
            <button class="btn-icon" title="Bewerken" onclick="openProductModal(${productPage * PAGE_SIZE + idx})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </td>
        </tr>
      `).join('');
  }

  const pagInfo = document.getElementById('prodPagInfo');
  if (pagInfo) pagInfo.textContent = `${prods.length} producten${productFilter.search||productFilter.merk||productFilter.materiaal?' (gefilterd)':''}`;
  const pagText = document.getElementById('prodPagText');
  if (pagText) pagText.textContent = `${productPage+1} / ${totalPages||1}`;

  // Update filter chips
  const filterBar = document.getElementById('prodFilterBar');
  if (filterBar) {
    filterBar.innerHTML = (productFilter.merk || productFilter.materiaal) ? `
      <span style="font-size:12px;color:var(--text-muted);">Filters:</span>
      ${productFilter.merk ? `<div class="filter-chip">${productFilter.merk} <button onclick="productFilter.merk='';productPage=0;renderProducten(document.getElementById('pageContent'))">×</button></div>` : ''}
      ${productFilter.materiaal ? `<div class="filter-chip">${productFilter.materiaal} <button onclick="productFilter.materiaal='';productPage=0;renderProducten(document.getElementById('pageContent'))">×</button></div>` : ''}
    ` : '';
  }
}

function openProductModal(idx) {
  const p = idx !== undefined ? store.products[idx] : null;
  const allMerken = [...new Set(store.products.map(p => p.merk))].filter(Boolean).sort();
  const allMateriaal = [...new Set(store.products.map(p => p.materiaal))].filter(Boolean).sort();

  showModal(p ? 'Product Bewerken' : 'Nieuw Product', `
    <input type="hidden" id="prodIdx" value="${idx !== undefined ? idx : -1}">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Omschrijving</label>
        <input class="form-input" id="prodOmschr" value="${p?.omschrijving || ''}" placeholder="Productnaam">
      </div>
      <div class="form-group">
        <label class="form-label">Merk</label>
        <input class="form-input" id="prodMerk" list="merkList" value="${p?.merk || ''}" placeholder="Merk">
        <datalist id="merkList">${allMerken.map(m=>`<option value="${m}">`).join('')}</datalist>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Materiaal</label>
        <input class="form-input" id="prodMat" list="matList" value="${p?.materiaal || ''}" placeholder="Materiaaltype">
        <datalist id="matList">${allMateriaal.map(m=>`<option value="${m}">`).join('')}</datalist>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Max Leeftijd USE</label>
        <input class="form-input" id="prodAgeUse" value="${p?.maxLeeftijdUSE || ''}" placeholder="bijv. 10 USE">
      </div>
      <div class="form-group">
        <label class="form-label">Max Leeftijd MFR</label>
        <input class="form-input" id="prodAgeMfr" value="${p?.maxLeeftijdMFR || ''}" placeholder="bijv. 15 MFR">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">EN-Norm</label>
        <input class="form-input" id="prodEN" value="${p?.enNorm || ''}" placeholder="bijv. EN 1891 type A">
      </div>
      <div class="form-group">
        <label class="form-label">Breuksterkte</label>
        <input class="form-input" id="prodBreuk" value="${p?.breuksterkte || ''}" placeholder="bijv. 35 kN">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Bijzonderheden</label>
      <input class="form-input" id="prodBijz" value="${p?.bijzonderheden || ''}" placeholder="Bijzonderheden / recalls">
    </div>
    <div class="form-group">
      <label class="form-label">Handleiding Link</label>
      <input class="form-input" id="prodLink" value="${p?.handleiding || p?.link || ''}" placeholder="URL naar handleiding">
    </div>
  `, () => {
    const i = parseInt(document.getElementById('prodIdx').value);

    // ── BUGFIX: id altijd meegeven ──────────────────────────────
    // Bij nieuw product: genereer een id.
    // Bij bewerken: bewaar het bestaande id — anders gaat Supabase
    // upsert mis en raakt het product ontkoppeld van zijn record.
    const data = {
      id:             i >= 0 ? (store.products[i].id || generateId()) : generateId(),
      omschrijving:   document.getElementById('prodOmschr').value,
      merk:           document.getElementById('prodMerk').value,
      materiaal:      document.getElementById('prodMat').value,
      maxLeeftijdUSE: document.getElementById('prodAgeUse').value,
      maxLeeftijdMFR: document.getElementById('prodAgeMfr').value,
      enNorm:         document.getElementById('prodEN').value,
      breuksterkte:   document.getElementById('prodBreuk').value,
      bijzonderheden: document.getElementById('prodBijz').value,
      handleiding:    document.getElementById('prodLink').value,
    };
    // ───────────────────────────────────────────────────────────

    if (!data.omschrijving) { toast('Vul een omschrijving in', 'error'); return; }
    if (i >= 0) store.products[i] = data;
    else store.products.push(data);
    saveStore(store);
    sbUpsertProduct(data).catch(console.error);
    closeModal();
    toast(i >= 0 ? 'Product bijgewerkt' : 'Product toegevoegd');
    renderProducten(document.getElementById('pageContent'));
  });
}

function openColVisModal() {
  const vis = store.settings.visibleColumns;
  showModal('Zichtbare Kolommen', `
    <div class="col-vis-grid">
      ${Object.keys(COLUMN_LABELS).map(c => `
        <label class="col-vis-item">
          <input type="checkbox" data-col="${c}" ${vis[c] ? 'checked' : ''}>
          ${COLUMN_LABELS[c]}
        </label>
      `).join('')}
    </div>
  `, () => {
    document.querySelectorAll('.col-vis-item input').forEach(inp => {
      store.settings.visibleColumns[inp.dataset.col] = inp.checked;
    });
    saveStore(store);
    sbSaveSettings(store.settings).catch(console.error);
    closeModal();
    toast('Kolommen bijgewerkt');
    renderProducten(document.getElementById('pageContent'));
  });
}

// ============================================================
// KEURINGEN
// ============================================================
