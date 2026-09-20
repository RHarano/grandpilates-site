/* ASAGAYA GRAND PILATES — interactions */
(function () {
  'use strict';

  // JSが動く環境でだけアニメーションの初期状態を適用する
  // （JSが動かない場合は本文がそのまま表示される）
  document.documentElement.classList.add('js');

  var header = document.getElementById('header');
  var hamburger = document.getElementById('hamburger');
  var nav = document.getElementById('nav');
  var body = document.body;

  /* ---- Header background on scroll ---- */
  function onScroll() {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu toggle ---- */
  function closeMenu() {
    body.classList.remove('menu-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'メニューを開く');
  }
  hamburger.addEventListener('click', function () {
    var open = body.classList.toggle('menu-open');
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  });
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
  /* 背景（オーバーレイ）タップでドロワーを閉じる */
  document.addEventListener('click', function (e) {
    if (!body.classList.contains('menu-open')) return;
    if (nav.contains(e.target) || hamburger.contains(e.target)) return;
    closeMenu();
  });

  /* ---- Header booking dropdown ---- */
  var navBook = document.getElementById('navBook');
  if (navBook) {
    var bookBtn = navBook.querySelector('button');
    bookBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = navBook.classList.toggle('open');
      bookBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function () {
      navBook.classList.remove('open');
      bookBtn.setAttribute('aria-expanded', 'false');
    });
  }

  /* ---- Scroll reveal ---- */
  // threshold を 0 にする。0.14 のままだと、画面より背の高い要素は
  // 可視割合が (画面高 ÷ 要素高) を超えられず、永久に表示されないことがある。
  // rootMargin で下端を削るのも、最下部の要素が出ないのでやめる。
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  var show = function (el) { el.classList.add('in'); };

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { show(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px 60px 0px' });

    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 0.05) + 's';
      io.observe(el);
    });

    // 保険：一気にスクロールされると Observer が取りこぼすことがあるため、
    // 画面内に入っている要素はスクロールのたびに表示させる。
    var pending = reveals.slice();
    var ticking = false;
    var sweep = function () {
      ticking = false;
      for (var i = pending.length - 1; i >= 0; i--) {
        var el = pending[i];
        if (el.classList.contains('in')) { pending.splice(i, 1); continue; }
        if (el.getBoundingClientRect().top < window.innerHeight + 60) {
          show(el); io.unobserve(el); pending.splice(i, 1);
        }
      }
      if (!pending.length) window.removeEventListener('scroll', onScroll);
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(sweep); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    sweep();   // 初期表示ぶんは待たずに出す
  } else {
    reveals.forEach(show);
  }

  /* ---- Sticky booking bar (appears on scroll, dismissible) ---- */
  (function () {
    var KEY = 'agp_bookbar_closed';
    try { if (sessionStorage.getItem(KEY) === '1') return; } catch (e) {}

    var bar = document.createElement('div');
    bar.className = 'book-bar';
    bar.setAttribute('role', 'complementary');
    bar.setAttribute('aria-label', '体験レッスン予約');
    bar.innerHTML =
      '<button class="bb-close" type="button" aria-label="このバーを閉じる">&times;</button>' +
      '<p class="bb-copy"><span class="bb-lead">初回体験 受付中</span> <span class="bb-price"><b>グループ ¥1,100</b> ／ <b>プライベート ¥3,300</b></span></p>' +
      '<div class="bb-actions">' +
      '<a class="bb-btn bb-gold" href="https://grandlohas.hacomono.jp/reserve/schedule/6/58" target="_blank" rel="noopener">グループ体験を予約</a>' +
      '<a class="bb-btn bb-line" href="https://grandlohas.hacomono.jp/reserve/schedule/6/59" target="_blank" rel="noopener">プライベート体験を予約</a>' +
      '</div>';
    document.body.appendChild(bar);
    document.body.classList.add('has-bookbar');

    // バーの高さは文言や画面幅で変わるため、実測して本文の下余白に反映する。
    // 決め打ちにすると、バーが2行になったときフッターに重なる。
    var syncHeight = function () {
      document.documentElement.style.setProperty('--bookbar-h', bar.offsetHeight + 'px');
    };
    syncHeight();
    window.addEventListener('resize', syncHeight, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(syncHeight).observe(bar);

    bar.querySelector('.bb-close').addEventListener('click', function () {
      bar.classList.remove('show');
      document.body.classList.remove('has-bookbar');   // 閉じたら余白も戻す
      document.documentElement.style.removeProperty('--bookbar-h');
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    });

    // ヒーロー/サブヒーローを過ぎたら表示
    var trigger = document.querySelector('.hero, .subhero');
    var threshold = trigger ? Math.max(trigger.offsetHeight - 120, 300) : 500;
    function toggleBar() {
      if (window.scrollY > threshold) bar.classList.add('show');
      else bar.classList.remove('show');
    }
    window.addEventListener('scroll', toggleBar, { passive: true });
    toggleBar();
  })();

  /* ---- GA4: reservation & tel click tracking ---- */
  function gaSend(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    } else {
      (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, params));
    }
  }

  // どのボタン位置からの予約かを判定
  function ctaLocation(el) {
    if (el.closest('.book-bar')) return 'sticky_bar';
    if (el.closest('.contact-card')) return 'contact_card';
    if (el.closest('#navBook')) return 'header_dropdown';
    if (el.closest('.hero')) return 'hero';
    if (el.closest('.campaign')) return 'campaign';
    if (el.closest('.price')) return 'pricing';
    if (el.closest('.flow')) return 'flow';
    if (el.closest('.cta-band')) return 'cta_band';
    if (el.closest('.site-footer')) return 'footer';
    var sec = el.closest('section');
    return (sec && sec.id) ? sec.id : 'other';
  }

  document.querySelectorAll('a[href*="hacomono"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var href = a.getAttribute('href') || '';
      var lesson = /\/59(\b|$|\/|\?)/.test(href) ? 'private'
                 : /\/58(\b|$|\/|\?)/.test(href) ? 'group'
                 : 'unknown';
      gaSend('reserve_click', {
        lesson_type: lesson,
        cta_location: ctaLocation(a),          // 既存パラメータ（変更なし）
        page_path: location.pathname,
        link_url: href,
        // ↓ 2026-09-12 追加。既存の値は残したまま、判別軸だけ増やしている
        page_name: pageName,
        button_position: buttonPosition(a),
        button_text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        destination_url: href,
        transport_type: 'beacon'
      });
    });
  });

  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      gaSend('tel_click', {
        cta_location: ctaLocation(a),
        page_path: location.pathname,
        page_name: pageName,
        button_position: buttonPosition(a),
        phone_number: (a.getAttribute('href') || '').replace('tel:', ''),
        transport_type: 'beacon'
      });
    });
  });

  // メール問い合わせも予約・電話と同じ重みの導線なので、必ず数える。
  // これが無いと問い合わせの総数が分からない。
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      gaSend('mail_click', {
        cta_location: ctaLocation(a),
        page_path: location.pathname,
        page_name: pageName,
        button_position: buttonPosition(a),
        destination_email: (a.getAttribute('href') || '').replace('mailto:', '').split('?')[0],
        transport_type: 'beacon'
      });
    });
  });

  // 系列施設（東京岩盤浴／LOHAS LOHAS）への送客も数える。
  document.querySelectorAll('a[href*="tokyoganbanyoku.com"], a[href*="lohas-lohas-studio.com"]').forEach(function (a) {
    a.addEventListener('click', function () {
      gaSend('group_site_click', {
        cta_location: ctaLocation(a),
        page_path: location.pathname,
        target_site: a.getAttribute('href') || '',
        transport_type: 'beacon'
      });
    });
  });


  /* ==================================================================
     計測の追加（2026-09-12）
     既存の reserve_click / tel_click / mail_click / group_site_click は
     名前もパラメータも変更していない。過去データと繋がるようにするため。
     ここでは不足していた行動だけを、別名のイベントで足している。
  ================================================================== */

  // ページ名。イベントの絞り込みに使う
  var pageName = (function () {
    var p = location.pathname.replace(/\/index\.html$/, '/');
    var map = { '/': 'home', '/group/': 'group', '/private/': 'private', '/price/': 'price',
                '/trial/': 'trial', '/campaign/': 'campaign', '/about/': 'about',
                '/pilates-yoga/': 'pilates_yoga', '/faq/': 'faq', '/contact/': 'contact',
                '/privacy/': 'privacy' };
    return map[p] || p.replace(/\//g, '') || 'other';
  })();

  var base = function (extra) {
    var o = { page_name: pageName, page_path: location.pathname };
    for (var k in extra) o[k] = extra[k];
    return o;
  };

  /* ---- スクロール到達（50% / 90%）。同じ深さで二重に送らない ---- */
  (function () {
    var fired = {};
    var check = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      var pct = (window.scrollY / h) * 100;
      [50, 90].forEach(function (d) {
        if (pct >= d && !fired[d]) { fired[d] = true; gaSend('scroll_depth', base({ percent: d })); }
      });
      if (fired[50] && fired[90]) window.removeEventListener('scroll', onScroll);
    };
    var ticking = false;
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; check(); }); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    check();
  })();

  /* ---- 重要セクションへの到達。1回だけ送る ---- */
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var targets = [
      ['.price .tbl-wrap, #price', 'pricing_table'],
      ['#trial, .cta-band', 'trial_offer'],
      ['#cp-faq, .cp-grid', 'campaign_detail']
    ];
    var sent = {};
    targets.forEach(function (t) {
      var el = document.querySelector(t[0]);
      if (!el || sent[t[1]]) return;
      var seen = false;
      new IntersectionObserver(function (es, ob) {
        es.forEach(function (e) {
          if (e.isIntersecting && !seen && !sent[t[1]]) {
            seen = true; sent[t[1]] = true;
            gaSend('view_section', base({ section_name: t[1] }));
            ob.disconnect();
          }
        });
      }, { threshold: 0.3 }).observe(el);
    });
  })();

  /* ---- FAQの開閉。どの不安が多いかを知る ---- */
  document.querySelectorAll('details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      var q = d.querySelector('summary');
      gaSend('faq_open', base({ question: (q ? q.textContent : '').replace(/\s+/g, ' ').trim().slice(0, 80) }));
    });
  });

  /* ---- 予約ボタン。イベント名は1つに統一し、違いはパラメータで分ける ---- */
  var buttonPosition = function (el) {
    if (el.closest('.book-bar')) return 'fixed_bar';
    if (el.closest('.site-header')) return 'header';
    if (el.closest('.hero, .subhero')) return 'first_view';
    if (el.closest('.site-footer')) return 'footer';
    return 'content';
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var text = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);

    // 予約・電話・メールは既存イベント（reserve_click / tel_click / mail_click）が
    // すでに発火しているため、ここでは重複して送らない。
    // 足りないパラメータは、上の既存ハンドラ側に追加している。
    if (href.indexOf('google.com/maps') > -1 || href.indexOf('maps.app.goo.gl') > -1) {
      gaSend('click_map', base({ button_position: buttonPosition(a), transport_type: 'beacon' }));
    } else if (href.indexOf('instagram.com') > -1) {
      gaSend('click_instagram', base({ button_position: buttonPosition(a), transport_type: 'beacon' }));
    } else if (/^\/(trial|price|campaign|group|private|faq)\/$/.test(href)) {
      gaSend('click_internal_guide', base({ destination: href.replace(/\//g, ''), button_text: text }));
    }
  });

  /* ---- FAQ: only one open at a time ---- */
  var faqItems = document.querySelectorAll('.faq-list details');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });
})();
