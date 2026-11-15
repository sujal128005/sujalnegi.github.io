// sujalnegi.tech: small touches only. Smooth reveals, the current section in the nav, two tiny demos,
// and waking the free-hosted live apps so they open fast.
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fade sections in as they scroll into view
  const items = Array.from(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
    // anything already on screen shows at once
    requestAnimationFrame(() => items.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }
  // safety net: at the bottom of the page, nothing may stay hidden
  const showAll = () => { if (window.scrollY + innerHeight >= document.documentElement.scrollHeight - 4) items.forEach((el) => el.classList.add('in')); };
  window.addEventListener('scroll', showAll, { passive: true });
  window.addEventListener('load', () => setTimeout(showAll, 300));

  // Navigation: a hairline once you scroll, and the section you are in
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const links = Array.from(document.querySelectorAll('.nav-links a'));
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) {
        links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#${e.target.id}`));
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  // Limen: the spending rule. The contract only settles between the seller floor and the buyer ceiling.
  const range = document.getElementById('limen-price');
  if (range) {
    const out = document.getElementById('limen-out'), verdict = document.getElementById('limen-verdict');
    const pin = document.querySelector('.demo-pin');
    const FLOOR = 360000, CEIL = 480000, MIN = +range.min, MAX = +range.max;
    const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
    const update = () => {
      const v = +range.value;
      out.textContent = inr(v);
      pin.style.left = `${((v - MIN) / (MAX - MIN)) * 100}%`;
      const ok = v >= FLOOR && v <= CEIL;
      verdict.classList.toggle('no', !ok);
      verdict.textContent = ok ? 'Within limits. Escrow can settle.'
        : v > CEIL ? 'Blocked. Above the buyer ceiling, so the contract refuses to settle.'
        : 'Blocked. Below the seller floor, so the contract refuses to settle.';
      pin.style.borderColor = ok ? '' : 'var(--no)';
    };
    range.addEventListener('input', update);
    update();
  }

  // Khata: check the sample claims one by one
  const run = document.getElementById('khata-run');
  if (run) {
    const vs = Array.from(document.querySelectorAll('#khata-call .verdict'));
    let checked = false;
    run.addEventListener('click', () => {
      checked = !checked;
      run.textContent = checked ? 'Reset the call' : 'Check the claims';
      vs.forEach((el, k) => {
        const apply = () => {
          el.className = `verdict${checked ? ` ${el.dataset.v}` : ''}`;
          el.textContent = checked ? el.dataset.say : 'Waiting to check';
        };
        if (checked && !reduce) setTimeout(apply, k * 260); else apply();
      });
    });
  }

  // Wake the live apps (free hosting puts them to sleep), quietly, once the page has settled
  const wake = () => {
    const urls = [...new Set(Array.from(document.querySelectorAll('a[data-wake]')).map((a) => a.href))];
    urls.forEach((u) => { try { fetch(u, { mode: 'no-cors', cache: 'no-store', credentials: 'omit' }).catch(() => {}); } catch (_) { /* ignore */ } });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(wake, { timeout: 4000 }); else setTimeout(wake, 2500);
})();
