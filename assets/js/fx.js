// sujalnegi.tech: shared effects. The boot screen, letters that scramble, text that lights up as you read,
// the dot field behind the hero, the gold squares full of code, reveals, and waking the free-hosted apps.
(() => {
  'use strict';
  const SN = (window.SN = window.SN || {});
  const reduce = (SN.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fine = (SN.fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const GLYPHS = (SN.GLYPHS = '!<>-_\\/[]{}=+*^?#%&$@ABCDEFGHKMNRSTXYZabcdeghkmnrsuvwxz0123456789');
  const rnd = (SN.rnd = (s) => s[(Math.random() * s.length) | 0]);
  SN.dpr = () => Math.min(2, window.devicePixelRatio || 1);
  SN.onVisible = (el, on, off, margin = '120px') => {   // run a loop only while its section is on screen
    if (!('IntersectionObserver' in window)) { on(); return; }
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? on() : off && off())), { rootMargin: margin }).observe(el);
  };

  // ---- scramble: letters run through random glyphs and settle on the real text ----
  SN.scramble = (el, opts = {}) => {
    if (!el) return;
    const text = el.dataset.text || (el.dataset.text = el.textContent);
    if (reduce) { el.textContent = text; return; }
    const dur = opts.duration || 520, t0 = performance.now();
    cancelAnimationFrame(el._scr);
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        out += c === ' ' || i / text.length < p ? c : rnd(GLYPHS);
      }
      el.textContent = out;
      if (p < 1) el._scr = requestAnimationFrame(step); else el.textContent = text;
    };
    el._scr = requestAnimationFrame(step);
  };
  document.querySelectorAll('[data-scramble]').forEach((el) => {
    const host = el.closest('a, button') || el;
    host.addEventListener('mouseenter', () => SN.scramble(el, { duration: 420 }));
    host.addEventListener('focus', () => SN.scramble(el, { duration: 420 }));
  });

  // ---- boot: "sujal/negi" types itself, then the room appears ----
  const boot = document.querySelector('.boot');
  let booted = false;
  const finishBoot = () => {
    if (booted) return;
    booted = true;
    if (boot) { boot.classList.add('gone'); setTimeout(() => boot.remove(), 600); }
    document.dispatchEvent(new CustomEvent('sn:ready'));
  };
  SN.whenReady = (fn) => (booted ? fn() : document.addEventListener('sn:ready', fn, { once: true }));
  if (boot) {
    let seen = false;
    try { seen = sessionStorage.getItem('sn-boot') === '1'; sessionStorage.setItem('sn-boot', '1'); } catch (_) { /* private mode */ }
    if (reduce) finishBoot();
    else {
      const bar = boot.querySelector('.boot-bar i'), pct = boot.querySelector('.boot-pct'), step = boot.querySelector('.boot-step');
      const steps = ['Calibrating sensors', 'Loading the desk', 'Warming up the drone', 'Ready'];
      const minTime = seen ? 520 : 1500, t0 = performance.now();
      let loaded = document.readyState === 'complete';
      window.addEventListener('load', () => { loaded = true; }, { once: true });
      const tick = (now) => {
        if (booted) return;
        const p = Math.min(loaded ? 1 : .9, (now - t0) / minTime);
        bar.style.width = `${(p * 100).toFixed(1)}%`; pct.textContent = `${String(Math.round(p * 100)).padStart(3, '0')}%`;
        step.textContent = steps[Math.min(steps.length - 1, Math.floor(p * (steps.length - .01)))];
        if (p >= 1) setTimeout(finishBoot, 160); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setTimeout(finishBoot, 3800);            // never keep anyone waiting on a slow image
    }
  } else finishBoot();

  // ---- navigation: solid once you scroll, and the section you are in ----
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('solid', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const links = Array.from(document.querySelectorAll('.nav-links a'));
  const secs = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#${e.target.id}`));
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((s) => spy.observe(s));
  }

  // ---- reveal on scroll ----
  const rv = document.querySelectorAll('.sec-head, .deck, .list li, .skills p, .mon-wrap, .hello-txt, .n9-card, .edu, .work-more');
  rv.forEach((el) => el.classList.add('rv'));
  const showAll = () => rv.forEach((el) => el.classList.add('in'));
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    rv.forEach((el) => io.observe(el));
    window.addEventListener('scroll', () => { if (window.scrollY + innerHeight >= document.documentElement.scrollHeight - 4) showAll(); }, { passive: true });
  } else showAll();

  // ---- the statement lights up word by word as you read ----
  const say = document.querySelector('[data-light]');
  if (say) {
    const words = [];
    const split = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.append(part);
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.append(s); words.push(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) split(n);
      });
    };
    split(say);
    say.classList.add('split');
    let lastLit = -1;
    const light = () => {
      const r = say.getBoundingClientRect(), vh = innerHeight;
      const p = reduce ? 1 : Math.max(0, Math.min(1, (vh * .86 - r.top) / (r.height + vh * .34)));
      const n = Math.round(p * words.length);
      if (n === lastLit) return;
      lastLit = n;
      words.forEach((w, i) => w.classList.toggle('lit', i < n));
    };
    window.addEventListener('scroll', light, { passive: true }); window.addEventListener('resize', light); light();
  }
  // the numbers count up once, when they come into view
  const counts = document.querySelectorAll('[data-count]');
  if (counts.length && 'IntersectionObserver' in window && !reduce) {
    const cio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, n = +el.dataset.count, plus = el.hasAttribute('data-plus') ? '+' : '', t0 = performance.now(), dur = 1100;
      const step = (now) => { const p = Math.min(1, (now - t0) / dur), v = Math.round(n * (1 - Math.pow(1 - p, 3))); el.textContent = v + (p === 1 ? plus : ''); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    counts.forEach((c) => cio.observe(c));
  }

  // ---- a blueprint grid behind the hero; the cursor becomes a crosshair that reads out coordinates ----
  const hero = document.querySelector('.hero'), gridCv = document.querySelector('.hero .grid');
  if (hero && gridCv) {
    const ctx = gridCv.getContext('2d'), base = document.createElement('canvas'), bctx = base.getContext('2d');
    const G = 40;
    let W = 0, H = 0, d = 1, mx = -999, my = -999, raf = 0, on = false;
    const size = () => {
      d = SN.dpr(); W = hero.clientWidth; H = hero.clientHeight;
      for (const c of [gridCv, base]) { c.width = Math.round(W * d); c.height = Math.round(H * d); }
      bctx.setTransform(d, 0, 0, d, 0, 0); bctx.clearRect(0, 0, W, H);
      const ox = (W / 2) % G;
      for (let x = ox; x < W; x += G) { const major = Math.round((x - ox) / G) % 5 === 0; bctx.fillStyle = major ? 'rgba(150,165,255,.075)' : 'rgba(150,165,255,.035)'; bctx.fillRect(Math.round(x), 0, 1, H); }
      for (let y = 0; y < H; y += G) { const major = Math.round(y / G) % 5 === 0; bctx.fillStyle = major ? 'rgba(150,165,255,.075)' : 'rgba(150,165,255,.035)'; bctx.fillRect(0, Math.round(y), W, 1); }
      bctx.fillStyle = 'rgba(190,200,255,.28)';
      for (let x = ox; x < W; x += G * 5) for (let y = 0; y < H; y += G * 5) { bctx.fillRect(x - 4, y, 9, 1); bctx.fillRect(x, y - 4, 1, 9); }
      draw();
    };
    const draw = () => {
      raf = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, gridCv.width, gridCv.height); ctx.drawImage(base, 0, 0);
      if (!on) return;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.fillStyle = 'rgba(217,180,90,.22)'; ctx.fillRect(0, Math.round(my), W, 1); ctx.fillRect(Math.round(mx), 0, 1, H);
      ctx.strokeStyle = 'rgba(240,211,140,.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(mx, my, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace'; ctx.fillStyle = 'rgba(240,211,140,.95)';
      const xmm = String(Math.round(mx * .2645 * 4)).padStart(4, '0'), ymm = String(Math.round(my * .2645 * 4)).padStart(4, '0');
      const lab = `X ${xmm}  Y ${ymm} mm`, tx = mx + 16 + 120 > W ? mx - 136 : mx + 16;
      ctx.fillText(lab, tx, my - 10);
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(draw); };
    hero.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; on = true; req(); }, { passive: true });
    hero.addEventListener('pointerleave', () => { on = false; req(); });
    window.addEventListener('resize', () => { clearTimeout(size._t); size._t = setTimeout(size, 150); });
    size();
  }

  // ---- the hero title glitches a letter now and then ----
  const title = document.querySelector('[data-glitch]');
  if (title && !reduce) {
    const wordsT = [];
    const wrap = (node) => Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.append(part);
          else { const s = document.createElement('span'); s.textContent = part; frag.append(s); if (part.length > 2) wordsT.push(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') wrap(n);
    });
    wrap(title);
    const glitch = () => {
      const picks = [rnd(wordsT), rnd(wordsT)];
      picks.forEach((w) => {
        const t = w.textContent, i = (Math.random() * t.length) | 0;
        w.innerHTML = '';
        w.append(t.slice(0, i)); const g = document.createElement('span'); g.className = 'gl'; g.textContent = rnd(GLYPHS); w.append(g, t.slice(i + 1));
        setTimeout(() => { w.textContent = t; }, 160 + Math.random() * 220);
      });
    };
    let gt = 0;
    SN.onVisible(title, () => { if (!gt) gt = setInterval(() => { if (!document.hidden) glitch(); }, 3600); }, () => { clearInterval(gt); gt = 0; });
  }

  // ---- wake the live apps (free hosting puts them to sleep), quietly, once the page has settled ----
  const wake = () => {
    const urls = [...new Set(Array.from(document.querySelectorAll('a[data-wake]')).map((a) => a.href))];
    urls.forEach((u) => { try { fetch(u, { mode: 'no-cors', cache: 'no-store', credentials: 'omit' }).catch(() => {}); } catch (_) { /* ignore */ } });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(wake, { timeout: 5000 }); else setTimeout(wake, 3000);

  // ---- shared: an audio analyser that works once per <audio> element ----
  let actx = null;
  SN.analyse = (audio) => {
    if (audio._an) return audio._an;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const src = actx.createMediaElementSource(audio), an = actx.createAnalyser();
      an.fftSize = 512; src.connect(an); an.connect(actx.destination);
      const buf = new Uint8Array(an.fftSize);
      audio._an = () => { an.getByteTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v; } return Math.min(1, Math.sqrt(s / buf.length) * 4); };
    } catch (_) { audio._an = () => (audio.paused ? 0 : .35 + Math.random() * .3); }
    return audio._an;
  };
  SN.resumeAudio = () => { try { if (actx && actx.state === 'suspended') actx.resume(); } catch (_) { /* ignore */ } };
})();
