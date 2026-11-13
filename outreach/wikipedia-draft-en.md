# Wikipedia 英文 AfC 草稿：Draft:MFTEDA（待人工提交）

> 狀態：**待人工提交**（2026-11-14 嘗試通過 MediaWiki API 匿名創建被攔截）
>
> 攔截原因：en.wikipedia.org 對本機出口 IP 實施登出編輯限流，API 返回
> `acct_creation_throttle_throttle_hit-temp`（"We are temporarily limiting logged-out editing from
> your location. Please create an account to edit, or try again later."）。兩次嘗試（間隔 20 秒）均失敗。
> 按任務規則不註冊新賬號，故改為產出本文件，供人工在瀏覽器中登入維基百科賬號後提交。

## 人工提交步驟

1. 登入一個維基百科賬號（自動確認用戶可直接創建 Draft 頁面；新賬號亦可創建 Draft 命名空間頁面）。
2. 打開 https://en.wikipedia.org/wiki/Draft:MFTEDA?action=edit （或搜索框輸入 `Draft:MFTEDA` 後點紅鏈創建）。
3. 將下方「Draft:MFTEDA wikitext」整段粘貼，編輯摘要建議：
   `Creating Articles for Creation draft for the Macao Financial Technology and Education Development Association (MFTEDA), sourced to Macao SAR Government portal, Exmoo News, Macao Daily News and the association's website`
4. 保存。再打開 https://en.wikipedia.org/wiki/Draft_talk:MFTEDA?action=edit ，粘貼下方「Draft talk:MFTEDA wikitext」保存，完成利益關聯申報。
5. 草稿審閱後，如需正式送審，把頁頂模板由 `{{AFC submission|t|...}}` 改為 `{{subst:submit}}`。

## 已核實事實與來源（2026-11-14 核對）

| 事實 | 來源 | 核對結果 |
| --- | --- | --- |
| 2025-03-12 澳門理工大學博彩旅遊教學及研究中心座談會；本會副會長施韻、特聘研究員胡濟源受邀分享碳中和與 ESG 議題；六間綜合度假休閒企業、博彩設備供應廠、澳門國際碳排放權交易所代表出席 | https://www.gov.mo/zh-hant/news/1128951/ （頁面元數據 datePublished 2025-03-12） | 已讀取原文確認 |
| 2026-11-10《力報》(Exmoo News) 刊陳錦權（博士智庫副理事長）評論：本會等機構近日在旅遊塔啟動「澳門金融科技分析競賽」，聚焦生成式 AI 智能投研，設「智能投研助手」「財經新聞情緒分析」兩賽道，強調引用溯源與風控，總決賽實時壓力測試與專家答辯，優秀團隊可參與實習 | https://www.exmoo.com/article/267829.html （頁面日期 2026-11-10） | 已讀取原文確認 |
| 會長楊誠（兼澳門數字創新協會理事長）2026-09-30 在《澳門日報》發表社論〈澳門立戰略支點　當開放大局的減震墊〉 | https://www.macaodaily.com/html/2026-09/30/content_1937056.htm （鏈接取自官網社評頁頁尾「原文出處」） | 鏈接來自倉庫 make_content.py 記錄 |
| 學會中/英/葡全稱、宗旨（金融創新、電商、企業出海、文化科技融合、大灣區合作）、地址（澳門湖畔南街中國與葡語國家商貿合作服務平台綜合體辦公樓 B1） | https://mfteda.org/en/about.html | 已讀取確認 |
| 出版物：《澳門特別行政區居民稅法知識讀本》系列四冊（大學篇/社區篇/青年篇/副刊），官網免費閱讀下載 | https://mfteda.org/en/publications.html | 已讀取確認 |
| 成立日期 | — | **無公開來源可查證，草稿中刻意留白，切勿自行填寫** |

## Draft:MFTEDA wikitext

