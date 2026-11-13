# On Think Tanks (OTTD) 收錄申請 — 英文申請郵件草稿

- **狀態**：待郵件發送（2026-11-14 起草）
- **收件人**：ottd@onthinktanks.org（OTTD 官方目錄聯繫郵箱，見 https://onthinktanks.org/about-the-directory/ 與「Add your think tank」表單說明文字）
- **發件人**：MFTEDA@163.com

## 為什麼走郵件而非公開表單直交（調研結論）

公開提交入口確實存在且無需賬號：[Add your think tank](https://onthinktanks.org/add-your-think-tank/) → Airtable 表單 <https://airtable.com/shr63hnToYaFHztzp>（「Add your think tank to the Open Think Tank Directory (English form)」）。但 2026-11-14 實測該表單有兩個硬性障礙，無法如實填完：

1. **必填的 City / Country 下拉選項中均無 Macao**（Country 列表有 China、Hong Kong，無 Macao；City 列表亦無）。表單該字段說明原文即為：「Didn't find your city? Write to us: ottd@onthinktanks.org」——官方指引就是發郵件。
2. 表單含約 30 個必填項，包括創辦人姓名、創立日期、2026 年員工總數、女性員工比例、2025 年出版物數量、2025 年營業額區間等組織內部數據，本會暫無可對外核實的公開數值，不宜代填估算值污染目錄數據。

（技術備註：表單提交走 Airtable 內部 API `POST /v0.3/view/viwZ7mTmfyghSmH99/submitSharedForm`，已驗證公開可達；曾以 curl 重放嘗試提交，因必填項缺失與 Macao 無對應選項而未送出，未產生任何記錄。）

---

## 郵件正文（直接複製發送）

**To:** ottd@onthinktanks.org
**Subject:** New think tank submission: Macao Financial Technology and Education Development Association (MFTEDA) — Macao

Dear On Think Tanks Directory team,

I am writing to request the inclusion of our organisation in the Open Think Tank Directory. I attempted to use the "Add your think tank" form, but Macao is not listed in either the City or the Country dropdown, and the form's own guidance ("Didn't find your city? Write to us") directs us to contact you by email. I would therefore be grateful if you could register us, or advise how best to proceed.

Organisation details:

- **Name (original language):** 澳門財經科技與教育發展學會
- **Name in English:** Macao Financial Technology and Education Development Association
- **Initials/Acronym:** MFTEDA
- **Website:** https://mfteda.org
- **Headquarters (city):** Macao
- **Country:** Macao (SAR), China — Macao does not appear in the form's country list; please advise how you prefer to record it
- **General contact email:** MFTEDA@163.com
- **Business registration:** Non-profit
- **Founded:** 25 September 2020 (established by authenticated deed signed on 25 September 2020, as published in the Macao SAR Official Gazette, Boletim Oficial no. 41/2020, Series II: https://bo.dsaj.gov.mo/bo/ii/2020/41/anotariais_cn.asp)
- **Short description:** Non-profit think tank based in Macao researching financial technology and education, publishing in six languages.
- **Operating languages:** Chinese, English, Portuguese, French, Spanish (our website publishes in six language versions: Traditional Chinese, Simplified Chinese, English, Portuguese, French and Spanish)
- **Main thematic areas:** Trade/Economics/Finance; Technology/Innovation; Education
- **Main geographical focus:** Macao, the Guangdong–Hong Kong–Macao Greater Bay Area, and China–Portuguese-speaking-countries cooperation
- **Director/Chief Executive:** Dr. Yang Cheng, President
- **Contact person for this submission:** Dr. Yang Cheng, President (reachable at the general email above)

We would be happy to complete the full annual survey (staff numbers, turnover, publication counts) once you confirm how Macao-based organisations should be registered, so that all figures are reported accurately.

Thank you very much for your work maintaining the directory. We look forward to your reply.

Kind regards,
Dr. Yang Cheng
President
Macao Financial Technology and Education Development Association (MFTEDA)
MFTEDA@163.com | https://mfteda.org

---

## 發送後跟進

- OTTD 團隊表示審核「can take up to a month」，一個月無回覆可發跟進郵件至同一郵箱。
- 收錄後可用 [Update your profile](https://airtable.com/app5Tu5McTOQC3pYw/shraWmAKwiySd9ZBk) 表單更新資料（同樣無需賬號）。
