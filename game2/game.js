/* ==========================================================
   濠港雙城大亨 — game.js
   港澳文化大富翁 · 澳門財經科技與教育發展學會
   純 Vanilla JS。引擎邏輯（MFT2.Engine）與 DOM 完全解耦，
   Node 環境下 require 本文件可取得引擎做煙霧測試。
   ========================================================== */
(function (global) {
'use strict';

/* ==================== 一、內容數據 ==================== */

// 五位歷史人物角色（各帶小幅被動）
const CHARACTERS = [
  {
    id: 'zheng', name: '鄭觀應', emoji: '📜', color: '#8d5a3b',
    passive: '文脈卡答對獎金 +$50',
    bio: ['晚清思想家，澳門鄭家大屋主人。', '在此寫成《盛世危言》，主張變法圖強。', '其思想啟發了康有為、孫中山等後人。']
  },
  {
    id: 'ricci', name: '利瑪竇', emoji: '⛪', color: '#2c6e9e',
    passive: '購買地標 95 折',
    bio: ['意大利傳教士，1582 年抵華首站澳門。', '在澳學習中文後北上，繪製《坤輿萬國全圖》。', '被譽為中西文化交流先驅。']
  },
  {
    id: 'xian', name: '冼星海', emoji: '🎵', color: '#b8860b',
    passive: '經過起點額外 +$50',
    bio: ['1905 年生於澳門漁民家庭。', '代表作《黃河大合唱》激勵抗戰軍民。', '被譽為「人民音樂家」。']
  },
  {
    id: 'sun', name: '孫中山', emoji: '🩺', color: '#a33b3b',
    passive: '機緣卡負面金額減半',
    bio: ['革命先行者，1892 年畢業於香港西醫書院。', '曾在澳門鏡湖醫院行醫，為該院首位西醫。', '行醫同時宣傳救國思想。']
  },
  {
    id: 'jin', name: '金庸', emoji: '🖋️', color: '#3e6e4e',
    passive: '收取租金 +10%',
    bio: ['香港文學巨匠，武俠小說宗師。', '《射鵰英雄傳》《笑傲江湖》等膾炙人口。', '創辦《明報》，「有華人的地方就有金庸」。']
  }
];

// 8 個色系地段組
const GROUPS = {
  brown:     { name: '澳門半島組',   color: '#8d5a3b' },
  lightblue: { name: '澳門歷史城區組', color: '#5aa9c9' },
  pink:      { name: '氹仔路環組',   color: '#d46a92' },
  orange:    { name: '澳門新地標組',  color: '#d98a2b' },
  red:       { name: '香港港島組',   color: '#b03a2e' },
  yellow:    { name: '香港九龍組',   color: '#c9a227' },
  green:     { name: '香港離島組',   color: '#3e8e5a' },
  darkblue:  { name: '雙城名勝組',   color: '#2c3e70' }
};

// 32 格棋盤（22 地標 + 10 功能格）
const TILES = [
  { type: 'go',       name: '起點 · 港澳碼頭', info: '港澳碼頭是兩地往來的門戶。經過起點可領 $200 零用錢！' },
  { type: 'landmark', name: '議事亭前地', group: 'brown', price: 60,  info: '澳門市中心廣場，黑白碎石葡式波浪紋地面是標誌，周邊盡是世遺建築。' },
  { type: 'chance',   name: '機緣卡', info: '抽取機緣卡，觸發港澳當代盛事事件！' },
  { type: 'landmark', name: '大三巴牌坊', group: 'brown', price: 80,  info: '聖保祿教堂前壁，1835 年大火後僅存牌坊，是澳門最著名地標。' },
  { type: 'tax',      name: '交學費', info: '繳交 $100 學費。投資教育，豐儉由人！' },
  { type: 'landmark', name: '媽閣廟', group: 'lightblue', price: 100, info: '澳門最古老廟宇之一。相傳葡人登岸問地名，漁民答「媽閣」，音譯成「Macau」。' },
  { type: 'quiz',     name: '文脈卡', info: '回答港澳文化歷史題，答對有獎金！' },
  { type: 'landmark', name: '鄭家大屋', group: 'lightblue', price: 120, info: '晚清思想家鄭觀應故居，《盛世危言》在此寫成，嶺南大宅融合中西風格。' },
  { type: 'study',    name: '自修室', info: '被罰留堂的同學在此溫習。路過探望無事發生。' },
  { type: 'landmark', name: '大炮台', group: 'lightblue', price: 140, info: '建於 1617 年，曾是澳門防禦核心，登高可俯瞰半島全景。' },
  { type: 'landmark', name: '官也街', group: 'pink', price: 160, info: '氹仔著名手信美食街，杏仁餅、豬扒包、葡撻香氣四溢。' },
  { type: 'landmark', name: '龍環葡韻', group: 'pink', price: 180, info: '五幢粉綠色葡式洋房，「龍環」是氹仔舊稱，盡顯南歐風情。' },
  { type: 'cafe',     name: '茶餐廳休息站', info: '港式茶餐廳文化：絲襪奶茶配菠蘿油，歇一歇再出發！' },
  { type: 'landmark', name: '路環聖方濟各堂', group: 'pink', price: 200, info: '路環海邊的鵝黃色小教堂，葡撻始祖安德魯餅店就在附近。' },
  { type: 'landmark', name: '澳門旅遊塔', group: 'orange', price: 220, info: '高 338 米，設有全球最高商業笨豬跳，俯瞰珠澳兩地景致。' },
  { type: 'landmark', name: '澳門科學館', group: 'orange', price: 240, info: '由貝聿銘設計的銀色螺旋建築，是寓教於樂的科普基地。' },
  { type: 'landmark', name: '港珠澳大橋', group: 'orange', price: 250, info: '全長 55 公里，是世界最長跨海大橋，2018 年通車連接粤港澳三地。' },
  { type: 'chance',   name: '機緣卡', info: '抽取機緣卡，觸發港澳當代盛事事件！' },
  { type: 'landmark', name: '太平山頂', group: 'red', price: 260, info: '港島最高點，1888 年山頂纜車通車，維港夜景世界聞名。' },
  { type: 'landmark', name: '大館', group: 'red', price: 280, info: '舊中區警署建築群活化而成，集古蹟、藝術與美食於一身。' },
  { type: 'landmark', name: '金紫荊廣場', group: 'red', price: 300, info: '1997 年香港回歸交接儀式舉行地，「永遠盛開的紫荊花」矗立海旁。' },
  { type: 'quiz',     name: '文脈卡', info: '回答港澳文化歷史題，答對有獎金！' },
  { type: 'landmark', name: '尖沙咀鐘樓', group: 'yellow', price: 320, info: '1915 年建成的九廣鐵路總站遺存，見證香港百年鐵路史。' },
  { type: 'landmark', name: '廟街夜市', group: 'yellow', price: 340, info: '九龍最地道夜市，大牌檔、粵曲與占卜攤檔充滿市井風情。' },
  { type: 'landmark', name: '星光大道', group: 'yellow', price: 360, info: '表揚香港電影巨星的手印大道，李小龍銅像是打卡熱點。' },
  { type: 'chance',   name: '機緣卡', info: '抽取機緣卡，觸發港澳當代盛事事件！' },
  { type: 'landmark', name: '天壇大佛', group: 'green', price: 380, info: '大嶼山寶蓮禪寺旁的青銅大佛，1993 年開光，是全球最高戶外青銅坐佛之一。' },
  { type: 'landmark', name: '南丫島', group: 'green', price: 400, info: '香港第三大島，周潤發的故鄉，以海鮮和風力發電聞名。' },
  { type: 'landmark', name: '大澳漁村', group: 'green', price: 420, info: '有「香港威尼斯」之稱，棚屋水上人家保留傳統漁村風貌。' },
  { type: 'landmark', name: '香港故宮文化博物館', group: 'darkblue', price: 450, info: '2022 年開幕，展出故宮博物院珍貴文物，古今對話、中西交融。' },
  { type: 'quiz',     name: '文脈卡', info: '回答港澳文化歷史題，答對有獎金！' },
  { type: 'landmark', name: '澳門世遺歷史城區', group: 'darkblue', price: 500, info: '2005 年列入世界遺產，20 多處建築見證四百多年中西交融。' }
];

const STUDY_TILE = 8; // 自修室位置

// 機緣卡（18 張，港澳當代盛事，每張帶知識文案）
const CHANCE_CARDS = [
  { id: 'c1',  title: '大賽車飛馳！', text: '東望洋跑道超車成功，前進 3 格！', info: '澳門格蘭披治大賽車每年 11 月在東望洋跑道舉行，是世界著名街道賽。', fx: { move: 3 } },
  { id: 'c2',  title: '煙花匯演吸客', text: '遊人如鯽，其他玩家各付你 $50 消費！', info: '澳門國際煙花比賽匯演每年 9 至 10 月在旅遊塔對開海面舉行。', fx: { allMoney: 50 } },
  { id: 'c3',  title: '媽祖誕祈福', text: '媽祖保佑，獲得香油錢 $100！', info: '農曆三月廿三媽祖誕，澳門舉行媽祖文化節，香火鼎盛。', fx: { money: 100 } },
  { id: 'c4',  title: '音樂節門票大賣', text: '演出叫好叫座，獲得 $80！', info: '澳門國際音樂節每年秋季舉行，匯聚世界級演出。', fx: { money: 80 } },
  { id: 'c5',  title: '書展滿載而歸', text: '學到新知識，免費升級一個地標！', info: '香港書展每年 7 月在灣仔會展舉行，是華文世界最大書展之一。', fx: { freeUpgrade: true } },
  { id: 'c6',  title: '藝術展會成交', text: '藏品升值，獲得 $120！', info: '巴塞爾藝術展香港展會每年 3 月舉行，是亞洲藝術市場盛事。', fx: { money: 120 } },
  { id: 'c7',  title: '美酒佳餚巡禮', text: '大飽口福，破費 $60！', info: '香港美酒佳餚巡禮在中環海濱舉行，匯聚環球美食。', fx: { money: -60 } },
  { id: 'c8',  title: '勇奪包山王', text: '搶包山勝出，獲得平安包獎賞 $90！', info: '長洲太平清醮於佛誕舉行，「搶包山」是最矚目的環節。', fx: { money: 90 } },
  { id: 'c9',  title: '欖球賽門票收入', text: '賽事門券熱賣，其他玩家各付你 $30！', info: '香港國際七人欖球賽是國際欖球壇年度盛事，氣氛熾熱。', fx: { allMoney: 30 } },
  { id: 'c10', title: '舞火龍開運', text: '火龍巡遊帶來好運，前進 2 格！', info: '大坑舞火龍於中秋節舉行，火龍插滿線香，有過百年歷史。', fx: { move: 2 } },
  { id: 'c11', title: '美食節大吃特吃', text: '掃街美食停不了，破費 $50！', info: '澳門美食節每年 11 月舉行，雲集環球風味小食。', fx: { money: -50 } },
  { id: 'c12', title: '花卉展覽打卡', text: '賞花賞心悅目，獲得 $70！', info: '香港花卉展覽每年 3 月在維多利亞公園舉行，萬花爭艷。', fx: { money: 70 } },
  { id: 'c13', title: '光影節免租宣傳', text: '光雕表演照亮你的物業，下一次付租豁免！', info: '澳門光影節以光雕表演點亮世遺建築，吸引無數遊人。', fx: { rentFree: true } },
  { id: 'c14', title: '維港跨年煙花', text: '倒數迎新年，直達起點領零用錢！', info: '除夕夜維港兩岸煙花匯演，在倒數聲中迎接新一年。', fx: { moveTo: 0 } },
  { id: 'c15', title: '粵劇日義演', text: '義演籌款成功，獲得 $110！', info: '粵劇 2009 年列入人類非物質文化遺產，港澳每年舉辦粵劇日。', fx: { money: 110 } },
  { id: 'c16', title: '突擊測驗被罰留堂', text: '測驗不合格，直送自修室溫習！', info: '溫故而知新！自修室是老師督促學生學習的地方。', fx: { study: true } },
  { id: 'c17', title: '八號風球停課', text: '颱風襲港澳，後退 2 格避風！', info: '港澳夏季常有颱風，八號風球生效時停課停工。', fx: { move: -2 } },
  { id: 'c18', title: '大橋通車快人一步', text: '經港珠澳大橋穿梭三地，前進 4 格！', info: '港珠澳大橋 2018 年通車，穿梭粤港澳三地只需約 40 分鐘。', fx: { move: 4 } }
];

// 文脈卡題庫（28 題，4 選 1 附解析；lv: P=小學 S=中學）
const QUESTIONS = [
  { id: 'p1', lv: 'P', q: '大三巴牌坊原本是甚麼建築物的前壁？', opts: ['聖保祿教堂', '媽閣廟', '市政署大樓', '東望洋燈塔'], ans: 0, exp: '1835 年一場大火燒毀聖保祿教堂，只餘下前壁，因形似中式牌坊而稱「大三巴牌坊」。' },
  { id: 'p2', lv: 'P', q: '澳門的葡文名「Macau」據說源自哪座廟宇？', opts: ['媽閣廟', '哪吒廟', '觀音堂', '天后宮'], ans: 0, exp: '相傳葡人初到澳門詢問地名，漁民以「媽閣」作答，音譯成「Macau」。' },
  { id: 'p3', lv: 'P', q: '澳門葡撻是由哪家餅店發揚光大的？', opts: ['安德魯餅店', '義順牛奶', '黃枝記', '晃記餅家'], ans: 0, exp: '1989 年英國人安德魯在路環開設餅店，改良葡式蛋撻成為著名的澳門葡撻。' },
  { id: 'p4', lv: 'P', q: '金紫荊廣場是為紀念甚麼盛事而建？', opts: ['1997 年香港回歸', '香港開埠', '北京奧運', '新機場啟用'], ans: 0, exp: '廣場上的「永遠盛開的紫荊花」雕塑，是中央政府送予香港的回歸賀禮。' },
  { id: 'p5', lv: 'P', q: '天壇大佛位於香港哪個地方？', opts: ['大嶼山', '太平山頂', '獅子山', '南丫島'], ans: 0, exp: '天壇大佛坐落大嶼山寶蓮禪寺旁，1993 年開光，要爬上 268 級石階才能到達。' },
  { id: 'p6', lv: 'P', q: '長洲太平清醮最著名的活動是甚麼？', opts: ['搶包山', '賽龍舟', '放天燈', '舞火龍'], ans: 0, exp: '太平清醮於佛誕舉行，健兒爬上包山搶奪平安包，寓意平安健康。' },
  { id: 'p7', lv: 'P', q: '粵劇在 2009 年被聯合國教科文組織列入甚麼名錄？', opts: ['人類非物質文化遺產', '世界自然遺產', '世界記憶名錄', '全球重要農業遺產'], ans: 0, exp: '粵劇由粤港澳三地聯合申報，是三地共同擁有的人類非遺項目。' },
  { id: 'p8', lv: 'P', q: '澳門格蘭披治大賽車在哪條跑道舉行？', opts: ['東望洋跑道', '西灣跑道', '友誼大馬路', '氹仔海濱'], ans: 0, exp: '東望洋跑道以狹窄多彎聞名，被譽為世界最佳街道賽道之一。' },
  { id: 'p9', lv: 'P', q: '尖沙咀鐘樓原本是甚麼建築的一部分？', opts: ['九廣鐵路總站', '天星碼頭', '郵政總局', '大會堂'], ans: 0, exp: '鐘樓建於 1915 年，是九廣鐵路九龍總站的遺存，見證百年鐵路史。' },
  { id: 'p10', lv: 'P', q: '廟街夜市位於香港哪一區？', opts: ['油麻地', '中環', '銅鑼灣', '赤柱'], ans: 0, exp: '廟街因附近的天后廟得名，是九龍最著名的夜市，大牌檔風味十足。' },
  { id: 'p11', lv: 'P', q: '港式奶茶因用棉布茶袋沖泡而有甚麼趣稱？', opts: ['絲襪奶茶', '牛仔奶茶', '紙包奶茶', '珍珠奶茶'], ans: 0, exp: '棉袋沖茶後染成茶色，貌似絲襪，故稱「絲襪奶茶」；其沖製技藝已列入香港非遺。' },
  { id: 'p12', lv: 'P', q: '澳門國際煙花比賽匯演通常在哪兩個月舉行？', opts: ['9 至 10 月', '1 至 2 月', '5 至 6 月', '11 至 12 月'], ans: 0, exp: '匯演每年 9 至 10 月在旅遊塔對開海面舉行，各國隊伍爭妍鬥麗。' },
  { id: 'p13', lv: 'P', q: '廣東人常說「飲杯涼茶」，涼茶的主要功用是甚麼？', opts: ['清熱祛濕', '提神醒腦', '補充糖分', '幫助入睡'], ans: 0, exp: '涼茶是嶺南傳統飲品，以中草藥煲成，2006 年列入國家級非物質文化遺產。' },
  { id: 'p14', lv: 'P', q: '大坑舞火龍在哪個節日舉行？', opts: ['中秋節', '農曆新年', '端午節', '重陽節'], ans: 0, exp: '大坑舞火龍有過百年歷史，相傳插滿線香的火龍可驅走瘟疫。' },
  { id: 's1', lv: 'S', q: '鄭觀應在澳門鄭家大屋寫成哪部影響深遠的著作？', opts: ['《盛世危言》', '《海國圖志》', '《資政新篇》', '《天演論》'], ans: 0, exp: '《盛世危言》主張變法圖強，對康有為、光緒帝以至孫中山都有啟發。' },
  { id: 's2', lv: 'S', q: '意大利傳教士利瑪竇 1582 年抵華，第一站是哪裏？', opts: ['澳門', '廣州', '肇慶', '南京'], ans: 0, exp: '利瑪竇以澳門為基地學習中文，其後北上傳教，成為中西文化交流先驅。' },
  { id: 's3', lv: 'S', q: '葡國詩人賈梅士據傳在澳門寫作的史詩是哪部？', opts: ['《葡國魂》', '《神曲》', '《伊利亞特》', '《堂吉訶德》'], ans: 0, exp: '白鴿巢公園內有「賈梅士洞」，《葡國魂》歌頌葡人航海事跡，是葡語文學經典。' },
  { id: 's4', lv: 'S', q: '在澳門出生的音樂家冼星海，代表作是哪部？', opts: ['《黃河大合唱》', '《義勇軍進行曲》', '《我的祖國》', '《茉莉花》'], ans: 0, exp: '冼星海 1905 年生於澳門漁民家庭，《黃河大合唱》激勵了無數抗戰軍民。' },
  { id: 's5', lv: 'S', q: '孫中山 1892 年曾在澳門哪所醫院行醫？', opts: ['鏡湖醫院', '仁伯爵醫院', '瑪麗醫院', '廣華醫院'], ans: 0, exp: '孫中山是鏡湖醫院首位西醫，行醫之餘同時宣傳救國思想。' },
  { id: 's6', lv: 'S', q: '大三巴牌坊旁建有哪吒廟，這種並存體現澳門甚麼特色？', opts: ['中西文化交融', '宗教相互排斥', '城市規劃失誤', '商業激烈競爭'], ans: 0, exp: '西式教堂遺址與中式廟宇相鄰數百年，是澳門多元共融的縮影。' },
  { id: 's7', lv: 'S', q: '香港「大館」的前身是甚麼建築群？', opts: ['舊中區警署', '舊火車總站', '舊郵政總局', '舊英軍軍營'], ans: 0, exp: '大館由前中區警署、中央裁判司署和域多利監獄組成，2018 年活化開放。' },
  { id: 's8', lv: 'S', q: '太平山山頂纜車是哪一年通車的？', opts: ['1888 年', '1900 年', '1925 年', '1950 年'], ans: 0, exp: '山頂纜車 1888 年通車，是亞洲最早的纜索鐵路之一，至今仍然服務市民。' },
  { id: 's9', lv: 'S', q: '尖沙咀星光大道主要表揚香港哪個產業的傑出人士？', opts: ['電影業', '金融業', '航運業', '飲食業'], ans: 0, exp: '星光大道上印有巨星手印，李小龍銅像最引人注目，見證香港電影輝煌歲月。' },
  { id: 's10', lv: 'S', q: '饒宗頤被譽為哪個領域的一代宗師？', opts: ['國學', '圍棋', '武術', '粵劇'], ans: 0, exp: '饒宗頤博通古今，在甲骨學、敦煌學等領域成就卓著，與季羨林並稱「南饒北季」。' },
  { id: 's11', lv: 'S', q: '香港書展每年 7 月在哪個場地舉行？', opts: ['香港會議展覽中心', '紅磡體育館', '亞洲國際博覽館', '香港文化中心'], ans: 0, exp: '香港書展自 1990 年起在灣仔會展舉行，入場人次屢破百萬。' },
  { id: 's12', lv: 'S', q: '澳門歷史城區是哪一年列入《世界遺產名錄》的？', opts: ['2005 年', '1999 年', '2008 年', '1995 年'], ans: 0, exp: '歷史城區有 20 多處建築與前地，見證四百多年中西文化交流。' },
  { id: 's13', lv: 'S', q: '澳門「土生菜」（Macanese cuisine）體現哪兩種飲食文化的融合？', opts: ['中葡', '中英', '葡法', '中日'], ans: 0, exp: '土生菜融合粵菜與葡國菜技法，非洲雞、葡國雞都是代表菜式，已列入國家級非遺。' },
  { id: 's14', lv: 'S', q: '舞獅「採青」所用的「青」通常是甚麼？寓意為何？', opts: ['生菜，諧音「生財」', '青草，寓意長青', '青椒，寓意紅火', '青瓜，寓意清爽'], ans: 0, exp: '獅子採得生菜後拋向主人家，寓意「生財」好意頭，是嶺南傳統習俗。' }
];

/* ==================== 二、遊戲引擎（無 DOM，可在 Node 運行）==================== */

const Engine = (function () {

  // 可序列化隨機數（LCG），快照同步後房主端繼續使用
  function rnd(state) {
    state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
    return state.seed / 4294967296;
  }
  function rndInt(state, n) { return Math.floor(rnd(state) * n); }

  function getChar(p) { return CHARACTERS.find(c => c.id === p.charId) || CHARACTERS[0]; }

  function addLog(state, msg) {
    state.log.push(msg);
    if (state.log.length > 60) state.log.splice(0, state.log.length - 60);
  }

  function landmarkTiles() {
    const arr = [];
    TILES.forEach((t, i) => { if (t.type === 'landmark') arr.push(i); });
    return arr;
  }
  const LANDMARKS = landmarkTiles();

  function groupTiles(group) {
    return LANDMARKS.filter(i => TILES[i].group === group);
  }

  function ownsFullGroup(state, ownerId, group) {
    return groupTiles(group).every(i => state.props[i] && state.props[i].owner === ownerId);
  }

  function buyPrice(state, p, tileIdx) {
    let price = TILES[tileIdx].price;
    if (p.charId === 'ricci') price = Math.round(price * 0.95); // 利瑪竇 95 折
    return price;
  }

  function upgradeCost(tileIdx) { return Math.round(TILES[tileIdx].price * 0.5); }

  // 租金 = 地價 10%；集齊同組 ×2；每級升級 +50% 基礎；金庸業主 +10%
  function calcRent(state, tileIdx) {
    const tile = TILES[tileIdx];
    const prop = state.props[tileIdx];
    const base = Math.round(tile.price * 0.1);
    const mult = ownsFullGroup(state, prop.owner, tile.group) ? 2 : 1;
    let rent = Math.round(base * mult + base * 0.5 * prop.level);
    const owner = state.players[prop.owner];
    if (owner && owner.charId === 'jin') rent = Math.round(rent * 1.1);
    return rent;
  }

  // 總資產 = 現金 + 地價 + 升級投入
  function assetValue(state, playerId) {
    const p = state.players[playerId];
    let total = Math.max(0, p.money);
    for (const i of LANDMARKS) {
      const prop = state.props[i];
      if (prop && prop.owner === playerId) {
        total += TILES[i].price + prop.level * upgradeCost(i);
      }
    }
    return total;
  }

  function ownedTiles(state, playerId) {
    return LANDMARKS.filter(i => state.props[i] && state.props[i].owner === playerId);
  }

  function alivePlayers(state) { return state.players.filter(p => !p.bankrupt); }

  // 付款（to=null 表示付給銀行）；資不抵債自動清算，最終破產
  function pay(state, fromId, toId, amount, reason) {
    const from = state.players[fromId];
    if (amount <= 0 || from.bankrupt) return;
    from.money -= amount;
    if (toId !== null && toId !== undefined) {
      const to = state.players[toId];
      if (to && !to.bankrupt) to.money += amount;
    }
    addLog(state, from.name + ' 支付了 $' + amount + (reason ? '（' + reason + '）' : '') + '。');
    if (from.money < 0) liquidate(state, fromId, toId, reason);
  }

  // 清算：半價拍賣地標套現；仍資不抵債則破產，餘下地標歸債權人
  function liquidate(state, playerId, creditorId, reason) {
    const p = state.players[playerId];
    let tiles = ownedTiles(state, playerId).sort((a, b) => TILES[a].price - TILES[b].price);
    while (p.money < 0 && tiles.length) {
      const i = tiles.shift();
      const prop = state.props[i];
      const value = Math.round((TILES[i].price + prop.level * upgradeCost(i)) * 0.5);
      delete state.props[i];
      p.money += value;
      addLog(state, p.name + ' 半價拍賣了「' + TILES[i].name + '」套現 $' + value + '。');
    }
    if (p.money < 0) {
      // 破產：餘下地標歸債權人，否則收回
      for (const i of ownedTiles(state, playerId)) {
        if (creditorId !== null && creditorId !== undefined && !state.players[creditorId].bankrupt) {
          state.props[i].owner = creditorId;
          addLog(state, '「' + TILES[i].name + '」歸 ' + state.players[creditorId].name + ' 所有。');
        } else {
          delete state.props[i];
        }
      }
      p.bankrupt = true;
      p.money = 0;
      addLog(state, '💔 ' + p.name + ' 資不抵債，宣佈破產' + (reason ? '（' + reason + '）' : '') + '！');
      checkEarlyWin(state);
    }
  }

  function checkEarlyWin(state) {
    const alive = alivePlayers(state);
    if (alive.length === 1 && state.players.length > 1 && !state.over) {
      finishGame(state, alive[0].id);
    }
  }

  function finishGame(state, earlyWinnerId) {
    state.over = true;
    state.pending = null;
    const ranking = state.players
      .map(p => ({ id: p.id, name: p.name, charId: p.charId, assets: p.bankrupt ? -1 : assetValue(state, p.id), bankrupt: p.bankrupt }))
      .sort((a, b) => b.assets - a.assets);
    state.ranking = ranking;
    state.winner = (earlyWinnerId !== undefined && earlyWinnerId !== null) ? earlyWinnerId : ranking[0].id;
    addLog(state, '🏆 遊戲結束！' + state.players[state.winner].name + ' 成為濠港雙城大亨！');
  }

  // 移動棋子；經過/到達起點領零用錢（冼星海 +$50）
  function movePlayer(state, p, steps, animId) {
    const from = p.pos;
    const path = [];
    const dir = steps >= 0 ? 1 : -1;
    for (let s = 1; s <= Math.abs(steps); s++) path.push(((from + dir * s) % 32 + 32) % 32);
    if (!path.length) return;
    p.pos = path[path.length - 1];
    if (steps > 0 && from + steps >= 32) {
      let bonus = 200 + (p.charId === 'xian' ? 50 : 0);
      p.money += bonus;
      addLog(state, p.name + ' 經過起點，領取零用錢 $' + bonus + '。');
    }
    state.anim = { id: animId || ('m' + (++state.animSeq)), player: p.id, path: path, dice: null };
  }

  function sendToStudy(state, p, reason) {
    p.pos = STUDY_TILE;
    p.inStudy = true;
    state.anim = { id: 'm' + (++state.animSeq), player: p.id, path: [STUDY_TILE], dice: null };
    addLog(state, '📚 ' + p.name + ' ' + reason + '，被送到自修室溫習！');
  }

  // 回合內動作結束後的流向：雙同點再擲，否則進入行動階段
  function contFlow(state, p) {
    if (state.over) return;
    if (p.pendingDoubles && !p.inStudy) {
      p.pendingDoubles = false;
      state.pending = { kind: 'roll', player: p.id, again: true };
    } else {
      p.pendingDoubles = false;
      state.pending = { kind: 'turnEnd', player: p.id };
    }
  }

  function setNotice(state, p, notice) {
    state.notice = notice;
    state.pending = { kind: 'ack', player: p.id };
  }

  // 抽機緣卡並即時結算
  function drawChance(state, p) {
    if (state.chancePtr >= state.chanceDeck.length) {
      state.chanceDeck = shuffleDeck(state);
      state.chancePtr = 0;
    }
    const cardId = state.chanceDeck[state.chancePtr++];
    const card = CHANCE_CARDS.find(c => c.id === cardId);
    addLog(state, '🎴 ' + p.name + ' 抽到機緣卡「' + card.title + '」');
    const fx = card.fx;
    if (fx.money) {
      let amt = fx.money;
      if (amt < 0 && p.charId === 'sun') amt = Math.ceil(amt / 2); // 孫中山：負面減半
      if (amt > 0) { p.money += amt; addLog(state, p.name + ' 獲得 $' + amt + '。'); }
      else pay(state, p.id, null, -amt, card.title);
    }
    if (fx.allMoney) {
      for (const other of state.players) {
        if (other.id === p.id || other.bankrupt) continue;
        if (fx.allMoney > 0) pay(state, other.id, p.id, fx.allMoney, card.title);
        else pay(state, p.id, other.id, -fx.allMoney, card.title);
      }
    }
    if (fx.move) {
      movePlayer(state, p, fx.move);
      addLog(state, p.name + ' 移動到「' + TILES[p.pos].name + '」。');
    }
    if (fx.moveTo !== undefined) {
      const steps = (fx.moveTo - p.pos + 32) % 32 || 32;
      movePlayer(state, p, steps);
    }
    if (fx.rentFree) {
      p.rentFree = 1;
      addLog(state, p.name + ' 獲得一次租金豁免。');
    }
    if (fx.freeUpgrade) {
      const ups = ownedTiles(state, p.id).filter(i => {
        const prop = state.props[i];
        return prop.level < 3 && ownsFullGroup(state, p.id, TILES[i].group);
      });
      if (ups.length) {
        ups.sort((a, b) => TILES[a].price - TILES[b].price);
        state.props[ups[0]].level++;
        addLog(state, '「' + TILES[ups[0]].name + '」免費升級至 ' + state.props[ups[0]].level + ' 級！');
      } else {
        p.money += 100;
        addLog(state, p.name + ' 暫無可升級地標，改為獲得 $100 書券。');
      }
    }
    if (fx.study) sendToStudy(state, p, '突擊測驗不合格');
    if (!state.over) {
      setNotice(state, p, { kind: 'chance', cardId: card.id, title: card.title, text: card.text, info: card.info });
    }
  }

  // 抽文脈卡題目
  function drawQuiz(state, p) {
    const pool = QUESTIONS.filter(q => q.lv === state.difficulty && !state.quizUsed[q.id]);
    let pick;
    if (pool.length) {
      pick = pool[rndInt(state, pool.length)];
    } else {
      for (const q of QUESTIONS) if (q.lv === state.difficulty) delete state.quizUsed[q.id];
      const fresh = QUESTIONS.filter(q => q.lv === state.difficulty);
      pick = fresh[rndInt(state, fresh.length)];
    }
    state.quizUsed[pick.id] = true;
    state.pending = { kind: 'quiz', player: p.id, qid: pick.id };
  }

  function shuffleDeck(state) {
    const ids = CHANCE_CARDS.map(c => c.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = rndInt(state, i + 1);
      const t = ids[i]; ids[i] = ids[j]; ids[j] = t;
    }
    return ids;
  }

  // 處理落格效果
  function resolveTile(state, p) {
    if (state.over) return;
    const tile = TILES[p.pos];
    addLog(state, p.name + ' 來到「' + tile.name + '」。');
    switch (tile.type) {
      case 'go':
        contFlow(state, p);
        break;
      case 'landmark': {
        const prop = state.props[p.pos];
        if (!prop) {
          if (p.money >= buyPrice(state, p, p.pos)) {
            state.pending = { kind: 'buy', player: p.id, tile: p.pos, price: buyPrice(state, p, p.pos) };
          } else {
            addLog(state, p.name + ' 現金不足，無法購買「' + tile.name + '」。');
            contFlow(state, p);
          }
        } else if (prop.owner === p.id) {
          contFlow(state, p);
        } else {
          const owner = state.players[prop.owner];
          if (p.rentFree) {
            p.rentFree = 0;
            addLog(state, '✨ ' + p.name + ' 憑光影節宣傳豁免了「' + tile.name + '」的租金！');
          } else if (owner.inStudy) {
            addLog(state, owner.name + ' 正在自修室留堂，無暇收租，' + p.name + ' 幸運免租！');
          } else {
            pay(state, p.id, prop.owner, calcRent(state, p.pos), '租金 · ' + tile.name);
          }
          if (!state.over) contFlow(state, p);
        }
        break;
      }
      case 'chance':
        drawChance(state, p);
        break;
      case 'quiz':
        drawQuiz(state, p);
        break;
      case 'tax':
        pay(state, p.id, null, 100, '交學費');
        if (!state.over) contFlow(state, p);
        break;
      case 'cafe':
        addLog(state, '🍵 ' + p.name + ' 在茶餐廳歎了杯絲襪奶茶，甚麼也沒發生。');
        contFlow(state, p);
        break;
      case 'study':
        addLog(state, p.name + ' 路過自修室，向留堂的同學打打氣。');
        contFlow(state, p);
        break;
      default:
        contFlow(state, p);
    }
  }

  function advanceTurn(state) {
    const cur = state.players[state.turnIndex];
    if (cur) { cur.doubles = 0; cur.pendingDoubles = false; }
    if (state.over) return;
    const alive = alivePlayers(state);
    if (alive.length <= 1) { if (alive.length === 1) finishGame(state, alive[0].id); return; }
    let next = state.turnIndex;
    do {
      next = (next + 1) % state.players.length;
      if (next === 0) {
        state.round++;
        if (state.round > state.maxRounds) { finishGame(state, null); return; }
        addLog(state, '—— 第 ' + state.round + ' 回合開始 ——');
      }
    } while (state.players[next].bankrupt);
    state.turnIndex = next;
    const np = state.players[next];
    state.pending = np.inStudy ? { kind: 'study', player: next } : { kind: 'roll', player: next };
  }

  function createGame(opts) {
    const state = {
      v: 1,
      seed: (opts.seed !== undefined ? opts.seed : Date.now()) >>> 0,
      difficulty: opts.difficulty === 'S' ? 'S' : 'P',
      maxRounds: opts.maxRounds || 30,
      round: 1,
      turnIndex: 0,
      players: opts.players.map((pl, i) => ({
        id: i,
        name: (pl.name || ('玩家' + (i + 1))).slice(0, 12),
        charId: pl.charId || CHARACTERS[i % CHARACTERS.length].id,
        isAI: !!pl.isAI,
        money: 1500,
        pos: 0,
        inStudy: false,
        doubles: 0,
        pendingDoubles: false,
        bankrupt: false,
        streak: 0,
        rentFree: 0
      })),
      props: {},
      chanceDeck: null, chancePtr: 0,
      quizUsed: {},
      pending: null, notice: null, anim: null, animSeq: 0, lastRoll: null,
      over: false, winner: null, ranking: null,
      log: []
    };
    state.chanceDeck = shuffleDeck(state);
    state.pending = { kind: 'roll', player: 0 };
    addLog(state, '🎉 遊戲開始！每位玩家獲得 $1500，擲骰遊雙城！');
    return state;
  }

  // 主入口：執行一個操作（驗證 pending 與操作者）
  function act(state, action) {
    if (!state || state.over) return { ok: false, error: '遊戲已結束' };
    const pd = state.pending;
    if (!pd) return { ok: false, error: '沒有待處理動作' };
    if (action.player !== undefined && action.player !== pd.player) {
      return { ok: false, error: '未輪到此玩家' };
    }
    const p = state.players[pd.player];
    if (!p || p.bankrupt) return { ok: false, error: '玩家狀態異常' };

    switch (pd.kind) {
      case 'roll': {
        if (action.type !== 'roll') return { ok: false, error: '請擲骰' };
        const d1 = 1 + rndInt(state, 6), d2 = 1 + rndInt(state, 6);
        state.lastRoll = [d1, d2];
        addLog(state, '🎲 ' + p.name + ' 擲出 ' + d1 + ' + ' + d2 + ' = ' + (d1 + d2) + (d1 === d2 ? '（雙同點！）' : ''));
        if (d1 === d2) {
          p.doubles++;
          if (p.doubles >= 3) {
            addLog(state, p.name + ' 連續三次雙同點！');
            sendToStudy(state, p, '連續三次雙同點');
            p.doubles = 0;
            state.pending = { kind: 'turnEnd', player: p.id };
            return { ok: true };
          }
          p.pendingDoubles = true;
        } else {
          p.doubles = 0;
        }
        const animId = 'r' + (++state.animSeq);
        movePlayer(state, p, d1 + d2, animId);
        state.anim.dice = [d1, d2];
        resolveTile(state, p);
        return { ok: true };
      }
      case 'buy': {
        if (action.type !== 'buy') return { ok: false, error: '請決定是否購買' };
        const tile = TILES[pd.tile];
        if (action.buy) {
          const price = buyPrice(state, p, pd.tile);
          if (p.money < price) {
            addLog(state, p.name + ' 現金不足，放棄購買「' + tile.name + '」。');
          } else {
            p.money -= price;
            state.props[pd.tile] = { owner: p.id, level: 0 };
            addLog(state, '🏛️ ' + p.name + ' 以 $' + price + ' 購入「' + tile.name + '」！');
          }
        } else {
          addLog(state, p.name + ' 放棄購買「' + tile.name + '」。');
        }
        contFlow(state, p);
        return { ok: true };
      }
      case 'quiz': {
        if (action.type !== 'answer') return { ok: false, error: '請作答' };
        const q = QUESTIONS.find(x => x.id === pd.qid);
        const correct = action.choice === q.ans;
        let gain = 0;
        if (correct) {
          gain = 150 + (p.charId === 'zheng' ? 50 : 0) + Math.min(p.streak, 2) * 50; // 連對加成
          p.money += gain;
          p.streak++;
          addLog(state, '✅ ' + p.name + ' 答對了！獲得獎金 $' + gain + (p.streak > 1 ? '（連對 x' + p.streak + '）' : ''));
        } else {
          p.streak = 0;
          addLog(state, '❌ ' + p.name + ' 答錯了，看看解析學一課！');
        }
        setNotice(state, p, {
          kind: 'quiz', qid: q.id, correct: correct, gain: gain,
          title: correct ? '答對了！' : '答錯了',
          text: '正確答案：' + q.opts[q.ans],
          info: q.exp
        });
        return { ok: true };
      }
      case 'ack': {
        if (action.type !== 'ack') return { ok: false, error: '請確認' };
        state.notice = null;
        contFlow(state, p);
        return { ok: true };
      }
      case 'study': {
        if (action.type !== 'study') return { ok: false, error: '請選擇' };
        if (action.pay && p.money >= 50) {
          pay(state, p.id, null, 50, '繳費提前離開自修室');
          p.inStudy = false;
          addLog(state, p.name + ' 離開自修室，可以擲骰了。');
          state.pending = { kind: 'roll', player: p.id };
        } else {
          p.inStudy = false;
          addLog(state, '📚 ' + p.name + ' 乖乖留堂溫習一回合。');
          state.pending = { kind: 'turnEnd', player: p.id };
        }
        return { ok: true };
      }
      case 'turnEnd': {
        if (action.type === 'upgrade') {
          const i = action.tile;
          const prop = state.props[i];
          if (!prop || prop.owner !== p.id) return { ok: false, error: '你不擁有此地標' };
          if (prop.level >= 3) return { ok: false, error: '已達最高等級' };
          if (!ownsFullGroup(state, p.id, TILES[i].group)) return { ok: false, error: '需集齊同色全組才可升級' };
          const cost = upgradeCost(i);
          if (p.money < cost) return { ok: false, error: '現金不足' };
          p.money -= cost;
          prop.level++;
          addLog(state, '⬆️ ' + p.name + ' 花 $' + cost + ' 把「' + TILES[i].name + '」升級至 ' + prop.level + ' 級！');
          return { ok: true };
        }
        if (action.type === 'end') {
          advanceTurn(state);
          return { ok: true };
        }
        return { ok: false, error: '無效操作' };
      }
    }
    return { ok: false, error: '未知狀態' };
  }

  // AI 策略：有錢就買（保留 $300 安全金）、集齊一組優先升級、答題 70% 正確率
  function aiAction(state) {
    const pd = state.pending;
    if (!pd) return null;
    const p = state.players[pd.player];
    switch (pd.kind) {
      case 'roll':
        return { type: 'roll' };
      case 'buy': {
        const price = pd.price;
        const completes = groupTiles(TILES[pd.tile].group).every(i =>
          i === pd.tile || (state.props[i] && state.props[i].owner === p.id));
        const reserve = completes ? 100 : 300;
        return { type: 'buy', buy: p.money - price >= reserve };
      }
      case 'quiz': {
        const q = QUESTIONS.find(x => x.id === pd.qid);
        let choice;
        if (rnd(state) < 0.7) choice = q.ans;
        else {
          const wrong = [0, 1, 2, 3].filter(i => i !== q.ans);
          choice = wrong[rndInt(state, wrong.length)];
        }
        return { type: 'answer', choice: choice };
      }
      case 'ack':
        return { type: 'ack' };
      case 'study':
        return { type: 'study', pay: p.money > 400 };
      case 'turnEnd': {
        for (const i of ownedTiles(state, p.id)) {
          const prop = state.props[i];
          if (prop.level < 3 && ownsFullGroup(state, p.id, TILES[i].group)
              && p.money - upgradeCost(i) >= 300) {
            return { type: 'upgrade', tile: i };
          }
        }
        return { type: 'end' };
      }
    }
    return null;
  }

  return {
    createGame, act, aiAction, calcRent, assetValue, buyPrice, upgradeCost,
    ownsFullGroup, groupTiles, ownedTiles, alivePlayers,
    LANDMARKS, STUDY_TILE
  };
})();

/* ==================== 三、對外導出 ==================== */

const MFT2 = {
  Engine: Engine,
  DATA: {
    CHARACTERS: CHARACTERS,
    GROUPS: GROUPS,
    TILES: TILES,
    CHANCE_CARDS: CHANCE_CARDS,
    QUESTIONS: QUESTIONS,
    STUDY_TILE: STUDY_TILE
  }
};
global.MFT2 = MFT2;
if (typeof module !== 'undefined' && module.exports) module.exports = MFT2;

/* ==================== 四、瀏覽器 UI（以下代碼需要 DOM）==================== */

if (typeof document === 'undefined') return;

const $ = id => document.getElementById(id);
const DATA = MFT2.DATA;

/* ---------- 存檔（localStorage） ---------- */
const Store = {
  get(key, def) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : def;
    } catch (e) { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 無痕模式等 */ }
  }
};
const LSK = { profile: 'mft2_profile', stats: 'mft2_stats', codex: 'mft2_codex', tut: 'mft2_tutorial_done' };

