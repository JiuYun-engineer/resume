// Blueprint intro: grid lines grow out from a few scattered intersections,
// then hand off to the CSS grid in styles/main.css. Runs once per session.
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('bp-intro')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.add('bp-done'); return; }

  var STEP = 64;                       // must match the major grid size in main.css
  var LINE = 'rgba(148,163,184,.16)';  // same as the CSS major grid
  var TIP  = 'rgba(56,189,248,.85)';   // accent at the growing ends
  var canvas = document.createElement('canvas');
  canvas.className = 'bpCanvas';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  var cols = Math.ceil(W / STEP) + 1, rows = Math.ceil(H / STEP) + 1;

  // scattered seed intersections, one per zone so they spread over the screen
  var gx = Math.max(2, Math.round(Math.sqrt(8 * W / H))), gy = Math.max(2, Math.round(8 / gx));
  var seeds = [];
  for (var zy = 0; zy < gy; zy++) for (var zx = 0; zx < gx; zx++) {
    var px = (zx + 0.15 + Math.random() * 0.7) * W / gx, py = (zy + 0.15 + Math.random() * 0.7) * H / gy;
    seeds.push({ x: Math.round(px / STEP) * STEP, y: Math.round(py / STEP) * STEP, d: Math.random() * 0.35 });
  }

  var speed = Math.hypot(W, H) / 1.6;   // px per second
  function nearest(pos, key) {
    var best = seeds[0], bd = Infinity;
    seeds.forEach(function (s) { var d = Math.abs(s[key] - pos) + s.d * speed; if (d < bd) { bd = d; best = s; } });
    return { seed: best, delay: bd / speed };
  }
  var lines = [];
  for (var r = 0; r < rows; r++) { var y = r * STEP, n = nearest(y, 'y'); lines.push({ h: true, at: y, from: n.seed.x, t0: n.delay }); }
  for (var c = 0; c < cols; c++) { var x = c * STEP, m = nearest(x, 'x'); lines.push({ h: false, at: x, from: m.seed.y, t0: m.delay }); }

  var start = null, finished = false;

  function frame(ts) {
    if (start === null) start = ts;
    var t = (ts - start) / 1000;
    ctx.clearRect(0, 0, W, H);
    var allDone = true;

    lines.forEach(function (L) {
      var len = (t - L.t0) * speed;
      if (len <= 0) { allDone = false; return; }
      var limit = L.h ? W : H;
      var a = Math.max(0, L.from - len), b = Math.min(limit, L.from + len);
      if (a > 0 || b < limit) allDone = false;
      ctx.fillStyle = LINE;
      if (L.h) ctx.fillRect(a, L.at, b - a, 1); else ctx.fillRect(L.at, a, 1, b - a);
      // bright tips while growing
      ctx.fillStyle = TIP;
      var tip = 10;
      if (a > 0) { if (L.h) ctx.fillRect(a, L.at, tip, 1); else ctx.fillRect(L.at, a, 1, tip); }
      if (b < limit) { if (L.h) ctx.fillRect(b - tip, L.at, tip, 1); else ctx.fillRect(L.at, b - tip, 1, tip); }
    });

    // seed points pulse while the grid is forming
    var glow = Math.max(0, 1 - t / 2.2);
    if (glow > 0) {
      seeds.forEach(function (s) {
        if (t < s.d) return;
        ctx.beginPath();
        ctx.arc(s.x + 0.5, s.y + 0.5, 2.5 + (1 - glow) * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56,189,248,' + (0.9 * glow).toFixed(3) + ')';
        ctx.fill();
      });
    }

    if (allDone && glow === 0 && !finished) {
      finished = true;
      root.classList.add('bp-done');          // CSS grid (and fine grid) fade in
      canvas.style.opacity = '0';
      setTimeout(function () { canvas.remove(); }, 800);
      return;
    }
    if (t < 6) requestAnimationFrame(frame); else { root.classList.add('bp-done'); canvas.remove(); }
  }
  requestAnimationFrame(frame);
})();
