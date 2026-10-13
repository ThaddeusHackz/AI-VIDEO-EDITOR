/**
 * HyperFrames + Higgsfield DoP & Cinema Studio 4.0 Camera Preset Engine (`window.HFCameraDoP`)
 * Deterministic GSAP camera choreography for HTML/CSS/Three.js/Canvas compositions.
 *
 * Usage:
 *   HFCameraDoP.apply(tl, "#camera-rig", {
 *     preset: "dolly-zoom",
 *     start: 0.4,
 *     duration: 2.2,
 *     intensity: 1.0
 *   });
 */
(function (global) {
  "use strict";

  var PRESETS = {
    "dolly-zoom": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { scale: 1, z: 0, transformPerspective: 900 },
        { scale: 1 + 0.38 * k, z: -180 * k, transformPerspective: 420, duration: d, ease: "power2.inOut", immediateRender: false },
        s
      );
    },
    "crash-zoom": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { scale: 1, rotation: 0 },
        { scale: 1 + 0.85 * k, rotation: -1.8 * k, duration: d, ease: "expo.out", immediateRender: false },
        s
      );
    },
    "orbit-360": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { rotationY: -18 * k, rotationX: 8 * k, z: -60 * k, transformPerspective: 1000 },
        { rotationY: 18 * k, rotationX: -6 * k, z: 40 * k, transformPerspective: 1000, duration: d, ease: "sine.inOut", immediateRender: false },
        s
      );
    },
    "bullet-time": function (tl, target, s, d, k) {
      var enter = d * 0.25;
      var hold = d * 0.5;
      var exit = d * 0.25;
      tl.to(target, { scale: 1 + 0.22 * k, rotationY: 14 * k, rotationZ: -2.5 * k, transformPerspective: 900, duration: enter, ease: "expo.out" }, s);
      tl.to(target, { rotationY: -14 * k, rotationZ: 2.5 * k, duration: hold, ease: "none" }, s + enter);
      tl.to(target, { scale: 1, rotationY: 0, rotationZ: 0, duration: exit, ease: "power4.in" }, s + enter + hold);
    },
    "whip-pan": function (tl, target, s, d, k) {
      tl.to(target, { xPercent: -18 * k, skewX: -8 * k, duration: d * 0.45, ease: "power4.in" }, s);
      tl.fromTo(
        target,
        { xPercent: 18 * k, skewX: 8 * k },
        { xPercent: 0, skewX: 0, duration: d * 0.55, ease: "power4.out", immediateRender: false },
        s + d * 0.45
      );
    },
    "push-to-glass": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { scale: 0.92, z: -120 * k, transformPerspective: 900 },
        { scale: 1 + 0.28 * k, z: 110 * k, transformPerspective: 900, duration: d, ease: "power3.inOut", immediateRender: false },
        s
      );
    },
    "crane-up": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { yPercent: 12 * k, rotationX: 10 * k, scale: 1.08, transformPerspective: 1000 },
        { yPercent: -6 * k, rotationX: -4 * k, scale: 1, transformPerspective: 1000, duration: d, ease: "power3.out", immediateRender: false },
        s
      );
    },
    "crane-down": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { yPercent: -12 * k, rotationX: -8 * k, scale: 0.94, transformPerspective: 1000 },
        { yPercent: 4 * k, rotationX: 4 * k, scale: 1.04, transformPerspective: 1000, duration: d, ease: "power3.out", immediateRender: false },
        s
      );
    },
    "rack-focus": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { filter: "blur(" + Math.round(14 * k) + "px)", scale: 1.05 },
        { filter: "blur(0px)", scale: 1, duration: d, ease: "power3.out", immediateRender: false },
        s
      );
    },
    "fpv-drone": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { scale: 0.85, rotationZ: -12 * k, rotationX: 14 * k, yPercent: 10 * k, transformPerspective: 800 },
        { scale: 1.15, rotationZ: 4 * k, rotationX: -4 * k, yPercent: -4 * k, transformPerspective: 800, duration: d, ease: "power2.inOut", immediateRender: false },
        s
      );
    },
    "robot-arm": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { xPercent: -10 * k, yPercent: 8 * k, rotationZ: -6 * k, scale: 0.9 },
        { xPercent: 0, yPercent: 0, rotationZ: 0, scale: 1.12, duration: d, ease: "expo.inOut", immediateRender: false },
        s
      );
    },
    "through-object-in": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { scale: 0.65, filter: "blur(" + Math.round(10 * k) + "px)" },
        { scale: 1.22, filter: "blur(0px)", duration: d, ease: "power3.inOut", immediateRender: false },
        s
      );
    },
    "lazy-susan": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { rotationY: 0, transformPerspective: 1100 },
        { rotationY: 360 * k, transformPerspective: 1100, duration: d, ease: "none", immediateRender: false },
        s
      );
    },
    "helicopter-shot": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { scale: 0.82, rotationX: 22 * k, rotationZ: -5 * k, transformPerspective: 1200 },
        { scale: 1.06, rotationX: 8 * k, rotationZ: 3 * k, transformPerspective: 1200, duration: d, ease: "sine.inOut", immediateRender: false },
        s
      );
    },
    "agamemnon-breakthrough": function (tl, target, s, d, k) {
      tl.fromTo(
        target,
        { scale: 0.78, z: -160 * k, transformPerspective: 850 },
        { scale: 1.24, z: 180 * k, transformPerspective: 850, duration: d, ease: "back.out(1.7)", immediateRender: false },
        s
      );
    }
  };

  function apply(tl, target, opts) {
    opts = opts || {};
    var preset = opts.preset || "orbit-360";
    var start = typeof opts.start === "number" ? opts.start : 0;
    var duration = typeof opts.duration === "number" ? opts.duration : 1.5;
    var intensity = typeof opts.intensity === "number" ? opts.intensity : 1.0;
    var fn = PRESETS[preset] || PRESETS["orbit-360"];
    fn(tl, target, start, duration, intensity);
    return tl;
  }

  global.HFCameraDoP = {
    apply: apply,
    presets: Object.keys(PRESETS)
  };
})(typeof window !== "undefined" ? window : globalThis);
