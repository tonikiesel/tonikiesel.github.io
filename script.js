(function () {
  var root = document.documentElement;
  var go = document.querySelector('.start .btn');
  var intro = document.getElementById('intro');
  var dive = document.getElementById('dive');
  if (!go || !intro) return;
  function show(instant) {
    if (!root.classList.contains('unlocked')) root.classList.add('unlocked', 'just-unlocked');
    var start = document.querySelector('.start');
    if (start) start.style.display = 'none';
    window.scrollTo({ top: 0, behavior: instant ? 'instant' : 'smooth' });
    intro.setAttribute('tabindex', '-1');
    intro.focus({ preventScroll: true });
  }
  var returning = root.classList.contains('returning');
  if (!dive) {
    if (returning) { show(true); return; }
    go.addEventListener('click', function (e) { e.preventDefault(); show(false); });
    return;
  }
  var coolant = dive.firstElementChild;
  function rnd(min, max) { return min + Math.random() * (max - min); }
  function makeBubbles() {
    Array.prototype.slice.call(coolant.querySelectorAll('.bubble')).forEach(function (old) { old.remove(); });
    var count = Math.round(rnd(55, 90));
    for (var i = 0; i < count; i++) {
      var b = document.createElement('span');
      /* meist kleine Blasen, ab und zu eine große */
      var size = Math.random() < 0.15 ? rnd(14, 26) : rnd(3, 11);
      b.className = 'bubble';
      b.style.cssText = 'width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;left:' + rnd(0, 97).toFixed(1) + '%' +
        ';--dx:' + rnd(-30, 30).toFixed(0) + 'px;--rise:-' + rnd(45, 95).toFixed(0) + 'vh;--o:' + rnd(.4, .85).toFixed(2) +
        ';animation-delay:' + rnd(0, 0.9).toFixed(2) + 's;animation-duration:' + rnd(1.4, 2.6).toFixed(2) + 's';
      coolant.appendChild(b);
    }
  }
  var busy = false;
  function plunge(welcome) {
    if (busy) return;
    if (window.tkNoMotion()) { show(true); return; }
    busy = true;
    makeBubbles();
    var extra = welcome ? ' welcome' : '';
    var hold = welcome ? 1900 : 1050;   /* Begrüßung kurz stehen lassen */
    dive.className = 'dive rise' + extra;
    setTimeout(function () { show(true); dive.className = 'dive exit' + extra; }, hold);
    setTimeout(function () { dive.className = 'dive'; busy = false; }, hold + 1000);
  }
  go.addEventListener('click', function (e) { e.preventDefault(); plunge(false); });
  /* Wer einfach scrollt, wischt oder Pfeil nach unten drückt, taucht ebenfalls ab */
  function auto(e) {
    if (root.classList.contains('unlocked') || busy) return;
    var st = document.getElementById('settings');
    if (st && !st.hidden && e && e.target && st.contains(e.target)) return;
    plunge(false);
  }
  window.addEventListener('wheel', function (e) { if (e.deltaY > 4) auto(e); }, { passive: true });
  var ty = null;
  window.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', function (e) { if (ty !== null && ty - e.touches[0].clientY > 40) { ty = null; auto(e); } }, { passive: true });
  window.addEventListener('keydown', function (e) {
    if (root.classList.contains('unlocked')) return;
    var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.tagName === 'A');
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'End' || (e.key === ' ' && !typing)) { e.preventDefault(); auto(e); }
  });
  /* Wiederkehrende Besucher tauchen automatisch ab, mit Begrüßung im Wasser */
  if (returning) plunge(true);
})();

/* Kennzahlen: Ziffern rollen kurz wie im Terminal und rasten dann nacheinander ein */
(function () {
  var root = document.documentElement;
  var box = document.querySelector('.stats');
  if (!box) return;
  var nums = box.querySelectorAll('.stat-num');
  var done = false, seen = false, unlockedAt = 0;
  function rnd() { return String(Math.floor(Math.random() * 10)) + Math.floor(Math.random() * 10); }
  function run() {
    if (done) return; done = true;
    if (root.classList.contains('no-motion')) return;
    Array.prototype.forEach.call(nums, function (el, i) {
      var v = el.getAttribute('data-v'), end = 700 + i * 350, html = el.innerHTML;
      el.classList.add('rolling');
      var t = setInterval(function () { el.textContent = rnd(); }, 55);
      setTimeout(function () {
        clearInterval(t); el.innerHTML = html; el.classList.remove('rolling'); el.classList.add('pop');
        setTimeout(function () { el.classList.remove('pop'); }, 500);
      }, end);
    });
  }
  function check() {
    if (done || !seen || !root.classList.contains('unlocked')) return;
    if (!unlockedAt) unlockedAt = Date.now();
    setTimeout(run, 600);   /* Tauch-Übergang erst ausklingen lassen */
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) { seen = true; check(); } }, { threshold: .6 }).observe(box);
  } else { seen = true; }
  new MutationObserver(check).observe(root, { attributes: true, attributeFilter: ['class'] });
  check();
})();

(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var ring = document.createElement('div');
  ring.className = 'ring';
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);
  var x = 0, y = 0, queued = false;
  function draw() { queued = false; ring.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }
  document.addEventListener('mousemove', function (e) {
    x = e.clientX; y = e.clientY;
    if (!queued) { queued = true; requestAnimationFrame(draw); }
    document.documentElement.classList.add('has-ring');
    ring.classList.add('show');
    var t = e.target.closest ? e.target.closest('a:not(.locked),button,summary,.btn:not(.locked),video[controls]') : null;
    ring.classList.toggle('link', !!t);
  });
  document.addEventListener('mousedown', function () { ring.classList.add('down'); });
  document.addEventListener('mouseup', function () { ring.classList.remove('down'); });
  document.documentElement.addEventListener('mouseleave', function () { ring.classList.remove('show'); });
})();

