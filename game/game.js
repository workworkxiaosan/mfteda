/* ==========================================================
   濠江財富大亨 — game.js
   全部遊戲邏輯：核心循環、事件、題庫、簽到、成就、排行榜
   ========================================================== */
'use strict';

/* ================= 基礎工具 ================= */
const $ = (id) => document.getElementById(id);
const LS = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  del(key) { localStorage.removeItem(key); }
};
const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');
const fmtSign = (n) => (n >= 0 ? '+' : '-') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
const fmtPct = (x) => (x >= 0 ? '+' : '') + (x * 100).toFixed(1) + '%';

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* 可種子化隨機數（每日挑戰用） */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFromString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* 近似正態分佈：三個均勻分佈合成，範圍約 [-1, 1] */
function normalish(rng) {
  const r = rng || Math.random;
  return (r() + r() + r() - 1.5) / 1.5;
}

/* ================= 遊戲數據 ================= */
const ASSETS = [
  { id: 'tourism',  name: '休閒旅遊股',     icon: '🎰', vol: 0.15, desc: '綜合度假村、酒店' },
  { id: 'mice',     name: '會展商貿股',     icon: '🤝', vol: 0.10, desc: 'MICE 會展產業' },
  { id: 'fintech',  name: '金融科技股',     icon: '💳', vol: 0.18, desc: '數字金融、跨境支付' },
  { id: 'utility',  name: '公用事業股',     icon: '💡', vol: 0.04, desc: '水電燃氣，穩定分紅' },
  { id: 'deposit',  name: '澳門元定期存款', icon: '🏦', vol: 0.0,  desc: '固定月息 0.3%，無風險' },
  { id: 'fund',     name: '大灣區指數基金', icon: '🌉', vol: 0.07, desc: '分散投資、長期持有' }
];
const DEPOSIT_RATE = 0.003;   // 定存月息
const CASH_RATE = 0.001;      // 閒置現金月息
const BASE_CAPITAL = 100000;
const TRADE_STEP = 5000;

const EVENTS = [
  { title: '十一黃金周遊客激增', desc: '內地長假帶動訪澳旅客創新高，酒店一房難求，度假村人頭湧湧。', effects: { tourism: 0.08, mice: 0.02 } },
  { title: '颱風「海葵」襲澳', desc: '八號風球高懸，市面停業兩日，旅遊及會展活動受阻，公用事業加班搶修。', effects: { tourism: -0.10, mice: -0.05, utility: 0.02 }, tag: 'typhoon' },
  { title: '金管局推數字澳門元試點', desc: '澳門金融管理局宣布數字澳門元沙盒試點，金融科技企業率先受惠。', effects: { fintech: 0.10 } },
  { title: '大型國際會展落戶澳門', desc: '全球科技展覽首度移師澳門舉行，會展場地檔期爆滿。', effects: { mice: 0.09, tourism: 0.03 } },
  { title: '博彩毛收入遜預期', desc: '最新博彩毛收入數據低於市場預期，休閒旅遊板塊受壓。', effects: { tourism: -0.08 } },
  { title: '橫琴深合區新政策出台', desc: '橫琴粵澳深度合作區推出跨境金融便利措施，大灣區資金流動加快。', effects: { fintech: 0.06, fund: 0.05 } },
  { title: '澳門大橋通車利好', desc: '新跨海通道正式通車，物流與通勤效率提升，區域經濟一體化加速。', effects: { fund: 0.06, utility: 0.01 } },
  { title: '國際評級機構上調澳門展望', desc: '信用評級展望由「穩定」上調至「正面」，整體市場氣氛向好。', effects: { tourism: 0.04, mice: 0.04, fintech: 0.04, utility: 0.01, fund: 0.04 } },
  { title: '環球加息潮持續', desc: '主要央行再度加息，高息環境令定存吸引力上升，股市承壓。', effects: { tourism: -0.04, mice: -0.03, fintech: -0.05, fund: -0.03 } },
  { title: '美食節+大賽車雙節同開', desc: '澳門美食節與格蘭披治大賽車同期舉行，遊客消費力旺盛。', effects: { tourism: 0.07, mice: 0.03 } },
  { title: '跨境電商糾紛急升', desc: '跨境支付投訴個案增加，監管機構約談多間金融科技公司。', effects: { fintech: -0.07 } },
  { title: '用水用電需求創新高', desc: '夏季高溫持續，民生用水用電量破紀錄，公用事業收入穩步上揚。', effects: { utility: 0.03 } },
  { title: '內地放寬赴澳簽注', desc: '赴澳旅遊簽注政策進一步放寬，自由行城市名單擴大。', effects: { tourism: 0.09, fund: 0.02 } },
  { title: '會展業淡季來臨', desc: '傳統會展淡季，多個展館使用率下滑。', effects: { mice: -0.06 } },
  { title: '澳門獲評「最佳會展城市」', desc: '國際會展協會頒發年度大獎，澳門會展品牌揚威海外。', effects: { mice: 0.08, tourism: 0.02 } },
  { title: '港元匯率波動加劇', desc: '聯繫匯率下澳門元跟隨港元波動，進口成本上升，市場觀望氣氛濃。', effects: { tourism: -0.03, mice: -0.02, fintech: 0.02 } },
  { title: '「演藝之都」演唱會經濟爆發', desc: '多場巨星演唱會落戶澳門，帶動酒店、餐飲、零售全線暢旺。', effects: { tourism: 0.10, mice: 0.04 } },
  { title: '大灣區基建投資加碼', desc: '中央公布新一輪大灣區基建規劃，區內上市公司普遍造好。', effects: { fund: 0.08, utility: 0.02 } },
  { title: '流感高峰襲澳', desc: '流感個案急增，部分旅客改期出行，市面人流略減。', effects: { tourism: -0.05, mice: -0.03 } },
  { title: '金融人才培育計劃啟動', desc: '政府聯同高校推出金融科技人才計劃，行業長遠前景看俏。', effects: { fintech: 0.05, fund: 0.02 } }
];

