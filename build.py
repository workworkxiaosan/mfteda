#!/usr/bin/env python3
"""
MFTEDA 官網靜態站生成器
讀取 content.json，輸出多語言靜態 HTML 到 dist/。

用法:
    python3 build.py

更新網站內容 = 改 content.json → 重新執行 python3 build.py。
"""
import json, html, os, shutil, subprocess, unicodedata
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')
C = json.load(open(os.path.join(ROOT, 'content.json'), encoding='utf-8'))
I18N = C['i18n']
LANGS = [l['code'] for l in C['languages']]
DEFAULT = C['default_lang']
PAGES = ['index', 'about', 'research', 'projects', 'publications', 'insights', 'news', 'partners', 'policy', 'contact']

def esc(s): return html.escape(str(s), quote=True)

def t(lang, *keys):
    """取翻譯: t('zh-TW','nav','home')"""
    d = I18N[lang]
    for k in keys: d = d[k]
    return d

# ---------------- URL 規則 ----------------
# 默認語言 zh-TW 放根目錄（與原站一致: /about），其他語言在 /en/ /zh-CN/ /pt/ 子目錄
def page_href(page, target_lang, current_lang):
    """從 current_lang 頁面連到 target_lang 的 page 頁的相對路徑。"""
    if target_lang == DEFAULT:
        target = 'index.html' if page == 'index' else f'{page}.html'
    else:
        target = f'{target_lang}/' + ('index.html' if page == 'index' else f'{page}.html')
    prefix = '../' if current_lang != DEFAULT else ''
    return prefix + target

def asset(path, current_lang):
    prefix = '../' if current_lang != DEFAULT else ''
    return prefix + 'assets/' + path

ASSET_V = '?v=20261016c'
BUILD_DATE = date.today().isoformat()

_IMG_SIZE_CACHE = {}
def img_size(relpath):
    """讀取 assets/ 下圖片的真實尺寸（供 <img> width/height 屬性防 CLS）。
    優先 PIL，失敗則調 macOS 自帶 sips；都讀不到返回 None，絕不中斷構建。"""
    if relpath in _IMG_SIZE_CACHE:
        return _IMG_SIZE_CACHE[relpath]
    size = None
    p = os.path.join(ROOT, 'assets', relpath)
    try:
        from PIL import Image
        with Image.open(p) as im:
            size = im.size
    except Exception:
        try:
            out = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', p],
                                 capture_output=True, text=True, timeout=15).stdout
            w = h = None
            for ln in out.splitlines():
                if 'pixelWidth:' in ln:
                    w = int(ln.split(':')[1].strip())
                elif 'pixelHeight:' in ln:
                    h = int(ln.split(':')[1].strip())
            if w and h:
                size = (w, h)
        except Exception:
            size = None
    _IMG_SIZE_CACHE[relpath] = size
    return size

def img_wh_attrs(relpath):
    """返回 ' width="W" height="H"' 屬性串；讀不到尺寸返回空串。"""
    s = img_size(relpath)
    return f' width="{s[0]}" height="{s[1]}"' if s else ''

def text_width(s):
    """顯示寬度：全角字符計 2，半角計 1。"""
    return sum(2 if unicodedata.east_asian_width(ch) in ('W', 'F') else 1 for ch in str(s))

def truncate_title(s, max_w=60):
    """標題顯示寬度超過 max_w（≈30 個全角字符）時截斷並加省略號。"""
    if text_width(s) <= max_w:
        return s
    out, w = [], 0
    for ch in s:
        cw = 2 if unicodedata.east_asian_width(ch) in ('W', 'F') else 1
        if w + cw > max_w:
            break
        out.append(ch)
        w += cw
    return ''.join(out).rstrip() + '…'

def abs_url(page, lang):
    """某語言某頁面的絕對 URL（canonical/OG/sitemap 用）。"""
    base = C.get('site_url', 'https://mfteda.org').rstrip('/')
    name = 'index.html' if page == 'index' else f'{page}.html'
    path = name if lang == DEFAULT else f'{lang}/{name}'
    return f'{base}/{path}'

# ---------------- SVG 圖標 ----------------
def icon(name, cls=''):
    P = {
        'trending': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
        'globe': '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
        'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        'mail': '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
        'pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
        'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
        'arrow': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
        'arrow-left': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
        'menu': '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
        'close': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        'check': '<polyline points="20 6 9 17 4 12"/>',
        'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
        'flag': '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
        'cpu': '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
        'coins': '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
        'leaf': '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
        'plane': '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
        'landmark': '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
        'network': '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
        'ship': '<path d="M2 20c1.4 0 2.8-.7 4-1.4 1.2.7 2.6 1.4 4 1.4s2.8-.7 4-1.4c1.2.7 2.6 1.4 4 1.4 1.4 0 2.8-.7 4-1.4V10l-8-4-8 4v1"/><path d="M6 12v8"/><path d="M18 12v8"/><path d="m2 10 10-5 10 5"/>',
        'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
        'handshake': '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 1 0 3-3 6.18 6.18 0 0 0-8.14-.68l-3 3a5.79 5.79 0 0 0-7.06.87l-.47.28a2 2 0 1 1-3 3 3.74 3.74 0 0 0 2.06 1.57"/>',
        'file': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
        'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        'chart': '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
        'dollar': '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
        'book': '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
        'award': '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
        'building': '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="8" y1="6" x2="10" y2="6"/><line x1="14" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/>',
        'facebook': '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
        'linkedin': '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
        'twitter': '<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>',
    }
    c = f' class="{cls}"' if cls else ''
    return (f'<svg{c} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{P[name]}</svg>')

# 研究領域 11 張卡片對應圖標（與原站 lucide 圖標風格一致）
RESEARCH_ICONS = ['cpu', 'dollar', 'leaf', 'plane', 'landmark', 'network', 'ship', 'trending', 'sparkles', 'handshake', 'file', 'check']
ABOUT_AREA_ICONS = ['dollar', 'globe', 'trending', 'sparkles', 'users']
ABOUT_INITIATIVE_ICONS = ['trending', 'handshake', 'book', 'cpu', 'dollar', 'users', 'sparkles']
SOCIAL = [('facebook', 'Facebook'), ('linkedin', 'LinkedIn'), ('twitter', 'Twitter')]

# ---------------- 頁頭 / 頁尾 ----------------
SKIP_LINK = {'zh-TW': '跳至主要內容', 'zh-CN': '跳至主要内容', 'en': 'Skip to main content', 'pt': 'Pular para o conteúdo principal'}
MENU_LABEL = {'zh-TW': '菜單', 'zh-CN': '菜单', 'en': 'Menu', 'pt': 'Menu'}
CLOSE_LABEL = {'zh-TW': '關閉', 'zh-CN': '关闭', 'en': 'Close', 'pt': 'Fechar'}

def header(page, lang, pre=''):
    nav = I18N[lang]['nav']
    logo = pre + asset('img/logo-sm.png', lang) + ASSET_V
    hp = lambda p: pre + page_href(p, lang, lang)
    cur = lambda p: ' aria-current="page"' if p == page else ''
    links = ''.join(
        f'<a href="{hp(p)}" class="{"active" if p == page else ""}"{cur(p)}>{esc(nav[p if p != "index" else "home"])}</a>'
        for p in PAGES)
    lang_btn_label = next(l['label'] for l in C['languages'] if l['code'] == lang)
    lang_items = ''.join(
        f'<a href="{pre + page_href(page, l["code"], lang)}" class="{"current" if l["code"] == lang else ""}">{l["flag"]} {esc(l["label"])}</a>'
        for l in C['languages'])
    mlinks = ''.join(
        f'<a href="{hp(p)}" class="mnav {"active" if p == page else ""}"{cur(p)}>{esc(nav[p if p != "index" else "home"])}</a>'
        for p in PAGES)
    return f'''<header class="site-header">
  <div class="container-institutional">
    <a href="{hp('index')}" class="logo-link"><img src="{logo}" alt="MFTEDA Logo"></a>
    <nav class="main-nav">{links}</nav>
    <div class="header-actions">
      <div class="lang-switch">
        <button type="button" aria-haspopup="true">{icon('globe')}{esc(lang_btn_label)}</button>
        <div class="dropdown">{lang_items}</div>
      </div>
      <button class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="mobile-panel" aria-label="{esc(MENU_LABEL[lang])}">{icon('menu')}</button>
    </div>
  </div>
</header>
<div class="panel-overlay" id="panel-overlay"></div>
<aside class="mobile-panel" id="mobile-panel" aria-hidden="true">
  <div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">
    <button class="menu-toggle" onclick="document.getElementById('mobile-panel').classList.remove('open');document.getElementById('panel-overlay').classList.remove('open');" aria-label="{esc(CLOSE_LABEL[lang])}">{icon('close')}</button>
  </div>
  {mlinks}
  <div class="lang-switch" style="margin-top:1rem;">
    <button type="button" aria-haspopup="true">{icon('globe')}{esc(lang_btn_label)}</button>
    <div class="dropdown" style="position:static;box-shadow:none;border:none;display:block;">{lang_items}</div>
  </div>
</aside>'''

