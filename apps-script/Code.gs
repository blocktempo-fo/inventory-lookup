/**
 * 器材借用系統 — Google Apps Script 後端
 *
 * 部署方式：
 * 1. 在 Google Sheets 中打開「擴充功能 → Apps Script」
 * 2. 貼上此程式碼
 * 3. 部署 → 新增部署 → Web 應用程式
 *    - 執行身分：我自己
 *    - 存取權限：任何人
 * 4. 複製部署 URL，貼到 borrow.js 的 APPS_SCRIPT_URL
 */

// ═══ 設定 ═══════════════════════════════════════════
var SPREADSHEET_ID = '1uQ2i6pbZY-aykeNduv7HtxS1-hl2zL-mKdEjB5gEq-s';
var MAIN_SHEET_NAME = '檢索總表';
var LOANS_SHEET_NAME = '借用紀錄';
var RETURN_SHEET_NAME = '歸還檢核';

// ═══ 路由入口 ═══════════════════════════════════════

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    switch (data.action) {
      case 'borrow':
        return jsonResponse(handleBorrow(data));
      case 'return':
        return jsonResponse(handleReturn(data));
      default:
        return jsonResponse({ success: false, message: '未知操作: ' + data.action });
    }
  } catch (err) {
    return jsonResponse({ success: false, message: '伺服器錯誤: ' + err.message });
  }
}

