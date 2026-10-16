// shots-act3.js — Acts III–V of DAVID: THE CHRONICLES OF VALOR (70s → 180s).
// Appends to the same registry as shots.js so the director sees one continuous film.
//
//   70-78  chariot run + launch (slow-motion trajectory)
//   78-86  mid-air sling shot breaks an archer's bow · javelin dodge · landing
//   86-94  landing shockwave, three enemies thrown
//   94-100 hip throw, elbows, disarm and dagger steal
//   100-110 falling sword catch, dual blades, five elites, wall-run off the ruin
//   110-118 the storm breaks: rain, wet metal, mud
//   118-125 storm peak: lightning, splashes, sustained combat
//   125-140 over-the-shoulder champion duel with micro-dodges
//   140-155 slow parry, blade stress, under-guard rise, pauldron shatter
//   155-165 champion falls, camera rises from the mud, enemy rout
//   165-175 golden light, planted sword, epic Judean pullback
//   175-180 metallic title, fade to black
import { shot, SHOTS, exchange, ev } from './shots.js';

const PI = Math.PI;

// ---------------------------------------------------------------- 70-86 · chariot, sling

shot(70, 78, 'Chariot run — the long jump', {
  cam: [
    { t: 70.0, pos: [-6.90, 1.60, 5.40], look: [-8.2, 1.30, 1.4], fov: 46 },
    { t: 72.4, pos: [-3.20, 1.15, 7.60], look: [-8.4, 1.40, 1.0], fov: 42, roll: 1.5 },
    { t: 75.0, pos: [-7.60, 1.90, 9.20], look: [-9.2, 2.30, 0.4], fov: 40, roll: -1.2 },
    { t: 78.0, pos: [-8.40, 2.60, 10.40], look: [-9.0, 2.10, 0.0], fov: 44 },
  ],
  cast: {
    david: {
      pos: [-9.0, 0.0], yaw: -1.55,
      move: [[70, [-12.0, 2.6, -1.55]], [72.0, [-10.6, 1.9, -1.5]], [73.6, [-9.6, 1.4, -1.45]], [75.0, [-9.2, 1.2, -1.4]], [76.2, [-9.1, 1.0, -1.35]], [78.0, [-8.6, 0.6, -1.3]]],
    },
    trio3: { pos: [-6.6, 116 * 0 + 4.6], yaw: -1.2 },
  },
  cues: [
    { t: 70.0, actor: 'david', clip: 'Run_With_Sword', loop: true, timeScale: 1.25 },
    { t: 73.4, actor: 'david', clip: 'Jumping_Over_Into_Combat', loop: false, timeScale: 0.85, fade: 0.15, layer: 'base' },
    { t: 75.2, actor: 'david', clip: 'Falling_To_Roll', loop: false, timeScale: 0.6, fade: 0.1, layer: 'base' },
    { t: 77.0, actor: 'david', clip: 'jump_start', loop: false, timeScale: 0.8, fade: 0.15 },
  ],
  events: [
    ev(70.6, 'dust', [-12.0, 0.3, 2.6], { count: 24, power: 1.1 }),
    ev(72.2, 'dust', [-10.6, 0.25, 1.9], { count: 22, power: 1.0 }),
    ev(73.5, 'dust', [-9.7, 0.3, 1.4], { count: 34, power: 1.3, ring: true }),
    ev(75.1, 'dust', [-9.2, 1.9, 1.2], { count: 20, power: 0.9 }),
  ],
  note: 'David breaks from the formation, sprints and launches off the broken war chariot.',
  crowd: 1,
});

shot(78, 86, 'Sling, bowbreak, javelin — airborne', {
  cam: [
    { t: 78.0, pos: [-8.40, 2.60, 10.40], look: [-9.0, 2.10, 0.0], fov: 44 },
    { t: 80.0, pos: [-5.90, 2.20, 8.60], look: [-8.4, 2.60, -2.4], fov: 38, roll: 0.8 },
    { t: 82.4, pos: [-3.40, 2.05, 6.20], look: [-8.2, 2.45, -6.0], fov: 34, roll: -0.6 },
    { t: 86.0, pos: [-6.80, 1.30, 4.60], look: [-9.0, 1.10, -2.0], fov: 42, roll: 1.3 },
  ],
  cast: {
    david: {
      pos: [-9.0, 0.0], yaw: -1.35,
      move: [[78.0, [-8.6, 0.6, -1.3]], [79.6, [-7.4, -0.6, -1.25]], [81.6, [-6.6, -2.2, -1.2]], [84.0, [-7.0, -4.6, -1.15]], [86.0, [-8.2, -6.0, -1.1]]],
    },
    archer: { pos: [-9.4, -13.0], yaw: 1.4 },
    trio3: { pos: [-6.6, 4.6], yaw: -1.2, move: [[81.0, [-6.6, 4.6, -1.2]], [83.4, [-5.8, 3.0, -1.3]]] },
  },
  cues: [
    { t: 78.2, actor: 'david', clip: 'Aerial_Evade', loop: false, timeScale: 0.7, fade: 0.12 },
    { t: 79.4, actor: 'david', clip: 'Standing_Draw_Arrow', loop: false, timeScale: 0.75, fade: 0.1 },
    { t: 81.4, actor: 'david', clip: 'Throw_Object', loop: false, timeScale: 0.85, fade: 0.1 },
    { t: 84.2, actor: 'david', clip: 'Falling_To_Roll', loop: false, timeScale: 0.9, fade: 0.12 },
    { t: 79.0, actor: 'archer', clip: 'Standing_Draw_Arrow', loop: false, timeScale: 0.9, fade: 0.2 },
    { t: 81.6, actor: 'archer', clip: 'Standing_Block_React_Large', loop: false, timeScale: 1.3, fade: 0.06 },
    { t: 82.2, actor: 'archer', clip: 'Getting_Hit_Backwards', loop: false, timeScale: 1.1, fade: 0.08 },
    { t: 83.0, actor: 'trio3', clip: 'Throwing', loop: false, timeScale: 1.15, fade: 0.12 },
  ],
  events: [
    ev(79.8, 'slowmo', [0, 0, 0], { factor: 0.25, dur: 2.2 }),
    ev(81.6, 'bowBreak', [-9.4, 1.45, -13.0], { count: 40 }),
    ev(81.62, 'shake', [-9.4, 1.4, -13.0], { amp: 0.8 }),
    ev(82.4, 'javelin', [-6.7, 1.5, 3.2], { toward: [-6.6, 1.4, -2.0], speed: 26 }),
    ev(84.6, 'mud', [-8.4, 0.22, -5.6], { count: 44, power: 1.7 }),
    ev(84.62, 'shake', [-8.4, 0.7, -5.6], { amp: 1.1 }),
    ev(85.4, 'splash', [-8.2, 0.2, -6.0], { count: 24, power: 0.8 }),
  ],
  note: 'Slow-motion trajectory: sling chambered and released, the archer’s bow shatters, a javelin passes as he spins.',
  crowd: 1,
});

