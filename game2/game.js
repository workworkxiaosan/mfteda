/* ==========================================================
   濠港雙城大亨 v2 — game.js（3D 大地圖娛樂版）
   港澳文化大富翁 · 澳門財經科技與教育發展學會
   純 Vanilla JS 零構建。引擎（MFT2.Engine）與 DOM/渲染完全解耦，
   地圖路徑（(x,y) 有序坐標）由生成器產生，2D/3D 渲染共用。
   Node 環境 require 本文件可直接跑引擎煙霧測試。
   ========================================================== */
(function (global) {
'use strict';

/* ==================== 一、內容數據 ==================== */

// 15 位歷史人物角色（各帶小幅被動）
const CHARACTERS = [
  { id: 'zheng', name: '鄭觀應', emoji: '📜', color: '#8d5a3b', passive: '文脈卡答對獎金 +$50',
    bio: ['晚清思想家，澳門鄭家大屋主人。', '在此寫成《盛世危言》，主張變法圖強。', '其思想啟發了康有為、孫中山等後人。'] },
  { id: 'ricci', name: '利瑪竇', emoji: '⛪', color: '#2c6e9e', passive: '購買地標 95 折',
    bio: ['意大利傳教士，1582 年抵華首站澳門。', '在澳學習中文後北上，繪製《坤輿萬國全圖》。', '被譽為中西文化交流先驅。'] },
  { id: 'xian', name: '冼星海', emoji: '🎵', color: '#b8860b', passive: '經過起點額外 +$50',
    bio: ['1905 年生於澳門漁民家庭。', '代表作《黃河大合唱》激勵抗戰軍民。', '被譽為「人民音樂家」。'] },
  { id: 'sun', name: '孫中山', emoji: '🩺', color: '#a33b3b', passive: '機緣卡負面金額減半',
    bio: ['革命先行者，1892 年畢業於香港西醫書院。', '曾在澳門鏡湖醫院行醫，為該院首位西醫。', '行醫同時宣傳救國思想。'] },
  { id: 'jin', name: '金庸', emoji: '🖋️', color: '#3e6e4e', passive: '收取租金 +10%',
    bio: ['香港文學巨匠，武俠小說宗師。', '《射鵰英雄傳》《笑傲江湖》等膾炙人口。', '創辦《明報》，「有華人的地方就有金庸」。'] },
  { id: 'mazu', name: '媽祖', emoji: '🌊', color: '#3a7ca5', passive: '幸運輪盤結果必為正收益',
    bio: ['海上守護神，本名林默娘。', '澳門媽閣廟香火千年不絕。', '相傳「Macau」之名正源於媽閣。'] },
  { id: 'camoes', name: '賈梅士', emoji: '🪶', color: '#6b5b95', passive: '機緣卡正面效果 +$50',
    bio: ['葡萄牙偉大詩人。', '據傳在澳門白鴿巢賈梅士洞寫作《葡國魂》。', '史詩歌頌葡人航海事跡。'] },
  { id: 'lin', name: '林則徐', emoji: '⚖️', color: '#546e7a', passive: '被罰留堂回合數 -1（最少 0）',
    bio: ['1839 年以欽差大臣身份巡閱澳門。', '在澳查禁鴉片、整頓海防。', '近代中國「開眼看世界第一人」。'] },
  { id: 'rong', name: '容閎', emoji: '🎓', color: '#7d6608', passive: '文脈卡答錯仍得一半獎金',
    bio: ['中國留學生之父，出身香山南屏。', '首位畢業於耶魯大學的中國人。', '促成幼童留美計劃，推動近代教育。'] },
  { id: 'hotung', name: '何東', emoji: '💼', color: '#8e6e3a', passive: '初始資金 +$300',
    bio: ['香港歐亞混血首富、大慈善家。', '捐資興學，澳門有何東圖書館紀念他。', '熱心公益，澤及港澳兩地。'] },
  { id: 'rao', name: '饒宗頤', emoji: '📚', color: '#4a6fa5', passive: '文脈卡答對獎金 ×1.5',
    bio: ['國學大師，香港中文大學榮休講座教授。', '甲骨學、敦煌學成就卓著。', '與季羨林並稱「南饒北季」。'] },
  { id: 'bruce', name: '李小龍', emoji: '🥋', color: '#c0392b', passive: '每次移動額外 +1 格（每回合一次）',
    bio: ['香港國際武打巨星、武術哲學家。', '創立截拳道，弘揚中華武術。', '星光大道有其銅像，影迷朝聖之地。'] },
  { id: 'yip', name: '葉問', emoji: '🤜', color: '#5d4037', passive: '支付租金 9 折',
    bio: ['詠春宗師，五十年代起在香港授徒。', '李小龍即出自其門下。', '將詠春發揚至世界各地。'] },
  { id: 'anita', name: '梅艷芳', emoji: '🎤', color: '#ad1457', passive: '經過茶餐廳/機緣格 +$30',
    bio: ['香港百變天后、舞台傳奇。', '《似水流年》《女人花》膾炙人口。', '熱心公益，被譽為「香港的女兒」。'] },
  { id: 'gao', name: '高劍父', emoji: '🖌️', color: '#00695c', passive: '升級建築 9 折',
    bio: ['嶺南畫派創始人之一。', '曾寓居澳門，推動藝術革新。', '主張「折衷中西，融會古今」。'] }
];

// 12 個色系地段組
const GROUPS = {
  brown:     { name: '澳門半島組',   color: '#8d5a3b' },
  lightblue: { name: '澳門歷史城區組', color: '#5aa9c9' },
  indigo:    { name: '澳門文教組',   color: '#5c6bc0' },
  purple:    { name: '澳門老街組',   color: '#8e5ea2' },
  pink:      { name: '氹仔路環組',   color: '#d46a92' },
  teal:      { name: '路環海岸組',   color: '#26a69a' },
  orange:    { name: '澳門新地標組',  color: '#d98a2b' },
  red:       { name: '香港港島組',   color: '#b03a2e' },
  crimson:   { name: '維港都會組',   color: '#c2185b' },
  yellow:    { name: '香港九龍組',   color: '#c9a227' },
  lime:      { name: '香港文化場館組', color: '#7cb342' },
  green:     { name: '香港離島郊野組', color: '#3e8e5a' }
};

// 70 個地標（澳門 35 + 香港 35），開局時沿路徑分組依序鋪排，地價 $60→$800 遞增
const LANDMARKS = [
  // ---- 澳門半島組（棕）----
  { name: '議事亭前地', group: 'brown', city: 'mo', info: '澳門市中心廣場，黑白碎石葡式波浪紋地面是標誌，周邊盡是世遺建築。' },
  { name: '大三巴牌坊', group: 'brown', city: 'mo', info: '聖保祿教堂前壁，1835 年大火後僅存牌坊，是澳門最著名地標。' },
  { name: '哪吒廟', group: 'brown', city: 'mo', info: '緊鄰大三巴的中式小廟，哪吒信俗已列入澳門非遺，見證中西共存。' },
  // ---- 澳門歷史城區組（淺藍）----
  { name: '媽閣廟', group: 'lightblue', city: 'mo', info: '澳門最古老廟宇之一。相傳葡人登岸問地名，漁民答「媽閣」，音譯成「Macau」。' },
  { name: '鄭家大屋', group: 'lightblue', city: 'mo', info: '晚清思想家鄭觀應故居，《盛世危言》在此寫成，嶺南大宅融合中西風格。' },
  { name: '大炮台', group: 'lightblue', city: 'mo', info: '建於 1617 年，曾是澳門防禦核心，登高可俯瞰半島全景。' },
  { name: '東望洋燈塔', group: 'lightblue', city: 'mo', info: '中國海岸第一座現代燈塔，1865 年啟用，旁有聖母雪地殿教堂。' },
  { name: '舊城牆遺址', group: 'lightblue', city: 'mo', info: '明代澳門城牆僅存的一段，夯土結構訴說四百年城市變遷。' },
  { name: '盧家大屋', group: 'lightblue', city: 'mo', info: '清末商人盧華紹故居，青磚大宅配蠔殼窗，是嶺南建築精品。' },
  // ---- 澳門文教組（靛藍）----
  { name: '崗頂劇院', group: 'indigo', city: 'mo', info: '1860 年建成的伯多祿五世劇院，是中國第一座西式劇院。' },
  { name: '何東圖書館', group: 'indigo', city: 'mo', info: '由何東爵士故居改建，庭園式圖書館藏身鬧市，書香與古蹟交融。' },
  { name: '聖若瑟修院', group: 'indigo', city: 'mo', info: '培養入華傳教士的搖籃，教堂穹頂莊嚴，有「小三巴」之稱。' },
  { name: '玫瑰堂', group: 'indigo', city: 'mo', info: '四百多年歷史的巴洛克教堂，奶油色外牆配綠百葉，溫柔典雅。' },
  { name: '主教山', group: 'indigo', city: 'mo', info: '西望洋山上海崖聖母小堂，可眺望澳門塔與西灣湖景致。' },
  { name: '澳門博物館', group: 'indigo', city: 'mo', info: '坐落大炮台之上，立體呈現澳門四百年中西交匯歷史。' },
  // ---- 澳門老街組（紫）----
  { name: '福隆新街', group: 'purple', city: 'mo', info: '百年「紅窗門街」，騎樓林立，曾是繁華煙花地，今為美食老街。' },
  { name: '十月初五街', group: 'purple', city: 'mo', info: '紀念葡國革命的老街，內港風情濃厚，老字號餅家林立。' },
  { name: '關前正街', group: 'purple', city: 'mo', info: '昔日海關前的老街，如今文創小店與塗鴉進駐，新舊交融。' },
  { name: '草堆街', group: 'purple', city: 'mo', info: '因昔日堆放稻草得名，布匹老店聚集，充滿市井氣息。' },
  { name: '營地大街', group: 'purple', city: 'mo', info: '因昔日軍營得名，如今是澳門最熱鬧的購物街之一。' },
  { name: '三盞燈', group: 'purple', city: 'mo', info: '圓形地五街交匯，緬甸僑民美食聚集地，東南亞風味濃郁。' },
  // ---- 氹仔路環組（粉）----
  { name: '官也街', group: 'pink', city: 'mo', info: '氹仔著名手信美食街，杏仁餅、豬扒包、葡撻香氣四溢。' },
  { name: '龍環葡韻', group: 'pink', city: 'mo', info: '五幢粉綠色葡式洋房，「龍環」是氹仔舊稱，盡顯南歐風情。' },
  { name: '路環聖方濟各堂', group: 'pink', city: 'mo', info: '路環海邊的鵝黃色小教堂，葡撻始祖安德魯餅店就在附近。' },
  { name: '氹仔天后宮', group: 'pink', city: 'mo', info: '氹仔最古老的廟宇之一，見證漁村歲月與天后信仰。' },
  // ---- 路環海岸組（青）----
  { name: '黑沙海灘', group: 'teal', city: 'mo', info: '澳門最大的天然海灘，黑色幼沙是海水與礦物的傑作。' },
  { name: '竹灣', group: 'teal', city: 'mo', info: '路環幽靜海灣，竹灣酒店與泳棚充滿南歐度假風情。' },
  { name: '九澳聖母村', group: 'teal', city: 'mo', info: '昔日痲瘋病療養村落，彩色小屋修復後訴說人道關懷歷史。' },
  // ---- 澳門新地標組（橙）----
  { name: '澳門旅遊塔', group: 'orange', city: 'mo', info: '高 338 米，設有全球最高商業笨豬跳，俯瞰珠澳兩地景致。' },
  { name: '澳門科學館', group: 'orange', city: 'mo', info: '由貝聿銘設計的銀色螺旋建築，是寓教於樂的科普基地。' },
  { name: '港珠澳大橋', group: 'orange', city: 'mo', info: '全長 55 公里，是世界最長跨海大橋，2018 年通車連接粤港澳三地。' },
  { name: '新馬路', group: 'orange', city: 'mo', info: '亞美打利庇盧大馬路，澳門百年商業中軸，騎樓連廊人來人往。' },
  { name: '白鴿巢公園', group: 'orange', city: 'mo', info: '澳門最古老公園之一，賈梅士洞藏身其中，綠蔭處處。' },
  { name: '賈梅士洞', group: 'orange', city: 'mo', info: '白鴿巢公園內的石洞，相傳葡國詩人賈梅士在此寫作《葡國魂》。' },
  { name: '亞婆井前地', group: 'orange', city: 'mo', info: '昔日城市水源之地，「飲過亞婆井水，忘不了澳門」的民謠流傳至今。' },
  // ---- 香港港島組（紅）----
  { name: '太平山頂', group: 'red', city: 'hk', info: '港島最高點，維港夜景世界聞名，是遊客必到之地。' },
  { name: '山頂纜車', group: 'red', city: 'hk', info: '1888 年通車，是亞洲最早的纜索鐵路之一，至今仍然服務市民。' },
  { name: '大館', group: 'red', city: 'hk', info: '舊中區警署建築群活化而成，集古蹟、藝術與美食於一身。' },
  { name: '中環街市', group: 'red', city: 'hk', info: '1939 年落成的包浩斯風格街市，活化後成為文創熱點。' },
  { name: '金紫荊廣場', group: 'red', city: 'hk', info: '1997 年香港回歸交接儀式舉行地，「永遠盛開的紫荊花」矗立海旁。' },
  { name: '大坑', group: 'red', city: 'hk', info: '中秋舞火龍的故鄉，百年火龍插滿線香，祈求驅疫平安。' },
  // ---- 維港都會組（緋紅）----
  { name: '維多利亞港', group: 'crimson', city: 'hk', info: '世界三大夜景之一，「幻彩詠香江」燈光秀每晚照亮兩岸。' },
  { name: '赤柱市集', group: 'crimson', city: 'hk', info: '港島南區海濱市集，工藝品與美食並存，充滿度假氣息。' },
  { name: '淺水灣', group: 'crimson', city: 'hk', info: '香港最著名泳灘，水清沙幼，鎮海樓觀音像面向大海。' },
  { name: '石澳', group: 'crimson', city: 'hk', info: '港島東南小漁村，色彩繽紛，是行山與滑浪勝地。' },
  // ---- 香港九龍組（黃）----
  { name: '尖沙咀鐘樓', group: 'yellow', city: 'hk', info: '1915 年建成的九廣鐵路總站遺存，見證香港百年鐵路史。' },
  { name: '星光大道', group: 'yellow', city: 'hk', info: '表揚香港電影巨星的手印大道，李小龍銅像是打卡熱點。' },
  { name: '廟街夜市', group: 'yellow', city: 'hk', info: '九龍最地道夜市，大牌檔、粵曲與占卜攤檔充滿市井風情。' },
  { name: '旺角女人街', group: 'yellow', city: 'hk', info: '通菜街露天市集，攤檔密密麻麻，是平民購物天堂。' },
  { name: '深水埗鴨寮街', group: 'yellow', city: 'hk', info: '電子零件與懷舊好物集散地，掃貨尋寶別有樂趣。' },
  { name: '黃大仙祠', group: 'yellow', city: 'hk', info: '香港最著名的廟宇之一，「有求必應」香火鼎盛。' },
  { name: '九龍寨城公園', group: 'yellow', city: 'hk', info: '昔日「三不管」寨城遺址，改建為江南園林式公園。' },
  { name: '獅子山', group: 'yellow', city: 'hk', info: '香港精神象徵，「獅子山下」唱出港人拼搏故事。' },
  // ---- 香港文化場館組（淺綠）----
  { name: '香港故宮文化博物館', group: 'lime', city: 'hk', info: '2022 年開幕，展出故宮博物院珍貴文物，古今對話、中西交融。' },
  { name: 'M+博物館', group: 'lime', city: 'hk', info: '亞洲首間全球性當代視覺文化博物館，坐落西九文化區。' },
  { name: '香港文化博物館', group: 'lime', city: 'hk', info: '沙田綜合博物館，李小龍與粵劇展覽最受歡迎。' },
  { name: '香港歷史博物館', group: 'lime', city: 'hk', info: '「香港故事」常設展，立體呈現四億年自然與人文變遷。' },
  { name: '香港太空館', group: 'lime', city: 'hk', info: '尖沙咀海旁的蛋形天象廳，帶領觀眾遨遊宇宙。' },
  { name: '香港藝術館', group: 'lime', city: 'hk', info: '香港首所公共美術館，館藏中國書畫與本地藝術珍品。' },
  // ---- 香港離島郊野組（綠）----
  { name: '天壇大佛', group: 'green', city: 'hk', info: '大嶼山寶蓮禪寺旁的青銅大佛，1993 年開光，是全球最高戶外青銅坐佛之一。' },
  { name: '寶蓮禪寺', group: 'green', city: 'hk', info: '大嶼山百年古剎，萬佛寶殿莊嚴，齋菜遠近馳名。' },
  { name: '昂坪 360 纜車', group: 'green', city: 'hk', info: '5.7 公里纜車旅程，飽覽大嶼山山海景致直達昂坪。' },
  { name: '南丫島', group: 'green', city: 'hk', info: '香港第三大島，周潤發的故鄉，以海鮮和風力發電聞名。' },
  { name: '長洲', group: 'green', city: 'hk', info: '太平清醮搶包山的故鄉，小島風情與滑浪風帆運動並存。' },
  { name: '坪洲', group: 'green', city: 'hk', info: '寧靜小島，牛皮廠活化為藝術村，慢活節奏令人嚮往。' },
  { name: '大澳漁村', group: 'green', city: 'hk', info: '有「香港威尼斯」之稱，棚屋水上人家保留傳統漁村風貌。' },
  { name: '西貢地質公園', group: 'green', city: 'hk', info: '聯合國教科文組織世界地質公園，六角形岩柱舉世罕見。' },
  { name: '香港濕地公園', group: 'green', city: 'hk', info: '天水圍生態寶庫，紅樹林與招潮蟹是候鳥天堂的鄰居。' },
  { name: '沙田車公廟', group: 'green', city: 'hk', info: '香火鼎盛的古廟，年初三轉風車祈求來年好運。' },
  { name: '屏山文物徑', group: 'green', city: 'hk', info: '香港首條文物徑，鄧族圍村宗祠訴說新界千年歷史。' }
];

// 10 張地圖走勢（網格路徑生成器，見 MAP_GENERATORS）
const MAPS = [
  { id: 'ring',    name: '經典環形' },
  { id: 'snake',   name: '蛇形 S' },
  { id: 'spiral',  name: '螺旋向心' },
  { id: 'eight',   name: '雙城 8 字' },
  { id: 'zigzag',  name: '之字 Z 形' },
  { id: 'wave',    name: '波浪形' },
  { id: 'double',  name: '回字雙層' },
  { id: 'cross',   name: '十字交叉' },
  { id: 'maze',    name: '迷宮折線' },
  { id: 'bay',     name: '海灣弧線' }
];

// 道具（每人最多持 2 件）
const ITEMS = {
  rentFree: { name: '免租金牌', emoji: '🛡️', price: 150, desc: '使用後豁免下一次租金。' },
  doubleDice: { name: '雙倍骰', emoji: '🎲', price: 120, desc: '即刻擲雙倍點數骰（2×）。' },
  turnCard: { name: '轉向卡', emoji: '↩️', price: 100, desc: '本回合起改變行進方向。' },
  moveCard: { name: '搬遷卡', emoji: '🔄', price: 200, desc: '與對手交換一塊同色組地標（AI 按估價自動判斷）。' }
};
const ITEM_KEYS = Object.keys(ITEMS);

// 機緣卡（18 張，港澳當代盛事，每張帶知識文案；c16 直送自修室即「被罰留堂」）
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

// 文脈卡題庫（56 題：小學 28 + 中學 28，4 選 1 附解析；lv: P=小學 S=中學）
const QUESTIONS = [
  // ===== 小學 P（28 題）=====
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
  { id: 'p14', lv: 'P', q: '大坑舞火龍在哪個節日舉行？', opts: ['中秋節', '農曆新年', '端午節', '重陽節'], ans: 0, exp: '大坑舞火龍有過百年歷史，相傳插滿線香的火龍可驅走瘟疫，已列入香港非遺。' },
  { id: 'p15', lv: 'P', q: '港珠澳大橋全長約多少公里？', opts: ['55 公里', '15 公里', '35 公里', '105 公里'], ans: 0, exp: '港珠澳大橋全長 55 公里，2018 年通車，是世界最長的跨海大橋。' },
  { id: 'p16', lv: 'P', q: '澳門是在哪一年 12 月 20 日回歸祖國的？', opts: ['1999 年', '1997 年', '2000 年', '1998 年'], ans: 0, exp: '1999 年 12 月 20 日澳門回歸，成立澳門特別行政區。' },
  { id: 'p17', lv: 'P', q: '香港是在 1997 年哪一天回歸祖國的？', opts: ['7 月 1 日', '8 月 1 日', '10 月 1 日', '12 月 20 日'], ans: 0, exp: '1997 年 7 月 1 日香港回歸，金紫荊廣場每天舉行升旗禮。' },
  { id: 'p18', lv: 'P', q: '粤港澳大灣區由珠三角 9 市加哪兩個特別行政區組成？', opts: ['香港、澳門', '香港、台灣', '澳門、珠海', '深圳、香港'], ans: 0, exp: '大灣區「9+2」城市包括廣州、深圳等 9 市加香港、澳門兩個特區。' },
  { id: 'p19', lv: 'P', q: '以下哪種是香港地道街頭小食，外形像一格格小雞蛋？', opts: ['雞蛋仔', '葡撻', '豬扒包', '砵仔糕'], ans: 0, exp: '雞蛋仔 1950 年代起源於香港，外脆內軟，蛋香四溢。' },
  { id: 'p20', lv: 'P', q: '澳門著名美食豬扒包的特色是甚麼？', opts: ['香脆麵包夾香煎豬扒', '豬肉湯泡麵包', '豬扒拌飯', '豬肉夾饅頭'], ans: 0, exp: '豬扒包以香脆豬仔包夾上香煎帶骨豬扒，是澳門必吃美食。' },
  { id: 'p21', lv: 'P', q: '「幻彩詠香江」是維多利亞港每晚舉行的甚麼表演？', opts: ['燈光音樂匯演', '煙花比賽', '龍舟賽', '無人機表演'], ans: 0, exp: '幻彩詠香江是全球最大型恆常燈光音樂匯演，兩岸大廈聯合演出。' },
  { id: 'p22', lv: 'P', q: '粤語（廣東話）以聲調豐富著稱，大約有多少個聲調？', opts: ['九聲六調', '四聲', '兩聲', '十二聲'], ans: 0, exp: '粤語有「九聲六調」，比普通話四聲更豐富，是嶺南文化載體。' },
  { id: 'p23', lv: 'P', q: '嶺南騎樓最大的特色是甚麼？', opts: ['樓上住人、地面有蓋行人廊', '全部用竹子建成', '屋頂有龍', '沒有窗戶'], ans: 0, exp: '騎樓上居下舖，有蓋長廊可遮陽擋雨，廣州、澳門新馬路隨處可見。' },
  { id: 'p24', lv: 'P', q: '橫琴粵澳深度合作區位於澳門旁邊的哪個城市？', opts: ['珠海', '廣州', '深圳', '中山'], ans: 0, exp: '橫琴與澳門一水之隔，2021 年設立粵澳深度合作區，促進澳門多元發展。' },
  { id: 'p25', lv: 'P', q: '澳門哪吒廟供奉的哪吒，與下列哪個著名地標相鄰？', opts: ['大三巴牌坊', '媽閣廟', '旅遊塔', '關閘'], ans: 0, exp: '哪吒廟緊鄰大三巴，中式廟宇與西式教堂遺址並存，哪吒信俗是澳門非遺。' },
  { id: 'p26', lv: 'P', q: '昂坪 360 纜車通往香港哪個景點？', opts: ['天壇大佛', '太平山頂', '海洋公園', '濕地公園'], ans: 0, exp: '昂坪 360 纜車全長 5.7 公里，直達昂坪市集與天壇大佛。' },
  { id: 'p27', lv: 'P', q: '西貢地質公園最著名的是甚麼地貌？', opts: ['六角形岩柱', '沙漠沙丘', '冰川峽谷', '石灰岩溶洞'], ans: 0, exp: '西貢的六角形火山岩柱舉世罕見，已列入聯合國教科文組織世界地質公園。' },
  { id: 'p28', lv: 'P', q: '農曆年初三，香港人常到哪座廟「轉風車」求好運？', opts: ['沙田車公廟', '黃大仙祠', '天后廟', '文武廟'], ans: 0, exp: '相傳車公是南宋大元帥，年初三轉風車寓意時來運轉。' },
  // ===== 中學 S（28 題）=====
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
  { id: 's14', lv: 'S', q: '舞獅「採青」所用的「青」通常是甚麼？寓意為何？', opts: ['生菜，諧音「生財」', '青草，寓意長青', '青椒，寓意紅火', '青瓜，寓意清爽'], ans: 0, exp: '獅子採得生菜後拋向主人家，寓意「生財」好意頭，是嶺南傳統習俗。' },
  { id: 's15', lv: 'S', q: '利瑪竇繪製的哪幅世界地圖，向中國介紹了五大洲觀念？', opts: ['《坤輿萬國全圖》', '《皇輿全覽圖》', '《天下全圖》', '《海國圖志》'], ans: 0, exp: '《坤輿萬國全圖》是首幅中文世界地圖，開拓了明末士人的世界視野。' },
  { id: 's16', lv: 'S', q: '金庸曾以詩句概括其十四部武俠小說，正確的是？', opts: ['飛雪連天射白鹿，笑書神俠倚碧鴛', '琴棋書畫詩酒花，刀光劍影走天涯', '七劍下天山，雙俠闖江湖', '江湖夜雨十年燈'], ans: 0, exp: '上聯「飛雪連天射白鹿」、下聯「笑書神俠倚碧鴛」各嵌七部書名首字。' },
  { id: 's17', lv: 'S', q: '1839 年巡閱澳門、查禁鴉片的欽差大臣是誰？', opts: ['林則徐', '曾國藩', '李鴻章', '左宗棠'], ans: 0, exp: '林則徐 1839 年巡閱澳門禁煙，同年在虎門銷毀鴉片。' },
  { id: 's18', lv: 'S', q: '「中國留學生之父」容閎，是首位畢業於哪所大學的中國人？', opts: ['耶魯大學', '哈佛大學', '牛津大學', '劍橋大學'], ans: 0, exp: '容閎 1854 年畢業於耶魯大學，其後促成幼童留美計劃。' },
  { id: 's19', lv: 'S', q: '「澳門八景」中，以東望洋燈塔為核心的景觀稱為？', opts: ['燈塔松濤', '鏡海長虹', '三巴聖跡', '龍環葡韻'], ans: 0, exp: '「燈塔松濤」描寫松山燈塔與松林景致；澳門八景於 1992 年評出。' },
  { id: 's20', lv: 'S', q: '《盛世危言》對近代中國最重要的思想貢獻是甚麼？', opts: ['主張變法圖強、發展工商', '提倡閉關鎖國', '主張全盤西化', '反對興辦學校'], ans: 0, exp: '鄭觀應主張商戰、議院與新學，啟發維新與革命兩代人。' },
  { id: 's21', lv: 'S', q: '港珠澳大桥的建成通車年份與工程地位是？', opts: ['2018 年，世界最長跨海大橋', '2010 年，世界最高橋', '2022 年，世界最長隧道', '2008 年，世界首座跨海橋'], ans: 0, exp: '大橋集橋、島、隧於一身，2018 年通車，創下多項世界紀錄。' },
  { id: 's22', lv: 'S', q: '「幻彩詠香江」金氏世界紀錄身份是？', opts: ['全球最大型恆常燈光音樂匯演', '全球最大煙花匯演', '全球最長無人機表演', '全球最大音樂噴泉'], ans: 0, exp: '匯演自 2004 年起每晚舉行，兩岸逾 40 幢大廈參與。' },
  { id: 's23', lv: 'S', q: '九龍寨城公園的前身「九龍寨城」，歷史上以甚麼聞名？', opts: ['三不管地帶、人口極稠密', '皇家園林', '英軍總部', '漁業碼頭'], ans: 0, exp: '寨城曾是全球人口密度最高的社區，1994 年清拆後改建為江南園林式公園。' },
  { id: 's24', lv: 'S', q: '澳門哪吒信俗列入哪個級別的非物質文化遺產？', opts: ['國家級非遺名錄', '世界自然遺產', '世界記憶名錄', '全球農業遺產'], ans: 0, exp: '哪吒信俗 2014 年列入國家級非遺，每年哪吒誕有巡遊慶典。' },
  { id: 's25', lv: 'S', q: '橫琴粵澳深度合作區 2021 年掛牌，其核心使命是？', opts: ['促進澳門經濟適度多元發展', '建設國際金融中心', '發展重化工業', '取代澳門產業'], ans: 0, exp: '深合區發展科技、中醫藥、文旅會展等產業，為澳門拓展新空間。' },
  { id: 's26', lv: 'S', q: '高劍父創立的畫派及其主張是？', opts: ['嶺南畫派，折衷中西融會古今', '海上畫派，復古為新', '金陵畫派，師法自然', '嶺南畫派，全盤西化'], ans: 0, exp: '高劍父曾寓居澳門，其「折衷中西」主張深刻影響近代中國畫壇。' },
  { id: 's27', lv: 'S', q: '葉問宗師對詠春拳最大的貢獻是甚麼？', opts: ['在香港公開授徒，將詠春發揚至世界', '創立少林派', '發明太極拳', '創辦精武體育會'], ans: 0, exp: '葉問五十年代起在港授徒，李小龍即其門生，詠春由此走向世界。' },
  { id: 's28', lv: 'S', q: '澳門土生菜列入國家級非遺，其代表菜式不包括下列哪項？', opts: ['北京烤鴨', '非洲雞', '葡國雞', '免治肉'], ans: 0, exp: '非洲雞、葡國雞、免治肉都是土生菜代表，北京烤鴨屬北方菜系。' }
];

/* ==================== 二、地圖路徑生成器（10 種走勢，各 99 格）==================== */
/* 每張地圖 = 有序 [{x,y}] 列表，座標連通（步進 1）、無重複；渲染層與邏輯共用 */

function normPath(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    const k = p[0] + ',' + p[1];
    if (!seen.has(k)) { seen.add(k); out.push({ x: p[0], y: p[1] }); }
  }
  return out;
}

const MAP_GENERATORS = {
  // 1. 經典環形（26×26 外圈，100 格）
  ring() {
    const N = 25, p = [];
    for (let x = 0; x <= N; x++) p.push([x, 0]);
    for (let y = 1; y <= N; y++) p.push([N, y]);
    for (let x = N - 1; x >= 0; x--) p.push([x, N]);
    for (let y = N - 1; y >= 1; y--) p.push([0, y]);
    return p;
  },
  // 2. 蛇形 S（10×10 往返，100 格）
  snake() {
    const p = [];
    for (let y = 0; y < 10; y++) {
      if (y % 2 === 0) for (let x = 0; x < 10; x++) p.push([x, y]);
      else for (let x = 9; x >= 0; x--) p.push([x, y]);
    }
    return p;
  },
  // 3. 螺旋向心（10×10，100 格）
  spiral() {
    const p = [];
    let x0 = 0, y0 = 0, x1 = 9, y1 = 9;
    while (x0 <= x1 && y0 <= y1) {
      for (let x = x0; x <= x1; x++) p.push([x, y0]);
      for (let y = y0 + 1; y <= y1; y++) p.push([x1, y]);
      if (y1 > y0) for (let x = x1 - 1; x >= x0; x--) p.push([x, y1]);
      if (x1 > x0) for (let y = y1 - 1; y > y0; y--) p.push([x0, y]);
      x0++; y0++; x1--; y1--;
    }
    return p;
  },
  // 4. 雙城 8 字（左環弧 48 + 橋 3 + 右環弧 48 = 99；兩環於橋相接）
  eight() {
    const p = [];
    // 左環 13×13 弧：由 (12,5) 上行繞一圈到 (12,6)
    for (let y = 5; y >= 0; y--) p.push([12, y]);
    for (let x = 11; x >= 0; x--) p.push([x, 0]);
    for (let y = 1; y <= 12; y++) p.push([0, y]);
    for (let x = 1; x <= 12; x++) p.push([x, 12]);
    for (let y = 11; y >= 6; y--) p.push([12, y]);      // 48 格，止於 (12,6)
    p.push([13, 6]); p.push([14, 6]); p.push([15, 6]);  // 橋 3 格
    // 右環 13×13（x16..28）弧：由 (16,6) 下行繞一圈到 (16,5)
    p.push([16, 6]);
    for (let y = 7; y <= 12; y++) p.push([16, y]);
    for (let x = 17; x <= 28; x++) p.push([x, 12]);
    for (let y = 11; y >= 0; y--) p.push([28, y]);
    for (let x = 27; x >= 16; x--) p.push([x, 0]);
    for (let y = 1; y <= 5; y++) p.push([16, y]);       // 48 格
    return p; // 48 + 3 + 48 = 99
  },
  // 5. 之字 Z 形（13 橫行，103 格）
  zigzag() {
    const p = [];
    for (let r = 0; r < 13; r++) {
      const y = r * 2;
      if (r % 2 === 0) { for (let x = 0; x <= 6; x++) p.push([x, y]); if (r < 12) p.push([6, y + 1]); }
      else { for (let x = 6; x >= 0; x--) p.push([x, y]); if (r < 12) p.push([0, y + 1]); }
    }
    return p;
  },
  // 6. 波浪形（正弦曲線，垂直填充保持連通）
  wave() {
    const p = [];
    let prevY = 8;
    p.push([0, 8]);
    for (let x = 1; x <= 56; x++) {
      const target = 8 + Math.round(5 * Math.sin(x * Math.PI / 6));
      p.push([x, prevY]); // 先水平入列
      const dir = target > prevY ? 1 : -1;
      for (let y = prevY + dir; dir > 0 ? y <= target : y >= target; y += dir) p.push([x, y]);
      prevY = target;
    }
    return p; // ≈ 130 格
  },
  // 7. 回字雙層（外環 15×15 弧 + 連接 + 內環 11×11 弧，100 格）
  double() {
    const p = [];
    for (let x = 0; x <= 14; x++) p.push([x, 0]);
    for (let y = 1; y <= 14; y++) p.push([14, y]);
    for (let x = 13; x >= 0; x--) p.push([x, 14]);
    for (let y = 13; y >= 1; y--) p.push([0, y]);       // 外環 56 格
    p.push([1, 1]); p.push([2, 1]);                     // 連接 2 格
    for (let x = 2; x <= 13; x++) p.push([x, 2]);       // 內環 12×12 弧 44 格
    for (let y = 3; y <= 13; y++) p.push([13, y]);
    for (let x = 12; x >= 2; x--) p.push([x, 13]);
    for (let y = 12; y >= 3; y--) p.push([2, y]);
    return p; // 56 + 2 + 44 = 102
  },
  // 8. 十字交叉（十字形外環：臂寬 5、全寬 29，102 格）
  cross() {
    const p = [];
    const pts = [[12, 0], [16, 0], [16, 12], [28, 12], [28, 16], [16, 16], [16, 28], [12, 28], [12, 16], [0, 16], [0, 12], [12, 12]];
    for (let s = 0; s < pts.length; s++) {
      const a = pts[s], b = pts[(s + 1) % pts.length];
      const dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]);
      let x = a[0], y = a[1];
      p.push([x, y]);
      while (x !== b[0] || y !== b[1]) { x += dx; y += dy; p.push([x, y]); }
    }
    return p; // 12 段 × (4+5) − 角重複 ≈ 102
  },
  // 9. 迷宮折線（水平蛇行帶階梯，101 格）
  maze() {
    const p = [[0, 0]];
    let x = 0, y = 0, dir = 1;
    while (y <= 38) {
      for (let i = 1; i <= 3; i++) p.push([x + dir * i, y]);
      x = x + dir * 3;
      p.push([x, y + 1]);
      p.push([x, y + 2]);
      y = y + 2;
      dir = -dir;
    }
    return p;
  },
  // 10. 海灣弧線（外 U 61 + 內 U 57，118 格）
  bay() {
    const p = [];
    for (let y = 0; y <= 20; y++) p.push([0, y]);       // 左臂
    for (let x = 1; x <= 20; x++) p.push([x, 20]);      // 灣底
    for (let y = 19; y >= 0; y--) p.push([20, y]);      // 右臂（外 U 61 格）
    p.push([19, 0]);
    for (let y = 1; y <= 19; y++) p.push([19, y]);      // 內 U 右
    for (let x = 18; x >= 1; x--) p.push([x, 19]);      // 內 U 底
    for (let y = 18; y >= 1; y--) p.push([1, y]);       // 內 U 左（57 格）
    return p;
  }
};

