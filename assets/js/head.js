// sujalnegi.tech: "Step inside my head". A head made of 3,300 dots, built from my photo, turns toward your
// cursor. Three glowing points open three rooms: a brain of dots with what I'm building, a fly-through of
// what I've shipped, and a landscape that moves with my (AI) voice.
(() => {
  'use strict';
  const SN = window.SN || {};
  const reduce = SN.reduce;
  const sec = document.querySelector('.head');
  if (!sec) return;
  const cv = sec.querySelector('.bust'), ctx = cv.getContext('2d'), wires = sec.querySelector('.wires');
  const spots = Array.from(sec.querySelectorAll('.spot'));
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  // ---------------- the bust ----------------
  let pts = null, anchors = null, W = 0, H = 0, d = 1, yaw = 0, pitch = 0, tYaw = 0, tPitch = 0, drag = null, raf = 0, on = false, t0 = performance.now();
  const size = () => { d = SN.dpr(); W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * d); cv.height = Math.round(H * d); if (pts) frame(performance.now(), true); };
  fetch('assets/img/bust.json').then((r) => r.json()).then((j) => {
    const p = j.p, n = p.length / 4; pts = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { pts[i * 4] = p[i * 4]; pts[i * 4 + 1] = p[i * 4 + 1]; pts[i * 4 + 2] = p[i * 4 + 2]; pts[i * 4 + 3] = p[i * 4 + 3] / 255; }
    anchors = ['brain', 'eyes', 'mouth'].map((k) => j.a[k]);
    size(); sec.classList.add('ready');
    if (on) loop();
  }).catch(() => {});
  const project = (x, y, z, cy, sy, cp, sp, S, cx0, cy0) => {
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    const f = 900 / (900 - z2 * S * .9);
    return [cx0 + x1 * S * f, cy0 + y1 * S * f, z2];
  };
  const layout = () => {
    const small = W < 820;
    if (small) return { S: Math.min(W * .0036, H * .0027), cx0: W / 2, cy0: H * .4 };
    return { S: Math.min(W * .0019, H * .0026), cx0: W * .68, cy0: H * .44 };
  };
  function frame(now, still) {
    raf = 0;
    if (!pts) return;
    const t = (now - t0) / 1000;
    if (!drag) { yaw += (tYaw + (reduce ? 0 : Math.sin(t * .35) * .16) - yaw) * .06; pitch += (tPitch - pitch) * .06; }
    const { S, cx0, cy0 } = layout(), cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
    const scan = reduce ? -9 : ((t * .28) % 1.4) - .2;             // a slow bright band sweeps down the face
    const n = pts.length / 4, step = 5;
    const B = 8, blue = Array.from({ length: B }, () => new Path2D()), gold = Array.from({ length: B }, () => new Path2D());
    let prev = null;
    for (let i = 0; i < n; i++) {
      const x = pts[i * 4], y = pts[i * 4 + 1], z = pts[i * 4 + 2], l = pts[i * 4 + 3];
      const q = project(x, y, z, cy, sy, cp, sp, S, cx0, cy0);
      if (prev && prev.y === y && x - prev.x === step) {          // the next point on the same scan line
        const yn = (y + 110) / 420, band = Math.max(0, 1 - Math.abs(yn - scan) * 9);
        const depth = .55 + Math.max(-.3, Math.min(.45, z / 160));
        const a = Math.min(.999, (.08 + (l + prev.l) * .45) * depth + band * .45);
        const k = Math.min(B - 1, Math.floor(a * B)), path = (band > .25 ? gold : blue)[k];
        path.moveTo(prev.q[0], prev.q[1]); path.lineTo(q[0], q[1]);
      }
      prev = { x, y, l, q };
    }
    ctx.lineWidth = Math.max(1, S * .85); ctx.lineCap = 'round';
    for (let k = 0; k < B; k++) {
      const a = ((k + .5) / B).toFixed(3);
      ctx.strokeStyle = `rgba(130,148,255,${a})`; ctx.stroke(blue[k]);
      ctx.strokeStyle = `rgba(240,211,140,${a})`; ctx.stroke(gold[k]);
    }
    // the three doors follow the face
    while (wires.firstChild) wires.firstChild.remove();
    anchors.forEach((a, i) => {
      const [px, py] = project(a[0], a[1], a[2], cy, sy, cp, sp, S, cx0, cy0);
      spots[i].style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      wires.append(svgEl('circle', { cx: px, cy: py, r: 17 }));
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) wires.append(svgEl('line', { x1: px + dx * 20, y1: py + dy * 20, x2: px + dx * 27, y2: py + dy * 27 }));
    });
    if (on && !still && !reduce) raf = requestAnimationFrame(frame);
  }
  const loop = () => { if (!raf) raf = requestAnimationFrame(frame); };
  SN.onVisible(sec, () => { on = true; loop(); }, () => { on = false; cancelAnimationFrame(raf); raf = 0; }, '60px');
  if (reduce) setTimeout(() => frame(performance.now(), true), 300);
  sec.addEventListener('pointermove', (e) => {
    const r = sec.getBoundingClientRect();
    if (drag) { yaw = drag.yaw + (e.clientX - drag.x) / 260; return; }
    if (e.pointerType === 'mouse') { tYaw = ((e.clientX - r.left) / r.width - .5) * .7; tPitch = -((e.clientY - r.top) / r.height - .45) * .25; }
  }, { passive: true });
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, yaw }; });
  window.addEventListener('pointerup', () => { if (drag) { tYaw = yaw * .5; drag = null; } });
  window.addEventListener('resize', () => { clearTimeout(size._t); size._t = setTimeout(size, 150); });

  // doors (the list) and spots (on the face) light each other up
  const doors = Array.from(sec.querySelectorAll('.doors button'));
  const pair = (k, onOff) => { if (spots[k]) spots[k].classList.toggle('on', onOff); if (doors[k]) doors[k].classList.toggle('on', onOff); };
  [doors, spots].forEach((list) => list.forEach((b, k) => {
    b.addEventListener('mouseenter', () => pair(k, true)); b.addEventListener('mouseleave', () => pair(k, false));
  }));
  doors.forEach((b) => b.addEventListener('click', () => SN.openRoom(b.dataset.scene, b)));

  // ---------------- the rooms ----------------
  const rooms = {};
  let openName = null, opener = null;
  const html = document.documentElement;
  SN.openRoom = (name, from) => {
    const r = rooms[name];
    if (!r || openName) return;
    openName = name; opener = from || document.activeElement;
    r.el.hidden = false; html.style.overflow = 'hidden';
    requestAnimationFrame(() => r.el.classList.add('open'));
    r.start();
    r.el.querySelector('.room-x').focus({ preventScroll: true });
  };
  const close = () => {
    if (!openName) return;
    const r = rooms[openName]; openName = null;
    r.stop(); r.el.classList.remove('open');
    setTimeout(() => { r.el.hidden = true; html.style.overflow = ''; }, reduce ? 0 : 450);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  };
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  spots.forEach((s) => s.addEventListener('click', () => SN.openRoom(s.dataset.scene, s)));
  document.querySelectorAll('.room-x').forEach((b) => b.addEventListener('click', close));

  // a canvas that fills its room
  const roomCanvas = (el) => {
    const c = el.querySelector('.room-cv'), x = c.getContext('2d');
    const o = { c, x, W: 0, H: 0, d: 1 };
    o.size = () => { o.d = SN.dpr(); o.W = el.clientWidth; o.H = el.clientHeight; c.width = Math.round(o.W * o.d); c.height = Math.round(o.H * o.d); x.setTransform(o.d, 0, 0, o.d, 0, 0); };
    return o;
  };

  // ---- room 1: a brain made of dots, with what I'm building floating around it ----
  {
    const el = document.getElementById('room-brain'), R = roomCanvas(el), lines = el.querySelector('.room-wires');
    const cards = Array.from(el.querySelectorAll('.card')), tick = el.querySelector('[data-tick]');
    const P = [];
    const rand = (a, b) => a + Math.random() * (b - a);
    for (const s of [-1, 1]) for (let i = 0; i < 2300; i++) {        // two folded hemispheres
      const th = rand(0, Math.PI * 2), ph = Math.acos(rand(-1, 1));
      let x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
      if (x * s < -.15) x = -.15 * s + (x + .15 * s) * .2;            // flatten the middle where the halves meet
      const fold = 1 + .07 * Math.sin(th * 9 + ph * 5) * Math.sin(ph * 7 + s) + .03 * Math.sin(th * 23);
      P.push([s * .36 + x * .58 * fold, y * .62 * fold - .05 + (z < -.5 ? .05 : 0), z * .92 * fold, Math.random()]);
    }
    for (let i = 0; i < 520; i++) {                                    // the cerebellum, at the back
      const th = rand(0, Math.PI * 2), ph = Math.acos(rand(-1, 1));
      P.push([Math.sin(ph) * Math.cos(th) * .48, -.5 + Math.cos(ph) * .22, -.62 + Math.sin(ph) * Math.sin(th) * .3, Math.random()]);
    }
    for (let i = 0; i < 160; i++) { const a = rand(0, 7); P.push([Math.cos(a) * .1, rand(-1.05, -.45), -.28 + Math.sin(a) * .1, Math.random()]); }
    const hotIdx = [300, 1500, 2600, 3900, 4700].map((i) => Math.min(i, P.length - 1));
    let yaw = .6, pitch = .18, raf = 0, dragB = null, t0 = 0, ideas = 31;
    const draw = (now) => {
      const t = (now - t0) / 1000, { x, W, H } = R;
      if (!dragB && !reduce) yaw += .0028;
      x.clearRect(0, 0, W, H);
      const S = Math.min(W, H) * (W < 700 ? .36 : .33), cx = W / 2, cyy = H * (W < 700 ? .34 : .5);
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const proj = (p) => {
        const x1 = p[0] * cyw + p[2] * syw, z1 = -p[0] * syw + p[2] * cyw, y1 = p[1] * cp - z1 * sp, z2 = p[1] * sp + z1 * cp;
        const f = 3 / (3 - z2); return [cx + x1 * S * f, cyy - y1 * S * f, z2];
      };
      for (let i = 0; i < P.length; i++) {
        const p = P[i], [px, py, pz] = proj(p);
        const spark = reduce ? 0 : Math.max(0, Math.sin(t * 2.2 + p[3] * 40) - .985) * 60;
        const a = Math.min(1, .16 + (pz + 1) * .34 + spark);
        x.fillStyle = spark > .1 ? `rgba(240,211,140,${a.toFixed(3)})` : `rgba(225,230,255,${a.toFixed(3)})`;
        const s = 1.1 + (pz + 1) * .55; x.fillRect(px, py, s, s);
      }
      // wires from each card to its spot on the brain
      while (lines.firstChild) lines.firstChild.remove();
      if (W >= 700) {
        const er = el.getBoundingClientRect();
        cards.forEach((c, i) => {
          if (c.offsetParent === null) return;
          const [px, py] = proj(P[hotIdx[+c.dataset.anchor || i]]), r = c.getBoundingClientRect();
          const cx1 = r.left - er.left + r.width / 2 < px ? r.right - er.left : r.left - er.left, cy1 = r.top - er.top + r.height / 2;
          lines.append(svgEl('line', { x1: cx1, y1: cy1, x2: px, y2: py }), svgEl('circle', { cx: px, cy: py, r: 3 }));
        });
      }
      if (!reduce && Math.random() < .03) { ideas += 1; tick.textContent = ideas; }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    R.c.addEventListener('pointerdown', (e) => { dragB = { x: e.clientX, y: e.clientY, yaw, pitch }; R.c.setPointerCapture(e.pointerId); });
    R.c.addEventListener('pointermove', (e) => { if (!dragB) return; yaw = dragB.yaw + (e.clientX - dragB.x) / 180; pitch = Math.max(-.6, Math.min(.8, dragB.pitch + (e.clientY - dragB.y) / 240)); if (reduce) draw(performance.now()); });
    R.c.addEventListener('pointerup', () => { dragB = null; });
    const onResize = () => { R.size(); if (reduce) draw(performance.now()); };
    rooms.brain = { el, start: () => { R.size(); t0 = performance.now(); window.addEventListener('resize', onResize); raf = requestAnimationFrame(draw); }, stop: () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); } };
  }

  // ---- room 2: fly through the things I've shipped ----
  {
    const el = document.getElementById('room-eyes'), R = roomCanvas(el), world = el.querySelector('.fly-world'), count = el.querySelector('.eyes-n');
    const items = [
      ['shot-stealth.webp', 'STEALTH', 'Know Your Agent', 'https://bouncerkya.onrender.com'],
      ['shot-arthanetra.webp', 'ArthaNetra', 'See the real price', 'https://arthanetra.onrender.com'],
      ['flexdrop-world-overview-night.webp', 'FlexDrop', 'Fewer, shorter routes', 'https://flexdrop.onrender.com/app/'],
      ['shot-paypal.webp', 'PayPal Attribute', 'Every source gets paid', 'https://paypal-attribute.onrender.com/'],
      ['shot-pixelproof.webp', 'PixelProof', 'Do vision models really read?', 'https://pixelproof-gk2j.onrender.com'],
      ['arthanetra-verdict.webp', 'ArthaNetra', 'The verdict, in 12 languages', 'https://arthanetra.onrender.com'],
      ['shot-flexdrop.webp', 'FlexDrop', 'The student checkout', 'https://flexdrop.onrender.com/app/'],
      ['shot-khata.webp', 'Khata', 'The rules decide', 'https://khata-avs8.onrender.com/login'],
      ['flexdrop-operations-dashboard.webp', 'FlexDrop', 'Operations dashboard', 'https://flexdrop.onrender.com/app/'],
    ];
    const GAPZ = 760, nodes = [];
    let built = false, camZ = 0, vz = 0, raf = 0, stars = [], last = 0, touchY = null;
    const build = () => {
      if (built) return; built = true;
      items.forEach(([img, name, note, href], i) => {
        const a = document.createElement('a'); a.className = 'fs'; a.href = href; a.target = '_blank'; a.rel = 'noopener';
        a.innerHTML = `<div class="win"><i></i><img alt="" loading="lazy" src="assets/img/${img}"></div><p><b>${name}</b> · ${note}</p>`;
        world.append(a); nodes.push(a);
      });
    };
    const place = () => {
      const k = Math.min(1, R.W / 1300), small = R.W < 700;
      nodes.forEach((n, i) => {
        const side = i % 2 ? 1 : -1, x = side * (small ? 70 : 330 + (i % 3) * 60) * (small ? 1 : k), y = ((i * 37) % 5 - 2) * (small ? 40 : 70) * k;
        n._z = -(500 + i * GAPZ); n._x = x - n.offsetWidth / 2; n._y = y - n.offsetHeight / 2; n._ry = small ? 0 : -side * 14;
      });
    };
    const total = () => 500 + (items.length - 1) * GAPZ + 300;
    const draw = (now) => {
      const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
      if (!reduce) { vz += ((vz > 0 ? 0 : 0) - vz) * .06; camZ += (vz + 70) * dt; }
      if (camZ > total()) camZ = 0;
      if (camZ < 0) camZ = 0;
      let passed = 0;
      nodes.forEach((n) => {
        const z = n._z + camZ;                     // 0 = at the screen, negative = ahead
        const op = z > 160 ? 0 : z > 0 ? 1 - z / 160 : Math.max(0, Math.min(1, (z + 3600) / 1600));
        if (z > 0) passed++;
        n.style.opacity = op.toFixed(3); n.style.pointerEvents = op > .5 ? 'auto' : 'none';
        n.style.transform = `translate3d(${n._x}px, ${n._y}px, ${z}px) rotateY(${n._ry}deg)`;
      });
      count.textContent = passed;
      // stars stream past
      const { x, W, H } = R, cx = W / 2, cy = H / 2;
      x.clearRect(0, 0, W, H);
      const speed = reduce ? 0 : (vz + 70) * dt * .9;
      stars.forEach((s) => {
        s.z -= speed; if (s.z < 1) { s.z = 1400; s.x = (Math.random() - .5) * 2; s.y = (Math.random() - .5) * 2; }
        const f = 380 / s.z, px = cx + s.x * W * f * .5, py = cy + s.y * H * f * .5, a = Math.min(1, (1400 - s.z) / 900);
        x.fillStyle = `rgba(220,226,255,${(a * .8).toFixed(3)})`; const sz = Math.min(2.6, f * .9); x.fillRect(px, py, sz, sz);
      });
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    const wheel = (e) => { e.preventDefault(); vz = Math.max(-900, Math.min(2400, vz + e.deltaY * 2.2)); if (reduce) { camZ += e.deltaY * 2; draw(performance.now()); } };
    const ts = (e) => { touchY = e.touches[0].clientY; };
    const tm = (e) => { if (touchY == null) return; const y = e.touches[0].clientY; vz = Math.max(-900, Math.min(2400, vz + (touchY - y) * 9)); touchY = y; e.preventDefault(); };
    const keys = (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); vz += e.key === 'ArrowUp' ? -600 : 600; } };
    const onResize = () => { R.size(); place(); };
    rooms.eyes = {
      el,
      start: () => {
        build(); R.size(); place(); camZ = 0; vz = 0; last = performance.now();
        stars = Array.from({ length: 260 }, () => ({ x: (Math.random() - .5) * 2, y: (Math.random() - .5) * 2, z: Math.random() * 1400 }));
        el.addEventListener('wheel', wheel, { passive: false }); el.addEventListener('touchstart', ts, { passive: true }); el.addEventListener('touchmove', tm, { passive: false });
        window.addEventListener('keydown', keys); window.addEventListener('resize', onResize);
        requestAnimationFrame(() => { place(); raf = requestAnimationFrame(draw); });
      },
      stop: () => { cancelAnimationFrame(raf); el.removeEventListener('wheel', wheel); el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm); window.removeEventListener('keydown', keys); window.removeEventListener('resize', onResize); },
    };
  }

  // ---- room 3: a landscape of dots that moves with my (AI) voice ----
  {
    const el = document.getElementById('room-words'), R = roomCanvas(el), audio = el.querySelector('audio');
    const cap = el.querySelector('.words-cap'), num = el.querySelector('.words-n'), mute = el.querySelector('.words-mute');
    const CUES = [
      [0.35, 1.47, "Hi, I'm Sujal."],
      [2.24, 5.08, "I'm a mechanical engineer. I build machines that move, and software that thinks."],
      [7.74, 6.66, "I co-founded Nexara9, a venture studio for autonomous machines and AI products."],
      [14.82, 6.93, "I lead a nineteen-member team building an autonomous ground vehicle, and an eight-member team building a drone."],
      [22.17, 4.97, "With Limen, we won the IBM SkillsBuild South Region finale."],
      [27.56, 4.44, "With Khata, we placed second runner-up, among more than a thousand students."],
      [32.42, 5.99, "I've taught over six hundred students through DataWorks, and written ten books, in English and Hindi."],
      [38.83, 3.69, "I don't start things to try them. I start them to finish them."],
      [42.94, 2.71, "If you're building something hard, let's talk."],
    ];
    let raf = 0, t0 = 0, amp = 0, level = null, cueI = -1, ended = false;
    const setCue = (i) => {
      if (i === cueI) return; cueI = i;
      if (i < 0) { cap.textContent = ''; return; }
      cap.innerHTML = ''; CUES[i][2].split(' ').forEach((w, k) => { const s = document.createElement('span'); s.className = 'k'; s.textContent = (k ? ' ' : '') + w; cap.append(s); });
      num.textContent = `${i + 1} / ${CUES.length}`;
    };
    const draw = (now) => {
      const t = (now - t0) / 1000, { x, W, H } = R;
      const at = audio.currentTime || 0;
      let ci = -1; for (let i = 0; i < CUES.length; i++) if (at >= CUES[i][0] - .05) ci = i;
      if (!ended) setCue(ci);
      if (ci >= 0 && !ended) { const c = CUES[ci], ks = cap.children, p = Math.min(1, (at - c[0]) / c[1]); for (let k = 0; k < ks.length; k++) ks[k].classList.toggle('on', k <= p * ks.length + .3); }
      const target = level ? level() : 0;
      amp += (target - amp) * (target > amp ? .35 : .08);
      x.clearRect(0, 0, W, H);
      const cols = W < 700 ? 90 : 150, rows = 46, horizon = H * .44, A = .35 + amp * 1.6;
      for (let r = 0; r < rows; r++) {
        const zz = 1 + r * .09, f = 1 / zz, y0 = horizon + (H * .62) * f * .9;
        for (let c = 0; c < cols; c++) {
          const xx = (c / (cols - 1) - .5) * 4.2;
          const hgt = (Math.sin(xx * 2.6 + t * .8 + zz) * .09 + Math.sin(zz * 3.1 - t * 1.25 + xx * .7) * .07 + Math.sin((xx + zz) * 7 + t * 2.4) * .035 * (1 + amp * 3)) * A;
          const px = W / 2 + xx * W * .5 * f, py = y0 - hgt * H * .55 * f;
          if (px < -4 || px > W + 4) continue;
          const a = Math.min(1, (.12 + f * .85) * (.6 + hgt * 2.2 + amp * .5));
          x.fillStyle = `rgba(232,236,255,${Math.max(.04, a).toFixed(3)})`; const s = .8 + f * 1.4; x.fillRect(px, py, s, s);
        }
      }
      if (!reduce || !audio.paused) raf = requestAnimationFrame(draw);
    };
    audio.addEventListener('ended', () => { ended = true; cap.textContent = 'That’s me. Click anywhere to hear it again.'; });
    R.c.addEventListener('click', () => { if (ended || audio.paused) { ended = false; cueI = -1; audio.currentTime = 0; SN.resumeAudio(); audio.play().catch(() => {}); if (reduce) raf = requestAnimationFrame(draw); } });
    mute.addEventListener('click', () => { audio.muted = !audio.muted; mute.classList.toggle('muted', audio.muted); mute.setAttribute('aria-label', audio.muted ? 'Unmute' : 'Mute'); });
    const onResize = () => R.size();
    rooms.words = {
      el,
      start: () => {
        R.size(); t0 = performance.now(); ended = false; cueI = -1;
        level = SN.analyse ? SN.analyse(audio) : null;
        audio.currentTime = 0; SN.resumeAudio && SN.resumeAudio();
        audio.play().catch(() => { cap.textContent = 'Tap anywhere to hear me.'; ended = true; });
        window.addEventListener('resize', onResize); raf = requestAnimationFrame(draw);
      },
      stop: () => { audio.pause(); cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); },
    };
  }
})();
