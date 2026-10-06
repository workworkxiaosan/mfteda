/* MFTEDA 官網交互腳本 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------- 語言切換下拉 ---------- */
  document.querySelectorAll('.lang-switch').forEach(function (sw) {
    var btn = sw.querySelector('button');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.querySelectorAll('.lang-switch.open').forEach(function (o) {
        if (o !== sw) o.classList.remove('open');
      });
      sw.classList.toggle('open');
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.lang-switch.open').forEach(function (o) {
      o.classList.remove('open');
    });
  });

  /* ---------- 手機選單 ---------- */
  var panel = document.getElementById('mobile-panel');
  var overlay = document.getElementById('panel-overlay');
  var toggle = document.getElementById('menu-toggle');
  function closePanel() {
    if (panel) { panel.classList.remove('open'); overlay.classList.remove('open'); }
  }
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      panel.classList.add('open');
      overlay.classList.add('open');
    });
    overlay.addEventListener('click', closePanel);
    panel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closePanel); });
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
    var btns = tabsRoot.querySelectorAll('.tabs button');
    var panes = tabsRoot.querySelectorAll('.tab-pane');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        panes.forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        tabsRoot.querySelector('.tab-pane[data-pane="' + btn.dataset.tab + '"]').classList.add('active');
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
        var err = form.querySelector('.err-msg[data-for="' + field.name + '"]');
        if (err) err.textContent = '';
      });
    });
  });
})();