function getMapPath(mapId) {
  const raw = MAP_GENERATORS[mapId]();
  return normPath(raw);
}

/* ==================== 三、遊戲引擎（無 DOM，可在 Node 運行）==================== */

const Engine = (function () {

  // 可序列化隨機數（LCG），快照同步後房主端繼續使用
  function rnd(state) {
    state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
    return state.seed / 4294967296;
  }
  function rndInt(state, n) { return Math.floor(rnd(state) * n); }

  // 佈局專用獨立隨機流（與遊戲進程隨機隔離，保證同房同佈局）
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const MAP_SIZE = 99;
  const FUNC_QUOTA = { chance: 6, quiz: 6, study: 1, goStudy: 1, cafe: 3, tax: 2, wheel: 2, cable: 2, doubleDice: 2, shop: 2, freeUp: 1 }; // 28 + 起點 = 29 功能格

  const TILE_META = {
    go:         { name: '起點 · 港澳碼頭', icon: '⛴️', info: '港澳碼頭是兩地往來的門戶。經過起點可領 $200 零用錢！' },
    chance:     { name: '機緣卡', icon: '🎴', info: '抽取機緣卡，觸發港澳當代盛事事件！' },
    quiz:       { name: '文脈卡', icon: '📖', info: '回答港澳文化歷史題，答對有獎金！' },
    tax:        { name: '交學費', icon: '🎓', info: '繳交 $100 學費。投資教育，豐儉由人！' },
    study:      { name: '自修室', icon: '📚', info: '被罰留堂的同學在此溫習。路過探望無事發生。' },
    goStudy:    { name: '被罰留堂', icon: '⛔', info: '哎呀！被老師抓到，直送自修室溫習！' },
    cafe:       { name: '茶餐廳休息站', icon: '🍵', info: '港式茶餐廳文化：絲襪奶茶配菠蘿油，歇一歇再出發！' },
    wheel:      { name: '幸運輪盤', icon: '🎡', info: '轉動幸運輪盤，隨機獎懲！媽祖保佑必定有賞。' },
    cable:      { name: '纜車傳送', icon: '🚠', info: '搭乘纜車直達前方 12 格，像昂坪 360 一樣飛馳！' },
    doubleDice: { name: '雙倍骰', icon: '🎲', info: '好運到！下回合擲骰點數 ×2。' },
    shop:       { name: '道具店', icon: '🏪', info: '老字號雜貨店：免租金牌、雙倍骰、轉向卡、搬遷卡，每人最多持 2 件。' },
    freeUp:     { name: '免費升級', icon: '⬆️', info: '市政美化計劃！免費升級一個地標（需已集齊同色組）。' }
  };

  // 生成棋盤佈局：路徑 99 格，格型分配，70 地標依序鋪排、地價 $60→$800 遞增
  function buildLayout(mapId, seed) {
    const path = getMapPath(mapId).slice(0, MAP_SIZE);
    const rng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
    const types = new Array(MAP_SIZE).fill('landmark');
    types[0] = 'go';
    // 均勻分布功能格：把 2..98 分段抽簽
    const slots = [];
    for (let i = 2; i < MAP_SIZE; i++) slots.push(i);
    // Fisher–Yates（佈局隨機流）
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = slots[i]; slots[i] = slots[j]; slots[j] = t;
    }
    let ptr = 0;
    const minGap = 2; // 同類功能格最小間距
    const placed = [];
    for (const [type, count] of Object.entries(FUNC_QUOTA)) {
      let need = count;
      while (need > 0) {
        // 找一個與已放功能格距離 >= minGap 的槽位
        let tries = 0, idx = -1;
        while (tries < 500) {
          const cand = slots[ptr % slots.length];
          ptr++;
          tries++;
          if (types[cand] !== 'landmark') continue;
          if (placed.every(s => Math.abs(s - cand) >= minGap || true)) { idx = cand; break; }
        }
        if (idx < 0) { idx = slots.find(s => types[s] === 'landmark'); }
        if (idx === undefined || idx < 0) break;
        types[idx] = type;
        placed.push(idx);
        need--;
      }
    }
    // 自修室格（探視用）記住位置
    // 地價遞增：第 k 個地標（沿路徑順序）
    const board = [];
    let lm = 0;
    for (let i = 0; i < MAP_SIZE; i++) {
      const pos = path[i];
      const base = { x: pos.x, y: pos.y, type: types[i] };
      if (types[i] === 'landmark') {
        const lmData = LANDMARKS[lm];
        board.push(Object.assign(base, {
          name: lmData.name, group: lmData.group, city: lmData.city, info: lmData.info,
          price: Math.round((60 + lm * (740 / (LANDMARKS.length - 1))) / 10) * 10,
          lmId: lm
        }));
        lm++;
      } else {
        board.push(Object.assign(base, { name: TILE_META[types[i]].name, icon: TILE_META[types[i]].icon, info: TILE_META[types[i]].info }));
      }
    }
    return { mapId: mapId, size: MAP_SIZE, path: path, board: board };
  }

  const layoutCache = {};
  function getLayout(mapId, seed) {
    const key = mapId + ':' + seed;
    if (!layoutCache[key]) layoutCache[key] = buildLayout(mapId, seed);
    return layoutCache[key];
  }

  function getChar(p) { return CHARACTERS.find(c => c.id === p.charId) || CHARACTERS[0]; }

  function addLog(state, msg) {
    state.log.push(msg);
    if (state.log.length > 80) state.log.splice(0, state.log.length - 80);
  }

  // 一次性特效標記（UI 播放後自行記錄 id 避免重播）
  function setFx(state, fx) {
    fx.id = 'fx' + (++state.animSeq);
    state.fx = fx;
  }

  function groupTiles(group) {
    return LANDMARKS.map((l, i) => l.group === group ? i : -1).filter(i => i >= 0);
  }

  function ownsFullGroup(state, ownerId, group) {
    const lmIds = groupTiles(group);
    return state.layout.board.every((t, i) =>
      t.type !== 'landmark' || t.group !== group || (state.props[i] && state.props[i].owner === ownerId));
  }

  function buyPrice(state, p, tileIdx) {
    let price = state.layout.board[tileIdx].price;
    if (p.charId === 'ricci') price = Math.round(price * 0.95); // 利瑪竇 95 折
    return price;
  }

  function upgradeCost(state, p, tileIdx) {
    let cost = Math.round(state.layout.board[tileIdx].price * 0.5);
    if (p && p.charId === 'gao') cost = Math.round(cost * 0.9); // 高劍父 9 折
    return cost;
  }

  // 連排：路徑上相鄰的同業主地標數（含本格，循環相鄰）
  function runLength(state, tileIdx) {
    const prop = state.props[tileIdx];
    if (!prop) return 0;
    const n = state.layout.size;
    const owner = prop.owner;
    const own = i => {
      const t = state.layout.board[i];
      const pr = state.props[i];
      return t.type === 'landmark' && pr && pr.owner === owner;
    };
    let len = 1;
    for (let s = 1; s < n; s++) { if (own((tileIdx + s) % n)) len++; else break; }
    for (let s = 1; s < n; s++) { if (own((tileIdx - s + n) % n)) len++; else break; }
    return len;
  }
  function runMult(len) { return len >= 4 ? 3 : len === 3 ? 2.5 : len === 2 ? 2 : 1; }

  // 全部連排段（≥2），供金帶標示
  function computeRuns(state) {
    const runs = [];
    const n = state.layout.size;
    const seen = new Set();
    for (let i = 0; i < n; i++) {
      const t = state.layout.board[i];
      const prop = state.props[i];
      if (!prop || t.type !== 'landmark' || seen.has(i)) continue;
      const cells = [i];
      seen.add(i);
      for (let s = 1; s < n; s++) {
        const j = (i + s) % n;
        const tj = state.layout.board[j], pj = state.props[j];
        if (tj.type === 'landmark' && pj && pj.owner === prop.owner && !seen.has(j)) { cells.push(j); seen.add(j); }
        else break;
      }
      if (cells.length >= 2) runs.push({ owner: prop.owner, cells: cells, mult: runMult(cells.length) });
    }
    return runs;
  }

  // 租金 = 地價10% ×（集齊×2）×（連排 2/2.5/3）×（1+0.5×級數）；金庸業主 +10%
  function calcRent(state, tileIdx) {
    const tile = state.layout.board[tileIdx];
    const prop = state.props[tileIdx];
    const base = Math.round(tile.price * 0.1);
    const gMult = ownsFullGroup(state, prop.owner, tile.group) ? 2 : 1;
    const rMult = runMult(runLength(state, tileIdx));
    let rent = Math.round(base * gMult * rMult * (1 + 0.5 * prop.level));
    const owner = state.players[prop.owner];
    if (owner && owner.charId === 'jin') rent = Math.round(rent * 1.1);
    return rent;
  }

  function assetValue(state, playerId) {
    const p = state.players[playerId];
    let total = Math.max(0, p.money);
    for (let i = 0; i < state.layout.size; i++) {
      const prop = state.props[i];
      if (prop && prop.owner === playerId) {
        total += state.layout.board[i].price + prop.level * upgradeCost(state, null, i);
      }
    }
    return total;
  }

  function ownedTiles(state, playerId) {
    const arr = [];
    for (let i = 0; i < state.layout.size; i++) {
      if (state.props[i] && state.props[i].owner === playerId) arr.push(i);
    }
    return arr;
  }

  function alivePlayers(state) { return state.players.filter(p => !p.bankrupt); }

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
    noteLeader(state);
  }

  function liquidate(state, playerId, creditorId, reason) {
    const p = state.players[playerId];
    let tiles = ownedTiles(state, playerId).sort((a, b) => state.layout.board[a].price - state.layout.board[b].price);
    while (p.money < 0 && tiles.length) {
      const i = tiles.shift();
      const prop = state.props[i];
      const value = Math.round((state.layout.board[i].price + prop.level * upgradeCost(state, null, i)) * 0.5);
      delete state.props[i];
      p.money += value;
      addLog(state, p.name + ' 半價拍賣了「' + state.layout.board[i].name + '」套現 $' + value + '。');
    }
    if (p.money < 0) {
      for (const i of ownedTiles(state, playerId)) {
        if (creditorId !== null && creditorId !== undefined && !state.players[creditorId].bankrupt) {
          state.props[i].owner = creditorId;
          addLog(state, '「' + state.layout.board[i].name + '」歸 ' + state.players[creditorId].name + ' 所有。');
        } else {
          delete state.props[i];
        }
      }
      p.bankrupt = true;
      p.money = 0;
      p.items = [];
      addLog(state, '💔 ' + p.name + ' 資不抵債，宣佈破產' + (reason ? '（' + reason + '）' : '') + '！');
      setFx(state, { type: 'bankrupt', player: playerId });
      checkEarlyWin(state);
    }
  }

  // 逆襲偵測：資產榜首易主時觸發彈幕
  function noteLeader(state) {
    if (state.over || state.round < 2) return;
    let best = null, bestV = -1;
    for (const p of state.players) {
      if (p.bankrupt) continue;
      const v = assetValue(state, p.id);
      if (v > bestV) { bestV = v; best = p.id; }
    }
    if (best !== null && state.lastLeader !== null && state.lastLeader !== best) {
      setFx(state, { type: 'comeback', player: best });
      addLog(state, '🔥 ' + state.players[best].name + ' 資產反超登頂，逆襲！');
    }
    state.lastLeader = best;
  }

  function checkEarlyWin(state) {
    const alive = alivePlayers(state);
    if (alive.length === 1 && state.players.length > 1 && !state.over) finishGame(state, alive[0].id);
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
    setFx(state, { type: 'fireworks', player: state.winner });
  }

  // 移動棋子（含方向、李小龍 +1、過起點獎勵）
  function movePlayer(state, p, steps, animId, tele) {
    if (steps === 0) return;
    const n = state.layout.size;
    const from = p.pos;
    const dir = steps >= 0 ? 1 : -1;
    const path = [];
    for (let s = 1; s <= Math.abs(steps); s++) path.push(((from + dir * s) % n + n) % n);
    p.pos = path[path.length - 1];
    if (steps > 0 && from + steps >= n) {
      let bonus = 200 + (p.charId === 'xian' ? 50 : 0); // 冼星海 +$50
      p.money += bonus;
      addLog(state, p.name + ' 經過起點，領取零用錢 $' + bonus + '。');
      setFx(state, { type: 'coins', player: p.id, tile: p.pos });
      noteLeader(state);
    }
    state.anim = { id: animId || ('m' + (++state.animSeq)), player: p.id, path: path, dice: null, tele: !!tele };
  }

  function sendToStudy(state, p, reason) {
    // 林則徐：留堂回合 -1（最少 0）
    let turns = 1;
    if (p.charId === 'lin') turns = 0;
    if (turns === 0) {
      addLog(state, '⚖️ ' + p.name + ' ' + reason + '，幸得林則徐作保，當場釋放！');
      return;
    }
    const studyIdx = state.layout.board.findIndex(t => t.type === 'study');
    p.pos = studyIdx >= 0 ? studyIdx : p.pos;
    p.inStudy = true;
    p.studyTurns = turns;
    state.anim = { id: 'm' + (++state.animSeq), player: p.id, path: [p.pos], dice: null, tele: true };
    addLog(state, '📚 ' + p.name + ' ' + reason + '，被送到自修室溫習！');
  }

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

  function applyFreeUpgrade(state, p) {
    const ups = ownedTiles(state, p.id).filter(i => {
      const prop = state.props[i];
      return prop.level < 3 && ownsFullGroup(state, p.id, state.layout.board[i].group);
    });
    if (ups.length) {
      ups.sort((a, b) => state.layout.board[a].price - state.layout.board[b].price);
      state.props[ups[0]].level++;
      addLog(state, '「' + state.layout.board[ups[0]].name + '」免費升級至 ' + state.props[ups[0]].level + ' 級！');
      setFx(state, { type: 'build', tile: ups[0], level: state.props[ups[0]].level });
    } else {
      p.money += 100;
      addLog(state, p.name + ' 暫無可升級地標，獲得 $100 補償。');
    }
  }

  // 幸運輪盤（媽祖：必為正收益）
  const WHEEL_OUTCOMES = [150, 100, 50, 80, -50, -80];
  function spinWheel(state, p) {
    let pool = WHEEL_OUTCOMES.slice();
    if (p.charId === 'mazu') pool = pool.filter(v => v > 0);
    const val = pool[rndInt(state, pool.length)];
    state.wheelResult = { player: p.id, value: val, id: 'w' + (++state.animSeq) };
    if (val > 0) {
      p.money += val;
      addLog(state, '🎡 ' + p.name + ' 幸運輪盤轉出 +' + val + '！');
      setFx(state, { type: 'coins', player: p.id, tile: p.pos });
    } else {
      pay(state, p.id, null, -val, '幸運輪盤');
    }
    noteLeader(state);
    return val;
  }

  function drawChance(state, p) {
    if (state.chancePtr >= state.chanceDeck.length) {
      state.chanceDeck = shuffleDeck(state);
      state.chancePtr = 0;
    }
    const cardId = state.chanceDeck[state.chancePtr++];
    const card = CHANCE_CARDS.find(c => c.id === cardId);
    addLog(state, '🎴 ' + p.name + ' 抽到機緣卡「' + card.title + '」');
    // 梅艷芳：機緣格 +$30
    if (p.charId === 'anita') { p.money += 30; addLog(state, '🎤 梅艷芳舞台魅力，額外 +$30。'); }
    const fx = card.fx;
    if (fx.money) {
      let amt = fx.money;
      if (amt > 0 && p.charId === 'camoes') amt += 50;   // 賈梅士：正面 +$50
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
      const steps = p.dir > 0 ? fx.move : -fx.move;
      movePlayer(state, p, steps);
      addLog(state, p.name + ' 移動到「' + state.layout.board[p.pos].name + '」。');
    }
    if (fx.moveTo !== undefined) {
      const n = state.layout.size;
      const steps = p.dir > 0 ? ((fx.moveTo - p.pos + n) % n || n) : ((p.pos - fx.moveTo + n) % n || n);
      movePlayer(state, p, p.dir > 0 ? steps : -steps);
    }
    if (fx.rentFree) { p.rentFree = 1; addLog(state, p.name + ' 獲得一次租金豁免。'); }
    if (fx.freeUpgrade) applyFreeUpgrade(state, p);
    if (fx.study) sendToStudy(state, p, '突擊測驗不合格');
    if (!state.over) setNotice(state, p, { kind: 'chance', cardId: card.id, title: card.title, text: card.text, info: card.info });
    noteLeader(state);
  }

  function drawQuiz(state, p) {
    const pool = QUESTIONS.filter(q => q.lv === state.difficulty && !state.quizUsed[q.id]);
    let pick;
    if (pool.length) pick = pool[rndInt(state, pool.length)];
    else {
      for (const q of QUESTIONS) if (q.lv === state.difficulty) delete state.quizUsed[q.id];
      const fresh = QUESTIONS.filter(q => q.lv === state.difficulty);
      pick = fresh[rndInt(state, fresh.length)];
    }
    state.quizUsed[pick.id] = true;
    state.knowledge.questionsSeen.push(pick.id);
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

  function resolveTile(state, p) {
    if (state.over) return;
    const tile = state.layout.board[p.pos];
    addLog(state, p.name + ' 來到「' + tile.name + '」。');
    switch (tile.type) {
      case 'go':
        contFlow(state, p);
        break;
      case 'landmark': {
        if (!state.knowledge.landmarks.includes(tile.lmId)) state.knowledge.landmarks.push(tile.lmId);
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
            addLog(state, '✨ ' + p.name + ' 豁免了「' + tile.name + '」的租金！');
          } else if (owner.inStudy) {
            addLog(state, owner.name + ' 正在自修室留堂，無暇收租，' + p.name + ' 幸運免租！');
          } else {
            let rent = calcRent(state, p.pos);
            if (p.charId === 'yip') rent = Math.round(rent * 0.9); // 葉問付租 9 折
            pay(state, p.id, prop.owner, rent, '租金 · ' + tile.name);
            setFx(state, { type: 'coinRain', tile: p.pos });
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
        if (p.charId === 'anita') { p.money += 30; addLog(state, '🎤 梅艷芳光顧茶餐廳，老闆免費加餸 +$30。'); }
        addLog(state, '🍵 ' + p.name + ' 在茶餐廳歎了杯絲襪奶茶，充電再出發。');
        contFlow(state, p);
        break;
      case 'study':
        addLog(state, p.name + ' 路過自修室，向留堂的同學打打氣。');
        contFlow(state, p);
        break;
      case 'goStudy':
        sendToStudy(state, p, '被老師抓到');
        contFlow(state, p);
        break;
      case 'wheel': {
        spinWheel(state, p);
        if (!state.over) {
          setNotice(state, p, {
            kind: 'wheel', title: '幸運輪盤',
            text: (state.wheelResult.value > 0 ? '好運！獲得 $' + state.wheelResult.value : '差一點！付出 $' + (-state.wheelResult.value)),
            info: TILE_META.wheel.info
          });
        }
        break;
      }
      case 'cable': {
        const n = state.layout.size;
        const target = Math.min(p.pos + 12, n - 1);
        movePlayer(state, p, target - p.pos, undefined, true);
        addLog(state, '🚠 ' + p.name + ' 乘纜車直達「' + state.layout.board[p.pos].name + '」。');
        resolveTile(state, p); // 觸發到達格
        return;
      }
      case 'doubleDice':
        p.doubleNext = true;
        addLog(state, '🎲 ' + p.name + ' 獲得雙倍骰，下回合點數 ×2！');
        contFlow(state, p);
        break;
      case 'shop':
        if (p.items.length >= 2) {
          addLog(state, p.name + ' 道具已滿（最多 2 件），空手而回。');
          contFlow(state, p);
        } else {
          state.pending = { kind: 'shopBuy', player: p.id };
        }
        break;
      case 'freeUp':
        applyFreeUpgrade(state, p);
        contFlow(state, p);
        break;
      default:
        contFlow(state, p);
    }
  }

  function advanceTurn(state) {
    const cur = state.players[state.turnIndex];
    if (cur) { cur.doubles = 0; cur.pendingDoubles = false; cur.bruceUsed = false; }
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
        // 金紫荊獎券：每輪 12% 機率全場抽一名玩家發獎金
        if (rnd(state) < 0.12) {
          const lucky = alive[rndInt(state, alive.length)];
          lucky.money += 100;
          state.lottery = { id: 'L' + state.round, player: lucky.id, amount: 100 };
          addLog(state, '🌸 金紫荊獎券開獎！' + lucky.name + ' 獨得 $100！');
          noteLeader(state);
        }
      }
    } while (state.players[next].bankrupt);
    state.turnIndex = next;
    const np = state.players[next];
    np.bruceUsed = false;
    state.pending = np.inStudy ? { kind: 'study', player: next } : { kind: 'roll', player: next };
  }

  function createGame(opts) {
    const seed = (opts.seed !== undefined ? opts.seed : Date.now()) >>> 0;
    const mapId = opts.mapId || 'ring';
    const state = {
      v: 2,
      seed: seed,
      mapId: mapId,
      layout: getLayout(mapId, seed),
      difficulty: opts.difficulty === 'S' ? 'S' : 'P',
      maxRounds: opts.maxRounds || 30,
      round: 1,
      turnIndex: 0,
      players: opts.players.map((pl, i) => {
        const charId = pl.charId || CHARACTERS[i % CHARACTERS.length].id;
        return {
          id: i,
          name: (pl.name || ('玩家' + (i + 1))).slice(0, 12),
          charId: charId,
          isAI: !!pl.isAI,
          money: 1500 + (charId === 'hotung' ? 300 : 0), // 何東初始 +$300
          pos: 0,
          dir: 1,
          inStudy: false,
          studyTurns: 0,
          doubles: 0,
          pendingDoubles: false,
          bruceUsed: false,
          bankrupt: false,
          streak: 0,
          rentFree: 0,
          doubleNext: false,
          items: []
        };
      }),
      props: {},
      chanceDeck: null, chancePtr: 0,
      quizUsed: {},
      knowledge: { landmarks: [], questionsSeen: [], questionsRight: [] },
      pending: null, notice: null, anim: null, animSeq: 0, lastRoll: null,
      fx: null, wheelResult: null, lottery: null, lastLeader: null,
      over: false, winner: null, ranking: null,
      log: []
    };
    state.chanceDeck = shuffleDeck(state);
    state.pending = { kind: 'roll', player: 0 };
    addLog(state, '🎉 遊戲開始！地圖：' + (MAPS.find(m => m.id === mapId) || MAPS[0]).name + '，每位玩家獲得初始資金，擲骰遊雙城！');
    return state;
  }

  function act(state, action) {
    if (!state || state.over) return { ok: false, error: '遊戲已結束' };
    const pd = state.pending;
    if (!pd) return { ok: false, error: '沒有待處理動作' };
    if (action.player !== undefined && action.player !== pd.player) {
      return { ok: false, error: '未輪到此玩家' };
    }
    const p = state.players[pd.player];
    if (!p || p.bankrupt) return { ok: false, error: '玩家狀態異常' };
    state.fx = null; // 清除上一動作的特效標記

    switch (pd.kind) {
      case 'roll': {
        if (action.type !== 'roll') return { ok: false, error: '請擲骰' };
        const d1 = 1 + rndInt(state, 6), d2 = 1 + rndInt(state, 6);
        let total = d1 + d2;
        if (p.doubleNext) { total *= 2; p.doubleNext = false; addLog(state, '🎲 雙倍骰生效！'); }
        if (p.charId === 'bruce' && !p.bruceUsed) { total += 1; p.bruceUsed = true; } // 李小龍 +1 格
        state.lastRoll = [d1, d2];
        addLog(state, '🎲 ' + p.name + ' 擲出 ' + d1 + ' + ' + d2 + (total !== d1 + d2 ? ' → 前進 ' + total + ' 格' : ' = ' + total) + (d1 === d2 ? '（雙同點！）' : ''));
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
          if (p.doubles === 2) setFx(state, { type: 'confetti', player: p.id }); // 手風正順彩帶
        } else {
          p.doubles = 0;
        }
        const animId = 'r' + (++state.animSeq);
        movePlayer(state, p, p.dir * total, animId);
        state.anim.dice = [d1, d2];
        resolveTile(state, p);
        noteLeader(state);
        return { ok: true };
      }
      case 'buy': {
        if (action.type !== 'buy') return { ok: false, error: '請決定是否購買' };
        const tile = state.layout.board[pd.tile];
        if (action.buy) {
          const price = buyPrice(state, p, pd.tile);
          if (p.money < price) {
            addLog(state, p.name + ' 現金不足，放棄購買「' + tile.name + '」。');
          } else {
            p.money -= price;
            state.props[pd.tile] = { owner: p.id, level: 0 };
            const run = runLength(state, pd.tile);
            addLog(state, '🏛️ ' + p.name + ' 以 $' + price + ' 購入「' + tile.name + '」' + (run >= 2 ? '，形成 ' + run + ' 連排！' : '！'));
            if (run >= 2) setFx(state, { type: 'runForm', player: p.id, tile: pd.tile });
          }
        } else {
          addLog(state, p.name + ' 放棄購買「' + tile.name + '」。');
        }
        noteLeader(state);
        contFlow(state, p);
        return { ok: true };
      }
      case 'quiz': {
        if (action.type !== 'answer') return { ok: false, error: '請作答' };
        const q = QUESTIONS.find(x => x.id === pd.qid);
        const correct = action.choice === q.ans;
        let gain = 0;
        let base = 150 + (p.charId === 'zheng' ? 50 : 0);
        if (p.charId === 'rao') base = Math.round(base * 1.5); // 饒宗頤 ×1.5
        if (correct) {
          gain = base + Math.min(p.streak, 2) * 50; // 連對加成
          p.streak++;
          // 文曲星 streak 3/5/8 火焰特效 + 倍率
          if (p.streak === 3 || p.streak === 5 || p.streak === 8) {
            gain *= 2;
            setFx(state, { type: 'wenqu', player: p.id, streak: p.streak });
            addLog(state, '🔥 文曲星下凡！' + p.name + ' 連對 ' + p.streak + ' 題，獎金翻倍！');
          }
          p.money += gain;
          state.knowledge.questionsRight.push(q.id);
          addLog(state, '✅ ' + p.name + ' 答對了！獲得獎金 $' + gain + (p.streak > 1 ? '（連對 x' + p.streak + '）' : ''));
        } else {
          if (p.charId === 'rong') { // 容閎：答錯仍得一半
            gain = Math.round(base / 2);
            p.money += gain;
            addLog(state, '🎓 容閎好學不倦，答錯仍得一半獎金 $' + gain + '。');
          }
          p.streak = 0;
          addLog(state, '❌ ' + p.name + ' 答錯了，看看解析學一課！');
        }
        noteLeader(state);
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
          p.studyTurns = 0;
          addLog(state, p.name + ' 離開自修室，可以擲骰了。');
          state.pending = { kind: 'roll', player: p.id };
        } else {
          p.studyTurns--;
          if (p.studyTurns <= 0) { p.inStudy = false; p.studyTurns = 0; }
          addLog(state, '📚 ' + p.name + ' 乖乖留堂溫習一回合。');
          state.pending = { kind: 'turnEnd', player: p.id };
        }
        return { ok: true };
      }
      case 'shopBuy': {
        if (action.type !== 'shopBuy') return { ok: false, error: '請選擇道具' };
        if (action.item && ITEMS[action.item]) {
          if (p.items.length >= 2) return { ok: false, error: '道具欄已滿' };
          const item = ITEMS[action.item];
          if (p.money < item.price) return { ok: false, error: '現金不足' };
          p.money -= item.price;
          p.items.push(action.item);
          addLog(state, '🏪 ' + p.name + ' 購入道具「' + item.name + '」（' + item.price + ' 元）。');
        } else {
          addLog(state, p.name + ' 在道具店逛了一圈，空手而回。');
        }
        contFlow(state, p);
        return { ok: true };
      }
      case 'turnEnd': {
        if (action.type === 'upgrade') {
          const i = action.tile;
          const prop = state.props[i];
          if (!prop || prop.owner !== p.id) return { ok: false, error: '你不擁有此地標' };
          if (prop.level >= 3) return { ok: false, error: '已達最高等級' };
          if (!ownsFullGroup(state, p.id, state.layout.board[i].group)) return { ok: false, error: '需集齊同色全組才可升級' };
          const cost = upgradeCost(state, p, i);
          if (p.money < cost) return { ok: false, error: '現金不足' };
          p.money -= cost;
          prop.level++;
          addLog(state, '⬆️ ' + p.name + ' 花 $' + cost + ' 把「' + state.layout.board[i].name + '」升級至 ' + prop.level + ' 級！');
          setFx(state, { type: 'build', tile: i, level: prop.level });
          noteLeader(state);
          return { ok: true };
        }
        if (action.type === 'useItem') {
          const key = action.item;
          const idx = p.items.indexOf(key);
          if (idx < 0) return { ok: false, error: '沒有此道具' };
          if (key === 'rentFree') {
            if (p.rentFree) return { ok: false, error: '已有租金豁免' };
            p.items.splice(idx, 1);
            p.rentFree = 1;
            addLog(state, '🛡️ ' + p.name + ' 使用免租金牌，下一次租金豁免。');
            return { ok: true };
          }
          if (key === 'doubleDice') {
            if (p.doubleNext) return { ok: false, error: '雙倍骰已生效' };
            p.items.splice(idx, 1);
            p.doubleNext = true;
            addLog(state, '🎲 ' + p.name + ' 使用雙倍骰，下回合點數 ×2！');
            return { ok: true };
          }
          if (key === 'turnCard') {
            p.items.splice(idx, 1);
            p.dir = -p.dir;
            addLog(state, '↩️ ' + p.name + ' 使用轉向卡，改變行進方向！');
            return { ok: true };
          }
          if (key === 'moveCard') {
            // 搬遷卡：交換一塊同組地標
            const give = action.give, want = action.want;
            const gp = state.props[give], wp = state.props[want];
            if (!gp || gp.owner !== p.id) return { ok: false, error: '請選擇自己的地標' };
            if (!wp || wp.owner === p.id) return { ok: false, error: '請選擇對手的地標' };
            const gt = state.layout.board[give], wt = state.layout.board[want];
            if (gt.group !== wt.group) return { ok: false, error: '只能交換同色組地標' };
            const other = state.players[wp.owner];
            // 對手（AI）按估價自動判斷：收到地價值 ≥ 付出 ×0.9 即同意
            const giveVal = gt.price + gp.level * upgradeCost(state, null, give);
            const wantVal = wt.price + wp.level * upgradeCost(state, null, want);
            if (other.isAI && giveVal < Math.round(wantVal * 0.9)) {
              addLog(state, '🔄 ' + other.name + ' 認為估價不合算，拒絕了搬遷交換。');
              return { ok: true };
            }
            const tmp = gp.owner;
            gp.owner = wp.owner;
            wp.owner = tmp;
            p.items.splice(idx, 1);
            addLog(state, '🔄 ' + p.name + ' 用「' + gt.name + '」與 ' + other.name + ' 的「' + wt.name + '」交換！');
            noteLeader(state);
            return { ok: true };
          }
          return { ok: false, error: '未知道具' };
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

  // AI 策略：連排/集組優先買、保留 $300 安全金、連排組優先升級、按估價購道具、答題 70% 正確率
  function aiAction(state) {
    const pd = state.pending;
    if (!pd) return null;
    const p = state.players[pd.player];
    switch (pd.kind) {
      case 'roll':
        return { type: 'roll' };
      case 'buy': {
        const price = pd.price;
        const tile = state.layout.board[pd.tile];
        const completesGroup = groupTiles(tile.group).length > 0 && state.layout.board.every((t, i) =>
          t.type !== 'landmark' || t.group !== tile.group || i === pd.tile || (state.props[i] && state.props[i].owner === p.id));
        // 買下能否形成連排
        const n = state.layout.size;
        const ownAdj = [1, -1].some(d => {
          const j = ((pd.tile + d) % n + n) % n;
          return state.props[j] && state.props[j].owner === p.id;
        });
        const reserve = (completesGroup || ownAdj) ? 100 : 300;
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
      case 'shopBuy': {
        if (p.items.length >= 2) return { type: 'shopBuy', item: null };
        // 按估價購道具：現金充裕時優先免租金牌/雙倍骰
        if (p.money > 600 && !p.rentFree) return { type: 'shopBuy', item: 'rentFree' };
        if (p.money > 500 && !p.doubleNext) return { type: 'shopBuy', item: 'doubleDice' };
        return { type: 'shopBuy', item: null };
      }
      case 'turnEnd': {
        // 連排組優先升級
        const ups = ownedTiles(state, p.id).filter(i => {
          const prop = state.props[i];
          return prop.level < 3 && ownsFullGroup(state, p.id, state.layout.board[i].group)
            && p.money - upgradeCost(state, p, i) >= 300;
        });
        if (ups.length) {
          ups.sort((a, b) => runLength(state, b) - runLength(state, a));
          return { type: 'upgrade', tile: ups[0] };
        }
        if (p.items.includes('doubleDice') && !p.doubleNext) return { type: 'useItem', item: 'doubleDice' };
        if (p.items.includes('rentFree') && !p.rentFree) return { type: 'useItem', item: 'rentFree' };
        return { type: 'end' };
      }
    }
    return null;
  }

  return {
    createGame, act, aiAction, calcRent, assetValue, buyPrice, upgradeCost,
    ownsFullGroup, groupTiles, ownedTiles, alivePlayers, runLength, runMult, computeRuns,
    getLayout, buildLayout, WHEEL_OUTCOMES, TILE_META
  };
})();

/* ==================== 四、對外導出 ==================== */

const MFT2 = {
  Engine: Engine,
  DATA: {
    CHARACTERS: CHARACTERS,
    GROUPS: GROUPS,
    LANDMARKS: LANDMARKS,
    MAPS: MAPS,
    ITEMS: ITEMS,
    CHANCE_CARDS: CHANCE_CARDS,
    QUESTIONS: QUESTIONS,
    MAP_SIZE: 99
  }
};
global.MFT2 = MFT2;
if (typeof module !== 'undefined' && module.exports) module.exports = MFT2;

/* ==================== 五、瀏覽器 UI（以下代碼需要 DOM）==================== */

if (typeof document === 'undefined') return;

const $ = id => document.getElementById(id);
const DATA = MFT2.DATA;
const ENGINE = MFT2.Engine;

/* ---------- 存檔（localStorage，鍵位向後兼容） ---------- */
const Store = {
  get(key, def) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : def; }
    catch (e) { return def; }
  },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 無痕模式 */ } }
};
const LSK = { profile: 'mft2_profile', stats: 'mft2_stats', codex: 'mft2_codex', tut: 'mft2_tutorial_v2', muted: 'mft2_muted' };