def footer(lang, pre=''):
    nav = I18N[lang]['nav']
    ft = I18N[lang]['footer']
    partners = I18N[lang]['partners']
    logo = pre + asset('img/logo-sm.png', lang) + ASSET_V
    hp = lambda p: pre + page_href(p, lang, lang)
    # href 為 '#' 的社交鏈接不渲染（未開通賬號時整行消失）
    social_links = [(s, label) for s, label in SOCIAL if C['social'].get(s, '#') != '#']
    brand_inner = f'<img src="{logo}" alt="MFTEDA Logo">'
    if social_links:
        social = ''.join(f'<a href="{C["social"][s]}" aria-label="{label}">{icon(s)}</a>' for s, label in social_links)
        brand_inner += f'\n        <div class="social-row">{social}</div>'
    address = I18N[lang]['contact']['addressValue']
    return f'''<footer class="site-footer">
  <div class="container-institutional section-spacing">
    <div class="footer-grid">
      <div class="footer-col footer-brand-col">
        {brand_inner}
      </div>
      <div class="footer-col">
        <h4>{esc(ft['quickLinks'])}</h4>
        <ul>
          <li><a href="{hp('index')}">{esc(nav['home'])}</a></li>
          <li><a href="{hp('about')}">{esc(nav['about'])}</a></li>
          <li><a href="{hp('research')}">{esc(nav['research'])}</a></li>
          <li><a href="{hp('projects')}">{esc(nav['projects'])}</a></li>
          <li><a href="{hp('contact')}">{esc(nav['contact'])}</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>{esc(ft['publications'])}</h4>
        <ul>
          <li><a href="{hp('publications')}">{esc(nav['publications'])}</a></li>
          <li><a href="{hp('insights')}">{esc(nav['insights'])}</a></li>
          <li><a href="{hp('news')}">{esc(nav['news'])}</a></li>
          <li><a href="{hp('policy')}">{esc(nav['policy'])}</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4><a href="{hp('partners')}">{esc(ft['partners'])}</a></h4>
        <ul>
          <li><span>{esc(partners['partner1'])}</span></li>
          <li><span>{esc(partners['partner2'])}</span></li>
          <li><span>{esc(partners['partner3'])}</span></li>
        </ul>
        <p class="footer-address">{icon('pin')}<span>{esc(address)}</span></p>
      </div>
    </div>
  </div>
  <div class="footer-bottom container-institutional">
    <span>© {C.get('year', 2026)} MFTEDA. {esc(ft['allRightsReserved'])}</span>
    <a href="mailto:{C['email']}">{C['email']}</a>
  </div>
</footer>'''

def page_shell(page, lang, title, description, body, depth=0, url_path=None, og_image=None,
               og_type='website', article_meta=None, og_image_dims=None, extra_head='', noindex=False):
    pre = '../' * depth
    css = pre + asset('css/style.css', lang) + ASSET_V
    js = pre + asset('js/main.js', lang) + ASSET_V
    canonical = abs_url(url_path or page, lang)
    base = C.get('site_url', 'https://mfteda.org').rstrip('/')
    default_og = base + '/assets/img/og-cover.jpg'
    og_image = og_image or default_og
    if og_image_dims is None and og_image == default_og:
        og_image_dims = (1200, 630)
    og_locale = {'zh-TW': 'zh_TW', 'zh-CN': 'zh_CN', 'en': 'en_US', 'pt': 'pt_PT'}[lang]
    # 機構名按各自語言版本書寫（簡體頁用簡體學會名）
    site_name = '澳门财经科技与教育发展学会' if lang == 'zh-CN' else C['site_name']
    full_name = I18N[lang]['contact']['orgName']
    # <title>：首頁用「學會全稱 MFTEDA」品牌格式；文章標題顯示寬度超過 ≈30 個全角字符時截斷；其餘維持「標題 - MFTEDA」
    if page == 'index' and not noindex:
        title_tag = f'{full_name} MFTEDA'
    else:
        tt = truncate_title(title) if article_meta else title
        title_tag = f'{tt} - MFTEDA'
    og_title = title_tag if page == 'index' else title
    # canonical / hreflang / JSON-LD：noindex 頁（404）一律不輸出
    meta_links = ''
    if not noindex:
        meta_links = f'  <link rel="canonical" href="{canonical}">\n'
        meta_links += '\n'.join(
            f'  <link rel="alternate" hreflang="{l}" href="{abs_url(url_path or page, l)}">'
            for l in LANGS)
        meta_links += f'\n  <link rel="alternate" hreflang="x-default" href="{abs_url(url_path or page, DEFAULT)}">'
    robots_meta = '  <meta name="robots" content="noindex">\n' if noindex else ''
    jsonld = ''
    if page == 'index' and not noindex:
        org = {"@context": "https://schema.org", "@type": "Organization",
               "name": site_name, "alternateName": C['site_name_en'], "url": base,
               "logo": f"{base}/assets/img/logo.png", "email": C['email'],
               "address": {"@type": "PostalAddress",
                           "streetAddress": I18N[lang]['contact']['addressValue'],
                           "addressLocality": "Macao", "addressCountry": "MO"}}
        jsonld = '  <script type="application/ld+json">\n  ' + json.dumps(org, ensure_ascii=False) + '\n  </script>'
    elif article_meta:
        if article_meta.get('author'):
            author_obj = {"@type": "Person", "name": article_meta['author']}
        else:
            author_obj = {"@type": "Organization", "name": site_name}
        article_ld = {"@context": "https://schema.org", "@type": "NewsArticle",
                      "headline": title, "datePublished": article_meta['date'],
                      "author": author_obj,
                      "publisher": {"@type": "Organization", "name": site_name,
                                    "logo": {"@type": "ImageObject", "url": f"{base}/assets/img/logo.png"}},
                      "image": [article_meta.get('image') or og_image],
                      "mainEntityOfPage": canonical}
        crumb_ld = {"@context": "https://schema.org", "@type": "BreadcrumbList",
                    "itemListElement": [
                        {"@type": "ListItem", "position": 1, "name": t(lang, 'nav', 'home'), "item": abs_url('index', lang)},
                        {"@type": "ListItem", "position": 2, "name": t(lang, 'nav', page), "item": abs_url(page, lang)},
                        {"@type": "ListItem", "position": 3, "name": title, "item": canonical}]}
        jsonld = ('  <script type="application/ld+json">\n  ' + json.dumps(article_ld, ensure_ascii=False) + '\n  </script>\n'
                  '  <script type="application/ld+json">\n  ' + json.dumps(crumb_ld, ensure_ascii=False) + '\n  </script>')
    article_og = ''
    if article_meta:
        article_og = f'  <meta property="article:published_time" content="{esc(article_meta["date"])}">\n'
        if article_meta.get('author'):
            article_og += f'  <meta property="article:author" content="{esc(article_meta["author"])}">\n'
        article_og += f'  <meta property="article:section" content="{esc(article_meta["section"])}">\n'
    og_dims = ''
    if og_image_dims:
        og_dims = (f'  <meta property="og:image:width" content="{og_image_dims[0]}">\n'
                   f'  <meta property="og:image:height" content="{og_image_dims[1]}">\n')
    extra = f'  {extra_head}\n' if extra_head else ''
    return f'''<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
{robots_meta}  <title>{esc(title_tag)}</title>
  <meta name="description" content="{esc(description)}">
{meta_links}
  <meta property="og:type" content="{og_type}">
  <meta property="og:site_name" content="MFTEDA {esc(site_name)}">
  <meta property="og:locale" content="{og_locale}">
  <meta property="og:title" content="{esc(og_title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{og_image}">
{og_dims}  <meta property="og:image:alt" content="{esc(og_title)}">
{article_og}  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(og_title)}">
  <meta name="twitter:description" content="{esc(description)}">
  <meta name="twitter:image" content="{og_image}">
  <link rel="icon" type="image/png" href="{pre + asset('img/logo-sm.png', lang) + ASSET_V}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{css}">
  <noscript><style>.reveal{{opacity:1 !important;transform:none !important;}}</style></noscript>
{extra}{jsonld}
</head>
<body>
<a class="skip-link" href="#main">{esc(SKIP_LINK[lang])}</a>
{header(page, lang, pre)}
<main id="main">
{body}
</main>
{footer(lang, pre)}
<script src="{js}" defer></script>
</body>
</html>'''

