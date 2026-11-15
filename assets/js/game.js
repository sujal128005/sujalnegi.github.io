// sujalnegi.tech: "Land the drone", hidden in the footer. Hold to lift, move to steer, touch down softly on
// a pad. Small gold pads score more. Every landing makes the wind a little stronger. Three crashes and it's over.
(() => {
  'use strict';
  const SN = window.SN || {};
  const foot = document.querySelector('.foot');
  if (!foot) return;
  const cv = foot.querySelector('.game-cv'), ctx = cv.getContext('2d');
  const btn = foot.querySelector('.game-btn'), help = foot.querySelector('.game-help'), scoreEl = foot.querySelector('.game-score');
  const GLYPHS = SN.GLYPHS || '#%&@*+=-:.', rnd = SN.rnd || ((s) => s[(Math.random() * s.length) | 0]);
  const drone = new Image(); drone.src = 'assets/img/drone.webp';

  let W = 0, H = 0, d = 1, raf = 0, playing = false, last = 0;
  let D, pads, parts, pops, score, best = 0, lives, battery, wind, held = false, aimX = null, keys = {}, state, stateT;
  try { best = +(localStorage.getItem('sn-drone-best') || 0); } catch (_) { /* private mode */ }

  const size = () => { d = SN.dpr ? SN.dpr() : 1; W = foot.clientWidth; H = foot.clientHeight; cv.width = Math.round(W * d); cv.height = Math.round(H * d); };
  const groundY = () => H - 28;
  const newPads = () => {
    const kinds = [{ w: 130, pts: 5, say: 'NICE' }, { w: 86, pts: 10, say: 'SMOOTH' }, { w: 50, pts: 25, say: 'PERFECT', gold: true }];
    const slots = kinds.length, span = (W - 80) / slots, order = kinds.sort(() => Math.random() - .5);
    pads = order.map((k, i) => ({ ...k, w: Math.min(k.w, span - 20), x: 40 + i * span + Math.random() * Math.max(0, span - k.w - 10) }));
  };
  const spawn = () => {
    const w = Math.min(96, W * .16);
    D = { x: W * (.2 + Math.random() * .6), y: 70, vx: (Math.random() - .5) * 60, vy: 0, w, h: w * 324 / 640, tilt: 0, alive: true };
    state = 'fly';
  };
  const hud = () => {
    const hearts = '◆'.repeat(Math.max(0, lives)) + '◇'.repeat(Math.max(0, 3 - lives));
    scoreEl.textContent = `SCORE ${score} · BEST ${best} · ${hearts} · BATTERY ${Math.max(0, Math.round(battery))}%`;
  };
  const pop = (x, y, text, gold) => pops.push({ x, y, text, gold, t: 0 });
  const burst = (x, y, n, gold) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 260; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, ch: rnd(GLYPHS), life: 1, gold }); } };

  const start = () => {
    size(); newPads(); parts = []; pops = []; score = 0; lives = 3; battery = 100; wind = 0;
    playing = true; foot.classList.add('playing'); btn.textContent = 'Stop'; help.hidden = false; scoreEl.hidden = false;
    spawn(); hud(); last = performance.now(); raf = requestAnimationFrame(step);
  };
  const stop = (over) => {
    playing = false; cancelAnimationFrame(raf); foot.classList.remove('playing'); btn.textContent = over ? 'Play again' : 'Play';
    help.hidden = true; held = false;
    if (score > best) { best = score; try { localStorage.setItem('sn-drone-best', String(best)); } catch (_) { /* ignore */ } }
    scoreEl.textContent = over ? `GAME OVER · SCORE ${score} · BEST ${best}` : `SCORE ${score} · BEST ${best}`;
    setTimeout(() => { if (!playing) ctx.clearRect(0, 0, cv.width, cv.height); }, over ? 1600 : 0);
    if (over) { const t = performance.now(); const fade = (now) => { if (playing || now - t > 1500) return; draw(); requestAnimationFrame(fade); }; requestAnimationFrame(fade); }
  };
  btn.addEventListener('click', () => (playing ? stop(false) : start()));

  // controls: hold anywhere on the footer (or Space / ↑) to lift, move the pointer (or ← →) to steer
  cv.addEventListener('pointerdown', (e) => { if (!playing) return; held = true; aimX = e.clientX - foot.getBoundingClientRect().left; cv.setPointerCapture(e.pointerId); e.preventDefault(); });
  cv.addEventListener('pointermove', (e) => { if (playing) aimX = e.clientX - foot.getBoundingClientRect().left; });
  cv.addEventListener('pointerup', () => { held = false; });
  cv.addEventListener('pointercancel', () => { held = false; });
  window.addEventListener('keydown', (e) => {
    if (!playing) return;
    if (['ArrowUp', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) { e.preventDefault(); keys[e.key] = true; aimX = null; }
    if (e.key === 'Escape') stop(false);
  });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting && playing) stop(false); })).observe(foot);
  window.addEventListener('resize', () => { if (playing) { size(); newPads(); } });

  function step(now) {
    const dt = Math.min(.033, (now - last) / 1000); last = now;
    const thrust = (held || keys.ArrowUp || keys[' ']) && battery > 0;
    if (state === 'fly' && D.alive) {
      const gust = wind * Math.sin(now / 900) * Math.sin(now / 2300 + 1);
      D.vy += (430 - (thrust ? 1050 : 0)) * dt;
      let ax = gust;
      if (aimX != null) ax += Math.max(-1, Math.min(1, (aimX - D.x) / 120)) * 700 - D.vx * 2.2;
      if (keys.ArrowLeft) ax -= 620; if (keys.ArrowRight) ax += 620;
      D.vx += ax * dt; D.vx *= .992; D.vy = Math.max(-420, Math.min(620, D.vy));
      D.x += D.vx * dt; D.y += D.vy * dt; D.tilt += (Math.max(-.45, Math.min(.45, D.vx / 520)) - D.tilt) * .15;
      if (thrust) { battery -= 16 * dt; for (let k = 0; k < 2; k++) parts.push({ x: D.x + (Math.random() - .5) * D.w * .5, y: D.y + D.h * .45, vx: (Math.random() - .5) * 40, vy: 120 + Math.random() * 90, ch: rnd('.:*+'), life: .5, gold: true }); }
      if (D.y < 30) { D.y = 30; D.vy = Math.max(0, D.vy); }
      const bottom = D.y + D.h / 2;
      if (D.x < -D.w || D.x > W + D.w) crash('LOST');
      else if (bottom >= groundY() - 6) {
        const pad = pads.find((p) => D.x > p.x && D.x < p.x + p.w);
        if (pad && D.vy < 190 && Math.abs(D.vx) < 160 && Math.abs(D.tilt) < .3) {
          D.y = groundY() - 6 - D.h / 2; state = 'landed'; stateT = now;
          const bonus = D.vy < 80 ? 5 : 0; score += pad.pts + bonus; battery = Math.min(100, battery + 35); wind += 26;
          pop(D.x, D.y - D.h, `+${pad.pts + bonus} ${pad.say}${bonus ? '!' : ''}`, pad.gold); burst(D.x, groundY(), 14, true);
        } else crash(D.vy >= 190 ? 'TOO FAST' : 'CRASH');
      }
      if (battery <= 0 && state === 'fly' && !thrust && D.vy > 0 && Math.random() < .01) { /* falling with an empty battery */ }
    }
    if (state === 'landed' && now - stateT > 900) { newPads(); spawn(); }
    if (state === 'crashed' && now - stateT > 1100) { if (lives <= 0 || battery <= 0) { draw(); stop(true); return; } spawn(); }
    parts.forEach((p) => { p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.1; });
    parts = parts.filter((p) => p.life > 0);
    pops.forEach((p) => { p.t += dt; p.y -= 40 * dt; }); pops = pops.filter((p) => p.t < 1.3);
    hud(); draw();
    if (playing) raf = requestAnimationFrame(step);
  }
  function crash(why) {
    D.alive = false; state = 'crashed'; stateT = performance.now(); lives -= 1;
    burst(D.x, Math.min(D.y, groundY() - 10), 46, false); pop(D.x, Math.min(D.y, groundY() - 40), why, false);
    try { navigator.vibrate && navigator.vibrate(40); } catch (_) { /* ignore */ }
  }
  function draw() {
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
    // ground and pads
    const g = groundY();
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(0, g, W, 1);
    (pads || []).forEach((p) => {
      ctx.fillStyle = p.gold ? '#d9b45a' : 'rgba(235,235,240,.85)'; ctx.fillRect(p.x, g - 6, p.w, 6);
      ctx.font = '500 10px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = p.gold ? '#f0d38c' : 'rgba(255,255,255,.5)';
      ctx.fillText(`+${p.pts}`, p.x + p.w / 2, g + 16);
    });
    // the drone
    if (D && D.alive && drone.complete) {
      ctx.save(); ctx.translate(D.x, D.y); ctx.rotate(D.tilt); ctx.drawImage(drone, -D.w / 2, -D.h / 2, D.w, D.h); ctx.restore();
    }
    // wind
    if (wind > 0) { ctx.font = '400 10px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillText(`WIND ${'›'.repeat(Math.min(8, Math.round(wind / 26)))}`, 14, g - 14); }
    // sparks and words
    ctx.textAlign = 'center'; ctx.font = '500 13px "JetBrains Mono", monospace';
    (parts || []).forEach((p) => { ctx.fillStyle = p.gold ? `rgba(240,211,140,${p.life.toFixed(2)})` : `rgba(255,120,110,${p.life.toFixed(2)})`; ctx.fillText(p.ch, p.x, p.y); });
    ctx.font = '600 15px "JetBrains Mono", monospace';
    (pops || []).forEach((p) => { ctx.fillStyle = p.gold ? `rgba(240,211,140,${(1 - p.t / 1.3).toFixed(2)})` : `rgba(255,255,255,${(1 - p.t / 1.3).toFixed(2)})`; ctx.fillText(p.text, p.x, p.y); });
  }
})();