shot(86, 94, 'Landing shockwave — three thrown', {
  cam: [
    { t: 86.0, pos: [-6.80, 1.30, 4.60], look: [-9.0, 1.10, -2.0], fov: 42, roll: 1.3 },
    { t: 87.4, pos: [-5.40, 0.55, 1.80], look: [-8.6, 0.75, -1.0], fov: 48, roll: -1.5 },
    { t: 90.0, pos: [-11.60, 1.45, 1.20], look: [-8.2, 1.20, -1.6], fov: 44 },
    { t: 94.0, pos: [-7.40, 1.10, 2.60], look: [-8.6, 1.20, -1.4], fov: 46 },
  ],
  cast: {
    david: {
      pos: [-8.6, -1.0], yaw: -1.2,
      move: [[86.0, [-8.2, -6.0, -1.1]], [87.2, [-8.6, -3.4, -1.15]], [88.2, [-8.7, -1.8, -1.2]], [90.4, [-8.5, -1.2, -1.25]], [94, [-8.6, -1.6, -1.3]]],
    },
    trio1: { pos: [-6.8, 1.6], yaw: -1.6, move: [[87.6, [-6.8, 1.6, -1.6]], [89.2, [-6.0, 3.8, -1.2]], [91.4, [-5.6, 6.2, -0.9]]] },
    trio2: { pos: [-10.4, 0.8], yaw: -1.0, move: [[87.8, [-10.4, 0.8, -1.0]], [89.4, [-11.2, 2.6, -0.7]], [91.6, [-11.6, 5.0, -0.5]]] },
    trio3: { pos: [-8.9, 2.2], yaw: -1.3, move: [[88.0, [-8.9, 2.2, -1.3]], [89.6, [-8.4, 4.2, -1.0]], [92.0, [-8.2, 6.8, -0.8]]] },
  },
  cues: [
    { t: 86.2, actor: 'david', clip: 'jump_land', loop: false, timeScale: 0.95, fade: 0.1 },
    { t: 87.0, actor: 'david', clip: 'Body_Block', loop: false, timeScale: 1.15, fade: 0.12 },
    { t: 88.4, actor: 'trio1', clip: 'Getting_Hit_Backwards', loop: false, timeScale: 1.0, fade: 0.08 },
    { t: 88.5, actor: 'trio2', clip: 'Flying_Back_Death', loop: false, timeScale: 0.9, fade: 0.08 },
    { t: 88.6, actor: 'trio3', clip: 'Getting_Hit_Backwards', loop: false, timeScale: 1.05, fade: 0.08 },
    { t: 90.6, actor: 'david', clip: 'Sword_And_Shield_Idle', loop: true, timeScale: 1.05, fade: 0.3 },
  ],
  events: [
    ev(87.15, 'shockwave', [-8.6, 0.18, -1.8], { radius: 7.5, power: 1.6 }),
    ev(87.2, 'mud', [-8.6, 0.2, -1.8], { count: 90, power: 2.2 }),
    ev(87.2, 'dust', [-8.6, 0.3, -1.8], { count: 70, power: 1.8, ring: true }),
    ev(87.22, 'shake', [-8.6, 0.9, -1.8], { amp: 1.6 }),
    ev(88.5, 'dust', [-6.4, 0.4, 2.6], { count: 30, power: 1.1 }),
    ev(88.6, 'blood', [-8.8, 1.3, 2.4], { count: 22 }),
    ev(91.0, 'splash', [-8.5, 0.2, -1.4], { count: 26, power: 0.8 }),
  ],
  note: 'Ground-pound landing: dirt displaced, three attackers thrown clear.',
  crowd: 1,
});

shot(94, 100, 'Grapple: hip throw, elbow, dagger steal', {
  cam: [
    { t: 94.0, pos: [-7.40, 1.10, 2.60], look: [-8.6, 1.20, -1.4], fov: 46 },
    { t: 96.0, pos: [-9.40, 1.25, 1.60], look: [-8.4, 1.15, -0.6], fov: 40, roll: -0.9 },
    { t: 98.0, pos: [-6.60, 0.85, -0.40], look: [-8.6, 1.05, -1.0], fov: 44, roll: 1.0 },
    { t: 100.0, pos: [-8.60, 1.35, -3.40], look: [-8.4, 1.25, -0.8], fov: 42 },
  ],
  cast: {
    david: {
      pos: [-8.6, -1.6], yaw: -1.3,
      move: [[94.0, [-8.6, -1.6, -1.3]], [95.4, [-8.9, -0.6, -1.5]], [96.4, [-8.6, -0.9, -1.9]], [97.6, [-9.1, -1.6, -1.0]], [98.8, [-8.8, -1.4, -1.4]], [100.0, [-8.4, 0.4, -0.6]]],
    },
    elite1: { pos: [-7.4, -1.2], yaw: -1.9, move: [[94.0, [-7.4, -1.2, -1.9]], [95.2, [-8.2, -0.8, -2.1]], [96.2, [-8.9, -0.2, -2.4]], [97.4, [-9.4, -1.2, -2.2]], [98.8, [-8.4, -2.0, -2.6]], [100, [-7.6, -1.4, -2.2]]] },
    elite2: { pos: [-10.2, -0.4], yaw: -1.1 },
    elite3: { pos: [-9.0, 1.2], yaw: -1.4 },
  },
  cues: [
    { t: 94.2, actor: 'elite1', clip: 'sword_attack', loop: false, timeScale: 1.35, fade: 0.12 },
    { t: 94.8, actor: 'david', clip: 'Body_Block', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 95.4, actor: 'david', clip: 'Double_Leg_Takedown_-_Attacker', loop: false, timeScale: 1.25, fade: 0.1 },
    { t: 95.9, actor: 'elite1', clip: 'Double_Leg_Takedown_-_Victim', loop: false, timeScale: 1.2, fade: 0.08 },
    { t: 96.6, actor: 'david', clip: 'punch_cross', loop: false, timeScale: 1.35, fade: 0.08 },
    { t: 97.2, actor: 'elite1', clip: 'hit_head', loop: false, timeScale: 1.2, fade: 0.06 },
    { t: 97.8, actor: 'david', clip: 'Double_Dagger_Stab', loop: false, timeScale: 1.3, fade: 0.1 },
    { t: 98.3, actor: 'elite2', clip: 'Double_Leg_Takedown_-_Victim', loop: false, timeScale: 1.15, fade: 0.1 },
    { t: 99.0, actor: 'david', clip: 'Catwalk_Walk_Turn_180_Tight_L', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 99.5, actor: 'david', clip: 'Idle', loop: true, timeScale: 1.2, fade: 0.25 },
  ],
  events: [
    ev(94.9, 'sparks', [-8.2, 1.30, -0.8], { count: 26, power: 1.1 }),
    ev(96.0, 'dust', [-8.9, 0.35, -0.4], { count: 40, power: 1.3, ring: true }),
    ev(96.05, 'shake', [-8.9, 0.8, -0.4], { amp: 1.0 }),
    ev(96.7, 'blood', [-8.6, 1.45, -0.6], { count: 20 }),
    ev(97.85, 'sparks', [-9.2, 1.20, -1.4], { count: 20, power: 0.9 }),
    ev(98.35, 'dust', [-10.0, 0.3, -0.6], { count: 26, power: 1.0 }),
    ev(99.2, 'splash', [-8.7, 0.2, -1.0], { count: 22, power: 0.7 }),
  ],
  note: 'Judo hip throw, elbow to the breastplate, disarm and a mid-air dagger steal, spinning clear.',
  crowd: 1,
});