(function () {
  document.addEventListener('click', function (e) {
    if (window.tkNoMotion()) return;
    if (e.detail === 0) return; /* per Tastatur ausgelöst: keine Welle */
    var w = document.createElement('div');
    var onLink = e.target.closest && e.target.closest('a:not(.locked),button,summary,.btn:not(.locked),video[controls]');
    w.className = 'wave' + (onLink ? ' link' : '');
    w.style.left = e.clientX + 'px';
    w.style.top = e.clientY + 'px';
    var html = '<span class="r"></span><span class="r"></span><span class="r"></span><span class="c"></span>';
    for (var i = 0; i < 11; i++) {
      var dir = Math.random() < 0.5 ? -1 : 1;
      var t = 1.0 + Math.random() * 0.6;
      html += '<span class="bit" style="font-size:' + (12 + Math.random() * 8).toFixed(0) + 'px;--dx:' + (dir * (10 + Math.random() * 58)).toFixed(1) +
              'px;--h:' + (22 + Math.random() * 40).toFixed(1) + 'px;--fall:' + (6 + Math.random() * 28).toFixed(1) +
              'px;--rot:' + ((Math.random() * 2 - 1) * 70).toFixed(0) + 'deg;--t:' + t.toFixed(2) + 's;animation-delay:' +
              (Math.random() * 0.07).toFixed(2) + 's">' + (Math.random() < 0.5 ? '0' : '1') + '</span>';
    }
    w.innerHTML = html;
    document.body.appendChild(w);
    setTimeout(function () { w.remove(); }, 2000);
  });
})();

(function () {
  var title = document.getElementById('dripTitle');
  if (!title) return;
  if (window.tkNoMotion()) {
    window.addEventListener('tk-motion', function h() { if (!window.tkNoMotion()) { window.removeEventListener('tk-motion', h); start(); } });
    return;
  }
  start();
  function start() {
  var sr = document.createElement('span');
  sr.className = 'sr';
  sr.textContent = title.textContent;
  Array.prototype.forEach.call(title.querySelectorAll('.line'), function (line) {
    var words = line.textContent.split(' ');
    line.textContent = '';
    line.setAttribute('aria-hidden', 'true');
    words.forEach(function (word, i) {
      var w = document.createElement('span');
      w.className = 'w';
      word.split('').forEach(function (c) {
        var ch = document.createElement('span');
        ch.className = 'ch';
        ch.textContent = c;
        w.appendChild(ch);
      });
      line.appendChild(w);
      if (i < words.length - 1) line.appendChild(document.createTextNode(' '));
    });
  });
  title.insertBefore(sr, title.firstChild);

  /* Misst, wo ein Buchstabe unten wirklich Farbe hat (Stämme von n/m/h, Rundung von o/e/u ...) */
  var cv = document.createElement('canvas');
  var ctx = cv.getContext('2d', { willReadFrequently: true });
  function inkSpots(ch, cs, base) {
    var SC = 2, fs = parseFloat(cs.fontSize);
    var cw = Math.ceil((ch.offsetWidth + fs) * SC), chh = Math.ceil(fs * 2 * SC);
    var padX = Math.round(fs * 0.5 * SC), by = Math.round(fs * 1.3 * SC);
    cv.width = cw; cv.height = chh;
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + (fs * SC) + 'px ' + cs.fontFamily;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#000';
    ctx.fillText(ch.textContent, padX, by);
    var data = ctx.getImageData(0, 0, cw, chh).data, x, y, bottom = -1;
    for (y = chh - 1; y >= 0 && bottom < 0; y--) {
      for (x = 0; x < cw; x++) { if (data[(y * cw + x) * 4 + 3] > 110) { bottom = y; break; } }
    }
    if (bottom < 0) return [];
    var band = 5, runs = [], start = -1;
    for (x = 0; x <= cw; x++) {
      var ink = false;
      if (x < cw) for (y = bottom - band; y <= bottom; y++) { if (data[(y * cw + x) * 4 + 3] > 110) { ink = true; break; } }
      if (ink && start < 0) start = x;
      if (!ink && start >= 0) {
        if (x - start >= 4) runs.push({ x: ((start + x) / 2 - padX) / SC, y: base + (bottom - by) / SC });
        start = -1;
      }
    }
    return runs;
  }

  function drips() {
    Array.prototype.forEach.call(title.querySelectorAll('.drip'), function (d) { d.remove(); });
    var chs = title.querySelectorAll('.ch');
    var lastTop = 0;
    Array.prototype.forEach.call(chs, function (c) { lastTop = Math.max(lastTop, c.offsetTop); });
    var cand = Array.prototype.filter.call(chs, function (c) { return Math.abs(c.offsetTop - lastTop) < 4; });
    if (!cand.length) return;

    /* Grundlinie im Zeichen-Kasten messen (unabhängig von Skalierung) */
    var probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    cand[0].appendChild(probe);
    var r0 = cand[0].getBoundingClientRect(), pr = probe.getBoundingClientRect();
    var k = r0.height ? r0.height / cand[0].offsetHeight : 1;
    var base = (pr.bottom - r0.top) / k;
    cand[0].removeChild(probe);

    var cs = window.getComputedStyle(cand[0]);
    var fall = Math.min(window.innerHeight * 0.3, 260);
    var made = 0;
    cand.forEach(function (c, i) {
      if (made >= 12 || (i + Math.floor(Math.random() * 2)) % 2) return;
      var spots = inkSpots(c, cs, base);
      if (!spots.length) return;
      var sp = spots[Math.floor(Math.random() * spots.length)];
      made++;
      var t = 5 + Math.random() * 4;
      var d = document.createElement('span');
      d.className = 'drip';
      d.style.cssText = 'left:' + (c.offsetLeft + sp.x).toFixed(1) + 'px;top:' + (c.offsetTop + sp.y - 2).toFixed(1) +
        'px;--len:' + (22 + Math.random() * 50).toFixed(0) + 'px;--fall:' + fall.toFixed(0) + 'px;--t:' + t.toFixed(1) + 's;--delay:-' + (Math.random() * t).toFixed(1) + 's';
      d.innerHTML = '<i class="strand"></i><i class="fall"></i>';
      title.appendChild(d);
    });
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(drips);
  var timer;
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(drips, 200); });
  }
})();