function getProfile() { return Store.get(LSK.profile, { nickname: '' }); }
function getStats() { return Store.get(LSK.stats, { games: 0, wins: 0, best: 0 }); }
function getCodex() { return Store.get(LSK.codex, { landmarks: {}, questions: {} }); }

function recordLandmark(tileIdx) {
  const c = getCodex();
  if (!c.landmarks[tileIdx]) { c.landmarks[tileIdx] = true; Store.set(LSK.codex, c); }
}
function recordQuestion(qid) {
  const c = getCodex();
  if (!c.questions[qid]) { c.questions[qid] = true; Store.set(LSK.codex, c); }
}

/* ---------- 通用 ---------- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0, 0);
}
let toastTimer = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
function money(n) { return '$' + n; }
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function charOf(charId) { return DATA.CHARACTERS.find(c => c.id === charId) || DATA.CHARACTERS[0]; }

/* ---------- 模態框 ---------- */
function openModal(title, bodyHTML, buttons) {
  $('modal-title').innerHTML = title;
  $('modal-body').innerHTML = bodyHTML;
  const act = $('modal-actions');
  act.innerHTML = '';
  (buttons || []).forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + (b.cls || 'btn-gold');
    btn.innerHTML = b.label;
    btn.onclick = b.onClick;
    act.appendChild(btn);
  });
  $('modal-overlay').classList.add('show');
}
function closeModal() { $('modal-overlay').classList.remove('show'); }