/* 題庫：lv 1 入門 / 2 進階 / 3 高手 */
const QUIZ_BANK = [
  { lv: 1, q: '把錢存入銀行定期存款，銀行會支付什麼給你？', opts: ['手續費', '利息', '印花稅', '佣金'], ans: 1, exp: '利息是銀行借用你資金的報酬，定期存款利率一般高於活期。' },
  { lv: 1, q: '「通貨膨脹」是指什麼？', opts: ['物價持續上升，錢的購買力下降', '物價持續下跌', '銀行倒閉', '匯率固定不變'], ans: 0, exp: '通脹令同樣的錢買到的東西變少，所以錢放床下底會「越放越縮水」。' },
  { lv: 1, q: '澳門的法定貨幣是？', opts: ['港元', '人民幣', '澳門元（MOP）', '美元'], ans: 2, exp: '澳門元（俗稱葡幣）是澳門法定貨幣，與港元掛鈎。' },
  { lv: 1, q: '以下哪一種投資工具風險一般最低？', opts: ['單一股票', '加密貨幣', '銀行定期存款', '期貨'], ans: 2, exp: '定期存款有固定利息且受存款保障，風險極低，但回報也較低。' },
  { lv: 1, q: '「不要把所有雞蛋放在同一個籃子裡」是指什麼投資原則？', opts: ['短線投機', '分散投資', '全倉買入', '借錢投資'], ans: 1, exp: '分散投資可降低單一資產大跌帶來的衝擊，是風險管理的基本功。' },
  { lv: 1, q: '買入股票代表你成為公司的？', opts: ['債主', '部分擁有人（股東）', '員工', '客戶'], ans: 1, exp: '股票代表公司的一部分擁有權，股東可分享公司盈利（股息）與股價升值。' },
  { lv: 1, q: '儲蓄的第一步通常是？', opts: ['先消費剩多少儲多少', '先儲起一部分收入再消費', '借錢儲蓄', '等加薪才儲'], ans: 1, exp: '「收入 − 儲蓄 = 支出」比「收入 − 支出 = 儲蓄」更容易累積財富。' },
  { lv: 2, q: '本金 10,000 元，年利率 5%，以複利計算兩年後約有多少？', opts: ['11,000 元', '11,025 元', '10,500 元', '12,000 元'], ans: 1, exp: '複利 = 本金 ×(1+利率)^期數 = 10000×1.05² = 11,025 元，利疊利是複利的威力。' },
  { lv: 2, q: '「72 法則」用來估算什麼？', opts: ['稅率', '本金翻倍所需年數', '通脹率', '股價目標'], ans: 1, exp: '72 ÷ 年回報率 ≈ 本金翻倍的年數，例如 8% 回報約 9 年翻倍。' },
  { lv: 2, q: '債券價格與市場利率通常呈什麼關係？', opts: ['正比', '反比', '無關', '完全相同'], ans: 1, exp: '利率上升時，舊債券票面利息吸引力下降，價格下跌，兩者反向而行。' },
  { lv: 2, q: '指數基金（如大灣區指數基金）的主要優點是？', opts: ['保證賺錢', '自動分散持有多隻股票、費用低', '完全無風險', '每日派息'], ans: 1, exp: '指數基金一次過持有一籃子股票，分散風險且管理費低，適合長線投資。' },
  { lv: 2, q: '以下哪項屬於「機會成本」？', opts: ['銀行收取的手續費', '選擇定存而放棄的潛在股票回報', '買股票的本金', '提款機跨行費'], ans: 1, exp: '機會成本是做出一個選擇時，所放棄的最佳替代選項的價值。' },
  { lv: 2, q: '「風險與回報」的一般關係是？', opts: ['高回報通常伴隨高風險', '高回報必然低風險', '兩者無關', '低風險必賺大錢'], ans: 0, exp: '天下沒有免費午餐：承諾「高回報、零風險」的多半是騙局。' },
  { lv: 2, q: '月供股票/基金（平均成本法）的好處是？', opts: ['保證低買高賣', '攤平買入成本，減少擇時風險', '免除所有費用', '只賺不蝕'], ans: 1, exp: '定期定額投入可在價低時多買、價高時少買，平滑市場波動。' },
  { lv: 3, q: '澳門元與港元的匯率制度屬於？', opts: ['自由浮動', '聯繫匯率（固定掛鈎）', '完全由金管局每日定價', '與美元直接掛鈎'], ans: 1, exp: '澳門元與港元掛鈎（約 1 HKD = 1.03 MOP），屬聯繫匯率安排。' },
  { lv: 3, q: '持有港元資產的澳門投資者，面對美元大幅波動時的主要風險是？', opts: ['匯率傳導風險', '印花稅上升', '存摺遺失', '強積金縮水'], ans: 0, exp: '港元與美元掛鈎，美元強弱會透過匯率傳導影響以其他貨幣計價的資產價值。' },
  { lv: 3, q: '企業資產負債表中「資產 = 負債 + ？」', opts: ['現金', '股東權益', '收入', '存貨'], ans: 1, exp: '會計恆等式：資產 = 負債 + 股東權益，是看懂財報的起點。' },
  { lv: 3, q: '市盈率（P/E）= 股價 ÷ ？', opts: ['每股盈利', '每股股息', '每股淨資產', '營業額'], ans: 0, exp: '市盈率反映投資者願意為每一元盈利付出的價格，是最常用的估值指標之一。' },
  { lv: 3, q: '通脹高企時，以下哪類資產通常較能保值？', opts: ['長期固定利率債券', '實物資產（如房地產、商品）', '床下現金', '零息存款'], ans: 1, exp: '實物資產價格往往隨通脹上升，而固定利率資產的實際回報會被通脹侵蝕。' },
  { lv: 3, q: '「分散投資」能消除的是哪種風險？', opts: ['系統性風險（市場整體下跌）', '非系統性風險（個別公司/行業風險）', '所有風險', '通脹風險'], ans: 1, exp: '分散可消除個別資產的非系統性風險，但市場整體下跌的系統性風險仍在。' },
  { lv: 3, q: '夏普比率（Sharpe Ratio）衡量的是？', opts: ['公司規模', '每承擔一單位風險所獲得的超額回報', '派息次數', '換手率'], ans: 1, exp: '夏普比率越高，代表在相同風險下獲得越好回報，是評估基金表現的重要指標。' },
  { lv: 3, q: '當中央銀行「減息」時，一般會刺激？', opts: ['儲蓄意欲上升', '借貸與投資活動增加', '通脹即時歸零', '匯率必然上升'], ans: 1, exp: '減息降低資金成本，鼓勵企業借貸擴張與消費投資，通常利好股市。' }
];

