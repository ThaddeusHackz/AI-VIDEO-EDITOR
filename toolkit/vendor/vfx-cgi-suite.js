/**
 * HyperFrames VFX & CGI Canvas Suite (`window.HFVfxSuite`)
 * Zero-dependency deterministic Canvas2D VFX/CGI renderer for HyperFrames compositions.
 * Drive all methods from a paused GSAP timeline's `onUpdate` callback (`tl.time()`).
 */
(function (global) {
  "use strict";

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * 1. Portal Vortex CGI (Dr. Strange / Higgsfield Relativistic Ember Ring)
   */
  function drawPortalVortex(ctx, opts) {
    var cx = opts.x || 960;
    var cy = opts.y || 540;
    var r = (opts.radius || 220) * (opts.openProgress == null ? 1 : opts.openProgress);
    var t = opts.time || 0;
    var color = opts.color || "#ffb23f";
    if (r <= 2) return;

    ctx.save();
    var grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.45);
    grad.addColorStop(0, "rgba(5, 10, 22, 0.92)");
    grad.addColorStop(0.68, "rgba(255, 178, 63, 0.35)");
    grad.addColorStop(1, "rgba(6, 10, 18, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
    ctx.fill();

    for (var i = 0; i < 56; i++) {
      var rng = mulberry32(1200 + i * 37);
      var ang = (i / 56) * Math.PI * 2 + t * 2.4;
      var rad = r + (rng() - 0.35) * 36;
      var sx = cx + Math.cos(ang) * rad;
      var sy = cy + Math.sin(ang) * rad;
      var tx = sx - Math.sin(ang) * 42;
      var ty = sy + Math.cos(ang) * 42;
      ctx.strokeStyle = i % 3 === 0 ? "#ffffff" : color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * 2. Plasma Lightning Arc CGI (Midpoint-Displacement Electrical Bolts)
   */
  function drawPlasmaLightning(ctx, opts) {
    var x1 = opts.x1 || 200;
    var y1 = opts.y1 || 540;
    var x2 = opts.x2 || 1720;
    var y2 = opts.y2 || 540;
    var frame = Math.round((opts.time || 0) * 30);
    var color = opts.color || "#35d9f2";
    var branches = opts.branches || 3;

    ctx.save();
    for (var b = 0; b < branches; b++) {
      var rng = mulberry32(frame * 97 + b * 41);
      var steps = 16;
      ctx.beginPath();
      for (var i = 0; i <= steps; i++) {
        var p = i / steps;
        var env = Math.sin(p * Math.PI);
        var px = x1 + (x2 - x1) * p + (rng() - 0.5) * (70 + b * 24) * env;
        var py = y1 + (y2 - y1) * p + (rng() - 0.5) * (70 + b * 24) * env;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = b === 0 ? 6 : 3;
      ctx.globalAlpha = 0.45;
      ctx.stroke();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = b === 0 ? 2.2 : 1.1;
      ctx.globalAlpha = 0.92;
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * 3. Anamorphic Optical Lens Streak
   */
  function drawAnamorphicFlare(ctx, opts) {
    var cx = opts.x || 960;
    var cy = opts.y || 540;
    var w = opts.width || 1400;
    var color = opts.color || "rgba(53, 217, 242, 0.75)";

    ctx.save();
    var g = ctx.createLinearGradient(cx - w / 2, cy, cx + w / 2, cy);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - w / 2, cy - 3, w, 6);
    ctx.restore();
  }

  global.HFVfxSuite = {
    drawPortalVortex: drawPortalVortex,
    drawPlasmaLightning: drawPlasmaLightning,
    drawAnamorphicFlare: drawAnamorphicFlare
  };
})(typeof window !== "undefined" ? window : globalThis);
