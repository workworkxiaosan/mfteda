#!/usr/bin/env python3
"""掃描 zh-TW 是否混入簡體字（s2t 有變化）及 zh-CN 是否混入繁體字（t2s 有變化）。"""
import json, re, sys
from opencc import OpenCC

s2t = OpenCC('s2t')
t2s = OpenCC('t2s')

# 白名單：這些 s2t/t2s 差異是台灣標準偏好或異體字，所涉字符在港澳繁體中均為正字，
# 不代表混入另一種字體（真正的簡體字如 发/门 不在其中）。
# 秘/峰 為港澳正字（祕/峯為異體）；范/杰 為人名正字（如「范凱杰」為其本人公佈寫法，范作姓氏繁體仍作范）。
DIFF_WHITELIST = {('了', '瞭'), ('台', '臺'), ('群', '羣'), ('床', '牀'),
                  ('秘', '祕'), ('峰', '峯'), ('范', '範'), ('杰', '傑')}
# 語言切換器固定顯示對方語言的標籤（如繁體頁出現「简体中文」屬正常）
TEXT_WHITELIST = {'简体中文', '繁體中文', 'English', 'Português'}

hits = []

def check(text, lang, where):
    if not isinstance(text, str) or text.strip() in TEXT_WHITELIST:
        return
    conv = s2t.convert(text) if lang == 'zh-TW' else t2s.convert(text)
    if conv != text:
        diffs = [f'{a}->{b}' for a, b in zip(text, conv) if a != b]
        real = [d for d in diffs if tuple(d.split('->')) not in DIFF_WHITELIST]
        if not real:
            return
        hits.append((where, lang, text, conv, ' '.join(diffs)))

def walk(obj, path, where, lang=None):
    if isinstance(obj, dict):
        for k, v in obj.items():
            # 語言代碼作為鍵：向下傳遞語言上下文
            sub_lang = k if k in ('zh-TW', 'zh-CN') else lang
            walk(v, f'{path}.{k}', where, sub_lang)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            walk(v, f'{path}[{i}]', where, lang)
    elif isinstance(obj, str):
        if lang:
            check(obj, lang, f'{where}:{path}')

# 1) JSON 文件
for fname in ['.scrape/i18n.json', 'content.json']:
    data = json.load(open(fname, encoding='utf-8'))
    walk(data, '', fname)

# 2) .py 文件中 dict 字面量的 zh-TW/zh-CN 字符串
for fname in ['make_content.py', 'build.py']:
    src = open(fname, encoding='utf-8').read()
    for m in re.finditer(r"""['"](zh-TW|zh-CN)['"]\s*:\s*(['"])((?:\\.|(?!\2).)*)\2""", src):
        lang, _, text = m.group(1), m.group(2), m.group(3)
        line = src[:m.start()].count('\n') + 1
        check(text, lang, f'{fname}:{line}')

# 3) dist/ 生成頁面：根目錄 *.html 為 zh-TW，zh-CN/*.html 為 zh-CN
import glob, os
for pattern, lang in [('dist/*.html', 'zh-TW'), ('dist/insights/*.html', 'zh-TW'), ('dist/news/*.html', 'zh-TW'),
                      ('dist/zh-CN/*.html', 'zh-CN'), ('dist/zh-CN/insights/*.html', 'zh-CN'), ('dist/zh-CN/news/*.html', 'zh-CN')]:
    for f in sorted(glob.glob(pattern)):
        src = open(f, encoding='utf-8').read()
        # 去掉語言切換器標籤再掃描
        for w in TEXT_WHITELIST:
            src = src.replace(w, '')
        check(src, lang, f)

if not hits:
    print('CLEAN: 無命中')
else:
    for where, lang, orig, conv, diffs in hits:
        print(f'[{lang}] {where}')
        print(f'  原: {orig}')
        print(f'  轉: {conv}')
        print(f'  差: {diffs}')
        print()
    print(f'TOTAL: {len(hits)} hits')
