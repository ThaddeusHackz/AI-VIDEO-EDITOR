/**
 * genesis-engine.js — pure drawing engine for the Genesis Code plate (shot S3 of The Singularity Engine).
 * Adapted from registry/blocks/code-particle-assemble: same glyph-pixel sampling bridge, re-driven on Canvas2D with
 * the film's closed-form spring (identical to remotion/src/singularity/physics/springs.ts).
 * Exposes window.GenesisPlate = { render(t), springEase, COMPILE }. Every pixel is a pure function of t.
 */
(function () {
  "use strict";
  if (document.fonts && document.fonts.load) {
    document.fonts.load('700 34px "JetBrains Mono"');
    document.fonts.load('400 22px "JetBrains Mono"');
  }

        var W = 1440;
        var H = 1440;
        var C = { amber: "#D97757", cream: "#F5F2EB", ember: "#FF9A5C", cyan: "#00F0FF", ice: "#BFFCFF", dim: "rgba(245,242,235,0.42)" };

        // ---- closed-form damped harmonic oscillator (identical to remotion/src/singularity/physics/springs.ts) ----
        function oscillator(t, x0, v0, m, k, c) {
          if (t <= 0) return x0;
          var w0 = Math.sqrt(k / m);
          var z = c / (2 * Math.sqrt(k * m));
          if (z < 1) {
            var wd = w0 * Math.sqrt(1 - z * z);
            var B = (v0 + z * w0 * x0) / wd;
            return Math.exp(-z * w0 * t) * (x0 * Math.cos(wd * t) + B * Math.sin(wd * t));
          }
          return (x0 + (v0 + w0 * x0) * t) * Math.exp(-w0 * t);
        }
        function springP(t, m, k, c) {
          return 1 - oscillator(t, 1, 0, m, k, c);
        }
        // GSAP ease built from the closed-form spring (p ∈ [0,1] over `seconds`)
        function springEase(seconds, m, k, c) {
          return function (p) {
            return springP(p * seconds, m, k, c);
          };
        }
        function mulberry32(a) {
          return function () {
            a |= 0;
            a = (a + 0x6d2b79f5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
          };
        }

        // ---- the code: TS + GLSL, token-coloured (amber = Opus, cyan = Astra) ----
        var LINES = [
          [["const ", C.amber], ["opus", C.cream], [" = ", C.dim], ["spring", C.ember], ["({ k: ", C.dim], ["170", C.ember], [", c: ", C.dim], ["26", C.ember], [" });", C.dim]],
          [["uniform ", C.cyan], ["vec3 ", C.cyan], ["sol", C.ice], [";  ", C.dim], ["// astra corona", "rgba(191,252,255,0.5)"]],
          [["ring", C.cyan], ["(r = phi * t)", C.dim], [".cross(", C.cream], ["line", C.amber], ["(0, W));", C.dim]],
          [["lattice", C.cream], ["(hex, ", C.dim], ["6", C.ember], [").", C.dim], ["emit", C.amber], ['("svg");', C.ice]],
        ];
        var COMPILE = [0.3, 0.6, 0.9, 1.2]; // plate seconds == film frames 234/252/270/288
        var X0 = 110;
        var Y0 = [560, 700, 840, 980];
        var FONT = '700 34px "JetBrains Mono"';

        // ---- SVG shape geometry generated from the same equations the film uses ----
        (function buildShapes() {
          var d = "";
          for (var i = 0; i <= 120; i++) {
            var t = (i / 120) * 1.6;
            var y = oscillator(t, 1, 0, 1, 170 / 4, 4.2) * 60;
            d += (i ? " L " : "M ") + (1030 + i * 2.55).toFixed(1) + " " + (586 - y).toFixed(1);
          }
          document.getElementById("shape-0").setAttribute("d", d);
          var s = "";
          for (var r = 0; r < 36; r++) {
            var a = (r / 36) * Math.PI * 2;
            var len = r % 3 === 0 ? 86 : 58;
            s += "M " + (1185 + Math.cos(a) * 34).toFixed(1) + " " + (726 + Math.sin(a) * 34).toFixed(1) + " L " + (1185 + Math.cos(a) * len).toFixed(1) + " " + (726 + Math.sin(a) * len).toFixed(1) + " ";
          }
          document.getElementById("shape-1").setAttribute("d", s);
          var h = "";
          var R = 26;
          var centres = [[0, 0], [1, 0], [-1, 0], [0.5, 0.866], [-0.5, 0.866], [0.5, -0.866], [-0.5, -0.866]];
          for (var c = 0; c < centres.length; c++) {
            var cx = 1185 + centres[c][0] * R * 1.8;
            var cy = 1006 + centres[c][1] * R * 1.8;
            for (var k = 0; k <= 6; k++) {
              var ang = (k / 6) * Math.PI * 2 + Math.PI / 6;
              h += (k ? " L " : " M ") + (cx + Math.cos(ang) * R).toFixed(1) + " " + (cy + Math.sin(ang) * R).toFixed(1);
            }
          }
          document.getElementById("shape-3").setAttribute("d", h);
        })();

        // ---- glyph-pixel targets (the registry block's drawCodeToCanvas bridge, Canvas2D edition) ----
        var targets = null;
        function buildTargets() {
          var off = document.createElement("canvas");
          off.width = W;
          off.height = H;
          var o = off.getContext("2d");
          o.font = FONT;
          o.textBaseline = "alphabetic";
          var rand = mulberry32(5150);
          var out = [];
          for (var li = 0; li < LINES.length; li++) {
            o.clearRect(0, 0, W, H);
            var x = X0;
            for (var k = 0; k < LINES[li].length; k++) {
              o.fillStyle = "#ffffff";
              o.fillText(LINES[li][k][0], x, Y0[li]);
              var w = o.measureText(LINES[li][k][0]).width;
              LINES[li][k].x = x;
              LINES[li][k].w = w;
              x += w;
            }
            var data = o.getImageData(0, Y0[li] - 40, W, 56).data;
            var pts = [];
            for (var yy = 0; yy < 56; yy += 3) {
              for (var xx = X0 - 4; xx < 940; xx += 3) {
                if (data[(yy * W + xx) * 4 + 3] > 120) {
                  var col = C.cream;
                  for (var t2 = 0; t2 < LINES[li].length; t2++) {
                    if (xx >= LINES[li][t2].x && xx < LINES[li][t2].x + LINES[li][t2].w) col = LINES[li][t2][1];
                  }
                  var ang = rand() * Math.PI * 2;
                  var rad = 380 + rand() * 820;
                  pts.push({ tx: xx, ty: Y0[li] - 40 + yy, ox: 720 + Math.cos(ang) * rad, oy: 720 + Math.sin(ang) * rad * 0.8, d: rand() * 0.1, sw: (rand() - 0.5) * 140, col: col });
                }
              }
            }
            out.push(pts);
          }
          return out;
        }

        var cva = document.getElementById("cv-a").getContext("2d");
        var cvb = document.getElementById("cv-b").getContext("2d");
        var state = { t: 0 };

        function drawA(t) {
          cva.clearRect(0, 0, W, H);
          if (!targets) {
            if (!document.fonts || !document.fonts.check(FONT)) return;
            targets = buildTargets();
          }
          // microscopic grid behind the code
          cva.strokeStyle = "rgba(245,242,235,0.05)";
          cva.lineWidth = 1;
          for (var g = 0; g <= W; g += 48) {
            cva.beginPath();
            cva.moveTo(g, 0);
            cva.lineTo(g, H);
            cva.stroke();
            cva.beginPath();
            cva.moveTo(0, g);
            cva.lineTo(W, g);
            cva.stroke();
          }
          cva.font = FONT;
          for (var li = 0; li < targets.length; li++) {
            var start = COMPILE[li] - 0.29;
            var lt = t - start;
            if (lt <= 0) continue;
            var pts = targets[li];
            var crisp = Math.max(0, Math.min(1, (t - COMPILE[li] + 0.06) / 0.1));
            cva.globalCompositeOperation = "lighter";
            for (var i = 0; i < pts.length; i++) {
              var p = pts[i];
              var pt = lt - p.d;
              if (pt <= 0) continue;
              var s = springP(pt, 0.5, 260, 15);
              var sw = Math.sin(s * Math.PI) * p.sw * (1 - Math.min(1, s));
              var x = p.ox + (p.tx - p.ox) * s + sw;
              var y = p.oy + (p.ty - p.oy) * s - sw * 0.4;
              var a = (1 - crisp * 0.85) * Math.min(1, pt * 8);
              if (a <= 0.01) continue;
              cva.globalAlpha = a;
              cva.fillStyle = p.col;
              cva.fillRect(x, y, 2.4, 2.4);
            }
            cva.globalAlpha = 1;
            cva.globalCompositeOperation = "source-over";
            if (crisp > 0) {
              var flash = Math.exp(-Math.max(0, t - COMPILE[li]) / 0.12);
              cva.shadowColor = LINES[li][0][1];
              cva.shadowBlur = 18 + 40 * flash;
              for (var k = 0; k < LINES[li].length; k++) {
                cva.globalAlpha = crisp;
                cva.fillStyle = LINES[li][k][1];
                cva.fillText(LINES[li][k][0], LINES[li][k].x, Y0[li]);
              }
              cva.shadowBlur = 0;
              cva.globalAlpha = 1;
              if (flash > 0.02 && window.HFVfxSuite) {
                cva.globalCompositeOperation = "lighter";
                window.HFVfxSuite.drawAnamorphicFlare(cva, { x: 905, y: Y0[li] - 12, width: 900 * flash, color: li % 2 ? "rgba(0,240,255,0.8)" : "rgba(255,154,92,0.8)" });
                cva.globalCompositeOperation = "source-over";
              }
            }
          }
        }

        function drawB(t) {
          cvb.clearRect(0, 0, W, H);
          var lt = Math.max(0, t - 1.35);
          var cx = 720;
          var cy = 720;
          cvb.globalCompositeOperation = "lighter";
          // outward-streaming glyph sparks: the dive keeps travelling
          var rand = mulberry32(8800);
          for (var i = 0; i < 420; i++) {
            var a = rand() * Math.PI * 2;
            var sp = 0.35 + rand() * 0.65;
            var r = ((rand() * 900 + lt * 900 * sp) % 900) + 40;
            var len = 6 + r * 0.05;
            cvb.strokeStyle = i % 3 === 0 ? "rgba(0,240,255,0.55)" : "rgba(255,154,92,0.45)";
            cvb.lineWidth = 1.4;
            cvb.beginPath();
            cvb.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            cvb.lineTo(cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len));
            cvb.stroke();
          }
          var grow = springP(lt, 0.8, 120, 13);
          // 12-fold replication of the four compiled shapes
          for (var k = 0; k < 12; k++) {
            var base = (k / 12) * Math.PI * 2;
            // spring curves (amber), radiating
            var rot1 = base + lt * 0.55;
            cvb.strokeStyle = "rgba(217,119,87,0.85)";
            cvb.lineWidth = 2.6;
            cvb.beginPath();
            for (var j = 0; j <= 60; j++) {
              var tt = (j / 60) * 1.6;
              var rr = 120 + j * 5.2 * grow;
              var off = oscillator(tt, 1, 0, 1, 42.5, 4.2) * 34 * grow;
              var px = cx + Math.cos(rot1) * rr - Math.sin(rot1) * off;
              var py = cy + Math.sin(rot1) * rr + Math.cos(rot1) * off;
              if (j) cvb.lineTo(px, py);
              else cvb.moveTo(px, py);
            }
            cvb.stroke();
            // corona rays (cyan), counter-rotating
            var rot2 = base - lt * 0.8 + Math.PI / 12;
            cvb.strokeStyle = "rgba(0,240,255,0.8)";
            cvb.lineWidth = 2;
            cvb.beginPath();
            cvb.moveTo(cx + Math.cos(rot2) * 470 * grow, cy + Math.sin(rot2) * 470 * grow);
            cvb.lineTo(cx + Math.cos(rot2) * (560 + 60 * Math.sin(lt * 6 + k)) * grow, cy + Math.sin(rot2) * (560 + 60 * Math.sin(lt * 6 + k)) * grow);
            cvb.stroke();
            // hex cells (cream) on the outer orbit
            var rot3 = base + lt * 0.25;
            var hx = cx + Math.cos(rot3) * 640 * grow;
            var hy = cy + Math.sin(rot3) * 640 * grow;
            cvb.strokeStyle = "rgba(245,242,235,0.55)";
            cvb.lineWidth = 1.6;
            cvb.beginPath();
            for (var q = 0; q <= 6; q++) {
              var ang = (q / 6) * Math.PI * 2 + rot3;
              var hr = 30 * grow;
              if (q) cvb.lineTo(hx + Math.cos(ang) * hr, hy + Math.sin(ang) * hr);
              else cvb.moveTo(hx + Math.cos(ang) * hr, hy + Math.sin(ang) * hr);
            }
            cvb.stroke();
          }
          // orbiting rings of compiled tokens
          cvb.font = '400 22px "JetBrains Mono"';
          var tokens = ["spring()", "vec3 sol", "ring x line", "lattice(6)", "emit svg", "c 26", "k 170", "phi * t"];
          for (var ring = 0; ring < 2; ring++) {
            var rad = (ring ? 395 : 300) * grow;
            var dir = ring ? -1 : 1;
            for (var n = 0; n < 16; n++) {
              var ta = (n / 16) * Math.PI * 2 + dir * lt * (0.6 + ring * 0.3);
              cvb.save();
              cvb.translate(cx + Math.cos(ta) * rad, cy + Math.sin(ta) * rad);
              cvb.rotate(ta + Math.PI / 2);
              cvb.fillStyle = (n + ring) % 2 ? "rgba(0,240,255,0.75)" : "rgba(245,242,235,0.7)";
              cvb.fillText(tokens[(n + ring * 3) % tokens.length], -40, 0);
              cvb.restore();
            }
          }
          // the central image: amber line × cyan ring
          cvb.strokeStyle = "rgba(255,154,92,0.95)";
          cvb.lineWidth = 3;
          cvb.beginPath();
          cvb.moveTo(cx - 260 * grow, cy);
          cvb.lineTo(cx + 260 * grow, cy);
          cvb.stroke();
          cvb.strokeStyle = "rgba(0,240,255,0.95)";
          cvb.beginPath();
          cvb.ellipse(cx, cy, 150 * grow, 150 * grow * Math.abs(Math.cos(lt * 2.2)), 0, 0, Math.PI * 2);
          cvb.stroke();
          if (window.HFVfxSuite) {
            window.HFVfxSuite.drawAnamorphicFlare(cvb, { x: cx, y: cy, width: 1200 * grow, color: "rgba(255,190,140,0.7)" });
          }
          cvb.globalCompositeOperation = "source-over";
        }

        function render() {
          var t = state.t;
          if (t < 1.36) drawA(t);
          if (t >= 1.34) drawB(t);
        }


  window.GenesisPlate = { render: render, springEase: springEase, COMPILE: COMPILE, state: state };
})();