def page_hero(lang, section):
    return f'''<section class="page-hero">
  <div class="container-institutional">
    <div class="reveal">
      <h1 class="institutional-heading">{esc(t(lang, section, 'title'))}</h1>
      <p class="sub text-muted-foreground">{esc(t(lang, section, 'subtitle'))}</p>
    </div>
  </div>
</section>'''

# ---------------- 首頁 ----------------
# 首頁 hero 世界地圖上的大洲動態連線 SVG（viewBox 與 hero-bg.webp 同尺寸，preserveAspectRatio slice 與 background-size:cover 行為一致，
# 因此節點始終對齊地圖上的各大洲。弧線均以澳門（東亞節點）為起點向外輻射，寓意「從澳門出發鏈接世界」）
HERO_LINKS = '''  <svg class="hero-links" viewBox="0 0 1536 2752" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <g>
      <path class="link-base" d="M1106 1238 Q903 1049 700 1120"/>
      <path class="link-base" d="M1106 1238 Q948 1199 790 1380"/>
      <path class="link-base" d="M1106 1238 Q1010 1164 915 1230"/>
      <path class="link-base" d="M1106 1238 Q703 969 300 1180"/>
      <path class="link-base" d="M1106 1238 Q768 1159 430 1520"/>
      <path class="link-base" d="M1106 1238 Q1118 1269 1130 1420"/>
      <path class="link-base" d="M1106 1238 Q1193 1289 1280 1560"/>
      <path class="link-base" d="M700 1120 Q565 1170 430 1520"/>
      <path class="link-base" d="M700 1120 Q745 1160 790 1380"/>
    </g>
    <g>
      <path class="link-pulse" pathLength="1000" d="M1106 1238 Q903 1049 700 1120"/>
      <path class="link-pulse" pathLength="1000" style="animation-delay:-1.4s" d="M1106 1238 Q948 1199 790 1380"/>
      <path class="link-pulse" pathLength="1000" style="animation-delay:-2.6s" d="M1106 1238 Q1010 1164 915 1230"/>
      <path class="link-pulse" pathLength="1000" style="animation-delay:-3.8s" d="M1106 1238 Q703 969 300 1180"/>
      <path class="link-pulse" pathLength="1000" style="animation-delay:-5s" d="M1106 1238 Q768 1159 430 1520"/>
      <path class="link-pulse" pathLength="1000" style="animation-delay:-0.9s" d="M1106 1238 Q1118 1269 1130 1420"/>
      <path class="link-pulse" pathLength="1000" style="animation-delay:-2s" d="M1106 1238 Q1193 1289 1280 1560"/>
      <path class="link-pulse" pathLength="1000" style="animation-delay:-3.2s" d="M700 1120 Q565 1170 430 1520"/>
      <path class="link-pulse" pathLength="1000" style="animation-delay:-4.5s" d="M700 1120 Q745 1160 790 1380"/>
    </g>
    <g>
      <circle class="node-ring" cx="1106" cy="1238" r="16"/>
      <circle class="node-ring" cx="1106" cy="1238" r="16" style="animation-delay:-1.6s"/>
      <circle class="node-core" cx="1106" cy="1238" r="16"/>
      <circle class="node-ring" cx="700" cy="1120" r="12" style="animation-delay:-0.4s"/>
      <circle class="node-core" cx="700" cy="1120" r="12"/>
      <circle class="node-ring" cx="790" cy="1380" r="12" style="animation-delay:-0.8s"/>
      <circle class="node-core" cx="790" cy="1380" r="12"/>
      <circle class="node-ring" cx="915" cy="1230" r="12" style="animation-delay:-1.2s"/>
      <circle class="node-core" cx="915" cy="1230" r="12"/>
      <circle class="node-ring" cx="300" cy="1180" r="12" style="animation-delay:-2s"/>
      <circle class="node-core" cx="300" cy="1180" r="12"/>
      <circle class="node-ring" cx="430" cy="1520" r="12" style="animation-delay:-2.4s"/>
      <circle class="node-core" cx="430" cy="1520" r="12"/>
      <circle class="node-ring" cx="1130" cy="1420" r="12" style="animation-delay:-2.8s"/>
      <circle class="node-core" cx="1130" cy="1420" r="12"/>
      <circle class="node-ring" cx="1280" cy="1560" r="12" style="animation-delay:-1s"/>
      <circle class="node-core" cx="1280" cy="1560" r="12"/>
    </g>
  </svg>'''

