#!/usr/bin/env python3
"""Assemble content.json: i18n.json + insights articles + homepage focus cards."""
import json

i18n = json.load(open('.scrape/i18n.json', encoding='utf-8'))

# 研究洞察 6 articles (titles/categories/excerpts per language, dates fixed)
insights = [
    {"date": "2026-03-15", "category": {"zh-TW": "數字經濟", "zh-CN": "数字经济", "en": "Digital Economy", "pt": "Economia Digital"},
     "title": {"zh-TW": "澳門數字經濟發展趨勢", "zh-CN": "澳门数字经济发展趋势", "en": "Digital Economy Trends in Macao", "pt": "Tendências da Economia Digital em Macau"},
     "excerpt": {"zh-TW": "分析澳門特區數字化轉型的機遇與挑戰", "zh-CN": "分析澳门特区数字化转型的机遇与挑战", "en": "Analysis of digital transformation opportunities and challenges in Macao SAR", "pt": "Análise de oportunidades e desafios da transformação digital na RAE de Macau"}},
    {"date": "2026-03-10", "category": {"zh-TW": "區域合作", "zh-CN": "区域合作", "en": "Regional Cooperation", "pt": "Cooperação Regional"},
     "title": {"zh-TW": "大灣區融合發展策略", "zh-CN": "大湾区融合发展策略", "en": "Greater Bay Area Integration Strategies", "pt": "Estratégias de Integração da Grande Baía"},
     "excerpt": {"zh-TW": "提升澳門在大灣區角色的政策建議", "zh-CN": "提升澳门在大湾区角色的政策建议", "en": "Policy recommendations for enhancing Macao's role in the Greater Bay Area", "pt": "Recomendações políticas para fortalecer o papel de Macau na Grande Baía"}},
    {"date": "2026-03-05", "category": {"zh-TW": "可持續金融", "zh-CN": "可持续金融", "en": "Sustainable Finance", "pt": "Finanças Sustentáveis"},
     "title": {"zh-TW": "ESG投資機遇", "zh-CN": "ESG投资机遇", "en": "ESG Investment Opportunities", "pt": "Oportunidades de Investimento ESG"},
     "excerpt": {"zh-TW": "探索可持續投資趨勢與綠色金融倡議", "zh-CN": "探索可持续投资趋势与绿色金融倡议", "en": "Exploring sustainable investment trends and green finance initiatives", "pt": "Explorando tendências de investimento sustentável e iniciativas de finanças verdes"}},
    {"date": "2026-02-28", "category": {"zh-TW": "現代金融", "zh-CN": "现代金融", "en": "Modern Finance", "pt": "Finanças Modernas"},
     "title": {"zh-TW": "人民幣國際化進展", "zh-CN": "人民币国际化进展", "en": "RMB Internationalization Progress", "pt": "Progresso da Internacionalização do RMB"},
     "excerpt": {"zh-TW": "人民幣跨境使用與金融合作的最新進展", "zh-CN": "人民币跨境使用与金融合作的最新进展", "en": "Latest developments in cross-border RMB usage and financial cooperation", "pt": "Últimos desenvolvimentos no uso transfronteiriço do RMB e cooperação financeira"}},
    {"date": "2026-02-20", "category": {"zh-TW": "創新", "zh-CN": "创新", "en": "Innovation", "pt": "Inovação"},
     "title": {"zh-TW": "文化與科技創新", "zh-CN": "文化与科技创新", "en": "Culture and Technology Innovation", "pt": "Inovação em Cultura e Tecnologia"},
     "excerpt": {"zh-TW": "科技如何改變澳門文化產業", "zh-CN": "科技如何改变澳门文化产业", "en": "How technology is transforming Macao's cultural industries", "pt": "Como a tecnologia está transformando as indústrias culturais de Macau"}},
    {"date": "2026-02-15", "category": {"zh-TW": "政策研究", "zh-CN": "政策研究", "en": "Policy Research", "pt": "Pesquisa Política"},
     "title": {"zh-TW": "自由貿易港監管最佳實踐", "zh-CN": "自由贸易港监管最佳实践", "en": "Free Trade Port Regulation Best Practices", "pt": "Melhores Práticas de Regulação de Porto de Livre Comércio"},
     "excerpt": {"zh-TW": "海關監管框架的國際比較", "zh-CN": "海关监管框架的国际比较", "en": "International comparison of customs regulation frameworks", "pt": "Comparação internacional de estruturas de regulação aduaneira"}},
]

# 首頁三大重點領域卡片
focus_cards = [
    {"icon": "trending", "title": {"zh-TW": "現代金融", "zh-CN": "现代金融", "en": "Modern Finance", "pt": "Finanças Modernas"},
     "description": {"zh-TW": "推動金融科技創新與跨境金融合作", "zh-CN": "推动金融科技创新与跨境金融合作", "en": "Driving fintech innovation and cross-border financial cooperation", "pt": "Impulsionando inovação fintech e cooperação financeira transfronteiriça"}},
    {"icon": "globe", "title": {"zh-TW": "數字經濟", "zh-CN": "数字经济", "en": "Digital Economy", "pt": "Economia Digital"},
     "description": {"zh-TW": "探索人工智能、電子商務與數字化轉型", "zh-CN": "探索人工智能、电子商务与数字化转型", "en": "Exploring AI, e-commerce, and digital transformation", "pt": "Explorando IA, comércio eletrónico e transformação digital"}},
    {"icon": "users", "title": {"zh-TW": "大灣區合作", "zh-CN": "大湾区合作", "en": "Greater Bay Area Cooperation", "pt": "Cooperação da Grande Baía"},
     "description": {"zh-TW": "促進區域融合與跨境合作", "zh-CN": "促进区域融合与跨境合作", "en": "Promoting regional integration and cross-border cooperation", "pt": "Promovendo integração regional e cooperação transfronteiriça"}},
]

# 出版物封面圖對應
book_covers = {"university": "book-university.webp", "community": "book-community.webp",
               "youth": "book-youth.webp", "supplement": "book-supplement.webp"}

# 語言切換器顯示名稱
languages = [
    {"code": "zh-TW", "label": "繁體中文", "flag": "🇲🇴"},
    {"code": "zh-CN", "label": "简体中文", "flag": "🇨🇳"},
    {"code": "en", "label": "English", "flag": "🇬🇧"},
    {"code": "pt", "label": "Português", "flag": "🇵🇹"},
]

content = {
    "languages": languages,
    "default_lang": "zh-TW",
    "site_name": "澳門財經科技與教育發展學會",
    "site_name_en": "Macao Financial Technology and Education Development Association",
    "site_url": "https://mfteda.org",
    "email": "mfteda2020@163.com",
    "social": {"facebook": "#", "linkedin": "#", "twitter": "#"},
    "partners_href": {
        "partner1": "https://www.dsedt.gov.mo",
        "partner2": "https://www.ipim.gov.mo",
        "partner3": "http://www.iolaw.cssn.cn",
        "partner4": "https://www.mpu.edu.mo",
        "partner5": "https://www.usj.edu.mo",
        "partner6": "https://www.jisu.edu.cn",
        "partner7": "#",
        "partner8": "#",
    },
    "i18n": i18n,
    "insights": insights,
    "focus_cards": focus_cards,
    "book_covers": book_covers,
}

with open('content.json', 'w', encoding='utf-8') as f:
    json.dump(content, f, ensure_ascii=False, indent=2)
print('content.json written:', len(json.dumps(content, ensure_ascii=False)), 'chars')