// ---------------------------------------------------------------- 100-110 · dual blades

shot(100, 104, 'Catch the falling sword — dual blades', {
  cam: [
    { t: 100.0, pos: [-8.60, 1.35, -3.40], look: [-8.4, 1.25, -0.8], fov: 42 },
    { t: 101.4, pos: [-9.80, 0.85, -3.00], look: [-8.2, 1.05, -0.4], fov: 38, roll: 1.2 },
    { t: 102.6, pos: [-6.40, 2.20, -0.20], look: [-8.4, 1.20, -0.8], fov: 44, roll: -1.4 },
    { t: 104.0, pos: [-8.20, 1.05, -4.20], look: [-8.5, 1.15, -0.6], fov: 46 },
  ],
  cast: {
    david: { pos: [-8.4, 0.4], yaw: -0.6, move: [[100, [-8.4, 0.4, -0.6]], [101.6, [-8.7, -0.4, -0.9]], [103.0, [-8.3, -0.2, -0.3]], [104, [-8.6, -0.8, -0.7]]] },
    elite1: { pos: [-7.6, -1.4], yaw: -2.2, move: [[101.0, [-7.6, -1.4, -2.2]], [102.6, [-8.4, -1.0, -2.6]], [104, [-9.2, -1.6, -2.8]]] },
    elite2: { pos: [-10.2, -1.0], yaw: -1.2, move: [[101.6, [-10.2, -1.0, -1.2]], [103.2, [-9.6, -1.4, -1.6]], [104, [-9.0, -2.0, -1.9]]] },
    elite4: { pos: [-8.2, -3.6], yaw: -0.2, move: [[102.2, [-8.2, -3.6, -0.2]], [104, [-8.6, -2.6, -0.5]]] },
  },
  cues: [
    { t: 100.2, actor: 'david', clip: 'Draw_Sword_2', loop: false, timeScale: 1.35, fade: 0.1 },
    { t: 100.9, actor: 'david', clip: 'sword_attack', loop: false, timeScale: 1.4, fade: 0.1 },
    { t: 101.4, actor: 'elite1', clip: 'sword_block', loop: false, timeScale: 1.3, fade: 0.1 },
    { t: 102.0, actor: 'david', clip: 'Two_Hand_Sword_Combo', loop: false, timeScale: 1.45, fade: 0.1 },
    { t: 102.6, actor: 'elite2', clip: 'Standing_Block_React_Large', loop: false, timeScale: 1.2, fade: 0.06 },
    { t: 103.2, actor: 'david', clip: 'Stable_Sword_Outward_Slash', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 103.5, actor: 'elite4', clip: 'hit_head', loop: false, timeScale: 1.15, fade: 0.06 },
  ],
  events: [
    ev(100.4, 'sparks', [-8.5, 1.45, 0.0], { count: 22, power: 0.9 }),
    ev(101.1, 'sparks', [-8.3, 1.25, -0.9], { count: 34, power: 1.3 }),
    ev(101.15, 'shake', [-8.3, 1.2, -0.9], { amp: 1.0 }),
    ev(102.1, 'sparks', [-8.6, 1.35, -1.2], { count: 40, power: 1.5 }),
    ev(102.65, 'sparks', [-9.4, 1.20, -1.6], { count: 30, power: 1.2 }),
    ev(103.3, 'sparks', [-8.8, 1.40, -2.2], { count: 46, power: 1.6 }),
    ev(103.55, 'blood', [-8.4, 1.45, -2.6], { count: 22 }),
  ],
  note: 'The blade is caught in the air; fluid dual-blade stance takes over.',
  crowd: 1,
});