def render_index(lang):
    hero = I18N[lang]['hero']
    cards = ''
    for card in C['focus_cards']:
        cards += f'''<div class="institutional-card text-center reveal">
        <div class="icon-badge">{icon(card['icon'])}</div>
        <h3 style="font-family:var(--font-sans);font-size:1.5rem;font-weight:600;margin-bottom:1rem;">{esc(card['title'][lang])}</h3>
        <p class="text-muted-foreground" style="line-height:1.625;">{esc(card['description'][lang])}</p>
      </div>'''
    ins = I18N[lang]['insights']
    latest_insights = ''
    for a in sorted(C['insights'], key=lambda x: x['date'], reverse=True)[:3]:
        href = f'insights/{a["slug"]}.html' if a.get('slug') else 'insights.html'
        latest_insights += f'''
      <div class="institutional-card insight-card reveal">
        <div class="insight-meta">
          <span class="badge">{esc(a['category'][lang])}</span>
          <span class="date">{icon('calendar')}{a['date']}</span>
        </div>
        <h3>{esc(a['title'][lang])}</h3>
        <p>{esc(a['excerpt'][lang])}</p>
        <a class="read-more" href="{href}">{esc(ins['readMore'])}{icon('arrow')}</a>
      </div>'''
    latest_news = ''
    for a in sorted(C['news'], key=lambda x: x['date'], reverse=True)[:3]:
        latest_news += f'''
      <div class="institutional-card insight-card reveal">
        <div class="insight-meta">
          <span class="badge">{esc(a['category'][lang])}</span>
          <span class="date">{icon('calendar')}{a['date']}</span>
          <span class="source">{esc(a['source']['name'][lang])}</span>
        </div>
        <h3>{esc(a['title'][lang])}</h3>
        <p>{esc(a['excerpt'][lang])}</p>
        <a class="read-more" href="news/{a['slug']}.html">{esc(ins['readMore'])}{icon('arrow')}</a>
      </div>'''
    hero_bg = asset('img/hero-bg.webp', lang) + ASSET_V
    body = f'''
<section class="hero" style="background-image:url('{hero_bg}')">
{HERO_LINKS}
  <div class="container-institutional">
    <div class="reveal">
      <h1>{esc(hero['headline']).replace(chr(10), '<br>')}</h1>
      <p class="sub">{esc(hero['subtitle'])}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="{page_href('about', lang, lang)}">{esc(hero['cta1'])}{icon('arrow')}</a>
        <a class="btn btn-secondary" href="{page_href('research', lang, lang)}">{esc(hero['cta2'])}</a>
        <a class="btn btn-glass" href="{page_href('contact', lang, lang)}">{esc(hero['cta3'])}</a>
      </div>
    </div>
  </div>
</section>
<section class="section-spacing">
  <div class="container-institutional">
    <div class="text-center mb-16 reveal">
      <h2 class="institutional-subheading mb-4">{esc({'zh-TW': '我們的重點領域', 'zh-CN': '我们的重点领域', 'en': 'Our Focus Areas', 'pt': 'Nossas Áreas de Foco'}[lang])}</h2>
      <p class="text-lg text-muted-foreground max-w-2 mx-auto">{esc({'zh-TW': '通過戰略研究與政策創新推動澳門發展', 'zh-CN': '通过战略研究与政策创新推动澳门发展', 'en': "Driving Macao's development through strategic research and policy innovation", 'pt': 'Impulsionando o desenvolvimento de Macau através de pesquisa estratégica e inovação política'}[lang])}</p>
    </div>
    <div class="grid grid-3">{cards}</div>
  </div>
</section>
<section class="section-spacing bg-muted-50">
  <div class="container-institutional">
    <div class="text-center mb-16 reveal">
      <h2 class="institutional-subheading mb-4">{esc({'zh-TW': '最新研究', 'zh-CN': '最新研究', 'en': 'Latest Research', 'pt': 'Investigação Recente'}[lang])}</h2>
      <a class="read-more" href="{page_href('insights', lang, lang)}">{esc({'zh-TW': '查看全部', 'zh-CN': '查看全部', 'en': 'View All', 'pt': 'Ver Tudo'}[lang])}{icon('arrow')}</a>
    </div>
    <div class="grid grid-3">{latest_insights}</div>
  </div>
</section>
<section class="section-spacing">
  <div class="container-institutional">
    <div class="text-center mb-16 reveal">
      <h2 class="institutional-subheading mb-4">{esc({'zh-TW': '最新動態', 'zh-CN': '最新动态', 'en': 'Latest News', 'pt': 'Últimas Notícias'}[lang])}</h2>
      <a class="read-more" href="{page_href('news', lang, lang)}">{esc({'zh-TW': '查看全部', 'zh-CN': '查看全部', 'en': 'View All', 'pt': 'Ver Tudo'}[lang])}{icon('arrow')}</a>
    </div>
    <div class="grid grid-3">{latest_news}</div>
  </div>
</section>
<section class="section-spacing cta-band">
  <div class="container-institutional">
    <div class="reveal">
      <h2 class="institutional-subheading mb-6">{esc({'zh-TW': '與我們一起塑造澳門的未來', 'zh-CN': '与我们一起塑造澳门的未来', 'en': "Join us in shaping Macao's future", 'pt': 'Junte-se a nós na construção do futuro de Macau'}[lang])}</h2>
      <p class="lead">{esc({'zh-TW': '與MFTEDA合作，推動創新、研究與可持續發展', 'zh-CN': '与MFTEDA合作，推动创新、研究与可持续发展', 'en': 'Partner with MFTEDA to drive innovation, research, and sustainable development', 'pt': 'Faça parceria com a MFTEDA para impulsionar inovação, pesquisa e desenvolvimento sustentável'}[lang])}</p>
      <a class="btn btn-white" href="{page_href('contact', lang, lang)}">{esc(t(lang, 'nav', 'contact'))}{icon('arrow')}</a>
    </div>
  </div>
</section>'''
    desc = {'zh-TW': '澳門財經科技與教育發展學會致力於推動澳門特區多元化、可持續、高質量發展',
            'zh-CN': '澳门财经科技与教育发展学会致力于推动澳门特区多元化、可持续、高质量发展',
            'en': 'MFTEDA is committed to promoting diversified, sustainable, and high-quality development of Macao SAR',
            'pt': 'MFTEDA está comprometida em promover o desenvolvimento diversificado, sustentável e de alta qualidade da RAE de Macau'}[lang]
    return page_shell('index', lang, t(lang, 'nav', 'home'), desc, body,
                      extra_head=f'<link rel="preload" as="image" href="{hero_bg}">')

# ---------------- 關於我們 ----------------
def render_about(lang):
    ab = I18N[lang]['about']
    ms = I18N[lang]['mission']
    # 與原站相同邏輯：按「；」分段，首段以「：」拆出標題
    chunks = [p.strip() for p in ab['description1'].split('；') if p.strip()]
    head = ''
    if chunks:
        first = chunks[0]
        sep = '：' if '：' in first else (':' if ':' in first else None)
        if sep:
            head, rest = first.split(sep, 1)
            chunks[0] = rest.strip()
    # 末段結尾統一為單個句號（修復原站「。。」問題）；西文頁保留英文句號，避免「.。」混雜
    if lang.startswith('zh'):
        chunks[-1] = chunks[-1].rstrip('。') + '。'
    else:
        chunks[-1] = chunks[-1].rstrip('。')
        if not chunks[-1].endswith(('.', '!', '?')):
            chunks[-1] += '.'
    paras = ''.join(
        f'<p>{esc(p)}{esc("；" if i < len(chunks) - 1 else "")}</p>'
        for i, p in enumerate(chunks))
    objectives = ''.join(f'''
      <div class="obj-item reveal">
        <div class="icon-badge xs">{icon('check')}</div>
        <p>{esc(ms[f'objective{i}'])}</p>
      </div>''' for i in range(1, 5))
    areas = ''.join(f'''
      <div class="institutional-card focus-item reveal">
        <div class="icon-badge xs">{icon(ABOUT_AREA_ICONS[i])}</div>
        <span class="label">{esc(ab[f'area{i+1}'])}</span>
      </div>''' for i in range(5))
    initiatives = ''.join(f'''
      <div class="institutional-card initiative-item reveal">
        <div class="icon-badge xs">{icon(ABOUT_INITIATIVE_ICONS[i])}</div>
        <span class="label">{esc(ab[f'initiative{i+1}'])}</span>
      </div>''' for i in range(7))
    body = page_hero(lang, 'about') + f'''
<section class="section-spacing">
  <div class="container-institutional">
    <div class="max-w-5 mx-auto reveal">
      <div class="purpose-card">
        <h2>{esc(head)}</h2>
        <div>{paras}</div>
      </div>
    </div>
  </div>
</section>
<section class="section-spacing bg-muted-50">
  <div class="container-institutional">
    <div class="text-center mb-12 reveal">
      <h2 class="institutional-subheading mb-4">{esc(ms['title'])}</h2>
      <p class="text-lg text-muted-foreground">{esc(ms['subtitle'])}</p>
    </div>
    <div class="grid grid-2 max-w-6 mx-auto mb-16">
      <div class="institutional-card no-border shadow-md reveal">
        <div class="icon-badge sm">{icon('eye')}</div>
        <h3 style="font-family:var(--font-sans);font-size:1.5rem;font-weight:600;margin-bottom:.5rem;">{esc(ms['visionTitle'])}</h3>
        <p class="text-lg text-muted-foreground" style="line-height:1.75;">{esc(ms['visionText'])}</p>
      </div>
      <div class="institutional-card no-border shadow-md reveal">
        <div class="icon-badge sm secondary">{icon('flag')}</div>
        <h3 style="font-family:var(--font-sans);font-size:1.5rem;font-weight:600;margin-bottom:.5rem;">{esc(ms['missionTitle'])}</h3>
        <p class="text-lg text-muted-foreground" style="line-height:1.75;">{esc(ms['missionText'])}</p>
      </div>
    </div>
    <div class="max-w-5 mx-auto">
      <h3 style="font-size:1.5rem;font-weight:600;text-align:center;margin-bottom:2rem;">{esc(ms['objectivesTitle'])}</h3>
      <div class="grid grid-2">{objectives}</div>
    </div>
  </div>
</section>
<section class="section-spacing">
  <div class="container-institutional">
    <h2 class="institutional-subheading text-center mb-12 reveal">{esc(ab['focusAreas'])}</h2>
    <div class="grid grid-3 max-w-5 mx-auto">{areas}</div>
  </div>
</section>
<section class="section-spacing bg-muted-30">
  <div class="container-institutional">
    <h2 class="institutional-subheading text-center mb-12 reveal">{esc(ab['initiatives'])}</h2>
    <div class="grid grid-3">{initiatives}</div>
  </div>
</section>'''
    desc = {'zh-TW': '澳門財經科技與教育發展學會——推動澳門多元化發展的非營利智庫',
            'zh-CN': '澳门财经科技与教育发展学会——推动澳门多元化发展的非营利智库',
            'en': 'A non-profit think tank driving Macao\'s diversified development',
            'pt': 'Um think tank sem fins lucrativos impulsionando o desenvolvimento diversificado de Macau'}[lang]
    return page_shell('about', lang, ab['title'], desc, body)

