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
                  <select id="bf_dept" required>
                    <option value="">請選擇部門</option>
                    <option value="FO">FO</option>
                    <option value="CT">CT</option>
                    <option value="MKT">MKT</option>
                    <option value="BD">BD</option>
                    <option value="J/R">J/R</option>
                  </select>
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

                <!-- 借用前確認 -->
                <div class="borrow-rules">
                  <div class="borrow-rules-title">📋 借用前請確認</div>
                  <ul class="borrow-rules-list">
                    <li>器材歸還時須交給管理員（Kessy）檢查並協助歸位</li>
                    <li>使用中如遇故障或缺件，請立即聯絡 Kessy 處理</li>
                    <li>請於預計歸還日前完成歸還，逾期將影響後續借用</li>
                    <li>器材限公務使用，不得私人外借或轉借他人</li>
                  </ul>
                  <label class="borrow-agree">
                    <input type="checkbox" id="bf_agree" required />
                    <span>我已閱讀並同意以上規則</span>
                  </label>
                </div>

                <div class="borrow-form-actions">
                  <button type="button" class="btn-cancel" id="borrowCancelBtn">取消</button>
                  <button type="submit" class="btn-submit" id="borrowSubmitBtn" disabled>確認借用</button>
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

        // Agree checkbox toggles submit button
        const agreeCheckbox = overlay.querySelector('#bf_agree');
        const submitBtn = overlay.querySelector('#borrowSubmitBtn');
        agreeCheckbox.addEventListener('change', () => {
          submitBtn.disabled = !agreeCheckbox.checked;
        });

        // Set min date to today (allow same-day return)
        overlay.querySelector('#bf_due').min = new Date().toISOString().split('T')[0];
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
        // Submit button stays disabled until agree checkbox is checked
        this.el.querySelector('#borrowSubmitBtn').disabled = true;
        this.el.querySelector('#borrowSubmitBtn').textContent = '確認借用';
        this.el.querySelector('#bf_agree').checked = false;

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
          due_date: this.el.querySelector('#bf_due').value,
          purpose: this.el.querySelector('#bf_purpose').value.trim(),
          notes: this.el.querySelector('#bf_notes').value.trim(),
        };

        const result = await BorrowAPI.borrow(data);

        if (result.success) {
          // Optimistic update
          OptimisticCache.set(data.item_id, {
            '狀態': '借出中',
            '借用人': data.borrower_name,
            '借出日期': new Date().toISOString().split('T')[0],
            '預計歸還日': data.due_date,
          });
          OptimisticCache.apply();

          // Close borrow modal + detail modal
          this.close();
          app.Modal.close();
          app.render();

          // Show centered success dialog
          showSuccessDialog({
            loanId: result.loan_id || '',
            itemName: data.item_name,
            location: data.location,
            dueDate: data.due_date,
          });
          return;
        } else {
          resultDiv.hidden = false;
          resultDiv.className = 'borrow-result error';
          resultDiv.textContent = result.message || '借用失敗';
          btn.disabled = false;
          btn.textContent = '確認借用';
        }
      },
    };

    // ═══ Return Item Picker — 列出可一起歸還的器材（含同套組成員）═══
    function renderReturnItemPicker(modalEl, currentItem) {
      const picker = modalEl.querySelector('#returnItemPicker');
      if (!picker) return;

      const currentId = (currentItem['編號'] || '').trim();
      const items = [{ item: currentItem, isCurrent: true, sameBundleAndBorrowed: false }];

      // 找同套組借出中的其他成員（讓管理員可一起勾起來歸還）
      if (window.__bundles) {
        const bundles = window.__bundles.getBundlesForItem(currentId);
        if (bundles && bundles.length > 0) {
          const seen = new Set([currentId]);
          for (const b of bundles) {
            for (const member of b.items) {
              const mid = (member.itemId || '').trim();
              if (seen.has(mid)) continue;
              seen.add(mid);
              const memberItem = app.state.rows.find(r => (r['編號'] || '').trim() === mid);
              if (!memberItem) continue;
              const status = (memberItem['狀態'] || '').trim();
              if (status === '借出中') {
                items.push({ item: memberItem, isCurrent: false, sameBundleAndBorrowed: true });
              }
            }
          }
        }
      }

      const hasBundle = items.length > 1;

      picker.innerHTML = `
        <div class="return-picker-header">
          <strong>選擇要歸還的器材</strong>
          ${hasBundle ? `<span class="return-picker-hint">同套組還有 ${items.length - 1} 件借出中，可勾選一起歸還</span>` : ''}
        </div>
        <div class="return-picker-list">
          ${items.map((it, idx) => {
            const item = it.item;
            return `
              <label class="return-item-row ${it.isCurrent ? 'is-current' : ''}">
                <input type="checkbox" data-item-id="${app.escapeHtml((item['編號']||'').trim())}" ${it.isCurrent ? 'checked' : ''} />
                <div class="return-item-info">
                  <div class="return-item-name">
                    ${app.escapeHtml(item['項目'] || '')}
                    ${it.isCurrent ? '<span class="bundle-current-tag">📍 你點選的</span>' : ''}
                  </div>
                  <div class="return-item-meta">
                    <span class="mono">${app.escapeHtml((item['編號']||'').trim())}</span>
                    <span class="bundle-status borrowed">借出中</span>
                    ${item['借用人'] ? `<span class="return-item-borrower">借用人：${app.escapeHtml(item['借用人'])}</span>` : ''}
                  </div>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      `;

      picker.addEventListener('change', (e) => {
        if (e.target.matches('input[type=checkbox]')) {
          updateReturnSubmitBtn(modalEl);
        }
      });
    }

    function updateReturnSubmitBtn(modalEl) {
      const checked = modalEl.querySelectorAll('.return-item-row input[type=checkbox]:checked').length;
      const btn = modalEl.querySelector('#returnSubmitBtn');
      if (!btn) return;
      btn.textContent = checked === 0 ? '請勾選器材' : (checked === 1 ? '確認歸還 1 件' : `確認歸還 ${checked} 件`);
      btn.disabled = checked === 0;
    }

    // ═══ Return Bundle Check — (legacy, kept for reference) ═══
    function renderReturnBundleCheck(modalEl, item) {
      // 移除舊的（防重複）
      const old = modalEl.querySelector('.return-bundle-check');
      if (old) old.remove();

      if (!window.__bundles) return;
      const itemId = (item['編號'] || '').trim();
      const bundles = window.__bundles.getBundlesForItem(itemId);
      if (!bundles || bundles.length === 0) return;

      const primary = bundles[0];
      const groupRows = primary.items;
      const anchor = primary.anchor;

      // 找每個成員的目前狀態
      const memberStatuses = groupRows.map(b => {
        const memberItem = app.state.rows.find(r => (r['編號'] || '').trim() === b.itemId);
        const status = memberItem ? ((memberItem['狀態'] || '可借用').trim() || '可借用') : '不存在';
        return {
          ...b,
          item: memberItem,
          status,
          isCurrent: b.itemId === itemId,
        };
      });

      // 計算未還件數（仍是借出中）
      const stillBorrowed = memberStatuses.filter(m => m.status === '借出中' && !m.isCurrent);
      const totalBorrowed = memberStatuses.filter(m => m.status === '借出中').length;

      const wrap = document.createElement('div');
      wrap.className = 'return-bundle-check';
      wrap.innerHTML = `
        <div class="return-bundle-title">
          🔍 套組歸還檢核
          <span class="return-bundle-anchor">${app.escapeHtml(anchor?.notes || primary.groupId)}</span>
        </div>
        <div class="return-bundle-summary">
          ${stillBorrowed.length === 0
            ? `<span class="check-ok">✅ 此套組其他配件都已歸還或未借出</span>`
            : `<span class="check-warn">⚠️ 此套組還有 <strong>${stillBorrowed.length}</strong> 件未還</span>`}
        </div>
        <ul class="return-bundle-list">
          ${memberStatuses.map(m => {
            const statusClass = {
              '可借用': 'available',
              '借出中': 'borrowed',
              '維修中': 'maintenance',
              '停用': 'disabled',
            }[m.status] || 'unknown';
            const tag = m.isCurrent ? '<span class="bundle-current-tag">📍 正在歸還</span>'
                      : m.status === '借出中' ? '<span class="check-pending">尚未歸還</span>'
                      : '';
            return `
              <li class="${m.isCurrent ? 'is-current' : ''}">
                <span class="return-bundle-role">${app.escapeHtml(m.role)}</span>
                <span class="return-bundle-name">${app.escapeHtml(m.item?.['項目'] || m.itemId)}</span>
                <span class="bundle-status ${statusClass}">${app.escapeHtml(m.status)}</span>
                ${tag}
              </li>`;
          }).join('')}
        </ul>
        ${stillBorrowed.length > 0
          ? `<div class="return-bundle-hint">💡 請提醒借用人一併歸還其他 ${stillBorrowed.length} 件器材</div>`
          : ''}
      `;

      // 插在 summary 之後
      const summary = modalEl.querySelector('#returnItemSummary');
      if (summary && summary.parentNode) {
        summary.parentNode.insertBefore(wrap, summary.nextSibling);
      }
    }

    // ═══ Bundle Borrow Modal (批次借用多件) ════════════
    const BundleBorrow = {
      el: null,
      items: [],
      groupId: '',

      init() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay borrow-modal-overlay';
        overlay.id = 'bundleBorrowModal';
        overlay.setAttribute('hidden', '');
        overlay.innerHTML = `
          <div class="modal-content borrow-modal-content">
            <button class="modal-close borrow-close" aria-label="關閉">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div class="borrow-form-wrap">
              <h2 class="borrow-form-title">批次借用申請</h2>
              <div class="bundle-summary" id="bundleBorrowList"></div>
              <form id="bundleBorrowForm" class="borrow-form">
                <div class="form-group">
                  <label for="bbf_name">借用人姓名 <span class="required">*</span></label>
                  <input type="text" id="bbf_name" required placeholder="你的名字" />
                </div>
                <div class="form-group">
                  <label for="bbf_dept">部門 / 組別 <span class="required">*</span></label>
                  <select id="bbf_dept" required>
                    <option value="">請選擇部門</option>
                    <option value="FO">FO</option>
                    <option value="CT">CT</option>
                    <option value="MKT">MKT</option>
                    <option value="BD">BD</option>
                    <option value="J/R">J/R</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="bbf_due">預計歸還日期 <span class="required">*</span></label>
                  <input type="date" id="bbf_due" required />
                </div>
                <div class="form-group">
                  <label for="bbf_purpose">用途</label>
                  <input type="text" id="bbf_purpose" placeholder="例如：外拍、直播" />
                </div>
                <div class="form-group">
                  <label for="bbf_notes">備註</label>
                  <textarea id="bbf_notes" rows="2" placeholder="其他備註"></textarea>
                </div>
                <div class="borrow-rules">
                  <div class="borrow-rules-title">📋 借用前請確認</div>
                  <ul class="borrow-rules-list">
                    <li>器材歸還時須交給管理員（Kessy）檢查並協助歸位</li>
                    <li>使用中如遇故障或缺件，請立即聯絡 Kessy 處理</li>
                    <li>請於預計歸還日前完成歸還，逾期將影響後續借用</li>
                    <li>器材限公務使用，不得私人外借或轉借他人</li>
                  </ul>
                  <label class="borrow-agree">
                    <input type="checkbox" id="bbf_agree" required />
                    <span>我已閱讀並同意以上規則</span>
                  </label>
                </div>
                <div class="borrow-form-actions">
                  <button type="button" class="btn-cancel" id="bundleBorrowCancelBtn">取消</button>
                  <button type="submit" class="btn-submit" id="bundleBorrowSubmitBtn" disabled>確認借用</button>
                </div>
                <div class="borrow-result" id="bundleBorrowResult" hidden></div>
              </form>
            </div>
          </div>`;
        document.body.appendChild(overlay);
        this.el = overlay;

        overlay.querySelector('.borrow-close').addEventListener('click', () => this.close());
        overlay.querySelector('#bundleBorrowCancelBtn').addEventListener('click', () => this.close());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
        overlay.querySelector('#bundleBorrowForm').addEventListener('submit', (e) => {
          e.preventDefault();
          this.submit();
        });

        const agree = overlay.querySelector('#bbf_agree');
        const submitBtn = overlay.querySelector('#bundleBorrowSubmitBtn');
        agree.addEventListener('change', () => { submitBtn.disabled = !agree.checked; });

        // Allow same-day return
        overlay.querySelector('#bbf_due').min = new Date().toISOString().split('T')[0];
      },

      open(items, groupId) {
        this.items = items;
        this.groupId = groupId;
        const list = this.el.querySelector('#bundleBorrowList');
        list.innerHTML = `
          <div class="bundle-summary-title">📋 即將借出 <strong>${items.length}</strong> 件器材</div>
          <div class="bundle-summary-cards">
            ${items.map((it, i) => `
              <div class="bundle-summary-card">
                <span class="bundle-summary-num">${i + 1}</span>
                <div class="bundle-summary-info">
                  <div class="bundle-summary-name">${app.escapeHtml(it['項目'] || '')}</div>
                  <div class="bundle-summary-meta">
                    <span class="mono">${app.escapeHtml((it['編號'] || '').trim())}</span>
                    <span class="bundle-summary-loc">📍 ${app.escapeHtml(it['位置'] || '')}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
        this.el.querySelector('#bundleBorrowForm').reset();
        this.el.querySelector('#bundleBorrowResult').hidden = true;
        this.el.querySelector('#bundleBorrowSubmitBtn').disabled = true;
        this.el.querySelector('#bundleBorrowSubmitBtn').textContent = '確認借用';
        this.el.querySelector('#bbf_agree').checked = false;
        this.el.classList.add('is-open');
        this.el.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
      },

      close() {
        this.el.classList.remove('is-open');
        document.body.style.overflow = '';
        setTimeout(() => {
          if (!this.el.classList.contains('is-open')) this.el.setAttribute('hidden', '');
        }, 250);
      },

      async submit() {
        const btn = this.el.querySelector('#bundleBorrowSubmitBtn');
        const resultDiv = this.el.querySelector('#bundleBorrowResult');
        btn.disabled = true;
        btn.textContent = `送出中... (0/${this.items.length})`;
        resultDiv.hidden = true;

        const baseData = {
          borrower_name: this.el.querySelector('#bbf_name').value.trim(),
          department: this.el.querySelector('#bbf_dept').value.trim(),
          due_date: this.el.querySelector('#bbf_due').value,
          purpose: this.el.querySelector('#bbf_purpose').value.trim(),
          notes: this.el.querySelector('#bbf_notes').value.trim(),
          bundle_id: this.groupId + '-' + Date.now(),
        };

        const successList = [];
        const failList = [];

        for (let i = 0; i < this.items.length; i++) {
          const item = this.items[i];
          btn.textContent = `送出中... (${i + 1}/${this.items.length})`;
          const data = {
            ...baseData,
            item_id: (item['編號'] || '').trim(),
            item_name: item['項目'] || '',
            category: item['類別'] || '',
            location: item['位置'] || '',
          };
          const result = await BorrowAPI.borrow(data);
          if (result.success) {
            successList.push({ item, loanId: result.loan_id });
            OptimisticCache.set(data.item_id, {
              '狀態': '借出中',
              '借用人': data.borrower_name,
              '借出日期': new Date().toISOString().split('T')[0],
              '預計歸還日': data.due_date,
            });
          } else {
            failList.push({ item, message: result.message });
          }
        }

        OptimisticCache.apply();
        app.Modal.close();
        app.render();

        if (failList.length === 0) {
          this.close();
          showBundleSuccessDialog({
            count: successList.length,
            items: successList.map(s => s.item),
            location: this.items[0]?.['位置'] || '',
            dueDate: baseData.due_date,
          });
        } else {
          resultDiv.hidden = false;
          resultDiv.className = 'borrow-result error';
          resultDiv.innerHTML = `
            <strong>部分失敗</strong><br>
            成功 ${successList.length} 件 / 失敗 ${failList.length} 件<br>
            失敗：${failList.map(f => app.escapeHtml((f.item['項目'] || '') + ' (' + f.message + ')')).join('<br>')}
          `;
          btn.disabled = false;
          btn.textContent = '關閉';
          btn.onclick = () => this.close();
        }
      },
    };

    // 在 init 階段建立 modal，並掛到 window 給 bundles.js 用
    BundleBorrow.init();
    window.__bundleBorrow = BundleBorrow;

    // ═══ Bundle Success Dialog ════════════════════════
    function showBundleSuccessDialog({ count, items, location, dueDate }) {
      let dialog = document.getElementById('bundleSuccessDialog');
      if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = 'bundleSuccessDialog';
        dialog.className = 'success-dialog-overlay';
        dialog.innerHTML = `
          <div class="success-dialog">
            <div class="success-dialog-icon">✅</div>
            <h3 class="success-dialog-title">批次借用成功！</h3>
            <div class="success-dialog-body" id="bundleSuccessBody"></div>
            <div class="success-dialog-note" id="bundleSuccessNote"></div>
            <button type="button" class="success-dialog-btn" id="bundleSuccessOk">確定</button>
          </div>`;
        document.body.appendChild(dialog);
        const close = () => {
          dialog.classList.remove('is-open');
          document.body.style.overflow = '';
        };
        dialog.querySelector('#bundleSuccessOk').addEventListener('click', close);
        dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && dialog.classList.contains('is-open')) close();
        });
      }
      dialog.querySelector('#bundleSuccessBody').innerHTML = `
        <div class="success-row"><span class="success-label">借出件數</span><span><strong>${count}</strong> 件</span></div>
        <div class="success-row"><span class="success-label">取用位置</span><span>${app.escapeHtml(location)}</span></div>
        <div class="success-row"><span class="success-label">預計歸還</span><span>${app.escapeHtml(dueDate)}</span></div>
      `;
      dialog.querySelector('#bundleSuccessNote').innerHTML = `
        📍 請至上述位置取用全部 ${count} 件器材<br>
        🔄 歸還時請聯絡 <strong>Kessy</strong> 統一檢查並協助歸位
      `;
      dialog.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    // ═══ Centered Success Dialog ═══════════════════════
    function showSuccessDialog({ loanId, itemName, location, dueDate }) {
      let dialog = document.getElementById('borrowSuccessDialog');
      if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = 'borrowSuccessDialog';
        dialog.className = 'success-dialog-overlay';
        dialog.innerHTML = `
          <div class="success-dialog">
            <div class="success-dialog-icon">✅</div>
            <h3 class="success-dialog-title">借用成功！</h3>
            <div class="success-dialog-body" id="successDialogBody"></div>
            <div class="success-dialog-note" id="successDialogNote"></div>
            <button type="button" class="success-dialog-btn" id="successDialogOk">確定</button>
          </div>`;
        document.body.appendChild(dialog);

        const okBtn = dialog.querySelector('#successDialogOk');
        const close = () => {
          dialog.classList.remove('is-open');
          document.body.style.overflow = '';
        };
        okBtn.addEventListener('click', close);
        dialog.addEventListener('click', (e) => {
          if (e.target === dialog) close();
        });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && dialog.classList.contains('is-open')) close();
        });
      }

      dialog.querySelector('#successDialogBody').innerHTML = `
        <div class="success-row"><span class="success-label">借用單號</span><span class="mono">${app.escapeHtml(loanId)}</span></div>
        <div class="success-row"><span class="success-label">器材</span><span>${app.escapeHtml(itemName)}</span></div>
        <div class="success-row"><span class="success-label">取用位置</span><span>${app.escapeHtml(location)}</span></div>
        <div class="success-row"><span class="success-label">預計歸還</span><span>${app.escapeHtml(dueDate)}</span></div>
      `;
      dialog.querySelector('#successDialogNote').innerHTML = `
        📍 請至上述位置取用<br>
        🔄 歸還時請聯絡 <strong>Kessy</strong> 檢查並協助歸位
      `;

      dialog.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

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
              <div id="returnItemPicker" class="return-item-picker"></div>
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

        // 渲染可勾選的項目列表（包含當前項目 + 同套組借出中的其他成員）
        renderReturnItemPicker(this.el, item);

        this.el.querySelector('#returnForm').reset();
        this.el.querySelector('#returnResult').hidden = true;
        this.el.querySelector('#returnSubmitBtn').disabled = false;

        // 重設 radio defaults (true)
        ['rf_appearance', 'rf_function', 'rf_accessories', 'rf_storage'].forEach(name => {
          const el = this.el.querySelector(`input[name="${name}"][value="true"]`);
          if (el) el.checked = true;
        });

        updateReturnSubmitBtn(this.el);

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

        // 取得所有勾選的項目
        const checked = Array.from(this.el.querySelectorAll('.return-item-row input[type=checkbox]:checked'));
        const itemIds = checked.map(cb => cb.dataset.itemId).filter(Boolean);
        if (itemIds.length === 0) {
          resultDiv.hidden = false;
          resultDiv.className = 'borrow-result error';
          resultDiv.textContent = '請至少勾選一件器材';
          return;
        }

        btn.disabled = true;
        resultDiv.hidden = true;

        const getRadio = (name) => this.el.querySelector(`input[name="${name}"]:checked`)?.value === 'true';
        const appearance = getRadio('rf_appearance');
        const func = getRadio('rf_function');
        const accessories = getRadio('rf_accessories');
        const storage = getRadio('rf_storage');
        const allOk = appearance && func && accessories && storage;
        const result = allOk ? '正常' : ((!accessories) ? '缺件' : '損壞');
        const damageNote = this.el.querySelector('#rf_damage').value.trim();

        const successList = [];
        const failList = [];

        for (let i = 0; i < itemIds.length; i++) {
          btn.textContent = `處理中... (${i + 1}/${itemIds.length})`;
          const data = {
            item_id: itemIds[i],
            checker: '管理者',
            appearance_ok: appearance,
            function_ok: func,
            accessories_ok: accessories,
            storage_ok: storage,
            damage_note: damageNote,
            result,
          };
          const apiResult = await BorrowAPI.return_(data);
          if (apiResult.success) {
            successList.push(itemIds[i]);
            OptimisticCache.set(itemIds[i], {
              '狀態': allOk ? '可借用' : '維修中',
              '借用人': '',
              '借出日期': '',
              '預計歸還日': '',
            });
          } else {
            failList.push({ id: itemIds[i], message: apiResult.message });
          }
        }

        OptimisticCache.apply();
        app.Modal.close();
        app.render();

        resultDiv.hidden = false;
        if (failList.length === 0) {
          resultDiv.className = 'borrow-result success';
          resultDiv.innerHTML = `<strong>✅ 歸還處理完成！</strong><br>共處理 ${successList.length} 件器材`;
          setTimeout(() => this.close(), 2000);
        } else {
          resultDiv.className = 'borrow-result error';
          resultDiv.innerHTML = `
            <strong>部分失敗</strong><br>
            成功 ${successList.length} 件 / 失敗 ${failList.length} 件<br>
            ${failList.map(f => `${app.escapeHtml(f.id)}: ${app.escapeHtml(f.message)}`).join('<br>')}
          `;
          btn.disabled = false;
          btn.textContent = '關閉';
          btn.onclick = () => this.close();
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
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              我要借用
            </button>`;
          area.querySelector('.btn-borrow').addEventListener('click', () => {
            BorrowModal.open(item);
          });
        } else if (status === '借出中') {
          // 借出中 → 顯示狀態 + 管理員可歸還
          const borrower = item['借用人'] || '';
          const lendDate = item['借出日期'] || '';
          const dueDate = item['預計歸還日'] || '';
          let html = `
            <div class="borrow-status-badge borrowed">
              <span class="status-dot" style="background:#d97706"></span>
              <strong>借出中</strong>${borrower ? ' — ' + app.escapeHtml(borrower) : ''}
              ${lendDate ? '<br><small>借出日：' + app.escapeHtml(lendDate.substring(0,10)) + '</small>' : ''}
              ${dueDate ? '<br><small>預計歸還：' + app.escapeHtml(dueDate.substring(0,10)) + '</small>' : ''}
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
              <span class="status-dot" style="background:#b91c1c"></span>
              <strong>維修中</strong> — 暫不可借用
            </div>`;
        } else if (status === '停用') {
          area.innerHTML = `
            <div class="borrow-status-badge disabled">
              <span class="status-dot" style="background:#9ca3af"></span>
              <strong>已停用</strong> — 不開放外借
            </div>`;
        }

        // Always add "回報問題" link (Telegram contact)
        const reportLink = document.createElement('a');
        reportLink.className = 'btn-report-issue';
        reportLink.href = 'https://t.me/cheunghy305';
        reportLink.target = '_blank';
        reportLink.rel = 'noopener noreferrer';
        reportLink.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          回報問題 / 損壞 / 缺件 → Telegram 聯絡 Kessy
        `;
        area.appendChild(reportLink);

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

      // 暴露給 bundles.js 用
      window.__borrowModal = BorrowModal;
      window.__returnModal = ReturnModal;

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
