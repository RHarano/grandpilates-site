/* ASAGAYA GRAND PILATES — interactions */
(function () {
  'use strict';

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
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el, i) {
      // subtle stagger for grouped siblings
      el.style.transitionDelay = (Math.min(i % 4, 3) * 0.08) + 's';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
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
      '<button class="bb-close" aria-label="閉じる">&times;</button>' +
      '<p class="bb-copy"><span class="bb-lead">初回体験 受付中</span> <span class="bb-price"><b>グループ ¥1,100</b> ／ <b>プライベート ¥3,300</b></span></p>' +
      '<div class="bb-actions">' +
      '<a class="bb-btn bb-gold" href="https://grandlohas.hacomono.jp/reserve/schedule/6/58" target="_blank" rel="noopener">グループ体験を予約</a>' +
      '<a class="bb-btn bb-line" href="https://grandlohas.hacomono.jp/reserve/schedule/6/59" target="_blank" rel="noopener">プライベート体験を予約</a>' +
      '</div>';
    document.body.appendChild(bar);

    bar.querySelector('.bb-close').addEventListener('click', function () {
      bar.classList.remove('show');
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
        cta_location: ctaLocation(a),
        page_path: location.pathname,
        link_url: href,
        transport_type: 'beacon'
      });
    });
  });

  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      gaSend('tel_click', {
        cta_location: ctaLocation(a),
        page_path: location.pathname,
        transport_type: 'beacon'
      });
    });
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