# ---------------- 研究領域 ----------------
def render_research(lang):
    rs = I18N[lang]['research']
    cards = ''.join(f'''
      <div class="institutional-card research-card reveal"{' data-mft-game' if i == 8 else ''}>
        <div class="icon-badge sm">{icon(RESEARCH_ICONS[i-1])}</div>
        <h2>{esc(rs[f'area{i}']['title'])}</h2>
        <p>{esc(rs[f'area{i}']['description'])}</p>
      </div>''' for i in range(1, 13))
    body = page_hero(lang, 'research') + f'''
<section class="section-spacing">
  <div class="container-institutional">
    <div class="grid grid-3">{cards}</div>
  </div>
</section>'''
    # area8「現代金融」卡片綁定「濠江財富大亨」遊戲彈窗（assets/js/game-launcher.js）
    badge = {'zh-TW': '🎮 財智遊戲 · 立即試玩', 'zh-CN': '🎮 财智游戏 · 立即试玩',
             'en': '🎮 Finance Game · Play Now', 'pt': '🎮 Jogo de Finanças · Jogar Agora'}[lang]
    launcher = (f'<script src="{asset("js/game-launcher.js", lang)}{ASSET_V}" defer '
                f'data-game-url="/game/index.html" data-badge="{esc(badge)}"></script>')
    return page_shell('research', lang, rs['title'], rs['subtitle'], body, extra_head=launcher)

# ---------------- 重點項目 ----------------
def render_projects(lang):
    pj = I18N[lang]['projects']
    # 按年份降序（近→遠）排列時間線
    projects = sorted((pj[f'project{i}'] for i in range(1, 4)),
                      key=lambda p: int(p['year']), reverse=True)
    items = ''.join(f'''
      <div class="timeline-item reveal">
        <span class="timeline-year">{esc(p['year'])}</span>
        <div class="institutional-card timeline-card">
          <h3>{esc(p['title'])}</h3>
          <p>{esc(p['description'])}</p>
        </div>
      </div>''' for p in projects)
    body = page_hero(lang, 'projects') + f'''
<section class="section-spacing">
  <div class="container-institutional">
    <div class="max-w-4 mx-auto grid" style="gap:2rem;">{items}</div>
  </div>
</section>'''
    return page_shell('projects', lang, pj['title'], pj['subtitle'], body)

# ---------------- 出版物 ----------------
def render_publications(lang):
    pb = I18N[lang]['publications']
    covers = {'university': 'book-university.webp', 'community': 'book-community.webp',
              'youth': 'book-youth.webp', 'supplement': 'book-supplement.webp'}
    pdfs = {'university': 'book-university.pdf', 'community': 'book-community.pdf',
            'youth': 'book-youth.pdf', 'supplement': 'book-supplement.pdf'}
    cards = ''.join(f'''
      <div class="institutional-card book-card reveal">
        <img class="book-cover" src="{asset('img/' + covers[k], lang)}" alt="{esc(pb[k]['title'])}" loading="lazy">
        <div class="book-body">
          <h3>{esc(pb[k]['title'])}</h3>
          <p>{esc(pb[k]['description'])}</p>
          <div class="book-actions">
            <a class="btn btn-primary" href="{asset('pdf/' + pdfs[k], lang)}" target="_blank" rel="noopener">{esc(pb['readOnline'])}</a>
            <a class="btn btn-outline" href="{asset('pdf/' + pdfs[k], lang)}" download="{esc(pb[k]['title'])}.pdf">{esc(pb['downloadPDF'])}</a>
          </div>
        </div>
      </div>''' for k in ['university', 'community', 'youth', 'supplement'])
    body = page_hero(lang, 'publications') + f'''
<section class="section-spacing">
  <div class="container-institutional">
    <div class="grid grid-4">{cards}</div>
  </div>
</section>'''
    return page_shell('publications', lang, pb['title'], pb['subtitle'], body)

# ---------------- 研究洞察 ----------------
def render_insights(lang):
    ins = I18N[lang]['insights']
    column_title = {'zh-TW': '社評專欄', 'zh-CN': '社评专栏', 'en': 'Op-Ed Column', 'pt': 'Coluna de Opinião'}[lang]
    all_sorted = sorted(C['insights'], key=lambda x: x['date'], reverse=True)
    column_cards = ''
    for a in (x for x in all_sorted if x.get('column')):
        href = f'insights/{a["slug"]}.html' if a.get('slug') else '#'
        author_html = ''
        if a.get('author'):
            author_html = f'<span class="column-card-author">{esc(a["author"]["name"][lang])} · {esc(a["author"]["title"][lang])}</span>'
        column_cards += f'''
      <a class="institutional-card column-card reveal" href="{href}">
        <div class="insight-meta">
          <span class="badge">{esc(a['category'][lang])}</span>
          <span class="date">{icon('calendar')}{a['date']}</span>
        </div>
        <h3>{esc(a['title'][lang])}</h3>
        <p>{esc(a['excerpt'][lang])}</p>
        <div class="column-card-meta">{author_html}<span class="read-more">{esc(ins['readMore'])}{icon('arrow')}</span></div>
      </a>'''
    column_section = ''
    if column_cards:
        column_section = f'''
<section class="section-spacing bg-muted-50">
  <div class="container-institutional">
    <h2 class="institutional-subheading text-center mb-12 reveal">{esc(column_title)}</h2>
    <div class="max-w-5 mx-auto grid" style="gap:1.5rem;">{column_cards}
    </div>
  </div>
</section>'''
    cards = ''
    for a in (x for x in all_sorted if not x.get('column')):
        # 無 slug 的條目沒有詳情頁，不輸出「閱讀更多」鏈接
        read_more = ''
        if a.get('slug'):
            read_more = f'<a class="read-more" href="insights/{a["slug"]}.html">{esc(ins["readMore"])}{icon("arrow")}</a>'
        cards += f'''
      <div class="institutional-card insight-card reveal">
        <div class="insight-meta">
          <span class="badge">{esc(a['category'][lang])}</span>
          <span class="date">{icon('calendar')}{a['date']}</span>
        </div>
        <h3>{esc(a['title'][lang])}</h3>
        <p>{esc(a['excerpt'][lang])}</p>
        {read_more}
      </div>'''
    body = page_hero(lang, 'insights') + column_section + f'''
<section class="section-spacing">
  <div class="container-institutional">
    <div class="grid grid-3">{cards}</div>
  </div>
</section>'''
    return page_shell('insights', lang, ins['title'], ins['subtitle'], body)