shot(104, 110, 'Five elites — wall-run off the ruin', {
  cam: [
    { t: 104.0, pos: [-8.20, 1.05, -4.20], look: [-8.5, 1.15, -0.6], fov: 46 },
    { t: 106.0, pos: [-5.20, 1.35, -6.40], look: [-8.2, 1.20, -3.6], fov: 42, roll: 1.6 },
    { t: 108.0, pos: [-11.60, 1.85, -6.20], look: [-8.4, 1.45, -4.2], fov: 38, roll: -1.2 },
    { t: 110.0, pos: [-8.60, 2.30, -8.60], look: [-8.8, 1.30, -3.4], fov: 44 },
  ],
  cast: {
    david: { pos: [-8.6, -0.8], yaw: -1.4, move: [[104, [-8.6, -0.8, -1.4]], [105.6, [-8.2, -3.0, -1.2]], [106.6, [-9.0, -4.4, -0.9]], [107.6, [-8.4, -5.6, -1.1]], [109.0, [-8.8, -6.0, -1.3]], [110, [-8.6, -5.2, -1.2]]] },
    elite1: { pos: [-7.0, -2.6], yaw: -2.4, move: [[105.0, [-7.0, -2.6, -2.4]], [106.8, [-8.0, -3.6, -2.7]], [108.4, [-9.4, -4.6, -2.5]], [110, [-8.0, -6.0, -2.2]]] },
    elite2: { pos: [-10.4, -3.0], yaw: -1.0, move: [[105.4, [-10.4, -3.0, -1.0]], [107.2, [-9.6, -4.0, -1.3]], [109, [-8.6, -5.2, -1.5]], [110, [-9.6, -6.4, -1.2]]] },
    elite3: { pos: [-8.8, -6.2], yaw: -0.2, move: [[106.0, [-8.8, -6.2, -0.2]], [108.0, [-8.4, -5.2, -0.5]], [110, [-9.0, -6.6, -0.4]]] },
    elite4: { pos: [-7.2, -5.0], yaw: -1.2, move: [[106.4, [-7.2, -5.0, -1.2]], [108.6, [-8.2, -5.8, -1.5]], [110, [-7.4, -6.8, -1.3]]] },
    elite5: { pos: [-10.0, -6.8], yaw: -0.6, move: [[107.0, [-10.0, -6.8, -0.6]], [109.0, [-9.4, -5.8, -0.9]], [110, [-10.4, -7.2, -0.8]]] },
  },
  cues: [
    { t: 104.4, actor: 'david', clip: 'sword_attack', loop: false, timeScale: 1.5, fade: 0.12 },
    { t: 105.4, actor: 'david', clip: 'roll', loop: false, timeScale: 1.3, fade: 0.1 },
    { t: 106.0, actor: 'elite3', clip: 'sword_block', loop: false, timeScale: 1.25, fade: 0.1 },
    { t: 106.6, actor: 'david', clip: 'Stable_Sword_Inward_Slash', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 107.0, actor: 'elite3', clip: 'hit_chest', loop: false, timeScale: 1.2, fade: 0.06 },
    { t: 107.6, actor: 'david', clip: 'Two_Hand_Sword_Combo', loop: false, timeScale: 1.45, fade: 0.1 },
    { t: 108.2, actor: 'elite4', clip: 'Getting_Hit_Backwards', loop: false, timeScale: 1.15, fade: 0.06 },
    { t: 108.8, actor: 'david', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 109.4, actor: 'elite5', clip: 'Standing_Block_React_Large', loop: false, timeScale: 1.2, fade: 0.06 },
  ],
  events: [
    ev(104.6, 'sparks', [-8.4, 1.30, -1.6], { count: 32, power: 1.2 }),
    ev(105.6, 'dust', [-8.6, 1.20, -3.4], { count: 20, power: 0.8 }),
    ev(106.7, 'sparks', [-8.9, 1.25, -4.6], { count: 40, power: 1.5 }),
    ev(106.75, 'shake', [-8.9, 1.2, -4.6], { amp: 1.1 }),
    ev(107.05, 'blood', [-8.9, 1.30, -4.8], { count: 22 }),
    ev(107.7, 'sparks', [-8.5, 1.35, -5.4], { count: 36, power: 1.4 }),
    ev(108.25, 'blood', [-8.3, 1.40, -5.6], { count: 20 }),
    ev(108.9, 'sparks', [-8.7, 1.45, -6.0], { count: 48, power: 1.7 }),
    ev(108.95, 'shake', [-8.7, 1.4, -6.0], { amp: 1.3 }),
  ],
  note: 'Wall-run off the ruin wall, weaving under heavy axes, lightning-fast vertical slashes.',
  crowd: 1,
});

// ---------------------------------------------------------------- 110-125 · the storm

shot(110, 118, 'The storm breaks', {
  cam: [
    { t: 110.0, pos: [-8.60, 2.30, -8.60], look: [-8.8, 1.30, -3.4], fov: 44 },
    { t: 112.4, pos: [-7.40, 3.40, -12.60], look: [-8.6, 1.20, -5.0], fov: 40, roll: -1.1 },
    { t: 115.0, pos: [-11.20, 1.20, -9.60], look: [-8.4, 1.15, -5.6], fov: 46, roll: 1.4 },
    { t: 118.0, pos: [-8.80, 0.90, -10.40], look: [-8.6, 1.10, -5.2], fov: 48 },
  ],
  cast: {
    david: { pos: [-8.6, -5.2], yaw: -1.0, move: [[110, [-8.6, -5.2, -1.0]], [112.0, [-8.4, -4.4, -0.7]], [114.4, [-8.8, -5.6, -1.1]], [117.0, [-8.5, -4.8, -0.9]], [118, [-8.7, -5.4, -1.0]]] },
    elite1: { pos: [-9.8, -7.6], yaw: -0.4, move: [[111.0, [-9.8, -7.6, -0.4]], [113.4, [-9.2, -6.2, -0.7]], [116.0, [-9.8, -7.2, -0.5]]] },
    elite2: { pos: [-7.4, -7.2], yaw: -1.6, move: [[112.0, [-7.4, -7.2, -1.6]], [114.6, [-8.2, -6.4, -1.8]], [117.4, [-7.6, -7.4, -1.7]]] },
    trio1: { pos: [-10.6, -4.2], yaw: 0.3 },
  },
  cues: [
    { t: 110.2, actor: 'david', clip: 'Great_Sword_Idle', loop: true, timeScale: 1.0, fade: 0.3 },
    { t: 111.4, actor: 'elite1', clip: 'sword_attack', loop: false, timeScale: 1.3, fade: 0.15 },
    { t: 112.2, actor: 'david', clip: 'Center_Block', loop: false, timeScale: 1.35, fade: 0.1 },
    { t: 112.8, actor: 'david', clip: 'Stable_Sword_Outward_Slash', loop: false, timeScale: 1.4, fade: 0.1 },
    { t: 113.4, actor: 'elite1', clip: 'hit_chest', loop: false, timeScale: 1.15, fade: 0.06 },
    { t: 114.4, actor: 'elite2', clip: 'Great_Sword_Attack', loop: false, timeScale: 1.2, fade: 0.12 },
    { t: 115.2, actor: 'david', clip: 'Standing_Dodge_Left', loop: false, timeScale: 1.45, fade: 0.1 },
    { t: 115.8, actor: 'david', clip: 'sword_attack', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 116.4, actor: 'elite2', clip: 'hit_chest', loop: false, timeScale: 1.2, fade: 0.06 },
    { t: 117.4, actor: 'david', clip: 'Idle', loop: true, timeScale: 1.15, fade: 0.3 },
  ],
  events: [
    ev(110.6, 'rainStart', [0, 0, 0], { ramp: 6.0 }),
    ev(111.5, 'sparks', [-9.2, 1.30, -6.2], { count: 30, power: 1.2 }),
    ev(112.3, 'sparks', [-8.6, 1.35, -5.4], { count: 34, power: 1.3 }),
    ev(112.85, 'sparks', [-9.4, 1.25, -6.6], { count: 42, power: 1.5 }),
    ev(113.45, 'blood', [-9.4, 1.30, -6.8], { count: 22 }),
    ev(115.3, 'splash', [-8.4, 0.2, -5.0], { count: 30, power: 1.0 }),
    ev(116.5, 'blood', [-8.2, 1.35, -7.0], { count: 20 }),
    ev(117.2, 'lightning', [40, 60, -60], {}),
    ev(117.25, 'shake', [0, 1.0, -5.0], { amp: 0.6 }),
  ],
  note: 'Weather turns: rain sheets across hot steel, mud deforms under the boots, lightning cracks the sky.',
  crowd: 1,
});

