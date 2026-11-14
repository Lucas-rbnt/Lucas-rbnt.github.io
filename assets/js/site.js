/* lucas-rbnt.github.io: tiny vanilla JS, no dependencies */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ---------------- theme toggle ---------------- */
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : systemDark.matches;
  }
  var themeListeners = [];
  var toggle = $('#theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      themeListeners.forEach(function (fn) { fn(); });
    });
  }
  if (systemDark.addEventListener) {
    systemDark.addEventListener('change', function () { themeListeners.forEach(function (fn) { fn(); }); });
  }

  /* ---------------- nav ---------------- */
  var nav = $('#nav');
  var burger = $('.nav__burger');
  var links = $('#nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  function onScroll() { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- reveal on scroll + figure playback ---------------- */
  var figs = $$('.fig');
  figs.forEach(function (f) {
    var svg = $('svg', f);
    if (svg && svg.pauseAnimations) svg.pauseAnimations();
  });

  if ('IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$('.reveal').forEach(function (el) { revealIO.observe(el); });

    if (!reduced) {
      var figIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var svg = $('svg', e.target);
          e.target.classList.toggle('is-playing', e.isIntersecting);
          if (svg && svg.pauseAnimations) {
            if (e.isIntersecting) svg.unpauseAnimations(); else svg.pauseAnimations();
          }
        });
      }, { threshold: 0.2 });
      figs.forEach(function (f) { figIO.observe(f); });
    }
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- typewriter ---------------- */
  var typed = $('#typed');
  if (typed && !reduced) {
    var lines;
    try { lines = JSON.parse(typed.getAttribute('data-lines')); } catch (e) { lines = null; }
    if (lines && lines.length) {
      var li = 0, ci = lines[0].length, deleting = false;
      var tick = function () {
        var line = lines[li];
        if (!deleting) {
          ci++;
          typed.textContent = line.slice(0, ci);
          if (ci >= line.length) { deleting = true; return setTimeout(tick, 2200); }
          return setTimeout(tick, 38 + Math.random() * 50);
        }
        ci--;
        typed.textContent = line.slice(0, ci);
        if (ci <= 0) { deleting = false; li = (li + 1) % lines.length; return setTimeout(tick, 350); }
        setTimeout(tick, 18);
      };
      setTimeout(function () { deleting = true; tick(); }, 2400);
    }
  }

  /* ---------------- latent space canvas ---------------- */
  var canvas = $('#latent');
  var latent = canvas ? createLatent(canvas) : null;
  if (latent) themeListeners.push(latent.recolor);

  function createLatent(cv) {
    var ctx = cv.getContext('2d');
    if (!ctx) return null;
    var W = 0, H = 0, dpr = 1, pts = [], colors = {}, running = false, visible = true, raf = 0;
    var mouse = { x: -1e4, y: -1e4, on: false };
    var mods = ['rad', 'his', 'omi'];
    var t0 = performance.now();

    function readColors() {
      var cs = getComputedStyle(root);
      mods.forEach(function (m) { colors[m] = cs.getPropertyValue('--' + m).trim() || '#888'; });
      colors.line = cs.getPropertyValue('--muted').trim() || '#888';
    }

    function centers(t) {
      // three slowly drifting cluster centres: one per modality
      var wide = W > 720;
      var bx = wide ? 0.68 : 0.5;
      return [
        { x: W * (bx - 0.06) + Math.cos(t * 0.00011) * W * 0.05, y: H * 0.32 + Math.sin(t * 0.00013) * H * 0.06 },
        { x: W * (bx + 0.14) + Math.sin(t * 0.00009) * W * 0.05, y: H * 0.58 + Math.cos(t * 0.00012) * H * 0.07 },
        { x: W * (bx - 0.02) + Math.cos(t * 0.00014 + 2) * W * 0.05, y: H * 0.76 + Math.sin(t * 0.0001) * H * 0.05 }
      ];
    }

    function resize() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.max(40, Math.min(130, Math.round(W * H / 9000)));
      var c = centers(0);
      pts = [];
      for (var i = 0; i < n; i++) {
        var k = i % 3;
        var a = Math.random() * Math.PI * 2, d = Math.random() * Math.min(W, H) * 0.32;
        pts.push({
          k: k,
          x: c[k].x + Math.cos(a) * d, y: c[k].y + Math.sin(a) * d,
          vx: 0, vy: 0,
          r: 1.1 + Math.random() * 1.6,
          // personal offset inside the cluster, so clusters keep a shape
          ox: (Math.random() - 0.5) * Math.min(W, H) * 0.42,
          oy: (Math.random() - 0.5) * Math.min(W, H) * 0.32,
          ph: Math.random() * 6.28
        });
      }
      draw(performance.now());
    }

    function step(t) {
      var c = centers(t - t0);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], cc = c[p.k];
        var tx = cc.x + p.ox + Math.cos(t * 0.0006 + p.ph) * 8;
        var ty = cc.y + p.oy + Math.sin(t * 0.0005 + p.ph) * 8;
        p.vx += (tx - p.x) * 0.0016;
        p.vy += (ty - p.y) * 0.0016;
        if (mouse.on) {
          var dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
          if (d2 < 32000) { var f = (1 - d2 / 32000) * 0.035; p.vx += dx * f * 0.1; p.vy += dy * f * 0.1; }
        }
        p.vx *= 0.92; p.vy *= 0.92;
        p.x += p.vx; p.y += p.vy;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var maxD = 74, maxD2 = maxD * maxD;
      ctx.lineWidth = 0.6;
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i];
        for (var j = i + 1; j < pts.length; j++) {
          var b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < maxD2) {
            ctx.globalAlpha = (1 - d2 / maxD2) * (a.k === b.k ? 0.35 : 0.14);
            ctx.strokeStyle = a.k === b.k ? colors[mods[a.k]] : colors.line;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k];
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = colors[mods[p.k]];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      if (!running) return;
      step(t); draw();
      raf = requestAnimationFrame(loop);
    }
    function start() { if (reduced || running || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    readColors();
    resize();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    var hero = cv.parentElement;
    hero.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
    });
    hero.addEventListener('pointerleave', function () { mouse.on = false; });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(cv);
    }
    start();

    return {
      recolor: function () { readColors(); if (!running) draw(); },
      shake: function () {
        // shuffle modality assignments and kick everything: "re-training"
        pts.forEach(function (p) {
          p.vx += (Math.random() - 0.5) * 40; p.vy += (Math.random() - 0.5) * 40;
          p.k = (p.k + 1 + (Math.random() * 2 | 0)) % 3;
        });
        if (!running) { draw(); }
      }
    };
  }

  /* ---------------- easter eggs ---------------- */
  var code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var pos = 0;
  document.addEventListener('keydown', function (e) {
    var k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === code[pos] ? pos + 1 : (k === code[0] ? 1 : 0);
    if (pos === code.length) {
      pos = 0;
      document.body.classList.add('party');
      if (latent) latent.shake();
      if (typed) typed.textContent = 'loss: NaN … just kidding, all good';
      setTimeout(function () { document.body.classList.remove('party'); }, 4000);
    }
  });

  try {
    console.log(
      '%c\n  ┌─────────────────────────────┐\n  │  z = f(CT, WSI, RNA)        │\n  │  hi there, curious mind  👋 │\n  └─────────────────────────────┘\n',
      'font-family: monospace; color: #b8337f'
    );
    console.log('%cpsst: try ↑ ↑ ↓ ↓ ← → ← → b a', 'font-family: monospace; color: #888');
  } catch (e) {}
})();
