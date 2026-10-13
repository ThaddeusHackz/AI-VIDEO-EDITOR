/**
 * HFCameraDoP — Higgsfield DoP (Director of Photography) Deterministic Camera Engine
 * for HyperFrames + GSAP timelines.
 *
 * All camera moves are registered directly onto a paused GSAP timeline (`tl`) so
 * seeking to any timestamp `t` produces deterministic, frame-exact camera transforms.
 */
(function (global) {
  "use strict";

  function apply(tl, target, opts) {
    if (!tl || !target) return tl;
    var preset = (opts && opts.preset) || "dolly-zoom";
    var start = (opts && typeof opts.start === "number") ? opts.start : 0;
    var duration = (opts && typeof opts.duration === "number") ? opts.duration : 2.0;
    var intensity = (opts && typeof opts.intensity === "number") ? opts.intensity : 1.0;
    var subject = opts && opts.subject;

    switch (preset) {
      case "dolly-zoom": {
        var scaleEnd = 1 + 0.42 * intensity;
        tl.fromTo(
          target,
          { scale: 1, transformOrigin: "50% 50%" },
          { scale: scaleEnd, duration: duration, ease: "sine.inOut", immediateRender: false },
          start
        );
        if (subject) {
          tl.fromTo(
            subject,
            { scale: 1, transformOrigin: "50% 50%" },
            { scale: 1 / (1 + 0.28 * intensity), duration: duration, ease: "sine.inOut", immediateRender: false },
            start
          );
        }
        break;
      }

      case "crash-zoom": {
        var zoomDur = Math.min(duration, 0.38);
        var targetScale = 1 + 1.15 * intensity;
        tl.fromTo(
          target,
          { scale: 1, filter: "blur(0px)", transformOrigin: "50% 50%" },
          { scale: targetScale, duration: zoomDur, ease: "expo.inOut", immediateRender: false },
          start
        );
        tl.to(
          target,
          { filter: "blur(" + (10 * intensity).toFixed(1) + "px)", duration: zoomDur * 0.45, ease: "power2.in" },
          start
        );
        tl.to(
          target,
          { filter: "blur(0px)", duration: zoomDur * 0.55, ease: "power3.out" },
          start + zoomDur * 0.45
        );
        break;
      }

      case "orbit-360": {
        tl.fromTo(
          target,
          { rotationY: -18 * intensity, rotationX: 8 * intensity, scale: 0.96, transformPerspective: 1200 },
          { rotationY: 18 * intensity, rotationX: -4 * intensity, scale: 1.04, transformPerspective: 1200, duration: duration, ease: "sine.inOut", immediateRender: false },
          start
        );
        break;
      }

      case "bullet-time": {
        var enterDur = duration * 0.22;
        var arcDur = duration * 0.56;
        var exitDur = duration * 0.22;
        tl.to(
          target,
          { scale: 1.18 * intensity, rotationZ: -3.5 * intensity, rotationY: 14 * intensity, transformPerspective: 1100, duration: enterDur, ease: "expo.out" },
          start
        );
        tl.to(
          target,
          { rotationY: -14 * intensity, rotationZ: 2.5 * intensity, scale: 1.22 * intensity, duration: arcDur, ease: "none" },
          start + enterDur
        );
        tl.to(
          target,
          { rotationY: 0, rotationZ: 0, scale: 1, duration: exitDur, ease: "expo.in" },
          start + enterDur + arcDur
        );
        break;
      }

      case "whip-pan": {
        var half = duration * 0.5;
        tl.to(
          target,
          { xPercent: -22 * intensity, filter: "blur(" + (16 * intensity).toFixed(0) + "px)", duration: half, ease: "power4.in" },
          start
        );
        tl.fromTo(
          target,
          { xPercent: 22 * intensity, filter: "blur(" + (16 * intensity).toFixed(0) + "px)" },
          { xPercent: 0, filter: "blur(0px)", duration: half, ease: "power4.out", immediateRender: false },
          start + half
        );
        break;
      }

      case "push-to-glass": {
        tl.fromTo(
          target,
          { scale: 1, filter: "blur(0px)", transformOrigin: "50% 48%" },
          { scale: 1 + 2.2 * intensity, filter: "blur(" + (8 * intensity).toFixed(1) + "px)", duration: duration, ease: "power3.in", immediateRender: false },
          start
        );
        break;
      }

      case "crane-up": {
        tl.fromTo(
          target,
          { y: 120 * intensity, rotationX: 12 * intensity, scale: 1.06, transformPerspective: 1200 },
          { y: 0, rotationX: 0, scale: 1, transformPerspective: 1200, duration: duration, ease: "power3.out", immediateRender: false },
          start
        );
        break;
      }

      case "rack-focus": {
        tl.fromTo(
          target,
          { filter: "blur(" + (14 * intensity).toFixed(1) + "px)", scale: 1.04 },
          { filter: "blur(0px)", scale: 1, duration: duration, ease: "power2.out", immediateRender: false },
          start
        );
        break;
      }

      case "fpv-drone": {
        tl.fromTo(
          target,
          { scale: 0.84, rotationZ: -10 * intensity, rotationX: 6 * intensity, transformPerspective: 1000 },
          { scale: 1.12, rotationZ: 4 * intensity, rotationX: -2 * intensity, transformPerspective: 1000, duration: duration, ease: "power2.inOut", immediateRender: false },
          start
        );
        break;
      }

      default:
        break;
    }
    return tl;
  }

  global.HFCameraDoP = { apply: apply };
})(typeof window !== "undefined" ? window : globalThis);