(function () {
  var host = document.querySelector('.backdrop');
  if (!host) return;
  var NS = 'http://www.w3.org/2000/svg', timer, lastW = 0, lastH = 0,
      /* bei jedem Aufruf neu gewürfelt, innerhalb eines Besuchs aber stabil */
      SEED = (typeof window.__TUBE_SEED === 'number') ? window.__TUBE_SEED : Math.floor(Math.random() * 1e9);

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  /* Linie mit abgerundeten Ecken, wie gebogene Hardline-Rohre */
  function rounded(pts, r) {
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) {
      var a = pts[i - 1], p = pts[i], b = pts[i + 1];
      var l1 = Math.hypot(p[0] - a[0], p[1] - a[1]), l2 = Math.hypot(b[0] - p[0], b[1] - p[1]);
      var rr = Math.min(r, l1 / 2, l2 / 2);
      d += ' L' + (p[0] + (a[0] - p[0]) / l1 * rr).toFixed(1) + ',' + (p[1] + (a[1] - p[1]) / l1 * rr).toFixed(1) +
           ' Q' + p[0] + ',' + p[1] + ' ' + (p[0] + (b[0] - p[0]) / l2 * rr).toFixed(1) + ',' + (p[1] + (b[1] - p[1]) / l2 * rr).toFixed(1);
    }
    var last = pts[pts.length - 1];
    return d + ' L' + last[0].toFixed(1) + ',' + last[1].toFixed(1);
  }

  var io = null, builtHB = 0;
  /* Höhe des Inhalts ohne den Hintergrund selbst messen */
  function measure() {
    host.style.height = '0px';
    return Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight);
  }
  function build() {
    var W = window.innerWidth;
    var Hc = measure();
    /* Etwas Vorrat nach unten zeichnen: Klappt z. B. das Impressum auf, sind die Rohre
       schon da und müssen nicht neu verlegt werden (das hat vorher geruckelt) */
    var H = Hc + (W < 600 ? 1800 : 1000);
    builtHB = H;
    host.style.height = Hc + 'px';
    lastW = W; lastH = window.innerHeight;
    Array.prototype.slice.call(host.querySelectorAll('svg')).forEach(function (o) { host.removeChild(o); });
    var rand = rng(SEED);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true', focusable: 'false' }, host);
    svg.style.height = H + 'px';
    var defs = el('defs', {}, svg);
    var eg = el('radialGradient', { id: 'endGlow' }, defs);
    el('stop', { offset: '0', 'stop-color': '#22b4ff', 'stop-opacity': '.7' }, eg);
    el('stop', { offset: '1', 'stop-color': '#22b4ff', 'stop-opacity': '0' }, eg);

    var DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];   /* unten, rechts, oben, links */
    var narrow = W < 600;
    var n = Math.max(6, Math.min(16, Math.round(H / 300 * (narrow ? 0.65 : 1))));
    var COLORS = ['#1ea7ff', '#2bb8ff', '#1b8cf0', '#22a0f5'];

    /* Eine Leitung zufällig verlegen: startet am Rand, biegt immer wieder ab */
    function route() {
      var r = rand(), x, y, dir;
      if (r < 0.35)      { x = Math.round(W * (0.05 + rand() * 0.9)); y = -16; dir = 0; }
      else if (r < 0.68) { x = -16;    y = Math.round(H * (0.03 + rand() * 0.94)); dir = 1; }
      else               { x = W + 16; y = Math.round(H * (0.03 + rand() * 0.94)); dir = 3; }
      var pts = [[x, y]], inside = false, exited = false, endDir = dir;
      function add(px, py) {
        var l = pts[pts.length - 1];
        if (l[0] !== px || l[1] !== py) pts.push([px, py]);
      }
      var segs = 3 + Math.floor(rand() * 5);
      for (var sI = 0; sI < segs; sI++) {
        var horiz = (dir === 1 || dir === 3);
        var L = horiz ? W * (0.18 + rand() * 0.45) : 160 + rand() * 460;
        L = Math.max(90, Math.round(L));
        var nx = x + DIRS[dir][0] * L, ny = y + DIRS[dir][1] * L;
        if (nx < -16 || nx > W + 16 || ny < -16 || ny > H + 16) {
          add(Math.min(W + 16, Math.max(-16, nx)), Math.min(H + 16, Math.max(-16, ny)));
          exited = true; break;
        }
        add(nx, ny); x = nx; y = ny; endDir = dir;
        if (sI === segs - 1 && sI >= 2 && rand() < 0.4) { inside = true; break; }
        if (horiz) dir = rand() < 0.78 ? 0 : 2;
        else dir = (x < W * 0.25) ? 1 : (x > W * 0.75 ? 3 : (rand() < 0.5 ? 1 : 3));
      }
      if (!inside && !exited) {
        if (dir === 0) add(x, H + 16); else if (dir === 1) add(W + 16, y);
        else if (dir === 2) add(x, -16); else add(-16, y);
      }
      return { pts: pts, inside: inside, endDir: endDir, back: rand() < 0.45, r: 26 + rand() * 26 };
    }

    var routes = [];
    for (var i = 0; i < n; i++) routes.push(route());

    function draw(rt) {
      var back = rt.back, d = rounded(rt.pts, rt.r);
      var w = back ? 14 : 20, core = back ? 10.5 : 15.5, cw = back ? 6.5 : 10;
      var col = COLORS[Math.floor(rand() * COLORS.length)];
      /* weicher Schatten: mehrere breite, schwache Striche übereinander, leicht nach unten rechts versetzt */
      [[w + 12, 0.10], [w + 7, 0.14], [w + 3, 0.20]].forEach(function (sh) {
        el('path', { d: d, fill: 'none', stroke: 'rgba(0,0,0,' + sh[1] + ')', 'stroke-width': sh[0], 'stroke-linejoin': 'round', transform: 'translate(4 7)' }, svg);
      });
      var gop = back ? 0.34 : 0.52;
      var g = el('g', { opacity: String(gop) }, svg);
      el('path', { d: d, fill: 'none', stroke: 'rgba(150,200,255,.14)', 'stroke-width': w }, g);
      el('path', { d: d, fill: 'none', stroke: 'rgba(8,18,30,.6)', 'stroke-width': core }, g);
      el('path', { d: d, fill: 'none', stroke: col, 'stroke-width': cw, opacity: '.3' }, g);
      el('path', { d: d, fill: 'none', stroke: 'rgba(210,245,255,.18)', 'stroke-width': 1.6 }, g);

      /* Bewegte Striche liegen außerhalb der Gruppe mit Deckkraft: so muss der Browser
         nicht bei jedem Bild die ganze Leitung neu zusammenrechnen */
      var sheen = el('path', { d: d, fill: 'none', stroke: 'rgba(140,215,255,' + (0.32 * gop).toFixed(3) + ')', 'stroke-width': cw, 'stroke-linecap': 'round', 'stroke-dasharray': '46 174', 'class': 'tube-sheen' }, svgA);
      sheen.style.setProperty('--t2', (12 + rand() * 10).toFixed(1) + 's');
      sheen.style.animationDelay = '-' + (rand() * 12).toFixed(1) + 's';

      var flow = el('path', { d: d, fill: 'none', stroke: 'rgba(225,250,255,' + (0.7 * gop).toFixed(3) + ')', 'stroke-width': back ? 3 : 4.5, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 61 0.1 23 0.1 97 0.1 41', 'class': 'tube-flow' }, svgA);
      anim.push(sheen, flow);
      /* Kupplungen und Kappen wieder in einer eigenen Gruppe über den bewegten Strichen */
      g = el('g', { opacity: String(gop) }, svg);
      flow.style.setProperty('--t', (9 + rand() * 9).toFixed(1) + 's');
      flow.style.animationDelay = '-' + (rand() * 9).toFixed(1) + 's';
      if (rand() < 0.25) { flow.style.animationDirection = 'reverse'; sheen.style.animationDirection = 'reverse'; }

      /* gelegentlich eine Kupplung auf einem geraden Stück */
      var pts = rt.pts;
      for (var k = 1; k < pts.length; k++) {
        var a1 = pts[k - 1], b1 = pts[k];
        var len = Math.abs(b1[0] - a1[0]) + Math.abs(b1[1] - a1[1]);
        if (len > 2 * rt.r + 140 && rand() < 0.4) {
          var t = 0.35 + rand() * 0.3, cx = a1[0] + (b1[0] - a1[0]) * t, cy = a1[1] + (b1[1] - a1[1]) * t;
          var vert = (a1[0] === b1[0]);
          el('rect', vert ? { x: cx - (w / 2 + 3), y: cy - 4, width: w + 6, height: 8, rx: 2 }
                          : { x: cx - 4, y: cy - (w / 2 + 3), width: 8, height: w + 6, rx: 2 },
             g).setAttribute('style', 'fill:rgba(14,30,46,.95);stroke:rgba(190,225,255,.4);stroke-width:1.1');
        }
      }
      /* Leitung, die mitten auf der Seite endet: Kappe mit schwachem Leuchten */
      if (rt.inside) {
        var e = pts[pts.length - 1], dv = DIRS[rt.endDir], vertE = (rt.endDir === 0 || rt.endDir === 2);
        el('circle', { cx: e[0] + dv[0] * 9, cy: e[1] + dv[1] * 9, r: 12, fill: 'url(#endGlow)' }, g);
        el('rect', vertE ? { x: e[0] - (w / 2 + 3), y: e[1] - 4, width: w + 6, height: 8, rx: 2 }
                         : { x: e[0] - 4, y: e[1] - (w / 2 + 3), width: 8, height: w + 6, rx: 2 },
           g).setAttribute('style', 'fill:rgba(14,30,46,.95);stroke:rgba(190,225,255,.45);stroke-width:1.1');
        el('circle', { cx: e[0] + dv[0] * 8, cy: e[1] + dv[1] * 8, r: 2.2, fill: '#bfeaff' }, g);
      }
    }
    var anim = [];
    /* Eigene Ebene nur für die bewegten Striche: die aufwendigen, stillstehenden Rohre
       müssen dann nicht in jedem Bild neu gezeichnet werden */
    var svgA = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true', focusable: 'false', 'class': 'tube-anim' }, host);
    svgA.style.height = H + 'px';
    host.appendChild(svgA);
    routes.filter(function (q) { return q.back; }).forEach(draw);    /* hinten zuerst */
    routes.filter(function (q) { return !q.back; }).forEach(draw);
    /* Nur Leitungen in der Nähe des sichtbaren Bereichs bewegen sich, der Rest pausiert */
    if (io) io.disconnect();
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.target.style.animationPlayState = e.isIntersecting ? 'running' : 'paused'; });
      }, { rootMargin: '150px 0px' });
      anim.forEach(function (a) { a.style.animationPlayState = 'paused'; io.observe(a); });
    }
  }

  build();
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (window.innerWidth !== lastW || Math.abs(window.innerHeight - lastH) > 150) build();
    }, 250);
  });
  /* Neu aufbauen, sobald sich die Seitenhöhe ändert, z. B. nach dem Freischalten des Profils */
  if ('ResizeObserver' in window) {
    new ResizeObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        /* Nur neu verlegen, wenn sich die Breite ändert oder der Vorrat nicht mehr reicht */
        var hc = measure();
        if (window.innerWidth === lastW && hc <= builtHB) { host.style.height = hc + 'px'; return; }
        build();
      }, 200);
    }).observe(document.body);
  }
})();

