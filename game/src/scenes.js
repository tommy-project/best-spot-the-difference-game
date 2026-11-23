// scenes.js — every picture in the game, painted in code.
// One job: draw a scene twice (left panel clean, right panel with the
// scene's differences applied) from nothing but canvas calls. No images,
// no network, no assets — the art is the code, so both panels always match
// except exactly where a difference says otherwise.
//
// A scene is { id, name, diffs, paint }. paint(ctx, W, H, mods) draws the
// scene; mods is the set of difference ids active on this panel (empty for
// the left panel, all ids for the right panel). A difference's x/y are
// normalised panel coordinates (0..1); r is its marker radius in px at
// 600x450, scaled by the renderer.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sky(ctx, W, H, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function glow(ctx, x, y, rad, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
}

function starField(ctx, W, H, seed, count, maxY, skip) {
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const x = rnd() * W;
    const y = rnd() * maxY * H;
    const r = 0.6 + rnd() * 1.5;
    if (skip && skip(x / W, y / H)) continue;
    const a = 0.45 + rnd() * 0.55;
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (i % 11 === 0) {
      ctx.strokeStyle = `rgba(255,255,255,${(a * 0.7).toFixed(2)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - r * 3, y); ctx.lineTo(x + r * 3, y);
      ctx.moveTo(x, y - r * 3); ctx.lineTo(x, y + r * 3);
      ctx.stroke();
    }
  }
}

function pine(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 26 * s);
  ctx.lineTo(x - 15 * s, y + 6 * s);
  ctx.lineTo(x - 7 * s, y + 6 * s);
  ctx.lineTo(x - 17 * s, y + 22 * s);
  ctx.lineTo(x + 17 * s, y + 22 * s);
  ctx.lineTo(x + 7 * s, y + 6 * s);
  ctx.lineTo(x + 15 * s, y + 6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a2417';
  ctx.fillRect(x - 2.5 * s, y + 22 * s, 5 * s, 8 * s);
}

function flower(ctx, x, y, petal, center) {
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(x, y, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2f7d4f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 20);
  ctx.stroke();
}

// ------------------------------------------------------------- scene 1
const GARDEN_DIFFS = [
  { id: 'g1', x: 0.78, y: 0.16, r: 16, label: 'Extra crater on the moon' },
  { id: 'g2', x: 0.13, y: 0.12, r: 16, label: 'A bright star went missing' },
  { id: 'g3', x: 0.30, y: 0.80, r: 16, label: 'One flower changed colour' },
  { id: 'g4', x: 0.63, y: 0.56, r: 15, label: 'The dome window went dark' },
  { id: 'g5', x: 0.45, y: 0.88, r: 16, label: 'The pond fish swam away' },
  { id: 'g6', x: 0.86, y: 0.60, r: 15, label: 'An extra firefly showed up' },
  { id: 'g7', x: 0.16, y: 0.52, r: 17, label: 'A pine tree vanished' },
];

function paintGarden(ctx, W, H, mods) {
  const px = (v) => v * W;
  const py = (v) => v * H;
  sky(ctx, W, H, [[0, '#0b1035'], [0.55, '#2a1b5e'], [0.8, '#4b2a6e'], [1, '#123f4a']]);
  starField(ctx, W, H, 41, 90, 0.62, mods.has('g2')
    ? (nx, ny) => Math.hypot(nx - 0.13, (ny - 0.12) * 1.3) < 0.03
    : null);
  // Moon with glow and craters.
  glow(ctx, px(0.78), py(0.16), 70, 'rgba(255,244,200,0.35)');
  ctx.fillStyle = '#f7efc8';
  ctx.beginPath(); ctx.arc(px(0.78), py(0.16), 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d9cfa0';
  for (const [cx, cy, cr] of [[0.76, 0.14, 6], [0.80, 0.18, 4.5], [0.77, 0.19, 3]]) {
    ctx.beginPath(); ctx.arc(px(cx), py(cy), cr, 0, Math.PI * 2); ctx.fill();
  }
  if (mods.has('g1')) {
    ctx.beginPath(); ctx.arc(px(0.795), py(0.135), 5, 0, Math.PI * 2); ctx.fill();
  }
  // Rolling hills.
  ctx.fillStyle = '#1d2b4d';
  ctx.beginPath(); ctx.ellipse(px(0.22), py(0.62), px(0.42), py(0.16), 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#16233d';
  ctx.beginPath(); ctx.ellipse(px(0.85), py(0.60), px(0.40), py(0.15), 0, Math.PI, 0); ctx.fill();
  // Pines on the left hill (one vanishes on the right panel).
  pine(ctx, px(0.07), py(0.52), 0.9, '#0f2c22');
  if (!mods.has('g7')) pine(ctx, px(0.16), py(0.52), 1.05, '#123a2a');
  pine(ctx, px(0.25), py(0.53), 0.8, '#0f2c22');
  // Observatory dome on the right hill.
  ctx.fillStyle = '#2c355e';
  ctx.fillRect(px(0.57), py(0.55), px(0.13), py(0.09));
  ctx.fillStyle = '#3d4a7d';
  ctx.beginPath(); ctx.arc(px(0.635), py(0.55), px(0.065), Math.PI, 0); ctx.fill();
  ctx.fillStyle = mods.has('g4') ? '#1a2140' : '#ffd76a';
  ctx.beginPath(); ctx.arc(px(0.635), py(0.575), 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a94b8';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px(0.635), py(0.485)); ctx.lineTo(px(0.635), py(0.44)); ctx.stroke();
  // Telescope silhouette left of the dome.
  ctx.strokeStyle = '#0e1526';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(px(0.44), py(0.60)); ctx.lineTo(px(0.50), py(0.47)); ctx.stroke();
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(px(0.49), py(0.49)); ctx.lineTo(px(0.53), py(0.43)); ctx.stroke();
  // Garden ground.
  const gg = ctx.createLinearGradient(0, py(0.64), 0, H);
  gg.addColorStop(0, '#1c4a34'); gg.addColorStop(1, '#0d2b1e');
  ctx.fillStyle = gg;
  ctx.fillRect(0, py(0.64), W, H - py(0.64));
  // Flower bed: one bloom changes colour on the right panel.
  const petals = ['#b678f0', '#ff8fd1', '#8fd1ff', '#ffd76a'];
  for (let i = 0; i < 9; i++) {
    const fx = 0.06 + i * 0.105;
    const fy = 0.76 + (i % 2) * 0.07;
    const color = (mods.has('g3') && i === 2) ? '#ff4d5e' : petals[i % petals.length];
    flower(ctx, px(fx), py(fy), color, '#fff3b0');
  }
  // Pond with a fish that swims away on the right panel.
  ctx.fillStyle = '#173a5e';
  ctx.beginPath(); ctx.ellipse(px(0.45), py(0.88), px(0.13), py(0.055), 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(160,210,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(px(0.45), py(0.88), px(0.09), py(0.03), 0, 0.2, Math.PI * 1.1); ctx.stroke();
  if (!mods.has('g5')) {
    ctx.fillStyle = '#ff9d4d';
    ctx.beginPath(); ctx.ellipse(px(0.45), py(0.88), 9, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(px(0.45) - 8, py(0.88)); ctx.lineTo(px(0.45) - 15, py(0.88) - 5);
    ctx.lineTo(px(0.45) - 15, py(0.88) + 5); ctx.closePath(); ctx.fill();
  }
  // Fireflies, one extra on the right panel.
  const fire = [[0.72, 0.68], [0.55, 0.72], [0.90, 0.74], [0.33, 0.66]];
  if (mods.has('g6')) fire.push([0.86, 0.60]);
  for (const [fx, fy] of fire) glow(ctx, px(fx), py(fy), 12, 'rgba(190,255,120,0.8)');
}

// ------------------------------------------------------------- scene 2
const HARBOR_DIFFS = [
  { id: 'h1', x: 0.30, y: 0.30, r: 17, label: 'The lighthouse beam swung round' },
  { id: 'h2', x: 0.55, y: 0.55, r: 17, label: 'A sail changed colour' },
  { id: 'h3', x: 0.80, y: 0.18, r: 15, label: 'An extra gull joined the sky' },
  { id: 'h4', x: 0.22, y: 0.72, r: 15, label: 'The dock lantern went dark' },
  { id: 'h5', x: 0.72, y: 0.78, r: 17, label: 'A crate went missing' },
  { id: 'h6', x: 0.38, y: 0.82, r: 15, label: 'The buoy drifted away' },
  { id: 'h7', x: 0.50, y: 0.16, r: 15, label: 'The lighthouse flag vanished' },
  { id: 'h8', x: 0.86, y: 0.60, r: 15, label: 'A harbour window went dark' },
  { id: 'h9', x: 0.62, y: 0.88, r: 16, label: 'The moon path on the water faded' },
];

function paintHarbor(ctx, W, H, mods) {
  const px = (v) => v * W;
  const py = (v) => v * H;
  sky(ctx, W, H, [[0, '#1b1440'], [0.5, '#5e2a63'], [0.75, '#c65f4e'], [1, '#2a1e4f']]);
  starField(ctx, W, H, 97, 60, 0.4, null);
  // Low moon and its reflection path on the water.
  glow(ctx, px(0.62), py(0.20), 55, 'rgba(255,220,160,0.4)');
  ctx.fillStyle = '#ffe9b8';
  ctx.beginPath(); ctx.arc(px(0.62), py(0.20), 26, 0, Math.PI * 2); ctx.fill();
  // Sea.
  const sg = ctx.createLinearGradient(0, py(0.58), 0, H);
  sg.addColorStop(0, '#274b73'); sg.addColorStop(1, '#12283f');
  ctx.fillStyle = sg;
  ctx.fillRect(0, py(0.58), W, H - py(0.58));
  if (!mods.has('h9')) {
    ctx.fillStyle = 'rgba(255,220,160,0.35)';
    for (let i = 0; i < 5; i++) {
      const wdt = 34 - i * 4;
      ctx.fillRect(px(0.62) - wdt / 2, py(0.62) + i * py(0.055), wdt, 3);
    }
  }
  // Gulls (one extra on the right panel).
  ctx.strokeStyle = '#e8e4ff';
  ctx.lineWidth = 2;
  const gulls = [[0.68, 0.14], [0.74, 0.22], [0.58, 0.10]];
  if (mods.has('h3')) gulls.push([0.80, 0.18]);
  for (const [gx, gy] of gulls) {
    ctx.beginPath();
    ctx.arc(px(gx) - 6, py(gy), 6, Math.PI * 1.15, Math.PI * 1.85);
    ctx.arc(px(gx) + 6, py(gy), 6, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  // Lighthouse on the left cliff.
  ctx.fillStyle = '#241a3d';
  ctx.beginPath(); ctx.moveTo(px(0.42), py(0.62)); ctx.lineTo(px(0.47), py(0.62));
  ctx.lineTo(px(0.465), py(0.24)); ctx.lineTo(px(0.425), py(0.24)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4ede0';
  ctx.fillRect(px(0.435), py(0.40), px(0.02), py(0.05));
  ctx.fillStyle = '#2c2145';
  ctx.fillRect(px(0.415), py(0.20), px(0.06), py(0.045));
  ctx.fillStyle = '#ffe27a';
  ctx.fillRect(px(0.428), py(0.21), px(0.034), py(0.025));
  if (!mods.has('h7')) {
    ctx.strokeStyle = '#2c2145'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px(0.445), py(0.20)); ctx.lineTo(px(0.445), py(0.13)); ctx.stroke();
    ctx.fillStyle = '#ff5d73';
    ctx.beginPath(); ctx.moveTo(px(0.445), py(0.13)); ctx.lineTo(px(0.485), py(0.15)); ctx.lineTo(px(0.445), py(0.17)); ctx.closePath(); ctx.fill();
  }
  // Beam: left panel sweeps left, right panel sweeps right.
  const beamToLeft = !mods.has('h1');
  ctx.fillStyle = 'rgba(255,226,122,0.28)';
  ctx.beginPath();
  ctx.moveTo(px(0.445), py(0.225));
  ctx.lineTo(px(beamToLeft ? 0.16 : 0.72), py(0.30));
  ctx.lineTo(px(beamToLeft ? 0.16 : 0.72), py(0.36));
  ctx.lineTo(px(0.445), py(0.235));
  ctx.closePath(); ctx.fill();
  // Sailboat: its sail changes colour on the right panel.
  ctx.fillStyle = '#3a2b1c';
  ctx.beginPath(); ctx.moveTo(px(0.50), py(0.66)); ctx.lineTo(px(0.62), py(0.66));
  ctx.lineTo(px(0.59), py(0.70)); ctx.lineTo(px(0.53), py(0.70)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a2b1c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(px(0.56), py(0.66)); ctx.lineTo(px(0.56), py(0.44)); ctx.stroke();
  ctx.fillStyle = mods.has('h2') ? '#ff7a6b' : '#f7f3e8';
  ctx.beginPath(); ctx.moveTo(px(0.56), py(0.45)); ctx.lineTo(px(0.56), py(0.64)); ctx.lineTo(px(0.64), py(0.64)); ctx.closePath(); ctx.fill();
  // Second small boat.
  ctx.fillStyle = '#2c2118';
  ctx.beginPath(); ctx.moveTo(px(0.78), py(0.72)); ctx.lineTo(px(0.86), py(0.72));
  ctx.lineTo(px(0.84), py(0.75)); ctx.lineTo(px(0.80), py(0.75)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8fd1ff';
  ctx.beginPath(); ctx.moveTo(px(0.82), py(0.72)); ctx.lineTo(px(0.82), py(0.60)); ctx.lineTo(px(0.87), py(0.72)); ctx.closePath(); ctx.fill();
  // Buoy (drifts away on the right panel).
  if (!mods.has('h6')) {
    ctx.fillStyle = '#ff6b4d';
    ctx.beginPath(); ctx.arc(px(0.38), py(0.82), 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(px(0.38) - 8, py(0.82) - 2, 16, 4);
  }
  // Dock along the bottom.
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(0, py(0.86), W, H - py(0.86));
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath(); ctx.moveTo(px(i * 0.13), py(0.86)); ctx.lineTo(px(i * 0.13), H); ctx.stroke();
  }
  // Dock lantern (lit on the left, dark on the right).
  ctx.strokeStyle = '#2c2118'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(px(0.22), py(0.86)); ctx.lineTo(px(0.22), py(0.70)); ctx.stroke();
  if (!mods.has('h4')) glow(ctx, px(0.22), py(0.69), 22, 'rgba(255,200,90,0.85)');
  ctx.fillStyle = mods.has('h4') ? '#3a3f55' : '#ffd76a';
  ctx.fillRect(px(0.22) - 6, py(0.69) - 8, 12, 14);
  // Crate stack (three high on the left, two on the right).
  ctx.fillStyle = '#8a6a3d';
  ctx.fillRect(px(0.70), py(0.78), 22, 22);
  ctx.fillRect(px(0.725), py(0.78), 22, 22);
  if (!mods.has('h5')) ctx.fillRect(px(0.712), py(0.755), 22, 22);
  ctx.strokeStyle = '#5d4423'; ctx.lineWidth = 1.5;
  for (const [cx, cy] of [[0.70, 0.78], [0.725, 0.78]]) {
    ctx.strokeRect(px(cx), py(cy), 22, 22);
  }
  // Harbour house on the right with one window.
  ctx.fillStyle = '#33254d';
  ctx.fillRect(px(0.82), py(0.52), px(0.12), py(0.10));
  ctx.fillStyle = '#241a3d';
  ctx.beginPath(); ctx.moveTo(px(0.81), py(0.52)); ctx.lineTo(px(0.88), py(0.44)); ctx.lineTo(px(0.95), py(0.52)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = mods.has('h8') ? '#1a2140' : '#ffd76a';
  ctx.fillRect(px(0.855), py(0.56), 12, 14);
}

// ------------------------------------------------------------- scene 3
const OBSERVATORY_DIFFS = [
  { id: 'o1', x: 0.72, y: 0.25, r: 18, label: 'The ringed planet tilted its rings' },
  { id: 'o2', x: 0.30, y: 0.55, r: 16, label: 'The astronaut visor changed colour' },
  { id: 'o3', x: 0.82, y: 0.45, r: 16, label: 'The satellite lost a solar panel' },
  { id: 'o4', x: 0.15, y: 0.20, r: 16, label: 'A comet streaked past — or did not' },
  { id: 'o5', x: 0.55, y: 0.70, r: 16, label: 'The dish antenna turned away' },
  { id: 'o6', x: 0.68, y: 0.85, r: 15, label: 'The rover lost a wheel' },
  { id: 'o7', x: 0.40, y: 0.25, r: 18, label: 'The nebula shifted its hue' },
  { id: 'o8', x: 0.20, y: 0.82, r: 15, label: 'The console graph changed shape' },
  { id: 'o9', x: 0.90, y: 0.12, r: 15, label: 'A star cluster blinked out' },
  { id: 'o10', x: 0.60, y: 0.35, r: 15, label: 'A new crater marked the planet' },
];

function paintObservatory(ctx, W, H, mods) {
  const px = (v) => v * W;
  const py = (v) => v * H;
  sky(ctx, W, H, [[0, '#050514'], [0.6, '#120a33'], [1, '#1c0f45']]);
  // Nebula clouds: violet on the left, teal-shifted on the right.
  const neb = mods.has('o7') ? 'rgba(64,190,178,' : 'rgba(150,90,220,';
  glow(ctx, px(0.40), py(0.25), 130, `${neb}0.28)`);
  glow(ctx, px(0.42), py(0.28), 70, `${neb}0.30)`);
  glow(ctx, px(0.88), py(0.55), 100, 'rgba(220,90,150,0.20)');
  glow(ctx, px(0.12), py(0.60), 90, 'rgba(70,120,230,0.22)');
  starField(ctx, W, H, 7, 110, 0.75, mods.has('o9')
    ? (nx, ny) => Math.hypot(nx - 0.90, (ny - 0.12) * 1.3) < 0.045
    : null);
  // Comet (only on the left panel).
  if (!mods.has('o4')) {
    const cg = ctx.createLinearGradient(px(0.15), py(0.20), px(0.05), py(0.12));
    cg.addColorStop(0, 'rgba(255,255,255,0.9)');
    cg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = cg; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px(0.15), py(0.20)); ctx.lineTo(px(0.04), py(0.11)); ctx.stroke();
    glow(ctx, px(0.15), py(0.20), 14, 'rgba(255,255,255,0.9)');
  }
  // Ringed planet, rings tilt on the right panel.
  glow(ctx, px(0.72), py(0.25), 80, 'rgba(255,180,120,0.25)');
  ctx.fillStyle = '#e08a4d';
  ctx.beginPath(); ctx.arc(px(0.72), py(0.25), 42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c96f35';
  ctx.beginPath(); ctx.arc(px(0.70), py(0.23), 12, 0, Math.PI * 2); ctx.fill();
  if (mods.has('o10')) {
    ctx.fillStyle = '#a85428';
    ctx.beginPath(); ctx.arc(px(0.60), py(0.35), 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = mods.has('o1') ? '#ffd76a' : '#ffe9b8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(px(0.72), py(0.25), 68, 16, mods.has('o1') ? -0.55 : -0.32, 0, Math.PI * 2);
  ctx.stroke();
  // Astronaut floating left-centre; visor colour differs.
  ctx.fillStyle = '#e8ecf4';
  ctx.beginPath(); ctx.arc(px(0.30), py(0.50), 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(px(0.30) - 13, py(0.52), 26, 34);
  ctx.fillStyle = '#d5dae6';
  ctx.fillRect(px(0.30) - 20, py(0.54), 7, 24);
  ctx.fillRect(px(0.30) + 13, py(0.54), 7, 24);
  ctx.fillStyle = mods.has('o2') ? '#37e0a0' : '#7ab8ff';
  ctx.beginPath(); ctx.arc(px(0.30), py(0.50), 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(232,236,244,0.8)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(px(0.315), py(0.86)); ctx.quadraticCurveTo(px(0.38), py(0.95), px(0.44), py(0.88)); ctx.stroke();
  // Satellite top-right: two panels on the left, one on the right.
  ctx.fillStyle = '#c9d2e0';
  ctx.fillRect(px(0.80), py(0.43), 26, 16);
  ctx.fillStyle = '#2a4a8f';
  ctx.fillRect(px(0.755), py(0.45), 40, 12);
  if (!mods.has('o3')) ctx.fillRect(px(0.83), py(0.45), 40, 12);
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath(); ctx.arc(px(0.813), py(0.51), 4, 0, Math.PI * 2); ctx.fill();
  // Station floor along the bottom.
  const fg = ctx.createLinearGradient(0, py(0.78), 0, H);
  fg.addColorStop(0, '#2a2f4a'); fg.addColorStop(1, '#141830');
  ctx.fillStyle = fg;
  ctx.fillRect(0, py(0.78), W, H - py(0.78));
  ctx.strokeStyle = 'rgba(140,180,255,0.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, py(0.78)); ctx.lineTo(W, py(0.78)); ctx.stroke();
  // Console with a graph that changes shape.
  ctx.fillStyle = '#1d2340';
  ctx.fillRect(px(0.13), py(0.76), px(0.15), py(0.12));
  ctx.fillStyle = '#0b1030';
  ctx.fillRect(px(0.14), py(0.775), px(0.13), py(0.075));
  ctx.strokeStyle = '#37e0a0'; ctx.lineWidth = 2;
  ctx.beginPath();
  const graph = mods.has('o8')
    ? [[0.145, 0.83], [0.17, 0.80], [0.195, 0.835], [0.22, 0.795], [0.25, 0.82]]
    : [[0.145, 0.82], [0.17, 0.835], [0.195, 0.80], [0.22, 0.83], [0.25, 0.795]];
  graph.forEach(([gx, gy], i) => { if (i === 0) ctx.moveTo(px(gx), py(gy)); else ctx.lineTo(px(gx), py(gy)); });
  ctx.stroke();
  // Dish antenna: points up-left on the left, up-right on the right.
  ctx.strokeStyle = '#8a94b8'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(px(0.55), py(0.88)); ctx.lineTo(px(0.55), py(0.72)); ctx.stroke();
  ctx.fillStyle = '#c9d2e0';
  ctx.beginPath();
  ctx.arc(px(0.55), py(0.70), 16, mods.has('o5') ? -0.4 : Math.PI + 0.4, mods.has('o5') ? 1.9 : Math.PI * 2 - 0.4);
  ctx.closePath(); ctx.fill();
  // Rover on the floor: three wheels on the left, two on the right.
  ctx.fillStyle = '#b8c0d4';
  ctx.fillRect(px(0.63), py(0.815), px(0.11), py(0.035));
  ctx.fillStyle = '#1c2233';
  const wheels = [0.645, 0.685, 0.725];
  for (const wx of wheels) {
    if (mods.has('o6') && wx === 0.725) continue;
    ctx.beginPath(); ctx.arc(px(wx), py(0.86), 7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#37e0a0';
  ctx.fillRect(px(0.66), py(0.80), 10, 6);
}

export const SCENES = [
  { id: 'garden', name: 'Starlight Garden', diffs: GARDEN_DIFFS, paint: paintGarden },
  { id: 'harbor', name: 'Moon Harbor', diffs: HARBOR_DIFFS, paint: paintHarbor },
  { id: 'observatory', name: 'Nebula Observatory', diffs: OBSERVATORY_DIFFS, paint: paintObservatory },
];

export function sceneById(id) {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}
