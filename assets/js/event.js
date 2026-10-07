(function () {
  'use strict';

  // Real event: ATLAS Open Data 13 TeV (2020 release), data_B.GamGam.root, run 300908, event 1315251030.
  // Two tight isolated photons (m_γγ = 126.9 GeV), four jets (two b-tagged, MV2c10 > 0.8244), one tight muon, 111 GeV MET.
  // Object kinematics are taken directly from the ntuple; hit-level detail is drawn around them (the release has no hits).
  // Physics of the six reconstructed objects. Keys (gamma1, b1, mu, …) are what _data/sections.yml refers to.
  const PHYSICS = {
    gamma1: { key: 'γ₁', kind: 'photon', label: 'photon',        pt:  57.4, eta:  0.62, phi: -2.48, conv: 0,      color: '#f2c65c',
              kin: [['pT', '57.4 GeV'], ['η', '+0.62'], ['φ', '−2.48'], ['conv', 'unconverted']] },
    gamma2: { key: 'γ₂', kind: 'photon', label: 'photon',        pt:  48.9, eta: -0.91, phi: -0.43, conv: 1,      color: '#f2c65c',
              kin: [['pT', '48.9 GeV'], ['η', '−0.91'], ['φ', '−0.43'], ['conv', '1-track'], ['m(γγ)', '126.9 GeV']] },
    b1:     { key: 'b₁', kind: 'jet',    label: 'b-tagged jet',  pt: 131.4, eta: -1.21, phi:  1.66, btag: 0.908,  color: '#8fdcc2',
              kin: [['pT', '131.4 GeV'], ['η', '−1.21'], ['φ', '+1.66'], ['MV2c10', '0.908'], ['b-tag', '70% WP']] },
    b2:     { key: 'b₂', kind: 'jet',    label: 'b-tagged jet',  pt:  35.4, eta: -1.51, phi:  0.31, btag: 0.979,  color: '#8fdcc2',
              kin: [['pT', '35.4 GeV'], ['η', '−1.51'], ['φ', '+0.31'], ['MV2c10', '0.979'], ['b-tag', '60% WP']] },
    mu:     { key: 'μ',  kind: 'muon',   label: 'muon',          pt:  35.7, eta:  0.51, phi:  3.05, charge: -1,   color: '#d9b4ec',
              kin: [['pT', '35.7 GeV'], ['η', '+0.51'], ['φ', '+3.05'], ['charge', '−1'], ['ID', 'tight']] },
    met:    { key: 'E̸ᵀ', kind: 'met',    label: 'missing transverse energy', pt: 111.0, eta: 0.00, phi: -2.47, color: '#f27a55',
              kin: [['E̸ᵀ', '111.0 GeV'], ['φ', '−2.47'], ['jets', '4 (2 b-tag)']] },
  };
  // Sections come from _data/sections.yml (Jekyll writes it into #sections-data). The fallback keeps the page working without it.
  let SECTIONS = [{"id": "about", "title": "About", "object": "mu"}, {"id": "research", "title": "Research", "object": "gamma1"}, {"id": "service", "title": "Teaching & Service", "object": "gamma2"}, {"id": "blog", "title": "Blog", "object": "b1"}, {"id": "ephemera", "title": "Ephemera", "object": "b2"}, {"id": "contact", "title": "CV & Contact", "object": "met"}];
  const island = document.getElementById('sections-data');
  if (island) { try { const d = JSON.parse(island.textContent); if (Array.isArray(d) && d.length) SECTIONS = d; } catch (e) { console.error('sections data unreadable', e); } }
  // One entry per physics object. Objects assigned a section get id = section id and name = section title; the rest are drawn but not linked.
  const OBJECTS = Object.keys(PHYSICS).map(k => {
    const sec = SECTIONS.find(s => s.object === k);
    return Object.assign({ id: sec ? sec.id : k, name: sec ? sec.title : null, object: k }, PHYSICS[k]);
  });
  for (const s of SECTIONS) if (!PHYSICS[s.object]) console.warn(`sections.yml: section "${s.id}" refers to unknown object "${s.object}"`);
  const LIGHT_JETS = [
    { key: 'j₃', pt: 68.1, eta: -0.52, phi: -0.21 },
    { key: 'j₄', pt: 32.3, eta: -0.69, phi:  0.36 },
  ];
  const TRACK = '#6f6c66', LIGHT = '#a8a49c';
  const byId = Object.fromEntries(OBJECTS.map(o => [o.id, o]));
  const MET = OBJECTS.find(o => o.kind === 'met');
  const NVEC = 16;                       // length of the compressed "vector"
  const RMAX = { photon: 1.35, jet: 1.5, muon: 2.0, met: 1.0 };

  // ---------- deterministic RNG ----------
  let seed = 20180719;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const dirOf = (eta, phi) => { const th = 2 * Math.atan(Math.exp(-eta)); return [Math.sin(th) * Math.cos(phi), Math.sin(th) * Math.sin(phi), Math.cos(th)]; };

  // ---------- point cloud ----------
  const pts = [];
  const push = (x, y, z, obj, size, kind) => pts.push({ x, y, z, obj, size, kind, jx: (rnd() - 0.5) * 3, jy: (rnd() - 0.5) * 3 });
  function track(eta, phi, rMax, n, k, obj, size, kind) {
    for (let i = 1; i <= n; i++) { const t = i / n, r = t * rMax; const d = dirOf(eta, phi + k * t * t); push(d[0] * r, d[1] * r, d[2] * r, obj, size, kind); }
  }
  for (const R of [0.33, 0.51, 0.72, 0.9]) for (let i = 0; i < 170; i++) { const a = rnd() * Math.PI * 2; push(R * Math.cos(a), R * Math.sin(a), (rnd() * 2 - 1) * 1.15, null, 0.9, 'hit'); }
  for (let i = 0; i < 26; i++) track((rnd() * 2 - 1) * 2.4, rnd() * Math.PI * 2, 0.55 + rnd() * 0.5, 10, (rnd() - 0.5) * 1.2, null, 1.0, 'soft');

  function jetPoints(o, id, tsize, csize) {
    const nTrk = Math.round(6 + 5 * Math.log(o.pt / 25)), nClu = Math.round(60 + 35 * Math.log(o.pt / 25));
    const spread = Math.max(0.07, 0.19 - 0.03 * Math.log(o.pt / 25));
    for (let t = 0; t < nTrk; t++) track(o.eta + gauss() * spread, o.phi + gauss() * spread, 0.85 + rnd() * 0.2, 16, (rnd() - 0.5) * 0.35, id, tsize, 'trk');
    for (let i = 0; i < nClu; i++) { const dd = dirOf(o.eta + gauss() * spread, o.phi + gauss() * spread); const r = 1.02 + Math.abs(gauss()) * 0.28; push(dd[0] * r, dd[1] * r, dd[2] * r, id, csize, 'had'); }
  }
  for (const lj of LIGHT_JETS) jetPoints(lj, null, 0.9, 1.1);

  for (const o of OBJECTS) {
    const d = dirOf(o.eta, o.phi);
    if (o.kind === 'photon') {
      track(o.eta, o.phi, 1.0, 18, o.conv ? 0.05 : -0.05, o.id, 1.0, 'trk');   // γ₁ is unconverted in the data; its track is drawn for visual balance
      for (let i = 0; i < 110; i++) { const r = 1.06 + gauss() * 0.05 + Math.abs(gauss()) * 0.06; push(d[0] * r + gauss() * 0.03, d[1] * r + gauss() * 0.03, d[2] * r + gauss() * 0.03, o.id, 1.6, 'em'); }
    } else if (o.kind === 'jet') {
      jetPoints(o, o.id, 1.1, 1.5);
    } else if (o.kind === 'muon') {
      const MU_R = 1.95, MU_K = -0.12;                       // same curvature as the track, so hits and anchor sit on it
      track(o.eta, o.phi, MU_R, 46, MU_K, o.id, 1.4, 'trk');
      for (const r of [1.62, 1.78, 1.94]) {
        const t = r / MU_R, dd = dirOf(o.eta, o.phi + MU_K * t * t);
        for (let i = 0; i < 6; i++) push(dd[0] * r + gauss() * 0.02, dd[1] * r + gauss() * 0.02, dd[2] * r + gauss() * 0.02, o.id, 2.0, 'mu');
      }
    } else if (o.kind === 'met') {
      // points along the MET arrow; only drawn while the object is being compressed
      for (let i = 1; i <= 40; i++) { const r = 0.95 * i / 40; push(Math.cos(o.phi) * r, Math.sin(o.phi) * r, 0, o.id, 1.6, 'met'); }
    }
    const r = o.kind === 'photon' ? 1.1 : o.kind === 'jet' ? 1.18 : o.kind === 'muon' ? 1.94 : 0.95;   // muon: the last chamber hit
    const da = o.kind === 'muon' ? dirOf(o.eta, o.phi + (-0.12) * (r / 1.95) * (r / 1.95)) : d;
    o.anchor = o.kind === 'met' ? [Math.cos(o.phi) * r, Math.sin(o.phi) * r, 0] : [da[0] * r, da[1] * r, da[2] * r];
  }

  // The compressed representation: each object's points binned by radius from the interaction point → a 16-vector.
  for (const o of OBJECTS) {
    const bins = new Array(NVEC).fill(0);
    for (const p of pts) if (p.obj === o.id) { p.bin = Math.min(NVEC - 1, Math.floor(NVEC * Math.hypot(p.x, p.y, p.z) / RMAX[o.kind])); bins[p.bin]++; }
    const mx = Math.max(...bins, 1);
    o.vec = bins.map(b => b / mx);
  }

  // ---------- canvas ----------
  const canvas = document.getElementById('event'), ctx = canvas.getContext('2d');
  const hud = document.getElementById('hud');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0;
  function resize() {
    const r = canvas.getBoundingClientRect(); const DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height; canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize); resize();

  let yaw = 4.36, pitch = 0.00, yawT = yaw, pitchT = pitch;   // level side view: beam line horizontal, objects clear of the HUD text (chosen by scratchpad/view_search.py)
  let hovered = null, dragging = false, dragStart = null, moved = false;
  let anim = null;   // { id, dir: +1 collapse / -1 expand, t0, dur, col, onDone }
  let lastProj = null;   // projected point positions from the last frame, for hit testing
  const cam = { d: 3.7 };

  function project(x, y, z) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    const s = Math.min(W, H) * (W > 760 ? 0.9 : 1.05) / (cam.d - z2);
    return [(W > 760 ? W * 0.52 : W * 0.5) + x1 * s, H * 0.52 - y2 * s, z2, s];
  }
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const SQ = 10, GAP = 3, COLH = NVEC * (SQ + GAP) - GAP;

  function draw() {
    try { drawFrame(); } catch (e) { console.error('draw failed', e); }
    requestAnimationFrame(draw);          // the loop must survive a bad frame
  }
  function drawFrame() {
    yaw += (yawT - yaw) * 0.12; pitch += (pitchT - pitch) * 0.12;
    ctx.clearRect(0, 0, W, H);

    // animation progress k: 0 = normal event display, 1 = fully compressed.
    // A collapse that has finished stays held at k = 1 until the page view takes over.
    let k = 0, A = null, col = null, finished = false;
    if (anim) {
      const u = anim.hold ? 1 : Math.min(1, (performance.now() - anim.t0) / anim.dur);
      k = anim.dir > 0 ? ease(u) : 1 - ease(u); A = byId[anim.id]; col = anim.col;
      finished = u >= 1 && !anim.hold;
    }
    const fadeOthers = 1 - k;

    // beam line + interaction point
    const b0 = project(0, 0, -2.3), b1 = project(0, 0, 2.3), ip = project(0, 0, 0);
    ctx.strokeStyle = `rgba(160,156,148,${0.4 * fadeOthers})`; ctx.lineWidth = 1; ctx.setLineDash([2, 6]);
    ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(242,239,233,${0.6 * fadeOthers})`; ctx.beginPath(); ctx.arc(ip[0], ip[1], 3.5, 0, Math.PI * 2); ctx.stroke();

    const focus = A ? A.id : hovered;
    const proj = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) { const p = pts[i]; proj[i] = project(p.x, p.y, p.z); }
    lastProj = proj;
    const order = pts.map((_, i) => i).sort((a, b) => proj[a][2] - proj[b][2]);

    for (const i of order) {
      const p = pts[i]; let q = proj[i];
      const depth = Math.max(0, Math.min(1, (q[2] + 2.2) / 4.4));
      let alpha, color, size = p.size * (0.7 + 0.6 * depth);
      if (p.obj) {
        const o = byId[p.obj], mine = focus === p.obj;
        if (p.kind === 'met' && !(A && mine)) continue;      // MET is an arrow unless it is being compressed
        color = o.color;
        alpha = (focus && !mine) ? 0.22 * fadeOthers : 0.55 + 0.45 * depth;
        if (mine) size *= 1.35;
        if (A && mine) {                                      // lerp toward this point's slot in the column
          const tx = col.x + p.jx * (1 - k), ty = col.y + p.bin * (SQ + GAP) + SQ / 2 + p.jy * (1 - k);
          q = [q[0] + (tx - q[0]) * k, q[1] + (ty - q[1]) * k];
          size = size + (2.2 - size) * k; alpha = 1 - 0.6 * Math.max(0, k - 0.75) / 0.25;
        }
      } else { color = TRACK; alpha = (focus ? 0.28 : 0.45) * (0.5 + 0.5 * depth) * fadeOthers; }
      if (alpha <= 0.01) continue;
      ctx.fillStyle = hexA(color, alpha);
      if (size > 1.6) { ctx.beginPath(); ctx.arc(q[0], q[1], size, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(q[0] - size, q[1] - size, size * 2, size * 2);
    }

    // MET arrow
    const met = MET, metFocus = focus === MET.id;
    const metA = (A && metFocus) ? (1 - k) : (focus && !metFocus ? 0.3 * fadeOthers : 0.95 * fadeOthers || 0);
    if (metA > 0.01 && !(A && metFocus && k > 0.5)) {
      const m0 = project(0, 0, 0), m1 = project(met.anchor[0], met.anchor[1], 0);
      ctx.strokeStyle = hexA(met.color, metA); ctx.lineWidth = metFocus ? 2.5 : 1.6; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(m0[0], m0[1]); ctx.lineTo(m1[0], m1[1]); ctx.stroke(); ctx.setLineDash([]);
      const ang = Math.atan2(m1[1] - m0[1], m1[0] - m0[0]); ctx.fillStyle = hexA(met.color, metA);
      ctx.beginPath(); ctx.moveTo(m1[0], m1[1]); ctx.lineTo(m1[0] - 11 * Math.cos(ang - 0.4), m1[1] - 11 * Math.sin(ang - 0.4)); ctx.lineTo(m1[0] - 11 * Math.cos(ang + 0.4), m1[1] - 11 * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
    }

    // the compressed vector: a column of squares, alpha = component value
    if (A && k > 0.6) {
      const c = col, s = (k - 0.6) / 0.4;
      for (let i = 0; i < NVEC; i++) { ctx.fillStyle = hexA(A.color, s * (0.25 + 0.75 * A.vec[i])); ctx.fillRect(c.x - SQ / 2, c.y + i * (SQ + GAP), SQ, SQ); }
      ctx.font = '500 14px "EB Garamond", Garamond, serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = hexA(A.color, s); ctx.fillText(`${A.key}  ${A.name}`, c.x + 16, c.y + 6);
      ctx.fillStyle = `rgba(220,215,206,${s})`; ctx.fillText(`z ∈ ℝ${NVEC.toString().replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`, c.x + 16, c.y + 24);
    }

    // hover popup: placed where it covers the fewest points, clear of the intro text and the object list
    ctx.textBaseline = 'middle';
    for (const o of OBJECTS) o.screen = project(o.anchor[0], o.anchor[1], o.anchor[2]);
    if (focus && !A && byId[focus].name) {
      const o = byId[focus], a = o.screen;
      ctx.font = '500 15px "EB Garamond", Garamond, serif';
      const line1 = `${o.key}  ${o.name}`, w1 = ctx.measureText(line1).width;
      ctx.font = '400 13px "EB Garamond", Garamond, serif';
      const line2 = 'click to open →', w2 = ctx.measureText(line2).width;
      const bw = Math.max(w1, w2) + 16, bh = 40;
      let best = null;
      for (const R of [64, 104, 150]) for (let k = 0; k < 8; k++) {
        const ang = k * Math.PI / 4, cx = a[0] + R * Math.cos(ang), cy = a[1] - R * Math.sin(ang);
        const x0 = cx - bw / 2, y0 = cy - bh / 2, x1 = x0 + bw, y1 = y0 + bh;
        if (x0 < 12 || y0 < 12 || x1 > W - 12 || y1 > H - 12) continue;
        let cost = 0;
        for (let i = 0; i < pts.length; i++) {
          const q = proj[i];
          if (q[0] > x0 - 6 && q[0] < x1 + 6 && q[1] > y0 - 6 && q[1] < y1 + 6) cost += pts[i].obj ? 1 : 0.3;
        }
        if (W > 760) {                                    // HUD overlays (desktop layout)
          if (x1 > W - 300 && y0 < 340) cost += 1000;     // object list
          if (x0 < 560 && y0 < 360) cost += 1000;         // name + intro (eyebrow is one line, ~530px)
          if (y1 > H - 60) cost += 1000;                  // caption line
        }
        cost += R * 0.02;                                 // prefer near
        if (!best || cost < best.cost) best = { cost, x0, y0, x1, y1, cx, cy };
      }
      if (best) {
        // leader from the anchor to the nearest edge midpoint of the box
        const ex = a[0] < best.x0 ? best.x0 : a[0] > best.x1 ? best.x1 : best.cx;
        const ey = a[1] < best.y0 ? best.y0 : a[1] > best.y1 ? best.y1 : best.cy;
        ctx.strokeStyle = hexA(o.color, 0.9); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.beginPath(); ctx.arc(a[0], a[1], 5, 0, Math.PI * 2); ctx.stroke();
        ctx.textAlign = 'left';
        ctx.font = '500 15px "EB Garamond", Garamond, serif'; ctx.fillStyle = hexA(o.color, 1); ctx.fillText(line1, best.x0 + 8, best.y0 + 12);
        ctx.font = '400 13px "EB Garamond", Garamond, serif'; ctx.fillStyle = 'rgba(185,179,168,1)'; ctx.fillText(line2, best.x0 + 8, best.y0 + 29);
      }
    }
    // retire the animation only now, after the frame that used it has been drawn
    if (finished) {
      if (anim.dir > 0) { anim.hold = true; const done = anim.onDone; anim.onDone = null; if (done) done(); }
      else anim = null;
    }
  }

  // Hit test against the drawn geometry: the nearest projected point of each object (tracks, clusters,
  // chamber hits) and, for missing energy, the dashed arrow itself. Falls back to the cluster centres.
  function segDist(px, py, ax, ay, bx, by) {
    const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2));
    return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
  }
  function hitTest(x, y) {
    let best = null, bd = 14;
    if (lastProj) {
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]; if (!p.obj || p.kind === 'met' || !byId[p.obj].name) continue;
        const q = lastProj[i], d = Math.hypot(q[0] - x, q[1] - y);
        if (d < bd) { bd = d; best = p.obj; }
      }
      const m0 = project(0, 0, 0), m1 = MET.screen;
      if (m1 && MET.name) { const d = segDist(x, y, m0[0], m0[1], m1[0], m1[1]); if (d < bd) { bd = d; best = MET.id; } }
    }
    if (!best) { bd = 42; for (const o of OBJECTS) { if (!o.screen || !o.name) continue; const d = Math.hypot(o.screen[0] - x, o.screen[1] - y); if (d < bd) { bd = d; best = o.id; } } }
    return best;
  }

  // ---------- pages ----------
  const sections = Object.fromEntries([...document.querySelectorAll('section.stage')].map(s => [s.dataset.obj, s]));
  const topLinks = [...document.querySelectorAll('.topbar nav a')];
  // history without the scroll-to-anchor side effect of setting location.hash
  function setHash(h) { try { history.pushState(null, '', h ? '#' + h : location.pathname + location.search); } catch (e) { /* ignore */ } }

  // Build each section's rail (vector, tag, heading, kinematics, back link) from the data, so index.html holds only the body text.
  for (const o of OBJECTS) {
    if (!o.name) continue;
    const sec = sections[o.id];
    if (!sec) { console.warn(`sections.yml lists "${o.id}" but index.html has no <section data-obj="${o.id}">`); continue; }
    const rail = document.createElement('div'); rail.className = 'rail';
    const vec = document.createElement('div'); vec.className = 'vec'; vec.setAttribute('aria-hidden', 'true'); vec.style.setProperty('--sw', o.color);
    vec.innerHTML = o.vec.map(v => `<i style="--a:${(0.25 + 0.75 * v).toFixed(2)}"></i>`).join('');
    const lab = document.createElement('div'); lab.className = 'veclabel'; lab.textContent = `${o.key} → z ∈ ℝ¹⁶ · radial profile`;
    const por = sec.querySelector(':scope > .portrait');            // an optional <figure class="portrait"> placed directly in the section
    if (por) { const row = document.createElement('div'); row.className = 'vecrow'; row.append(vec, por); rail.append(row); } else rail.append(vec);
    rail.append(lab);
    const tag = document.createElement('div'); tag.className = 'tag';
    const sw = document.createElement('span'); sw.className = 'sw'; sw.style.setProperty('--sw', o.color); tag.append(sw, `${o.key} · ${o.label}`);
    const h2 = document.createElement('h2'); h2.textContent = o.name;
    const kin = document.createElement('div'); kin.className = 'kin';
    kin.innerHTML = o.kin.map(([k, v]) => `<span>${k}</span>${v}`).join('<br>');
    const back = document.createElement('a'); back.className = 'back'; back.href = '#'; back.textContent = '← back to event';
    rail.append(tag, h2, kin, back);
    sec.prepend(rail);
  }
  // Plain pages: a <section class="stage" data-obj="…" data-title="…"> with no entry in sections.yml. No event object, so no
  // vector or kinematics; just the heading and the back link. Opened by any <a href="#id" data-page> (e.g. the HUD meta line).
  for (const [id, sec] of Object.entries(sections)) {
    if (byId[id]) continue;
    const rail = document.createElement('div'); rail.className = 'rail';
    const h2 = document.createElement('h2'); h2.textContent = sec.dataset.title || id;
    const back = document.createElement('a'); back.className = 'back'; back.href = '#'; back.textContent = '← back to event';
    rail.append(h2, back);
    sec.prepend(rail);
  }
  const pageLinks = [...document.querySelectorAll('a[data-page]')];
  // top-bar links: mark each with its object's key
  for (const a of topLinks) { const o = byId[a.getAttribute('href').slice(1)]; if (o) a.dataset.key = o.key; }

  function showPage(id, fromHistory) {
    anim = null;
    for (const s of Object.values(sections)) s.classList.toggle('open', s.dataset.obj === id);
    document.body.dataset.view = id;
    for (const a of topLinks) a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'page' : 'false');
    window.scrollTo({ top: 0, behavior: 'auto' });
    hud.classList.remove('fade'); canvas.classList.remove('busy');
    if (!fromHistory) setHash(id);
    sections[id].querySelector('h2').setAttribute('tabindex', '-1');
    sections[id].querySelector('h2').focus({ preventScroll: true });
  }
  function columnFor(o) {
    const a = o.screen || project(o.anchor[0], o.anchor[1], o.anchor[2]);
    return { x: Math.max(30, Math.min(W - 150, a[0])), y: Math.max(20, Math.min(H - COLH - 20, a[1] - COLH / 2)) };
  }
  function openObject(id) {
    if (anim && !anim.hold) return;
    const o = byId[id];
    if (!o || document.body.dataset.view || reduceMotion) { showPage(id); return; }
    hovered = null; syncList(); canvas.classList.add('busy'); hud.classList.add('fade');
    anim = { id, dir: 1, t0: performance.now(), dur: 900, col: columnFor(o), onDone: () => setTimeout(() => showPage(id), 160) };
  }
  function closePage(immediate, fromHistory) {
    const id = document.body.dataset.view;
    delete document.body.dataset.view;
    for (const s of Object.values(sections)) s.classList.remove('open');
    for (const a of topLinks) a.setAttribute('aria-current', 'false');
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (!fromHistory) setHash('');
    resize();
    if (id && byId[id] && !immediate && !reduceMotion) anim = { id, dir: -1, t0: performance.now(), dur: 700, col: columnFor(byId[id]) };
  }
  document.querySelectorAll('.rail .back').forEach(a => a.addEventListener('click', e => { e.preventDefault(); closePage(false); }));
  document.querySelector('[data-home]').addEventListener('click', e => { e.preventDefault(); if (document.body.dataset.view) closePage(false); });
  for (const a of topLinks) a.addEventListener('click', e => { e.preventDefault(); openObject(a.getAttribute('href').slice(1)); });
  for (const a of pageLinks) a.addEventListener('click', e => { e.preventDefault(); openObject(a.getAttribute('href').slice(1)); });
  window.addEventListener('popstate', () => {
    const h = location.hash.replace('#', '');
    if (sections[h]) { if (document.body.dataset.view !== h) showPage(h, true); }
    else if (document.body.dataset.view) closePage(true, true);
  });

  // ---------- object list ----------
  const listEls = [];
  function buildList(container) {
    const ul = container.tagName === 'UL' ? container : document.createElement('ul'); ul.className = 'objects';
    ul.innerHTML = SECTIONS.map(s => byId[s.id]).filter(o => o && o.name).map(o => `<li><button type="button" data-obj="${o.id}" style="--sw:${o.color}"><span class="sw"></span><span class="key">${o.key}</span><span class="sec">${o.name}</span></button></li>`).join('');
    if (ul !== container) container.appendChild(ul);
    ul.querySelectorAll('button').forEach(b => {
      b.addEventListener('mouseenter', () => { if (!anim) { hovered = b.dataset.obj; syncList(); } });
      b.addEventListener('mouseleave', () => { hovered = null; syncList(); });
      b.addEventListener('focus', () => { if (!anim) { hovered = b.dataset.obj; syncList(); } });
      b.addEventListener('blur', () => { hovered = null; syncList(); });
      b.addEventListener('click', () => openObject(b.dataset.obj));
      listEls.push(b);
    });
  }
  buildList(document.getElementById('objects')); buildList(document.getElementById('objects-mobile'));
  function syncList() {
    for (const b of listEls) b.classList.toggle('hot', hovered === b.dataset.obj);
    canvas.classList.toggle('hot', !!hovered && !dragging && !anim);
  }

  // ---------- pointer interaction ----------
  canvas.addEventListener('pointermove', e => {
    if (anim) return;
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (dragging && dragStart) {
      const dx = x - dragStart.x, dy = y - dragStart.y; if (Math.hypot(dx, dy) > 4) moved = true;
      yawT = dragStart.yaw + dx * 0.006; pitchT = Math.max(-1.3, Math.min(1.3, dragStart.pitch + dy * 0.006)); return;
    }
    hovered = hitTest(x, y); syncList();
  });
  canvas.addEventListener('pointerleave', () => { if (!dragging) { hovered = null; syncList(); } });
  canvas.addEventListener('pointerdown', e => {
    if (anim) return;
    const r = canvas.getBoundingClientRect(); dragging = true; moved = false;
    dragStart = { x: e.clientX - r.left, y: e.clientY - r.top, yaw: yawT, pitch: pitchT };
    canvas.classList.add('dragging'); canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false; canvas.classList.remove('dragging');
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (!moved) { const h = hitTest(x, y); if (h) { openObject(h); return; } }
    hovered = e.pointerType === 'mouse' ? hitTest(x, y) : null; syncList();
  });
  canvas.addEventListener('pointercancel', () => { dragging = false; canvas.classList.remove('dragging'); });

  // ---------- copy email ----------
  const copyBtn = document.getElementById('copy-email');
  copyBtn.addEventListener('click', () => {
    const addr = 'garrettwmerz@gmail.com';
    const done = () => { copyBtn.textContent = 'copied'; setTimeout(() => copyBtn.textContent = 'copy', 1600); };
    const fallback = () => { const sel = window.getSelection(), range = document.createRange(); range.selectNodeContents(document.getElementById('email').firstChild); sel.removeAllRanges(); sel.addRange(range); copyBtn.textContent = 'selected'; setTimeout(() => copyBtn.textContent = 'copy', 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(done, fallback); else fallback();
  });

  // deep link
  const h0 = (location.hash || '').replace('#', '');
  if (sections[h0]) {
    try { history.scrollRestoration = 'manual'; } catch (e) { /* ignore */ }
    showPage(h0, true);
    window.addEventListener('load', () => window.scrollTo(0, 0));   // section ids are page-*, so the fragment itself never scrolls
  }
  requestAnimationFrame(draw);
})();
