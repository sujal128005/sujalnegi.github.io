// sujalnegi.tech: the project slider (with two live demos), the monitor that says hello, and the Nexara9 card.
(() => {
  'use strict';
  const SN = window.SN || {};
  const reduce = SN.reduce, rnd = SN.rnd || ((s) => s[(Math.random() * s.length) | 0]), GLYPHS = SN.GLYPHS || '#%&@*+=-:.';

  // ---------------- project slider ----------------
  const deck = document.querySelector('.deck');
  if (deck) {
    const track = deck.querySelector('.deck-track'), slides = Array.from(track.children);
    const count = deck.querySelector('.deck-count b'), N = slides.length;
    let i = 0;
    const go = (n) => {
      i = (n + N) % N;
      track.style.transform = `translateX(${-i * 100}%)`;
      slides.forEach((s, k) => { s.classList.toggle('on', k === i); s.inert = k !== i; s.setAttribute('aria-hidden', k !== i); });
      count.textContent = String(i + 1).padStart(2, '0');
    };
    deck.querySelector('.prev').addEventListener('click', () => go(i - 1));
    deck.querySelector('.next').addEventListener('click', () => go(i + 1));
    deck.addEventListener('keydown', (e) => {
      if (e.target.matches('input')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
    });
    let sx = null, sy = null;
    track.addEventListener('touchstart', (e) => { if (e.target.matches('input')) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(i + (dx < 0 ? 1 : -1));
    }, { passive: true });
    go(0);
  }

  // ---------------- Limen: the contract only settles between the seller floor and the buyer ceiling ----------------
  const range = document.getElementById('limen-price');
  if (range) {
    const out = document.getElementById('limen-out'), verdict = document.getElementById('limen-verdict'), pin = document.querySelector('.limen-pin');
    const FLOOR = 360000, CEIL = 480000, MIN = +range.min, MAX = +range.max;
    const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
    const update = () => {
      const v = +range.value, ok = v >= FLOOR && v <= CEIL;
      out.textContent = inr(v); pin.style.left = `${((v - MIN) / (MAX - MIN)) * 100}%`; pin.classList.toggle('no', !ok);
      verdict.className = `verdict ${ok ? 'ok' : 'no'}`;
      verdict.textContent = ok ? 'Within limits. Escrow can settle.' : v > CEIL ? 'Blocked. Above the buyer ceiling, so the contract refuses to settle.' : 'Blocked. Below the seller floor, so the contract refuses to settle.';
    };
    range.addEventListener('input', update); update();
  }

  // ---------------- Khata: check the sample claims one by one ----------------
  const run = document.getElementById('khata-run');
  if (run) {
    const vs = Array.from(document.querySelectorAll('#khata-call .verdict'));
    let checked = false;
    run.addEventListener('click', () => {
      checked = !checked;
      run.textContent = checked ? 'Reset the call' : 'Check the claims';
      vs.forEach((el, k) => {
        const apply = () => { el.className = `verdict ${checked ? el.dataset.v : 'wait'}`; el.textContent = checked ? el.dataset.say : 'Waiting to check'; };
        if (checked && !reduce) { el.textContent = 'Checking…'; setTimeout(apply, 260 + k * 320); } else apply();
      });
    });
  }

  // ---------------- the monitor: my face in amber code; Play says hello (a real video can drop in later) ----------------
  const mon = document.querySelector('.mon');
  if (mon) {
    const cv = mon.querySelector('.mon-cv'), ctx = cv.getContext('2d'), btn = mon.querySelector('.mon-play'), cap = mon.querySelector('.mon-cap');
    const audio = document.querySelector('.mon-audio'), video = mon.querySelector('.mon-video');
    const CUES = [[0.35, 1.47, "Hi, I'm Sujal."], [2.24, 2.69, 'A proper video from me is coming soon.'], [5.35, 3.35, 'Until then, look around. Everything here, I built.']];
    const RAMP = ' .,:;-=+*#%@';
    let grid = null, cols = 0, rows = 0, W = 0, H = 0, d = 1, raf = 0, on = false, level = null, amp = 0;
    const img = new Image(); img.src = 'assets/img/sujal-desk-sm.webp';
    const build = () => {
      if (!img.complete || !img.naturalWidth) return;
      d = SN.dpr ? SN.dpr() : 1; W = mon.clientWidth; H = mon.clientHeight;
      cv.width = Math.round(W * d); cv.height = Math.round(H * d);
      const cell = Math.max(5, Math.round(W / 104));
      cols = Math.ceil(W / cell); rows = Math.ceil(H / (cell * 1.25));
      // head and shoulders from the desk photo
      const sw = img.naturalWidth * .86, sh = sw * (rows * 1.25) / cols, sx = 0, sy = img.naturalHeight * .02;
      const t = document.createElement('canvas'); t.width = cols; t.height = rows;
      const c = t.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, cols, rows);
      c.drawImage(img, sx, sy, sw, Math.min(sh, img.naturalHeight - sy), cols * .14, 0, cols * .86, rows * Math.min(1, (img.naturalHeight - sy) / sh));
      const data = c.getImageData(0, 0, cols, rows).data;
      grid = new Float32Array(cols * rows);
      for (let k = 0; k < grid.length; k++) grid[k] = (.3 * data[k * 4] + .59 * data[k * 4 + 1] + .11 * data[k * 4 + 2]) / 255;
      mon._cell = cell; draw(performance.now());
    };
    const draw = (now) => {
      raf = 0;
      if (!grid) return;
      const cell = mon._cell, t = now / 1000;
      const target = level ? level() : 0; amp += (target - amp) * .3;
      ctx.setTransform(d, 0, 0, d, 0, 0); ctx.fillStyle = '#050402'; ctx.fillRect(0, 0, W, H);
      ctx.font = `500 ${Math.round(cell * 1.18)}px "JetBrains Mono", ui-monospace, monospace`; ctx.textBaseline = 'top';
      const scan = (t * .22) % 1.2;
      for (let y = 0; y < rows; y++) {
        const band = Math.max(0, 1 - Math.abs(y / rows - scan) * 14);
        for (let x = 0; x < cols; x++) {
          const l = Math.min(1, grid[y * cols + x] * 1.5);
          if (l < .1) continue;
          let ch = RAMP[Math.min(RAMP.length - 1, Math.round(l * (RAMP.length - 1)))];
          if (!reduce && Math.random() < .004 + amp * .05) ch = rnd(GLYPHS);
          const a = Math.min(1, .25 + l * .85 + band * .35 + amp * .25);
          ctx.fillStyle = `rgba(${240},${Math.round(180 + l * 40)},${Math.round(90 + l * 50)},${a.toFixed(3)})`;
          ctx.fillText(ch, x * cell, y * cell * 1.25);
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);   // scanlines
      if (!audio.paused) {
        let ci = -1; for (let k = 0; k < CUES.length; k++) if (audio.currentTime >= CUES[k][0] - .05) ci = k;
        cap.textContent = ci >= 0 ? CUES[ci][2] : '';
      }
      if (on && !reduce) raf = requestAnimationFrame(draw);
    };
    img.addEventListener('load', build);
    if (img.complete) build();
    SN.onVisible ? SN.onVisible(mon, () => { on = true; if (!raf) raf = requestAnimationFrame(draw); }, () => { on = false; cancelAnimationFrame(raf); raf = 0; }) : (on = true);
    window.addEventListener('resize', () => { clearTimeout(build._t); build._t = setTimeout(build, 150); });
    btn.addEventListener('click', () => {
      const vsrc = mon.dataset.video;
      mon.classList.add('playing');
      if (vsrc) {                                   // when a real video exists: <div class="mon" data-video="assets/video/hello.mp4">
        video.src = vsrc; video.hidden = false; video.controls = true; video.play().catch(() => {});
        video.addEventListener('ended', () => mon.classList.remove('playing'), { once: true });
        return;
      }
      level = SN.analyse ? SN.analyse(audio) : null;
      SN.resumeAudio && SN.resumeAudio();
      audio.currentTime = 0; audio.play().catch(() => mon.classList.remove('playing'));
      if (reduce) { const tick = () => { draw(performance.now()); if (!audio.paused) setTimeout(tick, 200); }; tick(); }
    });
    audio.addEventListener('ended', () => { mon.classList.remove('playing'); cap.textContent = ''; btn.querySelector('span').textContent = 'Again'; });
  }

  // ---------------- Nexara9 card: a "9" made of code that shimmers ----------------
  const n9 = document.querySelector('.n9-cv');
  if (n9) {
    const card = n9.closest('.n9-card'), ctx = n9.getContext('2d');
    let W = 0, H = 0, d = 1, cell = 12, cols = 0, rows = 0, mask = null, chars = null, raf = 0, on = false, hover = 0, last = 0;
    const build = () => {
      d = SN.dpr ? SN.dpr() : 1; W = n9.clientWidth; H = n9.clientHeight; if (!W || !H) return;
      n9.width = Math.round(W * d); n9.height = Math.round(H * d);
      cell = W < 400 ? 9 : 11; cols = Math.ceil(W / cell); rows = Math.ceil(H / (cell * 1.2));
      const t = document.createElement('canvas'); t.width = cols; t.height = rows; const c = t.getContext('2d');
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `600 ${Math.round(rows * 1.02)}px "Inter Tight", Arial, sans-serif`; c.fillText('9', cols * .6, rows * .54);
      const data = c.getImageData(0, 0, cols, rows).data;
      mask = new Float32Array(cols * rows); for (let k = 0; k < mask.length; k++) mask[k] = data[k * 4 + 3] / 255;
      chars = Array.from({ length: mask.length }, () => rnd(GLYPHS));
      draw(performance.now());
    };
    const draw = (now) => {
      raf = 0;
      if (!mask) return;
      if (now - last > 50 || reduce) {
        last = now;
        const t = now / 1000;
        ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
        ctx.font = `500 ${cell}px "JetBrains Mono", ui-monospace, monospace`; ctx.textBaseline = 'top';
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const k = y * cols + x, m = mask[k];
          const wave = .5 + .5 * Math.sin(x * .25 - y * .18 + t * 2.2);
          if (m < .3) { if (Math.random() < .002) chars[k] = rnd(GLYPHS); if ((x * 31 + y * 17) % 9) continue; ctx.fillStyle = `rgba(255,255,255,${(.04 + wave * .04).toFixed(3)})`; ctx.fillText(chars[k], x * cell, y * cell * 1.2); continue; }
          if (Math.random() < .03 + hover * .2) chars[k] = rnd(GLYPHS);
          ctx.fillStyle = `rgba(240,211,140,${(.35 + wave * .55 + hover * .1).toFixed(3)})`;
          ctx.fillText(chars[k], x * cell, y * cell * 1.2);
        }
      }
      if (on && !reduce) raf = requestAnimationFrame(draw);
    };
    card.addEventListener('mouseenter', () => { hover = 1; }); card.addEventListener('mouseleave', () => { hover = 0; });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
    SN.onVisible ? SN.onVisible(card, () => { on = true; if (!raf) raf = requestAnimationFrame(draw); }, () => { on = false; cancelAnimationFrame(raf); raf = 0; }) : (on = true);
    window.addEventListener('resize', () => { clearTimeout(build._t); build._t = setTimeout(build, 150); });
  }

  // ---------------- the big name in the footer scrambles under your cursor ----------------
  const fname = document.querySelector('[data-scramble-hover]');
  if (fname && SN.scramble) {
    const parts = Array.from(fname.querySelectorAll('span'));
    fname.addEventListener('mouseenter', () => parts.forEach((p, k) => setTimeout(() => SN.scramble(p, { duration: 650 }), k * 120)));
  }
})();
