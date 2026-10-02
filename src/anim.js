/* ---------- Motion demos: stick figures, top-down drill maps, footwork ---------- */
const Anim = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const R = Math.PI / 180;
  const SEG = { T: 34, UA: 15, FA: 14, TH: 23, SH: 22, FT: 8, HE: 2.5, HR: 6.5, NK: 2.5 };
  const ease = {
    io: t => 0.5 - 0.5 * Math.cos(Math.PI * t),
    lin: t => t,
    in: t => t * t,
    out: t => 1 - (1 - t) * (1 - t),
    step: t => (t < 1 ? 0 : 1),
  };
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpArr = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

  /* ---------- stick figure ---------- */
  const DEF = { x: 120, air: 0, g: 0, t: 0, lf: [0, 0, 90], lb: [0, 0, 90], af: [0, 0], ab: [0, 0] };
  function fullPose(p, view) {
    const d = Object.assign({}, DEF, view === 'front' ? { lf: [0, 0, 90], lb: [0, 0, -90] } : {}, p);
    d.lf = d.lf.length === 2 ? [...d.lf, view === 'front' ? 90 : 90] : d.lf;
    d.lb = d.lb.length === 2 ? [...d.lb, view === 'front' ? -90 : 90] : d.lb;
    return d;
  }
  const dir = a => [Math.sin(a * R), Math.cos(a * R)];
  const add = (p, a, L) => { const v = dir(a); return [p[0] + v[0] * L, p[1] + v[1] * L]; };
  function solve(p, view, ground, anchor) {
    const front = view === 'front';
    const up = [Math.sin(p.t * R), -Math.cos(p.t * R)];
    const perp = [Math.cos(p.t * R), Math.sin(p.t * R)];
    const hip = [0, 0];
    const neck = [up[0] * SEG.T, up[1] * SEG.T];
    const head = [neck[0] + up[0] * (SEG.NK + SEG.HR), neck[1] + up[1] * (SEG.NK + SEG.HR)];
    const sh = [up[0] * SEG.T * 0.9, up[1] * SEG.T * 0.9];
    const so = front ? 8 : 0, ho = front ? 4.5 : 0;
    const shF = [sh[0] + perp[0] * so, sh[1] + perp[1] * so];
    const shB = [sh[0] - perp[0] * so, sh[1] - perp[1] * so];
    const hF = [ho, 0], hB = [-ho, 0];
    const ft = front ? 4.5 : SEG.FT;
    const leg = (h, a) => {
      const k = add(h, a[0], SEG.TH), an = add(k, a[1], SEG.SH);
      const toe = add(an, a[2], ft), heel = add(an, a[2] + 180, front ? 0 : SEG.HE);
      return { hip: h, knee: k, ankle: an, toe, heel };
    };
    const arm = (s, a) => { const e = add(s, a[0], SEG.UA); return { sh: s, elbow: e, hand: add(e, a[1], SEG.FA) }; };
    const L = { f: leg(hF, p.lf), b: leg(hB, p.lb) };
    const A = { f: arm(shF, p.af), b: arm(shB, p.ab) };
    const pts = [head, neck, L.f.knee, L.f.ankle, L.f.toe, L.f.heel, L.b.knee, L.b.ankle, L.b.toe, L.b.heel, A.f.elbow, A.f.hand, A.b.elbow, A.b.hand];
    let maxY = -1e9;
    if (anchor) {
      const named = { toeF: L.f.toe, toeB: L.b.toe, heelF: L.f.heel, heelB: L.b.heel, kneeF: L.f.knee, kneeB: L.b.knee, ankleF: L.f.ankle, ankleB: L.b.ankle, handF: A.f.hand, handB: A.b.hand, elbowF: A.f.elbow };
      anchor.forEach(n => { if (named[n][1] > maxY) maxY = named[n][1]; });
    } else pts.forEach(q => { const y = q === head ? q[1] + SEG.HR : q[1]; if (y > maxY) maxY = y; });
    const oy = ground - p.g - maxY - p.air, ox = p.x;
    const T = q => [q[0] + ox, q[1] + oy];
    const out = { head: T(head), neck: T(neck), hip: T(hip), L: {}, A: {} };
    for (const s of ['f', 'b']) {
      out.L[s] = {}; for (const k in L[s]) out.L[s][k] = T(L[s][k]);
      out.A[s] = {}; for (const k in A[s]) out.A[s][k] = T(A[s][k]);
    }
    out.hipMid = T([0, 0]);
    return out;
  }
  const P = q => q[0].toFixed(1) + ',' + q[1].toFixed(1);

  function propSVG(g, pr, sc) {
    const G = sc.ground;
    switch (pr.type) {
      case 'step': el('rect', { x: pr.x, y: G - pr.h, width: pr.w, height: pr.h, rx: 2, class: 'a-prop' }, g); break;
      case 'box': el('rect', { x: pr.x, y: G - pr.h, width: pr.w, height: pr.h, rx: 3, class: 'a-prop' }, g); break;
      case 'bench':
        el('rect', { x: pr.x, y: G - pr.h, width: pr.w, height: 5, rx: 2, class: 'a-prop' }, g);
        el('rect', { x: pr.x + 4, y: G - pr.h + 5, width: 4, height: pr.h - 5, class: 'a-prop' }, g);
        el('rect', { x: pr.x + pr.w - 8, y: G - pr.h + 5, width: 4, height: pr.h - 5, class: 'a-prop' }, g);
        break;
      case 'couch':
        el('rect', { x: pr.x, y: G - pr.h, width: pr.w, height: pr.h, rx: 6, class: 'a-prop' }, g);
        el('rect', { x: pr.x + (pr.back === 'left' ? 0 : pr.w - 12), y: G - pr.h - 22, width: 12, height: 26, rx: 5, class: 'a-prop' }, g);
        break;
      case 'wall': el('rect', { x: pr.x, y: 6, width: 8, height: G - 6, class: 'a-prop' }, g); break;
      case 'cone': el('path', { d: `M${pr.x - 6},${G} L${pr.x},${G - 13} L${pr.x + 6},${G} Z`, class: 'a-cone' }, g); break;
      case 'target':
        el('line', { x1: pr.x, y1: 0, x2: pr.x, y2: pr.y - 6, class: 'a-guide' }, g);
        el('circle', { cx: pr.x, cy: pr.y, r: 6, class: 'a-target' }, g); break;
      case 'line': el('line', { x1: pr.x, y1: G - 1, x2: pr.x, y2: G + 4, class: 'a-mark' }, g); break;
      case 'mark':
        el('line', { x1: pr.x, y1: G + 2, x2: pr.x, y2: G + 9, class: 'a-mark' }, g);
        if (pr.label) { const t = el('text', { x: pr.x, y: G + 17, class: 'a-small', 'text-anchor': 'middle' }, g); t.textContent = pr.label; }
        break;
      case 'arrow': {
        const y = pr.y; el('line', { x1: pr.x1, y1: y, x2: pr.x2, y2: y, class: 'a-arrow' }, g);
        const s = pr.x2 > pr.x1 ? -1 : 1;
        el('path', { d: `M${pr.x2 + s * 6},${y - 4} L${pr.x2},${y} L${pr.x2 + s * 6},${y + 4}`, class: 'a-arrow' }, g);
        if (pr.label) { const t = el('text', { x: (pr.x1 + pr.x2) / 2, y: y - 5, class: 'a-small', 'text-anchor': 'middle' }, g); t.textContent = pr.label; }
        break;
      }
      case 'raw': { const w = el('g', {}, g); w.innerHTML = pr.svg; break; }
      case 'text': { const t = el('text', { x: pr.x, y: pr.y, class: 'a-small', 'text-anchor': pr.anchor || 'middle' }, g); t.textContent = pr.text; break; }
    }
  }

  function buildFig(svg, sc) {
    const view = sc.view || 'side';
    const keys = sc.keys.map(k => Object.assign({}, k, { p: fullPose(k.p, view) }));
    el('line', { x1: 0, y1: sc.ground, x2: sc.w, y2: sc.ground, class: 'a-ground' }, svg);
    const pg = el('g', {}, svg);
    (sc.props || []).forEach(pr => propSVG(pg, pr, sc));
    const fg = el('g', {}, svg);
    const far = view === 'front' ? 'a-limb' : 'a-limb a-far';
    const legB = el('polyline', { class: far }, fg), armB = el('polyline', { class: far }, fg), heelB = el('line', { class: far }, fg);
    const torso = el('line', { class: 'a-torso' }, fg);
    const head = el('circle', { r: SEG.HR, class: 'a-head' }, fg);
    const legF = el('polyline', { class: 'a-limb' }, fg), heelF = el('line', { class: 'a-limb' }, fg), armF = el('polyline', { class: 'a-limb' }, fg);
    const ball = sc.ball ? el('circle', { r: sc.ballR || 6, class: sc.ballClass || 'a-ball' }, svg) : null;
    const cap = el('text', { x: 8, y: 16, class: 'a-cap' }, svg);
    const total = keys.reduce((s, k, i) => s + (i ? k.d : 0), 0) + (sc.tail || 0);
    const ballPos = (pose, k) => {
      if (!k.ball) return null;
      if (k.ball === 'f' || k.ball === 'b') { const f = solve(pose, view, sc.ground, sc.anchor); const h = f.A[k.ball].hand; return [h[0] + (k.ball === 'f' ? 3 : -3), h[1] - 3]; }
      if (k.ball === 'hands') { const f = solve(pose, view, sc.ground, sc.anchor); return [(f.A.f.hand[0] + f.A.b.hand[0]) / 2, (f.A.f.hand[1] + f.A.b.hand[1]) / 2 - 4]; }
      return [k.ball[0], sc.ground - k.ball[1]];
    };
    function frame(ms) {
      let t = ms % total, i = 1, acc = 0;
      while (i < keys.length && acc + keys[i].d < t) { acc += keys[i].d; i++; }
      let a, b, u;
      if (i >= keys.length) { a = b = keys[keys.length - 1]; u = 1; }
      else { a = keys[i - 1]; b = keys[i]; u = (ease[b.e || 'io'])(Math.min(1, (t - acc) / b.d)); }
      const pose = {};
      for (const k in a.p) pose[k] = Array.isArray(a.p[k]) ? lerpArr(a.p[k], b.p[k], u) : lerp(a.p[k], b.p[k], u);
      const f = solve(pose, view, sc.ground, sc.anchor);
      legB.setAttribute('points', [f.L.b.hip, f.L.b.knee, f.L.b.ankle, f.L.b.toe].map(P).join(' '));
      heelB.setAttribute('x1', f.L.b.ankle[0]); heelB.setAttribute('y1', f.L.b.ankle[1]); heelB.setAttribute('x2', f.L.b.heel[0]); heelB.setAttribute('y2', f.L.b.heel[1]);
      armB.setAttribute('points', [f.A.b.sh, f.A.b.elbow, f.A.b.hand].map(P).join(' '));
      torso.setAttribute('x1', f.hip[0]); torso.setAttribute('y1', f.hip[1]); torso.setAttribute('x2', f.neck[0]); torso.setAttribute('y2', f.neck[1]);
      head.setAttribute('cx', f.head[0]); head.setAttribute('cy', f.head[1]);
      legF.setAttribute('points', [f.L.f.hip, f.L.f.knee, f.L.f.ankle, f.L.f.toe].map(P).join(' '));
      heelF.setAttribute('x1', f.L.f.ankle[0]); heelF.setAttribute('y1', f.L.f.ankle[1]); heelF.setAttribute('x2', f.L.f.heel[0]); heelF.setAttribute('y2', f.L.f.heel[1]);
      armF.setAttribute('points', [f.A.f.sh, f.A.f.elbow, f.A.f.hand].map(P).join(' '));
      if (ball) {
        const pa = ballPos(fullPose(a.p, view), a), pb = ballPos(fullPose(b.p, view), b);
        if (pa && pb) { const q = lerpArr(pa, pb, u); ball.setAttribute('cx', q[0]); ball.setAttribute('cy', q[1]); ball.style.opacity = 1; }
        else ball.style.opacity = 0;
      }
      let c = ''; for (let j = 0; j < i && j < keys.length; j++) if (keys[j].cap !== undefined) c = keys[j].cap;
      if (i < keys.length && keys[i].cap !== undefined && u > 0.999) c = keys[i].cap;
      cap.textContent = c;
      if (sc.loopFade) { const fade = Math.min(1, t / 200, (total - t) / 200); fg.style.opacity = Math.max(0, fade); if (ball) ball.style.opacity = Math.min(+ball.style.opacity, fade); }
    }
    return { frame, total };
  }

  /* ---------- top-down drill map ---------- */
  function buildMap(svg, sc) {
    const bg = el('g', {}, svg); bg.innerHTML = sc.bg || '';
    const trail = el('polyline', { class: 'm-trail' }, svg);
    const dot = el('g', {}, svg);
    el('circle', { r: 7, class: 'm-dot' }, dot);
    el('path', { d: 'M3,-3.2 L7.5,0 L3,3.2', class: 'm-nose' }, dot);
    const cueBox = el('g', { class: 'm-cue' }, svg);
    const cueBg = el('rect', { rx: 8, class: 'm-cuebg' }, cueBox);
    const cueT = el('text', { 'text-anchor': 'middle', class: 'm-cuetext' }, cueBox);
    const cap = el('text', { x: 8, y: 16, class: 'a-cap' }, svg);
    let vi = 0, lastLoop = -1, pts = [], hist = [];
    const prep = v => {
      let t = 0; const segs = [];
      let cur = v.start;
      v.segs.forEach(s => { segs.push({ from: cur, to: s.to || cur, t0: t, d: s.d, e: s.e || 'io', cap: s.cap }); t += s.d; cur = s.to || cur; });
      return { segs, total: t + (sc.tail || 500), events: v.events || [] };
    };
    const P2 = sc.variants.map(prep);
    function frame(ms) {
      const v = P2[vi];
      const local = ms - (frame.base || 0);
      if (local >= v.total) {
        frame.base = ms; vi = sc.random ? Math.floor(Math.random() * P2.length) : (vi + 1) % P2.length; hist = [];
        return frame(ms);
      }
      let pos = v.segs[0].from, ang = 0, capTxt = '';
      for (const s of v.segs) {
        if (local >= s.t0) {
          const u = Math.min(1, (local - s.t0) / s.d);
          const k = ease[s.e](u);
          pos = lerpArr(s.from, s.to, k);
          if (s.to[0] !== s.from[0] || s.to[1] !== s.from[1]) ang = Math.atan2(s.to[1] - s.from[1], s.to[0] - s.from[0]) / R;
          if (s.cap !== undefined) capTxt = s.cap;
        }
      }
      frame.ang = ang;
      dot.setAttribute('transform', `translate(${pos[0]},${pos[1]}) rotate(${ang})`);
      hist.push(pos); if (hist.length > 40) hist.shift();
      trail.setAttribute('points', hist.map(P).join(' '));
      cap.textContent = capTxt;
      let cue = null;
      v.events.forEach(e => { if (local >= e.t && local < e.t + (e.d || 900)) cue = e; });
      if (cue) {
        cueBox.style.opacity = 1; cueT.textContent = cue.text;
        const cx = cue.x || sc.w / 2, cy = cue.y || 28;
        cueT.setAttribute('x', cx); cueT.setAttribute('y', cy + 6);
        const w = Math.max(44, cue.text.length * 10 + 20);
        cueBg.setAttribute('x', cx - w / 2); cueBg.setAttribute('y', cy - 13); cueBg.setAttribute('width', w); cueBg.setAttribute('height', 26);
      } else cueBox.style.opacity = 0;
    }
    frame.base = 0;
    return { frame, total: 1e9 };
  }

  /* ---------- footwork (top-down footprints) ---------- */
  const FOOT = 'M0,-12 C5,-12 6,-6 5.5,-1 C5,4 4.5,8 3.5,11 C2.5,13 -2.5,13 -3.5,11 C-4.5,8 -5,4 -5,-1 C-5.5,-7 -4,-12 0,-12 Z';
  function buildFeet(svg, sc) {
    const bg = el('g', {}, svg); bg.innerHTML = sc.bg || '';
    const mk = side => { const g = el('g', {}, svg); el('path', { d: FOOT, class: 'f-foot f-' + side, transform: side === 'L' ? 'scale(-1,1)' : '' }, g); return g; };
    const FL = mk('L'), FR = mk('R');
    const cap = el('text', { x: 8, y: 16, class: 'a-cap' }, svg);
    const keys = sc.keys;
    const total = keys.reduce((s, k, i) => s + (i ? k.d : 0), 0) + (sc.tail || 0);
    const put = (g, a, b, u, hop) => {
      if (!a && !b) { g.style.opacity = 0; return; }
      const A = a || b, B = b || a;
      const q = lerpArr(A, B, u);
      const moving = a && b && (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]);
      const s = moving ? 1 + 0.22 * Math.sin(Math.PI * u) : 1;
      g.style.opacity = (!a || !b) ? (a ? 1 - u : u) * 0.9 + 0.1 : 1;
      g.setAttribute('transform', `translate(${q[0]},${q[1]}) rotate(${q[2] || 0}) scale(${s})`);
    };
    function frame(ms) {
      let t = ms % total, i = 1, acc = 0;
      while (i < keys.length && acc + keys[i].d < t) { acc += keys[i].d; i++; }
      let a, b, u;
      if (i >= keys.length) { a = b = keys[keys.length - 1]; u = 1; }
      else { a = keys[i - 1]; b = keys[i]; u = (ease[b.e || 'io'])(Math.min(1, (t - acc) / b.d)); }
      put(FL, a.L, b.L, u); put(FR, a.R, b.R, u);
      let c = ''; for (let j = 0; j < i && j < keys.length; j++) if (keys[j].cap !== undefined) c = keys[j].cap;
      cap.textContent = c;
    }
    return { frame, total };
  }

  /* ---------- player ---------- */
  const live = new Set();
  let raf = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(now) {
    live.forEach(p => { if (p.playing && p.visible) p.draw(now - p.t0); });
    raf = live.size ? requestAnimationFrame(tick) : 0;
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { const p = e.target.__anim; if (p) p.visible = e.isIntersecting; }), { rootMargin: '80px' }) : null;

  function mount(host, sc) {
    if (host.__anim) return host.__anim;
    const svg = el('svg', { viewBox: `0 0 ${sc.w} ${sc.h}`, class: 'anim-svg', role: 'img', 'aria-label': sc.alt || 'Animated demonstration' });
    host.appendChild(svg);
    const eng = sc.kind === 'map' ? buildMap(svg, sc) : sc.kind === 'feet' ? buildFeet(svg, sc) : buildFig(svg, sc);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'anim-btn';
    host.appendChild(btn);
    const p = { draw: eng.frame, t0: performance.now(), playing: !reduce, visible: true, pausedAt: 0 };
    const label = () => { btn.textContent = p.playing ? 'Pause' : 'Play'; btn.setAttribute('aria-label', p.playing ? 'Pause demo' : 'Play demo'); };
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (p.playing) { p.pausedAt = performance.now() - p.t0; p.playing = false; }
      else { p.t0 = performance.now() - p.pausedAt; p.playing = true; if (!raf) raf = requestAnimationFrame(tick); }
      label();
    });
    label();
    eng.frame(sc.still || 0);
    host.__anim = p; live.add(p);
    if (io) io.observe(host);
    if (!raf) raf = requestAnimationFrame(tick);
    return p;
  }
  function renderAt(host, sc, ms) { // for testing
    const svg = el('svg', { viewBox: `0 0 ${sc.w} ${sc.h}`, class: 'anim-svg' }); host.appendChild(svg);
    const eng = sc.kind === 'map' ? buildMap(svg, sc) : sc.kind === 'feet' ? buildFeet(svg, sc) : buildFig(svg, sc);
    eng.frame(ms); return eng;
  }
  return { mount, renderAt };
})();
