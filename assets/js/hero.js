// sujalnegi.tech: the desk. Every object is its own layer. Touch one and only that one breaks apart:
// it pixelates, turns into falling code, then pulls itself back together. Hit-testing uses each image's
// own transparency, so you touch the drone, not the empty box around it.
(() => {
  'use strict';
  const SN = window.SN || {};
  const scene = document.querySelector('.scene');
  if (!scene) return;
  const reduce = SN.reduce, rnd = SN.rnd, GLYPHS = SN.GLYPHS;
  const RAMP = ' .:-=+*#%@';
  const tip = scene.querySelector('.tip'), tipB = tip.querySelector('b'), tipS = tip.querySelector('span');
  const small = () => window.matchMedia('(max-width: 700px)').matches;
  const DUR = 1700;

  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });

  class Layer {
    constructor(el) {
      this.el = el; this.cv = document.createElement('canvas'); el.prepend(this.cv);
      this.ctx = this.cv.getContext('2d'); this.t0 = 0; this.running = false; this.ready = false;
      this.frame = el.hasAttribute('data-frame');
    }
    async load() {
      const src = small() && this.el.dataset.srcSm ? this.el.dataset.srcSm : this.el.dataset.src;
      this.img = await loadImg(src); this.ready = true; this.size();
    }
    visible() { return this.el.offsetParent !== null && this.el.offsetWidth > 0; }
    size() {
      if (!this.ready || !this.visible()) return;
      const d = SN.dpr(), w = this.el.offsetWidth, h = this.el.offsetHeight;
      this.w = Math.max(1, Math.round(w * d)); this.h = Math.max(1, Math.round(h * d)); this.d = d;
      this.cv.width = this.w; this.cv.height = this.h;
      // the finished look, drawn once: the image, or a small app window around a screenshot
      const src = (this.src = document.createElement('canvas')); src.width = this.w; src.height = this.h;
      const c = src.getContext('2d');
      if (this.frame) {
        const r = 7 * d, bar = Math.round(this.h * .085);
        c.fillStyle = '#11131a'; c.beginPath(); c.roundRect ? c.roundRect(0, 0, this.w, this.h, r) : c.rect(0, 0, this.w, this.h); c.fill();
        c.save(); c.beginPath(); c.rect(1, bar, this.w - 2, this.h - bar - 1); c.clip();
        c.drawImage(this.img, 0, bar, this.w, this.w * this.img.height / this.img.width); c.restore();
        ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(bar * .55 + i * bar * .5, bar / 2, bar * .14, 0, 7); c.fill(); });
        c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = d; c.strokeRect(.5, .5, this.w - 1, this.h - 1);
      } else c.drawImage(this.img, 0, 0, this.w, this.h);
      // a coarse alpha map for hit-testing, and the code grid used by the effect
      const data = c.getImageData(0, 0, this.w, this.h).data;
      const cell = (this.cell = Math.max(6, Math.round((small() ? 6.5 : 8) * d)));
      this.cols = Math.ceil(this.w / cell); this.rows = Math.ceil(this.h / cell);
      this.grid = new Float32Array(this.cols * this.rows * 2);
      for (let gy = 0; gy < this.rows; gy++) for (let gx = 0; gx < this.cols; gx++) {
        let a = 0, l = 0, n = 0;
        for (let y = gy * cell; y < Math.min(this.h, (gy + 1) * cell); y += 2) for (let x = gx * cell; x < Math.min(this.w, (gx + 1) * cell); x += 2) {
          const i = (y * this.w + x) * 4, al = data[i + 3] / 255;
          a += al; l += al * (.3 * data[i] + .59 * data[i + 1] + .11 * data[i + 2]) / 255; n++;
        }
        const k = (gy * this.cols + gx) * 2; this.grid[k] = n ? a / n : 0; this.grid[k + 1] = a ? l / a : 0;
      }
      this.fall = Float32Array.from({ length: this.cols }, () => .3 + Math.random());
      this.chars = Array.from({ length: this.cols * this.rows }, () => rnd(GLYPHS));
      this.draw(this.running ? (performance.now() - this.t0) / DUR : 1);
    }
    alphaAt(px, py) {           // px, py in CSS pixels inside the element
      if (!this.grid) return 0;
      const gx = Math.floor(px * this.d / this.cell), gy = Math.floor(py * this.d / this.cell);
      if (gx < 0 || gy < 0 || gx >= this.cols || gy >= this.rows) return 0;
      return this.grid[(gy * this.cols + gx) * 2];
    }
    ascii(alpha, fall, flicker) {
      const { ctx, cell, cols, rows, grid, chars } = this;
      ctx.font = `500 ${Math.round(cell * 1.08)}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textBaseline = 'top';
      for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
        const k = gy * cols + gx, a = grid[k * 2];
        if (a < .22) continue;
        const l = grid[k * 2 + 1];
        if (Math.random() < flicker) chars[k] = Math.random() < .5 ? rnd(GLYPHS) : RAMP[Math.min(9, 2 + Math.round(l * 7))];
        const dy = fall * this.fall[gx] * cell * 9 * (.4 + gy / rows);
        const al = alpha * Math.min(1, a * 1.3) * (1 - fall * .55);
        if (al < .03) continue;
        const gold = (gx * 7 + gy * 13) % 11 === 0;
        ctx.fillStyle = gold ? `rgba(240,211,140,${al.toFixed(3)})` : `rgba(${Math.round(150 + l * 105)},${Math.round(160 + l * 95)},255,${al.toFixed(3)})`;
        ctx.fillText(chars[k], gx * cell, gy * cell + dy);
      }
    }
    // p: 0..1 through the effect; p = 1 is the plain image.
    // A scanning beam runs down the object and turns it into code, holds, then runs again and rebuilds it.
    draw(p) {
      if (!this.src) return;
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);
      if (p >= 1) { ctx.drawImage(this.src, 0, 0); return; }
      const ease = (x) => x * x * (3 - 2 * x);
      let y, codeAbove;
      if (p < .42) { y = ease(p / .42) * h; codeAbove = true; }
      else if (p < .55) { y = h; codeAbove = true; }
      else { y = ease((p - .55) / .45) * h; codeAbove = false; }
      const part = (top, bottom, code) => {
        if (bottom <= top) return;
        ctx.save(); ctx.beginPath(); ctx.rect(0, top, w, bottom - top); ctx.clip();
        if (code) this.ascii(1, 0, p > .42 && p < .55 ? .3 : .12); else ctx.drawImage(this.src, 0, 0);
        ctx.restore();
      };
      part(0, y, codeAbove); part(y, h, !codeAbove);
      if (y > 0 && y < h) {                         // the beam itself, only where the object is
        ctx.save(); ctx.globalCompositeOperation = 'source-atop';
        const band = 16 * this.d, g = ctx.createLinearGradient(0, y - band, 0, y + 2);
        g.addColorStop(0, 'rgba(240,211,140,0)'); g.addColorStop(1, 'rgba(240,211,140,.55)');
        ctx.fillStyle = g; ctx.fillRect(0, y - band, w, band + 2);
        ctx.fillStyle = 'rgba(255,236,190,.95)'; ctx.fillRect(0, y, w, Math.max(1, 1.5 * this.d));
        ctx.restore();
      }
    }
    play(from = 0) {
      if (!this.ready || reduce) return;
      if (this.running) return;
      this.running = true; this.t0 = performance.now() - from * DUR;
      const step = (now) => {
        const p = (now - this.t0) / DUR;
        this.draw(Math.min(1, p));
        if (p < 1) requestAnimationFrame(step); else { this.running = false; this.until = now + 350; }
      };
      requestAnimationFrame(step);
    }
  }

  const els = Array.from(scene.querySelectorAll('.lay'));
  const layers = els.map((el) => new Layer(el));
  const byEl = new Map(layers.map((l) => [l.el, l]));
  els.forEach((el) => { el.style.pointerEvents = 'none'; });   // the scene does the hit-testing

  // the front-most layer whose own pixels are under the pointer
  const order = () => layers.filter((l) => l.visible()).sort((a, b) => (+getComputedStyle(b.el).zIndex || 0) - (+getComputedStyle(a.el).zIndex || 0));
  let stack = [];
  const pick = (x, y) => {
    for (const l of stack) {
      const r = l.el.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      if (l.alphaAt(x - r.left, y - r.top) > .35) return l;
    }
    return null;
  };

  let hot = null, tipFor = null;
  const showTip = (l) => {
    if (!l) { tip.classList.remove('on'); tipFor = null; return; }
    tipB.textContent = l.el.dataset.label; tipS.textContent = l.el.dataset.note || '';
    const sr = scene.getBoundingClientRect(), r = l.el.getBoundingClientRect();
    tip.style.visibility = 'hidden'; tip.classList.add('on');
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.left - sr.left + r.width / 2 - tw / 2, y = r.top - sr.top - th - 10;
    if (l.el.classList.contains('lay-me')) y = r.top - sr.top + r.height * .02;
    if (y < 0) y = r.bottom - sr.top + 8;
    x = Math.max(4, Math.min(sr.width - tw - 4, x));
    tip.style.transform = ''; tip.style.left = `${x}px`; tip.style.top = `${y}px`; tip.style.visibility = '';
    tipFor = l;
  };
  const enter = (l) => {
    if (l === hot) return;
    hot = l; scene.style.cursor = l ? 'pointer' : '';
    if (l) { if (!(l.until > performance.now())) l.play(); showTip(l); } else showTip(null);
  };

  scene.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') enter(pick(e.clientX, e.clientY)); }, { passive: true });
  scene.addEventListener('pointerleave', () => enter(null));
  const go = (el) => {
    const href = el.getAttribute('href');
    if (href === '#words-open') { SN.openRoom && SN.openRoom('words', el); return; }
    if (href.startsWith('#')) { const t = document.querySelector(href); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
    window.open(href, '_blank', 'noopener');
  };
  // mouse: click opens. touch: the first tap breaks it apart and shows what it is, a second tap opens it.
  let lastTouch = null, lastType = 'mouse';
  scene.addEventListener('pointerdown', (e) => { lastType = e.pointerType; }, { passive: true });
  scene.addEventListener('click', (e) => {
    if (e.target.closest('.lay') && e.detail === 0) return;   // keyboard: the link does its own thing
    const l = pick(e.clientX, e.clientY);
    if (!l) { showTip(null); lastTouch = null; return; }
    e.preventDefault();
    if (lastType !== 'mouse' && lastTouch !== l) { lastTouch = l; hot = l; l.play(); showTip(l); return; }
    lastTouch = null; go(l.el);
  });
  els.forEach((el) => {
    el.addEventListener('focus', () => { const l = byEl.get(el); l.play(); showTip(l); });
    el.addEventListener('blur', () => showTip(null));
    el.addEventListener('click', (e) => { if (el.getAttribute('href') === '#words-open') { e.preventDefault(); go(el); } });
  });

  // load everything, then let the desk assemble itself out of code
  Promise.all(layers.map((l) => l.load().catch(() => {}))).then(() => {
    stack = order();
    layers.forEach((l) => l.draw(reduce ? 1 : .5));
    SN.whenReady(() => {
      if (reduce) return;
      layers.forEach((l, i) => setTimeout(() => l.play(.5), 120 + i * 90));
    });
  });
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => {
    layers.forEach((l) => { const want = small() && l.el.dataset.srcSm ? l.el.dataset.srcSm : l.el.dataset.src; if (l.img && !l.img.src.endsWith(want)) l.load(); else l.size(); });
    stack = order(); if (tipFor) showTip(tipFor);
  }, 160); });

  // now and then, one small thing on the desk glitches by itself
  if (!reduce) {
    let it = 0;
    SN.onVisible(scene, () => {
      if (it) return;
      it = setInterval(() => {
        if (document.hidden || hot) return;
        const pool = stack.filter((l) => !l.el.classList.contains('lay-me') && !l.running);
        if (pool.length) rnd(pool).play();
      }, 4200);
    }, () => { clearInterval(it); it = 0; });
  }
})();