function getProfile() { return Store.get(LSK.profile, { nickname: '' }); }
function getStats() { return Store.get(LSK.stats, { games: 0, wins: 0, best: 0 }); }
function getCodex() { return Store.get(LSK.codex, { landmarks: {}, questions: {} }); }

// v1 舊存檔遷移：地標以舊棋盤格號為鍵 → 按名稱匹配遷移
const V1_TILE_NAMES = {
  1: '議事亭前地', 3: '大三巴牌坊', 5: '媽閣廟', 7: '鄭家大屋', 9: '大炮台',
  10: '官也街', 11: '龍環葡韻', 13: '路環聖方濟各堂', 14: '澳門旅遊塔', 15: '澳門科學館',
  16: '港珠澳大橋', 18: '太平山頂', 19: '大館', 20: '金紫荊廣場', 22: '尖沙咀鐘樓',
  23: '廟街夜市', 24: '星光大道', 26: '天壇大佛', 27: '南丫島', 28: '大澳漁村',
  29: '香港故宮文化博物館', 31: '澳門世遺歷史城區'
};
function migrateCodex() {
  const c = getCodex();
  let changed = false;
  for (const k of Object.keys(c.landmarks)) {
    if (/^\d+$/.test(k)) { // 舊格式：數字格號
      const name = V1_TILE_NAMES[parseInt(k, 10)];
      delete c.landmarks[k];
      if (name && DATA.LANDMARKS.some(l => l.name === name)) c.landmarks[name] = true;
      changed = true;
    }
  }
  if (changed) Store.set(LSK.codex, c);
}

