// sujalnegi.tech: the project slider (with two live demos), the monitor that says hello, and the Nexara9 card.
(() => {
  'use strict';
  const SN = window.SN || {};
  const reduce = SN.reduce, rnd = SN.rnd || ((s) => s[(Math.random() * s.length) | 0]), GLYPHS = SN.GLYPHS || '#%&@*+=-:.';

  // ---------------- project slider ----------------
  const deck = document.querySelector('.deck');
  if (deck) {
    const track = deck.querySelector('.deck-track'), slides = Array.from(track.children);
    const count = deck.querySelector('.deck-count b'), prog = deck.querySelector('.deck-prog i'), N = slides.length;
    const tabs = Array.from(deck.querySelectorAll('.deck-tabs button'));
    let i = 0;
    const go = (n) => {
      i = (n + N) % N;
      track.style.transform = `translateX(${-i * 100}%)`;
      slides.forEach((s, k) => { s.classList.toggle('on', k === i); s.inert = k !== i; s.setAttribute('aria-hidden', k !== i); });
      count.textContent = String(i + 1).padStart(2, '0');
      if (prog) prog.style.width = `${((i + 1) / N) * 100}%`;
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
    };
    tabs.forEach((t, k) => t.addEventListener('click', () => go(k)));
    deck.querySelector('.prev').addEventListener('click', () => go(i - 1));
    deck.querySelector('.next').addEventListener('click', () => go(i + 1));
    deck.addEventListener('keydown', (e) => {
      if (e.target.matches('input')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
    });
    let sx = null, sy = null;
    const startAt = location.hash.match(/^#work-(\d)$/); if (startAt) i = +startAt[1] - 1;
    track.addEventListener('touchstart', (e) => { if (e.target.matches('input')) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(i + (dx < 0 ? 1 : -1));
    }, { passive: true });
    go(i);
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

  // ---------------- the monitor: my face in amber code; Play shows the 22-second intro video ----------------
  const mon = document.querySelector('.mon');
  if (mon) {
    const cv = mon.querySelector('.mon-cv'), ctx = cv.getContext('2d'), video = mon.querySelector('.mon-video'), btn = mon.querySelector('.mon-play');
    const RAMP = ' .,:;-=+*#%@';
    let grid = null, cols = 0, rows = 0, W = 0, H = 0, d = 1, cell = 8, raf = 0, on = false;
    const img = new Image(); img.src = 'assets/img/sujal-desk-sm.webp';
    const build = () => {
      if (!img.complete || !img.naturalWidth) return;
      d = SN.dpr ? SN.dpr() : 1; W = mon.clientWidth; H = mon.clientHeight; if (!W || !H) return;
      cv.width = Math.round(W * d); cv.height = Math.round(H * d);
      cell = Math.max(5, Math.round(W / 104));
      cols = Math.ceil(W / cell); rows = Math.ceil(H / (cell * 1.25));
      // head and shoulders from the desk photo, a little right of centre
      const sw = img.naturalWidth * .86, sh = sw * (rows * 1.25) / cols, sy = img.naturalHeight * .02;
      const t = document.createElement('canvas'); t.width = cols; t.height = rows;
      const c = t.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, cols, rows);
      c.drawImage(img, 0, sy, sw, Math.min(sh, img.naturalHeight - sy), cols * .14, 0, cols * .86, rows * Math.min(1, (img.naturalHeight - sy) / sh));
      const data = c.getImageData(0, 0, cols, rows).data;
      grid = new Float32Array(cols * rows);
      for (let k = 0; k < grid.length; k++) grid[k] = (.3 * data[k * 4] + .59 * data[k * 4 + 1] + .11 * data[k * 4 + 2]) / 255;
      draw(performance.now());
    };
    const draw = (now) => {
      raf = 0;
      if (!grid) return;
      const t = now / 1000;
      ctx.setTransform(d, 0, 0, d, 0, 0); ctx.fillStyle = '#050402'; ctx.fillRect(0, 0, W, H);
      ctx.font = `500 ${Math.round(cell * 1.18)}px "IBM Plex Mono", ui-monospace, monospace`; ctx.textBaseline = 'top';
      const scan = (t * .22) % 1.2;
      for (let y = 0; y < rows; y++) {
        const band = Math.max(0, 1 - Math.abs(y / rows - scan) * 14);
        for (let x = 0; x < cols; x++) {
          const l = Math.min(1, grid[y * cols + x] * 1.5);
          if (l < .1) continue;
          let ch = RAMP[Math.min(RAMP.length - 1, Math.round(l * (RAMP.length - 1)))];
          if (!reduce && Math.random() < .004) ch = rnd(GLYPHS);
          const a = Math.min(1, .25 + l * .85 + band * .35);
          ctx.fillStyle = `rgba(240,${Math.round(180 + l * 40)},${Math.round(90 + l * 50)},${a.toFixed(3)})`;
          ctx.fillText(ch, x * cell, y * cell * 1.25);
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);   // scanlines
      if (on && !reduce && !mon.classList.contains('playing')) raf = requestAnimationFrame(draw);
    };
    const loop = () => { if (!raf && !reduce) raf = requestAnimationFrame(draw); };
    img.addEventListener('load', build); if (img.complete) build();
    if (SN.onVisible) SN.onVisible(mon, () => { on = true; loop(); }, () => { on = false; cancelAnimationFrame(raf); raf = 0; }); else on = true;
    window.addEventListener('resize', () => { clearTimeout(build._t); build._t = setTimeout(build, 150); });
    const stopVideo = () => { mon.classList.remove('playing'); video.controls = false; loop(); };
    btn.addEventListener('click', () => {
      mon.classList.add('playing'); video.controls = true; video.preload = 'auto'; video.currentTime = 0;
      const p = video.play(); if (p && p.catch) p.catch(stopVideo);
    });
    video.addEventListener('ended', stopVideo);
    // stop it if you scroll away, so it never talks over the rest of the page
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting && !video.paused) { video.pause(); stopVideo(); } }), { threshold: .2 }).observe(mon);
  }
})();