/* ---------- 地標資訊卡（點格查看，計入圖鑑） ---------- */
function tileInfoHTML(i, price, rent) {
  const t = DATA.TILES[i];
  const g = t.group ? DATA.GROUPS[t.group] : null;
  let html = '<div class="tile-info">';
  if (g) html += '<span class="group-chip" style="background:' + g.color + '">' + g.name + '</span>';
  html += '<p class="tile-info-text">' + esc(t.info) + '</p>';
  if (t.type === 'landmark') {
    html += '<p class="tile-info-price">地價 ' + money(price !== undefined ? price : t.price) +
      (rent !== undefined ? ' · 現收租 ' + money(rent) : ' · 基礎租金 ' + money(Math.round(t.price * 0.1))) + '</p>';
    const prop = G.state && G.state.props[i];
    if (prop) {
      const owner = G.state.players[prop.owner];
      html += '<p class="tile-info-owner">業主：' + esc(owner.name) + ' · ' + (prop.level ? '升級 ' + prop.level + ' 級' : '未升級') + '</p>';
    }
  }
  html += '</div>';
  return html;
}
function showTileInfo(i) {
  const t = DATA.TILES[i];
  if (t.type === 'landmark') recordLandmark(i);
  const rent = (G.state && G.state.props[i]) ? MFT2.Engine.calcRent(G.state, i) : undefined;
  openModal(esc(t.name), tileInfoHTML(i, undefined, rent), [{ label: '知道了', onClick: closeModal }]);
}

