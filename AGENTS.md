# MFTEDA 官網（mfteda.org）

澳門財經科技與教育發展學會官方網站，靜態多語言站（繁中/简中/en/pt），托管於 GitHub Pages，域名 DNS 在 Hostinger。

## 結構

- `content.json` — 全部網站內容的唯一母本（4 語言、研究洞察文章、焦點卡片、夥伴鏈接）。**更新內容只改這裡**。
- `make_content.py` — 由 `.scrape/i18n.json` 等生成 `content.json` 的腳本（一次性遷移用，平時不用跑）。
- `build.py` — 讀 `content.json` 生成全部靜態頁面到 `dist/`（現 106 個文件，含 `dist/CNAME`）。語言目錄：繁中在根目錄，其他在 `zh-CN/`、`en/`、`pt/`。
- `assets/` — 源頭樣式/腳本/圖片，`build.py` 會拷貝進 `dist/`。圖片一律用 webp（已壓縮）；`og-cover.jpg` 是社交分享圖（1200×630）。學會 LOGO 原圖為 `assets/img/logo.png`（2026-10-16 起為正確版海豚標識：海豚+綠浪+中英文會名，透明底 776×640，僅供 JSON-LD/og-cover 使用）；**頁頭/頁尾/favicon 用 `assets/img/logo-sm.png`**（155×128 透明底，21KB，由原圖 `sips -z 128 155` 生成，換 LOGO 時需同步重新生成小圖並重繪 og-cover）。
- `dist/` — 生成物，**不要手改**，已被 .gitignore 忽略。除 36 個頁面外還自動生成 `robots.txt`、`sitemap.xml`（含 4 語言 hreflang）、`404.html`。
- `game/` — 「濠江財富大亨」財經教育遊戲（index.html/style.css/game.js/manifest.json，獨立純前端應用），`build.py` 會拷貝進 `dist/game/`。研究領域頁「現代金融」卡片（area8）點擊彈出。
- `game2/` — 「濠港雙城大亨」港澳文化大富翁（index.html/style.css/game.js/online.js，單機人機/本機 2–5 人/PeerJS 房間碼聯機最多 5 人；聯機依賴 unpkg CDN 加載 PeerJS，失敗時優雅降級為純單機），`build.py` 會拷貝進 `dist/game2/`。研究領域頁「文化與科技」卡片（area9）點擊彈出。
- 教育遊戲整合：卡片→遊戲映射在 `build.py` 常量 `RESEARCH_GAME_ATTRS`（輸出 `data-mft-game="遊戲URL"` 屬性）；`assets/js/game-launcher.js` 統一處理所有帶該屬性的卡片（iframe 彈窗、ESC/遮罩/✕ 關閉、徽章文案 4 語言在 `render_research`）。新增遊戲：建 `gameN/` 目錄 + `build()` 加 copytree + `RESEARCH_GAME_ATTRS` 加映射。改動遊戲文件後照舊跑 `build.py` 並更新 `ASSET_V`。
- `.scrape/` — 原 Hostinger Horizons 站點的抓取備份（原站已下線前的參考資料）。

## 更新流程

1. 改 `content.json`（加洞察/新聞文章 = 在 `insights` 數組加一條，4 語言都填；若帶 `slug` 和 `body`（每語言是段落數組），會自動生成詳情頁 `insights/{slug}.html`，列表「閱讀更多」自動連到該頁；配圖放 `assets/img/news/` 並設 `image` 字段）。
2. `python3 build.py`。
3. `git add -A && git commit -m "..." && git push`。
4. GitHub Actions 自動構建部署（`.github/workflows/deploy.yml`），約 1 分鐘後線上生效。

## 關鍵事實

