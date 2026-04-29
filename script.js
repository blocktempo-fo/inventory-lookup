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
    keyboard: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="12" fill="#fff1f2"/><rect x="25" y="35" width="70" height="35" rx="5" stroke="#e11d48" stroke-width="2.5" fill="none"/><rect x="32" y="42" width="8" height="6" rx="1" stroke="#e11d48" stroke-width="1.2" fill="none"/><rect x="44" y="42" width="8" height="6" rx="1" stroke="#e11d48" stroke-width="1.2" fill="none"/><rect x="56" y="42" width="8" height="6" rx="1" stroke="#e11d48" stroke-width="1.2" fill="none"/><rect x="68" y="42" width="8" height="6" rx="1" stroke="#e11d48" stroke-width="1.2" fill="none"/><rect x="80" y="42" width="8" height="6" rx="1" stroke="#e11d48" stroke-width="1.2" fill="none"/><rect x="36" y="54" width="24" height="6" rx="1" stroke="#e11d48" stroke-width="1.2" fill="none"/><rect x="64" y="54" width="8" height="6" rx="1" stroke="#e11d48" stroke-width="1.2" fill="none"/><ellipse cx="60" cy="82" rx="12" ry="8" stroke="#e11d48" stroke-width="2" fill="none"/><line x1="60" y1="74" x2="60" y2="70" stroke="#e11d48" stroke-width="2" stroke-linecap="round"/><text x="60" y="105" text-anchor="middle" fill="#e11d48" font-family="sans-serif" font-size="11">鍵盤滑鼠</text></svg>`,
  };

  function svgToDataUri(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // ── Configuration ─────────────────────────────────
  const CONFIG = {
    csvUrl: './data.csv',
    imageBasePath: './images/',
    categoryColors: {
      '轉接頭':   { color: '#5b6573', label: 'adapter' },
      '相機':     { color: '#1b4332', label: 'camera' },
      '燈光':     { color: '#d97706', label: 'lighting' },
      '收音':     { color: '#2d6a4f', label: 'audio' },
      '配件':     { color: '#6b7c4f', label: 'accessory' },
      '支架':     { color: '#5b6573', label: 'mount' },
      '鍵盤滑鼠': { color: '#6b7c4f', label: 'keyboard' },
      '耳機':     { color: '#1b4332', label: 'headset' },
    },
    defaultCategoryColor: '#9aa3b2',
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
      '可借用': '#2d6a4f',
      '可借':   '#2d6a4f',
      '借出中': '#d97706',
      '已借出': '#d97706',
      '維修中': '#b91c1c',
      '停用':   '#adb5bd',
    },
  };

  // ── State ─────────────────────────────────────────
  const state = {
    rows: [],
    sortKey: '項目',
    currentTab: '全部',  // current tab value (category name or location name)
    currentMode: 'location', // 'category' | 'location' | 'all'
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
    locationMap: $('#locationMap'),
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
  // Product image mapping: [keyword_in_item_name, image_url]
  // Verified URLs from manufacturer CDNs. Add more as needed.
  // IMPORTANT: order matters! More specific keywords must come FIRST so they win
  // the first-match. Example: "Osmo Pocket 3 廣角鏡" must be before "Osmo Pocket 3".
  const PRODUCT_IMAGES = [
    // ─── DJI Osmo Pocket 3 accessories (specific first) ───
    ['Osmo Pocket 3 廣角鏡', 'https://se-cdn.djiits.com/tpc/uploads/photo/image/829e4a8fe7ecbbe7e1eb05bd88b67e60@large.jpg'],
    ['Osmo Pocket 3 續航手把', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/8e51cc2a15bcd08a87f04c7ffd47e850@origin.png'],
    ['螺紋手把', 'https://se-cdn.djiits.com/tpc/uploads/photo/image/7d58e2bd4e31f2139beef5051558c97d@large.jpg'],
    ['Osmo Pocket 3 主機', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/35d158a1f3d1a3a48ec4cf2220cfc426@large.png'],
    ['Osmo 迷你三腳架', 'https://se-cdn.djiits.com/tpc/uploads/photo/image/b676ea0f85edee205678f0a2765f4b33@large.jpg'],
    // Generic Osmo Pocket 3 fallback (collectors/cases use main-unit image)
    ['Osmo Pocket 3', 'https://www-cdn.djiits.com/cms/uploads/551e7d13228ed00e3486566918a183fd@374*374.png'],

    // ─── DJI Mic 3 (specific first) ───
    ['DJI Mic 3 發射器', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/5ac37a6cf8ca7e9e01c18dd9fc096fe8@large.png'],
    ['DJI Mic 3 接收器', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/bdf16877d05d8bd4cb0dc3288b674b12@large.png'],
    ['DJI Mic 3 充電盒', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/11209b23d816b8d5aa8c37c8d0752a18@large.png'],
    ['DJI Mic 3 收納袋', 'https://se-cdn.djiits.com/tpc/uploads/in_the_box/cover/e036a839aa86c86e24e7beac607a5485@retina_small.png'],
    ['DJI Mic 3', 'https://www-cdn.djiits.com/cms/uploads/95795cf7512b37f2f9eb7bdec42a4404@374*374.png'],

    // ─── DJI Mic 2 (specific first) ───
    ['DJI Mic 2 發射器', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/5ac1ed73f9d118c711ae83631331f53a@large.png'],
    ['DJI Mic 2 背夾式磁鐵', 'https://se-cdn.djiits.com/tpc/uploads/photo/image/0e5738367c9a80ba228872af59ea91ff@large.jpg'],
    ['DJI Mic 2', 'https://www-cdn.djiits.com/cms/uploads/6e61a4668dd5cca507484a47a1260521@374*374.png'],

    // ─── DJI Action 4 (specific first) ───
    ['DJI Action4 運動相機 電池', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/40f2f11507cda738f25535a0d0565222@large.png'],
    ['DJI Action4 運動相機 支架', 'https://se-cdn.djiits.com/tpc/uploads/in_the_box/cover/31c299b571c906d9c5c604dc48ff0cae@retina_small.png'],
    ['DJI Action4 運動相機 電池充電盒', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/11dbf9c5a5bac586e0e9ba7836ce99bf@large.png'],
    ['DJI Action4', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/e1b8110f65a5a3321fe487f0a1a061ac@large.png'],
    ['DJI Action 4', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/e1b8110f65a5a3321fe487f0a1a061ac@large.png'],

    // ─── DJI Mavic Air (specific-suffix first so 遙控器/電池 win) ───
    ['mavic air 空拍機 遙控器', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/1dda79da942cd54b4bc122d57becc968@large.png'],
    ['mavic air 空拍機 電池', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/fe77fece-594e-4e27-b61d-b6228a3c1815@large.png'],
    ['mavic air', 'https://se-cdn.djiits.com/tpc/uploads/sku/cover/beceb8fe-c7d6-41c9-9d36-e6b608c7f059@ultra.png'],

    // ─── DJI other ───
    ['三軸穩定器', 'https://www-cdn.djiits.com/dps/708e9fdda54844663d1de760ca85e0f4.jpg'],
    ['3.5mm TRS', 'https://se-cdn.djiits.com/tpc/uploads/spu/cover/656d0756b2491fe38baf59f20f72d243@large.png'],

    // ─── Sony (specific models) ───
    // SONY a6400 battery "電池-1/2/3" - use NP-FW50 battery image
    ['a6400 微單相機 電池', 'https://www.adorama.com/images/product/isonpfw50.jpg'],
    ['模擬電池', 'https://www.adorama.com/images/product/isonpfw50.jpg'],
    ['FW50原廠電池充電器', 'https://www.adorama.com/images/product/isobctrw.jpg'],
    ['SONY原廠相機充電器', 'https://www.adorama.com/images/product/isobctrw.jpg'],
    ['SONY 18/105', 'https://www.adorama.com/images/product/iso18105e.jpg'],
    ['a6400', 'https://www.adorama.com/images/product/isoa6400.jpg'],

    // ─── INSTA 360 ───
    ['INSTA 360', 'https://www.evogimbals.com/cdn/shop/products/insta360-one-rs-twin-edition-insta360-none-763555.jpg?v=1649452266'],

    // ─── 相機包 — 待實物拍攝後補上 ───
    // 暫時不設圖，讓它 fallback 到類別 SVG

    // ─── TAKEWAY ───
    ['TAKEWAY', 'https://www.adorama.com/images/product/tat1.jpg'],

    // ─── Rode (specific first) ───
    ['VideoMic Me-L', 'https://edge.rode.com//images/page/387/modules/1406/R%C3%98DE_VideoMic_Me-L_3_QUARTER_LEFT_FRONT_TOP_VIEW_1080x1080.png'],
    ['VideoMicro', 'https://edge.rode.com//images/page/122/modules/4116/R%C3%98DE_VideoMicro_3-QUARTER_1080x1080.png'],
    ['Rode wireless go 二代', 'https://edge.rode.com//images/products/variants/66/rode-wigo2_hero_image_final_2-rgb_1080x1080.png'],
    ['Rode wireless go 一代', 'https://edge.rode.com/images/products/variants/65/RODE_Wireless_GO_FRONT_1080x1080.png'],
    ['Wireless GO', 'https://edge.rode.com//images/products/variants/66/rode-wigo2_hero_image_final_2-rgb_1080x1080.png'],
    ['Wireless PRO', 'https://edge.rode.com/images/page/2207/modules/8803/rode-wireless-pro-hero-three-quarter-4000x4000-rgb-1080x1080-f521e30.png'],
    ['Rode 指向性麥克風', 'https://edge.rode.com/images/page/127/modules/4128/R%C3%98DE_VM-NTG_3-QUARTER_FRONT_1080x1080.png'],
    ['RODE對接彈簧線', 'https://edge.rode.com/images/page/374/modules/1339/R%C3%98DE_SC7_FRONT_1080x1080.png'],

    // ─── Audio ───
    ['MV7', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/6db/7d8/5a-/original/e4919ed262813ba35314ce94a1bb7414.png'],
    ['夾式麥克風', 'https://edge.rode.com/images/products/variants/60/R%C3%98DE_LAV_GO_KIT_BLACK_1080x1080.png'],
    ['AG06', 'https://europe.yamaha.com/files/thumbnail_ag06_tcm113-2300637.jpg'],
    ['ZOOM H7', 'https://zoomcorp.com/media/original_images/H6AB_wShadow2.png.768x0_q60.png'],

    // ─── Adapters / hubs ───
    ['UGREEN', 'https://eu.ugreen.com/cdn/shop/files/ugreen-revodok-105-usb-c-hub-5-in-1-multiport-adapter-4k-hdmi-386804_grande.png?v=1731643871'],
    ['HDMI to USBC 轉接', 'https://www.wcs-worldwide.com/cdn/shop/products/UgreenHDMI2USBC_5.jpg?v=1614943141'],

    // ─── Lighting (Google 搜尋正確產品圖) ───
    ['環形手機支架補光燈', 'https://neewer.com/cdn/shop/files/10103010_1945409a-b2d0-41c4-bc39-47e57d5e95e4.jpg?v=1732017639'],
    ['攝力派 大型環形補光燈', 'https://neewer.com/cdn/shop/files/10103010_1945409a-b2d0-41c4-bc39-47e57d5e95e4.jpg?v=1732017639'],
    ['神牛方形小補光燈', 'https://nelsonphotoandvideo.com/cdn/shop/files/godox-rgb-mini-creative-m1-on-camera-video-led-light-743324.png?v=1711596352'],
    ['VLJIM 方形小補光燈', 'https://mojocameras.com/cdn/shop/files/1599736829_1585031.jpg?v=1716416989'],
    ['VLJIM LED小平板補光燈', 'https://www.ulanzi.com/cdn/shop/products/22.jpg?v=1689124680'],
    ['神牛Godox SL60W', 'https://www.godox.com/static/upload/image/20220617/1655454795145867.jpg'],

    // ─── Mounts / Tripods / Stands (正確品牌型號) ───
    ['LINO手機通用金屬兔籠', 'https://www.ulanzi.com/cdn/shop/products/1_e5247a6d-424c-4d7f-a7e3-adff7576ce86.jpg?v=1638586155'],
    ['兔籠', 'https://www.ulanzi.com/cdn/shop/products/1_e5247a6d-424c-4d7f-a7e3-adff7576ce86.jpg?v=1638586155'],
    ['Cayer卡宴油壓三腳架', 'https://cayerfoto.com/cdn/shop/files/AF2451H6.jpg'],
    ['JIE yang 捷洋三腳架', 'https://ambitful.shop/cdn/shop/products/HTB1NQg.JpXXXXbBXpXXq6xXFXXX3.jpg?v=1670296584'],
    ['Raymii桌上型手機支架', 'https://shoplineimg.com/5a4d78b3080f06964f003689/60e2cfebd019860026fb1076/2000x.png'],
    ['Raymii Lsa-40-b 手機平板支架', 'https://shoplineimg.com/5a4d78b3080f06964f003689/611b9495bf5d87003bf967d7/2000x.png'],
    ['基本款燈架', 'https://neewer.com/cdn/shop/files/10100219_grande.jpg?v=1735638000'],
    ['露營燈架', 'https://www.neshtary.com/cdn/shop/files/H30d6a3ba7d2e4ce7bb34e9705734ef5fK.png_960x960_a4f80e9d-dd9a-4890-8b7d-9e60d8b5b84b.webp?v=1747514260'],
    ['桌上型小三腳架', 'https://avshutter.com/cdn/shop/files/SmallRig-Mini-Tripod-for-Camera-Updated-Desktop-Tabletop-Tripod-with-Arca-Type-Compatible-QR-Plate-360_c179a1af-742e-4e7c-8c51-73508b20fe21.jpg?v=1712671464'],
    ['三腳架的輪座', 'https://neewer.com/cdn/shop/files/10104255_grande.jpg?v=1735293059'],
    ['基本款腳架', 'https://neewer.com/cdn/shop/products/10089015.jpg'],
    ['看板展示架', 'https://neewer.com/cdn/shop/files/10100219_grande.jpg?v=1735638000'],

    // ─── Memory Cards (正確品牌圖) ───
    ['SanDisk 1TB', 'https://www.glazerscamera.com/cdn/shop/files/1031_01_Hero.png?v=1701369168'],
    ['SanDisk 512G SDXC', 'https://www.sandisk.com/content/dam/store/en-us/assets/products/memory-cards/extreme-pro-uhs-i-sd/gallery/200mbs/extreme-pro-uhs-i-sd-100mbs-32gb-front.png'],
    ['SanDisk 128G SDXC', 'https://www.sandisk.com/content/dam/store/en-us/assets/products/memory-cards/extreme-pro-uhs-i-sd/gallery/200mbs/extreme-pro-uhs-i-sd-100mbs-32gb-front.png'],
    ['SanDisk 256G microSD', 'https://www.sandisk.com/content/dam/store/en-us/assets/products/memory-cards/extreme-uhs-i-microsd/extreme-uhs-i-microsd-32gb.png'],
    ['SONY 64G SDXC', 'https://retinapix.com/cdn/shop/files/SF-GSeriesUHS-IISD64GBMemoryCard.webp?v=1727764622'],
    ['Transcend', 'https://www.thetedstore.com/cdn/shop/files/909730.jpg?v=1748295793'],
    ['ADATA', 'https://us-shop.adata.com/cdn/shop/files/microCARD_Premier-UHS-I-CL10_A1_PD_2000x2000_128GB.jpg?v=1739491421'],
    ['microSD', 'https://www.sandisk.com/content/dam/store/en-us/assets/products/memory-cards/extreme-uhs-i-microsd/extreme-uhs-i-microsd-32gb.png'],
    ['SDXC', 'https://www.sandisk.com/content/dam/store/en-us/assets/products/memory-cards/extreme-pro-uhs-i-sd/gallery/200mbs/extreme-pro-uhs-i-sd-100mbs-32gb-front.png'],

    // ─── Presenters / Accessories (正確產品) ───
    ['R500', 'https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/presenters/r500s/gallery/r500s-gallery-1.png'],
    ['Asing A10', 'https://asingshop.com/cdn/shop/files/A10_1.jpg?v=1742544932'],
    ['簡報筆', 'https://asingshop.com/cdn/shop/files/A10_1.jpg?v=1742544932'],
    ['簡報遙控器', 'https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/presenters/r500s/gallery/r500s-gallery-1.png'],
    ['綠聯USB簡易讀卡機', 'https://us.ugreen.com/cdn/shop/products/ugreen-4-in-1-usb-30-sdtf-card-reader-215966_grande.png?v=1692790949'],
    // E-BOOK讀卡機 — 待補實物照片

    // ─── Audio extras (正確產品) ───
    ['SONY 錄音筆', 'https://helpguide.sony.net/icd/u57/v1/en2/contents/image/ICD-UX570_UX570F_UX575F_ill_COV_E.png'],
    ['XLR音源線', 'https://edge.rode.com//images/products/variants/73/rode-xlr-coil-with-tag-hero-3840x2160-rgb-1080x1080-51b303e.png'],
    ['金頭音源線', 'https://starlite.com.gh/cdn/shop/products/ugreen-3.5mm-maleto-3.5mm-male-10728-11_52a8c247-3293-4d6b-833d-4ebdfe01d165.jpg?crop=center&height=1000&v=1606175588&width=1000'],
    ['手持麥轉接套件', 'https://edge.rode.com/images/products/variants/358/RODE_Wireless_GO_HANDLE_WITH_POPSHIELD_FRONT_RGB-2000x2000-724898e.png'],

    // ─── Cables ───
    ['編織HDMI', 'https://jgsuperstore.com/cdn/shop/products/A_980ecbfe-2ecc-4e49-b985-5cc186ec9812.jpg?v=1662775548'],
    ['紅頭DP', 'https://m.media-amazon.com/images/I/71vvR7ZDUnL._AC_SL1500_.jpg'],

    // ─── Keyboard / Mouse 鍵盤滑鼠 ───
    ['Logitech 鍵盤 K580', 'https://resource.logitech.com/content/dam/logitech/en/products/keyboards/k580-multi-device-wireless-keyboard/gallery/k580-gallery-graphite-1.png'],
    ['Logitech 有線鍵盤 K120', 'https://resource.logitech.com/content/dam/logitech/en/products/keyboards/k120/gallery/k120-gallery-01-new.png'],
    ['i-Rocks', 'https://www.i-rocks.com/uploads/product/en/IRK01W_in%20G01.jpg'],
    ['IRK01', 'https://www.i-rocks.com/uploads/product/en/IRK01W_in%20G01.jpg'],
    ['apple 鍵盤', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MXK83?wid=2000&hei=2000&fmt=jpeg&qlt=90'],
    ['LEXMA', 'https://img.shoplineapp.com/media/image_clips/60389a3f0402ab00208c6376/original.jpg?1614322239'],
    ['MS950R', 'https://img.shoplineapp.com/media/image_clips/60389a3f0402ab00208c6376/original.jpg?1614322239'],
    ['Logitech滑鼠 M350', 'https://c1.neweggimages.com/ProductImageOriginal/26-197-436-S01.jpg'],
    ['小米無線藍牙滑鼠', 'https://www.giztop.com/media/catalog/product/cache/97cc1143d2e20f2b0c8ea91aaa12053c/m/o/mouse.png'],

    // ─── Headsets ───
    ['Logitech zone wireless', 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/headsets/zone-wireless-2-es/gallery/teams-version-with-receiver/graphite/b2b-zone-wireless-2-es-business-headset-graphite-teams-version-with-receiver-image-1.png?v=1'],
    ['Zone Wireless', 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/headsets/zone-wireless-2-es/gallery/teams-version-with-receiver/graphite/b2b-zone-wireless-2-es-business-headset-graphite-teams-version-with-receiver-image-1.png?v=1'],

    // ─── Apple TV ───
    ['APPLE TV', 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/apple-tv-4k-hero-select-202210?wid=960&hei=600&fmt=p-jpg&qlt=95&.v=1664912661535'],
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

        // Determine thumbnail: product image or category SVG fallback
        let thumbHtml;
        if (thumbSrc) {
          const fallbackUri = svgToDataUri(catSvg);
          thumbHtml = `<div class="card-thumb"><img src="${escapeHtml(thumbSrc)}" alt="" loading="lazy" data-fallback="${escapeHtml(fallbackUri)}" /></div>`;
        } else {
          thumbHtml = `<div class="card-thumb"><img src="${svgToDataUri(catSvg)}" alt="" /></div>`;
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
      // Handle thumbnail image errors — swap to fallback
      dom.contentArea.querySelectorAll('.card-thumb img[data-fallback]').forEach(img => {
        img.addEventListener('error', function () {
          if (this.dataset.fallback) {
            this.src = this.dataset.fallback;
            this.removeAttribute('data-fallback');
          }
        });
      });

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

  // ── Location Map ──────────────────────────────────
  const LocationMap = {
    initialized: false,

    // Render the interactive SVG map into the #locationMap element
    init() {
      // Always re-render: state.rows may have been loaded after first init
      // Each area: [位置名稱, x, y, width, height, color]
      // Coordinates match location-map.svg viewBox="0 0 1200 720"
      // Palette: forest greens + warm amber + slates (cohesive earth tones)
      const areas = [
        // 木櫃子 — forest green family
        { loc: '木櫃子左上', x: 150, y: 62, w: 130, h: 92, color: '#2d6a4f' },
        { loc: '木櫃子右上', x: 288, y: 62, w: 130, h: 92, color: '#6b7c4f' },
        { loc: '木櫃子右中', x: 288, y: 162, w: 130, h: 92, color: '#1b4332' },
        // 大推車 — slate family (3 shades)
        { loc: '大推車（上）', x: 500, y: 64, w: 160, h: 96, color: '#475569' },
        { loc: '大推車（中）', x: 500, y: 166, w: 160, h: 96, color: '#64748b' },
        { loc: '大推車（下）', x: 500, y: 268, w: 160, h: 96, color: '#334155' },
        // 小推車 — warm amber
        { loc: '小推車', x: 720, y: 100, w: 140, h: 270, color: '#d97706' },
        // 洞洞板 — sage olive
        { loc: '洞洞板', x: 900, y: 60, w: 260, h: 310, color: '#84a98c' },
        // 地上 — muted gray
        { loc: '地上', x: 900, y: 440, w: 260, h: 220, color: '#9aa3b2' },
      ];

      // Build clickable overlay areas on the SVG (percentages of 1200×720)
      const overlays = areas.map(a => {
        return `<div class="map-hotspot" data-location="${escapeHtml(a.loc)}" style="left:${a.x/12}%;top:${a.y/7.2}%;width:${a.w/12}%;height:${a.h/7.2}%;--spot-color:${a.color}" title="點擊查看「${a.loc}」的設備">
          <span class="map-hotspot-label">${escapeHtml(a.loc)}</span>
        </div>`;
      }).join('');

      // Build the location list (Plan C bottom list)
      const locationCounts = {};
      for (const row of state.rows) {
        const loc = (row['位置'] || '').trim();
        if (loc) locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }
      // Sort by count (descending)
      const sortedLocs = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
      // Map area colors by location
      const locColorMap = {};
      for (const a of areas) locColorMap[a.loc] = a.color;

      const listHtml = sortedLocs.map(([loc, count]) => {
        const c = locColorMap[loc] || '#94a3b8';
        return `
          <button type="button" class="loc-list-row" data-location="${escapeHtml(loc)}">
            <span class="loc-list-dot" style="background:${c}"></span>
            <span class="loc-list-name">${escapeHtml(loc)}</span>
            <span class="loc-list-count">${count} 件</span>
            <span class="loc-list-arrow">${Icons.chevronRight}</span>
          </button>`;
      }).join('');

      dom.locationMap.innerHTML = `
        <div class="loc-banner">
          <span class="loc-banner-icon">💡</span>
          <span class="loc-banner-text">點地圖或清單篩選位置</span>
          <button type="button" class="map-zoom-btn" aria-label="放大檢視"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg><span>全螢幕</span></button>
        </div>
        <div class="location-map-container">
          <div class="location-map-inner">
            <img src="./location-map.svg?v=5" alt="器材室收納位置圖" class="location-map" />
            ${overlays}
          </div>
        </div>
        <div class="loc-list">
          <h3 class="loc-list-title">各位置收納數量</h3>
          ${listHtml}
        </div>`;

      // Bind clicks: click area → switch to that location tab
      dom.locationMap.querySelectorAll('.map-hotspot').forEach(el => {
        el.addEventListener('click', () => {
          const loc = el.dataset.location;
          state.currentMode = 'location';
          state.currentTab = loc;
          render();
          dom.contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      // Bind clicks on the list rows
      dom.locationMap.querySelectorAll('.loc-list-row').forEach(el => {
        el.addEventListener('click', () => {
          const loc = el.dataset.location;
          state.currentMode = 'location';
          state.currentTab = loc;
          render();
          dom.contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      // Zoom button: open full-screen overlay
      const zoomBtn = dom.locationMap.querySelector('.map-zoom-btn');
      if (zoomBtn) {
        zoomBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openZoom();
        });
      }
    },

    // Open zoom overlay
    openZoom() {
      let overlay = document.getElementById('mapZoomOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'mapZoomOverlay';
        overlay.className = 'map-zoom-overlay';
        overlay.innerHTML = `
          <button type="button" class="map-zoom-close" aria-label="關閉">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div class="map-zoom-scroll">
            <img src="./location-map.svg?v=5" alt="器材室收納位置圖（放大）" class="map-zoom-img" />
          </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('.map-zoom-close').addEventListener('click', () => {
          overlay.classList.remove('is-open');
          document.body.style.overflow = '';
        });
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            overlay.classList.remove('is-open');
            document.body.style.overflow = '';
          }
        });
      }
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    },

    // Show or hide based on current mode
    update() {
      const show = state.currentMode === 'location';
      dom.locationMap.hidden = !show;
      if (show) this.init();
    },
  };

  // ── Render Orchestrator ───────────────────────────
  function render() {
    LocationMap.update();
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

  // Expose minimal API for borrow system extension (borrow.js)
  window.__inventoryApp = { state, CONFIG, Modal, Renderer, FilterEngine, render, escapeHtml, dom };
})();