/* ==================== 主菜單 ==================== */
function initMenu() {
  const prof = getProfile();
  $('input-menu-nickname').value = prof.nickname || '';
  $('input-menu-nickname').addEventListener('change', () => {
    const p = getProfile();
    p.nickname = $('input-menu-nickname').value.trim().slice(0, 12);
    Store.set(LSK.profile, p);
  });
  $('btn-menu-solo').onclick = () => openSetup('solo');
  $('btn-menu-hotseat').onclick = () => openSetup('hotseat');
  $('btn-menu-online').onclick = () => {
    if (window.MFT2Online && MFT2Online.available) openLobby();
    else toast('🌐 網絡不可用，聯機模式暫時無法使用');
  };
  $('btn-menu-codex').onclick = () => { renderCodex(); showScreen('screen-codex'); };
  $('btn-menu-help').onclick = () => showScreen('screen-help');
  $('btn-menu-stats').onclick = () => { renderStats(); showScreen('screen-stats'); };
  const onlineOk = !!(window.MFT2Online && MFT2Online.available);
  $('btn-menu-online').classList.toggle('btn-disabled', !onlineOk);
  $('btn-menu-online').innerHTML = onlineOk ? '🌐 線上聯機' : '🌐 線上聯機 <small>（網絡不可用）</small>';
}