(function () {
  var cards = document.querySelectorAll('.glass');
  if (!cards.length) return;
  Array.prototype.forEach.call(cards, function (card) {
  var t;
  function set(e) {
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
  }
  card.addEventListener('pointerenter', set);
  card.addEventListener('pointermove', set);
  card.addEventListener('pointerdown', function (e) {
    set(e);
    if (e.pointerType !== 'mouse') {          /* Touch: Schimmern kurz an der Berührungsstelle */
      card.classList.add('lit');
      clearTimeout(t);
      t = setTimeout(function () { card.classList.remove('lit'); }, 1400);
    }
  });
  });
})();

(function () {
  /* Mini-Terminal: tippt sich selbst, solange es sichtbar ist */
  var pre = document.getElementById('termOut');
  if (!pre) return;
  var script = [
    ['c', 'nslookup toni-kiesel-fisi.dev'],
    ['o', 'Name:    toni-kiesel-fisi.dev'],
    ['o', 'Address: 185.199.108.153'],
    ['o', 'Address: 185.199.109.153'],
    ['c', 'git push origin main'],
    ['k', '\u2713 Seite wird veröffentlicht'],
    ['c', 'python3 moin.py'],
    ['o', 'Moin!']
  ];
  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function line(l) {
    if (l[0] === 'c') return '<span class="p">$</span> ' + esc(l[1]) + '\n';
    return '<span class="' + (l[0] === 'k' ? 'ok' : 'o') + '">' + esc(l[1]) + '</span>\n';
  }
  /* Platz für den kompletten Ablauf vorab reservieren, damit beim Tippen nichts verrutscht */
  function reserve() {
    if (!pre.clientWidth) return;
    pre.style.minHeight = '';
    var keep = pre.innerHTML;
    pre.innerHTML = script.map(line).join('') + '<span class="cur"></span>';
    pre.style.minHeight = pre.offsetHeight + 'px';
    pre.innerHTML = keep;
  }
  /* neu messen, sobald das Terminal sichtbar wird oder seine Breite sich ändert */
  var lastW = 0;
  function check() {
    var w = pre.clientWidth;
    if (w > 0 && w !== lastW) { lastW = w; reserve(); }
  }
  if ('ResizeObserver' in window) new ResizeObserver(function () { requestAnimationFrame(check); }).observe(pre.parentNode);
  window.addEventListener('resize', check);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastW = 0; check(); });
  check();
  var visible = false;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function until() { return new Promise(function (r) { (function chk() {
    if (window.tkNoMotion()) { pre.innerHTML = script.map(line).join(''); return setTimeout(chk, 400); }
    visible ? r() : setTimeout(chk, 300);
  })(); }); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.3 }).observe(pre);
  } else { visible = true; }
  var CUR = '<span class="cur"></span>';
  async function run() {
    while (true) {
      var out = '';
      pre.innerHTML = CUR;
      await sleep(500);
      for (var i = 0; i < script.length; i++) {
        await until();
        var l = script[i];
        if (l[0] === 'c') {
          out += '<span class="p">$</span> ';
          for (var k = 0; k < l[1].length; k++) {
            out += esc(l[1].charAt(k));
            pre.innerHTML = out + CUR;
            await sleep(38 + Math.random() * 55);
          }
          out += '\n';
          pre.innerHTML = out + CUR;
          await sleep(420);
        } else {
          out += line(l);
          pre.innerHTML = out + CUR;
          await sleep(l[0] === 'k' ? 650 : 230);
        }
      }
      await sleep(6500);
    }
  }
  run();
})();

