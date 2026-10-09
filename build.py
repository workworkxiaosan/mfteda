#!/usr/bin/env python3
"""
MFTEDA 官網靜態站生成器
讀取 content.json，輸出多語言靜態 HTML 到 dist/。

用法:
    python3 build.py

更新網站內容 = 改 content.json → 重新執行 python3 build.py。
"""
import json, html, os, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')
C = json.load(open(os.path.join(ROOT, 'content.json'), encoding='utf-8'))
I18N = C['i18n']
LANGS = [l['code'] for l in C['languages']]
DEFAULT = C['default_lang']
PAGES = ['index', 'about', 'research', 'projects', 'publications', 'insights', 'partners', 'policy', 'contact']

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
        'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
        'arrow': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
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
RESEARCH_ICONS = ['cpu', 'dollar', 'leaf', 'plane', 'landmark', 'network', 'ship', 'trending', 'sparkles', 'handshake', 'file']
ABOUT_AREA_ICONS = ['dollar', 'globe', 'trending', 'sparkles', 'users']
ABOUT_INITIATIVE_ICONS = ['trending', 'handshake', 'book', 'cpu', 'dollar', 'users', 'sparkles']
SOCIAL = [('facebook', 'Facebook'), ('linkedin', 'LinkedIn'), ('twitter', 'Twitter')]