function recordLandmark(name) {
  const c = getCodex();
  if (!c.landmarks[name]) { c.landmarks[name] = true; Store.set(LSK.codex, c); }
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

/* ---------- WebAudio 合成音效（無音頻文件，可靜音） ---------- */
const Sound = {
  ctx: null, muted: Store.get(LSK.muted, false),
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, dur, type, vol, delay) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  },
  play(name) {
    if (this.muted) return;
    try {
      switch (name) {
        case 'roll': this.tone(220, 0.08, 'square', 0.08); this.tone(330, 0.08, 'square', 0.08, 0.09); this.tone(440, 0.1, 'square', 0.08, 0.18); break;
        case 'coin': this.tone(880, 0.1, 'sine', 0.12); this.tone(1320, 0.15, 'sine', 0.1, 0.08); break;
        case 'right': this.tone(523, 0.12, 'sine', 0.12); this.tone(659, 0.12, 'sine', 0.12, 0.1); this.tone(784, 0.2, 'sine', 0.12, 0.2); break;
        case 'wrong': this.tone(180, 0.3, 'sawtooth', 0.08); break;
        case 'build': this.tone(150, 0.12, 'triangle', 0.15); this.tone(300, 0.15, 'triangle', 0.12, 0.1); break;
        case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.12, i * 0.13)); break;
        case 'card': this.tone(600, 0.06, 'triangle', 0.08); break;
      }
    } catch (e) { /* 音頻不可用時靜默 */ }
  },
  toggle() {
    this.muted = !this.muted;
    Store.set(LSK.muted, this.muted);
    return this.muted;
  }
};

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