(function () {
  /* Lebenslauf-Röhre: Schlangenlinie um die Kästen, Flüssigkeit füllt sich mit dem Scrollen */
  var cv = document.querySelector('.cv');
  if (!cv) return;
  var NS = 'http://www.w3.org/2000/svg';
  function reduceNow() { return window.tkNoMotion(); }
  var svg, pathEl, maskPath, bub, sheen, dot, total = 0, knots = [], cf = 0, tf = 0, running = false;

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function rounded(pts, r) {
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) {
      var a = pts[i - 1], p = pts[i], b = pts[i + 1];
      var l1 = Math.hypot(p[0] - a[0], p[1] - a[1]), l2 = Math.hypot(b[0] - p[0], b[1] - p[1]);
      var rr = Math.min(r, l1 / 2, l2 / 2);
      d += ' L' + (p[0] + (a[0] - p[0]) / l1 * rr).toFixed(1) + ',' + (p[1] + (a[1] - p[1]) / l1 * rr).toFixed(1) +
           ' Q' + p[0] + ',' + p[1] + ' ' + (p[0] + (b[0] - p[0]) / l2 * rr).toFixed(1) + ',' + (p[1] + (b[1] - p[1]) / l2 * rr).toFixed(1);
    }
    var last = pts[pts.length - 1];
    return d + ' L' + last[0].toFixed(1) + ',' + last[1].toFixed(1);
  }
  /* Bildschirmposition -> Länge entlang der Röhre (Stück für Stück zwischen den Knoten) */
  function mapY(y) {
    if (y <= knots[0][0]) return knots[0][1];
    for (var i = 1; i < knots.length; i++) {
      if (y <= knots[i][0]) {
        var a = knots[i - 1], b = knots[i], span = b[0] - a[0];
        return span <= 0 ? b[1] : a[1] + (b[1] - a[1]) * (y - a[0]) / span;
      }
    }
    return knots[knots.length - 1][1];
  }
  function target() { return mapY(window.innerHeight * 0.6 - cv.getBoundingClientRect().top); }
  function draw(L) {
    if (!pathEl) return;
    maskPath.style.strokeDasharray = L.toFixed(1) + ' ' + (total + 40);
    bub.style.strokeDashoffset = (-L * 1.3).toFixed(1);
    sheen.style.strokeDashoffset = (-L * 0.6).toFixed(1);
    if (!reduceNow() && L > 3 && L < total - 3) {
      var pt = pathEl.getPointAtLength(L);
      dot.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
      dot.style.opacity = 1;
    } else { dot.style.opacity = 0; }
  }
  function frame() {
    cf += (tf - cf) * 0.14;
    if (Math.abs(tf - cf) < 0.3) { cf = tf; running = false; }
    draw(cf);
    if (running) requestAnimationFrame(frame);
  }
  function onScroll() {
    if (!pathEl) return;
    if (reduceNow()) { cf = tf = total; draw(total); return; }
    tf = target();
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  function build() {
    var cards = cv.querySelectorAll('.cv-card');
    var W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H || cards.length < 2) return;
    if (svg && svg.parentNode) svg.parentNode.removeChild(svg);
    svg = el('svg', { 'class': 'cv-svg', viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true', focusable: 'false' }, cv);

    var xL = 9, xR = W - 9, ys = [], gaps = [];
    for (var i = 0; i < cards.length - 1; i++) {
      var b = cards[i].offsetTop + cards[i].offsetHeight, t = cards[i + 1].offsetTop;
      gaps.push([b, t]); ys.push(Math.round((b + t) / 2));
    }
    var pts = [[xL, 0]];
    ys.forEach(function (y, i) {
      var from = (i % 2 === 0) ? xL : xR, to = (i % 2 === 0) ? xR : xL;
      pts.push([from, y]); pts.push([to, y]);
    });
    pts.push([pts[pts.length - 1][0], H]);
    var lc = [0];
    for (var j = 1; j < pts.length; j++) lc.push(lc[j - 1] + Math.abs(pts[j][0] - pts[j - 1][0]) + Math.abs(pts[j][1] - pts[j - 1][1]));
    var d = rounded(pts, 28);

    var defs = el('defs', {}, svg);
    var gl = el('radialGradient', { id: 'cvGlow' }, defs);
    el('stop', { offset: '0', 'stop-color': '#22b4ff', 'stop-opacity': '.8' }, gl);
    el('stop', { offset: '1', 'stop-color': '#22b4ff', 'stop-opacity': '0' }, gl);
    var mask = el('mask', { id: 'cvMask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
    maskPath = el('path', { d: d, fill: 'none', stroke: '#fff', 'stroke-width': 40 }, mask);

    /* weicher Schatten, leere Röhre (Glas), dunkler Kern */
    [[28, 0.10], [23, 0.14], [19, 0.20]].forEach(function (sh) {
      el('path', { d: d, fill: 'none', stroke: 'rgba(0,0,0,' + sh[1] + ')', 'stroke-width': sh[0], transform: 'translate(4 7)' }, svg);
    });
    pathEl = el('path', { d: d, fill: 'none', stroke: 'rgba(150,200,255,.22)', 'stroke-width': 16 }, svg);
    el('path', { d: d, fill: 'none', stroke: 'rgba(8,18,30,.85)', 'stroke-width': 12 }, svg);
    total = pathEl.getTotalLength();

    /* Flüssigkeit: nur bis zur Front sichtbar (Maske) */
    var fg = el('g', { mask: 'url(#cvMask)' }, svg);
    el('path', { d: d, fill: 'none', stroke: '#1ea7ff', 'stroke-opacity': '.75', 'stroke-width': 8 }, fg);
    el('path', { d: d, fill: 'none', stroke: 'rgba(210,245,255,.3)', 'stroke-width': 1.6 }, fg);
    sheen = el('path', { d: d, fill: 'none', stroke: 'rgba(160,225,255,.45)', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-dasharray': '46 174' }, fg);
    bub = el('path', { d: d, fill: 'none', stroke: 'rgba(235,252,255,.9)', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 61 0.1 23 0.1 97 0.1 41' }, fg);

    /* Kupplungen auf den waagerechten Stücken */
    ys.forEach(function (y, k) {
      var x = xL + (xR - xL) * (k % 2 === 0 ? 0.24 : 0.76);
      el('rect', { x: x - 4, y: y - 12, width: 8, height: 24, rx: 2 }, svg)
        .setAttribute('style', 'fill:rgba(14,30,46,.96);stroke:rgba(190,225,255,.45);stroke-width:1.1');
    });

    /* Front der Flüssigkeit: heller Punkt */
    dot = el('g', { style: 'opacity:0' }, svg);
    el('circle', { r: 16, fill: 'url(#cvGlow)' }, dot);
    el('circle', { r: 4.5, fill: '#e6f8ff' }, dot);

    var k2 = total / lc[lc.length - 1];
    knots = [[0, 0]];
    gaps.forEach(function (g, i) { knots.push([g[0], lc[2 * i + 1] * k2]); knots.push([g[1], lc[2 * i + 2] * k2]); });
    knots.push([H, total]);

    cf = tf = reduceNow() ? total : target();
    draw(cf);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { build(); });
  window.addEventListener('tk-motion', function () { build(); });
  var cvW = 0, cvH = 0;
  if ('ResizeObserver' in window) new ResizeObserver(function () {
    requestAnimationFrame(function () {
      if (cv.clientWidth === cvW && cv.clientHeight === cvH) return;
      cvW = cv.clientWidth; cvH = cv.clientHeight; build();
    });
  }).observe(cv);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(build);
  build();
})();

(function () {
  /* Rahmen-Lichtpunkt nur animieren, solange das Foto zu sehen ist */
  var ph = document.querySelector('.intro-photo');
  if (!ph || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (e) { ph.classList.toggle('paused', !e[0].isIntersecting); }).observe(ph);
})();

/* Telefonnummer: steht nur verschlüsselt im Code und wird erst bei Hover, Fokus oder Antippen eingeblendet */
(function () {
  var el = document.getElementById('phone');
  if (!el) return;
  var val = el.querySelector('.phone-val'), hint = val.textContent, num = null, shown = false;
  function decode() {
    if (!num) num = el.getAttribute('data-p').split(',').map(function (c) { return String.fromCharCode(c - 11); }).reverse().join('');
    return num;
  }
  var timer = null;
  function set(text) {
    clearTimeout(timer);
    val.classList.add('swap');
    timer = setTimeout(function () { val.textContent = text; val.classList.remove('swap'); }, 150);
  }
  function kbFocus() { try { return el.matches(':focus-visible'); } catch (e) { return false; } }
  function show() {
    if (shown) return; shown = true;
    var n = decode();
    el.classList.add('shown');
    el.setAttribute('href', 'tel:' + n.replace(/\s/g, ''));
    el.removeAttribute('role');
    el.setAttribute('aria-label', 'Anrufen: ' + n);
    set(n);
  }
  function hide() {
    if (!shown) return; shown = false;
    el.classList.remove('shown', 'copied'); clearTimeout(backT); if (live) live.textContent = '';
    el.removeAttribute('href');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Telefonnummer anzeigen');
    set(hint);
  }
  var touch = false;
  /* Am Computer kopiert ein Klick die Nummer, auf dem Handy ruft Antippen direkt an */
  var desk = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (desk) el.classList.add('can-copy');
  var live = document.getElementById('phoneLive'), backT = null;
  function fallback(t) {
    var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta); return ok;
  }
  function copied(ok) {
    clearTimeout(backT);
    el.classList.toggle('copied', ok);
    set(ok ? 'Kopiert ✓' : num);
    if (live) live.textContent = ok ? 'Telefonnummer kopiert' : '';
    backT = setTimeout(function () { el.classList.remove('copied'); if (live) live.textContent = ''; if (shown) set(num); }, 1400);
  }
  function copy() {
    var n = decode();
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(n).then(function () { copied(true); }, function () { copied(fallback(n)); });
    else copied(fallback(n));
  }
  el.addEventListener('pointerdown', function (e) { touch = e.pointerType !== 'mouse'; });
  el.addEventListener('mouseenter', function () { if (!touch) show(); });
  el.addEventListener('mouseleave', function () { if (!touch && !kbFocus()) hide(); });
  el.addEventListener('focus', function () { if (!touch && kbFocus()) show(); });
  el.addEventListener('blur', function () { if (!el.matches(':hover')) hide(); });
  document.addEventListener('pointerdown', function (e) { if (shown && !el.contains(e.target)) hide(); });
  el.addEventListener('click', function (e) {
    if (!shown || !el.getAttribute('href')) { e.preventDefault(); show(); return; }
    if (desk && !touch) { e.preventDefault(); copy(); }
  });
  el.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (!shown) { e.preventDefault(); show(); } else if (desk) { e.preventDefault(); copy(); }
  });
})();

/* Inhaltsverzeichnis: öffnen, schließen, zum Abschnitt springen und aktuellen Abschnitt markieren */
(function () {
  var btn = document.getElementById('navBtn'), panel = document.getElementById('navPanel');
  if (!btn || !panel) return;
  var links = Array.prototype.slice.call(panel.querySelectorAll('a'));
  function open() {
    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add('open'); });
    btn.setAttribute('aria-expanded', 'true');
    (panel.querySelector('a[aria-current="true"]') || links[0]).focus();
  }
  function close(back) {
    panel.classList.remove('open'); panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (back) btn.focus();
  }
  btn.addEventListener('click', function () { panel.hidden ? open() : close(false); });
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) close(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(true); });
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault(); close(false);
      var slow = !(window.tkNoMotion && window.tkNoMotion());
      t.scrollIntoView({ behavior: slow ? 'smooth' : 'instant', block: 'start' });
      t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
    });
  });
  /* Markiert den Abschnitt, der gerade in der Bildschirmmitte liegt */
  if ('IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[en.target.id]; if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }
})();