function doGet(e) {
  try {
    const action = (e.parameter || {}).action;

    if (action === 'status') {
      const itemId = e.parameter.itemId;
      if (!itemId) return jsonResponse({ success: false, message: '缺少 itemId' });
      return jsonResponse(getItemStatus(itemId));
    }

    if (action === 'active_loans') {
      return jsonResponse(getActiveLoans());
    }

    return jsonResponse({ success: true, message: '器材借用系統 API 運作中' });
  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

// ═══ 借用邏輯 ═══════════════════════════════════════

function handleBorrow(data) {
  // 1. 驗證必填欄位
  if (!data.item_id) return { success: false, message: '缺少器材編號' };
  if (!data.borrower_name) return { success: false, message: '請填寫借用人姓名' };
  if (!data.due_date) return { success: false, message: '請填寫預計歸還日期' };

  // 2. 取得鎖，防止併發借用同一器材
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return { success: false, message: '系統忙碌中，請稍後再試' };
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    if (!mainSheet) return { success: false, message: '找不到主表: ' + MAIN_SHEET_NAME };

    const headerMap = getHeaderMap(mainSheet);

    // 3. 找到器材行
    const rowIndex = findRowByColumnValue(mainSheet, headerMap, '編號', data.item_id);
    if (rowIndex === -1) return { success: false, message: '找不到器材: ' + data.item_id };

    // 4. 檢查是否可借用
    const currentStatus = getCellValue(mainSheet, rowIndex, headerMap['狀態']);
    if (currentStatus && currentStatus !== '可借用') {
      return { success: false, message: '此器材目前不可借用（狀態: ' + currentStatus + '）' };
    }

    // 5. 生成借用單號
    const loanId = generateLoanId(ss);
    const now = new Date();
    const nowStr = formatDateTime(now);
    const todayStr = formatDate(now);

    // 6. 寫入 Loans_Log
    const loansSheet = ss.getSheetByName(LOANS_SHEET_NAME);
    if (!loansSheet) return { success: false, message: '找不到 Loans_Log 工作表' };

    const itemName = getCellValue(mainSheet, rowIndex, headerMap['項目']) || '';
    const category = getCellValue(mainSheet, rowIndex, headerMap['類別']) || '';
    const location = getCellValue(mainSheet, rowIndex, headerMap['位置']) || '';

    loansSheet.appendRow([
      loanId,
      data.item_id,
      itemName,
      category,
      location,
      data.borrower_name,
      data.department || '',
      data.purpose || '',
      data.notes || '',
      todayStr,
      data.due_date,
      '',          // 實際歸還日（空）
      '借出中',    // 狀態
      '',          // 歸還檢查結果
      '',          // 歸還檢查時間
      ''           // 歸還備註
    ]);

    // 7. 更新主表
    updateRowByMap(mainSheet, rowIndex, headerMap, {
      '狀態': '借出中',
      '借用人': data.borrower_name,
      '借出日期': todayStr,
      '預計歸還日': data.due_date,
      '備註': data.purpose || '',
      '最後更新時間': nowStr,
    });

    return {
      success: true,
      loan_id: loanId,
      message: '借用成功！借用單號: ' + loanId,
    };

  } finally {
    lock.releaseLock();
  }
}

// ═══ 歸還邏輯 ═══════════════════════════════════════

function handleReturn(data) {
  // 1. 驗證必填
  if (!data.item_id && !data.loan_id) return { success: false, message: '缺少器材編號或借用單號' };
  if (!data.result) return { success: false, message: '請選擇檢查結果' };

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return { success: false, message: '系統忙碌中，請稍後再試' };
  }

  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // 2. 找 Loans_Log 紀錄（用 loan_id 或用 item_id 找借出中的）
    var loansSheet = ss.getSheetByName(LOANS_SHEET_NAME);
    if (!loansSheet) return { success: false, message: '找不到借用紀錄工作表' };

    var loansHeaderMap = getHeaderMap(loansSheet);
    var loanRowIndex = -1;

    if (data.loan_id) {
      loanRowIndex = findRowByColumnValue(loansSheet, loansHeaderMap, 'loan_id', data.loan_id);
    } else {
      // 用 item_id 找最新一筆「借出中」的紀錄
      var loansData = loansSheet.getDataRange().getValues();
      var idCol = loansHeaderMap['編號'];
      var statusCol = loansHeaderMap['狀態'];
      for (var i = loansData.length - 1; i >= 1; i--) {
        if (String(loansData[i][idCol]).trim() === String(data.item_id).trim() &&
            String(loansData[i][statusCol]).trim() === '借出中') {
          loanRowIndex = i + 1;
          break;
        }
      }
    }

    if (loanRowIndex === -1) return { success: false, message: '找不到該器材的借出紀錄' };

    var loanStatus = getCellValue(loansSheet, loanRowIndex, loansHeaderMap['狀態']);
    if (loanStatus !== '借出中') {
      return { success: false, message: '此器材目前不是借出中狀態' };
    }

    // 3. 取得器材資訊
    var itemId = data.item_id || getCellValue(loansSheet, loanRowIndex, loansHeaderMap['編號']);
    var itemName = getCellValue(loansSheet, loanRowIndex, loansHeaderMap['項目']);
    var loanId = getCellValue(loansSheet, loanRowIndex, loansHeaderMap['loan_id']);

    const now = new Date();
    const nowStr = formatDateTime(now);
    const todayStr = formatDate(now);

    // 4. 寫入 Return_Checklist
    const returnSheet = ss.getSheetByName(RETURN_SHEET_NAME);
    if (!returnSheet) return { success: false, message: '找不到 Return_Checklist 工作表' };

    returnSheet.appendRow([
      loanId || data.loan_id || '',
      itemId,
      itemName,
      nowStr,
      data.appearance_ok !== false ? '✓' : '✗',
      data.function_ok !== false ? '✓' : '✗',
      data.accessories_ok !== false ? '✓' : '✗',
      data.storage_ok !== false ? '✓' : '✗',
      data.damage_note || '',
      data.result,
    ]);

    // 5. 更新 Loans_Log
    const newLoanStatus = (data.result === '正常') ? '已歸還' : '異常';
    updateRowByMap(loansSheet, loanRowIndex, loansHeaderMap, {
      '實際歸還日': todayStr,
      '狀態': newLoanStatus,
      '歸還檢查結果': data.result,
      '歸還檢查時間': nowStr,
      '歸還備註': data.damage_note || '',
    });

    // 6. 更新主表
    const mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    if (mainSheet) {
      const mainHeaderMap = getHeaderMap(mainSheet);
      const mainRowIndex = findRowByColumnValue(mainSheet, mainHeaderMap, '編號', itemId);

      if (mainRowIndex !== -1) {
        if (data.result === '正常') {
          updateRowByMap(mainSheet, mainRowIndex, mainHeaderMap, {
            '狀態': '可借用',
            '借用人': '',
            '借出日期': '',
            '預計歸還日': '',
            '備註': '',
            '最後更新時間': nowStr,
          });
        } else {
          // 異常情況：標記為維修中
          updateRowByMap(mainSheet, mainRowIndex, mainHeaderMap, {
            '狀態': '維修中',
            '借用人': '',
            '借出日期': '',
            '預計歸還日': '',
            '備註': '歸還檢查異常: ' + data.result + ' — ' + (data.damage_note || ''),
            '最後更新時間': nowStr,
          });
        }
      }
    }

    return {
      success: true,
      message: '歸還處理完成！檢查結果: ' + data.result,
    };

  } finally {
    lock.releaseLock();
  }
}