/* ---------- 地標資訊卡 ---------- */
function tileInfoHTML(i, price, rent) {
  const st = G.state;
  const t = st.layout.board[i];
  let html = '<div class="tile-info">';
  if (t.type === 'landmark') {
    const g = DATA.GROUPS[t.group];
    html += '<span class="group-chip" style="background:' + g.color + '">' + g.name + '</span>';
    html += '<p class="tile-info-text">' + esc(t.info) + '</p>';
    html += '<p class="tile-info-price">地價 ' + money(price !== undefined ? price : t.price) +
      (rent !== undefined ? ' · 現收租 ' + money(rent) : ' · 基礎租金 ' + money(Math.round(t.price * 0.1))) + '</p>';
    const prop = st.props[i];
    if (prop) {
      const owner = st.players[prop.owner];
      const run = ENGINE.runLength(st, i);
      html += '<p class="tile-info-owner">業主：' + esc(owner.name) + ' · ' + (prop.level ? '建築 ' + prop.level + ' 級' : '未升級') +
        (run >= 2 ? ' · <b class="gold-text">' + run + ' 連排 ×' + ENGINE.runMult(run) + '</b>' : '') + '</p>';
    }
  } else {
    html += '<p class="tile-info-text">' + (t.icon ? t.icon + ' ' : '') + esc(t.info) + '</p>';
  }
  html += '</div>';
  return html;
}
function showTileInfo(i) {
  const t = G.state.layout.board[i];
  if (t.type === 'landmark') recordLandmark(t.name);
  const rent = (G.state && G.state.props[i]) ? ENGINE.calcRent(G.state, i) : undefined;
  openModal(esc(t.name), tileInfoHTML(i, undefined, rent), [{ label: '知道了', onClick: closeModal }]);
}