/* Zurück zum Anfang des Profils */
(function () {
  var b = document.getElementById('toTop'), intro = document.getElementById('intro');
  if (!b) return;
  b.addEventListener('click', function () {
    var slow = !(window.tkNoMotion && window.tkNoMotion());
    var bar = document.querySelector('.topbar');
    var y = intro ? intro.getBoundingClientRect().top + window.scrollY - (bar ? bar.offsetHeight : 0) : 0;
    window.scrollTo({ top: Math.max(0, y), behavior: slow ? 'smooth' : 'instant' });
    if (intro) { intro.setAttribute('tabindex', '-1'); intro.focus({ preventScroll: true }); }
  });
})();

/* Impressum & Datenschutz: weich auf- und zuklappen (Höhe animiert per Web Animations API) */
(function () {
  var box = document.querySelector('.legal');
  if (!box || !box.animate) return;
  var sum = box.querySelector('summary'), body = box.querySelector('.legal-body'), anim = null;
  var ease = 'cubic-bezier(.4,0,.2,1)';
  sum.addEventListener('click', function (e) {
    e.preventDefault();
    if (window.tkNoMotion && window.tkNoMotion()) { box.open = !box.open; return; }
    var opening = !box.open || box.classList.contains('closing');
    var from = box.open ? body.getBoundingClientRect().height : 0;
    if (anim) anim.cancel();
    box.classList.toggle('closing', !opening);
    box.open = true;
    var to = opening ? body.scrollHeight : 0;
    anim = body.animate(
      [{ height: from + 'px', opacity: opening ? (from ? 1 : 0) : 1 }, { height: to + 'px', opacity: opening ? 1 : 0 }],
      { duration: Math.max(220, Math.min(480, Math.abs(to - from) * .9)), easing: ease }
    );
    anim.onfinish = function () {
      anim = null;
      if (!opening) { box.open = false; box.classList.remove('closing'); }
    };
  });
})();