/* 成就定義 */
const ACHIEVEMENTS = [
  { id: 'first_game',   icon: '🎓', name: '初出茅廬',     desc: '首次完成一局 12 個月遊戲' },
  { id: 'double',       icon: '💰', name: '資產翻倍',     desc: '單局結束時資產達初始資金兩倍' },
  { id: 'hot_month',    icon: '🔥', name: '火紅月份',     desc: '單月盈利超過 20%' },
  { id: 'quiz_streak5', icon: '🧠', name: '最強大腦',     desc: '連續答對 5 條財經題' },
  { id: 'diversified',  icon: '🧺', name: '分散投資大師', desc: '同時持有 4 個以上不同板塊' },
  { id: 'conservative', icon: '🛡️', name: '保守派',       desc: '全倉定存（90% 以上）完成一個月結算' },
  { id: 'rank_s',       icon: '👑', name: '濠江大亨',     desc: '年終結算獲得 S 級評級' },
  { id: 'streak7',      icon: '📅', name: '濠江常客',     desc: '連續簽到 7 天，解鎖限定稱號' },
  { id: 'daily_done',   icon: '📆', name: '每日一戰',     desc: '完成一次每日挑戰' },
  { id: 'five_games',   icon: '🎮', name: '老玩家',       desc: '累計完成 5 局遊戲' },
  { id: 'typhoon_win',  icon: '🌀', name: '風暴中的贏家', desc: '颱風事件月份仍然錄得盈利' },
  { id: 'quiz_master',  icon: '🎯', name: '財金學霸',     desc: '以 80% 以上答題正確率完成一局' }
];

/* 排行榜 mock 數據（全澳高校虛擬玩家） */
const MOCK_PLAYERS = [
  { name: '濠鏡索羅斯', school: '澳門大學', score: 68.4 },
  { name: '大三巴股神', school: '澳門科技大學', score: 61.2 },
  { name: '議事亭前地', school: '澳門大學', score: 55.8 },
  { name: '媽閣廟求籤王', school: '澳門旅遊大學', score: 52.3 },
  { name: '葡撻炒散王', school: '澳門城市大學', score: 47.9 },
  { name: '氹仔小巴菲特', school: '澳門理工大學', score: 44.1 },
  { name: '路環漁村仔', school: '澳門大學', score: 39.6 },
  { name: '新馬路乜都有', school: '澳門科技大學', score: 36.8 },
  { name: '龍環葡韻', school: '澳門旅遊大學', score: 33.5 },
  { name: '東望洋燈塔', school: '澳門城市大學', score: 30.2 },
  { name: '福隆新街一哥', school: '澳門理工大學', score: 27.4 },
  { name: '崗頂劇院貓', school: '聖若瑟大學', score: 24.9 },
  { name: '白鴿巢公園', school: '澳門大學', score: 21.7 },
  { name: '十月初五街', school: '澳門科技大學', score: 18.3 },
  { name: '瘋堂斜巷', school: '澳門城市大學', score: 15.6 },
  { name: '黑沙海灘浪人', school: '澳門旅遊大學', score: 12.8 },
  { name: '紅街市師奶', school: '中學生', score: 9.4 },
  { name: '塔石廣場少年', school: '中學生', score: 6.1 },
  { name: '澳門半島游擊', school: '澳門鏡湖護理學院', score: 3.5 },
  { name: '西灣湖夜跑者', school: '澳門理工大學', score: 1.2 }
];

const CHECKIN_FORTUNES = [
  '上上籤：財源廣進，投資順利！', '上籤：貴人相助，眼光獨到！',
  '中上籤：穩中求勝，步步高升！', '上籤：濠江風水旺你！',
  '上上籤：大三巴見證你的財富之路！', '中籤：謹慎決策，方得始終！',
  '上籤：媽閣廟保佑，逢凶化吉！'
];

const LEVELS = [
  { xp: 0,      title: '財智學徒' },
  { xp: 50000,  title: '見習操盤手' },
  { xp: 200000, title: '資深投資人' },
  { xp: 500000, title: '濠江大亨' }
];

const TUTORIAL_STEPS = [
  { icon: '📰', text: '每個月初，你會收到一條澳門市場新聞。新聞會利好或利淡不同板塊，讀懂新聞是賺錢第一步！' },
  { icon: '📊', text: '在交易面板用 $5,000 為單位調整 6 大板塊的持倉。定存穩定但回報低，旅遊股波動大但爆發力強——記得分散投資！' },
  { icon: '🧠', text: '每月有機會觸發快問快答，答對財經題可獲投資回報 +2% 或 $2,000 獎金。12 個月後爭取 S 級評級，登上全澳排行榜！' }
];

/* ================= 全局狀態 ================= */
let profile = LS.get('mft_profile', null);           // {nickname, school, title?}
let achState = LS.get('mft_achievements', {});       // {id: true}
let checkin = LS.get('mft_checkin', { streak: 0, last: null, voucher: 0 });
let xp = LS.get('mft_xp', 0);
let myBest = LS.get('mft_best', []);                 // [{score, date, mode}]
let gamesPlayed = LS.get('mft_games', 0);
let quizStreakGlobal = LS.get('mft_quiz_streak', 0);
let dailyDone = LS.get('mft_daily', null);           // 今日是否已玩過每日挑戰 {date, score}

let game = null;          // 當局狀態
let quizTimer = null;     // 答題倒計時 interval
let quizAutoTimer = null; // 答題超時後自動結算 timer
let autoNextTimer = null; // 月結算自動續月 timer
let autoNextEnabled = LS.get('mft_auto_next', false); // 自動續月開關（localStorage 記憶）

/* ================= 屏幕切換 ================= */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0, 0);
}

function toast(msg, icon) {
  const box = $('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = (icon ? icon + ' ' : '') + msg;
  box.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 350);
  }, 2600);
}

/* ================= 通用確認彈窗 ================= */
let confirmCallback = null;
function askConfirm(msg, onYes) {
  $('confirm-message').textContent = msg;
  confirmCallback = onYes;
  $('modal-confirm').classList.remove('hidden');
}
function closeConfirm() {
  confirmCallback = null;
  $('modal-confirm').classList.add('hidden');
}

/* ================= 玩家等級 ================= */
function currentLevel() {
  let lv = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.xp) lv = l;
  return lv;
}
function nextLevel() {
  for (const l of LEVELS) if (l.xp > xp) return l;
  return null;
}
function addXp(amount) {
  xp += Math.max(0, Math.round(amount));
  LS.set('mft_xp', xp);
}

/* ================= 成就 ================= */
function unlockAch(id) {
  if (achState[id]) return;
  achState[id] = true;
  LS.set('mft_achievements', achState);
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (a) toast('解鎖成就：' + a.name, a.icon);
  if (id === 'streak7' && profile && !profile.title) {
    profile.title = '濠江常客';
    LS.set('mft_profile', profile);
  }
}
function hasAch(id) { return !!achState[id]; }