shot(118, 125, 'Storm combat — steel and water', {
  cam: [
    { t: 118.0, pos: [-8.80, 0.90, -10.40], look: [-8.6, 1.10, -5.2], fov: 48 },
    { t: 120.0, pos: [-6.20, 1.15, -9.20], look: [-8.4, 1.20, -5.6], fov: 44, roll: 1.5 },
    { t: 122.4, pos: [-10.40, 1.65, -8.00], look: [-8.6, 1.25, -5.4], fov: 40, roll: -1.3 },
    { t: 125.0, pos: [-8.60, 1.40, -8.20], look: [-8.6, 1.20, -4.6], fov: 42 },
  ],
  cast: {
    david: { pos: [-8.7, -5.4], yaw: -1.0, move: [[118, [-8.7, -5.4, -1.0]], [120.0, [-8.4, -4.6, -0.6]], [122.0, [-8.9, -5.8, -1.2]], [125, [-8.5, -4.8, -0.8]]] },
    elite1: { pos: [-9.8, -7.4], yaw: -0.5, move: [[118.4, [-9.8, -7.4, -0.5]], [120.6, [-9.0, -6.2, -0.9]], [123.0, [-9.9, -7.0, -0.6]], [125, [-9.2, -6.4, -0.8]]] },
    elite2: { pos: [-7.6, -7.4], yaw: -1.7, move: [[118.6, [-7.6, -7.4, -1.7]], [120.8, [-8.4, -6.6, -1.9]], [123.2, [-7.8, -7.6, -1.8]], [125, [-8.2, -6.8, -1.6]]] },
    elite3: { pos: [-10.8, -5.0], yaw: 0.2, move: [[119.4, [-10.8, -5.0, 0.2]], [121.6, [-9.8, -5.6, -0.1]], [124.0, [-10.6, -5.2, 0.1]]] },
  },
  cues: [
    { t: 118.4, actor: 'david', clip: 'Two_Hand_Sword_Combo', loop: false, timeScale: 1.5, fade: 0.12 },
    { t: 119.2, actor: 'elite1', clip: 'sword_block', loop: false, timeScale: 1.3, fade: 0.1 },
    { t: 119.8, actor: 'david', clip: 'Stable_Sword_Inward_Slash', loop: false, timeScale: 1.45, fade: 0.1 },
    { t: 120.4, actor: 'elite1', clip: 'hit_chest', loop: false, timeScale: 1.15, fade: 0.06 },
    { t: 121.0, actor: 'elite2', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.25, fade: 0.12 },
    { t: 121.8, actor: 'david', clip: 'Aerial_Evade', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 122.4, actor: 'david', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.45, fade: 0.1 },
    { t: 123.0, actor: 'elite2', clip: 'Big_Side_Hit', loop: false, timeScale: 1.15, fade: 0.06 },
    { t: 123.6, actor: 'david', clip: 'Running_Jump', loop: false, timeScale: 1.4, fade: 0.1 },
    { t: 124.2, actor: 'elite3', clip: 'Hit_To_Body', loop: false, timeScale: 1.1, fade: 0.06 },
    { t: 124.6, actor: 'david', clip: 'Idle', loop: true, timeScale: 1.25, fade: 0.25 },
  ],
  events: [
    ev(118.5, 'splash', [-8.6, 0.9, -5.6], { count: 26, power: 0.9 }),
    ev(119.3, 'sparks', [-9.2, 1.30, -6.6], { count: 34, power: 1.3 }),
    ev(119.9, 'sparks', [-8.8, 1.35, -5.8], { count: 44, power: 1.6 }),
    ev(119.95, 'shake', [-8.8, 1.3, -5.8], { amp: 1.2 }),
    ev(120.45, 'blood', [-9.4, 1.25, -6.4], { count: 22 }),
    ev(121.9, 'splash', [-8.4, 0.4, -5.2], { count: 34, power: 1.2 }),
    ev(122.5, 'sparks', [-8.6, 1.45, -6.0], { count: 50, power: 1.8 }),
    ev(123.05, 'blood', [-8.0, 1.30, -6.6], { count: 24 }),
    ev(123.4, 'lightning', [40, 60, -60], {}),
    ev(123.45, 'shake', [0, 1.0, -5.0], { amp: 0.7 }),
    ev(123.7, 'splash', [-8.6, 0.5, -6.2], { count: 30, power: 1.1 }),
    ev(124.3, 'blood', [-10.6, 1.25, -5.4], { count: 20 }),
  ],
  note: 'Sustained storm combat: sparks, water splashes off the blades, mud underfoot.',
  crowd: 1,
});

// ---------------------------------------------------------------- 125-140 · champion duel