- 頁面共 10 個（`PAGES`）：index/about/research/projects/publications/insights/news/partners/policy/contact。「招商政策」頁（policy）內容在 `content.json` 的 `policies` 數組（region: macao/hengqin，每項含 year、title/summary 4語言、url），更新政策只改這裡；導航鍵 `nav.policy` 由 `make_content.py` 注入 i18n。
- 合作夥伴更名記錄（2026-10）：partner2「澳門貿易投資促進局」→「招商投資促進局」（en: Commerce and Investment Promotion Institute，IPIM 縮寫沿用，鏈接不變）；partner5「澳門聖若瑟大學」→「聖若瑟大學」（法定名不含「澳門」）；partner8 澳門直播協會 href 改為官方 Facebook（https://www.facebook.com/MacauLiveAssociation/，官網域名已失效）；partner11「澳門中西創新研究院」→「中西創新學院」（用戶確認；en: Macau Millennium College，pt: Instituto Milénio de Macau，href 為裸域 https://mmc.edu.mo——www 子域 SSL 證書不匹配）。死鏈修復（2026-10-16）：partner3 法學所鏈接去 www 子域（http://iolaw.cssn.cn，www 子域 NXDOMAIN）。全部夥伴配 LOGO（`assets/img/partners/partner{N}.webp`，名稱正上方，`.partner-logo` 高 3.15rem）。
- 合作夥伴新增（2026-10-15）：partner13 商湯科技（https://www.sensetime.com）、partner14 澳門海易通達科技有限公司（NexMatrix，https://nexmatrixs.com）、partner15 數智建造（廣東橫琴）科技有限公司（無獨立官網，按用戶指示鏈接指向中國建築工程（澳門）有限公司官網 https://www.ccem.com.mo/，卡片配中國建築工程（澳門）標識 partner15.webp）。partner10 插入「長春電子科技學院」（https://www.changdian2001.com/，校徽 partner10.webp；用戶指定放第三行第二列，原 partner10-15 順延為 11-16）。共 16 家：政府2→研究1→僑務1→高校6→社團2→企業3，全部配 LOGO。`build.py` 的 `render_partners` 循環上限需隨總數手動調整（現為 range(1, 17)）。
- 緩存破除（重要）：`build.py` 常量 `ASSET_V`（形如 '?v=20261016b'）附加在 CSS/JS/LOGO/hero-bg 引用後。**凡改動 style.css、main.js 或任何圖片，必須更新 ASSET_V**，否則用戶瀏覽器（尤其微信內置）會顯示舊版。
- 首頁 hero 大洲動態連線（2026-10-16 上線；2026-10-17 節點按真實城市地理位置逐城校準）：`build.py` 的 `HERO_LINKS` 常量注入 `<svg class="hero-links">`（viewBox 0 0 1536 2752 與 hero-bg.webp 同尺寸，`preserveAspectRatio="xMidYMid slice"` 與 background-size:cover 對齊，弧線以澳門為樞紐輻射）；8 節點 = 澳門(1248,1334 樞紐 r8)、紐約(349,1227)、聖保羅(450,1615)、巴黎(721,1198)、約翰內斯堡(818,1629)、安卡拉(872,1247)、迪拜(955,1334)、悉尼(1426,1646)。動畫樣式在 style.css `.hero-links` 區塊（脈衝 heroLinkFlow、節點漣漪 heroNodeRipple，`prefers-reduced-motion` 時關閉）。換 hero-bg 圖需重新標定節點坐標（注意：該地圖為藝術化點陣圖，各區域比例不一致，無全局經緯線性換算，須按當地海岸線逐點目視校準）。
- 2026-10-16 全站審計優化約定：導航斷點 1280px（1280–1439 為緊湊檔）；頁腳品牌列 `.footer-brand-col` 無使命段落（數據保留在 content.json 供 meta description 用）；社交鏈接為 `#` 時不渲染；insights 無 slug 不出「閱讀更多」；卡片標題在 research/news/partners 頁用 h2（CSS 選擇器為 h2,h3 雙寫）；CI（deploy.yml）需 `pip install pillow` 以供 build.py 注入圖片 width/height（本地 PIL 或 sips 兜底，讀不到尺寸不報錯）。

