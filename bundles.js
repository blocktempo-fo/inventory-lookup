/**
 * Bundles Module — 配件包推薦系統
 *
 * 讀取 bundles.csv（從 Google Sheets「配件包」分頁同步），
 * 在器材詳情頁面顯示「一併借用建議」區塊。
 *
 * 資料結構：
 *   套組ID,用途,器材編號,必要性,替代品,說明
 *   sony-a6400,通用,BT-M-cam-001-01,主設備,,Sony A6400 主機
 *
 * 必要性可填值：主設備 / 必備 / 推薦 / 選配
 */
(function () {
  'use strict';

  // 等待主程式載入 ─────────────────────
  function waitForApp(callback) {
    const check = () => {
      if (window.__inventoryApp) callback(window.__inventoryApp);
      else setTimeout(check, 50);
    };
    check();
  }

  waitForApp(function (app) {

    // ═══ State ═══════════════════════════════════════
    const Bundles = {
      // group_id → array of bundle rows
      groups: {},
      // anchor item_id → group_id
      anchorMap: {},

      // 載入並 parse bundles.csv
      load(callback) {
        if (!window.Papa) { callback && callback(); return; }
        Papa.parse('./bundles.csv?_=' + Date.now(), {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            this.process(results.data);
            callback && callback();
          },
          error: () => {
            // bundles.csv 不存在或載入失敗 → 靜默失敗
            callback && callback();
          },
        });
      },

      // 把 rows 整理成 groups 與 anchor lookup
      process(rows) {
        for (const row of rows) {
          const groupId = (row['套組ID'] || '').trim();
          const itemId = (row['器材編號'] || '').trim();
          const role = (row['必要性'] || '').trim();
          if (!groupId || !itemId || !role) continue;

          const entry = {
            groupId,
            scenario: (row['用途'] || '通用').trim(),
            itemId,
            role,
            altItemIds: (row['替代品'] || '')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean),
            notes: (row['說明'] || '').trim(),
          };

          if (!this.groups[groupId]) this.groups[groupId] = [];
          this.groups[groupId].push(entry);

          if (role === '主設備') {
            this.anchorMap[itemId] = groupId;
          }
        }
      },

      // 依 item_id 取得它所屬的套組（如果它是 anchor）
      getBundleByAnchor(itemId) {
        const cleanId = (itemId || '').trim();
        const groupId = this.anchorMap[cleanId];
        if (!groupId) return null;
        return {
          groupId,
          items: this.groups[groupId] || [],
        };
      },
    };

    // ═══ 找對應的器材資料 ═══════════════════════════
    function findItemById(itemId) {
      const cleanId = (itemId || '').trim();
      return app.state.rows.find(r => (r['編號'] || '').trim() === cleanId);
    }

    // 在 alt 列表中找第一個可借用的
    function findFirstAvailable(altIds) {
      for (const altId of altIds) {
        const item = findItemById(altId);
        if (!item) continue;
        const status = (item['狀態'] || '可借用').trim() || '可借用';
        if (status === '可借用') return item;
      }
      return null;
    }

    // 排序：主設備 > 必備 > 推薦 > 選配
    const ROLE_ORDER = { '主設備': 0, '必備': 1, '推薦': 2, '選配': 3 };

    // ═══ 渲染推薦區塊 ═══════════════════════════════
    function renderBundleSection(anchorItem) {
      const bundle = Bundles.getBundleByAnchor(anchorItem['編號']);
      if (!bundle) return null;

      // 排除 anchor 自己，依角色排序
      const others = bundle.items
        .filter(b => b.role !== '主設備')
        .sort((a, b) => {
          const ra = ROLE_ORDER[a.role] ?? 99;
          const rb = ROLE_ORDER[b.role] ?? 99;
          return ra - rb;
        });

      if (others.length === 0) return null;

      // 依角色分組
      const byRole = { '必備': [], '推薦': [], '選配': [] };
      for (const b of others) {
        if (byRole[b.role]) byRole[b.role].push(b);
      }

      // 為每個項目找實際的 item 資料 + 替代品狀態
      function buildRow(b) {
        const item = findItemById(b.itemId);
        const status = item ? ((item['狀態'] || '可借用').trim() || '可借用') : '不存在';
        let usedAlt = null;
        if (item && status !== '可借用' && b.altItemIds.length > 0) {
          usedAlt = findFirstAvailable(b.altItemIds);
        }
        return { config: b, item, status, usedAlt };
      }

      const requiredRows = byRole['必備'].map(buildRow);
      const recommendedRows = byRole['推薦'].map(buildRow);
      const optionalRows = byRole['選配'].map(buildRow);

      const totalCount = requiredRows.length + recommendedRows.length + optionalRows.length;

      // ── 渲染 HTML ──
      const wrap = document.createElement('div');
      wrap.className = 'bundle-section';
      wrap.innerHTML = `
        <div class="bundle-header">
          <div class="bundle-title">📦 一併借用建議</div>
          <div class="bundle-subtitle">這台${escapeHtml(anchorItem['項目'] || '')}通常會搭配以下 ${totalCount} 件配件</div>
        </div>
        <div class="bundle-body" id="bundleBody"></div>
        <div class="bundle-footer">
          <span class="bundle-count">已選 <strong id="bundleSelectedCount">0</strong> 件 + 主設備 = 共 <strong id="bundleTotalCount">1</strong> 件</span>
          <button type="button" class="bundle-borrow-btn" id="bundleBorrowBtn" disabled>一併借用</button>
        </div>
      `;

      const body = wrap.querySelector('#bundleBody');
      if (requiredRows.length) body.appendChild(buildGroup('必備', '★', '#b91c1c', requiredRows, true));
      if (recommendedRows.length) body.appendChild(buildGroup('推薦', '☆', '#d97706', recommendedRows, true));
      if (optionalRows.length) body.appendChild(buildGroup('選配', '○', '#6b7280', optionalRows, false));

      // ── 計數 + 按鈕 ──
      const updateCount = () => {
        const selected = wrap.querySelectorAll('.bundle-item input[type=checkbox]:checked').length;
        wrap.querySelector('#bundleSelectedCount').textContent = selected;
        wrap.querySelector('#bundleTotalCount').textContent = selected + 1;
        const btn = wrap.querySelector('#bundleBorrowBtn');
        btn.disabled = selected === 0;
        btn.textContent = selected === 0 ? '請至少選一件配件' : `一併借用 ${selected + 1} 件`;
      };

      wrap.addEventListener('change', (e) => {
        if (e.target.matches('input[type=checkbox]')) updateCount();
      });
      updateCount();

      // ── 一併借用按鈕 ──
      wrap.querySelector('#bundleBorrowBtn').addEventListener('click', () => {
        const checked = Array.from(wrap.querySelectorAll('.bundle-item input[type=checkbox]:checked'));
        const items = [anchorItem]
          .concat(checked.map(cb => findItemById(cb.dataset.itemId)).filter(Boolean));
        // 檢查必備是否漏選
        const requiredMissing = requiredRows.filter(r => {
          const cb = wrap.querySelector(`input[data-item-id="${cssEscape(r.config.itemId)}"]`);
          return cb && !cb.checked && (r.status === '可借用' || r.usedAlt);
        });
        if (requiredMissing.length > 0) {
          const names = requiredMissing.map(r => r.config.notes || (findItemById(r.config.itemId)?.['項目']) || r.config.itemId).join('、');
          if (!confirm(`⚠️ 你沒有勾選以下必備配件：\n${names}\n\n沒有它們可能無法正常使用，仍要繼續嗎？`)) return;
        }
        // 開啟批次借用 modal（在 borrow.js 中）
        if (window.__bundleBorrow) {
          window.__bundleBorrow.open(items, bundle.groupId);
        }
      });

      return wrap;
    }

    // 建立一個分組
    function buildGroup(label, icon, color, rows, defaultChecked) {
      const grp = document.createElement('div');
      grp.className = 'bundle-group';
      grp.innerHTML = `
        <div class="bundle-group-title" style="color:${color}">
          <span>${icon}</span> ${escapeHtml(label)} (${rows.length})
        </div>
      `;
      for (const r of rows) {
        grp.appendChild(buildItemRow(r, defaultChecked));
      }
      return grp;
    }

    // 建立一行配件
    function buildItemRow({ config, item, status, usedAlt }, defaultChecked) {
      const row = document.createElement('label');
      row.className = 'bundle-item';

      // 決定要顯示的 item（原本的或替代品）
      const displayItem = (status !== '可借用' && usedAlt) ? usedAlt : item;
      const displayId = displayItem ? displayItem['編號'] : config.itemId;
      const displayName = displayItem ? displayItem['項目'] : config.notes;
      const displayStatus = displayItem ? ((displayItem['狀態'] || '可借用').trim() || '可借用') : '不存在';

      // 不可借用 (借出中/維修中) 且沒有替代品 → 不可勾
      const unavailable = displayStatus !== '可借用';
      const isChecked = defaultChecked && !unavailable;

      const statusClass = {
        '可借用': 'available',
        '借出中': 'borrowed',
        '維修中': 'maintenance',
        '停用': 'disabled',
      }[displayStatus] || 'unknown';

      row.innerHTML = `
        <input type="checkbox"
               data-item-id="${escapeHtml(displayId)}"
               ${isChecked ? 'checked' : ''}
               ${unavailable ? 'disabled' : ''} />
        <div class="bundle-item-info">
          <div class="bundle-item-name">${escapeHtml(displayName || '')}</div>
          <div class="bundle-item-meta">
            <span class="bundle-item-id mono">${escapeHtml(displayId)}</span>
            <span class="bundle-status ${statusClass}">${escapeHtml(displayStatus)}</span>
            ${(status !== '可借用' && usedAlt) ? '<span class="bundle-alt-tag">↳ 替代品</span>' : ''}
          </div>
          ${config.notes ? `<div class="bundle-item-notes">${escapeHtml(config.notes)}</div>` : ''}
        </div>
      `;
      return row;
    }

    // ═══ 工具函式 ═══════════════════════════════════
    function escapeHtml(s) {
      return String(s || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function cssEscape(s) {
      return String(s || '').replace(/(["\\])/g, '\\$1');
    }

    // ═══ 注入到詳情 Modal ═══════════════════════════
    function injectBundleSection() {
      const detailModal = document.querySelector('#detailModal');
      if (!detailModal) return;

      const observer = new MutationObserver(() => {
        if (!detailModal.classList.contains('is-open')) return;

        const modalInfo = detailModal.querySelector('.modal-info');
        if (!modalInfo) return;

        // 移除舊的（防重複注入）
        const old = modalInfo.querySelector('.bundle-section');
        if (old) old.remove();

        const item = app.Modal && app.Modal.currentItem;
        if (!item) return;

        const section = renderBundleSection(item);
        if (section) modalInfo.appendChild(section);
      });

      observer.observe(detailModal, { attributes: true, attributeFilter: ['class'] });
    }

    // ═══ 初始化 ═════════════════════════════════════
    Bundles.load(() => {
      injectBundleSection();
      window.__bundles = Bundles; // for debugging
    });
  });
})();
