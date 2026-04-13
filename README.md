# 器材檢索表

團隊器材庫存查詢工具，資料來源為 Google Sheets，透過 GitHub Actions 自動同步。

**線上版本**：https://kessycheung.github.io/inventory-lookup/

---

## 功能

- **分類瀏覽**：依器材類別（相機、燈光、收音等）分頁查看
- **位置瀏覽**：依收納位置分頁，適合站在櫃子前快速查看內容物
- **全部列表**：一次顯示所有器材
- **關鍵字搜尋**：跨欄位模糊搜尋
- **位置篩選 / 排序**：依編號、項目、位置排序
- **設備詳情彈窗**：點擊卡片查看設備圖片與完整資訊
- **響應式設計**：桌面、平板、手機皆可使用

## 資料流程

```
Google Sheets  →  GitHub Actions (每30分鐘)  →  data.csv  →  GitHub Pages 前端
```

1. 原始資料在 Google Sheets 維護
2. GitHub Actions 定時抓取 CSV 並 commit 到 repo
3. GitHub Pages 前端讀取 repo 內的 `data.csv`

## 如何更新資料

直接編輯 Google Sheets，GitHub Actions 會在 30 分鐘內自動同步。
也可手動觸發 workflow：repo → Actions → `sync-sheet` → Run workflow。

## 如何新增設備圖片

1. 準備圖片（建議 800px 寬以內，JPEG，< 100KB）
2. 以設備**編號**命名，例如 `BT-M-cam-001-01.jpg`
3. 放入 `images/` 資料夾
4. Commit & push，網站會自動顯示

沒有圖片的設備會顯示類別示意圖作為預設。

## 檔案結構

```
├── index.html                    # HTML 結構
├── style.css                     # 樣式
├── script.js                     # 應用邏輯
├── data.csv                      # 器材資料（自動同步）
├── images/
│   ├── placeholder.svg           # 預設佔位圖
│   └── categories/               # 類別示意圖
│       ├── camera.svg
│       ├── adapter.svg
│       ├── lighting.svg
│       ├── audio.svg
│       ├── accessory.svg
│       ├── mount.svg
│       └── default.svg
├── .github/workflows/
│   └── sync-sheet.yml            # Google Sheets 同步 workflow
└── README.md
```

## CSV 欄位

目前欄位：`類別`、`編號`、`項目`、`位置`

前端支援自動擴充。未來在 Google Sheets 加入新欄位（如 `狀態`、`借用人`、`備註` 等），前端會自動讀取並在詳情彈窗中顯示，無需修改程式碼。

## 本地開發

由於瀏覽器 CORS 限制，直接開啟 `index.html` 無法讀取 CSV。請用 local server：

```bash
cd inventory-lookup
python3 -m http.server 8000
# 然後打開 http://localhost:8000
```
