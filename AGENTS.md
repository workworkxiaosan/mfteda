# MFTEDA 官網（mfteda.org）

澳門財經科技與教育發展學會官方網站，靜態多語言站（繁中/简中/en/pt），托管於 GitHub Pages，域名 DNS 在 Hostinger。

## 結構

- `content.json` — 全部網站內容的唯一母本（4 語言、研究洞察文章、焦點卡片、夥伴鏈接）。**更新內容只改這裡**。
- `make_content.py` — 由 `.scrape/i18n.json` 等生成 `content.json` 的腳本（一次性遷移用，平時不用跑）。
- `build.py` — 讀 `content.json` 生成 36 個靜態頁面到 `dist/`（含 `dist/CNAME`）。語言目錄：繁中在根目錄，其他在 `zh-CN/`、`en/`、`pt/`。
- `assets/` — 源頭樣式/腳本/圖片，`build.py` 會拷貝進 `dist/`。圖片一律用 webp（已壓縮）；`og-cover.jpg` 是社交分享圖（1200×630）。
- `dist/` — 生成物，**不要手改**，已被 .gitignore 忽略。除 36 個頁面外還自動生成 `robots.txt`、`sitemap.xml`（含 4 語言 hreflang）、`404.html`。
- `.scrape/` — 原 Hostinger Horizons 站點的抓取備份（原站已下線前的參考資料）。

## 更新流程

1. 改 `content.json`（加洞察/新聞文章 = 在 `insights` 數組加一條，4 語言都填；若帶 `slug` 和 `body`（每語言是段落數組），會自動生成詳情頁 `insights/{slug}.html`，列表「閱讀更多」自動連到該頁；配圖放 `assets/img/news/` 並設 `image` 字段）。
2. `python3 build.py`。
3. `git add -A && git commit -m "..." && git push`。
4. GitHub Actions 自動構建部署（`.github/workflows/deploy.yml`），約 1 分鐘後線上生效。

## 關鍵事實

- 頁面共 9 個（`PAGES`）：index/about/research/projects/publications/insights/partners/policy/contact。「招商政策」頁（policy）內容在 `content.json` 的 `policies` 數組（region: macao/hengqin，每項含 year、title/summary 4語言、url），更新政策只改這裡；導航鍵 `nav.policy` 由 `make_content.py` 注入 i18n。
- 合作夥伴更名記錄（2026-10）：partner2「澳門貿易投資促進局」→「招商投資促進局」（en: Commerce and Investment Promotion Institute，IPIM 縮寫沿用，鏈接不變）；partner5「澳門聖若瑟大學」→「聖若瑟大學」（法定名不含「澳門」）；partner8 澳門直播協會 href 改為官方 Facebook（https://www.facebook.com/MacauLiveAssociation/，官網域名已失效）。

- 每頁自動帶 canonical / Open Graph / Twitter Card 標籤（分享圖 `assets/img/og-cover.jpg`），首頁帶 Organization JSON-LD。`content.json` 的 `site_url` 是絕對 URL 的基準，換域名時改它。
- 域名 `mfteda.org`：A 記錄指向 GitHub Pages（185.199.108.153/109.153/110.153/111.153），`www` CNAME → `workworkxiaosan.github.io`；DNS 在 Hostinger hPanel 管理。
- GitHub 倉庫：`workworkxiaosan/mfteda`（本機 gh CLI 已登錄 workworkxiaosan）。
- 默認語言繁中在根路徑（如 `/about.html`），與原站 URL 一致。
- 出版物 PDF 已上線：`assets/pdf/book-*.pdf`（4 本稅法讀本，約 70MB），「在線閱讀」新標籤頁打開，「下載PDF」直接下載。要替換版本只需覆蓋同名文件。
- 社交鏈接（FB/LinkedIn/Twitter）在 `content.json` 的 `social` 字段，目前是 `#`。
- 聯繫表單為前端演示（原站如此），未接後端；如需真正收集留言可接 Formspree 等服務。
- 原站遺留問題已修復：社區篇/副刊封面對調、關於我們「。。」雙句號、/mission 空路由。
- 繁簡校對規範（2026-10）：繁體用港澳寫法——「平台/了解/群體/臨床/港澳台」的 台/了/群/床 均為正字（OpenCC s2t 會誤報為臺/瞭/羣/牀）；機構名按語言版本書寫（zh-CN 頁 og:site_name/JSON-LD 用簡體「澳门财经科技与教育发展学会」）。複查工具：`python3 scan_tcsc.py`（掃 i18n.json/content.json/make_content.py/build.py 及 dist/ 頁面，白名單過濾上述誤報）。列表排序：insights 按 date 降序、projects 按 year 降序、首頁最新研究取 date 降序前 3。