shot(125, 133, 'The champion — over the shoulder', {
  cam: [
    { t: 125.0, pos: [-8.60, 1.40, -8.20], look: [-8.6, 1.20, -4.6], fov: 42 },
    { t: 127.0, pos: [-8.05, 1.52, -7.10], look: [-8.7, 1.35, -5.0], fov: 38, roll: 0.7 },
    { t: 130.0, pos: [-8.30, 1.48, -7.40], look: [-8.6, 1.30, -4.8], fov: 40, roll: -0.5 },
    { t: 133.0, pos: [-7.90, 1.55, -7.00], look: [-8.6, 1.32, -4.9], fov: 38 },
  ],
  cast: {
    david: { pos: [-8.6, -5.2], yaw: -1.35, move: [[125, [-8.6, -5.2, -1.35]], [127.4, [-8.3, -5.0, -1.3]], [130.0, [-8.7, -5.3, -1.4]], [133, [-8.5, -5.1, -1.35]]] },
    champion: { pos: [-8.7, -2.6], yaw: 1.8, move: [[125, [-8.7, -2.6, 1.8]], [127.2, [-8.6, -2.9, 1.8]], [130.0, [-8.8, -2.7, 1.8]], [133, [-8.6, -3.0, 1.8]]] },
  },
  cues: [
    { t: 125.2, actor: 'champion', clip: 'Great_Sword_Walk', loop: true, timeScale: 1.0, fade: 0.25 },
    { t: 126.4, actor: 'champion', clip: 'Great_Sword_Attack', loop: false, timeScale: 1.15, fade: 0.15 },
    { t: 126.9, actor: 'david', clip: 'Standing_Dodge_Left', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 127.8, actor: 'champion', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.2, fade: 0.12 },
    { t: 128.3, actor: 'david', clip: 'Standing_Dodge_Forward', loop: false, timeScale: 1.55, fade: 0.1 },
    { t: 129.2, actor: 'champion', clip: 'Great_Sword_Attack', loop: false, timeScale: 1.25, fade: 0.12 },
    { t: 129.7, actor: 'david', clip: 'Inverted_Double_Kick_To_Kip_Up', loop: false, timeScale: 1.4, fade: 0.1 },
    { t: 130.6, actor: 'champion', clip: 'Great_Sword_Kick', loop: false, timeScale: 1.2, fade: 0.1 },
    { t: 131.2, actor: 'david', clip: 'Center_Block', loop: false, timeScale: 1.45, fade: 0.08 },
    { t: 132.0, actor: 'champion', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.3, fade: 0.1 },
    { t: 132.5, actor: 'david', clip: 'Standing_Dodge_Left', loop: false, timeScale: 1.6, fade: 0.1 },
  ],
  events: [
    ev(126.5, 'sparks', [-8.6, 1.35, -4.4], { count: 40, power: 1.5 }),
    ev(126.55, 'shake', [-8.6, 1.3, -4.4], { amp: 1.2 }),
    ev(127.9, 'sparks', [-8.5, 1.50, -4.6], { count: 46, power: 1.7 }),
    ev(128.5, 'splash', [-8.4, 0.4, -5.0], { count: 34, power: 1.2 }),
    ev(129.3, 'sparks', [-8.7, 1.30, -4.8], { count: 36, power: 1.4 }),
    ev(129.8, 'dust', [-8.4, 0.6, -5.2], { count: 26, power: 1.0 }),
    ev(130.7, 'sparks', [-8.6, 1.20, -5.0], { count: 30, power: 1.2 }),
    ev(132.1, 'sparks', [-8.5, 1.45, -4.7], { count: 50, power: 1.8 }),
    ev(132.15, 'shake', [-8.5, 1.4, -4.7], { amp: 1.3 }),
  ],
  note: 'Tight over-the-shoulder frame: relentless heavy barrage, micro-dodges, no wasted motion.',
  crowd: 1,
});

shot(133, 140, 'Micro-dodges — the barrage continues', {
  cam: [
    { t: 133.0, pos: [-7.90, 1.55, -7.00], look: [-8.6, 1.32, -4.9], fov: 38 },
    { t: 135.4, pos: [-9.30, 0.95, -6.20], look: [-8.5, 1.25, -4.6], fov: 44, roll: 1.3 },
    { t: 137.6, pos: [-7.60, 2.05, -6.60], look: [-8.7, 1.35, -4.8], fov: 36, roll: -1.0 },
    { t: 140.0, pos: [-8.20, 1.50, -6.80], look: [-8.6, 1.30, -4.7], fov: 40 },
  ],
  cast: {
    david: { pos: [-8.5, -5.1], yaw: -1.35, move: [[133, [-8.5, -5.1, -1.35]], [135.0, [-8.2, -5.4, -1.2]], [137.0, [-8.8, -4.9, -1.5]], [140, [-8.5, -5.2, -1.3]]] },
    champion: { pos: [-8.6, -3.0], yaw: 1.8, move: [[133, [-8.6, -3.0, 1.8]], [135.2, [-8.7, -2.8, 1.85]], [137.4, [-8.5, -3.1, 1.75]], [140, [-8.7, -2.9, 1.8]]] },
  },
  cues: [
    { t: 133.2, actor: 'champion', clip: 'Great_Sword_Attack', loop: false, timeScale: 1.35, fade: 0.12 },
    { t: 133.7, actor: 'david', clip: 'Standing_Dodge_Forward', loop: false, timeScale: 1.6, fade: 0.08 },
    { t: 134.4, actor: 'champion', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.3, fade: 0.1 },
    { t: 134.9, actor: 'david', clip: 'Standing_Dodge_Left', loop: false, timeScale: 1.7, fade: 0.08 },
    { t: 135.6, actor: 'champion', clip: 'Great_Sword_Attack', loop: false, timeScale: 1.4, fade: 0.1 },
    { t: 136.1, actor: 'david', clip: 'Aerial_Evade', loop: false, timeScale: 1.6, fade: 0.08 },
    { t: 136.9, actor: 'champion', clip: 'Great_Sword_Kick', loop: false, timeScale: 1.35, fade: 0.1 },
    { t: 137.4, actor: 'david', clip: 'sword_block', loop: false, timeScale: 1.6, fade: 0.08 },
    { t: 138.2, actor: 'champion', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.35, fade: 0.1 },
    { t: 138.7, actor: 'david', clip: 'Standing_Dodge_Left', loop: false, timeScale: 1.65, fade: 0.08 },
    { t: 139.4, actor: 'david', clip: 'Idle', loop: true, timeScale: 1.2, fade: 0.2 },
  ],
  events: [
    ev(133.3, 'sparks', [-8.6, 1.35, -4.6], { count: 40, power: 1.5 }),
    ev(134.5, 'sparks', [-8.5, 1.50, -4.8], { count: 44, power: 1.6 }),
    ev(135.7, 'sparks', [-8.6, 1.30, -4.5], { count: 38, power: 1.4 }),
    ev(136.15, 'splash', [-8.3, 0.45, -5.3], { count: 30, power: 1.1 }),
    ev(137.0, 'sparks', [-8.6, 1.25, -5.1], { count: 32, power: 1.3 }),
    ev(137.5, 'sparks', [-8.5, 1.40, -4.7], { count: 36, power: 1.4 }),
    ev(138.3, 'sparks', [-8.6, 1.45, -4.6], { count: 52, power: 1.8 }),
    ev(138.35, 'shake', [-8.6, 1.4, -4.6], { amp: 1.3 }),
    ev(138.4, 'lightning', [40, 60, -60], {}),
  ],
  note: 'Every strike answered with the smallest possible movement; the storm rages around them.',
  crowd: 1,
});

// ---------------------------------------------------------------- 140-155 · climax exchange

