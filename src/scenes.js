/* ---------- Demo scenes (side view faces right; angles in degrees) ---------- */
const SCENES = (() => {
  const G = 148;
  const S = (o) => Object.assign({ kind: 'fig', w: 240, h: 162, ground: G }, o);
  const stand = { t: 0, lf: [2, 0, 90], lb: [-2, 0, 90], af: [6, 14], ab: [-6, 8] };
  const athletic = { t: 22, lf: [38, -12, 90], lb: [34, -14, 90], af: [25, 60], ab: [18, 55] };
  // run cycle: support leg under the hip, then push-off with the other knee driving
  const stanceF = (x, t) => ({ x, t, lf: [4 - t * 0.3, -10 - t * 0.3, 84], lb: [44 + t * 0.2, -64, 70], af: [10, 60], ab: [-10, 30] });
  const flightF = (x, t, air) => ({ x, t, air, lf: [-30, -46, 30], lb: [70 - t * 0.1, -6, 100], af: [-46, -12], ab: [58, 128] });
  const swap = p => Object.assign({}, p, { lf: p.lb, lb: p.lf, af: p.ab, ab: p.af });
  const runKeys = (x0, x1, steps, lean0, lean1, d0, d1, air) => {
    const k = []; const n = steps * 2;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = x0 + (x1 - x0) * u, t = lean0 + (lean1 - lean0) * u, d = Math.round(d0 + (d1 - d0) * u);
      const base = i % 2 === 0 ? stanceF(x, t) : flightF(x, t, air);
      k.push({ d: i ? d : 0, p: (Math.floor(i / 2) % 2) ? swap(base) : base });
    }
    return k;
  };
  const runA = (x, t) => stanceF(x, t);
  const runB = (x, t) => swap(stanceF(x, t));
  const mirror = (p) => Object.assign({}, p, { lf: p.lb, lb: p.lf, af: p.ab, ab: p.af });

  /* top-down helpers */
  const cone = (x, y, c = '') => `<path d="M${x - 6},${y + 5} L${x},${y - 7} L${x + 6},${y + 5} Z" class="m-cone ${c}"/>`;
  const dotM = (x, y) => `<circle cx="${x}" cy="${y}" r="3.5" class="m-marker"/>`;
  const line = (x1, y1, x2, y2, c = 'm-line') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c}"/>`;
  const txt = (x, y, s, a = 'middle', c = 'm-label') => `<text x="${x}" y="${y}" text-anchor="${a}" class="${c}">${s}</text>`;
  const zone = (x, y, w, h, c = 'm-zone') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="${c}"/>`;

  const sc = {};

  sc.pogo = S({ alt: 'Pogo hops: small, stiff bounces on the balls of the feet', keys: [
    { p: { t: 2, lf: [2, 0, 58], lb: [-2, 0, 58], af: [8, 30], ab: [-8, 20] }, cap: 'Stiff ankles · heels stay up' },
    { d: 170, e: 'out', p: { air: 11, t: 2, lf: [1, 0, 38], lb: [-1, 0, 38], af: [12, 34], ab: [-4, 24] } },
    { d: 170, e: 'in', p: { t: 2, lf: [2, 0, 58], lb: [-2, 0, 58], af: [8, 30], ab: [-8, 20] } },
    { d: 90, p: { t: 2, lf: [3, -1, 66], lb: [-1, -1, 66], af: [8, 30], ab: [-8, 20] } },
  ] });

  sc.reacthop = S({ alt: 'Low reactive hops: quick bounces with short ground contact', keys: [
    { p: { t: 3, lf: [4, -2, 64], lb: [0, -3, 64], af: [-20, 10], ab: [-28, 0] }, cap: 'Hit and go · ground is hot' },
    { d: 210, e: 'out', p: { air: 20, t: 0, lf: [2, 0, 36], lb: [-2, 0, 36], af: [55, 80], ab: [45, 70] } },
    { d: 210, e: 'in', p: { t: 3, lf: [4, -2, 60], lb: [0, -3, 60], af: [10, 30], ab: [0, 20] } },
    { d: 90, p: { t: 4, lf: [8, -4, 70], lb: [4, -5, 70], af: [-20, 10], ab: [-28, 0] } },
  ] });

  sc.dropjump = S({ alt: 'Drop jump: step off a low step, land and bounce up immediately', loopFade: true, tail: 300,
    props: [{ type: 'box', x: 56, w: 44, h: 24 }, { type: 'text', x: 78, y: G + 13, text: '12–18 in' }],
    keys: [
      { p: Object.assign({ x: 76, g: 24 }, stand), cap: 'Step off. Don’t jump off.' },
      { d: 600, p: { x: 90, g: 24, t: 4, lf: [32, 16, 96], lb: [-2, 0, 90], af: [-10, 0], ab: [-14, -2] } },
      { d: 300, e: 'in', p: { x: 124, g: 0, air: 0, t: 12, lf: [18, 0, 64], lb: [14, -2, 64], af: [-30, -14], ab: [-36, -18] }, cap: 'Land and leave fast' },
      { d: 110, e: 'lin', p: { x: 125, g: 0, t: 18, lf: [30, -10, 86], lb: [26, -12, 86], af: [-52, -28], ab: [-58, -34] } },
      { d: 300, e: 'out', p: { x: 128, air: 36, t: 0, lf: [2, -4, 42], lb: [-2, -6, 42], af: [172, 176], ab: [165, 170] }, cap: 'Up!' },
      { d: 300, e: 'in', p: { x: 130, air: 0, t: 24, lf: [42, -16, 90], lb: [38, -18, 90], af: [45, 70], ab: [38, 64] }, cap: 'Land like a cat' },
      { d: 700, p: { x: 130, t: 22, lf: [40, -15, 90], lb: [36, -17, 90], af: [40, 66], ab: [34, 60] } },
    ] });

  sc.broad = S({ alt: 'Broad jump: swing, jump forward, stick the landing', loopFade: true, tail: 250,
    props: [{ type: 'mark', x: 44, label: 'start' }],
    keys: [
      { p: Object.assign({ x: 40 }, stand), cap: 'Swing back' },
      { d: 450, p: { x: 34, t: 42, lf: [58, -18, 90], lb: [54, -20, 90], af: [-60, -50], ab: [-66, -56] } },
      { d: 240, e: 'in', p: { x: 58, t: 38, lf: [-12, -20, 28], lb: [-16, -22, 28], af: [150, 160], ab: [144, 154] }, cap: 'Throw the hands' },
      { d: 300, e: 'out', p: { x: 112, air: 26, t: 30, lf: [72, 18, 100], lb: [66, 14, 100], af: [110, 120], ab: [104, 114] } },
      { d: 300, e: 'in', p: { x: 166, air: 0, t: 36, lf: [60, -22, 90], lb: [56, -24, 90], af: [62, 86], ab: [56, 80] }, cap: 'Stick it · hold 2 s' },
      { d: 900, p: { x: 166, t: 34, lf: [58, -20, 90], lb: [54, -22, 90], af: [58, 82], ab: [52, 76] } },
    ] });

  sc.slhop = S({ alt: 'Single-leg hop for height, landing on the same leg and holding', keys: [
    { p: { t: 4, lf: [2, 0, 90], lb: [38, -50, 60], af: [6, 14], ab: [-6, 8] }, cap: 'One leg' },
    { d: 420, p: { t: 24, lf: [40, -14, 90], lb: [40, -40, 70], af: [-50, -30], ab: [-56, -36] }, cap: 'Load' },
    { d: 300, e: 'out', p: { air: 30, t: 2, lf: [0, -4, 40], lb: [82, 6, 100], af: [165, 172], ab: [150, 160] }, cap: 'Drive the free knee up' },
    { d: 300, e: 'in', p: { t: 26, lf: [42, -16, 90], lb: [42, -36, 70], af: [40, 60], ab: [30, 50] }, cap: 'Stick it · hold 2 s' },
    { d: 1000, p: { t: 24, lf: [40, -15, 90], lb: [40, -38, 70], af: [36, 56], ab: [26, 46] } },
    { d: 400, p: { t: 4, lf: [2, 0, 90], lb: [38, -50, 60], af: [6, 14], ab: [-6, 8] } },
  ] });

  /* front view: +x is the athlete's left side as you look at them; legs 'f' sit on +x */
  sc.skater = S({ view: 'front', alt: 'Skater bound: jump sideways from one leg to the other and stick it', keys: [
    { p: { x: 70, t: -8, lb: [6, -2, -90], lf: [-14, -40, 90], af: [-40, -60], ab: [30, 10] }, cap: 'Load the outside leg' },
    { d: 300, p: { x: 72, t: -14, lb: [10, -4, -90], lf: [-20, -48, 90], af: [-60, -80], ab: [40, 20] } },
    { d: 280, e: 'out', p: { x: 122, air: 16, t: 4, lb: [-28, -30, -90], lf: [24, 20, 90], af: [60, 80], ab: [-40, -60] }, cap: 'Push sideways' },
    { d: 280, e: 'in', p: { x: 170, air: 0, t: 10, lf: [-6, 2, 90], lb: [14, 40, -90], af: [40, 20], ab: [-40, -60] }, cap: 'Stick it · hold 2 s' },
    { d: 900, p: { x: 170, t: 12, lf: [-8, 2, 90], lb: [14, 40, -90], af: [36, 18], ab: [-36, -56] } },
    { d: 280, e: 'out', p: { x: 120, air: 16, t: -4, lb: [-24, -20, -90], lf: [28, 30, 90], af: [40, 60], ab: [-60, -80] }, cap: 'And back' },
    { d: 280, e: 'in', p: { x: 70, air: 0, t: -10, lb: [6, -2, -90], lf: [-14, -40, 90], af: [-40, -60], ab: [30, 10] }, cap: 'Stick it · hold 2 s' },
    { d: 900, p: { x: 70, t: -8, lb: [6, -2, -90], lf: [-14, -40, 90], af: [-40, -60], ab: [30, 10] } },
  ] });

  sc.accel = S({ alt: 'Acceleration: forward lean, big pushes behind you', loopFade: true, tail: 200,
    props: [{ type: 'mark', x: 26, label: '0' }, { type: 'mark', x: 226, label: '15 yd' }],
    keys: (() => { const k = runKeys(30, 222, 4, 46, 22, 230, 150, 2); k[0].cap = 'Low lean · push the ground behind you'; return k; })() });

  sc.sprint = S({ alt: 'Upright running: tall posture, feet land under the hips', loopFade: true, tail: 150,
    keys: (() => { const k = runKeys(22, 226, 4, 8, 8, 150, 150, 6); k[0].cap = 'Tall · quiet feet · loose face'; return k; })() });

  sc.bound = S({ alt: 'Bounds: long, springy strides that float through the air', loopFade: true, tail: 200,
    keys: [
      { p: { x: 20, t: 12, lf: [-30, -40, 30], lb: [70, 20, 100], af: [70, 120], ab: [-50, -20] }, cap: 'Push long and float' },
      { d: 380, e: 'out', p: { x: 70, air: 22, t: 10, lf: [-40, -60, 20], lb: [80, 30, 100], af: [80, 130], ab: [-60, -30] } },
      { d: 300, e: 'in', p: { x: 106, t: 14, lf: [-2, -6, 80], lb: [40, -30, 90], af: [20, 60], ab: [-20, 0] } },
      { d: 160, p: { x: 120, t: 12, lf: [-30, -40, 30], lb: [70, 20, 100], af: [-50, -20], ab: [70, 120] } },
      { d: 380, e: 'out', p: { x: 168, air: 22, t: 10, lb: [-40, -60, 20], lf: [80, 30, 100], ab: [80, 130], af: [-60, -30] } },
      { d: 300, e: 'in', p: { x: 206, t: 14, lb: [-2, -6, 80], lf: [40, -30, 90], ab: [20, 60], af: [-20, 0] } },
    ] });

  sc.askip = S({ alt: 'A-skip: rhythmic skip, knee up, foot strikes down under the hip', loopFade: true, tail: 150,
    keys: [
      { p: { x: 40, t: 4, lf: [88, 2, 104], lb: [0, 0, 64], af: [-40, -10], ab: [50, 110] }, cap: 'Knee up · toes up' },
      { d: 260, p: { x: 62, t: 4, air: 5, lf: [10, 0, 80], lb: [20, -10, 90], af: [0, 40], ab: [0, 30] } },
      { d: 160, p: { x: 74, t: 4, lb: [88, 2, 104], lf: [0, 0, 64], ab: [-40, -10], af: [50, 110] }, cap: 'Strike down and back' },
      { d: 260, p: { x: 96, t: 4, air: 5, lb: [10, 0, 80], lf: [20, -10, 90], af: [0, 30], ab: [0, 40] } },
      { d: 160, p: { x: 108, t: 4, lf: [88, 2, 104], lb: [0, 0, 64], af: [-40, -10], ab: [50, 110] } },
      { d: 260, p: { x: 130, t: 4, air: 5, lf: [10, 0, 80], lb: [20, -10, 90], af: [0, 40], ab: [0, 30] } },
      { d: 160, p: { x: 142, t: 4, lb: [88, 2, 104], lf: [0, 0, 64], ab: [-40, -10], af: [50, 110] } },
      { d: 260, p: { x: 164, t: 4, air: 5, lb: [10, 0, 80], lf: [20, -10, 90], af: [0, 30], ab: [0, 40] } },
      { d: 160, p: { x: 176, t: 4, lf: [88, 2, 104], lb: [0, 0, 64], af: [-40, -10], ab: [50, 110] } },
    ] });

  sc.skip = S({ alt: 'Skip for height: big arm drive, float up', loopFade: true, tail: 150,
    keys: [
      { p: { x: 30, t: 6, lf: [-10, -20, 50], lb: [30, -30, 80], af: [-50, -20], ab: [40, 90] }, cap: 'Drive arms + knee up' },
      { d: 330, e: 'out', p: { x: 70, air: 26, t: 0, lf: [-6, -10, 40], lb: [92, 0, 104], af: [-40, -10], ab: [170, 176] } },
      { d: 330, e: 'in', p: { x: 104, t: 6, lf: [30, -30, 80], lb: [-10, -20, 50], af: [40, 90], ab: [-50, -20] } },
      { d: 330, e: 'out', p: { x: 144, air: 26, t: 0, lb: [-6, -10, 40], lf: [92, 0, 104], ab: [-40, -10], af: [170, 176] } },
      { d: 330, e: 'in', p: { x: 178, t: 6, lb: [30, -30, 80], lf: [-10, -20, 50], ab: [40, 90], af: [-50, -20] } },
    ] });

  sc.march = S({ alt: 'Marching: tall posture, knee up, opposite arm', keys: [
    { p: { x: 120, t: 2, lf: [86, 0, 100], lb: [0, 0, 70], af: [-40, -10], ab: [50, 110] }, cap: 'Tall · knee to hip height' },
    { d: 500, p: { x: 120, t: 2, lf: [2, 0, 90], lb: [-2, 0, 90], af: [4, 14], ab: [-4, 10] } },
    { d: 500, p: { x: 120, t: 2, lb: [86, 0, 100], lf: [0, 0, 70], ab: [-40, -10], af: [50, 110] } },
    { d: 500, p: { x: 120, t: 2, lf: [2, 0, 90], lb: [-2, 0, 90], af: [4, 14], ab: [-4, 10] } },
  ] });

  sc.ankledribble = S({ alt: 'Ankle dribbles: tiny quick steps, feet barely leave the ground', loopFade: true, tail: 120,
    keys: (() => { const k = [{ p: { x: 50, t: 8, lf: [6, 0, 66], lb: [-2, -8, 52], af: [-30, -5], ab: [30, 80] }, cap: 'Tiny, fast, quiet' }];
      for (let i = 1; i <= 12; i++) { const a = i % 2; k.push({ d: 150, p: { x: 50 + i * 11, t: 8, lf: a ? [-2, -8, 52] : [6, 0, 66], lb: a ? [6, 0, 66] : [-2, -8, 52], af: a ? [30, 80] : [-30, -5], ab: a ? [-30, -5] : [30, 80] } }); }
      return k; })() });

  sc.legswing = S({ alt: 'Leg swings: hold a wall, swing one leg forward and back', props: [{ type: 'wall', x: 186 }], keys: [
    { p: { x: 150, t: 0, lb: [0, 0, 90], lf: [-30, -40, 60], af: [70, 76], ab: [-6, 8] }, cap: 'Loose, growing swings' },
    { d: 520, p: { x: 150, t: -4, lb: [0, 0, 90], lf: [62, 50, 110], af: [70, 76], ab: [-6, 8] } },
    { d: 520, p: { x: 150, t: 4, lb: [0, 0, 90], lf: [-34, -44, 60], af: [70, 76], ab: [-6, 8] } },
  ] });

  sc.wgs = S({ alt: 'World’s greatest stretch: lunge, elbow to instep, reach to the sky', keys: [
    { p: Object.assign({ x: 120 }, stand), cap: 'Step into a long lunge' },
    { d: 600, p: { x: 120, t: 50, lf: [82, -4, 90], lb: [-44, -66, 10], af: [8, 4], ab: [0, -4] } },
    { d: 500, p: { x: 120, t: 70, lf: [84, -6, 90], lb: [-46, -68, 10], af: [24, 70], ab: [4, -2] }, cap: 'Elbow to instep' },
    { d: 700, p: { x: 120, t: 46, lf: [82, -4, 90], lb: [-44, -66, 10], af: [176, 180], ab: [6, -2] }, cap: 'Rotate · reach to the sky' },
    { d: 700, p: { x: 120, t: 46, lf: [82, -4, 90], lb: [-44, -66, 10], af: [176, 180], ab: [6, -2] } },
    { d: 600, p: { x: 120, t: 50, lf: [82, -4, 90], lb: [-44, -66, 10], af: [8, 4], ab: [0, -4] } },
    { d: 600, p: Object.assign({ x: 120 }, stand) },
  ] });

  sc.slrdl = S({ alt: 'Single-leg RDL reach: hinge on one leg, reach forward, back leg long', keys: [
    { p: { x: 110, t: 2, lf: [2, 0, 90], lb: [-6, -6, 80], af: [6, 14], ab: [-6, 8] }, cap: 'Stand on one leg' },
    { d: 900, p: { x: 110, t: 78, lf: [10, -6, 90], lb: [-80, -82, 0], af: [30, 36], ab: [24, 30] }, cap: 'Hinge · reach long' },
    { d: 500, p: { x: 110, t: 80, lf: [10, -6, 90], lb: [-82, -84, 0], af: [36, 40], ab: [30, 34] } },
    { d: 900, p: { x: 110, t: 2, lf: [2, 0, 90], lb: [-6, -6, 80], af: [6, 14], ab: [-6, 8] } },
  ] });

  sc.latlunge = S({ view: 'front', alt: 'Lateral lunge: step wide, sit into one hip, other leg straight', keys: [
    { p: { x: 120, t: 0, lf: [4, 0], lb: [-4, 0], af: [10, 6], ab: [-10, -6] }, cap: 'Step wide' },
    { d: 600, p: { x: 138, t: 6, lf: [52, -6], lb: [-40, -40], af: [14, 8], ab: [-14, -8] }, cap: 'Sit into the hip' },
    { d: 500, p: { x: 138, t: 6, lf: [52, -6], lb: [-40, -40], af: [14, 8], ab: [-14, -8] } },
    { d: 600, p: { x: 120, t: 0, lf: [4, 0], lb: [-4, 0], af: [10, 6], ab: [-10, -6] } },
    { d: 600, p: { x: 102, t: -6, lb: [-52, 6], lf: [40, 40], af: [14, 8], ab: [-14, -8] }, cap: 'Other side' },
    { d: 500, p: { x: 102, t: -6, lb: [-52, 6], lf: [40, 40], af: [14, 8], ab: [-14, -8] } },
    { d: 600, p: { x: 120, t: 0, lf: [4, 0], lb: [-4, 0], af: [10, 6], ab: [-10, -6] } },
  ] });

  const nordicArms = th => [th + 30, th + 150];
  sc.nordic = S({ alt: 'Nordic hamstring curl: kneel with feet anchored, lower slowly, catch with hands',
    props: [{ type: 'raw', svg: `<rect x="14" y="${G - 36}" width="84" height="20" rx="5" class="a-prop"/><rect x="14" y="${G - 50}" width="14" height="34" rx="4" class="a-prop"/><rect x="18" y="${G - 16}" width="5" height="16" class="a-prop"/><rect x="88" y="${G - 16}" width="5" height="16" class="a-prop"/>` }],
    anchor: ['kneeF', 'kneeB'],
    keys: [
      { p: { x: 112, t: 0, lf: [0, -90, -150], lb: [0, -90, -150], af: nordicArms(0), ab: nordicArms(0) }, cap: 'Feet hooked · hips forward' },
      { d: 3200, e: 'lin', p: { x: 112, t: 58, lf: [-58, -90, -150], lb: [-58, -90, -150], af: nordicArms(58), ab: nordicArms(58) }, cap: 'Lower slowly · fight it' },
      { d: 500, e: 'in', p: { x: 112, t: 76, lf: [-76, -90, -150], lb: [-76, -90, -150], af: [62, 72], ab: [58, 68] }, cap: 'Catch with your hands' },
      { d: 400, p: { x: 112, t: 76, lf: [-76, -90, -150], lb: [-76, -90, -150], af: [62, 72], ab: [58, 68] } },
      { d: 700, p: { x: 112, t: 0, lf: [0, -90, -150], lb: [0, -90, -150], af: nordicArms(0), ab: nordicArms(0) }, cap: 'Push back up · reset' },
      { d: 600, p: { x: 112, t: 0, lf: [0, -90, -150], lb: [0, -90, -150], af: nordicArms(0), ab: nordicArms(0) } },
    ] });

  sc.copenhagen = S({ alt: 'Copenhagen plank: side plank with top leg on a couch, lift hips into a straight line',
    props: [{ type: 'couch', x: 150, w: 86, h: 31, back: 'right' }],
    anchor: ['elbowF'],
    keys: [
      { p: { x: 104, t: -92, lf: [118, 118, 200], lb: [70, 50, 160], af: [0, -90], ab: [-40, -100] }, cap: 'Top leg on couch' },
      { d: 900, p: { x: 104, t: -108, lf: [106, 106, 196], lb: [100, 100, 190], af: [0, -90], ab: [-60, -120] }, cap: 'Lift · straight line · hold' },
      { d: 1800, p: { x: 104, t: -108, lf: [106, 106, 196], lb: [100, 100, 190], af: [0, -90], ab: [-60, -120] } },
      { d: 900, p: { x: 104, t: -92, lf: [118, 118, 200], lb: [70, 50, 160], af: [0, -90], ab: [-40, -100] }, cap: 'Lower with control' },
      { d: 500, p: { x: 104, t: -92, lf: [118, 118, 200], lb: [70, 50, 160], af: [0, -90], ab: [-40, -100] } },
    ] });

  sc.calfraise = S({ alt: 'Single-leg calf raise on a step edge: slow up, slow down past level', anchor: ['toeF'],
    props: [{ type: 'box', x: 96, w: 40, h: 14 }, { type: 'wall', x: 190 }],
    keys: [
      { p: { x: 128, g: 14, t: 2, lf: [0, 0, 112], lb: [16, -60, 50], af: [60, 70], ab: [-6, 8] }, cap: 'Heel below the step' },
      { d: 1300, p: { x: 128, g: 14, t: 2, lf: [0, 0, 40], lb: [16, -60, 50], af: [58, 68], ab: [-6, 8] }, cap: 'Up 2 s · pause on top' },
      { d: 500, p: { x: 128, g: 14, t: 2, lf: [0, 0, 40], lb: [16, -60, 50], af: [58, 68], ab: [-6, 8] } },
      { d: 1600, p: { x: 128, g: 14, t: 2, lf: [0, 0, 112], lb: [16, -60, 50], af: [60, 70], ab: [-6, 8] }, cap: 'Down 3 s' },
      { d: 500, p: { x: 128, g: 14, t: 10, lf: [24, -14, 112], lb: [30, -50, 50], af: [60, 70], ab: [-6, 8] }, cap: 'Now bent knee' },
      { d: 1300, p: { x: 128, g: 14, t: 10, lf: [24, -14, 46], lb: [30, -50, 50], af: [58, 68], ab: [-6, 8] } },
      { d: 500, p: { x: 128, g: 14, t: 10, lf: [24, -14, 46], lb: [30, -50, 50], af: [58, 68], ab: [-6, 8] } },
      { d: 1600, p: { x: 128, g: 14, t: 10, lf: [24, -14, 112], lb: [30, -50, 50], af: [60, 70], ab: [-6, 8] } },
      { d: 500, p: { x: 128, g: 14, t: 2, lf: [0, 0, 112], lb: [16, -60, 50], af: [60, 70], ab: [-6, 8] } },
    ] });

  sc.tibraise = S({ alt: 'Tibialis raise: back on a wall, heels out, pull toes up toward shins', anchor: ['heelF', 'heelB'],
    props: [{ type: 'wall', x: 60 }],
    keys: [
      { p: { x: 84, t: -4, lf: [14, 14, 90], lb: [12, 12, 90], af: [-4, 4], ab: [-8, 0] }, cap: 'Heels out, back on wall' },
      { d: 500, p: { x: 84, t: -4, lf: [14, 14, 140], lb: [12, 12, 140], af: [-4, 4], ab: [-8, 0] }, cap: 'Toes up hard' },
      { d: 300, p: { x: 84, t: -4, lf: [14, 14, 140], lb: [12, 12, 140], af: [-4, 4], ab: [-8, 0] } },
      { d: 500, p: { x: 84, t: -4, lf: [14, 14, 90], lb: [12, 12, 90], af: [-4, 4], ab: [-8, 0] }, cap: 'Tap down, repeat' },
    ] });

  sc.splitiso = S({ alt: 'Split-squat isometric: hold the bottom of a split squat', keys: [
    { p: { x: 116, t: 2, lf: [24, 0, 90], lb: [-20, -26, 30], af: [6, 14], ab: [-6, 8] }, cap: 'Long split stance' },
    { d: 900, p: { x: 116, t: 6, lf: [82, -4, 90], lb: [-10, -84, 12], af: [10, 18], ab: [-2, 10] }, cap: 'Sink · back knee hovers' },
    { d: 1400, p: { x: 116, t: 6, lf: [82, -4, 90], lb: [-10, -84, 12], af: [10, 18], ab: [-2, 10] }, cap: 'Hold 30 s · breathe' },
    { d: 900, p: { x: 116, t: 2, lf: [24, 0, 90], lb: [-20, -26, 30], af: [6, 14], ab: [-6, 8] } },
  ] });

  sc.rfess = S({ alt: 'Rear-foot-elevated split squat: back foot on a bench, sink straight down', anchor: ['toeF', 'heelF'],
    props: [{ type: 'bench', x: 34, w: 62, h: 34 }],
    keys: [
      { p: { x: 112, t: 6, lf: [22, -2, 90], lb: [-36, -96, -100], af: [6, 10], ab: [-6, 4] }, cap: 'Back foot laces-down' },
      { d: 1100, p: { x: 108, t: 14, lf: [78, -10, 90], lb: [-6, -108, -100], af: [14, 18], ab: [4, 8] }, cap: 'Sink down 2 s' },
      { d: 400, p: { x: 108, t: 14, lf: [78, -10, 90], lb: [-6, -108, -100], af: [14, 18], ab: [4, 8] } },
      { d: 700, p: { x: 112, t: 6, lf: [22, -2, 90], lb: [-36, -96, -100], af: [6, 10], ab: [-6, 4] }, cap: 'Drive up' },
    ] });

  sc.rdl = S({ ballClass: 'a-plate', alt: 'Romanian deadlift: hips back, bar slides down the thighs, flat back', ball: true, ballR: 11,
    keys: [
      { p: { x: 120, t: 0, lf: [4, 0, 90], lb: [2, 0, 90], af: [6, 4], ab: [4, 2] }, ball: 'hands', cap: 'Soft knees' },
      { d: 1500, p: { x: 110, t: 72, lf: [16, -6, 90], lb: [14, -8, 90], af: [-4, -6], ab: [-6, -8] }, ball: 'hands', cap: 'Hips back · feel hamstrings' },
      { d: 300, p: { x: 110, t: 72, lf: [16, -6, 90], lb: [14, -8, 90], af: [-4, -6], ab: [-6, -8] }, ball: 'hands' },
      { d: 1000, p: { x: 120, t: 0, lf: [4, 0, 90], lb: [2, 0, 90], af: [6, 4], ab: [4, 2] }, ball: 'hands', cap: 'Squeeze glutes to stand' },
      { d: 400, p: { x: 120, t: 0, lf: [4, 0, 90], lb: [2, 0, 90], af: [6, 4], ab: [4, 2] }, ball: 'hands' },
    ] });

  sc.slstance = S({ alt: 'Single-leg stance with wall-ball catches', ball: true, props: [{ type: 'wall', x: 212 }],
    keys: [
      { p: { x: 120, t: 6, lf: [10, -6, 90], lb: [30, -50, 60], af: [60, 90], ab: [56, 86] }, ball: 'hands', cap: 'One leg · soft knee' },
      { d: 350, e: 'out', p: { x: 120, t: 4, lf: [10, -6, 90], lb: [30, -50, 60], af: [86, 96], ab: [82, 92] }, ball: [210, 62] },
      { d: 420, e: 'in', p: { x: 120, t: 8, lf: [14, -8, 90], lb: [32, -48, 60], af: [60, 90], ab: [56, 86] }, ball: 'hands', cap: 'Catch · stay still' },
      { d: 600, p: { x: 120, t: 6, lf: [10, -6, 90], lb: [30, -50, 60], af: [60, 90], ab: [56, 86] }, ball: 'hands' },
    ] });

  sc.fallrecover = S({ alt: 'Fall and recover: lean like a plank until you must step, catch in an athletic stance', keys: [
    { p: { x: 100, t: 0, lf: [0, 0, 90], lb: [0, 0, 90], af: [4, 10], ab: [-4, 6] }, cap: 'Stiff as a board' },
    { d: 1100, e: 'in', p: { x: 104, t: 20, lf: [-20, -20, 90], lb: [-20, -20, 90], af: [20, 40], ab: [10, 30] }, cap: 'Lean… lean…' },
    { d: 260, e: 'out', p: { x: 132, t: 22, lf: [40, -14, 90], lb: [-26, -40, 40], af: [40, 70], ab: [-20, 10] }, cap: 'Catch in one step' },
    { d: 900, p: { x: 132, t: 22, lf: [40, -14, 90], lb: [-26, -40, 40], af: [40, 70], ab: [-20, 10] } },
    { d: 600, p: { x: 100, t: 0, lf: [0, 0, 90], lb: [0, 0, 90], af: [4, 10], ab: [-4, 6] } },
  ] });

  sc.decel = S({ alt: 'Deceleration: sprint in, stop in three short steps, hold the stance', loopFade: true, tail: 200,
    props: [{ type: 'mark', x: 160, label: 'stop zone' }],
    keys: [
      { p: runA(10, 18), cap: 'Accelerate' },
      { d: 200, p: runB(46, 18) },
      { d: 200, p: runA(84, 16) },
      { d: 200, p: runB(120, 12) },
      { d: 170, p: { x: 142, t: 0, lf: [40, 10, 100], lb: [-20, -40, 40], af: [40, 80], ab: [-30, 0] }, cap: '1 · 2 · 3' },
      { d: 160, p: { x: 156, t: 4, lb: [36, 0, 100], lf: [0, -30, 70], af: [-10, 20], ab: [30, 70] } },
      { d: 160, p: { x: 166, t: 14, lf: [44, -10, 90], lb: [10, -30, 80], af: [30, 70], ab: [20, 60] } },
      { d: 160, p: Object.assign({ x: 170 }, athletic), cap: 'Hold 2 s · balanced' },
      { d: 900, p: Object.assign({ x: 170 }, athletic) },
    ] });

  sc.approach2 = S({ h: 178, ground: 164, alt: 'Two-foot approach jump: quick steps, long penultimate step, plant both feet, explode up', loopFade: true, tail: 300,
    props: [{ type: 'target', x: 176, y: 16 }],
    keys: [
      { p: runA(10, 14), cap: 'Build speed' },
      { d: 220, p: runB(44, 14) },
      { d: 220, p: runA(80, 14) },
      { d: 260, p: { x: 118, t: 6, lf: [-24, -60, 30], lb: [56, -8, 96], af: [40, 90], ab: [-30, 0] }, cap: 'Long, low step' },
      { d: 200, p: { x: 146, t: 18, lf: [40, -18, 90], lb: [34, -22, 90], af: [-70, -50], ab: [-74, -54] }, cap: 'Plant both feet · arms back' },
      { d: 330, e: 'out', p: { x: 164, air: 40, t: -6, lf: [-6, -10, 36], lb: [-10, -14, 36], af: [176, 180], ab: [150, 160] }, cap: 'Jump through the target' },
      { d: 330, e: 'in', p: { x: 178, air: 0, t: 22, lf: [40, -14, 90], lb: [36, -16, 90], af: [40, 60], ab: [34, 56] }, cap: 'Land soft' },
      { d: 500, p: { x: 178, t: 20, lf: [38, -13, 90], lb: [34, -15, 90], af: [36, 56], ab: [30, 50] } },
    ] });

  sc.approach1 = S({ h: 178, ground: 164, alt: 'One-foot approach jump: fast approach, plant one foot, drive the other knee up', loopFade: true, tail: 300,
    props: [{ type: 'target', x: 178, y: 14 }],
    keys: [
      { p: runA(10, 12), cap: 'Fast, relaxed approach' },
      { d: 200, p: runB(46, 12) },
      { d: 200, p: runA(84, 12) },
      { d: 200, p: runB(120, 8) },
      { d: 190, p: { x: 152, t: -4, lf: [24, 6, 96], lb: [-30, -64, 20], af: [-30, 0], ab: [30, 60] }, cap: 'Plant · heel-to-toe' },
      { d: 170, p: { x: 158, t: 4, lf: [18, -14, 86], lb: [50, -20, 96], af: [-50, -20], ab: [10, 40] } },
      { d: 320, e: 'out', p: { x: 170, air: 40, t: 0, lf: [-4, -8, 36], lb: [88, 6, 104], af: [176, 180], ab: [120, 140] }, cap: 'Knee up · reach' },
      { d: 330, e: 'in', p: { x: 182, air: 0, t: 22, lf: [40, -14, 90], lb: [36, -16, 90], af: [40, 60], ab: [34, 56] }, cap: 'Land soft' },
      { d: 500, p: { x: 182, t: 20, lf: [38, -13, 90], lb: [34, -15, 90], af: [36, 56], ab: [30, 50] } },
    ] });

  /* ---------- top-down maps (320 x 160) ---------- */
  const M = (o) => Object.assign({ kind: 'map', w: 320, h: 160 }, o);

  // rhythm runs: 10 px per yard. 10-yd build, 6 markers ~5.5 ft (≈18 px) apart
  {
    const x0 = 24, mk = [0, 1, 2, 3, 4, 5].map(i => 124 + i * 18.3);
    const bg = zone(x0, 66, 100, 28) + txt(74, 112, 'build 10 yd') + mk.map(x => dotM(x, 80)).join('') + txt(170, 112, '6 markers · 5½ ft apart') + line(x0, 60, x0, 100, 'm-line m-strong');
    sc.rhythm = M({ alt: 'Rhythm runs: build up for 10 yards, then run through six evenly spaced markers', bg, variants: [{
      start: [x0, 80], segs: [{ to: [124, 80], d: 1500, e: 'in', cap: 'Build to 85%' }, { to: [232, 80], d: 760, e: 'lin', cap: 'Land just past each marker' }, { to: [290, 80], d: 600, e: 'out', cap: 'Ease off' }] }] });
  }

  // cuts
  {
    const bg = cone(150, 80) + txt(150, 104, 'plant') + line(30, 80, 150, 80, 'm-line m-faint');
    const mk = (name, to, cueTxt) => ({ start: [30, 80], segs: [{ to: [138, 80], d: 1100, e: 'in', cap: name }, { to: [148, 80], d: 260, e: 'out' }, { to, d: 800, e: 'in' }, { to, d: 400 }] });
    sc.cuts = M({ alt: 'Cuts: 45-degree speed cut, 90-degree plant, 180-degree comeback, both sides', bg, variants: [
      mk('45° speed cut', [240, 24]), mk('45° speed cut', [240, 136]),
      mk('90° plant', [150, 10]), mk('90° plant', [150, 150]),
      mk('180° comeback', [40, 80]),
    ] });
  }

  // reactive evasion starts
  {
    const bg = zone(126, 56, 68, 48) + txt(160, 120, 'start off-balance here') ;
    const starts = ['Start: on one foot', 'Start: mid-spin', 'Start: shuffling', 'Start: kneeling'];
    const dirs = [{ t: '← GO', to: [34, 70] }, { t: 'GO →', to: [286, 90] }, { t: '↖ GO', to: [70, 14] }, { t: 'GO ↘', to: [262, 148] }, { t: '↙ GO', to: [62, 146] }, { t: 'GO ↗', to: [258, 12] }];
    const variants = [];
    starts.forEach((s, i) => dirs.forEach((d, j) => {
      const wob = i === 2 ? [{ to: [146, 80], d: 300, cap: s }, { to: [174, 80], d: 450 }, { to: [150, 80], d: 450 }] : i === 1 ? [{ to: [166, 74], d: 400, cap: s }, { to: [160, 86], d: 300 }, { to: [156, 78], d: 300 }] : [{ to: [160, 80], d: 1150, cap: s }];
      const t = wob.reduce((a, b) => a + b.d, 0);
      variants.push({ start: [160, 80], segs: [...wob, { to: d.to, d: 900, e: 'in', cap: 'React · go' }, { to: d.to, d: 500 }], events: [{ t: t - 100, text: d.t, d: 1000 }] });
    }));
    sc.evade = M({ alt: 'Reactive evasion starts: begin off-balance, react to a cue, cut and go', bg, variants, random: true });
  }

  // shadow evasion: 4x4 yd box = 100px
  {
    const bx = 110, by = 30;
    const bg = zone(bx, by, 100, 100, 'm-zone m-box') + txt(160, 152, '4 × 4 yd box') + cone(bx, by) + cone(bx + 100, by) + cone(bx, by + 100) + cone(bx + 100, by + 100);
    sc.shadow = M({ alt: 'Shadow evasion: flow between shuffle, crossover, drop step and spin inside a small box', bg, variants: [{
      start: [130, 110], segs: [
        { to: [190, 110], d: 900, e: 'lin', cap: 'Shuffle' },
        { to: [160, 70], d: 600, e: 'io', cap: 'Crossover' },
        { to: [130, 50], d: 500, e: 'io' },
        { to: [150, 60], d: 300, e: 'io', cap: 'Drop step' },
        { to: [186, 46], d: 500, e: 'io' },
        { to: [196, 64], d: 250, cap: 'Spin' }, { to: [182, 74], d: 250 }, { to: [192, 86], d: 250 },
        { to: [140, 96], d: 700, e: 'io', cap: 'Keep flowing' },
        { to: [130, 110], d: 400, e: 'io' },
      ] }] });
  }

  // 5-10-5 shuttle, 14 px per yard
  {
    const xs = [90, 160, 230];
    const bg = xs.map(x => line(x, 30, x, 130, x === 160 ? 'm-line m-strong' : 'm-line')).join('') + txt(90, 146, '5 yd') + txt(160, 146, 'start') + txt(230, 146, '5 yd');
    sc.shuttle = M({ alt: '5-10-5 shuttle: start in the middle, run 5 yards, touch, 10 back, touch, 5 through the middle', bg, variants: [{
      start: [160, 80], segs: [{ to: [160, 80], d: 600, cap: 'Stance on middle line' }, { to: [228, 80], d: 900, e: 'in', cap: '5 yd · touch line' }, { to: [92, 80], d: 1500, e: 'io', cap: '10 yd · touch line' }, { to: [200, 80], d: 1000, e: 'in', cap: '5 yd through middle' }, { to: [250, 80], d: 400, e: 'out' }] }] });
  }

  // flying 10s: 12 px/yd -> build 12 yd (144px), fly 8 yd... scaled to fit
  {
    const bg = zone(20, 66, 150, 28) + txt(95, 112, 'build 12 yd') + zone(170, 66, 100, 28, 'm-zone m-hot') + txt(220, 112, 'fly 8 yd · max') + cone(170, 80) + cone(270, 80);
    sc.flying = M({ alt: 'Flying 10s: build speed over 12 yards, then hold top speed through an 8-yard zone', bg, variants: [{
      start: [20, 80], segs: [{ to: [170, 80], d: 1800, e: 'in', cap: 'Smooth build' }, { to: [270, 80], d: 520, e: 'lin', cap: 'Top speed · relaxed' }, { to: [310, 80], d: 700, e: 'out', cap: 'Glide down' }] }] });
  }

  // reactive cue: dropped football bounce
  {
    const bg = zone(126, 56, 68, 48) + txt(160, 122, 'ready stance');
    const dirs = [{ t: 'bounce ←', to: [40, 80] }, { t: 'bounce →', to: [280, 80] }, { t: 'bounce ↖', to: [60, 16] }, { t: 'bounce ↗', to: [260, 16] }];
    sc.cue = M({ alt: 'Reactive cue: react to a pointing friend or a random football bounce', bg, random: true, variants: dirs.map(d => ({
      start: [160, 80], segs: [{ to: [160, 80], d: 1100, cap: 'Wait for the cue…' }, { to: d.to, d: 800, e: 'in', cap: 'React' }, { to: d.to, d: 400 }], events: [{ t: 1000, text: d.t, d: 900 }] })) });
  }

  /* ---------- footwork (top-down feet, 240 x 150) ---------- */
  const F = (o) => Object.assign({ kind: 'feet', w: 240, h: 150 }, o);
  {
    const bg = `<line x1="20" y1="75" x2="220" y2="75" class="m-line m-chalk"/><line x1="120" y1="12" x2="120" y2="138" class="m-line m-chalk"/>`;
    const k = [];
    const both = (lx, ly, rx, ry, d, cap) => k.push({ d, L: [lx, ly, 0], R: [rx, ry, 0], cap });
    both(60, 96, 80, 96, 0, 'Forward–back');
    for (let i = 0; i < 4; i++) { both(60, 54, 80, 54, 170); both(60, 96, 80, 96, 170); }
    both(100, 34, 112, 34, 400, 'Side–side');
    for (let i = 0; i < 4; i++) { both(128, 34, 140, 34, 170); both(100, 34, 112, 34, 170); }
    k.push({ d: 400, L: [164, 96, 0], R: [184, 54, 0], cap: 'Scissors' });
    for (let i = 0; i < 4; i++) { k.push({ d: 170, L: [164, 54, 0], R: [184, 96, 0] }); k.push({ d: 170, L: [164, 96, 0], R: [184, 54, 0] }); }
    k.push({ d: 400, L: null, R: [110, 112, 0], cap: 'Single leg · side–side' });
    for (let i = 0; i < 4; i++) { k.push({ d: 190, L: null, R: [132, 112, 0] }); k.push({ d: 190, L: null, R: [110, 112, 0] }); }
    k.push({ d: 400, L: [60, 96, 0], R: [80, 96, 0] });
    sc.linehops = F({ alt: 'Line hops: forward-back, side-side, scissors, and single-leg over a chalk line', bg, keys: k });
  }
  {
    const cx = 120, cy = 92, R2 = 52;
    const bg = `<circle cx="${cx}" cy="${cy}" r="9" class="m-marker m-center"/>` +
      [[0, -1, '12'], [0.707, -0.707, '45°'], [1, 0, 'side']].map(([dx, dy, l]) => `<circle cx="${cx + dx * R2}" cy="${cy + dy * R2}" r="13" class="m-spot"/><text x="${cx + dx * R2}" y="${cy + dy * R2 + (dy < 0 ? -18 : 26)}" text-anchor="middle" class="m-label">${l}</text>`).join('') +
      `<text x="${cx}" y="${cy + 30}" text-anchor="middle" class="m-label">center · turn 90° here</text>`;
    const home = [cx, cy, 0];
    const k = [{ d: 0, L: null, R: home, cap: 'Stand on one leg in the middle' }];
    [[[cx, cy - R2, 0], 'Hop forward · stick 2 s'], [[cx + R2 * 0.707, cy - R2 * 0.707, 0], 'Hop 45° · stick 2 s'], [[cx + R2, cy, 0], 'Hop sideways · stick 2 s'], [[cx, cy, 90], 'Hop + turn 90° · stick 2 s']].forEach(([to, cap]) => {
      k.push({ d: 600, L: null, R: home });
      k.push({ d: 320, L: null, R: to, cap });
      k.push({ d: 1200, L: null, R: to });
      k.push({ d: 320, L: null, R: home, cap: 'Back to center' });
    });
    sc.clock = F({ alt: 'Hop-and-stick clock: hop to each spot on one leg and freeze the landing', bg, keys: k });
  }

  return sc;
})();