/* ---------- 地圖預覽小圖 ---------- */
function drawMapPreview(canvas, mapId) {
  const path = ENGINE.getLayout(mapId, 12345).path;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const xs = path.map(p => p.x), ys = path.map(p => p.y);
  const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
  const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
  const sc = Math.min((w - 8) / (maxX - minX || 1), (h - 8) / (maxY - minY || 1));
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  path.forEach((p, i) => {
    const px = 4 + (p.x - minX) * sc, py = 4 + (p.y - minY) * sc;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.fillStyle = '#b03a2e';
  ctx.beginPath();
  ctx.arc(4 + (path[0].x - minX) * sc, 4 + (path[0].y - minY) * sc, 2.5, 0, 7);
  ctx.fill();
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
const Setup = { mode: 'solo', chars: [], difficulty: 'P', mapId: 'ring' };

function openSetup(mode) {
  Setup.mode = mode;
  Setup.chars = [];
  Setup.difficulty = 'P';
  Setup.mapId = 'ring';
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
  bindDiffRow($('setup-difficulty-row'), lv => { Setup.difficulty = lv; });
  buildMapPicker($('setup-maps'), id => { Setup.mapId = id; });
  buildSetupPlayers();
  $('btn-setup-back').onclick = () => showScreen('screen-menu');
  $('btn-setup-start').onclick = startLocalGame;
  showScreen('screen-setup');
}

function bindDiffRow(row, onChange) {
  row.querySelectorAll('.diff-btn').forEach(b => {
    b.classList.toggle('on', b.dataset.lv === 'P');
    b.onclick = () => {
      row.querySelectorAll('.diff-btn').forEach(x => x.classList.toggle('on', x === b));
      onChange(b.dataset.lv);
    };
  });
}

function buildMapPicker(box, onChange) {
  box.innerHTML = '';
  DATA.MAPS.forEach((m, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'map-card' + (i === 0 ? ' on' : '');
    const cv = document.createElement('canvas');
    cv.width = 72; cv.height = 72;
    cv.className = 'map-thumb';
    card.appendChild(cv);
    const label = document.createElement('div');
    label.className = 'map-name';
    label.textContent = m.name;
    card.appendChild(label);
    card.onclick = () => {
      box.querySelectorAll('.map-card').forEach(x => x.classList.toggle('on', x === card));
      onChange(m.id);
    };
    box.appendChild(card);
    drawMapPreview(cv, m.id);
  });
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
      (takenBy >= 0 ? '<div class="char-taken">玩家 ' + (takenBy + 1) + '</div>' : '');
    card.onclick = () => {
      if (takenBy >= 0) {
        const free = DATA.CHARACTERS.map(x => x.id).filter(id => !Setup.chars.includes(id) || id === Setup.chars[i]);
        Setup.chars[takenBy] = free.find(id => id !== c.id) || DATA.CHARACTERS[0].id;
      }
      Setup.chars[i] = c.id;
      document.querySelectorAll('.char-pick').forEach(renderCharPick);
    };
    container.appendChild(card);
  });
}

// 角色詳情（生平）：長按/點名字彈出 —— 簡化為點角色卡右上角？改為雙擊查看
function showCharBio(c) {
  openModal(c.emoji + ' ' + esc(c.name),
    '<p class="char-passive" style="font-size:.9rem">被動：' + esc(c.passive) + '</p>' +
    '<p class="tile-info-text">' + c.bio.map(esc).join('<br>') + '</p>',
    [{ label: '知道了', onClick: closeModal }]);
}

function startLocalGame() {
  const n = parseInt($('select-setup-count').value, 10);
  const humanCount = Setup.mode === 'solo' ? 1 : n;
  const total = Setup.mode === 'solo' ? 1 + n : n;
  const names = Array.from(document.querySelectorAll('.setup-name')).map(inp => inp.value.trim() || '玩家');
  const prof = getProfile();
  if (names[0]) { prof.nickname = names[0]; Store.set(LSK.profile, prof); }
  const freeChars = DATA.CHARACTERS.map(c => c.id).filter(id => !Setup.chars.includes(id));
  const players = [];
  for (let i = 0; i < total; i++) {
    if (i < humanCount) players.push({ name: names[i] || '玩家' + (i + 1), charId: Setup.chars[i], isAI: false });
    else {
      const charId = freeChars.length ? freeChars.splice(Math.floor(Math.random() * freeChars.length), 1)[0]
        : DATA.CHARACTERS[i % DATA.CHARACTERS.length].id;
      players.push({ name: 'AI · ' + charOf(charId).name, charId: charId, isAI: true });
    }
  }
  const state = ENGINE.createGame({ players: players, difficulty: Setup.difficulty, maxRounds: 30, mapId: Setup.mapId });
  enterGame(state, { mode: 'local', myId: null });
}

/* ==================== 文脈圖鑑（70 地標 + 56 題，舊檔已遷移） ==================== */
function renderCodex() {
  const c = getCodex();
  const lmTotal = DATA.LANDMARKS.length;
  const lmGot = DATA.LANDMARKS.filter(l => c.landmarks[l.name]).length;
  const qTotal = DATA.QUESTIONS.length;
  const qGot = DATA.QUESTIONS.filter(q => c.questions[q.id]).length;
  const pct = Math.round(((lmGot + qGot) / (lmTotal + qTotal)) * 100);
  $('codex-summary').innerHTML =
    '<div class="codex-progress"><div class="codex-bar"><div class="codex-fill" style="width:' + pct + '%"></div></div>' +
    '<div class="codex-pct">總收集率 ' + pct + '%</div></div>' +
    '<p class="muted">地標知識 ' + lmGot + ' / ' + lmTotal + ' · 文脈題目 ' + qGot + ' / ' + qTotal + '</p>';
  const lmBox = $('codex-landmarks');
  lmBox.innerHTML = '<h3>🏛️ 地標知識（70）</h3>';
  Object.keys(DATA.GROUPS).forEach(gk => {
    const g = DATA.GROUPS[gk];
    const lms = DATA.LANDMARKS.filter(l => l.group === gk);
    const got = lms.filter(l => c.landmarks[l.name]).length;
    const div = document.createElement('div');
    div.className = 'codex-group';
    div.innerHTML = '<div class="codex-group-head"><span class="group-chip" style="background:' + g.color + '">' +
      g.name + '</span><span class="muted">' + got + '/' + lms.length + '</span></div>';
    lms.forEach(l => {
      const unlocked = !!c.landmarks[l.name];
      const item = document.createElement('div');
      item.className = 'codex-item' + (unlocked ? '' : ' locked');
      item.innerHTML = unlocked
        ? '<b>' + esc(l.name) + '</b><p>' + esc(l.info) + '</p>'
        : '<b>？？？</b><p>在遊戲中到訪或購買此地標即可解鎖知識。</p>';
      div.appendChild(item);
    });
    lmBox.appendChild(div);
  });
  const qBox = $('codex-questions');
  qBox.innerHTML = '<h3>📖 文脈題目（56）</h3>';
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

/* ==================== 六、遊戲主界面（3D 棋盤 + 特效） ==================== */
const G = {
  state: null, mode: 'local', myId: null,
  built: false, playedAnim: null, animating: false,
  aiTimer: null, statsRecorded: false, lastPositions: [],
  shownFx: {}, codexBefore: null
};
const Net = { mode: 'local', inGame: false };

const CELL = 46; // 每格像素

/* ---------- 視角相機（拖動平移 + 滾輪/雙指縮放 + 2D/3D 切換） ---------- */
const Cam = { x: 0, y: 0, s: 1, is3d: true };

function applyCam() {
  $('board-world').style.transform = 'translate(' + Cam.x + 'px,' + Cam.y + 'px) scale(' + Cam.s + ')';
  $('board-plane').classList.toggle('mode3d', Cam.is3d);
  $('btn-view-toggle').textContent = Cam.is3d ? '🗺️ 2D' : '🏔️ 3D';
}

function fitBoard() {
  const vp = $('board-viewport');
  const b = G.bounds;
  Cam.s = Math.min(vp.clientWidth / (b.w + 60), vp.clientHeight / (b.h + 60));
  Cam.s = Math.max(0.2, Math.min(1.2, Cam.s));
  Cam.x = (vp.clientWidth - b.w * Cam.s) / 2 - b.minX * Cam.s;
  Cam.y = (vp.clientHeight - b.h * Cam.s) / 2 - b.minY * Cam.s;
  applyCam();
}

function initCamera() {
  const vp = $('board-viewport');
  const pointers = new Map();
  let lastDist = 0;
  let downTarget = null, downX = 0, downY = 0, moved = false;
  vp.addEventListener('pointerdown', e => {
    if (e.target.closest('#board-controls')) return; // 控制鈕不攔截
    vp.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downTarget = e.target; downX = e.clientX; downY = e.clientY; moved = false;
    if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      lastDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
  });
  vp.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) moved = true;
    if (pointers.size === 1) {
      Cam.x += e.clientX - prev.x;
      Cam.y += e.clientY - prev.y;
      applyCam();
    } else if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastDist > 0) {
        Cam.s = Math.max(0.2, Math.min(2.5, Cam.s * dist / lastDist));
        applyCam();
      }
      lastDist = dist;
    }
  });
  const release = e => {
    pointers.delete(e.pointerId);
    lastDist = 0;
    // 輕點（未拖動）落在格子上 → 視為點格查看
    if (!moved && downTarget) {
      const tile = downTarget.closest && downTarget.closest('.tile3');
      if (tile && tile.id) {
        const idx = parseInt(tile.id.replace('tile-', ''), 10);
        if (!isNaN(idx) && G.state) showTileInfo(idx);
      }
    }
    downTarget = null; moved = false;
  };
  vp.addEventListener('pointerup', release);
  vp.addEventListener('pointercancel', release);
  vp.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = vp.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const old = Cam.s;
    Cam.s = Math.max(0.2, Math.min(2.5, Cam.s * (e.deltaY < 0 ? 1.12 : 0.89)));
    Cam.x = mx - (mx - Cam.x) * Cam.s / old;
    Cam.y = my - (my - Cam.y) * Cam.s / old;
    applyCam();
  }, { passive: false });
  $('btn-zoom-in').onclick = () => { Cam.s = Math.min(2.5, Cam.s * 1.2); applyCam(); };
  $('btn-zoom-out').onclick = () => { Cam.s = Math.max(0.2, Cam.s / 1.2); applyCam(); };
  $('btn-view-toggle').onclick = () => { Cam.is3d = !Cam.is3d; applyCam(); };
  $('btn-mute').onclick = () => {
    const m = Sound.toggle();
    $('btn-mute').textContent = m ? '🔇' : '🔊';
    toast(m ? '音效已靜音' : '音效已開啟');
  };
  $('btn-mute').textContent = Sound.muted ? '🔇' : '🔊';
}

/* ---------- 棋盤構建 ---------- */
function enterGame(state, opts) {
  G.state = state;
  G.mode = (opts && opts.mode) || 'local';
  Net.mode = G.mode;
  Net.inGame = true;
  G.myId = (opts && opts.myId !== undefined) ? opts.myId : null;
  G.playedAnim = null; G.animating = false; G.statsRecorded = false;
  G.shownFx = {};
  G.lastPositions = state.players.map(p => p.pos);
  const codex = getCodex();
  G.codexBefore = Object.keys(codex.landmarks).length + Object.keys(codex.questions).length;
  buildBoard();
  showScreen('screen-game');
  requestAnimationFrame(() => { fitBoard(); render(); });
}

function buildBoard() {
  const plane = $('board-plane');
  plane.innerHTML = '';
  const st = G.state;
  const board = st.layout.board;
  const xs = board.map(t => t.x), ys = board.map(t => t.y);
  const minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
  const maxX = Math.max.apply(null, xs), maxY = Math.max.apply(null, ys);
  G.bounds = { minX: minX, minY: minY, w: (maxX - minX + 1) * CELL, h: (maxY - minY + 1) * CELL };
  plane.style.width = G.bounds.w + 'px';
  plane.style.height = G.bounds.h + 'px';
  board.forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'tile3 tile-' + t.type;
    div.id = 'tile-' + i;
    div.style.left = ((t.x - minX) * CELL) + 'px';
    div.style.top = ((t.y - minY) * CELL) + 'px';
    let inner = '';
    if (t.type === 'landmark') {
      inner = '<div class="tile-band" style="background:' + DATA.GROUPS[t.group].color + '"></div>' +
        '<div class="tile-name">' + esc(t.name) + '</div>' +
        '<div class="tile-price">$' + t.price + '</div>' +
        '<div class="tile-owner" id="tile-owner-' + i + '"></div>' +
        '<div class="bldgs" id="bldgs-' + i + '"></div>';
    } else {
      inner = '<div class="tile-icon">' + t.icon + '</div><div class="tile-name">' + esc(t.name) + '</div>';
    }
    if (i === 0) inner += '<div class="tile-start-flag">起點</div>';
    div.innerHTML = inner;
    div.onclick = () => showTileInfo(i);
    plane.appendChild(div);
  });
  // 棋子
  st.players.forEach(p => {
    const c = charOf(p.charId);
    const tok = document.createElement('div');
    tok.className = 'token3';
    tok.id = 'token-' + p.id;
    tok.innerHTML = '<div class="token-peg" style="background:' + c.color + '">' + c.emoji + '</div><div class="token-shadow"></div>';
    plane.appendChild(tok);
  });
  G.built = true;
}

function tileCenter(i) {
  const t = G.state.layout.board[i];
  return {
    x: (t.x - G.bounds.minX) * CELL + CELL / 2,
    y: (t.y - G.bounds.minY) * CELL + CELL / 2
  };
}