def render_insight_article(lang, a):
    """單篇文章詳情頁（insights/{slug}.html），C['insights'] 中帶 slug+body 的條目。"""
    ins = I18N[lang]['insights']
    # 詳情頁在 insights/ 子目錄，資產路徑多一層 ../
    dprefix = '../' + ('../' if lang != DEFAULT else '') + 'assets/'
    body_html = ''
    fig = {img['after']: img for img in a.get('images', [])}
    for idx, para in enumerate(a['body'][lang], 1):
        body_html += f'<p style="line-height:1.875;margin-bottom:1.25rem;color:hsl(var(--foreground));">{esc(para)}</p>'
        if idx in fig:
            im = fig[idx]
            body_html += (f'<figure style="margin:2rem 0;">'
                          f'<img src="{dprefix}img/news/{im["file"]}" alt="{esc(im["caption"][lang])}" loading="lazy"{img_wh_attrs("img/news/" + im["file"])} style="width:100%;border-radius:12px;">'
                          f'<figcaption style="text-align:center;font-size:.875rem;color:hsl(var(--muted-foreground));margin-top:.75rem;">{esc(im["caption"][lang])}</figcaption>'
                          f'</figure>')
    img_html = ''
    if a.get('image'):
        img_html = f'<img src="{dprefix}img/news/{a["image"]}" alt="{esc(a["title"][lang])}"{img_wh_attrs("img/news/" + a["image"])} style="width:100%;border-radius:12px;margin:1.5rem 0;">'
    author_html = ''
    if a.get('author'):
        sep = '｜' if lang.startswith('zh') else ' | '
        author_html = f'<p class="article-author"><strong>{esc(a["author"]["name"][lang])}</strong>{sep}{esc(a["author"]["title"][lang])}</p>'
    source_html = ''
    if a.get('source'):
        prefix = {'zh-TW': '原文載於', 'zh-CN': '原文载于', 'en': 'Originally published in', 'pt': 'Originalmente publicado em'}[lang]
        src_name = a['source']['name'][lang]
        quoted = f'《{src_name}》' if lang.startswith('zh') else src_name
        source_html = f'''<div class="article-source">
        {esc(prefix)} <a href="{esc(a["source"]["url"])}" target="_blank" rel="noopener">{esc(quoted)}</a>
      </div>'''
    body = f'''
<section class="page-hero">
  <div class="container-institutional">
    <div class="reveal max-w-5 mx-auto">
      <div class="insight-meta" style="justify-content:center;">
        <span class="badge">{esc(a['category'][lang])}</span>
        <span class="date">{icon('calendar')}{a['date']}</span>
      </div>
      <h1 class="institutional-heading" style="font-size:clamp(1.75rem,3.5vw,2.5rem);">{esc(a['title'][lang])}</h1>
      {author_html}
    </div>
  </div>
</section>
<section class="section-spacing" style="padding-top:0;">
  <div class="container-institutional">
    <div class="max-w-5 mx-auto institutional-card" style="padding:clamp(1.5rem,4vw,3rem);">
      {img_html}
      <div>{body_html}</div>
      {source_html}
      <div style="margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid hsl(var(--border));">
        <a class="read-more" href="../insights.html">{icon('arrow-left')} {esc({'zh-TW': '返回研究洞察', 'zh-CN': '返回研究洞察', 'en': 'Back to Insights', 'pt': 'Voltar aos Insights'}[lang])}</a>
      </div>
    </div>
  </div>
</section>'''
    og = None
    og_dims = None
    if a.get('images'):
        og = C.get('site_url', 'https://mfteda.org').rstrip('/') + '/assets/img/news/' + a['images'][0]['file']
        og_dims = img_size('img/news/' + a['images'][0]['file'])
    meta = {'date': a['date'],
            'author': a['author']['name'][lang] if a.get('author') else None,
            'section': a['category'][lang],
            'image': og}
    return page_shell('insights', lang, a['title'][lang], a['excerpt'][lang], body,
                      depth=1, url_path=f'insights/{a["slug"]}', og_image=og,
                      og_type='article', article_meta=meta, og_image_dims=og_dims)

# ---------------- 新聞動態 ----------------
NEWS_SOURCE_PREFIX = {'zh-TW': '原文出處', 'zh-CN': '原文出处', 'en': 'Source', 'pt': 'Fonte'}

def render_news(lang):
    ins = I18N[lang]['insights']
    hero_title = {'zh-TW': '新聞動態', 'zh-CN': '新闻动态', 'en': 'News', 'pt': 'Notícias'}[lang]
    hero_sub = {'zh-TW': '本會最新公開動態、活動紀實與媒體報道，見證澳門財經科技與教育智庫的實踐足跡',
                'zh-CN': '本会最新公开动态、活动纪实与媒体报道，见证澳门财经科技与教育智库的实践足迹',
                'en': "Latest news, event coverage and media reports from MFTEDA, Macao's think tank for financial technology and education",
                'pt': 'Últimas notícias, reportagens de eventos e cobertura mediática da MFTEDA, think tank de Macau'}[lang]
    cards = ''.join(f'''
      <div class="institutional-card insight-card reveal">
        <div class="insight-meta">
          <span class="badge">{esc(a['category'][lang])}</span>
          <span class="date">{icon('calendar')}{a['date']}</span>
          <span class="source">{esc(a['source']['name'][lang])}</span>
        </div>
        <h2>{esc(a['title'][lang])}</h2>
        <p>{esc(a['excerpt'][lang])}</p>
        <a class="read-more" href="news/{a['slug']}.html">{esc(ins['readMore'])}{icon('arrow')}</a>
      </div>''' for a in sorted(C['news'], key=lambda x: x['date'], reverse=True))
    body = f'''
<section class="page-hero">
  <div class="container-institutional">
    <div class="reveal">
      <h1 class="institutional-heading">{esc(hero_title)}</h1>
      <p class="sub text-muted-foreground">{esc(hero_sub)}</p>
    </div>
  </div>
</section>
<section class="section-spacing">
  <div class="container-institutional">
    <div class="grid grid-3">{cards}</div>
  </div>
</section>'''
    return page_shell('news', lang, hero_title, hero_sub, body)

def render_news_article(lang, a):
    """單篇新聞詳情頁（news/{slug}.html），C['news'] 條目。可選 images 配圖（與 insights 文章相同語法，src 統一存為 file）。"""
    ins = I18N[lang]['insights']
    # 詳情頁在 news/ 子目錄，資產路徑多一層 ../
    dprefix = '../' + ('../' if lang != DEFAULT else '') + 'assets/'
    body_html = ''
    fig = {img['after']: img for img in a.get('images', [])}
    for idx, para in enumerate(a['body'][lang], 1):
        body_html += f'<p style="line-height:1.875;margin-bottom:1.25rem;color:hsl(var(--foreground));">{esc(para)}</p>'
        if idx in fig:
            im = fig[idx]
            body_html += (f'<figure style="margin:2rem 0;">'
                          f'<img src="{dprefix}img/news/{im["file"]}" alt="{esc(im["caption"][lang])}" loading="lazy"{img_wh_attrs("img/news/" + im["file"])} style="width:100%;border-radius:12px;">'
                          f'<figcaption style="text-align:center;font-size:.875rem;color:hsl(var(--muted-foreground));margin-top:.75rem;">{esc(im["caption"][lang])}</figcaption>'
                          f'</figure>')
    src_name = a['source']['name'][lang]
    quoted = f'《{src_name}》' if lang.startswith('zh') else src_name
    source_html = f'''<div class="article-source">
        {esc(NEWS_SOURCE_PREFIX[lang])} <a href="{esc(a['source']['url'])}" target="_blank" rel="noopener">{esc(quoted)}</a>
      </div>'''
    body = f'''
<section class="page-hero">
  <div class="container-institutional">
    <div class="reveal max-w-5 mx-auto">
      <div class="insight-meta" style="justify-content:center;">
        <span class="badge">{esc(a['category'][lang])}</span>
        <span class="date">{icon('calendar')}{a['date']}</span>
        <span class="source">{esc(a['source']['name'][lang])}</span>
      </div>
      <h1 class="institutional-heading" style="font-size:clamp(1.75rem,3.5vw,2.5rem);">{esc(a['title'][lang])}</h1>
    </div>
  </div>
</section>
<section class="section-spacing" style="padding-top:0;">
  <div class="container-institutional">
    <div class="max-w-5 mx-auto institutional-card" style="padding:clamp(1.5rem,4vw,3rem);">
      <div>{body_html}</div>
      {source_html}
      <div style="margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid hsl(var(--border));">
        <a class="read-more" href="../news.html">{icon('arrow-left')} {esc({'zh-TW': '返回新聞動態', 'zh-CN': '返回新闻动态', 'en': 'Back to News', 'pt': 'Voltar às Notícias'}[lang])}</a>
      </div>
    </div>
  </div>
</section>'''
    og = None
    og_dims = None
    if a.get('images'):
        og = C.get('site_url', 'https://mfteda.org').rstrip('/') + '/assets/img/news/' + a['images'][0]['file']
        og_dims = img_size('img/news/' + a['images'][0]['file'])
    meta = {'date': a['date'],
            'author': None,
            'section': a['category'][lang],
            'image': og}
    return page_shell('news', lang, a['title'][lang], a['excerpt'][lang], body,
                      depth=1, url_path=f'news/{a["slug"]}', og_image=og,
                      og_type='article', article_meta=meta, og_image_dims=og_dims)