/* Kontaktformular: prüft Pflichtfelder und sendet ohne Seitenwechsel an Formspree */
(function () {
  var form = document.getElementById('contactForm');
  if (!form || !window.fetch || !window.FormData) return;
  form.setAttribute('novalidate', '');
  var status = document.getElementById('cfStatus');
  var btn = form.querySelector('button[type="submit"]');
  var label = btn.textContent;
  var fields = Array.prototype.slice.call(form.querySelectorAll('[required]'));
  function ok(el) {
    var v = el.value.trim();
    if (!v) return false;
    if (el.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    return true;
  }
  function mark(el) {
    var good = ok(el);
    el.closest('.field').classList.toggle('bad', !good);
    el.setAttribute('aria-invalid', String(!good));
    return good;
  }
  fields.forEach(function (el) {
    el.addEventListener('blur', function () { if (el.value.trim()) mark(el); });
    el.addEventListener('input', function () { if (el.closest('.field').classList.contains('bad')) mark(el); });
  });
  function say(text, kind) { status.textContent = text; status.className = 'form-status' + (kind ? ' ' + kind : ''); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    fields.forEach(function (el) { if (!mark(el) && !first) first = el; });
    if (first) { say('Bitte prüf die markierten Felder.', 'err'); first.focus(); return; }
    btn.disabled = true; btn.textContent = 'Wird gesendet …'; say('');
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset();
        say('Danke! Deine Nachricht ist angekommen, ich melde mich bald bei dir.', 'ok');
      })
      .catch(function () {
        say('Das hat leider nicht geklappt. Versuch es bitte gleich nochmal oder schreib mir an kiesel.99@protonmail.com.', 'err');
      })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });
})();

