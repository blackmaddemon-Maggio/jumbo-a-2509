/* ==========================================================
   JUMBO 2509 A — interactions
   ========================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- toast ---------- */
  var toast = $('#toast'), toastTimer;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 4200);
  }

  /* ---------- mobile nav ---------- */
  var burger = $('#burger'), nav = $('#nav');
  function shutNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'เปิดเมนู');
  }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', shutNav); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shutNav(); });
  }

  /* ---------- reveal ---------- */
  var revealables = $$('.reveal');
  var io = null;

  function show(el, delay) {
    if (el.classList.contains('is-in')) return;
    if (delay) setTimeout(function () { el.classList.add('is-in'); }, delay);
    else el.classList.add('is-in');
    if (io) io.unobserve(el);
  }

  if ('IntersectionObserver' in window && !reduced) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) { if (e.isIntersecting) show(e.target, Math.min(i * 60, 300)); });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* An anchor jump or a fast flick can carry a section past the viewport
     without the observer ever seeing it intersect, leaving it stuck at
     opacity 0. Sweep anything already above the fold. */
  function sweep() {
    if (!revealables) return;
    revealables.forEach(function (el) {
      if (el.classList.contains('is-in')) return;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) show(el, 0);
    });
  }

  /* ---------- sticky bar, back-to-top, active link ---------- */
  var bar = $('#bar'), up = $('#up'), ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (bar) bar.classList.toggle('is-stuck', y > 16);
    if (up) up.classList.toggle('is-on', y > 620);
    sweep();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (up) up.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  var links = $$('.nav__a'), secs = $$('section[id]');
  if ('IntersectionObserver' in window && secs.length) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle('is-on', l.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { navIO.observe(s); });
  }

  /* ---------- counters ---------- */
  var counters = $$('.counter__n');
  function runCounter(el) {
    var to = parseInt(el.dataset.to, 10) || 0;
    if (reduced) { el.textContent = to.toLocaleString('th-TH'); return; }
    var start = performance.now(), dur = 1400;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased).toLocaleString('th-TH');
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var cIO = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          runCounter(e.target);
          obs.unobserve(e.target);
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cIO.observe(el); });
    } else {
      counters.forEach(runCounter);
    }
  }

  /* ---------- quote form (mockup only) ---------- */
  var form = $('#quoteForm');
  if (form) {
    var date = form.querySelector('input[name="date"]');
    if (date) {
      var iso = function (d) { return d.toISOString().slice(0, 10); };
      var today = new Date();
      date.min = iso(new Date(today.getTime() + 864e5));           /* งานเร่งที่สุดคือพรุ่งนี้ */
      date.max = iso(new Date(today.getTime() + 730 * 864e5));     /* รับจองล่วงหน้าสองปี */
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        var bad = form.querySelector(':invalid');
        if (bad) { bad.focus(); bad.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); }
        say('ยังกรอกไม่ครบ — ต้องมีชื่อ เบอร์โทร อีเมล วันจัดงาน และจำนวนแขก');
        return;
      }
      var d = new FormData(form);

      /* งานที่เหลือเวลาน้อยกว่า 14 วันคิดค่าเร่ง 15% ตามที่ระบุไว้ข้างฟอร์ม */
      var days = Math.ceil((new Date(d.get('date')) - new Date()) / 864e5);
      var rush = days < 14 ? ' · เข้าเงื่อนไขงานเร่ง (เหลือ ' + days + ' วัน) คิดค่าเร่ง 15%' : '';

      say('✓ รับคำขอแล้ว: ' + d.get('type') + ' · ' + d.get('guests') + ' · ' +
          d.get('date') + rush + ' — เว็บตัวอย่าง ไม่ได้ส่งข้อมูลจริง');
      form.reset();
      if (date) date.value = '';
    });
  }

  /* ---------- ticket cards jump to the quote form ---------- */
  $$('.tik').forEach(function (t) {
    t.style.cursor = 'pointer';
    t.addEventListener('click', function () {
      var cat = $('.tik__cat', t), name = $('h3', t);
      say('สนใจงานแบบ “' + (cat ? cat.textContent : 'นี้') + '” เหมือน ' +
          (name ? name.textContent : 'งานนี้') + '? กรอกฟอร์มด้านล่างได้เลย');
      var target = document.getElementById('quote');
      if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------- footer year in Buddhist Era ---------- */
  var yr = $('.foot__bar p');
  if (yr) yr.textContent = yr.textContent.replace('2569', String(new Date().getFullYear() + 543));
})();