# ---------------- 合作夥伴 ----------------
def render_partners(lang):
    pt = I18N[lang]['partners']
    hrefs = C['partners_href']
    cards = ''
    for i in range(1, 17):
        logo_path = os.path.join(ROOT, 'assets', 'img', 'partners', f'partner{i}.webp')
        logo_html = ''
        if os.path.exists(logo_path):
            logo_html = (f'<div class="partner-logo">'
                         f'<img src="{asset(f"img/partners/partner{i}.webp", lang)}" alt="{esc(pt[f"partner{i}"])}" loading="lazy">'
                         f'</div>')
        cards += f'''
      <a class="institutional-card partner-card reveal" href="{hrefs[f'partner{i}']}"{' target="_blank" rel="noopener"' if hrefs[f'partner{i}'] != '#' else ''} style="display:block;">
        {logo_html}
        <h2>{esc(pt[f'partner{i}'])}</h2>
      </a>'''
    body = page_hero(lang, 'partners') + f'''
<section class="section-spacing">
  <div class="container-institutional">
    <div class="grid grid-4">{cards}</div>
  </div>
</section>'''
    return page_shell('partners', lang, pt['title'], pt['subtitle'], body)

# ---------------- 招商政策 ----------------
def render_policy(lang):
    hero_title = {'zh-TW': '招商政策', 'zh-CN': '招商政策', 'en': 'Investment Policies', 'pt': 'Políticas de Investimento'}[lang]
    hero_sub = {'zh-TW': '轉載澳門及橫琴最新招商引資政策，助力企業把握灣區機遇',
                'zh-CN': '转载澳门及横琴最新招商引资政策，助力企业把握湾区机遇',
                'en': "The latest investment promotion policies from Macao and Hengqin, helping enterprises seize Greater Bay Area opportunities",
                'pt': 'As mais recentes políticas de promoção de investimento de Macau e Hengqin, ajudando as empresas a aproveitar as oportunidades da Grande Baía'}[lang]
    section_titles = {
        'macao': {'zh-TW': '澳門特區政策', 'zh-CN': '澳门特区政策', 'en': 'Macao SAR Policies', 'pt': 'Políticas da RAE de Macau'},
        'hengqin': {'zh-TW': '橫琴粵澳深度合作區政策', 'zh-CN': '横琴粤澳深度合作区政策', 'en': 'Guangdong-Macao In-Depth Cooperation Zone in Hengqin Policies', 'pt': 'Políticas da Zona de Cooperação Aprofundada Guangdong-Macau em Hengqin'}}
    more = {'zh-TW': '了解詳情', 'zh-CN': '了解详情', 'en': 'Learn More', 'pt': 'Saber Mais'}[lang]
    sections_html = ''
    for region in ('macao', 'hengqin'):
        cards = ''.join(f'''
      <div class="institutional-card insight-card reveal">
        <div class="insight-meta">
          <span class="badge">{esc(p['year'][lang] if isinstance(p['year'], dict) else p['year'])}</span>
        </div>
        <h3>{esc(p['title'][lang])}</h3>
        <p>{esc(p['summary'][lang])}</p>
        <a class="read-more" href="{p['url']}" target="_blank" rel="noopener">{esc(more)}{icon('arrow')}</a>
      </div>''' for p in C['policies'] if p['region'] == region)
        sections_html += f'''
<section class="section-spacing{' bg-muted-50' if region == 'hengqin' else ''}">
  <div class="container-institutional">
    <h2 class="institutional-subheading text-center mb-12 reveal">{esc(section_titles[region][lang])}</h2>
    <div class="grid grid-3">{cards}
    </div>
  </div>
</section>'''
    body = f'''
<section class="page-hero">
  <div class="container-institutional">
    <div class="reveal">
      <h1 class="institutional-heading">{esc(hero_title)}</h1>
      <p class="sub text-muted-foreground">{esc(hero_sub)}</p>
    </div>
  </div>
</section>{sections_html}'''
    desc = {'zh-TW': '澳門及橫琴粵澳深度合作區最新招商引資政策匯編',
            'zh-CN': '澳门及横琴粤澳深度合作区最新招商引资政策汇编',
            'en': "Latest investment promotion policies from Macao SAR and the Guangdong-Macao In-Depth Cooperation Zone in Hengqin",
            'pt': 'Compilação das mais recentes políticas de promoção de investimento da RAE de Macau e da Zona de Cooperação Aprofundada Guangdong-Macau em Hengqin'}[lang]
    return page_shell('policy', lang, hero_title, desc, body)

