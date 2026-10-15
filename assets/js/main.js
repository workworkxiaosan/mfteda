/* MFTEDA 官網交互腳本 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------- 語言切換下拉 ---------- */
  function closeLangSwitch(o, refocus) {
    o.classList.remove('open');
    var ob = o.querySelector('button');
    if (ob) {
      ob.setAttribute('aria-expanded', 'false');
      if (refocus && o.contains(document.activeElement)) ob.focus();
    }
  }
  document.querySelectorAll('.lang-switch').forEach(function (sw) {
    var btn = sw.querySelector('button');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.querySelectorAll('.lang-switch.open').forEach(function (o) {
        if (o !== sw) closeLangSwitch(o, false);
      });
      sw.classList.toggle('open');
      btn.setAttribute('aria-expanded', sw.classList.contains('open') ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.lang-switch.open').forEach(function (o) {
      closeLangSwitch(o, false);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    document.querySelectorAll('.lang-switch.open').forEach(function (o) {
      closeLangSwitch(o, true);
    });
  });

  /* ---------- 手機選單 ---------- */
  var panel = document.getElementById('mobile-panel');
  var overlay = document.getElementById('panel-overlay');
  var toggle = document.getElementById('menu-toggle');
  function setPanel(open) {
    if (!panel) return;
    panel.classList.toggle('open', open);
    if (overlay) overlay.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  function closePanel() { setPanel(false); }
  if (toggle && panel) {
    toggle.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    toggle.addEventListener('click', function () { setPanel(true); });
    overlay.addEventListener('click', closePanel);
    panel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closePanel); });
    /* 面板內關閉按鈕的內聯 onclick 只移除 class，這裡補齊 aria 與滾動鎖定同步 */
    panel.querySelectorAll('.menu-toggle').forEach(function (b) { b.addEventListener('click', closePanel); });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && panel.classList.contains('open')) {
        closePanel();
        toggle.focus();
      }
    });
  }

  /* ---------- 進場動畫 ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
    /* 兜底：1.5s 後強制顯示全部（防止後台分頁 IO 被節流導致內容不可見） */
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }, 1500);
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 聯繫頁 Tabs ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (tabsRoot) {
    var btns = Array.prototype.slice.call(tabsRoot.querySelectorAll('.tabs button'));
    var panes = tabsRoot.querySelectorAll('.tab-pane');
    function activate(btn) {
      btns.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      panes.forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      tabsRoot.querySelector('.tab-pane[data-pane="' + btn.dataset.tab + '"]').classList.add('active');
    }
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () { activate(btn); });
    });
    /* 左右方向鍵切換；role="tab" 由模板側注入 */
    tabsRoot.querySelectorAll('[role="tab"]').forEach(function (tab) {
      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        var i = btns.indexOf(tab);
        if (i === -1 || !btns.length) return;
        var next = (i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length;
        btns[next].focus();
        activate(btns[next]);
      });
    });
  });

  /* ---------- 表單校驗 + 提交 ---------- */
  document.querySelectorAll('form.ajax-form').forEach(function (form) {
    var toast = form.querySelector('.form-toast');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (field) {
        var err = form.querySelector('.err-msg[data-for="' + field.name + '"]');
        var msg = '';
        if (!field.value.trim()) {
          msg = form.dataset.errRequired || '此欄位為必填項';
        } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
          msg = form.dataset.errEmail || '請輸入有效的電子郵件地址';
        }
        field.classList.toggle('error', !!msg);
        if (msg) { field.setAttribute('aria-invalid', 'true'); } else { field.removeAttribute('aria-invalid'); }
        if (err) err.textContent = msg;
        if (msg) valid = false;
      });
      if (!valid) return;
      var submitBtn = form.querySelector('[type="submit"]');
      var original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = form.dataset.submitting || '提交中...';
      setTimeout(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
        form.reset();
        if (toast) {
          toast.classList.add('show');
          setTimeout(function () { toast.classList.remove('show'); }, 4000);
        }
      }, 1000);
    });
    form.querySelectorAll('input, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        field.classList.remove('error');
        field.removeAttribute('aria-invalid');
        var err = form.querySelector('.err-msg[data-for="' + field.name + '"]');
        if (err) err.textContent = '';
      });
    });
  });
})();