function placeToken(pid, tileIdx, slot) {
  const tok = $('token-' + pid);
  if (!tok) return;
  const c = tileCenter(tileIdx);
  const offsets = [[-9, -9], [9, -9], [-9, 9], [9, 9], [0, 0]];
  const off = offsets[(slot || pid) % offsets.length];
  tok.style.left = (c.x + off[0] - 13) + 'px';
  tok.style.top = (c.y + off[1] - 13) + 'px';
}

/* ---------- 渲染 ---------- */
function updateBoard() {
  const st = G.state;
  st.players.forEach((p, i) => {
    const tok = $('token-' + p.id);
    if (!tok) return;
    tok.style.display = p.bankrupt ? 'none' : '';
    if (!p.bankrupt && !G.animating) placeToken(p.id, p.pos, i);
    if (G.lastPositions[p.id] !== p.pos) {
      const t = st.layout.board[p.pos];
      if (t.type === 'landmark') recordLandmark(t.name);
    }
    G.lastPositions[p.id] = p.pos;
  });
  // 業主標記 + 建築
  for (let i = 0; i < st.layout.size; i++) {
    const t = st.layout.board[i];
    if (t.type !== 'landmark') continue;
    const own = $('tile-owner-' + i);
    const prop = st.props[i];
    if (own) {
      own.style.background = prop ? charOf(st.players[prop.owner].charId).color : 'transparent';
      own.textContent = prop ? charOf(st.players[prop.owner].charId).emoji : '';
    }
    const bx = $('bldgs-' + i);
    if (bx) {
      const lv = prop ? prop.level : 0;
      if (bx.childElementCount !== lv) {
        bx.innerHTML = '';
        for (let k = 0; k < lv; k++) {
          const b = document.createElement('div');
          b.className = 'bldg bldg-lv' + (k + 1);
          b.style.setProperty('--owner-color', charOf(st.players[prop.owner].charId).color);
          bx.appendChild(b);
        }
      }
    }
  }
  renderRunBands();
}

// 連排金帶
function renderRunBands() {
  const plane = $('board-plane');
  plane.querySelectorAll('.run-band').forEach(n => n.remove());
  const runs = ENGINE.computeRuns(G.state);
  runs.forEach(run => {
    for (let k = 0; k < run.cells.length - 1; k++) {
      const a = tileCenter(run.cells[k]), b = tileCenter(run.cells[k + 1]);
      // 只連路徑相鄰格
      const diff = Math.abs(run.cells[k] - run.cells[k + 1]);
      if (diff !== 1 && diff !== G.state.layout.size - 1) continue;
      const band = document.createElement('div');
      band.className = 'run-band';
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) - CELL * 0.4;
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      band.style.width = len + 'px';
      band.style.left = ((a.x + b.x) / 2 - len / 2) + 'px';
      band.style.top = ((a.y + b.y) / 2 - 3) + 'px';
      band.style.transform = 'rotate(' + ang + 'deg)';
      plane.appendChild(band);
    }
  });
}

function updatePlayersBar() {
  const st = G.state;
  const bar = $('players-bar');
  bar.innerHTML = '';
  st.players.forEach(p => {
    const c = charOf(p.charId);
    const div = document.createElement('div');
    div.className = 'pbar-item' + (st.turnIndex === p.id && !st.over ? ' current' : '') + (p.bankrupt ? ' out' : '');
    const assets = ENGINE.assetValue(st, p.id);
    const items = p.items.map(k => DATA.ITEMS[k].emoji).join('');
    div.innerHTML =
      '<div class="pbar-emoji" style="background:' + c.color + '">' + c.emoji + '</div>' +
      '<div class="pbar-info"><b>' + esc(p.name) + (p.isAI ? ' 🤖' : '') + '</b>' +
      '<span>' + (p.bankrupt ? '已破產' : money(p.money) + ' · 資產 ' + money(assets)) + '</span>' +
      '<span class="pbar-flags">' +
      (p.inStudy ? '📚留堂 ' : '') +
      (p.dir < 0 ? '↩️逆行 ' : '') +
      (p.doubleNext ? '🎲×2 ' : '') +
      (p.rentFree ? '🛡️ ' : '') +
      (p.streak >= 2 ? '🔥連對' + p.streak + ' ' : '') +
      items + '</span></div>';
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
  if (!G.animating) {
    setDieFace($('die-1'), d ? d[0] : 1);
    setDieFace($('die-2'), d ? d[1] : 1);
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
  processFx();
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

/* ---------- 骰子 3D 方塊 ---------- */
const DIE_ROT = { 1: 'rotateX(0deg)', 2: 'rotateX(-90deg)', 3: 'rotateY(-90deg)', 4: 'rotateY(90deg)', 5: 'rotateX(90deg)', 6: 'rotateY(180deg)' };
function setDieFace(el, v) {
  el.style.transform = DIE_ROT[v] || DIE_ROT[1];
}

/* ---------- 動畫：骰子翻滾 + 棋子逐格跳躍 ---------- */
function playAnim(anim, done) {
  G.animating = true;
  const finish = () => { G.animating = false; done(); };
  const steps = () => {
    const path = anim.path || [];
    if (!path.length) { finish(); return; }
    const tok = $('token-' + anim.player);
    let i = 0;
    const step = () => {
      placeToken(anim.player, path[i]);
      if (tok) {
        tok.classList.remove('hop');
        void tok.offsetWidth;
        tok.classList.add('hop');
      }
      i++;
      if (i < path.length) setTimeout(step, anim.tele ? 350 : 200);
      else setTimeout(finish, 240);
    };
    step();
  };
  if (anim.dice) {
    Sound.play('roll');
    const d1 = $('die-1'), d2 = $('die-2');
    d1.classList.add('tumbling');
    d2.classList.add('tumbling');
    setTimeout(() => {
      d1.classList.remove('tumbling');
      d2.classList.remove('tumbling');
      setDieFace(d1, anim.dice[0]);
      setDieFace(d2, anim.dice[1]);
      steps();
    }, 650);
  } else {
    steps();
  }
}

/* ---------- 特效總管 ---------- */
function processFx() {
  const st = G.state;
  if (!st) return;
  // 一次性特效
  if (st.fx && !G.shownFx[st.fx.id]) {
    G.shownFx[st.fx.id] = true;
    const fx = st.fx;
    if (fx.type === 'coins' && fx.tile !== undefined) {
      const px = tileToScreen(fx.tile);
      coinBurst(px.x, px.y, 12);
      Sound.play('coin');
    } else if (fx.type === 'coinRain' && fx.tile !== undefined) {
      const px = tileToScreen(fx.tile);
      coinBurst(px.x, px.y, 18);
      Sound.play('coin');
    } else if (fx.type === 'build' && fx.tile !== undefined) {
      const bx = $('bldgs-' + fx.tile);
      if (bx && bx.lastElementChild) {
        bx.lastElementChild.classList.add('bldg-pop');
      }
      const px = tileToScreen(fx.tile);
      coinBurst(px.x, px.y, 10);
      Sound.play('build');
    } else if (fx.type === 'confetti') {
      confettiBurst();
    } else if (fx.type === 'wenqu') {
      wenquFlames();
    } else if (fx.type === 'comeback') {
      danmaku('🔥 逆襲！' + st.players[fx.player].name + ' 資產反超登頂！');
    } else if (fx.type === 'bankrupt') {
      bankruptFlash();
    } else if (fx.type === 'fireworks') {
      fireworks();
      Sound.play('win');
    } else if (fx.type === 'runForm') {
      toast('✨ 形成連排！租金加成生效');
    }
  }
  // 金紫荊獎券（彩票式揭獎）
  if (st.lottery && !G.shownFx[st.lottery.id]) {
    G.shownFx[st.lottery.id] = true;
    showLottery(st.lottery);
  }
}

function tileToScreen(tileIdx) {
  const vp = $('board-viewport');
  const c = tileCenter(tileIdx);
  // plane 在 world 內；3D 旋轉下的近似投影（特效用，無需精確）
  return {
    x: vp.clientWidth / 2 + (c.x - G.bounds.w / 2) * Cam.s * 0.6 + Cam.x * 0.3,
    y: vp.clientHeight / 2 + (c.y - G.bounds.h / 2) * Cam.s * 0.6 + Cam.y * 0.3
  };
}

function spawnParticle(x, y, cls, dx, dy, extra) {
  const layer = $('fx-layer');
  const p = document.createElement('div');
  p.className = 'particle ' + cls;
  p.style.left = x + 'px';
  p.style.top = y + 'px';
  p.style.setProperty('--dx', dx + 'px');
  p.style.setProperty('--dy', dy + 'px');
  if (extra) p.textContent = extra;
  layer.appendChild(p);
  setTimeout(() => p.remove(), 1400);
}

function coinBurst(x, y, n) {
  for (let i = 0; i < n; i++) {
    spawnParticle(x, y, 'coin-p',
      (Math.random() - 0.5) * 160,
      -40 - Math.random() * 120, '🪙');
  }
}

function confettiBurst() {
  const vp = $('board-viewport');
  const colors = ['#d4af37', '#b03a2e', '#2c3e70', '#3e8e5a', '#d46a92'];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement('div');
    p.className = 'particle confetti-p';
    p.style.left = (Math.random() * vp.clientWidth) + 'px';
    p.style.top = '-10px';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', ((Math.random() - 0.5) * 80) + 'px');
    p.style.setProperty('--dy', (vp.clientHeight + 40) + 'px');
    p.style.animationDuration = (0.9 + Math.random() * 0.8) + 's';
    $('fx-layer').appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }
}

function wenquFlames() {
  const bar = $('players-bar');
  const rect = bar.getBoundingClientRect();
  for (let i = 0; i < 16; i++) {
    spawnParticle(
      Math.random() * rect.width,
      rect.top - $('screen-game').getBoundingClientRect().top - 10,
      'flame-p', (Math.random() - 0.5) * 60, -80 - Math.random() * 60, '🔥');
  }
  Sound.play('right');
}

function danmaku(text) {
  const layer = $('danmaku-layer');
  const div = document.createElement('div');
  div.className = 'danmaku';
  div.textContent = text;
  layer.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function bankruptFlash() {
  document.body.classList.add('bankrupt-flash');
  setTimeout(() => document.body.classList.remove('bankrupt-flash'), 900);
}

function fireworks() {
  const cv = $('fireworks-canvas');
  cv.classList.remove('hidden');
  cv.width = cv.clientWidth;
  cv.height = cv.clientHeight;
  const ctx = cv.getContext('2d');
  const parts = [];
  const colors = ['#f0d878', '#ff6b5e', '#7ec8e3', '#a8e6a1', '#e8a0d0'];
  function burst() {
    const cx = Math.random() * cv.width, cy = Math.random() * cv.height * 0.6;
    const col = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 3;
      parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, col: col });
    }
  }
  burst(); burst();
  let frames = 0;
  const iv = setInterval(burst, 500);
  function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= 0.012;
      if (p.life > 0) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.col;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
    }
    ctx.globalAlpha = 1;
    if (++frames > 180) {
      clearInterval(iv);
      cv.classList.add('hidden');
      return;
    }
    requestAnimationFrame(tick);
  }
  tick();
}

function showLottery(lot) {
  const st = G.state;
  const winner = st.players[lot.player];
  const c = charOf(winner.charId);
  openModal('🌸 金紫荊獎券開獎！',
    '<div class="lottery-card"><div class="lottery-inner">' +
    '<div class="lottery-face lottery-back">🎫<br>刮開有獎</div>' +
    '<div class="lottery-face lottery-front"><span class="pbar-emoji" style="background:' + c.color + '">' + c.emoji + '</span><br>' +
    '<b>' + esc(winner.name) + '</b><br>獨得獎金 ' + money(lot.amount) + '</div>' +
    '</div></div>',
    [{ label: '恭喜！', onClick: () => { closeModal(); Sound.play('coin'); } }]);
  requestAnimationFrame(() => {
    const inner = document.querySelector('.lottery-inner');
    if (inner) setTimeout(() => inner.classList.add('revealed'), 600);
  });
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

  maybeShowTutorial(pd, ctrl);

  if (!ctrl) {
    pendingModalKey = null;
    closeModal();
    if (!p.isAI || Net.mode === 'client') $('game-status-text').textContent = '等待 ' + p.name + ' 行動…';
    return;
  }
  if (pendingModalKey === key) return;
  pendingModalKey = key;

  switch (pd.kind) {
    case 'buy': {
      const t = st.layout.board[pd.tile];
      recordLandmark(t.name);
      // 聯排提示：買下後是否形成連排
      const n = st.layout.size;
      const adj = [1, -1].filter(d => {
        const j = ((pd.tile + d) % n + n) % n;
        return st.props[j] && st.props[j].owner === p.id;
      }).length;
      const runHint = adj > 0
        ? '<p class="run-hint">✨ 購入後與相鄰物業形成連排，租金 ×' + ENGINE.runMult(adj + 1) + '！</p>' : '';
      openModal('🏛️ 購買地標？',
        tileInfoHTML(pd.tile, pd.price, Math.round(t.price * 0.1)) + runHint +
        '<p class="modal-cash">你現有 ' + money(p.money) + '</p>',
        [
          { label: '購買 ' + money(pd.price), onClick: () => { closeModal(); dispatch({ type: 'buy', buy: true, player: pd.player }); } },
          { label: '放棄', cls: 'btn-ghost', onClick: () => { closeModal(); dispatch({ type: 'buy', buy: false, player: pd.player }); } }
        ]);
      break;
    }
    case 'quiz': {
      const q = DATA.QUESTIONS.find(x => x.id === pd.qid);
      openModal('📖 文脈卡 · ' + (st.difficulty === 'P' ? '小學' : '中學') + '題' + (p.streak >= 2 ? ' · 🔥連對' + p.streak : ''),
        '<p class="quiz-q">' + esc(q.q) + '</p>',
        q.opts.map((opt, i) => ({
          label: String.fromCharCode(65 + i) + '. ' + esc(opt),
          cls: 'btn-quiz',
          onClick: () => { closeModal(); dispatch({ type: 'answer', choice: i, player: pd.player }); }
        })));
      break;
    }
    case 'ack': {
      const nt = st.notice;
      if (nt && nt.kind === 'quiz' && nt.qid) recordQuestion(nt.qid);
      if (nt && nt.kind === 'quiz') Sound.play(nt.correct ? 'right' : 'wrong');
      else Sound.play('card');
      const icon = nt && nt.kind === 'quiz' ? (nt.correct ? '✅' : '❌') : (nt && nt.kind === 'wheel' ? '🎡' : '🎴');
      openModal(icon + ' ' + esc(nt ? nt.title : ''),
        (nt && nt.text ? '<p class="notice-text">' + esc(nt.text) + '</p>' : '') +
        (nt && nt.gain ? '<p class="notice-gain">+' + money(nt.gain) + '</p>' : '') +
        (nt && nt.info ? '<p class="notice-info">💡 ' + esc(nt.info) + '</p>' : ''),
        [{ label: '繼續', onClick: () => { closeModal(); dispatch({ type: 'ack', player: pd.player }); } }]);
      break;
    }
    case 'study': {
      openModal('📚 自修室留堂',
        '<p class="notice-text">' + esc(p.name) + ' 被罰留堂溫習，本回合停擲一次。</p>' +
        '<p class="notice-info">💡 也可以繳交 $50 立即離開，照常擲骰。</p>' +
        '<p class="modal-cash">你現有 ' + money(p.money) + '</p>',
        [
          { label: '付 $50 離開', onClick: () => {
              if (p.money < 50) { toast('現金不足！'); return; }
              closeModal(); dispatch({ type: 'study', pay: true, player: pd.player });
            } },
          { label: '留堂一回合', cls: 'btn-ghost', onClick: () => { closeModal(); dispatch({ type: 'study', pay: false, player: pd.player }); } }
        ]);
      break;
    }
    case 'shopBuy': {
      let html = '<p class="notice-text">老字號雜貨店，每人最多持 2 件道具（現有 ' + p.items.length + ' 件）。</p>';
      html += '<p class="modal-cash">你現有 ' + money(p.money) + '</p>';
      const buttons = DATA ? Object.keys(DATA.ITEMS).map(k => {
        const it = DATA.ITEMS[k];
        return {
          label: it.emoji + ' ' + it.name + ' ' + money(it.price),
          cls: 'btn-quiz',
          onClick: () => {
            if (p.money < it.price) { toast('現金不足！'); return; }
            closeModal(); dispatch({ type: 'shopBuy', item: k, player: pd.player });
          }
        };
      }) : [];
      buttons.push({ label: '不買了', cls: 'btn-ghost', onClick: () => { closeModal(); dispatch({ type: 'shopBuy', item: null, player: pd.player }); } });
      openModal('🏪 道具店', html, buttons);
      break;
    }
    default:
      break;
  }
}