/* ================= 簽到（自動完成，toast 提示，不打斷流程） ================= */
function checkinNeeded() {
  return checkin.last !== todayStr();
}
function doCheckin() {
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
  checkin.streak = (checkin.last === yStr) ? checkin.streak + 1 : 1;
  checkin.last = todayStr();
  checkin.voucher = Math.min(checkin.streak * 5000, 25000);
  LS.set('mft_checkin', checkin);

  const fortune = CHECKIN_FORTUNES[Math.floor(Math.random() * CHECKIN_FORTUNES.length)];
  toast('簽到成功！連簽 ' + checkin.streak + ' 天，本金加成 +' + checkin.voucher.toLocaleString('en-US') + ' · ' + fortune, '🧧');
  if (checkin.streak >= 7) unlockAch('streak7');
}

/* ================= 開局 ================= */
function newGame(mode) {
  // mode: 'normal' (12個月) | 'daily' (3個月快局，固定種子)
  const isDaily = mode === 'daily';
  if (isDaily && dailyDone && dailyDone.date === todayStr()) {
    toast('今日挑戰已完成，聽日再嚟！', '📆');
    return;
  }
  const voucher = checkin.voucher || 0;
  const initial = BASE_CAPITAL + (isDaily ? 0 : voucher);
  const holdings = {};
  ASSETS.forEach(a => holdings[a.id] = 0);

  let rng = Math.random, eventSeq = null;
  if (isDaily) {
    rng = mulberry32(seedFromString('mft-daily-' + todayStr()));
    // 固定種子事件序列，全服同題
    eventSeq = [];
    const idxRng = mulberry32(seedFromString('mft-daily-evt-' + todayStr()));
    const pool = EVENTS.map((_, i) => i);
    for (let m = 0; m < 3; m++) {
      eventSeq.push(pool.splice(Math.floor(idxRng() * pool.length), 1)[0]);
    }
  }

  game = {
    mode: mode,
    totalMonths: isDaily ? 3 : 12,
    month: 1,
    initial: initial,
    cash: initial,
    holdings: holdings,
    rng: rng,
    eventSeq: eventSeq,
    usedEvents: [],
    netHistory: [initial],
    quizTotal: 0,
    quizCorrect: 0,
    quizStreak: 0,
    quizBonusPending: 0,
    maxDiversified: 0,
    typhoonMonths: [],
    monthlyProfits: [],
    currentEvent: null
  };
  if (!isDaily && voucher > 0) {
    toast('已使用簽到加成券：本金 +' + voucher.toLocaleString('en-US'), '🎟️');
  }
  startMonth();
}

function startMonth() {
  // 抽取本月事件（不重複）
  let evtIdx;
  if (game.eventSeq) {
    evtIdx = game.eventSeq[game.month - 1];
  } else {
    const avail = EVENTS.map((_, i) => i).filter(i => !game.usedEvents.includes(i));
    evtIdx = avail[Math.floor(game.rng() * avail.length)];
  }
  game.usedEvents.push(evtIdx);
  game.currentEvent = EVENTS[evtIdx];
  if (game.currentEvent.tag === 'typhoon') game.typhoonMonths.push(game.month);

  saveGame();
  renderTrade();
  showScreen('screen-trade');
}

function netWorth() {
  let sum = game.cash;
  ASSETS.forEach(a => sum += game.holdings[a.id]);
  return sum;
}

/* ================= 交易面板（新聞橫幅 + 交易同屏） ================= */
function renderTrade() {
  $('trade-month-label').textContent = '第 ' + game.month + ' / ' + game.totalMonths + ' 個月' + (game.mode === 'daily' ? ' · 每日挑戰' : '');
  // 本月新聞橫幅
  const e = game.currentEvent;
  $('news-title').textContent = e.title;
  $('news-desc').textContent = e.desc;
  const effBox = $('news-effects');
  effBox.innerHTML = '';
  Object.keys(e.effects).forEach(id => {
    const a = ASSETS.find(x => x.id === id);
    const v = e.effects[id];
    const chip = document.createElement('span');
    chip.className = 'eff-chip ' + (v > 0 ? 'pos' : 'neg');
    chip.textContent = a.icon + ' ' + a.name + ' ' + fmtPct(v);
    effBox.appendChild(chip);
  });
  if (Object.keys(e.effects).length === 0) {
    effBox.innerHTML = '<span class="eff-chip neu">市場整體平穩</span>';
  }
  resetTradeConfirmBtn();

  $('trade-cash').textContent = fmt(game.cash);
  const box = $('trade-rows');
  box.innerHTML = '';
  ASSETS.forEach(a => {
    const row = document.createElement('div');
    row.className = 'trade-row';
    const volLabel = a.vol === 0 ? '固定月息 0.3%' : '月波動 ±' + Math.round(a.vol * 100) + '%';
    row.innerHTML =
      '<div class="trade-row-head"><span>' + a.icon + ' ' + a.name +
      ' <span class="vol-tag">' + volLabel + '</span></span>' +
      '<span class="trade-row-amt" id="amt-' + a.id + '">' + fmt(game.holdings[a.id]) + '</span></div>' +
      '<div class="trade-controls">' +
      '<button class="trade-minus" data-id="' + a.id + '" data-dir="-1">−</button>' +
      '<input type="range" min="0" max="' + Math.max(0, game.cash + game.holdings[a.id]) + '" step="' + TRADE_STEP + '" value="' + game.holdings[a.id] + '" data-id="' + a.id + '">' +
      '<button class="trade-plus" data-id="' + a.id + '" data-dir="1">＋</button></div>';
    box.appendChild(row);
  });

  box.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const dir = parseInt(btn.dataset.dir, 10);
      adjustHolding(id, dir * TRADE_STEP);
    });
  });
  box.querySelectorAll('input[type="range"]').forEach(sl => {
    sl.addEventListener('input', () => {
      setHolding(sl.dataset.id, parseInt(sl.value, 10));
    });
  });
}

function setHolding(id, target) {
  const cur = game.holdings[id];
  let delta = target - cur;
  if (delta > game.cash) { target = cur + Math.floor(game.cash / TRADE_STEP) * TRADE_STEP; }
  if (target < 0) target = 0;
  game.cash += cur - target;
  game.holdings[id] = target;
  refreshTradeUI();
}

function adjustHolding(id, delta) {
  setHolding(id, game.holdings[id] + delta);
}

function refreshTradeUI() {
  $('trade-cash').textContent = fmt(game.cash);
  ASSETS.forEach(a => {
    const el = $('amt-' + a.id);
    if (el) el.textContent = fmt(game.holdings[a.id]);
    const sl = document.querySelector('input[type="range"][data-id="' + a.id + '"]');
    if (sl) {
      sl.max = Math.max(0, game.cash + game.holdings[a.id]);
      if (document.activeElement !== sl) sl.value = game.holdings[a.id];
    }
  });
}

