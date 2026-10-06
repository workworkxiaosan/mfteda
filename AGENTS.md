# MFTEDA 官網（mfteda.org）

澳門財經科技與教育發展學會官方網站，靜態多語言站（繁中/简中/en/pt），托管於 GitHub Pages，域名 DNS 在 Hostinger。

## 結構

- `content.json` — 全部網站內容的唯一母本（4 語言、研究洞察文章、焦點卡片、夥伴鏈接）。**更新內容只改這裡**。
- `make_content.py` — 由 `.scrape/i18n.json` 等生成 `content.json` 的腳本（一次性遷移用，平時不用跑）。
- `build.py` — 讀 `content.json` 生成 32 個靜態頁面到 `dist/`（含 `dist/CNAME`）。語言目錄：繁中在根目錄，其他在 `zh-CN/`、`en/`、`pt/`。
- `assets/` — 源頭樣式/腳本/圖片，`build.py` 會拷貝進 `dist/`。圖片一律用 webp（已壓縮）；`og-cover.jpg` 是社交分享圖（1200×630）。
- `dist/` — 生成物，**不要手改**，已被 .gitignore 忽略。除 32 個頁面外還自動生成 `robots.txt`、`sitemap.xml`（含 4 語言 hreflang）、`404.html`。
- `.scrape/` — 原 Hostinger Horizons 站點的抓取備份（原站已下線前的參考資料）。

## 更新流程

1. 改 `content.json`（加洞察文章 = 在 `insights` 數組加一條，4 語言都填）。
2. `python3 build.py`。
3. `git add -A && git commit -m "..." && git push`。
4. GitHub Actions 自動構建部署（`.github/workflows/deploy.yml`），約 1 分鐘後線上生效。

## 關鍵事實

- 每頁自動帶 canonical / Open Graph / Twitter Card 標籤（分享圖 `assets/img/og-cover.jpg`），首頁帶 Organization JSON-LD。`content.json` 的 `site_url` 是絕對 URL 的基準，換域名時改它。
- 域名 `mfteda.org`：A 記錄指向 GitHub Pages（185.199.108.153/109.153/110.153/111.153），`www` CNAME → `workworkxiaosan.github.io`；DNS 在 Hostinger hPanel 管理。
- GitHub 倉庫：`workworkxiaosan/mfteda`（本機 gh CLI 已登錄 workworkxiaosan）。
- 默認語言繁中在根路徑（如 `/about.html`），與原站 URL 一致。
- 出版物「在線閱讀/下載PDF」按鈕目前是佔位（`#`），拿到真實 PDF 後放到 `dist` 對應位置並在 `build.py` 的 `render_publications` 中替換鏈接。
- 社交鏈接（FB/LinkedIn/Twitter）在 `content.json` 的 `social` 字段，目前是 `#`。
- 聯繫表單為前端演示（原站如此），未接後端；如需真正收集留言可接 Formspree 等服務。
- 原站遺留問題已修復：社區篇/副刊封面對調、關於我們「。。」雙句號、/mission 空路由。
