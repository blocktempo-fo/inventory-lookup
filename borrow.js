(function () {
  'use strict';

  // ═══ 等待主程式載入 ═══════════════════════════════
  function waitForApp(callback) {
    const check = () => {
      if (window.__inventoryApp) {
        callback(window.__inventoryApp);
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  }

  waitForApp(function (app) {

    // ═══ 設定 ═══════════════════════════════════════
    // ★★★ 部署 Apps Script 後，把 URL 貼到這裡 ★★★
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyNua9zqK5E9ep7U6cvNkkCiAdcRwyz720SCtEqm9k0txNmOlFtlho9FxOT2oz8yL0KCA/exec';

    // 管理模式
    const isAdmin = new URLSearchParams(window.location.search).get('mode') === 'admin';

    // ═══ Optimistic Cache ═══════════════════════════
    const OptimisticCache = {
      KEY: 'borrowStatusOverrides',
      MAX_AGE_MS: 35 * 60 * 1000, // 35 分鐘

      get() {
        try {
          const raw = localStorage.getItem(this.KEY);
          if (!raw) return {};
          const overrides = JSON.parse(raw);
          const now = Date.now();
          for (const id of Object.keys(overrides)) {
            if (now - overrides[id]._ts > this.MAX_AGE_MS) delete overrides[id];
          }
          return overrides;
        } catch { return {}; }
      },

      set(itemId, updates) {
        const overrides = this.get();
        overrides[itemId] = { ...updates, _ts: Date.now() };
        localStorage.setItem(this.KEY, JSON.stringify(overrides));
      },

      // 把快取套用到 state.rows
      apply() {
        const overrides = this.get();
        if (!Object.keys(overrides).length) return;

        for (const row of app.state.rows) {
          const id = (row['編號'] || '').trim();
          if (overrides[id]) {
            const o = overrides[id];
            for (const [k, v] of Object.entries(o)) {
              if (k !== '_ts') row[k] = v;
            }
          }
        }
      },
    };

    // ═══ API ═══════════════════════════════════════
    const BorrowAPI = {
      async post(data) {
        if (!APPS_SCRIPT_URL) {
          return { success: false, message: 'Apps Script URL 尚未設定，請先完成後端部署' };
        }

        try {
          const resp = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data),
          });
          return await resp.json();
        } catch (err) {
          return { success: false, message: '網路錯誤: ' + err.message };
        }
      },

      borrow(data) {
        return this.post({ action: 'borrow', ...data });
      },

      return_(data) {
        return this.post({ action: 'return', ...data });
      },
    };

    // ═══ Borrow Modal ═══════════════════════════════
    const BorrowModal = {
      el: null,
      currentItem: null,

      init() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay borrow-modal-overlay';
        overlay.id = 'borrowModal';
        overlay.setAttribute('hidden', '');
        overlay.innerHTML = `
          <div class="modal-content borrow-modal-content">
            <button class="modal-close borrow-close" aria-label="關閉">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div class="borrow-form-wrap">
              <h2 class="borrow-form-title">借用申請</h2>
              <div class="borrow-item-summary" id="borrowItemSummary"></div>
              <form id="borrowForm" class="borrow-form">
                <div class="form-group">
                  <label for="bf_name">借用人姓名 <span class="required">*</span></label>
                  <input type="text" id="bf_name" required placeholder="你的名字" />
                </div>
                <div class="form-group">
                  <label for="bf_dept">部門 / 組別 <span class="required">*</span></label>
                  <input type="text" id="bf_dept" required placeholder="例如：編輯部" />
                </div>
                <div class="form-group">
                  <label for="bf_due">預計歸還日期 <span class="required">*</span></label>
                  <input type="date" id="bf_due" required />
                </div>
                <div class="form-group">
                  <label for="bf_purpose">用途</label>
                  <input type="text" id="bf_purpose" placeholder="例如：外拍、直播" />
                </div>
                <div class="form-group">
                  <label for="bf_notes">備註</label>
                  <textarea id="bf_notes" rows="2" placeholder="其他備註"></textarea>
                </div>
                <div class="borrow-form-actions">
                  <button type="button" class="btn-cancel" id="borrowCancelBtn">取消</button>
                  <button type="submit" class="btn-submit" id="borrowSubmitBtn">確認借用</button>
                </div>
                <div class="borrow-result" id="borrowResult" hidden></div>
              </form>
            </div>
          </div>`;
        document.body.appendChild(overlay);
        this.el = overlay;

        // Events
        overlay.querySelector('.borrow-close').addEventListener('click', () => this.close());
        overlay.querySelector('#borrowCancelBtn').addEventListener('click', () => this.close());
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) this.close();
        });
        overlay.querySelector('#borrowForm').addEventListener('submit', (e) => {
          e.preventDefault();
          this.submit();
        });

        // Set min date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        overlay.querySelector('#bf_due').min = tomorrow.toISOString().split('T')[0];
      },

      open(item) {
        this.currentItem = item;
        const summary = this.el.querySelector('#borrowItemSummary');
        summary.innerHTML = `
          <div class="borrow-summary-row"><span class="borrow-label">項目</span><span>${app.escapeHtml(item['項目'] || '')}</span></div>
          <div class="borrow-summary-row"><span class="borrow-label">編號</span><span class="mono">${app.escapeHtml(item['編號'] || '')}</span></div>
          <div class="borrow-summary-row"><span class="borrow-label">位置</span><span>${app.escapeHtml(item['位置'] || '')}</span></div>`;

        // Reset form
        this.el.querySelector('#borrowForm').reset();
        this.el.querySelector('#borrowResult').hidden = true;
        this.el.querySelector('#borrowSubmitBtn').disabled = false;
        this.el.querySelector('#borrowSubmitBtn').textContent = '確認借用';

        // Show
        this.el.classList.add('is-open');
        this.el.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
      },

      close() {
        this.el.classList.remove('is-open');
        document.body.style.overflow = '';
        setTimeout(() => {
          if (!this.el.classList.contains('is-open')) {
            this.el.setAttribute('hidden', '');
          }
        }, 250);
      },

      async submit() {
        const item = this.currentItem;
        if (!item) return;

        const btn = this.el.querySelector('#borrowSubmitBtn');
        const resultDiv = this.el.querySelector('#borrowResult');
        btn.disabled = true;
        btn.textContent = '送出中...';
        resultDiv.hidden = true;

        const data = {
          item_id: (item['編號'] || '').trim(),
          item_name: item['項目'] || '',
          category: item['類別'] || '',
          location: item['位置'] || '',
          borrower_name: this.el.querySelector('#bf_name').value.trim(),
          department: this.el.querySelector('#bf_dept').value.trim(),
          contact: '',
          due_date: this.el.querySelector('#bf_due').value,
          purpose: this.el.querySelector('#bf_purpose').value.trim(),
          notes: this.el.querySelector('#bf_notes').value.trim(),
        };

        const result = await BorrowAPI.borrow(data);

        resultDiv.hidden = false;
        if (result.success) {
          resultDiv.className = 'borrow-result success';
          resultDiv.innerHTML = `<strong>借用成功！</strong><br>借用單號: <span class="mono">${app.escapeHtml(result.loan_id || '')}</span>`;

          // Optimistic update
          OptimisticCache.set(data.item_id, {
            '狀態': '借出中',
            '借用人': data.borrower_name,
            '借出日期': new Date().toISOString().split('T')[0],
            '預計歸還日': data.due_date,
          });
          OptimisticCache.apply();

          // Close detail modal and re-render
          app.Modal.close();
          app.render();

          setTimeout(() => this.close(), 2000);
        } else {
          resultDiv.className = 'borrow-result error';
          resultDiv.textContent = result.message || '借用失敗';
          btn.disabled = false;
          btn.textContent = '確認借用';
        }
      },
    };

    // ═══ Return Modal (Admin only) ═══════════════════
    const ReturnModal = {
      el: null,
      currentLoanId: null,
      currentItem: null,

      init() {
        if (!isAdmin) return;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay return-modal-overlay';
        overlay.id = 'returnModal';
        overlay.setAttribute('hidden', '');
        overlay.innerHTML = `
          <div class="modal-content borrow-modal-content">
            <button class="modal-close borrow-close" aria-label="關閉">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div class="borrow-form-wrap">
              <h2 class="borrow-form-title return-title">歸還檢核</h2>
              <div id="returnItemSummary" class="borrow-item-summary"></div>
              <form id="returnForm" class="borrow-form">
                <div class="form-group check-group">
                  <label>外觀正常</label>
                  <div class="radio-row">
                    <label><input type="radio" name="rf_appearance" value="true" checked /> 是</label>
                    <label><input type="radio" name="rf_appearance" value="false" /> 否</label>
                  </div>
                </div>
                <div class="form-group check-group">
                  <label>功能正常</label>
                  <div class="radio-row">
                    <label><input type="radio" name="rf_function" value="true" checked /> 是</label>
                    <label><input type="radio" name="rf_function" value="false" /> 否</label>
                  </div>
                </div>
                <div class="form-group check-group">
                  <label>配件齊全</label>
                  <div class="radio-row">
                    <label><input type="radio" name="rf_accessories" value="true" checked /> 是</label>
                    <label><input type="radio" name="rf_accessories" value="false" /> 否</label>
                  </div>
                </div>
                <div class="form-group check-group">
                  <label>歸位正確</label>
                  <div class="radio-row">
                    <label><input type="radio" name="rf_storage" value="true" checked /> 是</label>
                    <label><input type="radio" name="rf_storage" value="false" /> 否</label>
                  </div>
                </div>
                <div class="form-group">
                  <label for="rf_damage">損壞 / 缺件描述</label>
                  <textarea id="rf_damage" rows="2" placeholder="如有異常請描述"></textarea>
                </div>
                <div class="borrow-form-actions">
                  <button type="button" class="btn-cancel" id="returnCancelBtn">取消</button>
                  <button type="submit" class="btn-submit btn-return" id="returnSubmitBtn">確認歸還</button>
                </div>
                <div class="borrow-result" id="returnResult" hidden></div>
              </form>
            </div>
          </div>`;
        document.body.appendChild(overlay);
        this.el = overlay;

        // Events
        overlay.querySelector('.borrow-close').addEventListener('click', () => this.close());
        overlay.querySelector('#returnCancelBtn').addEventListener('click', () => this.close());
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) this.close();
        });
        overlay.querySelector('#returnForm').addEventListener('submit', (e) => {
          e.preventDefault();
          this.submit();
        });
      },

      open(item) {
        if (!this.el) return;
        this.currentItem = item;

        const summary = this.el.querySelector('#returnItemSummary');
        summary.innerHTML = `
          <div class="borrow-summary-row"><span class="borrow-label">項目</span><span>${app.escapeHtml(item['項目'] || '')}</span></div>
          <div class="borrow-summary-row"><span class="borrow-label">編號</span><span class="mono">${app.escapeHtml(item['編號'] || '')}</span></div>
          <div class="borrow-summary-row"><span class="borrow-label">借用人</span><span>${app.escapeHtml(item['借用人'] || '')}</span></div>`;

        this.el.querySelector('#returnForm').reset();
        this.el.querySelector('#returnResult').hidden = true;
        this.el.querySelector('#returnSubmitBtn').disabled = false;
        this.el.querySelector('#returnSubmitBtn').textContent = '確認歸還';

        this.el.classList.add('is-open');
        this.el.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
      },

      close() {
        this.el.classList.remove('is-open');
        document.body.style.overflow = '';
        setTimeout(() => {
          if (!this.el.classList.contains('is-open')) {
            this.el.setAttribute('hidden', '');
          }
        }, 250);
      },

      async submit() {
        const btn = this.el.querySelector('#returnSubmitBtn');
        const resultDiv = this.el.querySelector('#returnResult');
        btn.disabled = true;
        btn.textContent = '處理中...';

        const getRadio = (name) => this.el.querySelector(`input[name="${name}"]:checked`)?.value === 'true';
        const appearance = getRadio('rf_appearance');
        const func = getRadio('rf_function');
        const accessories = getRadio('rf_accessories');
        const storage = getRadio('rf_storage');
        const allOk = appearance && func && accessories && storage;

        const data = {
          item_id: (this.currentItem['編號'] || '').trim(),
          checker: '管理者',
          appearance_ok: appearance,
          function_ok: func,
          accessories_ok: accessories,
          storage_ok: storage,
          damage_note: this.el.querySelector('#rf_damage').value.trim(),
          result: allOk ? '正常' : ((!accessories) ? '缺件' : '損壞'),
        };

        const result = await BorrowAPI.return_(data);
        resultDiv.hidden = false;

        if (result.success) {
          resultDiv.className = 'borrow-result success';
          resultDiv.innerHTML = '<strong>歸還處理完成！</strong>';

          // Optimistic update
          const itemId = (this.currentItem['編號'] || '').trim();
          OptimisticCache.set(itemId, {
            '狀態': allOk ? '可借用' : '維修中',
            '借用人': '',
            '借出日期': '',
            '預計歸還日': '',
          });
          OptimisticCache.apply();

          app.Modal.close();
          app.render();
          setTimeout(() => this.close(), 2000);
        } else {
          resultDiv.className = 'borrow-result error';
          resultDiv.textContent = result.message || '歸還處理失敗';
          btn.disabled = false;
          btn.textContent = '確認歸還';
        }
      },
    };

    // ═══ 注入借用按鈕到現有 Modal ═══════════════════
    function injectBorrowButton() {
      const detailModal = document.querySelector('#detailModal');
      if (!detailModal) return;

      // MutationObserver: 監聽 modal 開啟
      const observer = new MutationObserver(() => {
        if (!detailModal.classList.contains('is-open')) return;

        const modalInfo = detailModal.querySelector('.modal-info');
        if (!modalInfo) return;

        // 移除舊的按鈕區（防重複）
        const existing = modalInfo.querySelector('.borrow-action-area');
        if (existing) existing.remove();

        const item = app.Modal.currentItem;
        if (!item) return;

        const status = (item['狀態'] || '').trim();
        const area = document.createElement('div');
        area.className = 'borrow-action-area';

        if (!status || status === '可借用') {
          // 可借用 → 顯示借用按鈕
          area.innerHTML = `
            <button class="btn-borrow" type="button">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              借用申請
            </button>`;
          area.querySelector('.btn-borrow').addEventListener('click', () => {
            BorrowModal.open(item);
          });
        } else if (status === '借出中') {
          // 借出中 → 顯示狀態 + 管理員可歸還
          const borrower = item['借用人'] || '';
          const dueDate = item['預計歸還日'] || '';
          let html = `
            <div class="borrow-status-badge borrowed">
              <span class="status-dot" style="background:#ea580c"></span>
              借出中${borrower ? ' — ' + app.escapeHtml(borrower) : ''}
              ${dueDate ? '<br><small>預計歸還: ' + app.escapeHtml(dueDate) + '</small>' : ''}
            </div>`;

          if (isAdmin) {
            html += `<button class="btn-return-action" type="button">處理歸還</button>`;
          }
          area.innerHTML = html;

          if (isAdmin) {
            area.querySelector('.btn-return-action').addEventListener('click', () => {
              ReturnModal.open(item);
            });
          }
        } else if (status === '維修中') {
          area.innerHTML = `
            <div class="borrow-status-badge maintenance">
              <span class="status-dot" style="background:#dc2626"></span>
              維修中 — 暫不可借用
            </div>`;
        } else if (status === '停用') {
          area.innerHTML = `
            <div class="borrow-status-badge disabled">
              <span class="status-dot" style="background:#9ca3af"></span>
              已停用
            </div>`;
        }

        modalInfo.appendChild(area);
      });

      observer.observe(detailModal, { attributes: true, attributeFilter: ['class'] });
    }

    // ═══ 管理模式 UI ═══════════════════════════════
    function setupAdminMode() {
      if (!isAdmin) return;

      // 加上管理模式標示
      const header = document.querySelector('.app-header');
      if (header) {
        const badge = document.createElement('div');
        badge.className = 'admin-badge';
        badge.innerHTML = '管理模式';
        header.appendChild(badge);
      }

      // 修改副標題
      const subtitle = document.querySelector('.app-subtitle');
      if (subtitle) {
        subtitle.textContent = '管理模式 — 可處理器材歸還與檢核。';
      }
    }

    // ═══ 即時同步狀態（不等 CSV 30 分鐘同步）═══════════
    async function fetchLiveStatus() {
      if (!APPS_SCRIPT_URL) return;
      try {
        const resp = await fetch(APPS_SCRIPT_URL + '?action=active_loans');
        const data = await resp.json();
        if (!data.success || !data.loans) return;

        // 建一個借出中的 itemId 集合
        const borrowedIds = new Set();
        for (const loan of data.loans) {
          const id = (loan['編號'] || '').trim();
          if (id) borrowedIds.add(id);
        }

        // 更新所有 rows
        for (const row of app.state.rows) {
          const itemId = (row['編號'] || '').trim();
          if (!itemId) continue;

          if (borrowedIds.has(itemId)) {
            // 這個器材是借出中
            const loan = data.loans.find(l => (l['編號'] || '').trim() === itemId);
            row['狀態'] = '借出中';
            row['借用人'] = loan['借用人姓名'] || '';
            row['借出日期'] = loan['借出日期'] || '';
            row['預計歸還日'] = loan['預計歸還日'] || '';
          } else if (row['狀態'] === '借出中') {
            // CSV 說借出中但後端已歸還 → 清回可借用
            row['狀態'] = '可借用';
            row['借用人'] = '';
            row['借出日期'] = '';
            row['預計歸還日'] = '';
          }
        }

        // 清除過期的 localStorage 快取
        localStorage.removeItem(OptimisticCache.KEY);

        app.render();
      } catch (e) {
        // 靜默失敗，用 CSV 資料就好
      }
    }

    // ═══ 在 render 後套用 optimistic cache ═══════════
    function patchRender() {
      const originalRender = app.render;
      app.render = function () {
        OptimisticCache.apply();
        originalRender();
      };
    }

    // ═══ 跨分頁同步 ═══════════════════════════════════
    function setupCrossTabSync() {
      // 1. 當另一個分頁更新 localStorage，自動重新套用並渲染
      window.addEventListener('storage', (e) => {
        if (e.key === OptimisticCache.KEY) {
          OptimisticCache.apply();
          app.render();
        }
      });

      // 2. 切回此分頁時，從後端拿最新狀態
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // 先套用 localStorage（可能被另一個分頁更新了）
          OptimisticCache.apply();
          app.render();
          // 再從後端拉最新資料
          fetchLiveStatus();
        }
      });
    }

    // ═══ 初始化 ═══════════════════════════════════════
    function init() {
      // 套用快取
      OptimisticCache.apply();

      // Patch render
      patchRender();

      // 初始化模組
      BorrowModal.init();
      ReturnModal.init();
      injectBorrowButton();
      setupAdminMode();

      // 跨分頁同步
      setupCrossTabSync();

      // 重新渲染以套用快取
      app.render();

      // 從 Apps Script 拿即時借用狀態（不依賴 CSV 同步延遲）
      fetchLiveStatus();
    }

    init();
  });
})();