/* ================= 確認交易（按鈕二次態，不打斷流程） ================= */
let tradeConfirmArmed = false;
let tradeConfirmTimer = null;
function resetTradeConfirmBtn() {
  tradeConfirmArmed = false;
  clearTimeout(tradeConfirmTimer);
  const btn = $('btn-trade-confirm');
  btn.textContent = '確認本月配置 ✓';
  btn.classList.remove('armed');
}
function handleTradeConfirm() {
  if (!tradeConfirmArmed) {
    tradeConfirmArmed = true;
    const btn = $('btn-trade-confirm');
    btn.textContent = '再次點擊鎖定結算 ✓';
    btn.classList.add('armed');
    clearTimeout(tradeConfirmTimer);
    tradeConfirmTimer = setTimeout(resetTradeConfirmBtn, 3000);
    return;
  }
  clearTimeout(tradeConfirmTimer);
  resetTradeConfirmBtn();
  confirmTrade();
}

/* ================= 確認交易 → 答題或結算 ================= */
function confirmTrade() {
  const invested = ASSETS.filter(a => game.holdings[a.id] > 0).length;
  game.maxDiversified = Math.max(game.maxDiversified, invested);
  if (invested >= 4) unlockAch('diversified');
  saveGame();
  // 50% 概率觸發快問快答
  if (game.rng() < 0.5) {
    startQuiz();
  } else {
    settleMonth();
  }
}

/* ================= 快問快答 ================= */
function quizLevel() {
  if (game.mode === 'daily') return Math.min(3, 1 + Math.floor((game.month - 1)));
  if (game.month <= 4) return 1;
  if (game.month <= 8) return 2;
  return 3;
}

function startQuiz() {
  clearTimeout(quizAutoTimer);
  const lv = quizLevel();
  const pool = QUIZ_BANK.filter(q => q.lv <= lv);
  const q = pool[Math.floor(Math.random() * pool.length)];
  const lvNames = { 1: '入門題', 2: '進階題', 3: '高手題' };
  $('quiz-level-badge').textContent = lvNames[q.lv] + ' · 答對獲回報 +2% 或 $2,000';
  $('quiz-question').textContent = q.q;
  $('quiz-feedback').classList.add('hidden');
  $('btn-quiz-continue').classList.add('hidden');
  const optsBox = $('quiz-options');
  optsBox.innerHTML = '';
  q.opts.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'quiz-opt';
    b.textContent = String.fromCharCode(65 + i) + '. ' + opt;
    b.addEventListener('click', () => answerQuiz(q, i, b));
    optsBox.appendChild(b);
  });
  showScreen('screen-quiz');
  startQuizTimer(q);
}

function startQuizTimer(q) {
  let left = 30;
  const el = $('quiz-timer');
  el.textContent = left;
  el.classList.remove('urgent');
  clearInterval(quizTimer);
  quizTimer = setInterval(() => {
    left--;
    el.textContent = left;
    if (left <= 5) el.classList.add('urgent');
    if (left <= 0) {
      clearInterval(quizTimer);
      answerQuiz(q, -1, null); // 超時視為答錯
    }
  }, 1000);
}

function answerQuiz(q, picked, btn) {
  clearInterval(quizTimer);
  const optBtns = document.querySelectorAll('.quiz-opt');
  optBtns.forEach(b => b.disabled = true);
  optBtns[q.ans].classList.add('correct');
  game.quizTotal++;

  const fb = $('quiz-feedback');
  fb.classList.remove('hidden');
  const correct = picked === q.ans;
  if (correct) {
    game.quizCorrect++;
    game.quizStreak++;
    quizStreakGlobal++;
    // 獎勵：本月投資回報 +2% 或 $2,000（取較高者），月結算時發放
    const invested = netWorth() - game.cash;
    game.quizBonusPending = Math.max(invested * 0.02, 2000);
    fb.innerHTML = '<b class="good">✅ 答啱咗！</b>本月結算將獲智慧加成 <b>' + fmt(game.quizBonusPending) + '</b>。<br>💡 ' + q.exp;
  } else {
    if (picked >= 0 && btn) btn.classList.add('wrong');
    game.quizStreak = 0;
    quizStreakGlobal = 0;
    game.quizBonusPending = 0;
    fb.innerHTML = '<b class="bad">' + (picked < 0 ? '⏰ 超時！' : '❌ 答錯咗！') + '</b>正確答案是 <b>' + String.fromCharCode(65 + q.ans) + '</b>。<br>💡 ' + q.exp;
  }
  LS.set('mft_quiz_streak', quizStreakGlobal);
  if (quizStreakGlobal >= 5) unlockAch('quiz_streak5');
  $('btn-quiz-continue').classList.remove('hidden');
  // 超時自動顯示解析後，2 秒自動結算（可手動提前點「繼續」）
  if (picked < 0) {
    clearTimeout(quizAutoTimer);
    quizAutoTimer = setTimeout(() => settleMonth(), 2000);
  }
}

