/* =========================================================================
   De Bellis – motion engine
   One rAF-throttled scroll handler + one IntersectionObserver, per the
   handoff spec. Ported from design-reference/DeBellisSite.dc.html, adapted
   from the prototype's inner scroll container to window scrolling.

   Content is visible without JS: the hidden pre-reveal state is applied here
   on mount, never in the stylesheet.
   ========================================================================= */

(function () {
  'use strict';

  var EASE = 'cubic-bezier(.2,.7,.2,1)';
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  var root = document.documentElement;
  var header = document.getElementById('header');
  var bar = document.getElementById('bar');
  var hero = document.getElementById('hero');
  var steps = document.getElementById('steps');

  var parallax = [].slice.call(document.querySelectorAll('[data-k]'));
  var reveals = [].slice.call(document.querySelectorAll('[data-reveal]'));

  var mx = 0, my = 0;
  var raf = 0;
  var tiltEl = null;
  var io = null;

  function rm() { return mq.matches; }

  /* ----------------------------- Asset fallbacks -----------------------------
     logo.png / mark.png / tower.png are not in the repo yet (see README).
     If the logo fails to load, switch the page to its typographic fallbacks
     so nothing renders as a broken image.
     ------------------------------------------------------------------------ */
  function checkAssets() {
    var probe = document.querySelector('.header__logo');
    if (!probe) return;
    function missing() { document.body.classList.add('assets-missing'); }
    if (probe.complete && probe.naturalWidth === 0) missing();
    probe.addEventListener('error', missing);
  }

  /* ----------------------------- Particles -----------------------------
     18 drifting dots, deterministic positions (same hash as the prototype).
     ------------------------------------------------------------------ */
  function rnd(i) {
    var x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function buildParticles() {
    var host = document.getElementById('particles');
    if (!host || rm()) return;
    var frag = document.createDocumentFragment();
    for (var k = 0; k < 18; k++) {
      var s = 1.5 + rnd(k) * 2.5;
      var el = document.createElement('span');
      el.style.left = (8 + rnd(k + 9) * 84) + '%';
      el.style.bottom = (rnd(k + 3) * 40) + '%';
      el.style.width = s + 'px';
      el.style.height = s + 'px';
      el.style.setProperty('--dx', ((rnd(k + 5) - 0.5) * 80) + 'px');
      el.style.animationDuration = (7 + rnd(k + 1) * 5) + 's';
      el.style.animationDelay = (-rnd(k + 2) * 12) + 's';
      frag.appendChild(el);
    }
    host.appendChild(frag);
  }

  /* ----------------------------- Reveals ----------------------------- */

  function show(el, instant) {
    if (instant) el.style.transition = 'none';
    el.style.opacity = '';
    el.style.translate = '';
    el.style.scale = '';
    el.style.filter = '';
    el.dataset.done = '1';
  }

  function initReveals() {
    if (io) io.disconnect();

    if (rm()) {
      reveals.forEach(function (el) { show(el, true); });
      parallax.forEach(function (el) { el.style.translate = ''; });
      untilt();
      schedule();
      return;
    }

    reveals.forEach(function (el) {
      if (el.dataset.done) return;
      var t = el.dataset.reveal;
      var d = +el.dataset.delay || 0;
      el.style.transition =
        'opacity .9s ' + EASE + ' ' + d + 'ms, ' +
        'translate .9s ' + EASE + ' ' + d + 'ms, ' +
        'scale 1.2s cubic-bezier(.7,0,.2,1) ' + d + 'ms, ' +
        'filter .9s ' + EASE + ' ' + d + 'ms';

      if (t === 'x') {
        el.style.scale = '0 1';
      } else {
        el.style.opacity = '0';
        if (t === 'up') el.style.translate = '0 28px';
        if (t === 'blur') { el.style.filter = 'blur(10px)'; el.style.translate = '0 16px'; }
        if (t === 'node') el.style.scale = '.3';
      }
    });

    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        reveals.forEach(function (el) { if (!el.dataset.done) io.observe(el); });
      });
    });

    schedule();
  }

  /* ----------------------------- Scroll loop ----------------------------- */

  function schedule() {
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; update(); });
  }

  function update() {
    var reduced = rm();
    var st = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;
    var H = document.documentElement.scrollHeight;

    /* Trace spine progress */
    root.style.setProperty('--p', reduced ? '1' : Math.min(1, (st + vh * 0.6) / H).toFixed(4));
    root.style.setProperty('--mx', reduced ? '0' : mx.toFixed(3));
    root.style.setProperty('--my', reduced ? '0' : my.toFixed(3));

    /* Parallax layers: y from distance to viewport centre, x from pointer */
    if (!reduced) {
      var vc = vh / 2;
      parallax.forEach(function (el) {
        var k = +el.dataset.k;
        var m = +(el.dataset.mouse || 0);
        var host = el.parentElement;
        if (!host) return;
        var r = host.getBoundingClientRect();
        var y = Math.max(-220, Math.min(220, (r.top + r.height / 2 - vc) * k));
        el.style.translate = (mx * m).toFixed(1) + 'px ' + (y + my * m).toFixed(1) + 'px';
      });
    }

    /* Como funciona: scrubbed progress */
    if (steps) {
      var sr = steps.getBoundingClientRect();
      var s = reduced ? 1 : Math.max(0, Math.min(1, (vh * 0.7 - sr.top) / (sr.height * 0.85)));
      steps.style.setProperty('--s', s.toFixed(3));
    }

    /* Sticky bar after 60% of hero height */
    if (bar && hero) {
      bar.classList.toggle('is-in', st > hero.offsetHeight * 0.6);
    }

    /* Header glass after 24px */
    if (header) header.classList.toggle('is-glass', st > 24);
  }

  /* ----------------------------- Card tilt ----------------------------- */

  function untilt() {
    if (!tiltEl) return;
    tiltEl.style.transform = '';
    tiltEl.style.setProperty('--hv', '0');
    tiltEl = null;
  }

  function onMove(e) {
    if (e.pointerType === 'mouse') {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      schedule();
    }

    var card = e.target.closest ? e.target.closest('[data-tilt]') : null;
    if (card !== tiltEl) { untilt(); tiltEl = card; }
    if (!card) return;

    var r = card.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width;
    var py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--hv', '1');
    card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
    card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');

    if (!rm()) {
      card.style.transform =
        'perspective(900px) rotateX(' + ((0.5 - py) * 9).toFixed(2) + 'deg) ' +
        'rotateY(' + ((px - 0.5) * 11).toFixed(2) + 'deg) translateY(-4px)';
    }
  }

  function onLeave() { untilt(); mx = 0; my = 0; schedule(); }

  /* ----------------------------- FAQ accordion -----------------------------
     Single-open. First item starts open (markup already says so).
     ---------------------------------------------------------------------- */
  function initFaq() {
    var list = document.getElementById('faq');
    if (!list) return;
    var items = [].slice.call(list.querySelectorAll('.faq-item'));

    items.forEach(function (item) {
      var btn = item.querySelector('.faq-item__btn');
      btn.addEventListener('click', function () {
        var wasOpen = item.classList.contains('is-open');
        items.forEach(function (other) {
          other.classList.remove('is-open');
          other.querySelector('.faq-item__btn').setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ----------------------------- Analytics hook -----------------------------
     Fires one event per CTA location. Wire this to whatever analytics the
     site ends up using; it no-ops until then.
     ---------------------------------------------------------------------- */
  function initTracking() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('[data-cta]') : null;
      if (!a) return;
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'whatsapp_click', { location: a.dataset.cta });
      }
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: 'whatsapp_click', location: a.dataset.cta });
      }
    });
  }

  /* ----------------------------- Boot ----------------------------- */

  checkAssets();
  buildParticles();
  initReveals();
  initFaq();
  initTracking();
  update();

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  if (mq.addEventListener) {
    mq.addEventListener('change', function () {
      reveals.forEach(function (el) { delete el.dataset.done; });
      initReveals();
      update();
    });
  }
})();
