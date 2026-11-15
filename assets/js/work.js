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

  // ---------------- the monitor: a 24-second video about me, with an AI voice and captions ----------------
  const mon = document.querySelector('.mon');
  if (mon) {
    const video = mon.querySelector('.mon-video'), btn = mon.querySelector('.mon-play');
    const play = () => {
      mon.classList.add('playing'); video.controls = true; video.preload = 'auto';
      const p = video.play(); if (p && p.catch) p.catch(() => mon.classList.remove('playing'));
    };
    btn.addEventListener('click', play);
    video.addEventListener('play', () => mon.classList.add('playing'));
    video.addEventListener('ended', () => { mon.classList.remove('playing'); video.controls = false; video.load(); });
    // stop it if you scroll away, so it never talks over the rest of the page
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting && !video.paused) video.pause(); }), { threshold: .2 }).observe(mon);
  }
})();