/* ================= 月結算 ================= */
function settleMonth() {
  const before = netWorth();
  const e = game.currentEvent;
  const rows = [];

  // 現金利息
  const cashGain = game.cash * CASH_RATE;
  game.cash += cashGain;
  if (game.cash > 0) rows.push({ name: '💵 現金利息', pct: CASH_RATE, delta: cashGain });

  ASSETS.forEach(a => {
    const amt = game.holdings[a.id];
    if (amt <= 0) return;
    let ret;
    if (a.id === 'deposit') {
      ret = DEPOSIT_RATE;
    } else {
      const evtEffect = (e.effects[a.id] || 0);
      const noise = normalish(game.rng) * a.vol;
      ret = evtEffect + noise;
    }
    const delta = amt * ret;
    game.holdings[a.id] = Math.max(0, amt + delta);
    rows.push({ name: a.icon + ' ' + a.name, pct: ret, delta: delta });
  });

  // 答題加成
  if (game.quizBonusPending > 0) {
    game.cash += game.quizBonusPending;
    rows.push({ name: '🧠 智慧加成', pct: null, delta: game.quizBonusPending });
    $('mr-bonus').classList.remove('hidden');
    $('mr-bonus').textContent = '答題正確獎勵 +' + fmt(game.quizBonusPending) + ' 已入賬！';
    game.quizBonusPending = 0;
  } else {
    $('mr-bonus').classList.add('hidden');
  }

  const after = netWorth();
  const monthPct = (after - before) / before;
  game.monthlyProfits.push({ month: game.month, pct: monthPct });
  game.netHistory.push(after);

  // 成就判定
  if (monthPct > 0.20) unlockAch('hot_month');
  const total = after;
  if (game.holdings.deposit / Math.max(total, 1) >= 0.9) unlockAch('conservative');
  if (e.tag === 'typhoon' && after > before) unlockAch('typhoon_win');

  // 渲染結算畫面
  $('mr-title').textContent = '第 ' + game.month + ' 個月結算';
  const rowsBox = $('mr-rows');
  rowsBox.innerHTML = '';
  rows.forEach(r => {
    const div = document.createElement('div');
    div.className = 'mr-row';
    const pctTxt = r.pct === null ? '' : '<span class="pct ' + (r.pct >= 0 ? 'pos' : 'neg') + '">' + fmtPct(r.pct) + '</span> ';
    div.innerHTML = '<span>' + r.name + '</span><span>' + pctTxt +
      '<b class="pct ' + (r.delta >= 0 ? 'pos' : 'neg') + '">' + fmtSign(r.delta) + '</b></span>';
    rowsBox.appendChild(div);
  });
  const profit = after - before;
  $('mr-profit').innerHTML = '<span class="pct ' + (profit >= 0 ? 'pos' : 'neg') + '">' + fmtSign(profit) + '（' + fmtPct(monthPct) + '）</span>';
  $('mr-networth').textContent = fmt(after);
  drawChart();

  if (game.month >= game.totalMonths) {
    $('btn-mr-next').textContent = '查看年終結算 →';
    LS.del('mft_save'); // 本局即將結束
  } else {
    $('btn-mr-next').textContent = '進入下一個月 →';
    saveGame();
  }
  showScreen('screen-month-result');
  // 自動續月：開關狀態同步，開啟時 2.5 秒自動進入下一個月
  $('mr-auto-next').checked = autoNextEnabled;
  clearTimeout(autoNextTimer);
  if (autoNextEnabled) {
    autoNextTimer = setTimeout(advanceFromMonthResult, 2500);
  }
}

function advanceFromMonthResult() {
  clearTimeout(autoNextTimer);
  if (!game) return;
  if (game.month >= game.totalMonths) {
    yearEnd();
  } else {
    game.month++;
    startMonth();
  }
}

/* 淨值曲線（canvas 手繪，無依賴） */
function drawChart() {
  const cv = $('mr-chart');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height, pad = 30;
  ctx.clearRect(0, 0, W, H);
  const data = game.netHistory;
  const min = Math.min.apply(null, data.concat([game.initial])) * 0.97;
  const max = Math.max.apply(null, data.concat([game.initial])) * 1.03;
  const x = i => pad + (W - pad * 2) * (i / Math.max(data.length - 1, 1));
  const y = v => H - pad - (H - pad * 2) * ((v - min) / Math.max(max - min, 1));

  // 初始本金參考線
  ctx.strokeStyle = 'rgba(255,255,255,.25)';
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(pad, y(game.initial));
  ctx.lineTo(W - pad, y(game.initial));
  ctx.stroke();
  ctx.setLineDash([]);

  // 曲線
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  data.forEach((v, i) => { i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v)); });
  ctx.stroke();

  // 數據點
  ctx.fillStyle = '#f0d878';
  data.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(x(i), y(v), 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 最新值標籤
  const last = data[data.length - 1];
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('$' + Math.round(last).toLocaleString('en-US'), W - pad, y(last) - 12);
}

/* ================= 年終結算 ================= */
function yearEnd() {
  clearTimeout(autoNextTimer);
  clearTimeout(quizAutoTimer);
  const finalNet = netWorth();
  const retRate = (finalNet - game.initial) / game.initial;

  let grade = 'C';
  if (retRate >= 0.50) grade = 'S';
  else if (retRate >= 0.30) grade = 'A';
  else if (retRate >= 0.10) grade = 'B';

  const quizRate = game.quizTotal > 0 ? game.quizCorrect / game.quizTotal : null;

  // 財商診斷
  const diag = [];
  diag.push('<h4>📋 財商診斷報告</h4>');
  if (game.maxDiversified >= 4) {
    diag.push('✅ 你懂得分散投資（最多同時持有 ' + game.maxDiversified + ' 個板塊），風險管理意識良好！');
  } else if (game.maxDiversified >= 2) {
    diag.push('⚠️ 你的持倉較集中（最多 ' + game.maxDiversified + ' 個板塊），試下分散到 4 個以上板塊降低風險。');
  } else {
    diag.push('⚠️ 你幾乎全倉單一資產，風險極高！記住：唔好將所有雞蛋放埋一個籃。');
  }
  const cashRatio = game.cash / Math.max(finalNet, 1);
  if (cashRatio > 0.5) {
    diag.push('💵 你持有大量現金（' + Math.round(cashRatio * 100) + '%），雖然安全但會被通脹蠶食購買力，可考慮適度投資。');
  } else if (cashRatio < 0.05) {
    diag.push('💵 你幾乎不留現金，進取之餘記得保留應急資金，應對突發事件（如颱風！）。');
  }
  if (quizRate !== null) {
    if (quizRate >= 0.8) diag.push('🧠 答題正確率 ' + Math.round(quizRate * 100) + '%，財經知識扎實，繼續保持！');
    else diag.push('📚 答題正確率 ' + Math.round(quizRate * 100) + '%，多留意解析中的知識點，下一局會更好！');
  }
  const volatileHold = (game.holdings.tourism + game.holdings.fintech) / Math.max(finalNet, 1);
  const style = volatileHold > 0.5 ? '進取型' : (game.holdings.deposit + game.cash) / Math.max(finalNet, 1) > 0.5 ? '保守型' : '穩健均衡型';
  diag.push('🎨 你的投資風格：<b>' + style + '</b>。');

  // 渲染
  const gradeEl = $('yr-rating');
  gradeEl.textContent = grade;
  gradeEl.className = 'rating-grade grade-' + grade;
  $('yr-title').textContent = game.mode === 'daily' ? '每日挑戰結果' : '年終結算';
  $('yr-final').textContent = fmt(finalNet);
  $('yr-return-rate').innerHTML = '<span class="pct ' + (retRate >= 0 ? 'pos' : 'neg') + '">' + fmtPct(retRate) + '</span>';
  $('yr-quiz-rate').textContent = quizRate === null ? '—' : Math.round(quizRate * 100) + '%（' + game.quizCorrect + '/' + game.quizTotal + '）';
  $('yr-diagnosis').innerHTML = diag.map(d => '<p>' + d + '</p>').join('');

  // 每日挑戰：對比全服平均分
  const cmp = $('yr-daily-compare');
  if (game.mode === 'daily') {
    const avgRng = mulberry32(seedFromString('mft-daily-avg-' + todayStr()));
    const mockAvg = 2 + avgRng() * 8; // mock 全服平均回報 2%~10%
    const myPct = retRate * 100;
    cmp.classList.remove('hidden');
    cmp.innerHTML = '📆 今日全服平均回報：<b>' + mockAvg.toFixed(1) + '%</b>　你的回報：<b>' + myPct.toFixed(1) + '%</b><br>' +
      (myPct > mockAvg ? '🎉 你跑贏咗全服平均，叻仔叻女！' : '💪 仲差少少，聽日再挑戰！');
    dailyDone = { date: todayStr(), score: retRate * 100 };
    LS.set('mft_daily', dailyDone);
    unlockAch('daily_done');
  } else {
    cmp.classList.add('hidden');
  }

  // 成就
  const newAchs = [];
  if (game.mode === 'normal') {
    if (!hasAch('first_game')) { unlockAch('first_game'); newAchs.push('first_game'); }
    if (finalNet >= game.initial * 2) { if (!hasAch('double')) newAchs.push('double'); unlockAch('double'); }
    if (grade === 'S') { if (!hasAch('rank_s')) newAchs.push('rank_s'); unlockAch('rank_s'); }
    gamesPlayed++;
    LS.set('mft_games', gamesPlayed);
    if (gamesPlayed >= 5) { if (!hasAch('five_games')) newAchs.push('five_games'); unlockAch('five_games'); }
    if (quizRate !== null && quizRate > 0.8 && game.quizTotal >= 4) { if (!hasAch('quiz_master')) newAchs.push('quiz_master'); unlockAch('quiz_master'); }
    checkin.voucher = 0; // 加成券已用
    LS.set('mft_checkin', checkin);
  }

  const achBox = $('yr-newach');
  achBox.innerHTML = '';
  newAchs.forEach(id => {
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (a) {
      const el = document.createElement('span');
      el.className = 'ach-pop';
      el.textContent = a.icon + ' ' + a.name;
      achBox.appendChild(el);
    }
  });

  // 經驗值與排行榜
  addXp(Math.max(0, finalNet - game.initial) * 0.5 + game.quizCorrect * 1000);
  if (game.mode === 'normal') {
    myBest.push({ score: +(retRate * 100).toFixed(1), date: todayStr(), grade: grade });
    myBest.sort((a, b) => b.score - a.score);
    myBest = myBest.slice(0, 10);
    LS.set('mft_best', myBest);
  }

  LS.del('mft_save');
  game = null;
  showScreen('screen-year-result');
}