// ═══ 查詢邏輯 ═══════════════════════════════════════

function getItemStatus(itemId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
  const headerMap = getHeaderMap(mainSheet);
  const rowIndex = findRowByColumnValue(mainSheet, headerMap, '編號', itemId);

  if (rowIndex === -1) return { success: false, message: '找不到器材' };

  return {
    success: true,
    status: getCellValue(mainSheet, rowIndex, headerMap['狀態']) || '可借用',
    borrower: getCellValue(mainSheet, rowIndex, headerMap['借用人']) || '',
    due_date: getCellValue(mainSheet, rowIndex, headerMap['預計歸還日']) || '',
    loan_id: getCellValue(mainSheet, rowIndex, headerMap['loan_id']) || '',
  };
}

function getActiveLoans() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const loansSheet = ss.getSheetByName(LOANS_SHEET_NAME);
  if (!loansSheet) return { success: false, message: '找不到 Loans_Log' };

  const headerMap = getHeaderMap(loansSheet);
  const data = loansSheet.getDataRange().getValues();
  const loans = [];

  for (let i = 1; i < data.length; i++) {
    const statusCol = headerMap['狀態'];
    if (statusCol !== undefined && data[i][statusCol] === '借出中') {
      const row = {};
      for (const [key, col] of Object.entries(headerMap)) {
        row[key] = data[i][col] || '';
      }
      loans.push(row);
    }
  }

  return { success: true, loans: loans };
}

// ═══ 工具函式 ═══════════════════════════════════════

/**
 * 取得工作表的表頭→欄號對應 (0-based)
 */
function getHeaderMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i]).trim();
    if (h) map[h] = i;
  }
  return map;
}

/**
 * 用欄位名稱找行（回傳 1-based 行號，找不到回傳 -1）
 */
function findRowByColumnValue(sheet, headerMap, colName, value) {
  const colIndex = headerMap[colName];
  if (colIndex === undefined) return -1;

  const data = sheet.getDataRange().getValues();
  const searchValue = String(value).trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]).trim() === searchValue) {
      return i + 1; // 1-based row number
    }
  }
  return -1;
}

/**
 * 取得儲存格值
 */
function getCellValue(sheet, rowIndex, colIndex) {
  if (colIndex === undefined || rowIndex < 1) return '';
  return String(sheet.getRange(rowIndex, colIndex + 1).getValue()).trim();
}

/**
 * 按欄位名稱更新指定行的多個欄位
 */
function updateRowByMap(sheet, rowIndex, headerMap, updates) {
  for (const [colName, value] of Object.entries(updates)) {
    const colIndex = headerMap[colName];
    if (colIndex !== undefined) {
      sheet.getRange(rowIndex, colIndex + 1).setValue(value);
    }
  }
}

/**
 * 生成借用單號：LOAN-YYYYMMDD-NNN
 */
function generateLoanId(ss) {
  const today = new Date();
  const dateStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyyMMdd');
  const prefix = 'LOAN-' + dateStr + '-';

  const loansSheet = ss.getSheetByName(LOANS_SHEET_NAME);
  if (!loansSheet || loansSheet.getLastRow() <= 1) {
    return prefix + '001';
  }

  // 找今天最大的序號
  const data = loansSheet.getDataRange().getValues();
  let maxSeq = 0;

  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][0]);
    if (id.startsWith(prefix)) {
      const seq = parseInt(id.substring(prefix.length), 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return prefix + nextSeq;
}

/**
 * 格式化日期：YYYY-MM-DD
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * 格式化日期時間：YYYY-MM-DD HH:mm
 */
function formatDateTime(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
}

/**
 * 統一 JSON 回應格式
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