/* ==================== 開局設置 ==================== */
const Setup = { mode: 'solo', count: 3, chars: [], difficulty: 'P' };

function openSetup(mode) {
  Setup.mode = mode;
  Setup.chars = [];
  Setup.difficulty = 'P';
  $('setup-title').textContent = mode === 'solo' ? '單機人機 · 開局設置' : '本機多人 · 開局設置';
  const countSel = $('select-setup-count');
  countSel.innerHTML = '';
  if (mode === 'solo') {
    for (let n = 1; n <= 4; n++) {
      const o = document.createElement('option');
      o.value = n; o.textContent = n + ' 個 AI 對手';
      countSel.appendChild(o);
    }
    countSel.value = '3';
    $('setup-count-label').textContent = 'AI 對手數量';
  } else {
    for (let n = 2; n <= 5; n++) {
      const o = document.createElement('option');
      o.value = n; o.textContent = n + ' 位玩家';
      countSel.appendChild(o);
    }
    countSel.value = '3';
    $('setup-count-label').textContent = '玩家人數';
  }
  countSel.onchange = buildSetupPlayers;
  document.querySelectorAll('#setup-difficulty-row .diff-btn').forEach(b => {
    b.classList.toggle('on', b.dataset.lv === 'P');
    b.onclick = () => {
      Setup.difficulty = b.dataset.lv;
      document.querySelectorAll('#setup-difficulty-row .diff-btn').forEach(x => x.classList.toggle('on', x === b));
    };
  });
  buildSetupPlayers();
  $('btn-setup-back').onclick = () => showScreen('screen-menu');
  $('btn-setup-start').onclick = startLocalGame;
  showScreen('screen-setup');
}

function buildSetupPlayers() {
  const n = parseInt($('select-setup-count').value, 10);
  const humanCount = Setup.mode === 'solo' ? 1 : n;
  const total = Setup.mode === 'solo' ? 1 + n : n;
  const box = $('setup-players');
  box.innerHTML = '';
  const prof = getProfile();
  for (let i = 0; i < humanCount; i++) {
    if (!Setup.chars[i]) Setup.chars[i] = DATA.CHARACTERS[i % DATA.CHARACTERS.length].id;
    const row = document.createElement('div');
    row.className = 'setup-player card';
    row.innerHTML =
      '<label class="field-label">玩家 ' + (i + 1) + ' 暱稱</label>' +
      '<input type="text" class="setup-name" maxlength="12" data-i="' + i + '" value="' +
      esc(i === 0 && prof.nickname ? prof.nickname : '玩家' + (i + 1)) + '">' +
      '<label class="field-label">選擇角色（各帶被動加成）</label>' +
      '<div class="char-pick" data-i="' + i + '"></div>';
    box.appendChild(row);
  }
  // AI 佔位說明
  for (let i = humanCount; i < total; i++) {
    const note = document.createElement('div');
    note.className = 'setup-ai-note';
    note.textContent = '🤖 AI 對手 ' + (i - humanCount + 1) + '（角色隨機分配）';
    box.appendChild(note);
  }
  box.querySelectorAll('.char-pick').forEach(renderCharPick);
}

function renderCharPick(container) {
  const i = parseInt(container.dataset.i, 10);
  container.innerHTML = '';
  DATA.CHARACTERS.forEach(c => {
    const takenBy = Setup.chars.findIndex((x, j) => j !== i && x === c.id);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'char-card' + (Setup.chars[i] === c.id ? ' on' : '');
    card.innerHTML =
      '<div class="char-emoji" style="border-color:' + c.color + '">' + c.emoji + '</div>' +
      '<div class="char-name">' + c.name + '</div>' +
      '<div class="char-passive">' + c.passive + '</div>' +
      '<div class="char-bio">' + c.bio.map(esc).join('<br>') + '</div>' +
      (takenBy >= 0 ? '<div class="char-taken">玩家 ' + (takenBy + 1) + ' 已選</div>' : '');
    card.onclick = () => {
      if (takenBy >= 0) {
        // 與已選玩家互換角色
        const others = DATA.CHARACTERS.map(x => x.id).filter(id => !Setup.chars.includes(id) || id === Setup.chars[i]);
        Setup.chars[takenBy] = others.find(id => id !== c.id) || DATA.CHARACTERS[0].id;
      }
      Setup.chars[i] = c.id;
      document.querySelectorAll('.char-pick').forEach(renderCharPick);
    };
    container.appendChild(card);
  });
}

function startLocalGame() {
  const n = parseInt($('select-setup-count').value, 10);
  const humanCount = Setup.mode === 'solo' ? 1 : n;
  const total = Setup.mode === 'solo' ? 1 + n : n;
  const names = Array.from(document.querySelectorAll('.setup-name')).map(inp => inp.value.trim() || '玩家');
  // 保存首位玩家暱稱
  const prof = getProfile();
  if (names[0]) { prof.nickname = names[0]; Store.set(LSK.profile, prof); }
  // AI 角色：取未被選的
  const freeChars = DATA.CHARACTERS.map(c => c.id).filter(id => !Setup.chars.includes(id));
  const players = [];
  for (let i = 0; i < total; i++) {
    if (i < humanCount) {
      players.push({ name: names[i] || '玩家' + (i + 1), charId: Setup.chars[i], isAI: false });
    } else {
      const charId = freeChars.length ? freeChars.splice(Math.floor(Math.random() * freeChars.length), 1)[0]
        : DATA.CHARACTERS[i % DATA.CHARACTERS.length].id;
      players.push({ name: 'AI · ' + charOf(charId).name, charId: charId, isAI: true });
    }
  }
  const state = MFT2.Engine.createGame({ players: players, difficulty: Setup.difficulty, maxRounds: 30 });
  enterGame(state, { mode: 'local', myId: null });
}

