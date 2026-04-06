// ============================================================
// producten.js — productdatabase, autocomplete, kolom-instellingen
// ============================================================

// Lokale HTML escape — voorkomt dat product-data uit HTML-attributen breekt
function escP(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
        <input type="text" id="prodSearch" placeholder="Zoek product..." value="${escP(productFilter.search)}" oninput="handleProductSearch(this)">
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select class="form-select" style="width:auto;min-width:140px;" onchange="productFilter.merk=this.value;productPage=0;renderProducten(document.getElementById('pageContent'))">
          <option value="">Alle Merken</option>
          ${allMerken.map(m => `<option value="${escP(m)}" ${productFilter.merk===m?'selected':''}>${escP(m)}</option>`).join('')}
        </select>
        <select class="form-select" style="width:auto;min-width:140px;" onchange="productFilter.materiaal=this.value;productPage=0;renderProducten(document.getElementById('pageContent'))">
          <option value="">Alle Materialen</option>
          ${allMateriaal.map(m => `<option value="${escP(m)}" ${productFilter.materiaal===m?'selected':''}>${escP(m)}</option>`).join('')}
        </select>
        <button class="btn btn-sm" onclick="openColVisModal()">Kolommen</button>
        <button class="btn btn-primary btn-sm" onclick="openProductModal()">+ Product</button>
      </div>
    </div>

    ${(productFilter.merk || productFilter.materiaal) ? `
    <div class="filter-bar fade-in" id="prodFilterBar">
      <span style="font-size:12px;color:var(--text-muted);">Filters:</span>
      ${productFilter.merk ? `<div class="filter-chip">${escP(productFilter.merk)} <button onclick="productFilter.merk='';productPage=0;renderProducten(document.getElementById('pageContent'))">×</button></div>` : ''}
      ${productFilter.materiaal ? `<div class="filter-chip">${escP(productFilter.materiaal)} <button onclick="productFilter.materiaal='';productPage=0;renderProducten(document.getElementById('pageContent'))">×</button></div>` : ''}
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
              pageProds.map((p) => `
                <tr>
                  ${cols.map(c => {
                    let v = p[c] || '';
                    if (c === 'link' || c === 'handleiding') {
                      if (v && String(v).startsWith('http')) return `<td><a href="${escP(v)}" target="_blank" style="color:var(--sg-green);font-size:12px;">Link</a></td>`;
                      return `<td style="font-size:12px;color:var(--text-muted);">${escP(v)}</td>`;
                    }
                    return `<td title="${escP(v)}">${escP(v)}</td>`;
                  }).join('')}
                  <td>
                    <button class="btn-icon" title="Bewerken" onclick="openProductModal(${store.products.indexOf(p)})">
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
      pageProds.map((p) => `
        <tr>
          ${cols.map(c => {
            let v = p[c] || '';
            if (c === 'link' || c === 'handleiding') {
              if (v && String(v).startsWith('http')) return `<td><a href="${escP(v)}" target="_blank" style="color:var(--sg-green);font-size:12px;">Link</a></td>`;
              return `<td style="font-size:12px;color:var(--text-muted);">${escP(v)}</td>`;
            }
            return `<td title="${escP(v)}">${escP(v)}</td>`;
          }).join('')}
          <td>
            <button class="btn-icon" title="Bewerken" onclick="openProductModal(${store.products.indexOf(p)})">
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

  const filterBar = document.getElementById('prodFilterBar');
  if (filterBar) {
    filterBar.innerHTML = (productFilter.merk || productFilter.materiaal) ? `
      <span style="font-size:12px;color:var(--text-muted);">Filters:</span>
      ${productFilter.merk ? `<div class="filter-chip">${escP(productFilter.merk)} <button onclick="productFilter.merk='';productPage=0;renderProducten(document.getElementById('pageContent'))">×</button></div>` : ''}
      ${productFilter.materiaal ? `<div class="filter-chip">${escP(productFilter.materiaal)} <button onclick="productFilter.materiaal='';productPage=0;renderProducten(document.getElementById('pageContent'))">×</button></div>` : ''}
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
        <input class="form-input" id="prodOmschr" value="${escP(p?.omschrijving || '')}" placeholder="Productnaam">
      </div>
      <div class="form-group">
        <label class="form-label">Merk</label>
        <input class="form-input" id="prodMerk" list="merkList" value="${escP(p?.merk || '')}" placeholder="Merk">
        <datalist id="merkList">${allMerken.map(m=>`<option value="${escP(m)}">`).join('')}</datalist>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Materiaal</label>
        <input class="form-input" id="prodMat" list="matList" value="${escP(p?.materiaal || '')}" placeholder="Materiaaltype">
        <datalist id="matList">${allMateriaal.map(m=>`<option value="${escP(m)}">`).join('')}</datalist>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Max Leeftijd USE</label>
        <input class="form-input" id="prod
