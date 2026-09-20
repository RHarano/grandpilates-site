#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ASAGAYA GRAND PILATES — コラム記事の生成

articles/ に Markdown を置いて実行するだけ。
ヘッダー・フッター・予約ボタン・構造化データ・パンくずは自動で付く。

    python3 build_blog.py

生成されるもの
    blog/<スラッグ>/index.html   記事ページ
    blog/index.html              記事一覧
    sitemap.xml                  記事URLを追記
"""
import os, re, html, glob, json, datetime, hashlib

BASE='https://grandpilates.site'
# CSS/JSの中身からバージョンを作る。
# 固定文字列だと、ファイルを直してもブラウザが古いものを使い続ける
# （Cache-Control が immutable のため）。
def _ver(path):
    return hashlib.md5(open(path,'rb').read()).hexdigest()[:8]
CSS_VER=_ver('css/style.css')
JS_VER=_ver('js/main.js')
GA='G-MD1QTQQX66'
SHARED='G-2FK4EYF80H'
GROUP='https://grandlohas.hacomono.jp/reserve/schedule/6/58'
PRIVATE='https://grandlohas.hacomono.jp/reserve/schedule/6/59'

def head(path,title,desc,image,lds):
    blocks='\n'.join('<script type="application/ld+json">\n%s\n</script>'
                     % json.dumps(d,ensure_ascii=False,indent=2) for d in lds)
    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script async src="https://www.googletagmanager.com/gtag/js?id={GA}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', '{GA}');
  gtag('config', '{SHARED}');
</script>
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}" />
<link rel="canonical" href="{BASE}{path}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="ASAGAYA GRAND PILATES" />
<meta property="og:locale" content="ja_JP" />
<meta property="og:title" content="{html.escape(title)}" />
<meta property="og:description" content="{html.escape(desc)}" />
<meta property="og:url" content="{BASE}{path}" />
<meta property="og:image" content="{BASE}/images/{image}.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/images/logo.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@500;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/style.css?v={CSS_VER}" />
{blocks}
</head>
<body>
'''

HEADER='''<!-- ===== Header ===== -->
<header class="site-header" id="header">
  <div class="header-inner">
    <a href="/" class="brand" aria-label="ASAGAYA GRAND PILATES ホーム">
      <img src="/images/logo.png" alt="" class="brand-mark" width="800" height="800" />
      <span class="brand-text">
        <span class="brand-en">GRAND&nbsp;PILATES</span>
        <span class="brand-ja">阿佐ヶ谷 マシンピラティス専門スタジオ</span>
      </span>
    </a>
    <nav class="nav" id="nav" aria-label="メインナビゲーション">
      <a href="/group/"><span class="n-en">GROUP</span><span class="n-jp">グループ</span></a>
      <a href="/private/"><span class="n-en">PRIVATE</span><span class="n-jp">プライベート</span></a>
      <a href="/price/"><span class="n-en">PRICE</span><span class="n-jp">料金プラン</span></a>
      <a href="/faq/"><span class="n-en">FAQ</span><span class="n-jp">よくある質問</span></a>
      <a href="/blog/" class="is-current" aria-current="page"><span class="n-en">COLUMN</span><span class="n-jp">コラム</span></a>
      <a href="/contact/"><span class="n-en">CONTACT</span><span class="n-jp">お問い合わせ</span></a>
      <div class="nav-book" id="navBook">
        <button type="button" class="nav-cta" aria-haspopup="true" aria-expanded="false">体験予約<span class="caret">▾</span></button>
        <div class="nav-drop">
          <a href="''' + GROUP + '''" target="_blank" rel="noopener" class="nd-group">グループ体験<small>初回 ¥1,100</small></a>
          <a href="''' + PRIVATE + '''" target="_blank" rel="noopener" class="nd-private">プライベート体験<small>初回 ¥3,300</small></a>
          <a href="/trial/" class="nd-about">体験について詳しく<small>流れ・服装・持ち物</small></a>
        </div>
      </div>
      <a href="tel:0333118211" class="nav-tel">☎ 03-3311-8211</a>
    </nav>
    <button class="hamburger" id="hamburger" aria-label="メニューを開く" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<main>
'''

CTA=f'''
  <section class="cta-band" id="reserve">
    <div class="cta-bg" style="background-image:url('/images/agp-studio-mat.jpg');background-image:image-set(url('/images/agp-studio-mat.webp') type('image/webp'), url('/images/agp-studio-mat.jpg') type('image/jpeg'))"></div>
    <div class="cta-overlay"></div>
    <div class="wrap cta-inner reveal">
      <span class="sec-label light">START</span>
      <h2>まずは体験レッスンから。</h2>
      <p>読むより、一度動いてみるほうが早く分かります。</p>
      <div class="cta-actions book-pair">
        <a href="{GROUP}" target="_blank" rel="noopener" class="book-btn book-gold">
          <span class="book-info">初回 ¥1,100・60分</span>
          <span class="book-label">グループ体験を予約する<span class="arrow">→</span></span>
        </a>
        <a href="{PRIVATE}" target="_blank" rel="noopener" class="book-btn book-line">
          <span class="book-info">初回 ¥3,300・マンツーマン</span>
          <span class="book-label">プライベート体験を予約する<span class="arrow">→</span></span>
        </a>
      </div>
      <p class="cta-note">※ ボタンを押すと、予約サイト（hacomono）へ移動します。<br />お電話でのご予約も承ります　<a href="tel:0333118211" class="cta-tel">☎ 03-3311-8211</a></p>
    </div>
  </section>
'''

FOOTER=f'''
<footer class="site-footer">
  <div class="wrap footer-top">
    <div class="f-brand">
      <a href="/" class="f-logo">
        <img src="/images/logo.png" alt="" width="800" height="800" />
        <span class="f-logo-text"><b>ASAGAYA GRAND PILATES</b><small>阿佐ヶ谷 マシンピラティス専門スタジオ</small></span>
      </a>
      <address class="f-address">
        〒166-0004 東京都杉並区阿佐谷南1-36-4 三幸ビル 2F<br />
        JR中央線・総武線「阿佐ヶ谷駅」より徒歩約5分
      </address>
      <p class="f-hours">平日 9:30 – 21:30／土日 8:00 – 17:00<br />定休日：月曜</p>
    </div>
    <nav class="f-col" aria-label="レッスン">
      <p class="f-col-title"><span class="en">LESSON</span>レッスン</p>
      <a href="/group/">グループレッスン</a>
      <a href="/private/">プライベートレッスン</a>
      <a href="/about/">マシンピラティスとは</a>
      <a href="/pilates-yoga/">ピラティスとヨガの違い</a>
    </nav>
    <nav class="f-col" aria-label="ご案内">
      <p class="f-col-title"><span class="en">GUIDE</span>ご案内</p>
      <a href="/price/">料金プラン</a>
      <a href="/campaign/">キャンペーン</a>
      <a href="/trial/">体験レッスン</a>
      <a href="/blog/">コラム</a>
      <a href="/faq/">よくあるご質問</a>
      <a href="/#access">アクセス</a>
      <a href="/contact/">お問い合わせ</a>
      <a href="/privacy/">プライバシーポリシー</a>
    </nav>
    <div class="f-col f-reserve">
      <p class="f-col-title"><span class="en">RESERVE</span>体験予約</p>
      <a href="{GROUP}" target="_blank" rel="noopener" class="f-book f-book-gold"><span class="fb-label">グループ体験</span><span class="fb-price">初回 ¥1,100</span></a>
      <a href="{PRIVATE}" target="_blank" rel="noopener" class="f-book"><span class="fb-label">プライベート体験</span><span class="fb-price">初回 ¥3,300</span></a>
    </div>
  </div>
  <div class="wrap footer-bottom"><p class="copyright">© ASAGAYA GRAND PILATES. All rights reserved.</p></div>
</footer>
<script src="/js/main.js?v={JS_VER}"></script>
</body>
</html>
'''

def md(text):
    """必要な記法だけを扱う簡易変換。"""
    out=[]; buf=[]; mode=None
    def flush():
        nonlocal buf, mode
        if mode=='tbl':
            rows=[r for r in buf if not re.match(r'^\|[\s:|-]+\|$', r)]
            cells=[[c.strip() for c in r.strip('|').split('|')] for r in rows]
            h='<tr>'+''.join(f'<th>{inline(c)}</th>' for c in cells[0])+'</tr>'
            b=''.join('<tr>'+''.join(f'<td>{inline(c)}</td>' for c in r)+'</tr>' for r in cells[1:])
            out.append(f'<div class="tbl-wrap"><table>{h}{b}</table></div>')
        elif mode=='ul': out.append('<ul class="reco">'+''.join(f'<li>{x}</li>' for x in buf)+'</ul>')
        elif mode=='p' and buf: out.append('<p>'+'<br />'.join(buf)+'</p>')
        buf=[]; mode=None
    for ln in text.split('\n'):
        l=ln.rstrip()
        if not l.strip(): flush(); continue
        if l.startswith('|'):
            if mode!='tbl': flush(); mode='tbl'
            buf.append(l)
        elif l.startswith('### '): flush(); out.append(f'<h3>{inline(l[4:])}</h3>')
        elif l.startswith('## '): flush(); out.append(f'<h2 class="tbl-head">{inline(l[3:])}</h2>')
        elif l.startswith('> '): flush(); out.append(f'<p class="tbl-note">{inline(l[2:])}</p>')
        elif l.startswith('- '):
            if mode!='ul': flush(); mode='ul'
            buf.append(inline(l[2:]))
        else:
            if mode!='p': flush(); mode='p'
            buf.append(inline(l))
    flush()
    return '\n      '.join(out)

def inline(t):
    t=html.escape(t)
    t=re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t=re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', t)
    return t

def parse(p):
    raw=open(p,encoding='utf-8').read()
    m=re.match(r'^---\n(.*?)\n---\n(.*)$', raw, re.S)
    meta=dict(re.findall(r'^(\w+):\s*(.+)$', m.group(1), re.M))
    return meta, m.group(2).strip()

def thumb(name):
    """一覧カード用。<name>-thumb があればそれを使う（960x600・16:10）。"""
    return name+'-thumb' if os.path.exists(f'images/{name}-thumb.jpg') else name

def build():
    posts=[]
    for f in sorted(glob.glob('articles/*.md')):
        if os.path.basename(f).startswith('_') or os.path.basename(f)=='README.md': continue
        meta, body = parse(f)
        slug=os.path.splitext(os.path.basename(f))[0]
        path=f'/blog/{slug}/'
        img=meta.get('hero','agp-studio-reformers')
        lds=[
         {"@context":"https://schema.org","@type":"Article","headline":meta['title'],
          "description":meta['desc'],"datePublished":meta['date'],
          "dateModified":meta.get('updated',meta['date']),
          "mainEntityOfPage":{"@type":"WebPage","@id":BASE+path},
          "image":f"{BASE}/images/{img}.jpg",
          "author":{"@type":"Organization","name":"ASAGAYA GRAND PILATES","url":BASE+"/"},
          "publisher":{"@id":BASE+"/#organization"}},
         {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
          {"@type":"ListItem","position":1,"name":"ホーム","item":BASE+"/"},
          {"@type":"ListItem","position":2,"name":"コラム","item":BASE+"/blog/"},
          {"@type":"ListItem","position":3,"name":meta['title'],"item":BASE+path}]},
        ]
        h=(head(path, meta['title']+'｜ASAGAYA GRAND PILATES', meta['desc'], img, lds)
           + HEADER
           + f'''
  <section class="subhero">
    <div class="subhero-bg" style="background-image:url('/images/{img}.jpg');background-image:image-set(url('/images/{img}.webp') type('image/webp'), url('/images/{img}.jpg') type('image/jpeg'))"></div>
    <div class="subhero-overlay"></div>
    <div class="subhero-inner">
      <p class="en" aria-hidden="true">COLUMN</p>
      <h1 class="ja">{html.escape(meta['title'])}</h1>
    </div>
    <p class="breadcrumb"><a href="/">ホーム</a><span class="sep">／</span><a href="/blog/">コラム</a><span class="sep">／</span>{html.escape(meta['title'])}</p>
  </section>

  <section class="section">
    <div class="wrap wrap-narrow article-body">
      <p class="post-date"><time datetime="{meta['date']}">{meta['date'].replace('-','.')}</time> 公開{'／' + meta['updated'].replace('-','.') + ' 更新' if meta.get('updated') else ''}</p>
      {md(body)}
    </div>
  </section>
'''
           + CTA + '\n</main>\n' + FOOTER)
        os.makedirs(f'blog/{slug}', exist_ok=True)
        open(f'blog/{slug}/index.html','w',encoding='utf-8').write(h)
        posts.append((meta['date'], slug, meta['title'], meta['desc'], img))
        print(f'  記事: /blog/{slug}/  {meta["title"]}')

    posts.sort(reverse=True)
    cards='\n'.join(f'''        <a href="/blog/{s}/" class="post-card">
          <span class="pc-thumb">
            <picture><source srcset="/images/{thumb(i)}.webp" type="image/webp"><img src="/images/{thumb(i)}.jpg" alt="" loading="lazy" decoding="async" width="960" height="600" /></picture>
          </span>
          <span class="pc-body">
            <span class="pc-date">{d.replace('-','.')}</span>
            <span class="pc-title">{html.escape(t)}</span>
            <span class="pc-desc">{html.escape(ds[:62])}…</span>
            <span class="pc-go">続きを読む</span>
          </span>
        </a>''' for d,s,t,ds,i in posts)
    lds=[{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
        {"@type":"ListItem","position":1,"name":"ホーム","item":BASE+"/"},
        {"@type":"ListItem","position":2,"name":"コラム","item":BASE+"/blog/"}]}]
    idx=(head('/blog/','コラム｜阿佐ヶ谷のマシンピラティス ASAGAYA GRAND PILATES',
              'マシンピラティスの特徴や続け方、体験前の疑問にお答えするコラムです。阿佐ヶ谷のマシンピラティス専門スタジオがお届けします。',
              'agp-studio-reformers', lds)
         + HEADER
         + '''
  <section class="subhero">
    <div class="subhero-bg" style="background-image:url('/images/agp-studio-reformers.jpg');background-image:image-set(url('/images/agp-studio-reformers.webp') type('image/webp'), url('/images/agp-studio-reformers.jpg') type('image/jpeg'))"></div>
    <div class="subhero-overlay"></div>
    <div class="subhero-inner">
      <p class="en" aria-hidden="true">COLUMN</p>
      <h1 class="ja">コラム｜阿佐ヶ谷のマシンピラティス</h1>
    </div>
    <p class="breadcrumb"><a href="/">ホーム</a><span class="sep">／</span>コラム</p>
  </section>

  <section class="section">
    <div class="wrap">
      <p class="detail-intro reveal">
        マシンピラティスの特徴や続け方、体験の前に気になることを、<br />
        阿佐ヶ谷のスタジオからお伝えします。
      </p>
      <div class="post-grid">
''' + cards + '''
      </div>
    </div>
  </section>
''' + CTA + '\n</main>\n' + FOOTER)
    open('blog/index.html','w',encoding='utf-8').write(idx)
    print(f'  一覧: /blog/  （{len(posts)}記事）')

    # sitemap に追記
    sm=open('sitemap.xml',encoding='utf-8').read()
    sm=re.sub(r'\s*<url>\s*<loc>[^<]*/blog[^<]*</loc>.*?</url>','',sm,flags=re.S)
    add='  <url>\n    <loc>%s/blog/</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n' % (BASE, posts[0][0] if posts else datetime.date.today())
    for d,s,t,ds,i in posts:
        add+='  <url>\n    <loc>%s/blog/%s/</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n' % (BASE,s,d)
    sm=sm.replace('</urlset>', add+'</urlset>')
    open('sitemap.xml','w',encoding='utf-8').write(sm)
    print(f'  sitemap: {sm.count("<loc>")}URL')

if __name__=='__main__':
    build()