/* ==================== 文脈圖鑑 ==================== */
function renderCodex() {
  const c = getCodex();
  const lmTotal = MFT2.Engine.LANDMARKS.length;
  const lmGot = MFT2.Engine.LANDMARKS.filter(i => c.landmarks[i]).length;
  const qTotal = DATA.QUESTIONS.length;
  const qGot = DATA.QUESTIONS.filter(q => c.questions[q.id]).length;
  const pct = Math.round(((lmGot + qGot) / (lmTotal + qTotal)) * 100);
  $('codex-summary').innerHTML =
    '<div class="codex-progress"><div class="codex-bar"><div class="codex-fill" style="width:' + pct + '%"></div></div>' +
    '<div class="codex-pct">總收集率 ' + pct + '%</div></div>' +
    '<p class="muted">地標知識 ' + lmGot + ' / ' + lmTotal + ' · 文脈題目 ' + qGot + ' / ' + qTotal + '</p>';
  // 地標（按色系分組）
  const lmBox = $('codex-landmarks');
  lmBox.innerHTML = '<h3>🏛️ 地標知識</h3>';
  Object.keys(DATA.GROUPS).forEach(gk => {
    const g = DATA.GROUPS[gk];
    const tiles = MFT2.Engine.groupTiles(gk);
    const got = tiles.filter(i => c.landmarks[i]).length;
    const div = document.createElement('div');
    div.className = 'codex-group';
    div.innerHTML = '<div class="codex-group-head"><span class="group-chip" style="background:' + g.color + '">' +
      g.name + '</span><span class="muted">' + got + '/' + tiles.length + '</span></div>';
    tiles.forEach(i => {
      const unlocked = !!c.landmarks[i];
      const item = document.createElement('div');
      item.className = 'codex-item' + (unlocked ? '' : ' locked');
      item.innerHTML = unlocked
        ? '<b>' + esc(DATA.TILES[i].name) + '</b><p>' + esc(DATA.TILES[i].info) + '</p>'
        : '<b>？？？</b><p>在遊戲中到訪或購買此地標即可解鎖知識。</p>';
      div.appendChild(item);
    });
    lmBox.appendChild(div);
  });
  // 題目（按難度）
  const qBox = $('codex-questions');
  qBox.innerHTML = '<h3>📖 文脈題目</h3>';
  ['P', 'S'].forEach(lv => {
    const qs = DATA.QUESTIONS.filter(q => q.lv === lv);
    const got = qs.filter(q => c.questions[q.id]).length;
    const div = document.createElement('div');
    div.className = 'codex-group';
    div.innerHTML = '<div class="codex-group-head"><b>' + (lv === 'P' ? '小學程度' : '中學程度') +
      '</b><span class="muted">' + got + '/' + qs.length + '</span></div>';
    qs.forEach(q => {
      const unlocked = !!c.questions[q.id];
      const item = document.createElement('div');
      item.className = 'codex-item' + (unlocked ? '' : ' locked');
      item.innerHTML = unlocked
        ? '<b>' + esc(q.q) + '</b><p>答案：' + esc(q.opts[q.ans]) + '。' + esc(q.exp) + '</p>'
        : '<b>？？？</b><p>踩中文脈卡格答題即可解鎖。</p>';
      div.appendChild(item);
    });
    qBox.appendChild(div);
  });
  $('btn-codex-back').onclick = () => showScreen('screen-menu');
}

/* ==================== 勝場統計 ==================== */
function renderStats() {
  const s = getStats();
  const rate = s.games ? Math.round((s.wins / s.games) * 100) : 0;
  $('stats-content').innerHTML =
    '<div class="stat-grid">' +
    '<div class="stat-cell"><div class="stat-num">' + s.games + '</div><div class="stat-label">已玩局數</div></div>' +
    '<div class="stat-cell"><div class="stat-num">' + s.wins + '</div><div class="stat-label">勝場</div></div>' +
    '<div class="stat-cell"><div class="stat-num">' + rate + '%</div><div class="stat-label">勝率</div></div>' +
    '<div class="stat-cell"><div class="stat-num">' + money(s.best) + '</div><div class="stat-label">最佳總資產</div></div>' +
    '</div>';
  $('btn-stats-back').onclick = () => showScreen('screen-menu');
}

/* ==================== 遊戲主界面 ==================== */
const G = {
  state: null, mode: 'local', myId: null,
  built: false, playedAnim: null, animating: false,
  aiTimer: null, statsRecorded: false, lastPositions: []
};
const Net = { mode: 'local' }; // 'local' | 'host' | 'client'

function enterGame(state, opts) {
  G.state = state;
  G.mode = (opts && opts.mode) || 'local';
  Net.mode = G.mode;
  G.myId = (opts && opts.myId !== undefined) ? opts.myId : null;
  G.playedAnim = null; G.animating = false; G.statsRecorded = false;
  G.lastPositions = state.players.map(p => p.pos);
  buildBoard();
  showScreen('screen-game');
  render();
}

/* ---------- 棋盤構建（9×9 外環 32 格） ---------- */
function tileGridPos(i) {
  if (i <= 8) return { r: 9, c: 10 - i };          // 底行（右→左）
  if (i <= 16) return { r: 9 - (i - 8), c: 1 };    // 左列（下→上）
  if (i <= 24) return { r: 1, c: i - 16 + 1 };     // 頂行（左→右）
  return { r: i - 24 + 1, c: 9 };                  // 右列（上→下）
}

function buildBoard() {
  const board = $('game-board');
  board.querySelectorAll('.tile,.token').forEach(n => n.remove());
  DATA.TILES.forEach((t, i) => {
    const pos = tileGridPos(i);
    const div = document.createElement('div');
    div.className = 'tile tile-' + t.type;
    div.id = 'tile-' + i;
    div.style.gridRow = pos.r;
    div.style.gridColumn = pos.c;
    let inner = '';
    if (t.type === 'landmark') {
      inner = '<div class="tile-band" style="background:' + DATA.GROUPS[t.group].color + '"></div>' +
        '<div class="tile-name">' + esc(t.name) + '</div>' +
        '<div class="tile-price">$' + t.price + '</div>' +
        '<div class="tile-owner" id="tile-owner-' + i + '"></div>' +
        '<div class="tile-level" id="tile-level-' + i + '"></div>';
    } else {
      const icons = { go: '⛴️', chance: '🎴', quiz: '📖', tax: '🎓', study: '📚', cafe: '🍵' };
      inner = '<div class="tile-icon">' + icons[t.type] + '</div><div class="tile-name">' + esc(t.name) + '</div>';
    }
    div.innerHTML = inner;
    div.onclick = () => showTileInfo(i);
    board.insertBefore(div, $('board-center'));
  });
  // 中央資訊區已固定在 HTML 中；加棋子
  G.state.players.forEach(p => {
    const c = charOf(p.charId);
    const tok = document.createElement('div');
    tok.className = 'token';
    tok.id = 'token-' + p.id;
    tok.style.background = c.color;
    tok.textContent = c.emoji;
    board.appendChild(tok);
  });
  G.built = true;
}

function tileCenter(i) {
  const board = $('game-board');
  const tile = $('tile-' + i);
  if (!board || !tile) return { x: 0, y: 0 };
  return {
    x: tile.offsetLeft + tile.offsetWidth / 2,
    y: tile.offsetTop + tile.offsetHeight / 2
  };
}

function placeToken(pid, tileIdx, slot) {
  const tok = $('token-' + pid);
  if (!tok) return;
  const c = tileCenter(tileIdx);
  const offsets = [[-7, -7], [7, -7], [-7, 7], [7, 7], [0, 0]];
  const off = offsets[(slot || pid) % offsets.length];
  tok.style.left = (c.x + off[0] - tok.offsetWidth / 2) + 'px';
  tok.style.top = (c.y + off[1] - tok.offsetHeight / 2) + 'px';
}

/* ---------- 渲染 ---------- */
function updateBoard() {
  const st = G.state;
  st.players.forEach((p, i) => {
    const tok = $('token-' + p.id);
    if (!tok) return;
    tok.style.display = p.bankrupt ? 'none' : '';
    if (!p.bankrupt && !G.animating) placeToken(p.id, p.pos, i);
    // 經過新地標 → 計入圖鑑
    if (G.lastPositions[p.id] !== p.pos && DATA.TILES[p.pos].type === 'landmark') recordLandmark(p.pos);
    G.lastPositions[p.id] = p.pos;
  });
  MFT2.Engine.LANDMARKS.forEach(i => {
    const own = $('tile-owner-' + i), lv = $('tile-level-' + i);
    const prop = st.props[i];
    if (own) {
      own.style.background = prop ? charOf(st.players[prop.owner].charId).color : 'transparent';
      own.textContent = prop ? charOf(st.players[prop.owner].charId).emoji : '';
    }
    if (lv) lv.textContent = prop && prop.level ? '★'.repeat(prop.level) : '';
  });
}

function updatePlayersBar() {
  const st = G.state;
  const bar = $('players-bar');
  bar.innerHTML = '';
  st.players.forEach(p => {
    const c = charOf(p.charId);
    const div = document.createElement('div');
    div.className = 'pbar-item' +
      (st.turnIndex === p.id && !st.over ? ' current' : '') +
      (p.bankrupt ? ' out' : '');
    const assets = MFT2.Engine.assetValue(st, p.id);
    div.innerHTML =
      '<div class="pbar-emoji" style="background:' + c.color + '">' + c.emoji + '</div>' +
      '<div class="pbar-info"><b>' + esc(p.name) + (p.isAI ? ' 🤖' : '') + '</b>' +
      '<span>' + (p.bankrupt ? '已破產' : money(p.money) + ' · 資產 ' + money(assets)) + '</span>' +
      (p.inStudy ? '<span class="pbar-study">📚留堂中</span>' : '') + '</div>';
    bar.appendChild(div);
  });
}

function updateLog() {
  const log = $('game-log');
  log.innerHTML = G.state.log.slice(-8).map(m => '<div>' + esc(m) + '</div>').join('');
  log.scrollTop = log.scrollHeight;
}

function updateRoundInfo() {
  const st = G.state;
  const cur = st.players[st.turnIndex];
  $('game-status-text').textContent = st.over ? '遊戲結束'
    : '第 ' + st.round + ' / ' + st.maxRounds + ' 回合 · 輪到 ' + cur.name + (cur.isAI ? '（AI）' : '');
  const d = st.lastRoll;
  if (!G.animating && d) {
    $('die-1').textContent = '⚀⚁⚂⚃⚄⚅'[d[0] - 1];
    $('die-2').textContent = '⚀⚁⚂⚃⚄⚅'[d[1] - 1];
  }
}

