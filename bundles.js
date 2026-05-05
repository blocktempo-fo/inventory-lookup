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
      // item_id → array of { groupId, role } — 反向索引（一個 item 可在多個套組）
      itemMap: {},
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

      // 把 rows 整理成 groups + itemMap + anchorMap
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

          if (!this.itemMap[itemId]) this.itemMap[itemId] = [];
          this.itemMap[itemId].push({ groupId, role });

          // 替代品也視為套組成員（讓使用者點電池-2/3 也能看到套組面板）
          for (const altId of entry.altItemIds) {
            if (!this.itemMap[altId]) this.itemMap[altId] = [];
            // 避免重複：只在還沒登記過這個 group 時加
            const already = this.itemMap[altId].some(m => m.groupId === groupId);
            if (!already) {
              this.itemMap[altId].push({ groupId, role, isAlt: true, primaryItemId: itemId });
            }
          }

          if (role === '主設備') {
            this.anchorMap[itemId] = groupId;
          }
        }
      },

      // 依 item_id 取得它所屬的所有套組（不限 anchor）
      getBundlesForItem(itemId) {
        const cleanId = (itemId || '').trim();
        const memberships = this.itemMap[cleanId] || [];
        return memberships.map(m => ({
          groupId: m.groupId,
          role: m.role,
          items: this.groups[m.groupId] || [],
          anchor: (this.groups[m.groupId] || []).find(b => b.role === '主設備'),
        }));
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

    // 取得套組成員的狀態資訊（含替代品 fallback）
    function buildBundleRow(b) {
      const item = findItemById(b.itemId);
      const status = item ? ((item['狀態'] || '可借用').trim() || '可借用') : '不存在';
      let usedAlt = null;
      if (item && status !== '可借用' && b.altItemIds.length > 0) {
        usedAlt = findFirstAvailable(b.altItemIds);
      }
      return { config: b, item, status, usedAlt };
    }

    // 取得單個套組的所有成員資料 (含 anchor)
    function getBundleAllRows(bundle) {
      return bundle.items
        .slice()
        .sort((a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99))
        .map(buildBundleRow);
    }

    // ═══ 渲染推薦區塊（通用版 — 不限 anchor）═══════════
    function renderBundleSection(currentItem) {
      const cleanCurrentId = (currentItem['編號'] || '').trim();
      const bundles = Bundles.getBundlesForItem(cleanCurrentId);
      if (!bundles || bundles.length === 0) return null;

      const wrap = document.createElement('div');
      wrap.className = 'bundle-section';

      // V1：如果有多個套組，先渲染第一個（之後可加 tab 切換）
      // 為了實用性，優先選 anchor 套組（如果使用者點的就是 anchor）
      const primary = bundles.find(b => b.anchor && b.anchor.itemId === cleanCurrentId) || bundles[0];

      const rows = getBundleAllRows(primary);
      const anchorRow = rows.find(r => r.config.role === '主設備');
      const totalCount = rows.length;
      const availCount = rows.filter(r => r.status === '可借用' || r.usedAlt).length;

      // 入口角色（決定預設勾選邏輯）
      const entryRole = primary.role; // '主設備' / '必備' / '推薦' / '選配'

      // 標題：根據入口顯示不同 tone
      const anchorName = anchorRow?.item?.['項目'] || primary.groupId;
      let titleText, subtitleText;
      if (entryRole === '主設備') {
        titleText = '📦 一併借用建議';
        subtitleText = `這台${escapeHtml(anchorName)}通常會搭配以下 ${totalCount - 1} 件配件`;
      } else {
        titleText = '📦 屬於套組';
        subtitleText = `這件器材是「${escapeHtml(anchorName)}」套組的一部分`;
      }

      wrap.innerHTML = `
        <div class="bundle-header">
          <div class="bundle-title">${titleText}</div>
          <div class="bundle-subtitle">${subtitleText}</div>
        </div>
        ${bundles.length > 1 ? renderBundleTabs(bundles, primary.groupId) : ''}
        <div class="bundle-body" id="bundleBody"></div>
        <div class="bundle-footer">
          <div class="bundle-stats">
            <span>共 <strong>${totalCount}</strong> 件</span>
            <span class="sep">｜</span>
            <span>你選了 <strong id="bundleSelectedCount">0</strong> 件</span>
            <span class="sep">｜</span>
            <span>套組可借 <strong>${availCount}</strong>/<strong>${totalCount}</strong></span>
          </div>
          <div class="bundle-actions">
            <button type="button" class="bundle-borrow-btn" id="bundleBorrowBtn" disabled>借用所選</button>
          </div>
        </div>
      `;

      const body = wrap.querySelector('#bundleBody');

      // 分組渲染（主設備永遠在最上面）
      const byRole = { '主設備': [], '必備': [], '推薦': [], '選配': [] };
      for (const r of rows) {
        if (byRole[r.config.role]) byRole[r.config.role].push(r);
      }

      const groupConfigs = [
        { role: '主設備', label: '主設備', icon: '🎯', color: '#1b4332' },
        { role: '必備',   label: '必備',   icon: '★', color: '#b91c1c' },
        { role: '推薦',   label: '推薦',   icon: '☆', color: '#d97706' },
        { role: '選配',   label: '選配',   icon: '○', color: '#6b7280' },
      ];

      for (const cfg of groupConfigs) {
        const grpRows = byRole[cfg.role];
        if (!grpRows.length) continue;
        body.appendChild(buildGroup(cfg, grpRows, entryRole, cleanCurrentId));
      }

      // ── 計數 + 按鈕 ──
      const updateCount = () => {
        const selected = wrap.querySelectorAll('.bundle-item input[type=checkbox]:checked').length;
        wrap.querySelector('#bundleSelectedCount').textContent = selected;
        const btn = wrap.querySelector('#bundleBorrowBtn');
        btn.disabled = selected === 0;
        btn.textContent = selected === 0 ? '請至少勾選 1 件' : (selected === 1 ? '借用 1 件' : `借用所選 ${selected} 件`);
      };

      wrap.addEventListener('change', (e) => {
        if (e.target.matches('input[type=checkbox]')) updateCount();
      });
      updateCount();

      // ── 借用按鈕 ──
      wrap.querySelector('#bundleBorrowBtn').addEventListener('click', () => {
        const checked = Array.from(wrap.querySelectorAll('.bundle-item input[type=checkbox]:checked'));
        const items = checked.map(cb => findItemById(cb.dataset.itemId)).filter(Boolean);
        if (items.length === 0) return;

        // 檢查必備或主設備是否漏勾（且該配件有可借的）
        const checkedIds = new Set(checked.map(cb => cb.dataset.itemId));
        const missing = rows.filter(r => {
          if (r.config.role !== '必備' && r.config.role !== '主設備') return false;
          const displayId = (r.status === '可借用') ? r.config.itemId : (r.usedAlt?.['編號'] || '');
          if (!displayId) return false;
          if (checkedIds.has(displayId)) return false;
          return r.status === '可借用' || !!r.usedAlt;
        });

        if (missing.length > 0) {
          const names = missing.map(r => {
            const itemName = findItemById(r.config.itemId)?.['項目'] || r.config.itemId;
            return `${r.config.role === '主設備' ? '【主設備】' : '【必備】'}${itemName}`;
          }).join('\n');
          if (!confirm(`⚠️ 你沒有勾選以下重要器材：\n\n${names}\n\n沒有它們可能無法正常使用，仍要繼續嗎？`)) return;
        }

        // 單借 vs 批次借
        if (items.length === 1) {
          // 單件 → 開原本的 BorrowModal
          if (window.__borrowModal) window.__borrowModal.open(items[0]);
        } else {
          // 多件 → 開 BundleBorrow
          if (window.__bundleBorrow) window.__bundleBorrow.open(items, primary.groupId);
        }
      });

      return wrap;
    }

    // 多套組時的 tab 切換（V2 placeholder — 暫先呈現）
    function renderBundleTabs(bundles, activeGroupId) {
      return `
        <div class="bundle-tabs">
          ${bundles.map(b => `
            <span class="bundle-tab ${b.groupId === activeGroupId ? 'active' : ''}">
              ${escapeHtml(b.anchor?.notes || b.groupId)}
            </span>
          `).join('')}
          <span class="bundle-tabs-hint">（這件器材屬於 ${bundles.length} 個套組）</span>
        </div>
      `;
    }

    // 建立一個分組（含主設備）
    function buildGroup(cfg, rows, entryRole, currentItemId) {
      const grp = document.createElement('div');
      grp.className = `bundle-group bundle-group-${cfg.role === '主設備' ? 'anchor' : cfg.role}`;
      grp.innerHTML = `
        <div class="bundle-group-title" style="color:${cfg.color}">
          <span>${cfg.icon}</span> ${escapeHtml(cfg.label)} (${rows.length})
        </div>
      `;
      for (const r of rows) {
        grp.appendChild(buildItemRow(r, entryRole, currentItemId));
      }
      return grp;
    }

    // 建立一行配件
    function buildItemRow({ config, item, status, usedAlt }, entryRole, currentItemId) {
      const row = document.createElement('label');
      row.className = 'bundle-item';

      // 決定要顯示的 item（原本的或替代品）
      const displayItem = (status !== '可借用' && usedAlt) ? usedAlt : item;
      const displayId = displayItem ? displayItem['編號'] : config.itemId;
      const displayName = displayItem ? displayItem['項目'] : config.notes;
      const displayStatus = displayItem ? ((displayItem['狀態'] || '可借用').trim() || '可借用') : '不存在';

      const isCurrent = (config.itemId === currentItemId) || (displayId === currentItemId);
      const unavailable = displayStatus !== '可借用';

      // 預設勾選邏輯：
      // - 入口=主設備：必備+推薦勾，選配不勾
      // - 入口=必備/推薦/選配：只勾自己 + 主設備（若可借）
      let isChecked = false;
      if (entryRole === '主設備') {
        isChecked = (config.role === '主設備' || config.role === '必備' || config.role === '推薦');
      } else {
        isChecked = isCurrent || config.role === '主設備';
      }
      if (unavailable) isChecked = false;

      if (isCurrent) row.classList.add('is-current');
      if (config.role === '主設備') row.classList.add('is-anchor');

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
          <div class="bundle-item-name">
            ${escapeHtml(displayName || '')}
            ${isCurrent ? '<span class="bundle-current-tag">📍 你正在看這個</span>' : ''}
          </div>
          <div class="bundle-item-meta">
            <span class="bundle-item-id mono">${escapeHtml(displayId)}</span>
            <span class="bundle-status ${statusClass}">${escapeHtml(displayStatus)}</span>
            ${(status !== '可借用' && usedAlt) ? `<span class="bundle-alt-tag">↳ 替代品（原 ${escapeHtml(config.itemId)} 不可用）</span>` : ''}
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
