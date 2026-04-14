(function () {
  'use strict';

  // ── Inline SVG Assets (embedded to avoid folder upload) ──
  const SVG_ASSETS = {
    placeholder: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="#f0f2f8"/><rect x="30" y="35" width="60" height="45" rx="4" stroke="#b0b8c8" stroke-width="2.5" fill="none"/><circle cx="45" cy="50" r="5" stroke="#b0b8c8" stroke-width="2" fill="none"/><polyline points="30,72 50,58 65,68 75,60 90,72" stroke="#b0b8c8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="60" y="100" text-anchor="middle" fill="#b0b8c8" font-family="sans-serif" font-size="11">尚無圖片</text></svg>`,
    camera: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="#e6f7f9"/><path d="M35 50h-5a3 3 0 00-3 3v22a3 3 0 003 3h60a3 3 0 003-3V53a3 3 0 00-3-3h-5l-5-8H50l-5 8z" stroke="#0891b2" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="60" cy="62" r="12" stroke="#0891b2" stroke-width="2.5" fill="none"/><circle cx="60" cy="62" r="5" stroke="#0891b2" stroke-width="1.5" fill="none"/><text x="60" y="100" text-anchor="middle" fill="#0891b2" font-family="sans-serif" font-size="11">相機</text></svg>`,
    adapter: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="#eef0ff"/><rect x="30" y="45" width="25" height="30" rx="4" stroke="#6366f1" stroke-width="2.5" fill="none"/><rect x="65" y="45" width="25" height="30" rx="4" stroke="#6366f1" stroke-width="2.5" fill="none"/><line x1="55" y1="55" x2="65" y2="55" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><line x1="55" y1="60" x2="65" y2="60" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><line x1="55" y1="65" x2="65" y2="65" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><text x="60" y="100" text-anchor="middle" fill="#6366f1" font-family="sans-serif" font-size="11">轉接頭</text></svg>`,
    lighting: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="#fef9ee"/><circle cx="60" cy="52" r="18" stroke="#f59e0b" stroke-width="2.5" fill="none"/><line x1="60" y1="70" x2="60" y2="80" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/><line x1="52" y1="78" x2="68" y2="78" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/><line x1="60" y1="30" x2="60" y2="26" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/><line x1="78" y1="52" x2="82" y2="52" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/><line x1="42" y1="52" x2="38" y2="52" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/><text x="60" y="100" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="11">燈光</text></svg>`,
    audio: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="#ecfdf5"/><rect x="53" y="30" width="14" height="32" rx="7" stroke="#10b981" stroke-width="2.5" fill="none"/><path d="M42 55v3a18 18 0 0036 0v-3" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round"/><line x1="60" y1="76" x2="60" y2="84" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/><line x1="50" y1="84" x2="70" y2="84" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/><text x="60" y="100" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="11">收音</text></svg>`,
    accessory: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="#f5f3ff"/><rect x="35" y="40" width="50" height="35" rx="5" stroke="#8b5cf6" stroke-width="2.5" fill="none"/><rect x="45" y="50" width="12" height="8" rx="1" stroke="#8b5cf6" stroke-width="1.5" fill="none"/><rect x="63" y="50" width="12" height="8" rx="1" stroke="#8b5cf6" stroke-width="1.5" fill="none"/><rect x="45" y="62" width="12" height="8" rx="1" stroke="#8b5cf6" stroke-width="1.5" fill="none"/><rect x="63" y="62" width="12" height="8" rx="1" stroke="#8b5cf6" stroke-width="1.5" fill="none"/><text x="60" y="100" text-anchor="middle" fill="#8b5cf6" font-family="sans-serif" font-size="11">配件</text></svg>`,
    mount: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="#f1f5f9"/><circle cx="60" cy="35" r="6" stroke="#64748b" stroke-width="2.5" fill="none"/><line x1="60" y1="41" x2="60" y2="50" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/><line x1="60" y1="50" x2="38" y2="80" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/><line x1="60" y1="50" x2="82" y2="80" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/><line x1="60" y1="50" x2="60" y2="80" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="80" x2="44" y2="80" stroke="#64748b" stroke-width="2" stroke-linecap="round"/><line x1="76" y1="80" x2="88" y2="80" stroke="#64748b" stroke-width="2" stroke-linecap="round"/><line x1="54" y1="80" x2="66" y2="80" stroke="#64748b" stroke-width="2" stroke-linecap="round"/><text x="60" y="100" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="11">支架</text></svg>`,
  };

  function svgToDataUri(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // ── Configuration ─────────────────────────────────
  const CONFIG = {
    csvUrl: './data.csv',
    imageBasePath: './images/',
    categoryColors: {
      '轉接頭': { color: '#6366f1', label: 'adapter' },
      '相機':   { color: '#0891b2', label: 'camera' },
      '燈光':   { color: '#f59e0b', label: 'lighting' },
      '收音':   { color: '#10b981', label: 'audio' },
      '配件':   { color: '#8b5cf6', label: 'accessory' },
      '支架':   { color: '#64748b', label: 'mount' },
    },
    defaultCategoryColor: '#94a3b8',
    // Display order and card behavior for each field
    fieldConfig: {
      '項目':       { order: 1, cardDisplay: 'title' },
      '編號':       { order: 2, cardDisplay: 'badge' },
      '類別':       { order: 3, cardDisplay: 'meta' },
      '位置':       { order: 4, cardDisplay: 'meta' },
      '狀態':       { order: 5, cardDisplay: 'badge' },
      '借用人':     { order: 6, cardDisplay: 'modal-only' },
      '借出日期':   { order: 7, cardDisplay: 'modal-only' },
      '預計歸還日': { order: 8, cardDisplay: 'modal-only' },
      '備註':       { order: 9, cardDisplay: 'modal-only' },
      '最後更新時間': { order: 10, cardDisplay: 'modal-only' },
    },
    statusColors: {
      '可借用': '#16a34a',
      '可借': '#16a34a',
      '借出中': '#ea580c',
      '已借出': '#ea580c',
      '維修中': '#dc2626',
      '停用': '#9ca3af',
    },
  };

  // ── State ─────────────────────────────────────────
  const state = {
    rows: [],
    sortKey: '編號',
    currentTab: '全部',  // current tab value (category name or location name)
    currentMode: 'category', // 'category' | 'location' | 'all'
    searchQuery: '',
    locationFilter: '',
  };

  // ── DOM Cache ─────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    searchInput: $('#searchInput'),
    locationFilter: $('#locationFilter'),
    sortBy: $('#sortBy'),
    totalCount: $('#totalCount'),
    visibleCount: $('#visibleCount'),
    categoryCount: $('#categoryCount'),
    tabBar: $('#tabBar'),
    contentArea: $('#contentArea'),
    modalOverlay: $('#detailModal'),
    modeCategoryBtn: $('#modeCategoryBtn'),
    modeLocationBtn: $('#modeLocationBtn'),
    modeAllBtn: $('#modeAllBtn'),
  };

  // ── Utilities ─────────────────────────────────────
  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function getCategoryColor(category) {
    return (CONFIG.categoryColors[category] || {}).color || CONFIG.defaultCategoryColor;
  }

  function getCategoryLabel(category) {
    return (CONFIG.categoryColors[category] || {}).label || 'default';
  }

  function sanitizeId(id) {
    return String(id).trim().replace(/\s+/g, '-');
  }

  // ── Data Service ──────────────────────────────────
  const DataService = {
    load(callback) {
      dom.contentArea.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          <span>載入資料中...</span>
        </div>`;

      Papa.parse(CONFIG.csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          state.rows = results.data
            .map(this.normalizeRow)
            .filter(r => r['編號'] || r['項目'] || r['位置'] || r['類別']);
          callback();
        },
        error: () => {
          dom.contentArea.innerHTML = `<div class="empty">CSV 載入失敗，請稍後再試。</div>`;
        },
      });
    },

    normalizeRow(row) {
      const normalized = {};
      for (const key of Object.keys(row)) {
        const trimmedKey = key.trim();
        if (trimmedKey) {
          normalized[trimmedKey] = String(row[key] || '').trim();
        }
      }
      return normalized;
    },

    getCategories() {
      return [...new Set(state.rows.map(r => r['類別']).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'zh-Hant'));
    },

    getLocations() {
      return [...new Set(state.rows.map(r => r['位置']).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'zh-Hant'));
    },
  };

  // ── Filter Engine ─────────────────────────────────
  const FilterEngine = {
    getBaseFiltered() {
      const q = state.searchQuery.toLowerCase();
      const loc = state.locationFilter;

      return state.rows.filter(r => {
        const text = Object.values(r).join(' ').toLowerCase();
        const matchQ = !q || text.includes(q);
        const matchLoc = !loc || r['位置'] === loc;
        return matchQ && matchLoc;
      });
    },

    getCurrent() {
      let filtered = this.getBaseFiltered();

      if (state.currentMode === 'category' && state.currentTab !== '全部') {
        filtered = filtered.filter(r => r['類別'] === state.currentTab);
      } else if (state.currentMode === 'location' && state.currentTab !== '全部') {
        filtered = filtered.filter(r => r['位置'] === state.currentTab);
      }

      filtered.sort((a, b) => {
        const av = a[state.sortKey] || '';
        const bv = b[state.sortKey] || '';
        return av.localeCompare(bv, 'zh-Hant', { numeric: true });
      });

      return filtered;
    },

    countByField(list, field) {
      const map = {};
      for (const row of list) {
        const key = row[field] || '未分類';
        map[key] = (map[key] || 0) + 1;
      }
      return map;
    },

    groupByField(list, field) {
      const map = {};
      for (const row of list) {
        const key = row[field] || (field === '類別' ? '未分類' : '未知位置');
        if (!map[key]) map[key] = [];
        map[key].push(row);
      }
      return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], 'zh-Hant'));
    },
  };

  // ── Product Image Map (keyword → image URL) ──────
  // Each entry: [keyword_to_match_in_項目, image_url]
  // When an item name contains the keyword, it uses that image
  const PRODUCT_IMAGES = [
    ['a6400', 'https://www-cdn.djiits.com/reactor/assets/_next/static/media/sony-a6400.png'],
    ['SONY a6400', 'https://www-cdn.djiits.com/reactor/assets/_next/static/media/sony-a6400.png'],
    ['Osmo Pocket 3', 'https://www-cdn.djiits.com/cms/uploads/551e7d13228ed00e3486566918a183fd@374*374.png'],
    ['DJI Action4', 'https://www-cdn.djiits.com/cms/uploads/fd525dd9cd6a4dec4c3ae81ebf35d8af@374*374.png'],
    ['DJI Action 4', 'https://www-cdn.djiits.com/cms/uploads/fd525dd9cd6a4dec4c3ae81ebf35d8af@374*374.png'],
    ['Wireless GO II', 'https://edge.rode.com//images/products/variants/66/rode-wigo2_hero_image_final_2-rgb_1080x1080.png'],
    ['Wireless GO', 'https://edge.rode.com//images/products/variants/66/rode-wigo2_hero_image_final_2-rgb_1080x1080.png'],
    ['Wireless PRO', 'https://edge.rode.com/images/page/2207/modules/8803/rode-wireless-pro-hero-three-quarter-4000x4000-rgb-1080x1080-f521e30.png'],
    ['VideoMicro', 'https://edge.rode.com//images/page/122/modules/4116/RØDE_VideoMicro_3-QUARTER_1080x1080.png'],
    ['INSTA 360', 'https://www-cdn.djiits.com/cms/uploads/551e7d13228ed00e3486566918a183fd@374*374.png'],
    ['Mavic Air', 'https://www-cdn.djiits.com/cms/uploads/fd525dd9cd6a4dec4c3ae81ebf35d8af@374*374.png'],
    ['Mini 3 Pro', 'https://www-cdn.djiits.com/cms/uploads/551e7d13228ed00e3486566918a183fd@374*374.png'],
    ['Godox', 'https://edge.rode.com//images/page/122/modules/4116/RØDE_VideoMicro_3-QUARTER_1080x1080.png'],
    ['SHURE', 'https://edge.rode.com/images/page/2207/modules/8803/rode-wireless-pro-hero-three-quarter-4000x4000-rgb-1080x1080-f521e30.png'],
  ];

  // ── Image Resolver ────────────────────────────────
  const ImageResolver = {
    // Find a product-specific image URL by matching item name keywords
    getProductImageUrl(item) {
      const name = (item['項目'] || '').toLowerCase();
      for (const [keyword, url] of PRODUCT_IMAGES) {
        if (name.toLowerCase().includes(keyword.toLowerCase())) {
          return url;
        }
      }
      return null;
    },

    // For card thumbnail: product image or null
    getThumbUrl(item) {
      return this.getProductImageUrl(item);
    },

    // For modal: try local image first, then product URL, then category SVG
    getImageUrl(item) {
      const id = sanitizeId(item['編號']);
      return `${CONFIG.imageBasePath}${id}.jpg`;
    },

    getModalImageUrl(item) {
      // Try product URL first (more reliable than local file)
      const productUrl = this.getProductImageUrl(item);
      if (productUrl) return productUrl;
      // Fall back to local image by ID
      return this.getImageUrl(item);
    },

    getCategorySvgUri(item) {
      const label = getCategoryLabel(item['類別']);
      const svg = SVG_ASSETS[label] || SVG_ASSETS.placeholder;
      return svgToDataUri(svg);
    },

    getPlaceholderUri() {
      return svgToDataUri(SVG_ASSETS.placeholder);
    },

    handleImageError(img, item) {
      if (img.dataset.fallback === 'category') {
        img.src = this.getPlaceholderUri();
        img.dataset.fallback = 'placeholder';
      } else if (!img.dataset.fallback) {
        img.src = this.getCategorySvgUri(item);
        img.dataset.fallback = 'category';
      }
    },
  };

  // ── SVG Icons ─────────────────────────────────────
  const Icons = {
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    tag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  };

  // ── Renderer ──────────────────────────────────────
  const Renderer = {
    renderLocationFilter() {
      const current = dom.locationFilter.value;
      dom.locationFilter.innerHTML = '<option value="">全部位置</option>';
      for (const loc of DataService.getLocations()) {
        const option = document.createElement('option');
        option.value = loc;
        option.textContent = loc;
        dom.locationFilter.appendChild(option);
      }
      dom.locationFilter.value = current;
    },

    renderStats() {
      dom.totalCount.textContent = state.rows.length;
      dom.categoryCount.textContent = DataService.getCategories().length;
    },

    renderTabs() {
      const baseFiltered = FilterEngine.getBaseFiltered();
      let tabs, field;

      if (state.currentMode === 'category') {
        field = '類別';
        const counts = FilterEngine.countByField(baseFiltered, field);
        const categories = DataService.getCategories().filter(c => counts[c] > 0 || state.currentTab === c);
        tabs = [{ name: '全部', count: baseFiltered.length }];
        for (const cat of categories) {
          tabs.push({ name: cat, count: counts[cat] || 0 });
        }
      } else if (state.currentMode === 'location') {
        field = '位置';
        const counts = FilterEngine.countByField(baseFiltered, field);
        const locations = DataService.getLocations().filter(l => counts[l] > 0 || state.currentTab === l);
        tabs = [{ name: '全部', count: baseFiltered.length }];
        for (const loc of locations) {
          tabs.push({ name: loc, count: counts[loc] || 0 });
        }
      } else {
        dom.tabBar.innerHTML = '';
        return;
      }

      dom.tabBar.innerHTML = tabs.map(t => {
        const isActive = t.name === state.currentTab;
        let style = '';
        if (isActive && state.currentMode === 'category' && t.name !== '全部') {
          const color = getCategoryColor(t.name);
          style = `style="background:${color};border-color:${color};color:#fff"`;
        }
        return `<button type="button" class="tab${isActive ? ' active' : ''}" data-tab="${escapeHtml(t.name)}" ${style}>${escapeHtml(t.name)} <small>${t.count}</small></button>`;
      }).join('');

      dom.tabBar.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
          state.currentTab = btn.dataset.tab;
          render();
        });
      });
    },

    renderCards(list) {
      if (!list.length) {
        return `<div class="empty">查無結果，換個關鍵字或位置試試。</div>`;
      }

      return `<div class="card-grid">${list.map((row, i) => {
        const category = row['類別'] || '未分類';
        const catColor = getCategoryColor(category);
        const thumbSrc = ImageResolver.getThumbUrl(row);
        const catLabel = getCategoryLabel(category);
        const catSvg = SVG_ASSETS[catLabel] || SVG_ASSETS.placeholder;

        // Build extra fields for card display
        let extraHtml = '';
        const status = row['狀態'];
        if (status) {
          const sColor = CONFIG.statusColors[status] || CONFIG.defaultCategoryColor;
          extraHtml += `<div class="meta-row"><span class="status-dot" style="background:${sColor}"></span>${escapeHtml(status)}</div>`;
        }

        // Determine thumbnail: product image or category SVG
        let thumbHtml;
        if (thumbSrc) {
          thumbHtml = `<div class="card-thumb"><img src="${escapeHtml(thumbSrc)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=thumb-svg>${catSvg}</div>'"/></div>`;
        } else {
          thumbHtml = `<div class="card-thumb"><div class="thumb-svg">${catSvg}</div></div>`;
        }

        return `
        <article class="item-card" data-category="${escapeHtml(category)}" data-index="${i}" role="button" tabindex="0" aria-label="查看 ${escapeHtml(row['項目'] || '')} 詳情">
          ${thumbHtml}
          <div class="card-body">
            <div class="click-hint">${Icons.chevronRight}</div>
            <div class="item-top">
              <h3 class="item-name">${escapeHtml(row['項目'] || '未命名項目')}</h3>
              <span class="item-id">${escapeHtml(row['編號'] || '—')}</span>
            </div>
            <div class="meta-row">
              <span class="meta-icon">${Icons.tag}</span>
              <span class="meta-label">類別</span>
              <span class="category-badge" style="background:${catColor}15;color:${catColor}">${escapeHtml(category)}</span>
            </div>
            <div class="meta-row">
              <span class="meta-icon">${Icons.mapPin}</span>
              <span class="meta-label">位置</span>
              ${escapeHtml(row['位置'] || '未填位置')}
            </div>
            ${extraHtml}
          </div>
        </article>`;
      }).join('')}</div>`;
    },

    renderContent() {
      const currentRows = FilterEngine.getCurrent();
      dom.visibleCount.textContent = currentRows.length;

      if (state.currentMode === 'all') {
        dom.contentArea.innerHTML = `
          <section class="section">
            <div class="section-head">
              <h2 class="section-title">全部列表</h2>
              <div class="section-meta">共 ${currentRows.length} 筆</div>
            </div>
            ${this.renderCards(currentRows)}
          </section>`;
        this.bindCardClicks();
        return;
      }

      // single tab selected (not "全部")
      if (state.currentTab !== '全部') {
        dom.contentArea.innerHTML = `
          <section class="section">
            <div class="section-head">
              <h2 class="section-title">
                <span class="section-dot" style="background:${state.currentMode === 'category' ? getCategoryColor(state.currentTab) : 'var(--color-accent)'}"></span>
                ${escapeHtml(state.currentTab)}
              </h2>
              <div class="section-meta">共 ${currentRows.length} 筆</div>
            </div>
            ${this.renderCards(currentRows)}
          </section>`;
        this.bindCardClicks();
        return;
      }

      // grouped view
      const field = state.currentMode === 'category' ? '類別' : '位置';
      const grouped = FilterEngine.groupByField(currentRows, field);

      if (!grouped.length) {
        dom.contentArea.innerHTML = `<div class="empty">查無結果，換個關鍵字或位置試試。</div>`;
        return;
      }

      dom.contentArea.innerHTML = grouped.map(([key, list]) => {
        const dotColor = state.currentMode === 'category' ? getCategoryColor(key) : 'var(--color-accent)';
        return `
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">
              <span class="section-dot" style="background:${dotColor}"></span>
              ${escapeHtml(key)}
            </h2>
            <div class="section-meta">共 ${list.length} 筆</div>
          </div>
          ${this.renderCards(list)}
        </section>`;
      }).join('');

      this.bindCardClicks();
    },

    bindCardClicks() {
      dom.contentArea.querySelectorAll('.item-card').forEach(card => {
        const handler = () => {
          const allCurrent = FilterEngine.getCurrent();
          // Find the item from visible list
          const idx = parseInt(card.dataset.index, 10);
          // We need to find the actual row. Since renderCards receives a list,
          // the data-index corresponds to position in that list.
          // We'll store the item ID for lookup instead.
          const itemName = card.querySelector('.item-name')?.textContent;
          const itemId = card.querySelector('.item-id')?.textContent;
          const item = state.rows.find(r =>
            (r['項目'] || '未命名項目') === itemName &&
            (r['編號'] || '—') === itemId
          );
          if (item) Modal.open(item);
        };
        card.addEventListener('click', handler);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handler();
          }
        });
      });
    },
  };

  // ── Modal Controller ──────────────────────────────
  const Modal = {
    currentItem: null,

    open(item) {
      this.currentItem = item;
      const overlay = dom.modalOverlay;
      const content = overlay.querySelector('.modal-body');

      content.innerHTML = this.render(item);
      overlay.classList.add('is-open');
      overlay.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';

      // Image fallback chain
      const img = content.querySelector('.modal-img');
      if (img) {
        img.addEventListener('error', function handler() {
          ImageResolver.handleImageError(img, item);
        });
      }

      // Focus trap
      const closeBtn = overlay.querySelector('.modal-close');
      if (closeBtn) closeBtn.focus();
    },

    close() {
      this.currentItem = null;
      const overlay = dom.modalOverlay;
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!overlay.classList.contains('is-open')) {
          overlay.setAttribute('hidden', '');
        }
      }, 250);
    },

    render(item) {
      const category = item['類別'] || '未分類';
      const catColor = getCategoryColor(category);
      const imgSrc = ImageResolver.getModalImageUrl(item);

      // Build field rows for modal
      const coreFields = ['類別', '位置'];
      const extraFields = Object.keys(item).filter(k =>
        !['類別', '位置', '項目', '編號'].includes(k) && item[k]
      );

      // Sort extra fields by fieldConfig order
      extraFields.sort((a, b) => {
        const oa = (CONFIG.fieldConfig[a] || {}).order || 99;
        const ob = (CONFIG.fieldConfig[b] || {}).order || 99;
        return oa - ob;
      });

      let fieldsHtml = '';

      // Category field
      fieldsHtml += `
        <div class="modal-field">
          <span class="modal-field-label">類別</span>
          <span class="modal-field-value">
            <span class="category-badge" style="background:${catColor}15;color:${catColor}">
              <span class="section-dot" style="background:${catColor}"></span>
              ${escapeHtml(category)}
            </span>
          </span>
        </div>`;

      // Location field
      fieldsHtml += `
        <div class="modal-field">
          <span class="modal-field-label">位置</span>
          <span class="modal-field-value">${escapeHtml(item['位置'] || '未填位置')}</span>
        </div>`;

      // Extra fields (status, borrower, etc.)
      for (const key of extraFields) {
        let valueHtml = escapeHtml(item[key]);

        // Special rendering for status
        if (key === '狀態') {
          const sColor = CONFIG.statusColors[item[key]] || CONFIG.defaultCategoryColor;
          valueHtml = `<span class="status-dot" style="background:${sColor}"></span>${escapeHtml(item[key])}`;
        }

        fieldsHtml += `
          <div class="modal-field">
            <span class="modal-field-label">${escapeHtml(key)}</span>
            <span class="modal-field-value">${valueHtml}</span>
          </div>`;
      }

      return `
        <div class="modal-image">
          <img class="modal-img" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item['項目'] || '')}" />
        </div>
        <div class="modal-info">
          <h2 class="modal-item-name">${escapeHtml(item['項目'] || '未命名項目')}</h2>
          <div class="modal-item-id">${escapeHtml(item['編號'] || '—')}</div>
          <div class="modal-fields">
            ${fieldsHtml}
          </div>
        </div>`;
    },
  };

  // ── Render Orchestrator ───────────────────────────
  function render() {
    Renderer.renderTabs();
    Renderer.renderContent();
    updateModeButtons();
  }

  function updateModeButtons() {
    dom.modeCategoryBtn.classList.toggle('active', state.currentMode === 'category');
    dom.modeLocationBtn.classList.toggle('active', state.currentMode === 'location');
    dom.modeAllBtn.classList.toggle('active', state.currentMode === 'all');
  }

  function setMode(mode) {
    state.currentMode = mode;
    state.currentTab = '全部';
    render();
  }

  // ── Event Binding ─────────────────────────────────
  function bindEvents() {
    // Search with debounce
    dom.searchInput.addEventListener('input', debounce(() => {
      state.searchQuery = dom.searchInput.value.trim();
      state.currentTab = '全部';
      render();
    }, 200));

    // Location filter
    dom.locationFilter.addEventListener('change', () => {
      state.locationFilter = dom.locationFilter.value;
      state.currentTab = '全部';
      render();
    });

    // Sort
    dom.sortBy.addEventListener('change', (e) => {
      state.sortKey = e.target.value;
      render();
    });

    // Mode buttons
    dom.modeCategoryBtn.addEventListener('click', () => setMode('category'));
    dom.modeLocationBtn.addEventListener('click', () => setMode('location'));
    dom.modeAllBtn.addEventListener('click', () => setMode('all'));

    // Modal close
    dom.modalOverlay.addEventListener('click', (e) => {
      if (e.target === dom.modalOverlay || e.target.closest('.modal-close')) {
        Modal.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.modalOverlay.classList.contains('is-open')) {
        Modal.close();
      }
    });
  }

  // ── Init ──────────────────────────────────────────
  function init() {
    bindEvents();
    DataService.load(() => {
      Renderer.renderLocationFilter();
      Renderer.renderStats();
      render();
    });
  }

  init();
})();