/* ---------- 管理地標 + 道具 ---------- */
function openManage() {
  const st = G.state;
  const pd = st.pending;
  if (!pd || pd.kind !== 'turnEnd') return;
  const p = st.players[pd.player];
  const owned = ENGINE.ownedTiles(st, p.id);
  let html = '';
  // 道具欄
  html += '<div class="manage-group"><div class="codex-group-head"><b>🎒 道具（' + p.items.length + '/2）</b></div>';
  if (!p.items.length) html += '<p class="muted">暫無道具。到「道具店」格可購買。</p>';
  p.items.forEach(k => {
    const it = DATA.ITEMS[k];
    html += '<div class="manage-row"><span>' + it.emoji + ' <b>' + it.name + '</b> <small class="muted">' + it.desc + '</small></span>' +
      '<button class="btn btn-mini" data-item="' + k + '">使用</button></div>';
  });
  html += '</div>';
  // 地標
  if (!owned.length) {
    html += '<p class="muted">你暫時未擁有任何地標。買下同色全組後即可付費升級（最多 3 級）；路徑相鄰物業自動形成連排加租！</p>';
  } else {
    const byGroup = {};
    owned.forEach(i => { (byGroup[st.layout.board[i].group] = byGroup[st.layout.board[i].group] || []).push(i); });
    Object.keys(byGroup).forEach(gk => {
      const g = DATA.GROUPS[gk];
      const full = ENGINE.ownsFullGroup(st, p.id, gk);
      html += '<div class="manage-group"><div class="codex-group-head"><span class="group-chip" style="background:' +
        g.color + '">' + g.name + '</span><span class="muted">' + (full ? '✅已集齊，可升級' : '未集齊') + '</span></div>';
      byGroup[gk].forEach(i => {
        const prop = st.props[i];
        const cost = ENGINE.upgradeCost(st, p, i);
        const can = full && prop.level < 3 && p.money >= cost;
        const run = ENGINE.runLength(st, i);
        html += '<div class="manage-row"><span>' + esc(st.layout.board[i].name) +
          (run >= 2 ? ' <b class="gold-text">連排×' + ENGINE.runMult(run) + '</b>' : '') +
          ' <small class="muted">租金 ' + money(ENGINE.calcRent(st, i)) + '</small></span>' +
          '<span class="manage-stars">' + (prop.level ? '★'.repeat(prop.level) : '—') + '</span>' +
          (prop.level >= 3 ? '<span class="muted">滿級</span>'
            : '<button class="btn btn-mini" data-tile="' + i + '"' + (can ? '' : ' disabled') + '>升級 ' + money(cost) + '</button>') +
          '</div>';
      });
      html += '</div>';
    });
  }
  openModal('⬆️ 管理地標與道具', html + '<p class="modal-cash">你現有 ' + money(p.money) + '</p>',
    [{ label: '完成', onClick: closeModal }]);
  $('modal-body').querySelectorAll('[data-tile]').forEach(btn => {
    btn.onclick = () => {
      dispatch({ type: 'upgrade', tile: parseInt(btn.dataset.tile, 10), player: pd.player });
      if (Net.mode !== 'client') openManage();
    };
  });
  $('modal-body').querySelectorAll('[data-item]').forEach(btn => {
    btn.onclick = () => {
      const key = btn.dataset.item;
      if (key === 'moveCard') { openSwap(pd.player); return; }
      dispatch({ type: 'useItem', item: key, player: pd.player });
      if (Net.mode !== 'client') openManage();
    };
  });
}

// 搬遷卡：選自己的地 → 選對手同組地
function openSwap(pid) {
  const st = G.state;
  const p = st.players[pid];
  const owned = ENGINE.ownedTiles(st, pid);
  let html = '<p class="notice-text">第一步：選擇你要交出的地標</p><div class="swap-list">';
  owned.forEach(i => {
    html += '<button class="btn btn-quiz swap-give" data-give="' + i + '">' + esc(st.layout.board[i].name) +
      ' <small class="muted">($' + st.layout.board[i].price + ' · ' + DATA.GROUPS[st.layout.board[i].group].name + ')</small></button>';
  });
  html += '</div>';
  openModal('🔄 搬遷卡 · 交出', html, [{ label: '取消', cls: 'btn-ghost', onClick: openManage }]);
  $('modal-body').querySelectorAll('.swap-give').forEach(btn => {
    btn.onclick = () => openSwapTarget(pid, parseInt(btn.dataset.give, 10));
  });
}
function openSwapTarget(pid, give) {
  const st = G.state;
  const group = st.layout.board[give].group;
  let html = '<p class="notice-text">第二步：選擇對手的同組地標（AI 對手按估價自動決定是否同意）</p><div class="swap-list">';
  let any = false;
  for (let i = 0; i < st.layout.size; i++) {
    const t = st.layout.board[i], prop = st.props[i];
    if (t.type === 'landmark' && t.group === group && prop && prop.owner !== pid) {
      any = true;
      const o = st.players[prop.owner];
      html += '<button class="btn btn-quiz swap-want" data-want="' + i + '">' + esc(t.name) +
        ' <small class="muted">（' + esc(o.name) + ' · $' + t.price + '）</small></button>';
    }
  }
  if (!any) html += '<p class="muted">同組暫無對手地標可交換。</p>';
  html += '</div>';
  openModal('🔄 搬遷卡 · 換入', html, [{ label: '取消', cls: 'btn-ghost', onClick: openManage }]);
  $('modal-body').querySelectorAll('.swap-want').forEach(btn => {
    btn.onclick = () => {
      closeModal();
      dispatch({ type: 'useItem', item: 'moveCard', give: give, want: parseInt(btn.dataset.want, 10), player: pid });
    };
  });
}

/* ---------- 操作分發 ---------- */
function dispatch(action) {
  if (Net.mode === 'client') { MFT2Online.sendIntent(action); return; }
  const res = ENGINE.act(G.state, action);
  if (!res.ok) { toast(res.error || '操作失敗'); return; }
  if (Net.mode === 'host' && window.MFT2Online) MFT2Online.broadcast(G.state);
  render();
}

/* ---------- AI 自動行動 ---------- */
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
    const action = ENGINE.aiAction(G.state);
    if (action) {
      action.player = now.player;
      const res = ENGINE.act(G.state, action);
      if (res.ok && Net.mode === 'host' && window.MFT2Online) MFT2Online.broadcast(G.state);
      render();
    }
  }, pd.kind === 'roll' ? 1000 : 1200);
}

/* ---------- 教學氣泡（v2：前 4 回合，可關閉） ---------- */
function maybeShowTutorial(pd, ctrl) {
  const bubble = $('tutorial-bubble');
  if (Store.get(LSK.tut, false) || !ctrl || G.state.round > 4) {
    bubble.classList.add('hidden');
    return;
  }
  const tips = {
    1: '👋 歡迎！棋盤可拖動平移、滾輪/雙指縮放，右上角可切換 2D/3D 視角。點「擲骰」出發！',
    2: '🏛️ 買下地標可收租；若與相鄰自有物業連成一排（連排），租金再加倍，棋盤上有金帶標示！',
    3: '⬆️ 集齊同色全組後，回合結束前點「管理地標」加蓋建築（平房→騎樓→塔樓），租金大增！',
    4: '🏪 留意新功能格：幸運輪盤、纜車傳送、雙倍骰、道具店。道具每人最多持 2 件！'
  };
  $('tut-text').textContent = tips[G.state.round] || '';
  bubble.classList.remove('hidden');
}

/* ---------- 結算（含知識收穫） ---------- */
function showResult() {
  const st = G.state;
  updateBoard(); updatePlayersBar(); updateLog();
  processFx();
  closeModal();
  const winP = st.players[st.winner];
  let html = '<div class="result-cup">🏆</div>' +
    '<h2>' + esc(winP.name) + '</h2>' +
    '<p class="muted">成為濠港雙城大亨！（' + (st.round > st.maxRounds ? st.maxRounds + ' 回合結算' : '對手全部破產') + '）</p>' +
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
  $('result-content').innerHTML = html;
  // 知識收穫
  const lmCount = st.knowledge.landmarks.length;
  const qRight = st.knowledge.questionsRight.length;
  const qSeen = st.knowledge.questionsSeen.length;
  const codex = getCodex();
  const codexNow = Object.keys(codex.landmarks).length + Object.keys(codex.questions).length;
  const delta = Math.max(0, codexNow - (G.codexBefore || 0));
  $('result-knowledge').innerHTML =
    '<h3>📚 本局知識收穫</h3>' +
    '<div class="stat-grid">' +
    '<div class="stat-cell"><div class="stat-num">' + lmCount + '</div><div class="stat-label">見過的地標知識</div></div>' +
    '<div class="stat-cell"><div class="stat-num">' + qRight + ' / ' + qSeen + '</div><div class="stat-label">文脈答對 / 作答</div></div>' +
    '<div class="stat-cell"><div class="stat-num">+' + delta + '</div><div class="stat-label">圖鑑新增收集</div></div>' +
    '<div class="stat-cell"><div class="stat-num">' + Math.round(codexNow / (DATA.LANDMARKS.length + DATA.QUESTIONS.length) * 100) + '%</div><div class="stat-label">圖鑑總進度</div></div>' +
    '</div>';
  if (!G.statsRecorded) {
    G.statsRecorded = true;
    const s = getStats();
    const myIds = Net.mode === 'client' ? [G.myId] : (Net.mode === 'host' ? [0] : st.players.filter(p => !p.isAI).map(p => p.id));
    const hasHuman = myIds.some(id => id !== null && st.players[id] && !st.players[id].isAI);
    if (hasHuman) {
      s.games++;
      if (myIds.includes(st.winner)) s.wins++;
      const myBest = Math.max.apply(null, myIds.map(id => ENGINE.assetValue(st, id)));
      if (myBest > s.best) s.best = myBest;
      Store.set(LSK.stats, s);
    }
    st.knowledge.landmarks.forEach(id => recordLandmark(DATA.LANDMARKS[id].name));
  }
  $('btn-result-again').onclick = () => { leaveToMenu(); };
  $('btn-result-menu').onclick = () => { leaveToMenu(); renderCodex(); showScreen('screen-codex'); };
  showScreen('screen-result');
}

function leaveToMenu() {
  if (window.MFT2Online) MFT2Online.leave();
  Net.mode = 'local'; Net.inGame = false;
  clearTimeout(G.aiTimer);
  G.state = null;
  showScreen('screen-menu');
}

/* ==================== 七、線上聯機大廳 ==================== */
const Lobby = { char: 'zheng', difficulty: 'P', mapId: 'ring', isHost: false };

function openLobby() {
  Lobby.char = DATA.CHARACTERS[0].id;
  Lobby.difficulty = 'P';
  Lobby.mapId = 'ring';
  Lobby.isHost = false;
  const prof = getProfile();
  $('input-lobby-name').value = prof.nickname || '';
  $('input-lobby-code').value = '';
  $('lobby-status').textContent = '';
  $('lobby-room').classList.add('hidden');
  $('lobby-entry').classList.remove('hidden');
  renderLobbyChars();
  bindDiffRow($('lobby-difficulty-row'), lv => { Lobby.difficulty = lv; });
  buildMapPicker($('lobby-maps'), id => { Lobby.mapId = id; });
  $('btn-lobby-back').onclick = () => { if (window.MFT2Online) MFT2Online.leave(); showScreen('screen-menu'); };
  $('btn-lobby-host').onclick = hostRoom;
  $('btn-lobby-join').onclick = joinRoom;
  $('btn-lobby-start').onclick = () => {
    const state = MFT2Online.startGame({ difficulty: Lobby.difficulty, mapId: Lobby.mapId });
    if (state) enterGame(state, { mode: 'host', myId: 0 });
    else toast('至少需要 2 位玩家才能開始');
  };
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
      '<div class="char-passive">' + c.passive + '</div>';
    card.onclick = () => { Lobby.char = c.id; renderLobbyChars(); };
    card.ondblclick = () => showCharBio(c);
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
  $('lobby-map-row').classList.toggle('hidden', !isHost);
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
    if (Net.mode === 'host') return;
    if (!$('screen-game').classList.contains('active') || !G.state) {
      enterGame(state, { mode: 'client', myId: myId });
    } else {
      G.state = state;
      render();
    }
  };
  MFT2Online.onIntent = (playerId, action) => {
    if (Net.mode !== 'host' || !G.state || G.state.over) return;
    const pd = G.state.pending;
    if (!pd || pd.player !== playerId) return;
    if (G.state.players[playerId].isAI) return;
    action.player = playerId;
    const res = ENGINE.act(G.state, action);
    if (res.ok) {
      MFT2Online.broadcast(G.state);
      render();
    }
  };
  MFT2Online.onPeerDropped = playerId => {
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

/* ==================== 八、按鈕綁定與啟動 ==================== */
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
      { label: '確認離開', cls: 'btn-ghost', onClick: () => { closeModal(); leaveToMenu(); } }
    ]);
  };
  $('btn-tut-close').onclick = () => {
    Store.set(LSK.tut, true);
    $('tutorial-bubble').classList.add('hidden');
  };
  initCamera();
}

// 設置頁與大廳角色卡：雙擊/長按查看生平
document.addEventListener('dblclick', e => {
  const card = e.target.closest && e.target.closest('.char-card');
  if (!card) return;
  const name = card.querySelector('.char-name');
  if (!name) return;
  const c = DATA.CHARACTERS.find(x => x.name === name.textContent);
  if (c) showCharBio(c);
});

function boot() {
  migrateCodex();
  initMenu();
  initGameButtons();
  wireOnline();
  $('btn-help-back').onclick = () => showScreen('screen-menu');
  showScreen('screen-menu');
}

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