shot(140, 148, 'The slow parry — stress in the steel', {
  cam: [
    { t: 140.0, pos: [-8.20, 1.50, -6.80], look: [-8.6, 1.30, -4.7], fov: 40 },
    { t: 142.0, pos: [-8.45, 1.42, -6.35], look: [-8.6, 1.28, -4.75], fov: 34, roll: 0.4 },
    { t: 144.0, pos: [-8.60, 1.30, -6.00], look: [-8.6, 1.22, -4.80], fov: 30, roll: -0.4 },
    { t: 148.0, pos: [-8.30, 1.36, -6.30], look: [-8.6, 1.24, -4.72], fov: 36 },
  ],
  cast: {
    david: { pos: [-8.5, -5.2], yaw: -1.35, move: [[140, [-8.5, -5.2, -1.35]], [143.6, [-8.55, -5.25, -1.32]], [148, [-8.4, -5.1, -1.4]]] },
    champion: { pos: [-8.65, -4.4], yaw: 1.8, move: [[140, [-8.65, -4.4, 1.8]], [143.4, [-8.6, -4.35, 1.82]], [148, [-8.7, -4.5, 1.8]]] },
  },
  cues: [
    { t: 140.2, actor: 'champion', clip: 'Great_Sword_Attack', loop: false, timeScale: 0.55, fade: 0.15 },
    { t: 142.0, actor: 'david', clip: 'Sword_And_Shield_Crouch_Block', loop: false, timeScale: 0.6, fade: 0.1 },
    { t: 144.6, actor: 'david', clip: 'Blocking', loop: false, timeScale: 0.65, fade: 0.1 },
    { t: 146.4, actor: 'david', clip: 'Stable_Sword_Inward_Slash', loop: false, timeScale: 0.85, fade: 0.12 },
    { t: 147.4, actor: 'david', clip: 'Idle', loop: true, timeScale: 1.0, fade: 0.25 },
  ],
  events: [
    ev(141.6, 'slowmo', [0, 0, 0], { factor: 0.32, dur: 4.4 }),
    ev(143.4, 'bladeStress', [-8.55, 1.30, -4.80], { dur: 2.6 }),
    ev(144.4, 'rainDroplets', [-8.55, 1.35, -4.80], { count: 60, dur: 2.0 }),
    ev(146.4, 'sparks', [-8.55, 1.28, -4.9], { count: 24, power: 0.9 }),
    ev(147.0, 'sparks', [-8.4, 1.32, -4.7], { count: 30, power: 1.1 }),
  ],
  note: 'Speed ramp down: rain droplets bounce off the stressed blade as the guard holds.',
  crowd: 1,
});

shot(148, 155, 'Under the guard — pauldron shatter', {
  cam: [
    { t: 148.0, pos: [-8.30, 1.36, -6.30], look: [-8.6, 1.24, -4.72], fov: 36 },
    { t: 150.0, pos: [-8.10, 1.10, -6.90], look: [-8.6, 1.15, -4.60], fov: 42 },
    { t: 152.0, pos: [-8.60, 1.85, -6.40], look: [-8.6, 1.45, -4.80], fov: 38, roll: 1.2 },
    { t: 155.0, pos: [-8.30, 1.45, -7.20], look: [-8.6, 1.25, -4.90], fov: 44 },
  ],
  cast: {
    david: { pos: [-8.4, -5.1], yaw: -1.4, move: [[148, [-8.4, -5.1, -1.4]], [150.0, [-8.5, -4.6, -1.2]], [151.2, [-8.4, -4.2, -1.05]], [155, [-8.5, -4.6, -1.1]]] },
    champion: { pos: [-8.7, -4.5], yaw: 1.8, move: [[148, [-8.7, -4.5, 1.8]], [150.4, [-8.6, -4.4, 1.85]], [151.4, [-8.7, -3.6, 2.1]], [153.0, [-8.9, -2.8, 2.4]], [155, [-9.0, -2.4, 2.5]]] },
  },
  cues: [
    { t: 148.2, actor: 'david', clip: 'roll', loop: false, timeScale: 1.6, fade: 0.12 },
    { t: 149.4, actor: 'david', clip: 'Falling_To_Roll', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 150.6, actor: 'david', clip: 'Stable_Sword_Outward_Slash', loop: false, timeScale: 1.15, fade: 0.1 },
    { t: 151.0, actor: 'champion', clip: 'Standing_Block_React_Large', loop: false, timeScale: 0.95, fade: 0.06 },
    { t: 151.6, actor: 'david', clip: 'Two_Hand_Sword_Combo', loop: false, timeScale: 1.2, fade: 0.1 },
    { t: 152.2, actor: 'champion', clip: 'Big_Side_Hit', loop: false, timeScale: 0.9, fade: 0.06 },
    { t: 153.2, actor: 'david', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.25, fade: 0.1 },
    { t: 153.9, actor: 'champion', clip: 'Getting_Hit_Backwards', loop: false, timeScale: 0.95, fade: 0.08 },
    { t: 154.6, actor: 'david', clip: 'Idle', loop: true, timeScale: 1.15, fade: 0.25 },
  ],
  events: [
    ev(148.4, 'splash', [-8.4, 0.3, -5.0], { count: 34, power: 1.2 }),
    ev(150.7, 'sparks', [-8.5, 1.20, -4.7], { count: 34, power: 1.3 }),
    ev(151.7, 'sparks', [-8.5, 1.35, -4.5], { count: 44, power: 1.6 }),
    ev(151.75, 'shake', [-8.5, 1.3, -4.5], { amp: 1.2 }),
    ev(152.25, 'pauldron', [-8.6, 1.50, -4.4], { count: 90 }),
    ev(152.3, 'sparks', [-8.6, 1.50, -4.4], { count: 80, power: 2.2 }),
    ev(152.32, 'shake', [-8.6, 1.5, -4.4], { amp: 1.8 }),
    ev(152.6, 'blood', [-8.6, 1.55, -4.2], { count: 26 }),
    ev(153.3, 'sparks', [-8.7, 1.40, -3.6], { count: 40, power: 1.5 }),
    ev(154.0, 'blood', [-8.8, 1.35, -3.0], { count: 24 }),
    ev(154.4, 'splash', [-8.8, 0.4, -3.2], { count: 30, power: 1.0 }),
  ],
  note: 'He slides under the champion’s guard and rises into the strike that shatters the pauldron.',
  crowd: 1,
});

// ---------------------------------------------------------------- 155-180 · victory and title