# ---------------- 頁頭 / 頁尾 ----------------
def header(page, lang, pre=''):
    nav = I18N[lang]['nav']
    logo = pre + asset('img/logo.png', lang)
    hp = lambda p: pre + page_href(p, lang, lang)
    links = ''.join(
        f'<a href="{hp(p)}" class="{"active" if p == page else ""}">{esc(nav[p if p != "index" else "home"])}</a>'
        for p in PAGES)
    lang_btn_label = next(l['label'] for l in C['languages'] if l['code'] == lang)
    lang_items = ''.join(
        f'<a href="{pre + page_href(page, l["code"], lang)}" class="{"current" if l["code"] == lang else ""}">{l["flag"]} {esc(l["label"])}</a>'
        for l in C['languages'])
    mlinks = ''.join(
        f'<a href="{hp(p)}" class="mnav {"active" if p == page else ""}">{esc(nav[p if p != "index" else "home"])}</a>'
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
      <button class="menu-toggle" id="menu-toggle" aria-label="Menu">{icon('menu')}</button>
    </div>
  </div>
</header>
<div class="panel-overlay" id="panel-overlay"></div>
<aside class="mobile-panel" id="mobile-panel">
  <div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">
    <button class="menu-toggle" onclick="document.getElementById('mobile-panel').classList.remove('open');document.getElementById('panel-overlay').classList.remove('open');" aria-label="Close">{icon('close')}</button>
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
    logo = pre + asset('img/logo.png', lang)
    hp = lambda p: pre + page_href(p, lang, lang)
    social = ''.join(f'<a href="{C["social"][s]}" aria-label="{label}">{icon(s)}</a>' for s, label in SOCIAL)
    return f'''<footer class="site-footer">
  <div class="container-institutional section-spacing">
    <div class="footer-grid">
      <div class="footer-col">
        <img src="{logo}" alt="MFTEDA Logo">
        <p class="desc">{esc(ft['description'])}</p>
        <div class="social-row">{social}</div>
      </div>
      <div class="footer-col">
        <h4>{esc(ft['quickLinks'])}</h4>
        <ul>
          <li><a href="{hp('index')}">{esc(nav['home'])}</a></li>
          <li><a href="{hp('about')}">{esc(nav['about'])}</a></li>
          <li><a href="{hp('research')}">{esc(nav['research'])}</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>{esc(ft['publications'])}</h4>
        <ul>
          <li><a href="{hp('publications')}">{esc(nav['publications'])}</a></li>
          <li><a href="{hp('insights')}">{esc(nav['insights'])}</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>{esc(ft['partners'])}</h4>
        <ul>
          <li><span>{esc(partners['partner1'])}</span></li>
          <li><span>{esc(partners['partner2'])}</span></li>
          <li><span>{esc(partners['partner3'])}</span></li>
          <li><span>{esc(partners['partner4'])}</span></li>
        </ul>
      </div>
    </div>
  </div>
  <div class="footer-bottom container-institutional">
    <span>© {C.get('year', 2026)} MFTEDA. {esc(ft['allRightsReserved'])}</span>
    <a href="mailto:{C['email']}">{C['email']}</a>
  </div>
</footer>'''

def page_shell(page, lang, title, description, body, depth=0, url_path=None, og_image=None):
    pre = '../' * depth
    css = pre + asset('css/style.css', lang)
    js = pre + asset('js/main.js', lang)
    lang_links = ''.join(
        f'<link rel="alternate" hreflang="{l}" href="{abs_url(url_path or page, l)}">'
        for l in LANGS)
    canonical = abs_url(url_path or page, lang)
    og_image = og_image or (C.get('site_url', 'https://mfteda.org').rstrip('/') + '/assets/img/og-cover.jpg')
    og_locale = {'zh-TW': 'zh_TW', 'zh-CN': 'zh_CN', 'en': 'en_US', 'pt': 'pt_PT'}[lang]
    # 機構名按各自語言版本書寫（簡體頁用簡體學會名）
    site_name = '澳门财经科技与教育发展学会' if lang == 'zh-CN' else C['site_name']
    jsonld = ''
    if page == 'index':
        jsonld = f'''<script type="application/ld+json">
  {{"@context":"https://schema.org","@type":"Organization","name":"{site_name}","alternateName":"{C['site_name_en']}","url":"{C.get('site_url','https://mfteda.org')}","logo":"{C.get('site_url','https://mfteda.org')}/assets/img/logo.png","email":"{C['email']}"}}
  </script>'''
    return f'''<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)} - MFTEDA</title>
  <meta name="description" content="{esc(description)}">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="{'website' if page == 'index' else 'article'}">
  <meta property="og:site_name" content="MFTEDA {esc(site_name)}">
  <meta property="og:locale" content="{og_locale}">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{og_image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(description)}">
  <meta name="twitter:image" content="{og_image}">
  <link rel="icon" type="image/png" href="{pre + asset('img/logo.png', lang)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{css}">
  <noscript><style>.reveal{{opacity:1 !important;transform:none !important;}}</style></noscript>
  {lang_links}
  {jsonld}
</head>
<body>
{header(page, lang, pre)}
<main>
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
    body = f'''
<section class="hero" style="background-image:url('{asset('img/hero-bg.webp', lang)}')">
  <div class="container-institutional">
    <div class="reveal">
      <h1>{esc(hero['headline'])}</h1>
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
    return page_shell('index', lang, t(lang, 'nav', 'home'), desc, body)

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
    # 末段結尾統一為單個句號（修復原站「。。」問題）
    chunks[-1] = chunks[-1].rstrip('。') + '。'
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
      <div class="institutional-card research-card reveal">
        <div class="icon-badge sm">{icon(RESEARCH_ICONS[i-1])}</div>
        <h3>{esc(rs[f'area{i}']['title'])}</h3>
        <p>{esc(rs[f'area{i}']['description'])}</p>
      </div>''' for i in range(1, 12))
    body = page_hero(lang, 'research') + f'''
<section class="section-spacing">
  <div class="container-institutional">
    <div class="grid grid-3">{cards}</div>
  </div>
</section>'''
    return page_shell('research', lang, rs['title'], rs['subtitle'], body)

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
        <img class="book-cover" src="{asset('img/' + covers[k], lang)}" alt="{esc(pb[k]['title'])}">
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
    cards = ''.join(f'''
      <div class="institutional-card insight-card reveal">
        <div class="insight-meta">
          <span class="badge">{esc(a['category'][lang])}</span>
          <span class="date">{icon('calendar')}{a['date']}</span>
        </div>
        <h3>{esc(a['title'][lang])}</h3>
        <p>{esc(a['excerpt'][lang])}</p>
        <a class="read-more" href="{f'insights/{a["slug"]}.html' if a.get('slug') else '#'}">{esc(ins['readMore'])}{icon('arrow')}</a>
      </div>''' for a in all_sorted if not a.get('column'))
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
                          f'<img src="{dprefix}img/news/{im["file"]}" alt="{esc(im["caption"][lang])}" loading="lazy" style="width:100%;border-radius:12px;">'
                          f'<figcaption style="text-align:center;font-size:.875rem;color:hsl(var(--muted-foreground));margin-top:.75rem;">{esc(im["caption"][lang])}</figcaption>'
                          f'</figure>')
    img_html = ''
    if a.get('image'):
        img_html = f'<img src="{dprefix}img/news/{a["image"]}" alt="{esc(a["title"][lang])}" style="width:100%;border-radius:12px;margin:1.5rem 0;">'
    author_html = ''
    if a.get('author'):
        author_html = f'<p class="article-author"><strong>{esc(a["author"]["name"][lang])}</strong>｜{esc(a["author"]["title"][lang])}</p>'
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
        <a class="read-more" href="../insights.html">{icon('arrow')} {esc({'zh-TW': '返回研究洞察', 'zh-CN': '返回研究洞察', 'en': 'Back to Insights', 'pt': 'Voltar aos Insights'}[lang])}</a>
      </div>
    </div>
  </div>
</section>'''
    og = None
    if a.get('images'):
        og = C.get('site_url', 'https://mfteda.org').rstrip('/') + '/assets/img/news/' + a['images'][0]['file']
    return page_shell('insights', lang, a['title'][lang], a['excerpt'][lang], body,
                      depth=1, url_path=f'insights/{a["slug"]}', og_image=og)

# ---------------- 合作夥伴 ----------------
def render_partners(lang):
    pt = I18N[lang]['partners']
    hrefs = C['partners_href']
    cards = ''.join(f'''
      <a class="institutional-card partner-card reveal" href="{hrefs[f'partner{i}']}"{' target="_blank" rel="noopener"' if hrefs[f'partner{i}'] != '#' else ''} style="display:block;">
        <h3>{esc(pt[f'partner{i}'])}</h3>
      </a>''' for i in range(1, 13))
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
    social = ''.join(f'<a href="{C["social"][s]}" aria-label="{label}">{icon(s)}</a>' for s, label in SOCIAL)
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
            <div class="label">{icon('mail')}<span>{esc(ct['email'])}</span></div>
            <a href="mailto:{C['email']}">{C['email']}</a>
          </div>
          <div class="info-row">
            <span style="font-weight:500;color:hsl(var(--muted-foreground));display:block;margin-bottom:.75rem;">{esc({'zh-TW': '關注我們', 'zh-CN': '关注我们', 'en': 'Follow Us', 'pt': 'Siga-nos'}[lang])}</span>
            <div class="social-row">{social}</div>
          </div>
        </div>
      </div>
      <div class="institutional-card reveal" data-tabs>
        <div class="tabs">
          <button type="button" data-tab="contact" class="active">{esc(ct['contactForm'])}</button>
          <button type="button" data-tab="cooperation">{esc(ct['cooperationForm'])}</button>
        </div>
        <form class="ajax-form tab-pane active" data-pane="contact" data-err-required="{err_req}" data-err-email="{err_email}" data-submitting="{submitting}" novalidate>
          <div class="form-group">
            <label for="c-name">{esc(ct['name'])}</label>
            <input id="c-name" name="name" type="text" placeholder="{esc(ct['namePlaceholder'])}" required>
            <p class="err-msg" data-for="name"></p>
          </div>
          <div class="form-group">
            <label for="c-email">{esc(ct['emailLabel'])}</label>
            <input id="c-email" name="email" type="email" placeholder="{esc(ct['emailPlaceholder'])}" required>
            <p class="err-msg" data-for="email"></p>
          </div>
          <div class="form-group">
            <label for="c-message">{esc(ct['message'])}</label>
            <textarea id="c-message" name="message" placeholder="{esc(ct['messagePlaceholder'])}" required></textarea>
            <p class="err-msg" data-for="message"></p>
          </div>
          <button type="submit" class="btn btn-primary">{esc(ct['submit'])}</button>
          <div class="form-toast">{icon('check')}{esc(ct['successMessage'])}</div>
        </form>
        <form class="ajax-form tab-pane" data-pane="cooperation" data-err-required="{err_req}" data-err-email="{err_email}" data-submitting="{submitting}" novalidate>
          <div class="form-group">
            <label for="o-org">{esc(ct['organization'])}</label>
            <input id="o-org" name="organization" type="text" placeholder="{esc(ct['organizationPlaceholder'])}" required>
            <p class="err-msg" data-for="organization"></p>
          </div>
          <div class="form-group">
            <label for="o-type">{esc(ct['inquiryType'])}</label>
            <select id="o-type" name="inquiryType" required>
              <option value="">{esc(ct['inquiryTypePlaceholder'])}</option>
              {inquiry_opts}
            </select>
            <p class="err-msg" data-for="inquiryType"></p>
          </div>
          <div class="form-group">
            <label for="o-email">{esc(ct['emailLabel'])}</label>
            <input id="o-email" name="email" type="email" placeholder="{esc(ct['emailPlaceholder'])}" required>
            <p class="err-msg" data-for="email"></p>
          </div>
          <div class="form-group">
            <label for="o-message">{esc(ct['message'])}</label>
            <textarea id="o-message" name="message" placeholder="{esc(ct['messagePlaceholder'])}" required></textarea>
            <p class="err-msg" data-for="message"></p>
          </div>
          <button type="submit" class="btn btn-primary">{esc(ct['submit'])}</button>
          <div class="form-toast">{icon('check')}{esc(ct['successMessage'])}</div>
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
             'insights': render_insights, 'partners': render_partners, 'policy': render_policy,
             'contact': render_contact}