- 每頁自動帶 canonical / Open Graph / Twitter Card 標籤（分享圖 `assets/img/og-cover.jpg`），首頁帶 Organization JSON-LD。`content.json` 的 `site_url` 是絕對 URL 的基準，換域名時改它。
- 域名 `mfteda.org`：A 記錄指向 GitHub Pages（185.199.108.153/109.153/110.153/111.153），`www` CNAME → `workworkxiaosan.github.io`；DNS 在 Hostinger hPanel 管理。
- GitHub 倉庫：`workworkxiaosan/mfteda`（本機 gh CLI 已登錄 workworkxiaosan）。
- 默認語言繁中在根路徑（如 `/about.html`），與原站 URL 一致。
- 出版物 PDF 已上線：`assets/pdf/book-*.pdf`（4 本稅法讀本，約 70MB），「在線閱讀」新標籤頁打開，「下載PDF」直接下載。要替換版本只需覆蓋同名文件。
- 社交鏈接（FB/LinkedIn/Twitter）在 `content.json` 的 `social` 字段，目前是 `#`。
- 聯繫表單為前端演示（原站如此），未接後端；如需真正收集留言可接 Formspree 等服務。
- 原站遺留問題已修復：社區篇/副刊封面對調、關於我們「。。」雙句號、/mission 空路由。
- 繁簡校對規範（2026-10）：繁體用港澳寫法——「平台/了解/群體/臨床/港澳台」的 台/了/群/床 均為正字（OpenCC s2t 會誤報為臺/瞭/羣/牀）；機構名按語言版本書寫（zh-CN 頁 og:site_name/JSON-LD 用簡體「澳门财经科技与教育发展学会」）。複查工具：`python3 scan_tcsc.py`（掃 i18n.json/content.json/make_content.py/build.py 及 dist/ 頁面，白名單過濾上述誤報）。列表排序：insights 按 date 降序、projects 按 year 降序、首頁最新研究取 date 降序前 3。
- 社評專欄（2026-10）：insights 條目加 `column: true` 會被抽到洞察列表頁頂部的「社評專欄」section（4語言標題內置於 build.py，橫向大卡片 `.column-card` 樣式在 style.css）；可選 `author`（`{"name": 4語言, "title": 4語言}`，詳情頁標題下方署名）與 `source`（`{"name": 4語言, "url": ...}`，詳情頁正文末尾「原文載於《…》」鏈接，target=_blank）。首篇：會長楊誠澳門日報社論，slug `macao-strategic-pivot-shock-absorber`。
- 新聞動態（2026-10）：第 10 個頁面 `news`（PAGES 中在 insights 之後；導航鍵 `nav.news` 由 make_content.py 注入）。新聞 = 在 make_content.py 的 `news` 數組加一條（`date/slug/category/title/excerpt/source/body` 4語言，`source.url` 為原文媒體鏈接），build.py 自動生成列表頁 `news.html`（按 date 降序，卡片 meta 含來源媒體名）與詳情頁 `news/{slug}.html`（末尾「原文出處」鏈接）。新聞支持 `images` 配圖（語法同 insights 文章：`{"file","after","caption"{4語言}}`，file 對應 `assets/img/news/*.webp`，有配圖時 OG 圖取第一張；無配圖用默認 og-cover）。首頁「最新動態」section 自動取 date 降序前 3。錄入後照舊跑 `make_content.py && build.py`。繁簡校對白名單在 scan_tcsc.py 的 DIFF_WHITELIST（含港澳正字 秘/峰/周/局、人名 范/杰 等 OpenCC 異體或詞組級誤報）。
- 公眾號稿件整合（2026-10）：7 篇微信公眾號新聞 + 1 篇社評（田一輝《人文經濟學促澳文商融合》，insights 第 2 篇 column）+ 就業培訓條目換官方稿，四語言正文集中放在 `news_data.py`（`NEWS_WX`/`OPED_HUMANITIES`/`YOUTH_OFFICIAL`，由 make_content.py 引用合併）；配圖共 25 張 webp（sips -Z 1600 + cwebp -q 82）在 `assets/img/news/{slug}-{序號}.webp`。原始素材在 `.news-src/`（已 gitignore，勿提交）。社評專欄現有 2 篇。
