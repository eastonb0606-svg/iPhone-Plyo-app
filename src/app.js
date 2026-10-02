/* ---------- App ---------- */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ORDER = ['A', 'C', 'B'];
  const TEST_WEEKS = [2, 8, 12];
  const DELOAD = [4, 8, 12];
  const phaseOf = w => (w <= 4 ? 1 : w <= 8 ? 2 : 3);

  const ICON = {
    chev: '<svg class="chev" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5l4 4 8-9"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>',
    ext: '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 4H4v12h12v-4M11 3h6v6M17 3l-8 8"/></svg>',
    timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>',
    train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 18l5-6 4 3 7-9"/><circle cx="20" cy="6" r="1.5"/></svg>',
    tests: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M3 14.5h18"/></svg>',
    guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 21V5M9 8h6"/></svg>',
  };

  /* ---------- state ---------- */
  const KEY = 'spring12-state-v1';
  const fresh = () => ({ v: 1, round: 1, week: 1, checks: {}, sess: {}, log: [], tests: {}, settings: { takeoff: '', reach: '', awake: true }, updatedAt: 0 });
  const normalize = s => { const f = fresh(); s = Object.assign(f, s || {}); s.settings = Object.assign(fresh().settings, s.settings || {}); return s; };
  let S = (() => { try { const r = localStorage.getItem(KEY); if (r) return normalize(JSON.parse(r)); } catch (e) {} return fresh(); })();
  let ui = (() => { try { return Object.assign({ tab: 'train', session: null }, JSON.parse(localStorage.getItem(KEY + '-ui') || '{}')); } catch (e) { return { tab: 'train', session: null }; } })();
  const saveUI = () => { try { localStorage.setItem(KEY + '-ui', JSON.stringify(ui)); } catch (e) {} };

  const cloud = { ref: null, timer: 0, writing: false, again: false, on: false };
  function commit() {
    S.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    if (cloud.ref) { clearTimeout(cloud.timer); cloud.timer = setTimeout(flush, 900); }
  }
  async function flush() {
    if (!cloud.ref) return;
    if (cloud.writing) { cloud.again = true; return; }
    cloud.writing = true;
    try { await cloud.ref.set(JSON.parse(JSON.stringify(S))); setSync(true); }
    catch (e) { if (e && (e.code === 'invalid_argument' || e.code === 'revoked')) { cloud.ref = null; setSync(false); } }
    cloud.writing = false;
    if (cloud.again) { cloud.again = false; flush(); }
  }
  function setSync(on) { cloud.on = on; $$('.sync').forEach(el => { el.classList.toggle('on', on); el.lastElementChild.textContent = on ? 'Synced' : 'On this device'; }); }
  async function connect() {
    try {
      if (!window.claude || !window.claude.use) return;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const id = await user.id(); if (!id) return;
      const ref = db.collection('data/users/' + id).doc('spring12');
      const snap = await ref.get();
      cloud.ref = ref;
      if (snap.exists) {
        const remote = normalize(JSON.parse(JSON.stringify(snap.data())));
        if ((remote.updatedAt || 0) > (S.updatedAt || 0)) { S = remote; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} render(); }
        else if ((S.updatedAt || 0) > (remote.updatedAt || 0)) flush();
      } else if (S.updatedAt) flush();
      setSync(true);
    } catch (e) { /* stay local */ }
  }

  /* ---------- helpers ---------- */
  const wk = () => `r${S.round}w${S.week}`;
  const blockKey = (sid, bid) => `${wk()}-${sid}-${bid}`;
  const logFor = (sid, w = S.week, r = S.round) => S.log.find(e => e.id === `r${r}w${w}-${sid}`);
  const doneCount = sid => SESSIONS[sid].blocks.filter(b => S.checks[blockKey(sid, b.id)]).length;
  const isDeload = () => DELOAD.includes(S.week);
  const isTestWeek = () => TEST_WEEKS.includes(S.week);
  const rxFor = b => { if (isDeload() && b.dl) return b.dl; const p = phaseOf(S.week); return b.rx[Math.min(p, b.rx.length) - 1]; };
  const exFor = b => b.exByPhase ? b.exByPhase[phaseOf(S.week) - 1] : (b.ex || []);
  const TEST_BLOCKS = { approach: 'touch + touch with ball', broad: 'broad jump', single: 'single-leg hop-and-stick', accel: '10-yd sprint', cuts: '5-10-5 shuttle', rhythm: 'smoothness video' };
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }

  const parseLen = str => {
    if (str == null) return null; const s = String(str).trim(); if (!s) return null;
    let m = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|’|ft|f)\s*(\d+(?:\.\d+)?)?\s*(?:"|”|in)?$/i);
    if (m) return parseFloat(m[1]) * 12 + (m[2] ? parseFloat(m[2]) : 0);
    m = s.match(/^(\d+)\s+(\d+(?:\.\d+)?)$/); if (m) return parseInt(m[1]) * 12 + parseFloat(m[2]);
    m = s.match(/^(\d+(?:\.\d+)?)\s*(?:"|”|in)?$/i); if (m) return parseFloat(m[1]);
    return null;
  };
  const fmtLen = n => { if (n == null || isNaN(n)) return ''; const r = Math.round(n * 2) / 2; const ft = Math.floor(r / 12), inch = r - ft * 12; return `${ft}′ ${inch % 1 ? inch.toFixed(1) : inch}″`; };
  const parseVal = (t, v) => t.unit === 'len' ? parseLen(v) : (v === '' || v == null ? null : (isNaN(parseFloat(v)) ? null : parseFloat(v)));
  const fmtVal = (t, n) => n == null ? '' : t.unit === 'len' ? fmtLen(n) : n.toFixed(2) + ' s';

  /* ---------- pieces ---------- */
  function exCard(id, opts = {}) {
    const e = EX[id]; if (!e) return '';
    let demo = e.demo; if (id === 'approach' && S.settings.takeoff === 'one') demo = e.demoOne;
    const steps = (e.steps || []).map(s => {
      if (s === 'TAKEOFF') return `<li>${esc(e.takeoff[S.settings.takeoff || 'none'])}</li>`;
      return `<li>${esc(s)}</li>`;
    }).join('');
    const extra = [];
    if (e.mistakes) extra.push(`<details class="mini"><summary>${ICON.chev}Common mistakes</summary><div><ul>${e.mistakes.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div></details>`);
    if (e.easier || e.harder) extra.push(`<details class="mini"><summary>${ICON.chev}Make it easier or harder</summary><div>${e.easier ? `<p><b>Easier:</b> ${esc(e.easier)}</p>` : ''}${e.harder ? `<p style="margin-top:6px"><b>Harder:</b> ${esc(e.harder)}</p>` : ''}</div></details>`);
    if (e.why) extra.push(`<details class="mini"><summary>${ICON.chev}Why it’s in the program</summary><div><p>${esc(e.why)}</p></div></details>`);
    return `<details class="ex" ${opts.open ? 'open' : ''}><summary>${ICON.chev}<span class="nm">${esc(e.name)}</span>${e.dose && !opts.noDose ? `<span class="ds">${esc(e.dose)}</span>` : ''}</summary>
      <div class="ex-body">
        ${demo ? `<div class="demo" data-scene="${demo}"></div>` : ''}
        ${e.what ? `<p>${esc(e.what)}</p>` : ''}
        ${e.cue ? `<div class="cue"><b>Cue</b><q>${esc(e.cue)}</q></div>` : ''}
        ${steps ? `<h4>How to do it</h4><ol>${steps}</ol>` : ''}
        ${e.phaseNote ? `<p class="note">${esc(e.phaseNote)}</p>` : ''}
        ${e.safety ? `<p class="note">${esc(e.safety)}</p>` : ''}
        ${extra.join('')}
        ${e.video ? `<a class="ext" href="${YT(e.video)}" target="_blank" rel="noopener">Watch real videos on YouTube ${ICON.ext}</a>` : ''}
      </div></details>`;
  }

  function weekHeader() {
    const p = phaseOf(S.week), ph = PHASES[p - 1];
    const chips = Array.from({ length: 12 }, (_, i) => {
      const w = i + 1, n = ['A', 'B', 'C'].filter(s => logFor(s, w)).length;
      return `<button class="chip p${phaseOf(w)} ${w === S.week ? 'cur' : ''}" data-week="${w}" aria-label="Week ${w}, ${n} of 3 sessions logged"><span class="bar"><b style="width:${(n / 3) * 100}%"></b></span><span class="lbl">${w}</span></button>`;
    }).join('');
    return `<div class="week">
        <button class="icon-btn" data-act="wk-" ${S.week <= 1 ? 'disabled' : ''} aria-label="Previous week">‹</button>
        <div class="week-mid"><div class="week-num">Week ${S.week} <span>/ 12</span></div><div class="week-sub">Phase ${p} · ${ph.name}${S.round > 1 ? ` · Round ${S.round}` : ''}${isDeload() ? ' · Deload' : ''}</div></div>
        <button class="icon-btn" data-act="wk+" ${S.week >= 12 ? 'disabled' : ''} aria-label="Next week">›</button>
      </div>
      <div class="strip">${chips}</div>
      <div class="phase-key"><span>Re-entry</span><span>Build</span><span>Express</span></div>`;
  }

  /* ---------- views ---------- */
  function viewTrain() {
    const next = ORDER.find(s => !logFor(s));
    const banners = [];
    if (isTestWeek()) banners.push(`<div class="banner test"><strong>${S.week === 2 ? 'Baseline test week' : 'Retest week'}</strong><p>${S.week === 2 ? 'Run the tests inside Sessions A and B this week. Blocks marked <span class="tag">Test</span> become test reps. Test both one-foot and two-foot takeoffs and keep the one that touches higher.' : 'At the end of this week, run the tests inside your (lighter) Sessions A and B. Blocks marked <span class="tag">Test</span> become test reps.'}</p><button class="btn small ghost" data-act="go-tests">Open the test sheet</button></div>`);
    if (isDeload()) banners.push(`<div class="banner deload"><strong>Deload week</strong><p>About half the reps and sets, same quality. This is when the last three weeks of work actually sink in. The app has already cut the numbers for you.</p></div>`);
    const cards = ORDER.map(sid => {
      const s = SESSIONS[sid], d = doneCount(sid), n = s.blocks.length, lg = logFor(sid);
      const st = lg ? '<span class="pill done">Logged</span>' : d ? `<span class="pill prog">${d}/${n} done</span>` : `<span class="pill ${s.level === 'High' ? 'hi' : 'lo'}">${s.level}</span>`;
      return `<button class="sess s-${sid}" data-open="${sid}"><span class="badge">${sid}</span><span><h3>${esc(s.name)}</h3><span class="meta">~${s.minutes} min · ${esc(s.where)}</span></span>${st}</button>`;
    }).join('');
    const nextCard = next
      ? `<div class="card next s-${next}"><div><div class="eyebrow">Next up</div><h2 style="margin-top:4px">Session ${next}: ${esc(SESSIONS[next].name)}</h2></div><button class="btn s" data-open="${next}">Start</button></div>`
      : `<div class="card"><div class="eyebrow">Week ${S.week} complete</div><h2>All three sessions logged.</h2>${S.week < 12 ? `<button class="btn" data-act="wk+">Go to week ${S.week + 1}</button>` : `<p class="muted">You finished the 12 weeks. Start a new round from the Guide tab (Your setup) and set new targets from your week-12 tests.</p>`}</div>`;
    return `<div class="view">
      ${banners.join('')}
      ${nextCard}
      <div><div class="eyebrow" style="margin-bottom:8px">This week · suggested order A → C → B</div><div class="sess-list">${cards}</div></div>
      <div class="card" style="gap:0">
        <details class="fold"><summary>${ICON.chev}The 3 rules that matter most</summary><div class="fold-body">
          <ol><li><b>Leg day goes on an A or B day, after the session.</b> Same day, right after or later. The day after A is OK. Never the day before A or B.</li>
          <li><b>Leave 1–2 reps in reserve</b> on leg lifts, and keep loads below where you cramp.</li>
          <li><b>Stop a jump block</b> when two reps in a row clearly fall short of your best.</li></ol>
          <p class="muted small">Why: heavy legs and jumping slow your sprinting and cutting for up to 72 hours. See Guide → What the research says.</p></div></details>
        <details class="fold"><summary>${ICON.chev}How a week works</summary><div class="fold-body">
          <p>Three sessions a week: two high-intensity (A and B) and one low (C). Put at least one day between A and B. C fits anywhere, even the day before a game.</p>
          <p>A fourth session would put a high day inside the 72-hour fatigue window from leg day, and the research says it wouldn’t help anyway.</p>
          <p><b>Flag football or pickup game that week?</b> It replaces Session B. Do B’s Nordics at the end of Session A instead.</p>
          <p><b>Only 2 gym days?</b> Put both right after A and B.</p></div></details>
        <details class="fold"><summary>${ICON.chev}What you need</summary><div class="fold-body">
          <ul><li>A basketball</li><li>6–8 markers (shoes, water bottles)</li><li>Sidewalk chalk + a wall or garage door for jump testing</li><li>Cleats for grass</li><li>Your phone (slo-mo video + this app)</li><li>A couch (Nordics, Copenhagens) and a stair (calf raises)</li><li>A friend helps for reactive drills but isn’t required</li></ul>
          <p class="muted small">No equipment to borrow. Everything works in a backyard about 10 yards wide.</p></div></details>
        <details class="fold"><summary>${ICON.chev}Rain, wet grass and indoors</summary><div class="fold-body">
          <ul><li><b>Rain:</b> do Session C that day and push the high session to the next dry day.</li><li><b>Wet grass:</b> cleats on, and keep cuts below max.</li><li><b>Indoors:</b> never do max jumps inside. Your ceiling is about 8 feet, and your head goes higher than that.</li></ul></div></details>
      </div>
    </div>`;
  }

  function viewSession(sid) {
    const s = SESSIONS[sid], ses = S.sess[`${wk()}-${sid}`] || {}, lg = logFor(sid);
    const rows = s.blocks.map(b => {
      const k = blockKey(sid, b.id), on = !!S.checks[k];
      const testTag = isTestWeek() && TEST_BLOCKS[b.id] ? `<span class="tag">Test</span>` : '';
      let body = '';
      if (b.warmup) {
        body = `<p class="small muted">Same routine every time so it becomes automatic. It’s built on the FIFA 11+ model. Set your markers out during the walk-backs on the skip series.</p>
          <div class="nine">${NINE.map(n => `<div class="nine-row"><span class="t">${n.min}</span><span>${esc(n.what)}</span></div>`).join('')}</div>
          ${NINE.flatMap(n => n.ex).map(id => exCard(id)).join('')}`;
      } else {
        const exs = exFor(b);
        body = `${b.how ? `<p class="how">${esc(b.how)}</p>` : ''}
          ${testTag ? `<p class="note">Test week: today this block is your <b>${TEST_BLOCKS[b.id]}</b> test. Log the result on the Tests tab.</p>` : ''}
          ${exs.map(id => exCard(id)).join('')}
          ${b.rx.length > 1 ? `<details class="mini"><summary>${ICON.chev}How this block changes by phase</summary><div><ol>${b.rx.map((r, i) => `<li${phaseOf(S.week) === i + 1 ? ' style="font-weight:600"' : ''}>Phase ${i + 1}: ${esc(r)}</li>`).join('')}</ol>${b.dl ? `<p class="small muted" style="margin-top:6px">Deload weeks: ${esc(b.dl)}</p>` : ''}</div></details>` : ''}`;
      }
      return `<div class="row ${on ? 'checked' : ''}" data-row="${b.id}">
        <details><summary><span class="t">${b.time}</span><span><span class="bn"><span class="label">${esc(b.name)}</span>${testTag}</span><span class="rx"><b>${esc(rxFor(b))}</b></span></span></summary>
        <div class="row-body">${body}</div></details>
        <button class="chk" data-chk="${b.id}" aria-pressed="${on}" aria-label="Mark ${esc(b.name)} done"><i>${ICON.check}</i></button>
      </div>`;
    }).join('');
    const eff = ses.effort || 0;
    return `<div class="view s-${sid}">
      <button class="back" data-act="back">‹ All sessions</button>
      <div class="s-head"><span class="badge">${sid}</span><div><div class="eyebrow">Session ${sid} · Week ${S.week}</div><h1>${esc(s.name)}</h1></div></div>
      <div class="chips"><span class="pill ${s.level === 'High' ? 'hi' : 'lo'}">${s.level} intensity</span><span class="pill">~${s.minutes} min</span><span class="pill">${esc(s.where)}</span>${isDeload() ? '<span class="pill dl">Deload</span>' : ''}${isTestWeek() && sid !== 'C' ? '<span class="pill test">Test week</span>' : ''}</div>
      <p>${esc(s.intro)}</p>
      <div class="card" style="gap:0;padding-block:4px">
        <details class="fold"><summary>${ICON.chev}Why this session exists</summary><div class="fold-body"><p>${esc(s.why)}</p>${s.contacts ? `<p class="small muted">Jump volume this phase: ${esc(s.contacts[phaseOf(S.week) - 1])}.</p>` : ''}</div></details>
        <details class="fold"><summary>${ICON.chev}What you need</summary><div class="fold-body"><p>${esc(s.gear)}</p></div></details>
        <details class="fold"><summary>${ICON.chev}How to use this sheet</summary><div class="fold-body"><p>Each row is one block. The left column is the minute mark. Tap a row to open it for the how-to, demos and the reasons behind it. Tap the box on the right when you finish the block. Use the timer button for holds and rest.</p></div></details>
      </div>
      <div class="sheet"><div class="sheet-head"><span>Min</span><span>Block · this week</span><span>Done</span></div>${rows}</div>
      <div class="stop">${ICON.warn}<p>${esc(s.stop)}</p></div>
      <div class="card">
        <h3>Finish & log</h3>
        <div><label class="lbl" id="eff-l">How hard did it feel? (1 = easy, 10 = max)</label><div class="scale" role="group" aria-labelledby="eff-l">${Array.from({ length: 10 }, (_, i) => `<button data-eff="${i + 1}" aria-pressed="${eff === i + 1}">${i + 1}</button>`).join('')}</div>
        <div class="scale-key"><span>easy</span><span>${sid === 'C' ? 'C should be 3–5' : 'quality, not exhaustion'}</span><span>max</span></div></div>
        <div><label class="lbl" for="notes-${sid}">Notes (best touch, how legs felt, anything weird)</label><textarea id="notes-${sid}" data-notes="${sid}" placeholder="e.g. touched the gutter twice, left calf tight">${esc(ses.notes || '')}</textarea></div>
        <label class="toggle"><input type="checkbox" id="awake" ${S.settings.awake ? 'checked' : ''}> Keep the screen on during this session</label>
        <button class="btn s" data-act="save" data-sid="${sid}">${lg ? 'Update log entry' : 'Save to log'}</button>
        ${lg ? `<p class="small muted">Logged ${new Date(lg.date).toLocaleDateString()}. Saving again updates it.</p>` : ''}
      </div>
    </div>`;
  }

  let testWeek = 2;
  function viewTests() {
    const r = S.round, cols = TEST_WEEKS;
    const T = w => S.tests[`r${r}w${w}`] || {};
    const reach = parseLen(S.settings.reach);
    const rows = TESTS.map(t => {
      const vals = cols.map(w => parseVal(t, T(w)[t.id]));
      const base = vals[0], last = [...vals].reverse().find(v => v != null);
      let delta = '';
      if (base != null && last != null && last !== base) {
        const d = last - base, good = t.better === 'high' ? d > 0 : d < 0;
        delta = `<span class="delta ${good ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${t.unit === 'len' ? Math.abs(d).toFixed(1) + ' in' : Math.abs(d).toFixed(2) + ' s'} vs baseline</span>`;
      }
      let extra = '';
      if (t.id === 'touch' || t.id === 'touchBall') {
        const best = vals.filter(v => v != null).reduce((a, b) => Math.max(a, b), 0);
        if (best) {
          const lo = 96, hi = 132, pct = x => Math.max(0, Math.min(100, (x - lo) / (hi - lo) * 100));
          extra = `<div class="meter" aria-label="Best touch ${fmtLen(best)} compared with rim height"><div class="track"><div class="fill" style="width:${pct(best)}%"></div></div><div class="mk" style="left:${pct(120)}%"><span>rim 10′</span></div><div class="mk" style="left:${pct(126)}%;opacity:.6"><span style="top:-14px">10′6″</span></div></div>
          <p class="small muted">Best: <b class="num">${fmtLen(best)}</b>${reach ? ` · vertical ≈ <b class="num">${(best - reach).toFixed(1)} in</b>` : ''}. Rough rule of thumb: dunking a basketball takes a touch around 6 inches above the rim (10′6″), less with a smaller ball.</p>`;
        }
      }
      const calc = t.frames ? `<details class="mini"><summary>${ICON.chev}Frame calculator</summary><div><div class="calc">
          <div><label class="lbl" for="f1-${t.id}">Start frame</label><input id="f1-${t.id}" inputmode="numeric" data-f1></div>
          <div><label class="lbl" for="f2-${t.id}">End frame</label><input id="f2-${t.id}" inputmode="numeric" data-f2></div>
          <div><span class="calc-out" data-fout>–</span></div></div>
          <p class="small muted" style="margin-top:6px">Most video apps step one frame at a time when you drag slowly. Note the frame number at first movement and at the finish. Time = (end − start) ÷ 240.</p></div></details>` : '';
      return `<div class="card">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline"><h3>${esc(t.name)}</h3>${delta}</div>
        <div class="test-grid">${cols.map((w, i) => `<div><label for="t-${t.id}-${w}">Wk ${w}${i === 0 ? ' · base' : ''}</label><input id="t-${t.id}-${w}" data-test="${t.id}" data-w="${w}" inputmode="${t.unit === 'len' ? 'text' : 'decimal'}" placeholder="–" value="${esc(t.unit === 'len' && vals[i] != null ? fmtLen(vals[i]) : (T(w)[t.id] || ''))}"></div>`).join('')}</div>
        ${extra}
        <details class="mini"><summary>${ICON.chev}How to test it</summary><div><p>${esc(t.how)}</p></div></details>
        ${calc}
        ${t.ex && EX[t.ex] && EX[t.ex].demo ? `<details class="mini"><summary>${ICON.chev}See the movement</summary><div><div class="demo" data-scene="${t.ex === 'approach' && S.settings.takeoff === 'one' ? 'approach1' : EX[t.ex].demo}"></div></div></details>` : ''}
      </div>`;
    }).join('');
    const sm = T(testWeek).smooth || {};
    return `<div class="view">
      <div><div class="eyebrow">Weeks 2, 8 and 12${S.round > 1 ? ` · Round ${S.round}` : ''}</div><h1>Test sheet</h1></div>
      <p class="muted">Type a result in any box. Lengths take <span class="num">10'4"</span>, <span class="num">10 4</span> or plain inches (<span class="num">124</span>). Times in seconds. Green means better than your week-2 baseline.</p>
      <div class="card" style="gap:0;padding-block:4px">
        <details class="fold"><summary>${ICON.chev}Test-day order (do it like this)</summary><div class="fold-body"><ol>
          <li>The 9 warm-up.</li><li>10-yd sprint × 3 (2 min rest). Sprints first, while you’re fresh.</li><li>5-10-5 × 2, one starting each direction.</li><li>Approach touch × 3, no ball and with ball (week 2: both takeoffs).</li><li>Broad jump × 3.</li><li>Single-leg hop-and-stick × 2 per leg.</li><li>Smoothness video: a side-view slow-mo of a 20-yd run at 90%.</li></ol>
          <p class="small muted">In test weeks these replace the matching blocks in Sessions A and B. You don’t need an extra day.</p></div></details>
        <details class="fold"><summary>${ICON.chev}Your standing reach (for vertical jump)</summary><div class="fold-body">
          <p class="small">Stand side-on to the wall, flat-footed, and reach as high as you can with one hand. Measure from the floor.</p>
          <input id="reach" data-setting="reach" inputmode="text" placeholder="e.g. 8'2&quot;" value="${esc(reach ? fmtLen(reach) : '')}"></div></details>
      </div>
      ${rows}
      <div class="card">
        <h3>Smoothness video</h3>
        <p class="small">Film a side-view slow-mo of a 20-yard run at 90%. This video will show progress before any number does. Compare each test against the last.</p>
        <div class="tabs-mini" role="group" aria-label="Test week">${cols.map(w => `<button data-sweek="${w}" aria-pressed="${w === testWeek}">Week ${w}</button>`).join('')}</div>
        <div class="check-list">${SMOOTH.map(c => `<label class="toggle"><input type="checkbox" data-smooth="${c.id}" ${sm[c.id] ? 'checked' : ''}> ${esc(c.label)}</label>`).join('')}</div>
        <div><label class="lbl" for="smooth-note">Notes for week ${testWeek}</label><textarea id="smooth-note" data-smoothnote placeholder="What looks better or worse than last time?">${esc(sm.note || '')}</textarea></div>
        <div class="demo" data-scene="sprint"></div>
      </div>
    </div>`;
  }

  function viewLog() {
    const entries = S.log.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const total = S.log.filter(e => e.round === S.round).length;
    const avgEff = (() => { const e = S.log.filter(x => x.effort); return e.length ? (e.reduce((a, b) => a + b.effort, 0) / e.length).toFixed(1) : '–'; })();
    const rows = entries.map(e => `<tr data-entry="${e.id}"><td class="num">R${e.round} · W${e.week}</td><td><span class="s-${e.session}" style="color:var(--s);font-weight:700">${e.session}</span> ${esc(SESSIONS[e.session].short)}</td><td class="num">${new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td><td class="num">${e.done}/${e.total}</td><td class="num">${e.effort || '–'}</td><td class="notes">${esc(e.notes || '')}</td><td><button class="btn small ghost" data-del="${e.id}">Delete</button></td></tr>`).join('');
    return `<div class="view">
      <div><div class="eyebrow">Your training sheet</div><h1>Log</h1></div>
      <div class="stats"><div class="stat"><b class="num">${total}<span style="font-size:16px;color:var(--muted)">/36</span></b><span>sessions this round</span></div><div class="stat"><b class="num">${S.week}</b><span>current week</span></div><div class="stat"><b class="num">${avgEff}</b><span>avg effort</span></div></div>
      ${entries.length ? `<div class="table-wrap"><table><thead><tr><th>Week</th><th>Session</th><th>Date</th><th>Blocks</th><th>Effort</th><th>Notes</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="small muted">Swipe the table sideways to see every column.</p>
        <button class="btn ghost" data-act="csv" id="csv-btn">Download as spreadsheet (CSV)</button>`
        : `<div class="card empty"><h3>No sessions logged yet</h3><p>Finish a session, then tap <b>Save to log</b> at the bottom. Each one shows up here as a row, like a spreadsheet.</p><button class="btn" data-act="go-train">Go to this week’s sessions</button></div>`}
    </div>`;
  }

  function viewGuide() {
    const fold = (title, body, open) => `<details class="fold" ${open ? 'open' : ''}><summary>${ICON.chev}${title}</summary><div class="fold-body">${body}</div></details>`;
    const research = RESEARCH.map(r => `<details class="fold"><summary>${ICON.chev}<span style="flex:1">${esc(r.title)}</span><span class="lvl ${r.level}">${r.level}</span></summary><div class="fold-body">
        <p>${esc(r.plain)}</p><p><b>What it means for you:</b> ${esc(r.forYou)}</p>
        ${r.fix ? `<p class="note"><b>Fact-check:</b> ${esc(r.fix)}</p>` : ''}
        <div class="src">${r.src.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join('')}</div></div></details>`).join('');
    const phaseRows = [
      ['A: approach jumps', ['8 reps at ~85–90%. Week 2 = baseline test.', '10 reps, full intent, half with ball', '10–12 reps, full intent, ⅔ with ball']],
      ['A: reactive', ['Low reactive hops', 'Drop jumps, 12–18 in', 'Drop jumps at your best height']],
      ['A: total contacts', ['~40', '~55', '~45–50, more max-effort reps']],
      ['B: speed & evasion', ['85–90%, reactive at 80%', 'Full intent', 'Full intent + flying 10s, 1v1 if possible']],
      ['B: cuts', ['75–80%', '90%+', 'Full']],
      ['C', ['Easiest variants', 'Eyes closed, dual-task, long-lever Copenhagen', 'More random: friend calls directions, faster shadow evasion']],
    ];
    const phases = PHASES.map(p => `<div class="card" style="gap:8px"><div class="eyebrow">Phase ${p.n} · weeks ${p.weeks}</div><h3>${p.name}</h3><p class="small">${esc(p.summary)}</p><div class="phase-table">${phaseRows.map(([k, v]) => `<div class="phase-row"><b>${k}</b><span>${esc(v[p.n - 1])}</span></div>`).join('')}</div></div>`).join('');
    const tk = S.settings.takeoff;
    return `<div class="view">
      <div><div class="eyebrow">Everything explained</div><h1>Guide</h1></div>
      <div class="card" style="gap:0;padding-block:4px">
        ${fold('Your setup', `
          <div><label class="lbl">Jump takeoff (decided by your week-2 test)</label><div class="tabs-mini" role="group">${[['', 'Not sure yet'], ['one', 'One-foot'], ['two', 'Two-foot']].map(([v, l]) => `<button data-takeoff="${v}" aria-pressed="${tk === v}">${l}</button>`).join('')}</div></div>
          <p class="small muted">This changes the approach-jump instructions and demo.</p>
          <div class="toggle"><span class="sync ${cloud.on ? 'on' : ''}" style="margin:0"><i></i><span>${cloud.on ? 'Synced' : 'On this device'}</span></span></div>
          <p class="small muted">${cloud.on ? 'Your checkmarks, log and tests are saved to your Claude account, so they show up on any device where you open this link.' : 'Your data is saved on this device. When you open the app signed in to Claude, it also syncs to your account.'}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small ghost" data-act="new-round">Start a new 12-week round</button><button class="btn small ghost" data-act="reset">Erase all data…</button></div>
          <div id="confirm"></div>`, true)}
        ${fold('Put this app on your home screen', `<ol><li>Open this page in <b>Safari</b> on your iPhone.</li><li>Tap the <b>Share</b> button (the square with an arrow pointing up).</li><li>Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.</li><li>Now it opens from its own icon like any app.</li></ol>`)}
        ${fold('How this program works (1-minute read)', `<p>Three sessions a week: two hard (A: Jump & Land, B: Speed, Cuts & Evasion) and one easy (C: Control, Rhythm & Armor). Twelve weeks in three 4-week phases. Weeks 4, 8 and 12 are lighter. You test in weeks 2, 8 and 12.</p><p>The days don’t matter. The order does: A → C → B, with at least a day between A and B, and leg day placed right after A or B.</p><p>After week 12, run the cycle again with targets from your retest.</p>`)}
        ${fold('Effort levels, in plain English', `<dl class="gloss"><dt>70%</dt><dd>Fast but comfortable. Smooth.</dd><dt>80%</dt><dd>Clearly fast, still relaxed.</dd><dt>85–90%</dt><dd>Fast and controlled. Not straining.</dd><dt>Full effort</dt><dd>Everything you have, while staying loose. Tense ≠ fast.</dd></dl>`)}
        ${fold('Leg day and your bodybuilding', `<p><b>Rule:</b> lower-body gym work goes on the same day as A or B, after the session (right after or later that day). The day after A is acceptable. Never the day before A or B.</p><p>Leave 1–2 reps in reserve on leg compounds and keep loads below your cramp threshold.</p><p>With 2 gym days, put both after A and B.</p>`)}
        ${fold('If you pick 1–2 gym exercises', `<p>These fit the program best:</p>${exCard('rfess')}${exCard('rdl')}${exCard('seatedcalf')}`)}
      </div>
      <div><div class="eyebrow" style="margin-bottom:8px">12-week map</div><div style="display:flex;flex-direction:column;gap:10px">${phases}<p class="small muted">Weeks 4, 8 and 12 run at about half volume, with retests at the end of weeks 8 and 12.</p></div></div>
      <div class="card"><h3>Cue sheet</h3><p class="small muted">Pick one cue per drill. Never think about your knees or hips mid-rep.</p><div class="cue-sheet">${CUES.map(([a, b]) => `<div><span>${a}</span><q>${b}</q></div>`).join('')}</div></div>
      <div class="card" style="gap:0;padding-block:4px">
        <div style="padding:14px 0 4px"><h3>What the research says</h3><p class="small muted" style="margin-top:4px">Each finding is rated by how solid the evidence is. I checked the sources and noted where the original write-up needed adjusting.</p></div>
        ${research}
      </div>
      <div class="card" style="gap:0;padding-block:4px">
        ${fold('Glossary', `<dl class="gloss">${GLOSSARY.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>`)}
        ${fold('Exercise library (every drill in one place)', Object.keys(EX).map(id => exCard(id)).join(''))}
        ${fold('Honest close', `<p>A real share of what makes Kamara and Smith-Njigba look the way they do is genetics, limb proportions and tens of thousands of game reps.</p><p>What you can move: reactive decision speed, landing and plant control, elastic stiffness, relaxation and rhythm. Those are what this program trains.</p><p>The single biggest smoothness accelerator is something you’re already doing: playing. Flag football and pickup are exactly the stimulus-driven, unpredictable reps the agility research favors. The program builds the engine, and the games teach you to drive it.</p>`)}
      </div>
    </div>`;
  }

  /* ---------- render ---------- */
  const TABS = [['train', 'Train'], ['tests', 'Tests'], ['log', 'Log'], ['guide', 'Guide']];
  function render() {
    const app = $('#app');
    const showWeek = ui.tab === 'train' && !ui.session;
    const head = `<header class="top"><div class="top-row"><span class="brand"><b>Spring</b> 12</span>${!showWeek ? `<span class="pill" style="margin-left:6px">Week ${S.week}</span>` : ''}<span class="sync ${cloud.on ? 'on' : ''}"><i></i><span>${cloud.on ? 'Synced' : 'On this device'}</span></span></div>${showWeek ? weekHeader() : ''}</header>`;
    let body = '';
    if (ui.tab === 'train') body = ui.session ? viewSession(ui.session) : viewTrain();
    else if (ui.tab === 'tests') body = viewTests();
    else if (ui.tab === 'log') body = viewLog();
    else body = viewGuide();
    app.innerHTML = head + body;
    $('#tabbar').innerHTML = TABS.map(([id, l]) => `<button data-tab="${id}" ${ui.tab === id ? 'aria-current="page"' : ''}>${ICON[id]}${l}</button>`).join('');
    $('#fab').hidden = !(ui.tab === 'train' && ui.session);
    mountDemos(app);
    wake(ui.tab === 'train' && ui.session && S.settings.awake);
  }
  function mountDemos(root) {
    $$('details[open] .demo[data-scene]', root).forEach(d => { if (!d.__anim && SCENES[d.dataset.scene] && d.offsetParent !== null) Anim.mount(d, SCENES[d.dataset.scene]); });
    $$('.demo[data-scene]', root).forEach(d => { if (!d.closest('details') && !d.__anim) Anim.mount(d, SCENES[d.dataset.scene]); });
  }
  let lock = null;
  async function wake(on) {
    try {
      if (on && !lock && navigator.wakeLock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); }
      else if (!on && lock) { await lock.release(); lock = null; }
    } catch (e) { lock = null; }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wake(ui.tab === 'train' && ui.session && S.settings.awake); });

  /* ---------- events ---------- */
  document.addEventListener('toggle', e => { if (e.target.open) mountDemos(e.target); }, true);

  let pendingReset = false;
  document.addEventListener('click', async e => {
    const t = e.target.closest('button, [data-open]'); if (!t) return;
    if (t.dataset.tab) { ui.tab = t.dataset.tab; if (t.dataset.tab === 'train' && ui.tab === 'train') ui.session = null; saveUI(); render(); scrollTo(0, 0); return; }
    if (t.dataset.open) { ui.session = t.dataset.open; ui.tab = 'train'; saveUI(); render(); scrollTo(0, 0); return; }
    if (t.dataset.week) { S.week = +t.dataset.week; commit(); render(); return; }
    if (t.dataset.chk) {
      e.preventDefault(); e.stopPropagation();
      const k = blockKey(ui.session, t.dataset.chk), on = !S.checks[k];
      if (on) S.checks[k] = 1; else delete S.checks[k];
      commit();
      t.setAttribute('aria-pressed', on); t.closest('.row').classList.toggle('checked', on);
      return;
    }
    if (t.dataset.eff) { const k = `${wk()}-${ui.session}`; S.sess[k] = Object.assign({}, S.sess[k], { effort: +t.dataset.eff }); commit(); $$('[data-eff]').forEach(b => b.setAttribute('aria-pressed', b === t)); return; }
    if (t.dataset.takeoff !== undefined) { S.settings.takeoff = t.dataset.takeoff; commit(); render(); toast('Takeoff saved'); return; }
    if (t.dataset.sweek) { testWeek = +t.dataset.sweek; render(); $('[data-sweek="' + testWeek + '"]')?.scrollIntoView({ block: 'center' }); return; }
    if (t.dataset.del) {
      if (t.dataset.armed) { S.log = S.log.filter(x => x.id !== t.dataset.del); commit(); render(); toast('Entry deleted'); }
      else { t.dataset.armed = '1'; t.textContent = 'Tap again to delete'; t.classList.add('danger'); setTimeout(() => { if (t.isConnected) { delete t.dataset.armed; t.textContent = 'Delete'; t.classList.remove('danger'); } }, 3000); }
      return;
    }
    const act = t.dataset.act;
    if (act === 'wk-' && S.week > 1) { S.week--; commit(); render(); }
    else if (act === 'wk+' && S.week < 12) { S.week++; commit(); ui.session = null; saveUI(); render(); scrollTo(0, 0); }
    else if (act === 'back') { ui.session = null; saveUI(); render(); scrollTo(0, 0); }
    else if (act === 'go-tests') { ui.tab = 'tests'; testWeek = isTestWeek() ? S.week : 2; saveUI(); render(); scrollTo(0, 0); }
    else if (act === 'go-train') { ui.tab = 'train'; ui.session = null; saveUI(); render(); }
    else if (act === 'save') {
      const sid = t.dataset.sid, ses = S.sess[`${wk()}-${sid}`] || {}, id = `${wk()}-${sid}`;
      const entry = { id, round: S.round, week: S.week, session: sid, date: new Date().toISOString(), done: doneCount(sid), total: SESSIONS[sid].blocks.length, effort: ses.effort || 0, notes: ses.notes || '' };
      const old = S.log.find(x => x.id === id); if (old) entry.date = old.date;
      S.log = S.log.filter(x => x.id !== id).concat(entry); commit();
      toast(old ? 'Log entry updated' : `Session ${sid} saved to your log`);
      ui.session = null; saveUI(); render(); scrollTo(0, 0);
    }
    else if (act === 'csv') {
      const head = ['Round', 'Week', 'Session', 'Date', 'Blocks done', 'Blocks total', 'Effort', 'Notes'];
      const rows = S.log.slice().sort((a, b) => a.date.localeCompare(b.date)).map(x => [x.round, x.week, `${x.session} ${SESSIONS[x.session].name}`, x.date.slice(0, 10), x.done, x.total, x.effort || '', x.notes || '']);
      const testRows = [];
      Object.entries(S.tests).forEach(([k, v]) => TESTS.forEach(tt => { if (v[tt.id]) testRows.push([k, tt.name, v[tt.id]]); }));
      const q = c => `"${String(c).replace(/"/g, '""')}"`;
      const csv = [head, ...rows].map(r => r.map(q).join(',')).join('\n') + (testRows.length ? '\n\n' + [['Test week', 'Test', 'Result'], ...testRows].map(r => r.map(q).join(',')).join('\n') : '');
      try {
        const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
        if (!dl) { toast('Download isn’t available here'); return; }
        await dl.save({ filename: 'spring12-log.csv', data: csv });
      } catch (err) { if (!err || err.code !== 'declined') toast('Download isn’t available here'); }
    }
    else if (act === 'new-round') {
      const box = $('#confirm');
      box.innerHTML = `<div class="banner deload" style="margin-top:10px"><p>Start round ${S.round + 1} at week 1? Your old log and tests stay saved.</p><div style="display:flex;gap:8px"><button class="btn small" data-act="new-round-yes">Start round ${S.round + 1}</button><button class="btn small ghost" data-act="cancel">Cancel</button></div></div>`;
    }
    else if (act === 'new-round-yes') { S.round++; S.week = 1; commit(); ui.tab = 'train'; ui.session = null; saveUI(); render(); toast(`Round ${S.round} started`); }
    else if (act === 'reset') {
      $('#confirm').innerHTML = `<div class="banner" style="background:var(--hot-soft);margin-top:10px"><p>This erases every checkmark, log entry and test result. It can’t be undone.</p><div style="display:flex;gap:8px"><button class="btn small danger" data-act="reset-yes">Erase everything</button><button class="btn small ghost" data-act="cancel">Cancel</button></div></div>`;
    }
    else if (act === 'reset-yes') { const keep = S.settings.takeoff; S = fresh(); S.settings.takeoff = keep; commit(); ui = { tab: 'train', session: null }; saveUI(); render(); toast('All data erased'); }
    else if (act === 'cancel') { $('#confirm').innerHTML = ''; }
  });

  let typing = 0;
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.notes) { const k = `${wk()}-${t.dataset.notes}`; S.sess[k] = Object.assign({}, S.sess[k], { notes: t.value }); clearTimeout(typing); typing = setTimeout(commit, 400); }
    else if (t.dataset.test) { const k = `r${S.round}w${t.dataset.w}`; S.tests[k] = Object.assign({}, S.tests[k], { [t.dataset.test]: t.value }); clearTimeout(typing); typing = setTimeout(commit, 400); }
    else if (t.dataset.setting) { S.settings[t.dataset.setting] = t.value; clearTimeout(typing); typing = setTimeout(commit, 400); }
    else if (t.dataset.smoothnote !== undefined) { const k = `r${S.round}w${testWeek}`; const v = Object.assign({}, S.tests[k]); v.smooth = Object.assign({}, v.smooth, { note: t.value }); S.tests[k] = v; clearTimeout(typing); typing = setTimeout(commit, 400); }
    else if (t.matches('[data-f1],[data-f2]')) {
      const c = t.closest('.calc'), a = parseFloat($('[data-f1]', c).value), b = parseFloat($('[data-f2]', c).value);
      $('[data-fout]', c).textContent = !isNaN(a) && !isNaN(b) && b > a ? ((b - a) / 240).toFixed(2) + ' s' : '–';
    }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'awake') { S.settings.awake = t.checked; commit(); wake(t.checked); }
    else if (t.dataset.smooth) { const k = `r${S.round}w${testWeek}`; const v = Object.assign({}, S.tests[k]); v.smooth = Object.assign({}, v.smooth, { [t.dataset.smooth]: t.checked }); S.tests[k] = v; commit(); }
    else if (t.dataset.test || t.dataset.setting === 'reach') {
      clearTimeout(typing); commit();
      if (ui.tab === 'tests') { const y = scrollY; render(); scrollTo(0, y); }
    }
  });

  /* ---------- timer ---------- */
  const tm = { left: 0, total: 0, run: false, last: 0, iv: 0, ctx: null };
  const fmtT = s => `${Math.floor(s / 60)}:${String(Math.ceil(s % 60) === 60 ? 0 : Math.ceil(s % 60)).padStart(2, '0')}`;
  function beep() {
    try {
      tm.ctx = tm.ctx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18, 0.36].forEach(d => { const o = tm.ctx.createOscillator(), g = tm.ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(tm.ctx.destination); g.gain.setValueAtTime(0.25, tm.ctx.currentTime + d); g.gain.exponentialRampToValueAtTime(0.001, tm.ctx.currentTime + d + 0.15); o.start(tm.ctx.currentTime + d); o.stop(tm.ctx.currentTime + d + 0.16); });
    } catch (e) {}
  }
  function drawTimer() {
    const big = $('#t-big'); if (big) { big.textContent = fmtT(Math.max(0, tm.left)); big.classList.toggle('done', tm.total > 0 && tm.left <= 0); }
    const go = $('#t-go'); if (go) go.textContent = tm.run ? 'Pause' : (tm.left > 0 && tm.left < tm.total ? 'Resume' : 'Start');
    $('#fab-t').textContent = tm.run || (tm.left > 0 && tm.left < tm.total) ? fmtT(Math.max(0, tm.left)) : 'Timer';
  }
  function tick() {
    const now = performance.now(); tm.left -= (now - tm.last) / 1000; tm.last = now;
    if (tm.left <= 0) { tm.left = 0; tm.run = false; clearInterval(tm.iv); beep(); }
    drawTimer();
  }
  function openTimer() {
    if ($('.drawer')) return;
    const sc = document.createElement('div'); sc.className = 'scrim'; sc.dataset.tclose = '1';
    const d = document.createElement('div'); d.className = 'drawer'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Timer');
    d.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h3>Timer</h3><button class="btn small ghost" data-tclose="1">Close</button></div>
      <div id="t-big" class="timer-big" aria-live="polite">0:00</div>
      <div class="presets">${[10, 15, 20, 30, 45, 60, 90, 120].map(s => `<button data-tset="${s}">${s < 60 ? s + 's' : s / 60 + 'm'}</button>`).join('')}</div>
      <div class="row-btns"><button class="btn" id="t-go" data-tgo="1">Start</button><button class="btn ghost" data-treset="1">Reset</button></div>
      <p class="small muted">Beeps when it hits zero. Use it for holds (Copenhagens, stance) and rest between sets.</p>`;
    document.body.append(sc, d); drawTimer();
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-tclose],[data-tset],[data-tgo],[data-treset],#fab'); if (!t) return;
    if (t.id === 'fab') openTimer();
    else if (t.dataset.tclose) { $$('.drawer,.scrim').forEach(x => x.remove()); }
    else if (t.dataset.tset) { tm.total = tm.left = +t.dataset.tset; tm.run = false; clearInterval(tm.iv); drawTimer(); }
    else if (t.dataset.treset) { tm.left = tm.total; tm.run = false; clearInterval(tm.iv); drawTimer(); }
    else if (t.dataset.tgo) {
      try { tm.ctx = tm.ctx || new (window.AudioContext || window.webkitAudioContext)(); tm.ctx.resume && tm.ctx.resume(); } catch (er) {}
      if (tm.run) { tm.run = false; clearInterval(tm.iv); }
      else { if (tm.left <= 0) { tm.left = tm.total || 30; tm.total = tm.total || 30; } tm.run = true; tm.last = performance.now(); tm.iv = setInterval(tick, 200); }
      drawTimer();
    }
  });

  render();
  connect();
})();