function canControl(pid) {
  const p = G.state.players[pid];
  if (Net.mode === 'client') return pid === G.myId && !p.isAI;
  if (Net.mode === 'host') return pid === 0 && !p.isAI;
  return !p.isAI;
}

function updateButtons() {
  const st = G.state;
  const pd = st.pending;
  const isCtrl = pd && canControl(pd.player);
  $('btn-roll').classList.toggle('hidden', !(pd && pd.kind === 'roll' && isCtrl));
  $('btn-end-turn').classList.toggle('hidden', !(pd && pd.kind === 'turnEnd' && isCtrl));
  $('btn-manage').classList.toggle('hidden', !(pd && pd.kind === 'turnEnd' && isCtrl));
  if (pd && pd.again && pd.kind === 'roll') $('btn-roll').innerHTML = '🎲 雙同點再擲';
  else $('btn-roll').innerHTML = '🎲 擲骰';
}

function render() {
  const st = G.state;
  if (!st) return;
  if (st.over) { showResult(); return; }
  updateRoundInfo();
  updatePlayersBar();
  updateLog();
  updateButtons();
  const anim = st.anim;
  if (anim && anim.id !== G.playedAnim && !G.animating) {
    G.playedAnim = anim.id;
    playAnim(anim, () => { updateBoard(); showPending(); maybeRunAI(); });
    updateBoard();
  } else if (!G.animating) {
    updateBoard();
    showPending();
    maybeRunAI();
  }
}

/* ---------- 動畫：骰子 + 棋子逐格移動 ---------- */
function playAnim(anim, done) {
  G.animating = true;
  const faces = '⚀⚁⚂⚃⚄⚅';
  const finish = () => { G.animating = false; done(); };
  const steps = () => {
    const path = anim.path || [];
    if (!path.length) { finish(); return; }
    let i = 0;
    const step = () => {
      placeToken(anim.player, path[i]);
      i++;
      if (i < path.length) setTimeout(step, 220);
      else setTimeout(finish, 260);
    };
    step();
  };
  if (anim.dice) {
    let n = 0;
    const shuffle = setInterval(() => {
      $('die-1').textContent = faces[Math.floor(Math.random() * 6)];
      $('die-2').textContent = faces[Math.floor(Math.random() * 6)];
      $('dice-area').classList.add('rolling');
      if (++n >= 6) {
        clearInterval(shuffle);
        $('dice-area').classList.remove('rolling');
        $('die-1').textContent = faces[anim.dice[0] - 1];
        $('die-2').textContent = faces[anim.dice[1] - 1];
        steps();
      }
    }, 90);
  } else {
    steps();
  }
}

/* ---------- 待處理動作 → 彈窗 ---------- */
let pendingModalKey = null;
function showPending() {
  const st = G.state;
  const pd = st.pending;
  if (!pd || st.over) { pendingModalKey = null; return; }
  const p = st.players[pd.player];
  const ctrl = canControl(pd.player);
  const key = pd.kind + '|' + pd.player + '|' + (pd.tile || '') + '|' + (pd.qid || '') + '|' + st.round;

  // 教學氣泡
  maybeShowTutorial(pd, ctrl);

  if (!ctrl) {
    pendingModalKey = null;
    closeModal();
    if (!p.isAI || Net.mode === 'client') {
      $('game-status-text').textContent = '等待 ' + p.name + ' 行動…';
    }
    return;
  }
  if (pendingModalKey === key) return; // 已顯示
  pendingModalKey = key;

  switch (pd.kind) {
    case 'buy': {
      const t = DATA.TILES[pd.tile];
      recordLandmark(pd.tile);
      const rent = Math.round(t.price * 0.1);
      openModal('🏛️ 購買地標？',
        tileInfoHTML(pd.tile, pd.price, rent) +
        '<p class="modal-cash">你現有 ' + money(p.money) + '</p>',
        [
          { label: '購買 ' + money(pd.price), onClick: () => { closeModal(); dispatch({ type: 'buy', buy: true, player: pd.player }); } },
          { label: '放棄', cls: 'btn-ghost', onClick: () => { closeModal(); dispatch({ type: 'buy', buy: false, player: pd.player }); } }
        ]);
      break;
    }
    case 'quiz': {
      const q = DATA.QUESTIONS.find(x => x.id === pd.qid);
      openModal('📖 文脈卡 · ' + (st.difficulty === 'P' ? '小學' : '中學') + '題',
        '<p class="quiz-q">' + esc(q.q) + '</p>',
        q.opts.map((opt, i) => ({
          label: String.fromCharCode(65 + i) + '. ' + esc(opt),
          cls: 'btn-quiz',
          onClick: () => { closeModal(); dispatch({ type: 'answer', choice: i, player: pd.player }); }
        })));
      break;
    }
    case 'ack': {
      const n = st.notice;
      if (n && n.kind === 'quiz' && n.qid) recordQuestion(n.qid);
      const icon = n && n.kind === 'quiz' ? (n.correct ? '✅' : '❌') : '🎴';
      openModal(icon + ' ' + esc(n ? n.title : ''),
        (n && n.text ? '<p class="notice-text">' + esc(n.text) + '</p>' : '') +
        (n && n.gain ? '<p class="notice-gain">+' + money(n.gain) + '</p>' : '') +
        (n && n.info ? '<p class="notice-info">💡 ' + esc(n.info) + '</p>' : ''),
        [{ label: '繼續', onClick: () => { closeModal(); dispatch({ type: 'ack', player: pd.player }); } }]);
      break;
    }
    case 'study': {
      openModal('📚 自修室留堂',
        '<p class="notice-text">' + esc(p.name) + ' 被罰留堂溫習，本回合停擲一次。</p>' +
        '<p class="notice-info">💡 也可以繳交 $50 立即離開，照常擲骰。</p>' +
        '<p class="modal-cash">你現有 ' + money(p.money) + '</p>',
        [
          { label: p.money >= 50 ? '付 $50 離開' : '付 $50 離開（現金不足）', onClick: () => {
              if (p.money < 50) { toast('現金不足！'); return; }
              closeModal(); dispatch({ type: 'study', pay: true, player: pd.player });
            } },
          { label: '留堂一回合', cls: 'btn-ghost', onClick: () => { closeModal(); dispatch({ type: 'study', pay: false, player: pd.player }); } }
        ]);
      break;
    }
    default:
      break;
  }
}

/* ---------- 管理地標（升級） ---------- */
function openManage() {
  const st = G.state;
  const pd = st.pending;
  if (!pd || pd.kind !== 'turnEnd') return;
  const p = st.players[pd.player];
  const owned = MFT2.Engine.ownedTiles(st, p.id);
  let html = '';
  if (!owned.length) {
    html = '<p class="muted">你暫時未擁有任何地標。買下同色全組後即可付費升級（最多 3 級），租金大增！</p>';
  } else {
    const byGroup = {};
    owned.forEach(i => { (byGroup[DATA.TILES[i].group] = byGroup[DATA.TILES[i].group] || []).push(i); });
    Object.keys(byGroup).forEach(gk => {
      const g = DATA.GROUPS[gk];
      const full = MFT2.Engine.ownsFullGroup(st, p.id, gk);
      html += '<div class="manage-group"><div class="codex-group-head"><span class="group-chip" style="background:' +
        g.color + '">' + g.name + '</span><span class="muted">' + (full ? '✅已集齊，可升級' : '未集齊') + '</span></div>';
      byGroup[gk].forEach(i => {
        const prop = st.props[i];
        const cost = MFT2.Engine.upgradeCost(i);
        const can = full && prop.level < 3 && p.money >= cost;
        html += '<div class="manage-row"><span>' + esc(DATA.TILES[i].name) +
          ' <small class="muted">租金 ' + money(MFT2.Engine.calcRent(st, i)) + '</small></span>' +
          '<span class="manage-stars">' + (prop.level ? '★'.repeat(prop.level) : '—') + '</span>' +
          (prop.level >= 3 ? '<span class="muted">滿級</span>'
            : '<button class="btn btn-mini" data-tile="' + i + '"' + (can ? '' : ' disabled') + '>升級 ' + money(cost) + '</button>') +
          '</div>';
      });
      html += '</div>';
    });
  }
  openModal('⬆️ 管理地標', html + '<p class="modal-cash">你現有 ' + money(p.money) + '</p>',
    [{ label: '完成', onClick: closeModal }]);
  $('modal-body').querySelectorAll('.btn-mini').forEach(btn => {
    btn.onclick = () => {
      dispatch({ type: 'upgrade', tile: parseInt(btn.dataset.tile, 10), player: pd.player });
      if (Net.mode !== 'client') openManage(); // 本地即時刷新；聯機等快照
    };
  });
}

/* ---------- 操作分發（本地/房主/客戶端） ---------- */
function dispatch(action) {
  if (Net.mode === 'client') {
    MFT2Online.sendIntent(action);
    return;
  }
  const res = MFT2.Engine.act(G.state, action);
  if (!res.ok) { toast(res.error || '操作失敗'); return; }
  if (Net.mode === 'host' && window.MFT2Online) MFT2Online.broadcast(G.state);
  render();
}

/* ---------- AI 自動行動（本地與房主端） ---------- */
function maybeRunAI() {
  const st = G.state;
  if (!st || st.over || Net.mode === 'client') return;
  const pd = st.pending;
  if (!pd) return;
  const p = st.players[pd.player];
  if (!p || !p.isAI) return;
  clearTimeout(G.aiTimer);
  G.aiTimer = setTimeout(() => {
    if (!G.state || G.state.over) return;
    const now = G.state.pending;
    if (!now || !G.state.players[now.player].isAI) return;
    const action = MFT2.Engine.aiAction(G.state);
    if (action) {
      action.player = now.player;
      const res = MFT2.Engine.act(G.state, action);
      if (res.ok && Net.mode === 'host' && window.MFT2Online) MFT2Online.broadcast(G.state);
      render();
    }
  }, pd.kind === 'roll' ? 1000 : 1300);
}

/* ---------- 教學氣泡（首局前 3 回合，可關閉） ---------- */
function maybeShowTutorial(pd, ctrl) {
  const bubble = $('tutorial-bubble');
  if (Store.get(LSK.tut, false) || !ctrl || G.state.round > 3) {
    bubble.classList.add('hidden');
    return;
  }
  const tips = {
    1: '👋 歡迎！點「擲骰」開始你的港澳之旅。經過起點可領 $200 零用錢！',
    2: '🏛️ 買下地標可向對手收租；點任意格子可查看地標背後的文化知識。',
    3: '⬆️ 集齊同色全組後，回合結束前點「管理地標」付費升級，租金大增！'
  };
  $('tut-text').textContent = tips[G.state.round] || '';
  bubble.classList.remove('hidden');
}

