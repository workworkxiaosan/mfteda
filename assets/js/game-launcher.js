/*!
 * 「濠江財富大亨 / 濠港雙城大亨」官網整合腳本
 * 點擊研究領域指定卡片即彈出對應遊戲視窗（iframe 載入遊戲頁）。
 * 無任何依賴，適用於靜態頁 / React / Vue 等各種技術棧。
 *
 * 卡片識別優先級：
 *   1. 帶 data-mft-game 屬性的元素（屬性值 = 遊戲 URL，可有多張卡片各自指向不同遊戲；
 *      官網 build.py 已在「現代金融」「文化與科技」卡片上輸出此屬性）
 *   2. 文字完全等於「現代金融」（或 data-card-text 指定文字）的卡片（兜底，單卡場景）
 */
(function () {
  'use strict';

  /* ========== 配置 ========== */
  var DEFAULT_GAME_URL = '../index.html';
  var DEFAULT_BADGE = '🎮 財智遊戲 · 立即試玩';

  var scriptTag = document.currentScript;
  var GAME_URL = (scriptTag && scriptTag.getAttribute('data-game-url')) || DEFAULT_GAME_URL;
  var CARD_TEXT = (scriptTag && scriptTag.getAttribute('data-card-text')) || '現代金融';
  var BADGE_TEXT = (scriptTag && scriptTag.getAttribute('data-badge')) || DEFAULT_BADGE;

  /* ========== 注入樣式 ========== */
  var css = [
    '.mft-launch-hint{display:inline-block;margin-top:10px;padding:4px 12px;border-radius:999px;',
    'background:#0b3d2e;color:#d4af37;font-size:13px;font-weight:600;letter-spacing:.5px;}',
    '.mft-card-armed{cursor:pointer;transition:transform .2s ease,box-shadow .2s ease;}',
    '.mft-card-armed:hover{transform:translateY(-4px);box-shadow:0 12px 28px rgba(11,61,46,.18);}',
    '#mft-modal{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;',
    'background:rgba(6,30,23,.72);backdrop-filter:blur(4px);opacity:0;visibility:hidden;pointer-events:none;',
    'transition:opacity .25s ease,visibility .25s ease;}',
    '#mft-modal.mft-open{opacity:1;visibility:visible;pointer-events:auto;}',
    '#mft-modal .mft-frame-wrap{position:relative;width:min(480px,96vw);height:min(860px,92vh);',
    'border-radius:20px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.45);background:#0b3d2e;',
    'transform:translateY(16px) scale(.97);transition:transform .25s ease;}',
    '#mft-modal.mft-open .mft-frame-wrap{transform:none;}',
    '#mft-modal iframe{display:block;width:100%;height:100%;border:0;}',
    '#mft-close{position:absolute;top:10px;right:10px;z-index:2;width:38px;height:38px;border:0;border-radius:50%;',
    'background:rgba(11,61,46,.85);color:#d4af37;font-size:20px;line-height:1;cursor:pointer;',
    'box-shadow:0 2px 8px rgba(0,0,0,.3);}',
    '#mft-close:hover{background:#0b3d2e;}',
    'body.mft-locked{overflow:hidden;}'
  ].join('\n');

  var style = document.createElement('style');
  style.id = 'mft-launcher-style';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  /* ========== 彈窗（全站共用一個，切換卡片時換 src） ========== */
  var modal = null;
  var currentUrl = null;

  function buildModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'mft-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'MFTEDA 教育遊戲');
    modal.innerHTML =
      '<div class="mft-frame-wrap">' +
      '<button id="mft-close" type="button" aria-label="關閉">✕</button>' +
      '<iframe title="MFTEDA 教育遊戲" allow="clipboard-write"></iframe>' +
      '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeGame();
    });
    modal.querySelector('#mft-close').addEventListener('click', closeGame);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('mft-open')) closeGame();
    });
    return modal;
  }

  function openGame(url) {
    var m = buildModal();
    var frame = m.querySelector('iframe');
    if (currentUrl !== url) { frame.src = url; currentUrl = url; } // 換遊戲才重載
    m.classList.add('mft-open');
    document.body.classList.add('mft-locked');
  }

  function closeGame() {
    if (!modal) return;
    modal.classList.remove('mft-open');
    document.body.classList.remove('mft-locked');
  }

  /* ========== 尋找並武裝卡片 ========== */
  function armCard(card, url) {
    if (card.dataset.mftArmed) return; // 冪等，避免重複綁定
    card.dataset.mftArmed = '1';
    card.classList.add('mft-card-armed');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    // 在卡片內加「立即試玩」提示徽章（若未有）
    if (!card.querySelector('.mft-launch-hint')) {
      var hint = document.createElement('span');
      hint.className = 'mft-launch-hint';
      hint.textContent = BADGE_TEXT;
      card.appendChild(hint);
    }
    card.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openGame(url);
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGame(url); }
    });
  }

  function armAll() {
    if (!document.body) return;
    // 1. 顯式標記的卡片（屬性值為各自遊戲 URL；空值用默認）
    var marked = document.querySelectorAll('[data-mft-game]');
    for (var i = 0; i < marked.length; i++) {
      armCard(marked[i], marked[i].getAttribute('data-mft-game') || GAME_URL);
    }
    if (marked.length) return;
    // 2. 文字兜底（無標記時的單卡場景）：精確匹配文字完全等於 CARD_TEXT 的最深元素
    var all = document.querySelectorAll('h1,h2,h3,h4,h5,p,span,div,a,li');
    var best = null;
    for (var j = 0; j < all.length; j++) {
      var el = all[j];
      if (el.childElementCount === 0 && el.textContent.trim() === CARD_TEXT) best = el;
    }
    if (!best) return;
    // 向上找卡片容器：優先帶 card 類名的祖先，其次 <a>，最多向上 5 層
    var node = best;
    var card = best.parentElement || best;
    for (var depth = 0; depth < 5 && node && node !== document.body; depth++) {
      var cls = (node.className && node.className.baseVal !== undefined)
        ? node.className.baseVal : (node.className || '');
      if (node.tagName === 'A' || /card|item|grid-cell|tile/i.test(cls)) { card = node; break; }
      node = node.parentElement;
    }
    armCard(card, GAME_URL);
  }

  /* ========== 啟動（含 SPA 動態渲染的輪詢兜底） ========== */
  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    armAll();
    if (tries > 40) clearInterval(timer); // 最長約 20 秒
  }, 500);

  if (document.readyState !== 'loading') armAll();
  else document.addEventListener('DOMContentLoaded', armAll);

  // 暴露給頁面其他代碼手動調用（可選）
  window.MFTGame = { open: openGame, close: closeGame };
})();