```wikitext
{{AFC submission|t|ns=118|ts=20261113162038}}
{{Short description|Non-profit think tank in Macao}}
{{Use dmy dates|date=November 2026}}

{{Infobox organization
| name = Macao Financial Technology and Education Development Association
| native_name = {{lang|zh-hant|澳門財經科技與教育發展學會}}
| native_name_lang = zh
| abbreviation = MFTEDA
| type = [[Nonprofit organization|Non-profit]] [[think tank]]
| headquarters = [[Macao]]
| location = B1, Office Building of the China–Portuguese-speaking Countries Commercial and Trade Cooperation Service Platform Complex, Rua Nam Van Sul, Macao
| leader_title = President
| leader_name = Yang Cheng
| website = {{URL|https://mfteda.org}}
}}

The '''Macao Financial Technology and Education Development Association''' ('''MFTEDA'''; {{zh|t=澳門財經科技與教育發展學會|s=澳门财经科技与教育发展学会}}; {{langx|pt|Associação de Desenvolvimento de Finanças, Tecnologia e Educação de Macau}}) is a non-profit [[think tank]] based in [[Macao]], a [[special administrative region of China]]. The association states that it works on financial innovation, [[financial technology]], education, and cooperation between China and [[Portuguese-speaking countries]], in support of the [[diversification of Macau's economy]].<ref name="about">{{cite web |title=About Us |url=https://mfteda.org/en/about.html |website=Macao Financial Technology and Education Development Association |access-date=14 November 2026}}</ref> Its president is Yang Cheng, who also chairs the Macao Digital Innovation Association.<ref name="mdn">{{cite news |last=Yang |first=Cheng |script-title=zh:澳門立戰略支點　當開放大局的減震墊 |trans-title=Macao as a strategic pivot: a shock absorber for the nation's opening-up |url=https://www.macaodaily.com/html/2026-09/30/content_1937056.htm |work=[[Macao Daily News]] |date=30 September 2026 |access-date=14 November 2026 |language=zh-Hant}}</ref>

== History ==

The association has appeared in Macao government and local media coverage since 2025. In March 2025, the Gaming and Tourism Teaching and Research Centre of the [[Macao Polytechnic University]] invited MFTEDA vice-president Shi Yun and distinguished research fellow Hu Jiyuan to speak at a seminar on global [[carbon neutrality]] trends and [[environmental, social, and governance]] (ESG) compliance in the international gaming industry, where they discussed China's "30·60" dual-carbon policy and the green transformation of Macao's tourism and leisure sector with representatives of six integrated resort operators, gaming equipment suppliers, and the Macao International Carbon Emission Rights Exchange.<ref name="govmo">{{cite web |script-title=zh:澳門理工大學舉辦全球碳中和趨勢座談會推動旅遊業可持續發展 |trans-title=Macao Polytechnic University holds seminar on global carbon neutrality trends to promote sustainable development of tourism |url=https://www.gov.mo/zh-hant/news/1128951/ |website=Macao SAR Government Portal |date=12 March 2025 |access-date=14 November 2026 |language=zh-Hant}}</ref>

== Activities ==

In November 2026, MFTEDA and other institutions launched the Macao Financial Technology Analysis Competition at the [[Macau Tower]].<ref name="exmoo">{{cite news |last=Chan |first=Kam Kuen |script-title=zh:生成式AI與智能投研：從「澳門金融科技分析競賽」看金融科技人才培育與路徑創新 |trans-title=Generative AI and intelligent investment research: fintech talent development and path innovation through the Macao Financial Technology Analysis Competition |url=https://www.exmoo.com/article/267829.html |work=Exmoo News |date=10 November 2026 |access-date=14 November 2026 |language=zh-Hant}}</ref> Focusing on the use of [[generative artificial intelligence]] in intelligent investment research and financial information services, the competition set two tracks—an intelligent investment research assistant and financial news sentiment analysis—and required entrants to provide traceable source citations and financial verification for their systems' outputs.<ref name="exmoo"/> Local commentary described the competition as supporting the development of the modern financial industry under the Macao SAR's "1+4" diversification strategy, with finalists undergoing real-time stress tests and expert review, and outstanding teams offered internships.<ref name="exmoo"/>

MFTEDA representatives also take part in academic exchange events in Macao, such as the Macao Polytechnic University seminar on ESG compliance in the gaming industry held in March 2025.<ref name="govmo"/> President Yang Cheng has commented on Macao's economic positioning in the territory's press; in a September 2026 [[op-ed]] in the ''Macao Daily News'', he argued that under Macao's third five-year development plan the city should act as a "strategic pivot" in China's opening-up and a "shock absorber" for enterprises expanding overseas.<ref name="mdn"/>

== Publications ==

The association publishes the ''Tax Law Knowledge Readers for Residents of the Macao SAR'' series—comprising University, Community, Youth and Supplement editions—which it distributes free of charge through its website.<ref name="pubs">{{cite web |title=Publications |url=https://mfteda.org/en/publications.html |website=Macao Financial Technology and Education Development Association |access-date=14 November 2026}}</ref>

== References ==
{{Reflist}}

== External links ==
* {{Official website|https://mfteda.org/}}

{{Draft categories|
[[Category:Organisations based in Macau]]
[[Category:Think tanks based in China]]
}}
```

## Draft talk:MFTEDA wikitext

```wikitext
{{connected contributor|MFTEDA@163.com}}

This draft was prepared using material published by the association and independent coverage by the Macao SAR Government portal and Exmoo News. The address above is the association's public contact email; editors affiliated with MFTEDA are asked to propose changes on this talk page rather than editing the draft directly.
```

## 備注

- 草稿刻意不寫成立日期：公開來源（含政府新聞網、力報、官網）均未載明，避免虛構。
- 獨立來源目前僅 gov.mo 與 exmoo 兩篇，AfC 審稿員可能以 WP:ORG 關注度不足為由要求補充；如被退回，可再補《澳門日報》等更多第三方報道後重新提交。
- 創建後草稿頁 URL 將為 https://en.wikipedia.org/wiki/Draft:MFTEDA ，討論頁 https://en.wikipedia.org/wiki/Draft_talk:MFTEDA 。