/* ---------- 結算 ---------- */
function showResult() {
  const st = G.state;
  updateBoard(); updatePlayersBar(); updateLog();
  closeModal();
  const box = $('result-content');
  const winP = st.players[st.winner];
  let html = '<div class="result-cup">🏆</div>' +
    '<h2>' + esc(winP.name) + '</h2>' +
    '<p class="muted">成為濠港雙城大亨！（' + (st.round > st.maxRounds ? '30 回合結算' : '對手全部破產') + '）</p>' +
    '<div class="result-list">';
  st.ranking.forEach((r, idx) => {
    const c = charOf(r.charId);
    html += '<div class="result-row' + (r.id === st.winner ? ' winner' : '') + '">' +
      '<span class="result-rank">' + (idx + 1) + '</span>' +
      '<span class="pbar-emoji" style="background:' + c.color + '">' + c.emoji + '</span>' +
      '<span class="result-name">' + esc(r.name) + (r.bankrupt ? '（破產）' : '') + '</span>' +
      '<span class="result-assets">' + (r.bankrupt ? '—' : money(r.assets)) + '</span></div>';
  });
  html += '</div>';
  box.innerHTML = html;
  // 統計（只記一次）
  if (!G.statsRecorded) {
    G.statsRecorded = true;
    const s = getStats();
    const myIds = Net.mode === 'client' ? [G.myId] : (Net.mode === 'host' ? [0] : st.players.filter(p => !p.isAI).map(p => p.id));
    const hasHuman = myIds.some(id => id !== null && st.players[id] && !st.players[id].isAI);
    if (hasHuman) {
      s.games++;
      if (myIds.includes(st.winner)) s.wins++;
      const myBest = Math.max.apply(null, myIds.map(id => MFT2.Engine.assetValue(st, id)));
      if (myBest > s.best) s.best = myBest;
      Store.set(LSK.stats, s);
    }
    // 擁有過的地標全部計入圖鑑
    MFT2.Engine.LANDMARKS.forEach(i => { if (st.props[i]) recordLandmark(i); });
  }
  $('btn-result-again').onclick = () => { Net.mode = 'local'; Net.inGame = false; showScreen('screen-menu'); };
  $('btn-result-menu').onclick = () => { Net.mode = 'local'; Net.inGame = false; showScreen('screen-menu'); };
  showScreen('screen-result');
}

/* ==================== 線上聯機大廳 ==================== */
const Lobby = { char: 'zheng', difficulty: 'P', isHost: false };

function openLobby() {
  Lobby.char = DATA.CHARACTERS[0].id;
  Lobby.difficulty = 'P';
  Lobby.isHost = false;
  const prof = getProfile();
  $('input-lobby-name').value = prof.nickname || '';
  $('input-lobby-code').value = '';
  $('lobby-status').textContent = '';
  $('lobby-room').classList.add('hidden');
  $('lobby-entry').classList.remove('hidden');
  renderLobbyChars();
  $('btn-lobby-back').onclick = () => { if (window.MFT2Online) MFT2Online.leave(); showScreen('screen-menu'); };
  $('btn-lobby-host').onclick = hostRoom;
  $('btn-lobby-join').onclick = joinRoom;
  $('btn-lobby-start').onclick = () => {
    const state = MFT2Online.startGame(Lobby.difficulty);
    if (state) enterGame(state, { mode: 'host', myId: 0 });
    else toast('至少需要 2 位玩家才能開始');
  };
  document.querySelectorAll('#lobby-difficulty-row .diff-btn').forEach(b => {
    b.classList.toggle('on', b.dataset.lv === 'P');
    b.onclick = () => {
      Lobby.difficulty = b.dataset.lv;
      document.querySelectorAll('#lobby-difficulty-row .diff-btn').forEach(x => x.classList.toggle('on', x === b));
    };
  });
  showScreen('screen-lobby');
}

function renderLobbyChars() {
  const box = $('lobby-chars');
  box.innerHTML = '';
  DATA.CHARACTERS.forEach(c => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'char-card' + (Lobby.char === c.id ? ' on' : '');
    card.innerHTML =
      '<div class="char-emoji" style="border-color:' + c.color + '">' + c.emoji + '</div>' +
      '<div class="char-name">' + c.name + '</div>' +
      '<div class="char-passive">' + c.passive + '</div>' +
      '<div class="char-bio">' + c.bio.map(esc).join('<br>') + '</div>';
    card.onclick = () => { Lobby.char = c.id; renderLobbyChars(); };
    box.appendChild(card);
  });
}

function lobbyName() {
  const name = $('input-lobby-name').value.trim().slice(0, 12) || '玩家';
  const prof = getProfile();
  prof.nickname = name;
  Store.set(LSK.profile, prof);
  return name;
}

function showLobbyRoom(isHost) {
  Lobby.isHost = isHost;
  $('lobby-entry').classList.add('hidden');
  $('lobby-room').classList.remove('hidden');
  $('lobby-code-row').classList.toggle('hidden', !isHost);
  $('lobby-difficulty-row').classList.toggle('hidden', !isHost);
  $('btn-lobby-start').classList.toggle('hidden', !isHost);
  $('lobby-wait-note').textContent = isHost ? '分享房間碼給朋友，齊 2 人即可開局' : '等待房主開始遊戲…';
}

function renderLobbyPlayers(players) {
  const box = $('lobby-players');
  box.innerHTML = players.map((p, i) => {
    const c = charOf(p.charId);
    return '<div class="lobby-player"><span class="pbar-emoji" style="background:' + c.color + '">' + c.emoji +
      '</span><span>' + esc(p.name) + '</span>' + (i === 0 ? '<span class="muted">（房主）</span>' : '') + '</div>';
  }).join('');
}

function hostRoom() {
  if (!(window.MFT2Online && MFT2Online.available)) { toast('網絡不可用'); return; }
  $('lobby-status').textContent = '正在建立房間…';
  MFT2Online.hostGame({ name: lobbyName(), charId: Lobby.char })
    .then(code => {
      $('lobby-code-display').textContent = code;
      $('lobby-status').textContent = '';
      showLobbyRoom(true);
    })
    .catch(err => { $('lobby-status').textContent = '建立失敗：' + (err && err.message ? err.message : '網絡錯誤'); });
}

function joinRoom() {
  if (!(window.MFT2Online && MFT2Online.available)) { toast('網絡不可用'); return; }
  const code = $('input-lobby-code').value.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) { toast('請輸入 6 位房間碼'); return; }
  $('lobby-status').textContent = '正在加入房間…';
  MFT2Online.joinGame(code, { name: lobbyName(), charId: Lobby.char })
    .then(() => {
      $('lobby-status').textContent = '';
      showLobbyRoom(false);
    })
    .catch(err => { $('lobby-status').textContent = '加入失敗：' + (err && err.message ? err.message : '找不到房間'); });
}

/* ---------- online.js 回調掛接 ---------- */
function wireOnline() {
  if (!window.MFT2Online) return;
  MFT2Online.onLobbyUpdate = players => renderLobbyPlayers(players);
  MFT2Online.onState = (state, myId) => {
    if (Net.mode === 'host') return; // 房主本地已渲染
    Net.inGame = true;
    if (!$('screen-game').classList.contains('active') || !G.state) {
      enterGame(state, { mode: 'client', myId: myId });
    } else {
      G.state = state;
      render();
    }
  };
  MFT2Online.onIntent = (playerId, action) => {
    // 房主端：驗證並執行客戶端意圖
    if (Net.mode !== 'host' || !G.state || G.state.over) return;
    const pd = G.state.pending;
    if (!pd || pd.player !== playerId) return;
    if (G.state.players[playerId].isAI) return; // 已由 AI 託管
    action.player = playerId;
    const res = MFT2.Engine.act(G.state, action);
    if (res.ok) {
      MFT2Online.broadcast(G.state);
      render();
    }
  };
  MFT2Online.onPeerDropped = playerId => {
    // 斷線玩家交由 AI 託管
    if (Net.mode !== 'host' || !G.state || G.state.over) return;
    const p = G.state.players[playerId];
    if (p && !p.isAI && !p.bankrupt) {
      p.isAI = true;
      G.state.log.push('🔌 ' + p.name + ' 斷線，由 AI 託管。');
      MFT2Online.broadcast(G.state);
      render();
    }
  };
  MFT2Online.onClosed = msg => {
    if (Net.inGame || $('screen-lobby').classList.contains('active')) {
      toast(msg || '連線已中斷');
      Net.mode = 'local'; Net.inGame = false;
      showScreen('screen-menu');
    }
  };
}

/* ==================== 遊戲界面按鈕與啟動 ==================== */
function initGameButtons() {
  $('btn-roll').onclick = () => {
    const pd = G.state && G.state.pending;
    if (pd && pd.kind === 'roll') dispatch({ type: 'roll', player: pd.player });
  };
  $('btn-end-turn').onclick = () => {
    const pd = G.state && G.state.pending;
    if (pd && pd.kind === 'turnEnd') { pendingModalKey = null; dispatch({ type: 'end', player: pd.player }); }
  };
  $('btn-manage').onclick = openManage;
  $('btn-game-quit').onclick = () => {
    openModal('離開遊戲？', '<p class="notice-text">目前進度將不會保存（圖鑑收集會保留）。</p>', [
      { label: '繼續遊戲', onClick: closeModal },
      { label: '確認離開', cls: 'btn-ghost', onClick: () => {
        closeModal();
        if (window.MFT2Online) MFT2Online.leave();
        Net.mode = 'local'; Net.inGame = false;
        clearTimeout(G.aiTimer);
        G.state = null;
        showScreen('screen-menu');
      } }
    ]);
  };
  $('btn-tut-close').onclick = () => {
    Store.set(LSK.tut, true);
    $('tutorial-bubble').classList.add('hidden');
  };
  window.addEventListener('resize', () => {
    if (G.state && !G.animating) G.state.players.forEach((p, i) => { if (!p.bankrupt) placeToken(p.id, p.pos, i); });
  });
}

function boot() {
  initMenu();
  initGameButtons();
  wireOnline();
  $('btn-help-back').onclick = () => showScreen('screen-menu');
  showScreen('screen-menu');
}

// 等 online.js 偵測完 PeerJS 再刷新主菜單聯機按鈕狀態
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    boot();
    if (window.MFT2Online && MFT2Online.ready) MFT2Online.ready.then(initMenu);
  });
} else {
  boot();
  if (window.MFT2Online && MFT2Online.ready) MFT2Online.ready.then(initMenu);
}

})(typeof window !== 'undefined' ? window : globalThis);
