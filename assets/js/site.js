/*
 * lucas-rbnt.github.io: all the site's JavaScript, no dependencies.
 *
 *   1. theme toggle      dark by default, choice saved in localStorage
 *   2. mobile nav        burger menu + border when scrolled
 *   3. scroll effects    fade-in of .reveal blocks, paper figures play only when visible
 *   4. typewriter        cycles the hero lines from _config.yml (taglines)
 *   5. tissue canvas     H&E-like cells drifting, dividing and dying in the hero
 *   6. easter eggs       Konami code + console greeting
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ------------------------------------------------------------------ 1. theme */
  var themeButton = $('#theme-toggle');
  var onThemeChange = function () {};   // replaced by the tissue canvas below

  if (themeButton) {
    themeButton.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      onThemeChange();
    });
  }

  /* ------------------------------------------------------------------ 2. nav */
  var nav = $('#nav');
  var burger = $('.nav__burger');
  var links = $('#nav-links');

  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }
  function updateNavBorder() { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', updateNavBorder, { passive: true });
  updateNavBorder();

  /* ------------------------------------------------------------------ 3. scroll effects */
  var figures = $$('.fig');

  // SVG <animateMotion> animations start on load, so pause them until visible.
  figures.forEach(function (fig) {
    var svg = fig.querySelector('svg');
    if (svg && svg.pauseAnimations) svg.pauseAnimations();
  });

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) { revealObserver.observe(el); });

    if (!reducedMotion) {
      var figureObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var visible = entry.isIntersecting;
          var svg = entry.target.querySelector('svg');
          entry.target.classList.toggle('is-playing', visible);   // CSS animations
          if (svg && svg.pauseAnimations) visible ? svg.unpauseAnimations() : svg.pauseAnimations();
        });
      }, { threshold: 0.2 });
      figures.forEach(function (fig) { figureObserver.observe(fig); });
    }
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------------ 4. typewriter */
  var typed = $('#typed');

  if (typed && !reducedMotion) {
    var lines = JSON.parse(typed.getAttribute('data-lines') || '[]');
    var lineIndex = 0;
    var charCount = lines.length ? lines[0].length : 0;   // first line is already printed
    var deleting = true;

    var typeStep = function () {
      var line = lines[lineIndex];
      charCount += deleting ? -1 : 1;
      typed.textContent = line.slice(0, charCount);

      if (!deleting && charCount === line.length) { deleting = true; return setTimeout(typeStep, 2200); }
      if (deleting && charCount === 0) {
        deleting = false;
        lineIndex = (lineIndex + 1) % lines.length;
        return setTimeout(typeStep, 350);
      }
      setTimeout(typeStep, deleting ? 18 : 40 + Math.random() * 50);
    };
    if (lines.length > 1) setTimeout(typeStep, 2400);
  }

  /* ------------------------------------------------------------------ 5. tissue canvas */
  var canvas = $('#tissue');
  var tissue = canvas ? createTissue(canvas) : null;
  if (tissue) onThemeChange = tissue.recolor;

  /*
   * A loose sheet of cells, drawn like an H&E slide:
   *   pink (eosin) wobbly cytoplasm + purple (hematoxylin) nucleus.
   * Cells push each other apart, drift a little, and every so often one divides
   * (mitosis) while another fades out, so the population stays roughly constant.
   * The mouse acts as a microscope probe: it gently pushes cells away.
   */
  function createTissue(canvas) {
    var ctx = canvas.getContext('2d');
    var width = 0, height = 0;
    var cells = [];
    var targetCount = 0;
    var colors = {};
    var mouse = { x: 0, y: 0, inside: false };
    var running = false, onScreen = true, frameId = 0, frame = 0;

    function readColors() {
      var css = getComputedStyle(root);
      colors.eosin = css.getPropertyValue('--eos').trim();
      colors.hema = css.getPropertyValue('--hema').trim();
      colors.muted = css.getPropertyValue('--muted').trim();
    }

    function newCell(x, y, radius) {
      var immune = Math.random() < 0.15;   // small, dark "lymphocytes"
      return {
        x: x, y: y, vx: 0, vy: 0,
        r: radius, size: radius,            // r = current radius, size = radius it grows to
        immune: immune,
        angle: Math.random() * Math.PI,     // orientation (also the division axis)
        phase: Math.random() * 10,          // makes each outline wobble differently
        opacity: 0,
        division: -1,                       // -1 = not dividing, 0..1 = progress
        dying: false
      };
    }

    function resize() {
      var box = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = box.width; height = box.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // More cells on bigger screens; on wide screens keep them mostly on the right.
      targetCount = Math.max(30, Math.min(110, Math.round(width * height / 6500)));
      var wide = width > 720;
      cells = [];
      for (var i = 0; i < targetCount; i++) {
        var x = wide ? width * (0.3 + 0.7 * Math.random()) : width * Math.random();
        var c = newCell(x, height * Math.random(), 9 + Math.random() * 7);
        c.opacity = 1;
        if (c.immune) c.r = c.size = c.size * 0.6;
        cells.push(c);
      }
      draw();
    }

    function startDivision(cell) {
      if (cell && !cell.immune && cell.division < 0 && !cell.dying) cell.division = 0;
    }

    function update() {
      frame++;

      // Every ~1.5 s: one cell divides and, if we are above the target, an old one dies.
      if (frame % 90 === 0) {
        startDivision(cells[Math.floor(Math.random() * cells.length)]);
        if (cells.length > targetCount) cells[Math.floor(Math.random() * cells.length)].dying = true;
      }

      // Cells that overlap push each other apart.
      for (var i = 0; i < cells.length; i++) {
        for (var j = i + 1; j < cells.length; j++) {
          var a = cells[i], b = cells[j];
          var dx = b.x - a.x, dy = b.y - a.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          var minDist = (a.r + b.r) * 1.05;
          if (dist < minDist) {
            var push = (minDist - dist) / minDist * 0.06;
            a.vx -= dx / dist * push; a.vy -= dy / dist * push;
            b.vx += dx / dist * push; b.vy += dy / dist * push;
          }
        }
      }

      var born = [];
      cells = cells.filter(function (c) {
        // tiny random drift (Brownian motion)
        c.vx += (Math.random() - 0.5) * 0.04;
        c.vy += (Math.random() - 0.5) * 0.04;

        // the mouse probe pushes cells away
        if (mouse.inside) {
          var mx = c.x - mouse.x, my = c.y - mouse.y;
          var md = Math.sqrt(mx * mx + my * my) || 1;
          if (md < 90) { c.vx += mx / md * 0.25 * (1 - md / 90); c.vy += my / md * 0.25 * (1 - md / 90); }
        }

        // stay inside the canvas
        if (c.x < 0) c.vx += 0.05; if (c.x > width) c.vx -= 0.05;
        if (c.y < 0) c.vy += 0.05; if (c.y > height) c.vy -= 0.05;

        c.vx *= 0.9; c.vy *= 0.9;
        c.x += c.vx; c.y += c.vy;
        c.r += (c.size - c.r) * 0.02;   // daughters grow back to full size

        if (c.dying) { c.opacity -= 0.01; return c.opacity > 0; }
        c.opacity = Math.min(1, c.opacity + 0.02);

        if (c.division >= 0) {
          c.division += 0.008;
          if (c.division >= 1) {
            // split into two daughter cells along the cell's axis
            var ox = Math.cos(c.angle) * c.r * 0.55, oy = Math.sin(c.angle) * c.r * 0.55;
            [1, -1].forEach(function (side) {
              var d = newCell(c.x + ox * side, c.y + oy * side, c.size * 0.72);
              d.size = c.size; d.opacity = 1;
              d.immune = false; d.angle = c.angle + Math.PI / 2;
              born.push(d);
            });
            return false;
          }
        }
        return true;
      });
      cells = cells.concat(born);
    }

    function ellipse(x, y, rx, ry) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawCell(c, time) {
      var d = Math.max(0, c.division);         // 0 when not dividing
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.scale(1 + 0.5 * d, 1 - 0.15 * d);     // stretch while dividing
      ctx.globalAlpha = c.opacity;

      // cytoplasm: a slightly wobbly circle
      ctx.beginPath();
      for (var k = 0; k <= 20; k++) {
        var t = k / 20 * Math.PI * 2;
        var rr = c.r * (1 + 0.07 * Math.sin(3 * t + c.phase + time * 0.0008) + 0.04 * Math.sin(5 * t + c.phase * 2));
        k === 0 ? ctx.moveTo(rr * Math.cos(t), rr * Math.sin(t)) : ctx.lineTo(rr * Math.cos(t), rr * Math.sin(t));
      }
      ctx.closePath();
      ctx.fillStyle = colors.eosin;
      ctx.globalAlpha = c.opacity * (c.immune ? 0.08 : 0.16);
      ctx.fill();
      ctx.strokeStyle = colors.eosin;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = c.opacity * 0.45;
      ctx.stroke();

      // nucleus (two of them while dividing, moving apart)
      ctx.fillStyle = colors.hema;
      ctx.globalAlpha = c.opacity * 0.8;
      if (c.immune) {
        ellipse(0, 0, c.r * 0.75, c.r * 0.7);
      } else if (d > 0) {
        ellipse(-d * c.r * 0.45, 0, c.r * 0.3, c.r * 0.28);
        ellipse(d * c.r * 0.45, 0, c.r * 0.3, c.r * 0.28);
      } else {
        ellipse(0, 0, c.r * 0.38, c.r * 0.3);
        ctx.globalAlpha = c.opacity;             // nucleolus
        ellipse(c.r * 0.1, -c.r * 0.06, c.r * 0.08, c.r * 0.08);
      }
      ctx.restore();
    }

    function drawProbe() {
      ctx.save();
      ctx.strokeStyle = colors.muted;
      ctx.fillStyle = colors.muted;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 70, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();                            // small crosshair
      ctx.moveTo(mouse.x - 6, mouse.y); ctx.lineTo(mouse.x + 6, mouse.y);
      ctx.moveTo(mouse.x, mouse.y - 6); ctx.lineTo(mouse.x, mouse.y + 6);
      ctx.stroke();
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('40×', mouse.x + 52, mouse.y - 56);
      ctx.restore();
    }

    function draw() {
      var time = performance.now();
      ctx.clearRect(0, 0, width, height);
      cells.forEach(function (c) { drawCell(c, time); });
      if (mouse.inside && !reducedMotion) drawProbe();
    }

    function loop() {
      if (!running) return;
      update();
      draw();
      frameId = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reducedMotion || !onScreen || document.hidden) return;
      running = true;
      frameId = requestAnimationFrame(loop);
    }
    function stop() { running = false; cancelAnimationFrame(frameId); }

    // --- wiring ---
    readColors();
    resize();

    var resizeTimer;
    window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });

    var hero = canvas.parentElement;
    hero.addEventListener('pointermove', function (e) {
      var box = canvas.getBoundingClientRect();
      mouse.x = e.clientX - box.left; mouse.y = e.clientY - box.top; mouse.inside = true;
    });
    hero.addEventListener('pointerleave', function () { mouse.inside = false; });

    // Only animate while the hero is on screen and the tab is visible.
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        onScreen ? start() : stop();
      }).observe(canvas);
    }
    start();

    return {
      recolor: function () { readColors(); if (!running) draw(); },
      burst: function () { for (var i = 0; i < 15; i++) startDivision(cells[Math.floor(Math.random() * cells.length)]); }
    };
  }

  /* ------------------------------------------------------------------ 6. easter eggs */
  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var progress = 0;

  document.addEventListener('keydown', function (e) {
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    progress = key === konami[progress] ? progress + 1 : (key === konami[0] ? 1 : 0);
    if (progress < konami.length) return;

    progress = 0;
    document.body.classList.add('party');
    if (tissue) tissue.burst();                      // mitosis everywhere
    if (typed) typed.textContent = 'mitotic index: 100% … contained, all good';
    setTimeout(function () { document.body.classList.remove('party'); }, 4000);
  });

  console.log(
    '%c\n  ┌─────────────────────────────┐\n  │  z = f(CT, WSI, RNA)        │\n  │  hi there, curious mind  👋 │\n  └─────────────────────────────┘\n',
    'font-family: monospace; color: #e675b8'
  );
  console.log('%cpsst: try ↑ ↑ ↓ ↓ ← → ← → b a', 'font-family: monospace; color: #888');
})();
