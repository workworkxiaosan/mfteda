# -*- coding: utf-8 -*-
"""一次性整合腳本：把 .news-src/drafts/ 中 9 篇新草稿併入 news_data.py 與 translations/news.json。
news_data.py 保留 zh-TW/zh-CN/en/pt 四語言；fr 寫入 translations 覆寫層。"""
import json, os, pprint, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
DRAFTS = os.path.join(ROOT, '.news-src', 'drafts')

NEW_SLUGS = [
    'jisu-30th-anniversary-2025',
    'huangjialun-appointed-legco-member',
    'chinese-modernization-forum-macao-2025',
    'macao-economic-diversification-security-seminar',
    'liaison-office-education-youth-visit-2025',
    'aiesec-youth-career-forum-2025',
    'jixing-master-lecture-2-community-governance',
    'jixing-master-lecture-jisu-gaoming',
    'super-bamboo-soe-innovation-award',
]

LANGS4 = ['zh-TW', 'zh-CN', 'en', 'pt']

drafts = {}
for slug in NEW_SLUGS:
    with open(os.path.join(DRAFTS, slug + '.json'), encoding='utf-8') as f:
        d = json.load(f)
    assert d['slug'] == slug, slug
    n = len(d['body']['zh-TW'])
    for lang in ['zh-CN', 'en', 'pt', 'fr']:
        assert len(d['body'][lang]) == n, (slug, lang)
    for img in d.get('images', []):
        p = os.path.join(ROOT, 'assets', 'img', 'news', img['file'])
        assert os.path.exists(p), p
        assert os.path.getsize(p) < 200 * 1024, p
        assert set(img['caption']) >= {'zh-TW', 'zh-CN', 'en', 'pt', 'fr'}, (slug, img['file'])
    drafts[slug] = d

sys.path.insert(0, ROOT)
import news_data

existing = {e['slug'] for e in news_data.NEWS_WX}
for slug in NEW_SLUGS:
    assert slug not in existing, slug

def pick4(multilang):
    return {k: multilang[k] for k in LANGS4}

for slug in NEW_SLUGS:
    d = drafts[slug]
    entry = {
        'slug': slug,
        'date': d['date'],
        'category': pick4(d['category']),
        'title': pick4(d['title']),
        'excerpt': pick4(d['excerpt']),
        'source': {'name': pick4(d['source']['name']), 'url': d['source']['url']},
        'body': pick4(d['body']),
        'images': [{'file': img['file'], 'after': img['after'],
                    'caption': pick4(img['caption'])} for img in d.get('images', [])],
    }
    news_data.NEWS_WX.append(entry)

header = ('# -*- coding: utf-8 -*-\n'
          '"""微信公眾號稿件四語言內容（由 .news-src 草稿整合生成，make_content.py 引用）。\n'
          'images 的 file 對應 assets/img/news/ 下的 webp。"""\n\n')

def fmt(name, value):
    return name + ' = ' + pprint.pformat(value, width=120, sort_dicts=False) + '\n\n'

with open(os.path.join(ROOT, 'news_data.py'), 'w', encoding='utf-8') as f:
    f.write(header)
    f.write(fmt('NEWS_WX', news_data.NEWS_WX))
    f.write(fmt('OPED_HUMANITIES', news_data.OPED_HUMANITIES))
    f.write(fmt('YOUTH_OFFICIAL', news_data.YOUTH_OFFICIAL))

# translations/news.json：寫入 fr 覆寫
tj_path = os.path.join(ROOT, 'translations', 'news.json')
with open(tj_path, encoding='utf-8') as f:
    tj = json.load(f)
for slug in NEW_SLUGS:
    d = drafts[slug]
    tj['news'][slug] = {'fr': {
        'title': d['title']['fr'],
        'excerpt': d['excerpt']['fr'],
        'category': d['category']['fr'],
        'body': d['body']['fr'],
        'source_name': d['source']['name']['fr'],
        'image_captions': {img['file']: img['caption']['fr'] for img in d.get('images', [])},
    }}
with open(tj_path, 'w', encoding='utf-8') as f:
    json.dump(tj, f, ensure_ascii=False, indent=2)

print('integrated:', len(NEW_SLUGS), 'articles')