/* ================= 中途存檔 ================= */
function saveGame() {
  if (!game) return;
  // rng 函數不可序列化，存檔時移除；每日挑戰用種子重建
  const copy = Object.assign({}, game);
  delete copy.rng;
  LS.set('mft_save', copy);
}
function loadGame() {
  const g = LS.get('mft_save', null);
  if (!g) return false;
  game = g;
  game.rng = game.mode === 'daily' ? mulberry32(seedFromString('mft-daily-' + todayStr())) : Math.random;
  return true;
}

/* ================= 排行榜 ================= */
function renderLeaderboard(tab) {
  ['lb-tab-all', 'lb-tab-school', 'lb-tab-me'].forEach(id => $(id).classList.remove('active'));
  $('lb-tab-' + tab).classList.add('active');
  const box = $('lb-list');
  box.innerHTML = '';

  if (tab === 'all' || tab === 'school') {
    // 玩家真實最佳成績插入 mock 榜
    const rows = MOCK_PLAYERS.map(p => ({ name: p.name, school: p.school, score: p.score, me: false }));
    if (myBest.length > 0) {
      rows.push({ name: profile.nickname + (profile.title ? '「' + profile.title + '」' : ''), school: profile.school, score: myBest[0].score, me: true });
    }
    if (tab === 'school' && profile) {
      // 校際榜：只顯示同校 + 各校平均分
      const schools = {};
      rows.forEach(r => {
        if (!schools[r.school]) schools[r.school] = { total: 0, n: 0, best: -Infinity };
        schools[r.school].total += r.score; schools[r.school].n++;
        schools[r.school].best = Math.max(schools[r.school].best, r.score);
      });
      const schoolRows = Object.keys(schools).map(s => ({
        name: s, school: schools[s].n + ' 位玩家 · 最高 ' + schools[s].best.toFixed(1) + '%',
        score: +(schools[s].total / schools[s].n).toFixed(1), me: s === profile.school
      }));
      schoolRows.sort((a, b) => b.score - a.score);
      schoolRows.forEach((r, i) => box.appendChild(lbRow(i + 1, r, true)));
      return;
    }
    rows.sort((a, b) => b.score - a.score);
    rows.forEach((r, i) => box.appendChild(lbRow(i + 1, r, false)));
  } else {
    if (myBest.length === 0) {
      box.innerHTML = '<p class="muted" style="padding:16px;text-align:center">仲未有成績，快啲開始一局啦！</p>';
      return;
    }
    myBest.forEach((r, i) => {
      const div = document.createElement('div');
      div.className = 'lb-row me';
      div.innerHTML = '<span class="lb-rank">' + (i + 1) + '</span>' +
        '<span class="lb-name">評級 ' + r.grade + '<span class="lb-school">' + r.date + '</span></span>' +
        '<span class="lb-score ' + (r.score < 0 ? 'neg' : '') + '">' + (r.score >= 0 ? '+' : '') + r.score.toFixed(1) + '%</span>';
      box.appendChild(div);
    });
  }
}

function lbRow(rank, r, isSchool) {
  const div = document.createElement('div');
  div.className = 'lb-row' + (r.me ? ' me' : '');
  const rankCls = rank === 1 ? 'lb-rank top1' : 'lb-rank';
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
  div.innerHTML = '<span class="' + rankCls + '">' + medal + '</span>' +
    '<span class="lb-name">' + r.name + (r.me ? '（你）' : '') +
    '<span class="lb-school">' + (isSchool ? r.school : r.school) + '</span></span>' +
    '<span class="lb-score ' + (r.score < 0 ? 'neg' : '') + '">' + (r.score >= 0 ? '+' : '') + r.score.toFixed(1) + '%</span>';
  return div;
}

/* ================= 成就頁 ================= */
function renderAchievements() {
  const box = $('ach-list');
  box.innerHTML = '';
  let unlocked = 0;
  ACHIEVEMENTS.forEach(a => {
    const got = hasAch(a.id);
    if (got) unlocked++;
    const div = document.createElement('div');
    div.className = 'ach-item' + (got ? '' : ' locked');
    div.innerHTML = '<div class="ach-icon">' + a.icon + '</div>' +
      '<div><div class="ach-name">' + a.name + (got ? ' ✓' : ' 🔒') + '</div>' +
      '<div class="ach-desc">' + a.desc + '</div></div>';
    box.appendChild(div);
  });
  $('ach-progress').textContent = '已解鎖 ' + unlocked + ' / ' + ACHIEVEMENTS.length;
}