def build():
    if os.path.exists(DIST): shutil.rmtree(DIST)
    os.makedirs(DIST)
    shutil.copytree(os.path.join(ROOT, 'assets'), os.path.join(DIST, 'assets'))
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
        f.write(page_shell('index', DEFAULT, '404', 'Page not found', not_found_body))

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
            urls.append((page, lang))
            count += 1
        for a in articles:
            adir = os.path.join(outdir, 'insights')
            os.makedirs(adir, exist_ok=True)
            with open(os.path.join(adir, f'{a["slug"]}.html'), 'w', encoding='utf-8') as f:
                f.write(render_insight_article(lang, a))
            urls.append((f'insights/{a["slug"]}', lang))
            count += 1

    # sitemap.xml（含 hreflang alternates）
    xhtml = 'xmlns:xhtml="http://www.w3.org/1999/xhtml"'
    items = []
    for page, lang in urls:
        loc = abs_url(page, lang)
        alts = ''.join(
            f'\n      <xhtml:link rel="alternate" hreflang="{l}" href="{abs_url(page, l)}"/>'
            for l in LANGS)
        items.append(f'''  <url>
      <loc>{loc}</loc>{alts}
      <xhtml:link rel="alternate" hreflang="x-default" href="{abs_url(page, DEFAULT)}"/>
  </url>''')
    with open(os.path.join(DIST, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n'
                f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" {xhtml}>\n'
                + '\n'.join(items) + '\n</urlset>\n')
    print(f'OK: generated {count} files -> {DIST}')

if __name__ == '__main__':
    build()