shot(155, 165, 'The champion falls — the camera rises from the mud', {
  cam: [
    { t: 155.0, pos: [-8.30, 1.45, -7.20], look: [-8.6, 1.25, -4.90], fov: 44 },
    { t: 158.0, pos: [-8.50, 1.05, -6.20], look: [-8.7, 1.10, -3.80], fov: 40 },
    { t: 161.0, pos: [-8.70, 2.60, -6.00], look: [-8.6, 1.05, -3.20], fov: 42, roll: -0.8 },
    { t: 165.0, pos: [-8.90, 5.20, -5.40], look: [-8.5, 0.95, -2.40], fov: 40 },
  ],
  cast: {
    david: { pos: [-8.5, -4.4], yaw: -1.1, move: [[155, [-8.5, -4.4, -1.1]], [159, [-8.4, -4.0, -0.8]], [165, [-8.4, -3.6, -0.6]]] },
    champion: { pos: [-9.0, -2.4], yaw: 2.5, move: [[156.4, [-9.0, -2.4, 2.5]], [158.6, [-9.4, -1.8, 2.9]], [162, [-9.6, -1.2, 3.1]]] },
    elite1: { pos: [-10.4, -6.0], yaw: 0.4, move: [[157.6, [-10.4, -6.0, 0.4]], [161, [-12.0, -8.0, 0.9]], [165, [-14.0, -11.0, 1.2]]] },
    elite2: { pos: [-7.0, -6.4], yaw: -0.6, move: [[158.2, [-7.0, -6.4, -0.6]], [162, [-6.0, -9.0, -0.4]], [165, [-5.2, -12.0, -0.2]]] },
    trio1: { pos: [-11.4, -4.4], yaw: 0.6, move: [[159.0, [-11.4, -4.4, 0.6]], [163, [-13.2, -6.4, 1.0]], [165, [-15.0, -8.4, 1.2]]] },
    trio2: { pos: [-6.2, -3.6], yaw: -0.9, move: [[160.0, [-6.2, -3.6, -0.9]], [164, [-5.0, -6.0, -0.6]], [165, [-4.6, -8.0, -0.4]]] },
  },
  cues: [
    { t: 155.2, actor: 'champion', clip: 'Two_Handed_Sword_Death', loop: false, timeScale: 0.85, fade: 0.12 },
    { t: 156.2, actor: 'david', clip: 'Idle', loop: true, timeScale: 0.85, fade: 0.3 },
    { t: 157.8, actor: 'elite1', clip: 'Walking', loop: true, timeScale: 1.15, fade: 0.3 },
    { t: 158.4, actor: 'elite2', clip: 'Cautious_Backward_Walk', loop: true, timeScale: 1.2, fade: 0.3 },
    { t: 159.0, actor: 'trio1', clip: 'Cautious_Backward_Walk', loop: true, timeScale: 1.1, fade: 0.3 },
    { t: 160.0, actor: 'trio2', clip: 'Walking', loop: true, timeScale: 1.2, fade: 0.3 },
  ],
  events: [
    ev(155.6, 'mud', [-9.2, 0.2, -2.2], { count: 60, power: 1.8 }),
    ev(155.65, 'shake', [-9.2, 0.7, -2.2], { amp: 1.4 }),
    ev(156.0, 'splash', [-9.2, 0.2, -2.0], { count: 40, power: 1.2 }),
    ev(160.0, 'lightning', [40, 60, -60], {}),
    ev(163.0, 'mist', [0, 1.0, -22.0], { count: 26, power: 1.0 }),
  ],
  note: 'The champion falls into the mud; the camera cranes up as the enemy line breaks and withdraws.',
  crowd: 1,
});

shot(165, 172, 'Golden light — the sword planted', {
  cam: [
    { t: 165.0, pos: [-8.90, 5.20, -5.40], look: [-8.5, 0.95, -2.40], fov: 40 },
    { t: 168.0, pos: [-9.40, 3.20, -8.60], look: [-8.5, 1.15, -3.00], fov: 38, roll: 0.6 },
    { t: 170.0, pos: [-9.20, 2.10, -9.60], look: [-8.4, 1.20, -3.20], fov: 36 },
    { t: 172.0, pos: [-9.00, 1.60, -10.40], look: [-8.3, 1.20, -3.40], fov: 40 },
  ],
  cast: {
    david: { pos: [-8.4, -3.6], yaw: -0.3, move: [[165, [-8.4, -3.6, -0.6]], [166.6, [-8.4, -3.4, -0.2]], [172, [-8.4, -3.3, 0.1]]] },
  },
  cues: [
    { t: 165.4, actor: 'david', clip: 'Idle', loop: true, timeScale: 0.8, fade: 0.3 },
    { t: 167.0, actor: 'david', clip: 'Sheathing_Sword', loop: false, timeScale: 0.75, fade: 0.3 },
    { t: 169.4, actor: 'david', clip: 'Idle', loop: true, timeScale: 0.75, fade: 0.4 },
  ],
  events: [
    ev(166.4, 'godRays', [30, 26, 34], { power: 1.0 }),
    ev(168.6, 'swordPlant', [-8.4, 0.0, -3.2], { count: 30 }),
    ev(168.65, 'shake', [-8.4, 0.5, -3.2], { amp: 0.5 }),
    ev(170.0, 'mist', [0, 1.4, -26.0], { count: 20, power: 0.8 }),
  ],
  note: 'The storm clears: gold light cuts through, David plants the sword and leans on it.',
  crowd: 0,
});

shot(172, 175, 'Judean wilderness — the pullback', {
  cam: [
    { t: 172.0, pos: [-9.00, 1.60, -10.40], look: [-8.3, 1.20, -3.40], fov: 40 },
    { t: 173.4, pos: [-6.00, 3.40, -14.00], look: [-7.0, 1.30, -4.00], fov: 44 },
    { t: 175.0, pos: [2.00, 6.40, -19.00], look: [-4.0, 1.40, -5.00], fov: 46 },
  ],
  cast: {
    david: { pos: [-8.4, -3.3], yaw: 0.1 },
  },
  cues: [{ t: 172.0, actor: 'david', clip: 'Idle', loop: true, timeScale: 0.7, fade: 0.3 }],
  events: [
    ev(173.0, 'godRays', [30, 24, 34], { power: 1.2 }),
    ev(174.0, 'mist', [0, 2.0, -30.0], { count: 24, power: 0.9 }),
  ],
  note: 'Wide epic: the rugged Judean hills, ruined stone, gold light, smoke of the battle drifting.',
  crowd: 0,
});

shot(175, 180, 'Title — VALOR: THE CHRONICLES OF DAVID', {
  cam: [
    { t: 175.0, pos: [2.00, 6.40, -19.00], look: [-4.0, 1.40, -5.00], fov: 46 },
    { t: 177.0, pos: [1.20, 5.20, -16.00], look: [-3.0, 2.20, -5.00], fov: 40 },
    { t: 178.2, pos: [0.60, 4.60, -14.00], look: [-2.4, 2.40, -5.00], fov: 36 },
    { t: 180.0, pos: [0.20, 4.10, -12.00], look: [-2.0, 2.50, -5.00], fov: 32 },
  ],
  cast: {},
  cues: [],
  events: [
    ev(175.4, 'titleIn', [0, 0, 0], { dur: 0.9 }),
    ev(178.0, 'fadeBlack', [0, 0, 0], { dur: 1.6 }),
  ],
  note: 'Metallic chiselled typography burns on, then the film fades to black.',
  crowd: 0,
});

export const ACT3_SHOT_COUNT = SHOTS.length;