/* ================= 主菜單刷新 ================= */
function refreshMenu() {
  $('menu-nickname').textContent = (profile.title ? '「' + profile.title + '」' : '') + profile.nickname;
  $('menu-school').textContent = profile.school;
  const lv = currentLevel();
  $('menu-level-title').textContent = lv.title;
  const nx = nextLevel();
  $('menu-xp-fill').style.width = nx ? Math.min(100, (xp / nx.xp) * 100) + '%' : '100%';
  $('menu-streak').textContent = checkin.streak;
  $('menu-bonus').textContent = '+' + (checkin.voucher || 0).toLocaleString('en-US');
  $('btn-continue').classList.toggle('hidden', !LS.get('mft_save', null));
}

/* ================= 教學 ================= */
let tutStep = 0;
function renderTutorial() {
  const s = TUTORIAL_STEPS[tutStep];
  $('tut-content').innerHTML = '<span class="tut-icon">' + s.icon + '</span>' + s.text;
  const dots = $('tut-dots');
  dots.innerHTML = '';
  TUTORIAL_STEPS.forEach((_, i) => {
    const d = document.createElement('span');
    if (i === tutStep) d.className = 'on';
    dots.appendChild(d);
  });
  $('btn-tut-next').textContent = tutStep === TUTORIAL_STEPS.length - 1 ? '開始遊戲！' : '下一步';
}

/* ================= 初始化與事件綁定 ================= */
function bind(id, fn) { $(id).addEventListener('click', fn); }

function init() {
  // 歡迎 → 註冊/主菜單
  bind('btn-welcome-start', () => {
    if (profile) {
      enterMenu();
    } else {
      showScreen('screen-register');
    }
  });

  // 註冊
  bind('btn-register', () => {
    const nick = $('input-nickname').value.trim();
    const school = $('select-school').value;
    if (!nick) { toast('請輸入暱稱', '✏️'); return; }
    if (!school) { toast('請選擇學校', '🏫'); return; }
    profile = { nickname: nick, school: school, title: null };
    LS.set('mft_profile', profile);
    tutStep = 0;
    renderTutorial();
    showScreen('screen-tutorial');
  });

  // 教學
  bind('btn-tut-next', () => {
    if (tutStep < TUTORIAL_STEPS.length - 1) {
      tutStep++;
      renderTutorial();
    } else {
      enterMenu();
    }
  });
  bind('btn-tut-skip', () => enterMenu());

  // 簽到狀態（每日進入主菜單已自動簽到，此按鈕僅顯示狀態）
  bind('btn-open-checkin', () => {
    if (checkinNeeded()) {
      doCheckin();
      refreshMenu();
    } else {
      toast('今日已簽到！連簽 ' + checkin.streak + ' 天，本金加成 +' + (checkin.voucher || 0).toLocaleString('en-US'), '📅');
    }
  });
  bind('btn-confirm-yes', () => {
    const cb = confirmCallback;
    closeConfirm();
    if (cb) cb();
  });
  bind('btn-confirm-no', () => closeConfirm());

  // 主菜單按鈕
  bind('btn-new-game', () => {
    if (game || LS.get('mft_save', null)) {
      askConfirm('已有進行中的遊戲，開始新局將覆蓋舊存檔，確定？', () => {
        LS.del('mft_save');
        newGame('normal');
      });
      return;
    }
    newGame('normal');
  });
  bind('btn-continue', () => {
    if (loadGame()) {
      renderTrade();
      showScreen('screen-trade');
    } else {
      toast('搵唔到存檔', '❌');
    }
  });
  bind('btn-daily', () => newGame('daily'));
  bind('btn-leaderboard', () => { renderLeaderboard('all'); showScreen('screen-leaderboard'); });
  bind('btn-achievements', () => { renderAchievements(); showScreen('screen-achievements'); });
  bind('btn-reset-profile', () => {
    askConfirm('確定重設所有玩家資料？成就、簽到、排行榜成績都會清除！', () => {
      ['mft_profile', 'mft_achievements', 'mft_checkin', 'mft_xp', 'mft_best', 'mft_games', 'mft_save', 'mft_quiz_streak', 'mft_daily', 'mft_auto_next'].forEach(k => LS.del(k));
      location.reload();
    });
  });

  // 遊戲流程
  bind('btn-quit-save', () => {
    clearTimeout(autoNextTimer);
    resetTradeConfirmBtn();
    saveGame();
    game = null;
    toast('進度已儲存', '💾');
    refreshMenu();
    showScreen('screen-menu');
  });
  bind('btn-trade-confirm', () => handleTradeConfirm());
  bind('btn-quiz-continue', () => {
    clearTimeout(quizAutoTimer);
    settleMonth();
  });
  bind('btn-mr-next', () => advanceFromMonthResult());
  bind('mr-auto-next', () => {
    autoNextEnabled = $('mr-auto-next').checked;
    LS.set('mft_auto_next', autoNextEnabled);
    clearTimeout(autoNextTimer);
    if (autoNextEnabled && game) {
      autoNextTimer = setTimeout(advanceFromMonthResult, 2500);
    }
  });
  bind('btn-yr-replay', () => newGame('normal'));
  bind('btn-yr-menu', () => { refreshMenu(); showScreen('screen-menu'); });
  bind('btn-yr-leaderboard', () => { renderLeaderboard('all'); showScreen('screen-leaderboard'); });

  // 排行榜 tabs
  bind('lb-tab-all', () => renderLeaderboard('all'));
  bind('lb-tab-school', () => renderLeaderboard('school'));
  bind('lb-tab-me', () => renderLeaderboard('me'));
  bind('btn-lb-back', () => { refreshMenu(); showScreen('screen-menu'); });
  bind('btn-ach-back', () => { refreshMenu(); showScreen('screen-menu'); });

  // 老玩家直達主菜單（跳過歡迎頁/註冊/教學），首次進入才走完整引導
  if (profile) {
    enterMenu();
  } else {
    showScreen('screen-welcome');
  }
}

/* 進入主菜單：刷新資料 + 每日自動簽到（toast 提示，不打斷） */
function enterMenu() {
  refreshMenu();
  showScreen('screen-menu');
  if (checkinNeeded()) {
    doCheckin();
    refreshMenu();
  }
}

document.addEventListener('DOMContentLoaded', init);