# ---------------- 聯繫我們 ----------------
def render_contact(lang):
    ct = I18N[lang]['contact']
    # href 為 '#' 的社交鏈接不渲染；全部為 '#' 時整個「關注我們」行不輸出
    social_links = [(s, label) for s, label in SOCIAL if C['social'].get(s, '#') != '#']
    social_row = ''
    if social_links:
        social = ''.join(f'<a href="{C["social"][s]}" aria-label="{label}">{icon(s)}</a>' for s, label in social_links)
        social_row = f'''<div class="info-row">
            <span style="font-weight:500;color:hsl(var(--muted-foreground));display:block;margin-bottom:.75rem;">{esc({'zh-TW': '關注我們', 'zh-CN': '关注我们', 'en': 'Follow Us', 'pt': 'Siga-nos'}[lang])}</span>
            <div class="social-row">{social}</div>
          </div>'''
    inquiry_opts = ''.join(f'<option value="{k}">{esc(v)}</option>' for k, v in ct['inquiryTypes'].items())
    err_req, err_email, submitting = esc(ct['errorRequired']), esc(ct['errorEmail']), esc(ct['submitting'])
    body = page_hero(lang, 'contact') + f'''
<section class="section-spacing">
  <div class="container-institutional">
    <div class="contact-grid">
      <div class="institutional-card reveal">
        <div class="contact-info">
          <h3>{esc(ct['orgName'])}</h3>
          <div class="info-row">
            <div class="label">{icon('pin')}<span>{esc(ct['address'])}</span></div>
            <span>{esc(ct['addressValue'])}</span>
          </div>
          <div class="info-row">
            <div class="label">{icon('mail')}<span>{esc(ct['email'])}</span></div>
            <a href="mailto:{C['email']}">{C['email']}</a>
          </div>
          {social_row}
        </div>
      </div>
      <div class="institutional-card reveal" data-tabs>
        <div class="tabs" role="tablist">
          <button type="button" data-tab="contact" class="active" role="tab" id="tab-contact" aria-selected="true" aria-controls="pane-contact">{esc(ct['contactForm'])}</button>
          <button type="button" data-tab="cooperation" role="tab" id="tab-cooperation" aria-selected="false" aria-controls="pane-cooperation">{esc(ct['cooperationForm'])}</button>
        </div>
        <form class="ajax-form tab-pane active" data-pane="contact" role="tabpanel" id="pane-contact" aria-labelledby="tab-contact" data-err-required="{err_req}" data-err-email="{err_email}" data-submitting="{submitting}" novalidate>
          <div class="form-group">
            <label for="c-name">{esc(ct['name'])}</label>
            <input id="c-name" name="name" type="text" placeholder="{esc(ct['namePlaceholder'])}" required aria-describedby="err-c-name">
            <p class="err-msg" data-for="name" id="err-c-name"></p>
          </div>
          <div class="form-group">
            <label for="c-email">{esc(ct['emailLabel'])}</label>
            <input id="c-email" name="email" type="email" placeholder="{esc(ct['emailPlaceholder'])}" required aria-describedby="err-c-email">
            <p class="err-msg" data-for="email" id="err-c-email"></p>
          </div>
          <div class="form-group">
            <label for="c-message">{esc(ct['message'])}</label>
            <textarea id="c-message" name="message" placeholder="{esc(ct['messagePlaceholder'])}" required aria-describedby="err-c-message"></textarea>
            <p class="err-msg" data-for="message" id="err-c-message"></p>
          </div>
          <button type="submit" class="btn btn-primary">{esc(ct['submit'])}</button>
          <div class="form-toast" role="status" aria-live="polite">{icon('check')}{esc(ct['successMessage'])}</div>
        </form>
        <form class="ajax-form tab-pane" data-pane="cooperation" role="tabpanel" id="pane-cooperation" aria-labelledby="tab-cooperation" data-err-required="{err_req}" data-err-email="{err_email}" data-submitting="{submitting}" novalidate>
          <div class="form-group">
            <label for="o-org">{esc(ct['organization'])}</label>
            <input id="o-org" name="organization" type="text" placeholder="{esc(ct['organizationPlaceholder'])}" required aria-describedby="err-o-org">
            <p class="err-msg" data-for="organization" id="err-o-org"></p>
          </div>
          <div class="form-group">
            <label for="o-type">{esc(ct['inquiryType'])}</label>
            <select id="o-type" name="inquiryType" required aria-describedby="err-o-type">
              <option value="">{esc(ct['inquiryTypePlaceholder'])}</option>
              {inquiry_opts}
            </select>
            <p class="err-msg" data-for="inquiryType" id="err-o-type"></p>
          </div>
          <div class="form-group">
            <label for="o-email">{esc(ct['emailLabel'])}</label>
            <input id="o-email" name="email" type="email" placeholder="{esc(ct['emailPlaceholder'])}" required aria-describedby="err-o-email">
            <p class="err-msg" data-for="email" id="err-o-email"></p>
          </div>
          <div class="form-group">
            <label for="o-message">{esc(ct['message'])}</label>
            <textarea id="o-message" name="message" placeholder="{esc(ct['messagePlaceholder'])}" required aria-describedby="err-o-message"></textarea>
            <p class="err-msg" data-for="message" id="err-o-message"></p>
          </div>
          <button type="submit" class="btn btn-primary">{esc(ct['submit'])}</button>
          <div class="form-toast" role="status" aria-live="polite">{icon('check')}{esc(ct['successMessage'])}</div>
        </form>
      </div>
    </div>
  </div>
</section>'''
    desc = {'zh-TW': '聯繫澳門財經科技與教育發展學會：研究合作、諮詢服務、戰略合作',
            'zh-CN': '联系澳门财经科技与教育发展学会：研究合作、咨询服务、战略合作',
            'en': 'Contact MFTEDA for research collaboration, consulting services, and strategic partnerships.',
            'pt': 'Contacte a MFTEDA para colaboração em pesquisa, serviços de consultoria e parcerias estratégicas.'}[lang]
    return page_shell('contact', lang, ct['title'], desc, body)

# ---------------- 構建 ----------------
RENDERERS = {'index': render_index, 'about': render_about, 'research': render_research,
             'projects': render_projects, 'publications': render_publications,
             'insights': render_insights, 'news': render_news, 'partners': render_partners, 'policy': render_policy,
             'contact': render_contact}

def build():
    if os.path.exists(DIST): shutil.rmtree(DIST)
    os.makedirs(DIST)
    shutil.copytree(os.path.join(ROOT, 'assets'), os.path.join(DIST, 'assets'))
    # 「濠江財富大亨」財經教育遊戲（/game/，由研究領域「現代金融」卡片彈出）
    shutil.copytree(os.path.join(ROOT, 'game'), os.path.join(DIST, 'game'))
    with open(os.path.join(DIST, 'CNAME'), 'w') as f:
        f.write('mfteda.org\n')

    # robots.txt
    with open(os.path.join(DIST, 'robots.txt'), 'w') as f:
        f.write('User-agent: *\nAllow: /\n\nSitemap: https://mfteda.org/sitemap.xml\n')

    # 404 頁（GitHub Pages 自動使用根目錄 404.html）
    not_found_body = f'''
<section class="page-hero">
  <div class="container-institutional">
    <div class="reveal">
      <h1 class="institutional-heading">404</h1>
      <p class="sub text-muted-foreground">{esc({'zh-TW': '頁面不存在或已被移動', 'zh-CN': '页面不存在或已被移动', 'en': 'The page you are looking for does not exist or has been moved.', 'pt': 'A página que procura não existe ou foi movida.'}[DEFAULT])}</p>
      <div class="cta-row" style="margin-top:2rem;">
        <a class="btn btn-primary" href="index.html">{esc({'zh-TW': '返回首頁', 'zh-CN': '返回首页', 'en': 'Back to Home', 'pt': 'Voltar ao Início'}[DEFAULT])}{icon('arrow')}</a>
      </div>
    </div>
  </div>
</section>'''
    with open(os.path.join(DIST, '404.html'), 'w', encoding='utf-8') as f:
        f.write(page_shell('index', DEFAULT, '404', 'Page not found', not_found_body, noindex=True))

    count = 2
    urls = []
    articles = [a for a in C['insights'] if a.get('slug') and a.get('body')]
    for lang in LANGS:
        outdir = DIST if lang == DEFAULT else os.path.join(DIST, lang)
        os.makedirs(outdir, exist_ok=True)
        for page in PAGES:
            html_out = RENDERERS[page](lang)
            name = 'index.html' if page == 'index' else f'{page}.html'
            with open(os.path.join(outdir, name), 'w', encoding='utf-8') as f:
                f.write(html_out)
            urls.append((page, lang, BUILD_DATE))
            count += 1
        for a in articles:
            adir = os.path.join(outdir, 'insights')
            os.makedirs(adir, exist_ok=True)
            with open(os.path.join(adir, f'{a["slug"]}.html'), 'w', encoding='utf-8') as f:
                f.write(render_insight_article(lang, a))
            urls.append((f'insights/{a["slug"]}', lang, a['date']))
            count += 1
        for a in C['news']:
            ndir = os.path.join(outdir, 'news')
            os.makedirs(ndir, exist_ok=True)
            with open(os.path.join(ndir, f'{a["slug"]}.html'), 'w', encoding='utf-8') as f:
                f.write(render_news_article(lang, a))
            urls.append((f'news/{a["slug"]}', lang, a['date']))
            count += 1

    # sitemap.xml（含 hreflang alternates；lastmod：詳情頁用條目日期，列表頁用構建日期）
    xhtml = 'xmlns:xhtml="http://www.w3.org/1999/xhtml"'
    items = []
    for page, lang, lastmod in urls:
        loc = abs_url(page, lang)
        alts = ''.join(
            f'\n      <xhtml:link rel="alternate" hreflang="{l}" href="{abs_url(page, l)}"/>'
            for l in LANGS)
        items.append(f'''  <url>
      <loc>{loc}</loc>
      <lastmod>{lastmod}</lastmod>{alts}
      <xhtml:link rel="alternate" hreflang="x-default" href="{abs_url(page, DEFAULT)}"/>
  </url>''')
    with open(os.path.join(DIST, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n'
                f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" {xhtml}>\n'
                + '\n'.join(items) + '\n</urlset>\n')
    print(f'OK: generated {count} files -> {DIST}')

if __name__ == '__main__':
    build()