(function () {
  var root = document.documentElement;
  var gear = document.getElementById('gear');
  var panel = document.getElementById('settings');
  if (!gear || !panel) return;
  var sMotion = document.getElementById('setMotion');
  var sSkip = document.getElementById('setSkip');
  var sTritan = document.getElementById('setTritan');
  var sLight = document.getElementById('setLight');
  var os = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function sync() {
    sMotion.setAttribute('aria-checked', String(!root.classList.contains('no-motion')));
    sSkip.setAttribute('aria-checked', String(get('tk-skip') === '1'));
    sTritan.setAttribute('aria-checked', String(root.classList.contains('tritan')));
    sLight.setAttribute('aria-checked', String(root.classList.contains('light')));
  }
  function open() {
    sync();
    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add('open'); });
    gear.setAttribute('aria-expanded', 'true');
    sLight.focus();
  }
  function close(back) {
    panel.classList.remove('open');
    panel.hidden = true;
    gear.setAttribute('aria-expanded', 'false');
    if (back) gear.focus();
  }
  gear.addEventListener('click', function () { panel.hidden ? open() : close(false); });
  document.addEventListener('click', function (e) {
    if (panel.hidden) return;
    if (panel.contains(e.target) || gear.contains(e.target) || (e.target.closest && e.target.closest('[data-open-settings]'))) return;
    close(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(true); });
  var note = document.querySelector('.revisit');
  if (note && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e, o) {
      if (!e[0].isIntersecting) return;
      o.disconnect();
      note.classList.add('pulse');
      setTimeout(function () { note.classList.remove('pulse'); }, 2200);
    }, { threshold: 0.8 }).observe(note);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-open-settings]'), function (b) {
    b.addEventListener('click', function () { open(); });
  });

  sMotion.addEventListener('click', function () {
    var on = root.classList.contains('no-motion');          /* war aus -> jetzt an */
    root.classList.toggle('no-motion', !on);
    if (on) put('tk-motion', os ? 'on' : null); else put('tk-motion', 'off');
    sync();
    window.dispatchEvent(new Event('tk-motion'));
  });
  sSkip.addEventListener('click', function () {
    put('tk-skip', get('tk-skip') === '1' ? null : '1');
    sync();
  });
  sLight.addEventListener('click', function () {
    var on = !root.classList.contains('light');
    root.classList.toggle('light', on);
    put('tk-light', on ? '1' : null);
    sync();
  });
  sTritan.addEventListener('click', function () {
    var on = !root.classList.contains('tritan');
    root.classList.toggle('tritan', on);
    put('tk-tritan', on ? '1' : null);
    sync();
  });
})();
