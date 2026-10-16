// shots.js — the choreography for DAVID: THE CHRONICLES OF VALOR (180s, 60fps).
// Beat map (seconds) follows the requested timeline exactly:
//   0-10 eyes/pullback · 10-20 captain duel · 20-30 two attackers
//   30-45 Josheb's stand · 45-60 Eleazar's defiance · 60-70 Shammah's field
//   70-85 chariot / sling / javelin · 85-100 landing + grappling
//   100-110 dual blades + elites + wall-run · 110-125 the storm breaks
//   125-140 champion OTS barrage · 140-155 slow parry + pauldron shatter
//   155-165 camera rises, rout · 165-175 golden light, sword planted
//   175-180 metallic title, fade to black
import { DEG } from './util.js';

export const FPS = 60;
export const DURATION = 180;
export const FRAMES = DURATION * FPS;        // 10800
export const WIDTH = 3840;
export const HEIGHT = 2160;

// ---------------------------------------------------------------- cast

export const CAST = {
  david: { char: 'paladin', palette: { tint: 0xffffff, roughness: 0.62, envMapIntensity: 1.15 }, scale: 1.0, height: 1.8 },
  captain: { char: 'paladin', palette: { tint: 0xb98a4e, metalness: 0.58, roughness: 0.42, envMapIntensity: 1.1 }, scale: 1.09 },
  attacker1: { char: 'paladin', palette: { tint: 0x9a8e78, roughness: 0.8 }, scale: 1.02 },
  attacker2: { char: 'paladin', palette: { tint: 0x8f7f66, roughness: 0.8 }, scale: 0.98 },
  josheb: { char: 'paladin', palette: { tint: 0xe8dcc8, roughness: 0.62 }, scale: 1.06 },
  eleazar: { char: 'paladin', palette: { tint: 0xcfa87a, roughness: 0.7 }, scale: 1.0 },
  shammah: { char: 'paladin', palette: { tint: 0xd8c49a, roughness: 0.7 }, scale: 1.1 },
  elite1: { char: 'paladin', palette: { tint: 0x6f7d86, metalness: 0.7, roughness: 0.4 }, scale: 1.04 },
  elite2: { char: 'paladin', palette: { tint: 0x77828a, metalness: 0.7, roughness: 0.4 }, scale: 1.02 },
  elite3: { char: 'paladin', palette: { tint: 0x6d7880, metalness: 0.7, roughness: 0.4 }, scale: 1.05 },
  elite4: { char: 'paladin', palette: { tint: 0x74808a, metalness: 0.7, roughness: 0.4 }, scale: 1.0 },
  elite5: { char: 'paladin', palette: { tint: 0x6a757e, metalness: 0.7, roughness: 0.4 }, scale: 1.03 },
  champion: { char: 'paladin', palette: { tint: 0xb2843c, metalness: 0.62, roughness: 0.30, envMapIntensity: 1.2 }, scale: 1.16 },
  archer: { char: 'paladin', palette: { tint: 0xa89a7a, roughness: 0.8 }, scale: 0.99 },
  trio1: { char: 'paladin', palette: { tint: 0x95886f, roughness: 0.82 }, scale: 1.0 },
  trio2: { char: 'paladin', palette: { tint: 0x8b7f66, roughness: 0.82 }, scale: 1.01 },
  trio3: { char: 'paladin', palette: { tint: 0x9d8f74, roughness: 0.82 }, scale: 0.97 },
};

// props each actor holds: [propName, hand, opts]
export const PROPS = {
  david: [['Sword_Golden', 'right', { rotation: [90, 0, 0], scale: 0.72, position: [0, 0.04, 0] }], ['Shield_Round', 'left', { rotation: [90, 0, 0], scale: 0.5, position: [0, 0.06, 0] }]],
  captain: [['Claymore', 'right', { rotation: [90, 0, 0], scale: 0.95, position: [0, 0.06, 0] }]],
  attacker1: [['Axe', 'right', { rotation: [90, 0, 0], scale: 0.85 }], ['Shield_Heater', 'left', { rotation: [90, 0, 0], scale: 0.55 }]],
  attacker2: [['Claymore', 'right', { rotation: [90, 0, 0], scale: 0.8 }]],
  josheb: [['Spear', 'right', { rotation: [90, 0, 0], scale: 1.15, position: [0, 0.1, 0] }]],
  eleazar: [['Sword_Golden', 'right', { rotation: [90, 0, 0], scale: 0.7 }], ['Sword_Golden', 'left', { rotation: [90, 0, 0], scale: 0.7 }]],
  shammah: [['Claymore', 'right', { rotation: [90, 0, 0], scale: 1.0 }]],
  elite1: [['Axe', 'right', { rotation: [90, 0, 0], scale: 0.9 }]],
  elite2: [['Sword_Golden', 'right', { rotation: [90, 0, 0], scale: 0.75 }]],
  elite3: [['Spear', 'right', { rotation: [90, 0, 0], scale: 1.0 }]],
  elite4: [['Axe', 'right', { rotation: [90, 0, 0], scale: 0.85 }]],
  elite5: [['Sword_Golden', 'right', { rotation: [90, 0, 0], scale: 0.78 }]],
  champion: [['Claymore', 'right', { rotation: [90, 0, 0], scale: 1.0 }]],
  archer: [['Bow_Wooden', 'left', { rotation: [90, 0, 0], scale: 0.9 }]],
  trio1: [['Axe', 'right', { rotation: [90, 0, 0], scale: 0.85 }]],
  trio2: [['Sword_Golden', 'right', { rotation: [90, 0, 0], scale: 0.72 }]],
  trio3: [['Spear', 'right', { rotation: [90, 0, 0], scale: 1.0 }]],
};

// ---------------------------------------------------------------- helpers

export const SHOTS = [];
let shotIndex = 0;
// declare a shot with camera keys, cast blocking, clip cues and impact events
export function shot(start, end, name, cfg = {}) {
  SHOTS.push({
    id: ++shotIndex, start, end, name,
    cam: cfg.cam || [],
    cast: cfg.cast || {},           // actor -> {pos:[x,z], yaw, move:[[t,[x,z,yaw]]]}
    cues: cfg.cues || [],           // {t, actor, clip, loop, timeScale, from, layer, fade}
    events: cfg.events || [],       // impact events (sparks/dust/mud/blood/splash/shockwave)
    env: cfg.env || {},             // environment overrides, eased across the shot
    focus: cfg.focus || 'battle',   // weather/simulation centre
    crowd: cfg.crowd,               // crowd visibility override
    note: cfg.note || '',
  });
  return SHOTS[SHOTS.length - 1];
}

export const ev = (t, type, at, opts = {}) => ({ t, type, at, ...opts });

// a complete strike exchange: attacker winds up, defender answers, impact fires, victim reacts
export function exchange(t, attacker, defender, atkClip, defClip, hitClip, contact, opts = {}) {
  const cues = [
    { t: t - 0.55, actor: attacker, clip: atkClip, loop: false, timeScale: opts.atkSpeed || 1.0, fade: 0.18 },
    { t: t - 0.30, actor: defender, clip: defClip, loop: false, timeScale: opts.defSpeed || 1.25, fade: 0.12 },
    { t: t + 0.10, actor: attacker, clip: hitClip, loop: false, timeScale: opts.hitSpeed || 1.0, fade: 0.10 },
  ];
  const events = [
    ev(t, 'sparks', contact, { count: opts.sparks || 26, power: opts.power || 1 }),
    ev(t + 0.01, 'dust', [contact[0], contact[1] - 0.7, contact[2]], { count: 10, power: 0.6 }),
    ev(t + 0.12, 'shake', contact, { amp: opts.shake ?? 0.5 }),
  ];
  if (opts.blood) events.push(ev(t + 0.16, 'blood', contact, { count: 24 }));
  return { cues, events };
}

// ---------------------------------------------------------------- ACT I · 0-30s

shot(0, 8, 'David — eye line before the storm', {
  cam: [
    { t: 0.0, pos: [0.30, 1.84, 1.06], look: [0.08, 1.72, 0.24], fov: 34, roll: 0.0 },
    { t: 4.0, pos: [0.38, 1.82, 0.99], look: [0.08, 1.71, 0.22], fov: 32, roll: -0.4 },
    { t: 8.0, pos: [0.50, 1.79, 0.92], look: [0.07, 1.69, 0.19], fov: 30, roll: 0.5 },
  ],
  cast: { david: { pos: [0, 0], yaw: 0 } },
  cues: [{ t: 0, actor: 'david', clip: 'Idle', loop: true, timeScale: 1.15 }],
  events: [
    ev(1.1, 'sweat', [0.09, 1.74, 0.14], { count: 2 }),
    ev(3.4, 'sweat', [0.10, 1.73, 0.14], { count: 3 }),
    ev(6.2, 'sweat', [0.08, 1.72, 0.14], { count: 2 }),
  ],
  note: 'ECU on the eyes: sweat, breath, dust drifting through the key light.',
  crowd: 1,
  frame: 0, tighten: 0.15, standoff: 0.2,
});

shot(8, 14, 'Pull back into the valley of shadows', {
  cam: [
    { t: 8.0, pos: [0.34, 1.62, 0.80], look: [0.05, 1.55, 0.30], fov: 34, roll: 0.4 },
    { t: 11.0, pos: [1.90, 0.92, 3.20], look: [0.00, 1.20, 0.20], fov: 40, roll: -0.8 },
    { t: 14.0, pos: [2.90, 0.70, 5.40], look: [-0.20, 1.30, -0.60], fov: 36, roll: 1.1 },
  ],
  cast: {
    david: { pos: [0, 0], yaw: 0.12 },
    captain: { pos: [-0.35, 3.1], yaw: Math.PI - 0.1 },
    attacker1: { pos: [2.7, 2.2], yaw: Math.PI - 0.5 },
    attacker2: { pos: [-2.9, 1.9], yaw: Math.PI + 0.4 },
  },
  cues: [
    { t: 8.0, actor: 'david', clip: 'Idle', loop: true, timeScale: 1.2 },
    { t: 8.6, actor: 'captain', clip: 'Great_Sword_Walk', loop: true, timeScale: 1.05 },
    { t: 8.6, actor: 'attacker1', clip: 'Cautious_Backward_Walk', loop: true, timeScale: 1.1 },
    { t: 8.9, actor: 'attacker2', clip: 'Walking', loop: true, timeScale: 1.0 },
    { t: 12.4, actor: 'captain', clip: 'Great_Sword_Idle', loop: true, fade: 0.3 },
  ],
  events: [ev(9.6, 'dust', [0, 0.2, 1.2], { count: 30, power: 1.2, ambient: true })],
  note: 'Low tracking reveal of the ambush: the captain closes from the dust.',
  crowd: 1,
});

shot(14, 20, 'The captain’s bronze broadsword', {
  cam: [
    { t: 14.0, pos: [3.10, 0.95, 4.10], look: [-0.2, 1.25, 1.4], fov: 38 },
    { t: 16.2, pos: [2.30, 1.05, 3.30], look: [-0.25, 1.35, 0.4], fov: 44 },
    { t: 18.4, pos: [1.70, 0.80, 2.40], look: [-0.1, 1.10, 0.1], fov: 50 },
    { t: 20.0, pos: [2.10, 1.30, 2.10], look: [0.0, 1.40, 0.3], fov: 46 },
  ],
  cast: {
    david: { pos: [0, 0], yaw: 0.05, move: [[14, [0, 0, 0.05]], [16.0, [-0.35, 0.35, -0.35]], [18.6, [-0.10, 0.10, 0.35]], [20, [0.30, 0.30, 0.9]]] },
    captain: { pos: [-0.4, 3.0], yaw: Math.PI, move: [[14, [-0.4, 3.0, Math.PI]], [16.2, [-0.5, 2.0, Math.PI]], [18.8, [-0.30, 1.5, Math.PI]], [20, [-0.9, 2.4, Math.PI * 0.9]]] },
  },
  cues: [
    ...exchange(16.1, 'captain', 'david', 'Great_Sword_Attack', 'Standing_Block_React_Large', 'Blocking_Attack', [-0.45, 1.25, 0.55], { sparks: 40, power: 1.4, shake: 0.9, atkSpeed: 0.95, hitSpeed: 0.9, blood: false }).cues,
    { t: 17.4, actor: 'david', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.35, fade: 0.1, layer: 'base' },
    { t: 18.7, actor: 'david', clip: 'Flying_Knee_Punch_Combo', loop: false, timeScale: 1.2, fade: 0.08 },
    { t: 19.1, actor: 'captain', clip: 'hit_chest', loop: false, timeScale: 1.1, fade: 0.06 },
    { t: 19.8, actor: 'captain', clip: 'Getting_Hit_Backwards', loop: false, timeScale: 1.0, fade: 0.1 },
  ],
  events: [
    ...exchange(16.1, 'captain', 'david', 'Great_Sword_Attack', 'Standing_Block_React_Large', 'Blocking_Attack', [-0.45, 1.25, 0.55], { sparks: 40, power: 1.4, shake: 0.9 }).events,
    ev(18.95, 'sparks', [-0.55, 1.05, 1.35], { count: 18, power: 0.9 }),
    ev(19.0, 'dust', [-0.6, 0.25, 1.35], { count: 26, power: 1.1 }),
    ev(19.05, 'shake', [-0.5, 1.0, 1.3], { amp: 1.1 }),
    ev(17.5, 'sparkTrail', [0, 1.0, 0.6], { dur: 0.55 }),
  ],
  note: 'Low slip, parry with sparks, spin, flying knee to the guard.',
  crowd: 1,
});

shot(20, 26, 'Two more rush in — shield bash', {
  cam: [
    { t: 20.0, pos: [2.20, 1.40, 2.60], look: [0.0, 1.30, 0.4], fov: 46 },
    { t: 22.6, pos: [-1.60, 1.15, 3.10], look: [0.35, 1.25, 0.2], fov: 42 },
    { t: 26.0, pos: [-0.30, 0.95, 2.30], look: [0.10, 1.15, 0.1], fov: 52 },
  ],
  cast: {
    david: { pos: [0.3, 0.3], yaw: 0.9, move: [[20, [0.3, 0.3, 0.9]], [21.6, [0.4, 0.6, 2.2]], [23.6, [0.1, 0.1, -1.2]], [26, [0.2, 0.2, -2.4]]] },
    attacker1: { pos: [2.6, 1.6], yaw: -2.2, move: [[20, [2.6, 1.6, -2.2]], [21.5, [1.2, 1.0, -2.6]], [23.0, [0.9, 0.6, -2.9]], [24.4, [0.6, 2.4, -0.6]], [26, [1.6, 4.2, 0.4]]] },
    attacker2: { pos: [-2.4, 1.4], yaw: 2.4, move: [[20, [-2.4, 1.4, 2.4]], [22.4, [-1.4, 0.9, 2.7]], [24.0, [-0.6, 0.5, 3.0]], [25.4, [-0.2, 0.2, 2.2]]] },
  },
  cues: [
    { t: 20.3, actor: 'attacker1', clip: 'Great_Sword_Attack', loop: false, timeScale: 1.15, fade: 0.2 },
    { t: 20.6, actor: 'david', clip: 'Sword_And_Shield_Idle', loop: true, timeScale: 1.0, fade: 0.2 },
    { t: 21.4, actor: 'david', clip: 'Sword_And_Shield_Crouch_Block', loop: false, timeScale: 1.3, fade: 0.1 },
    { t: 21.75, actor: 'attacker1', clip: 'sword_block', loop: false, timeScale: 1.0, fade: 0.08 },
    { t: 22.5, actor: 'david', clip: 'Sword_And_Shield_Attack', loop: false, timeScale: 1.25, fade: 0.1 },
    { t: 22.95, actor: 'attacker2', clip: 'Standing_Block_React_Large', loop: false, timeScale: 1.2, fade: 0.06 },
    { t: 23.7, actor: 'david', clip: 'Sword_And_Shield_Impact', loop: false, timeScale: 1.35, fade: 0.08 },
    { t: 24.15, actor: 'attacker2', clip: 'hit_head', loop: false, timeScale: 1.25, fade: 0.06 },
    { t: 25.0, actor: 'david', clip: 'Inside_Crescent_Kick', loop: false, timeScale: 1.3, fade: 0.1 },
    { t: 25.5, actor: 'attacker2', clip: 'Getting_Hit_Backwards', loop: false, timeScale: 1.1, fade: 0.06 },
  ],
  events: [
    ev(21.8, 'sparks', [1.15, 1.20, 0.95], { count: 34, power: 1.2 }),
    ev(21.85, 'shake', [1.0, 1.1, 1.0], { amp: 0.8 }),
    ev(23.0, 'sparks', [-0.2, 1.35, 0.7], { count: 22, power: 1.0 }),
    ev(23.75, 'sparks', [0.0, 1.55, 0.6], { count: 54, power: 1.7 }),
    ev(23.8, 'shake', [0, 1.4, 0.6], { amp: 1.3 }),
    ev(24.2, 'blood', [-0.1, 1.62, 0.55], { count: 16 }),
    ev(25.55, 'dust', [-0.1, 0.3, 0.2], { count: 40, power: 1.3, ring: true }),
  ],
  note: 'Khopesh and leather shield: bash that cracks the helmet, then a 360 sweep kick.',
  crowd: 1,
});

shot(26, 30, 'The sweep lands — dust and steel', {
  cam: [
    { t: 26.0, pos: [-0.30, 0.95, 2.30], look: [0.10, 1.15, 0.1], fov: 52 },
    { t: 27.6, pos: [-1.90, 0.65, 2.90], look: [0.2, 0.75, 0.3], fov: 44, roll: -1.6 },
    { t: 30.0, pos: [0.60, 1.55, 3.60], look: [0.0, 0.95, -0.4], fov: 40, roll: 1.2 },
  ],
  cast: {
    david: { pos: [0.2, 0.2], yaw: -2.4, move: [[26, [0.2, 0.2, -2.4]], [28, [0.1, 0.4, -3.0]], [30, [0, 0.2, -3.4]]] },
    attacker1: { pos: [1.6, 4.2], yaw: 0.4, move: [[26, [1.6, 4.2, 0.4]], [28.4, [1.4, 3.0, 0.9]], [30, [1.0, 2.0, 1.3]]] },
    attacker2: { pos: [0.2, 2.2], yaw: 2.0, move: [[26.5, [0.2, 2.2, 2.0]], [27.4, [0.3, 1.4, 2.6]], [29.2, [0.4, 3.6, 2.4]], [30, [0.5, 5.0, 2.4]]] },
    trio1: { pos: [4.4, -1.4], yaw: -1.6 },
  },
  cues: [
    { t: 26.2, actor: 'attacker2', clip: 'Dying', loop: false, timeScale: 0.85, fade: 0.15 },
    { t: 27.0, actor: 'david', clip: 'Roundhouse_Kick', loop: false, timeScale: 1.1, fade: 0.12 },
    { t: 28.5, actor: 'david', clip: 'Sword_And_Shield_Idle', loop: true, timeScale: 0.9, fade: 0.35 },
    { t: 28.6, actor: 'attacker1', clip: 'Great_Sword_Walk', loop: true, timeScale: 1.15, fade: 0.3 },
    { t: 29.2, actor: 'trio1', clip: 'Great_Sword_Idle', loop: true, fade: 0.3 },
  ],
  events: [
    ev(27.35, 'dust', [0.25, 0.35, 1.5], { count: 46, power: 1.4, ring: true }),
    ev(27.4, 'shake', [0.3, 0.8, 1.5], { amp: 0.7 }),
    ev(29.0, 'dust', [0, 0.2, 0.5], { count: 22, power: 0.7, ambient: true }),
  ],
  note: 'Falling attacker, camera whips low across the dirt.',
  crowd: 1,
});

// ---------------------------------------------------------------- ACT II · 30-70s

shot(30, 38, 'Josheb-Basshebeth: the wall of three hundred', {
  cam: [
    { t: 30.0, pos: [6.20, 2.60, -6.00], look: [-0.5, 1.10, -12.0], fov: 40 },
    { t: 33.0, pos: [2.10, 1.55, -3.10], look: [-0.4, 1.30, -8.0], fov: 46 },
    { t: 35.4, pos: [-1.40, 1.35, -3.60], look: [0.1, 1.35, -5.6], fov: 44 },
    { t: 38.0, pos: [0.30, 1.15, -2.10], look: [0.0, 1.25, -6.0], fov: 50 },
  ],
  cast: {
    josheb: { pos: [0, -6.0], yaw: Math.PI, move: [[30, [0, -6.0, Math.PI]], [33, [-0.4, -5.4, Math.PI]], [38, [-0.2, -5.0, Math.PI * 0.94]]] },
    trio1: { pos: [-2.6, -2.4], yaw: Math.PI, move: [[31, [-2.6, -2.4, Math.PI]], [34.4, [-1.6, -3.8, Math.PI]], [36.2, [-1.2, -6.2, Math.PI]], [38, [-0.9, -8.4, Math.PI * 1.05]]] },
    trio2: { pos: [2.8, -2.0], yaw: Math.PI, move: [[32, [2.8, -2.0, Math.PI]], [35.0, [2.0, -3.6, Math.PI]], [36.6, [1.6, -6.4, Math.PI]]] },
  },
  cues: [
    { t: 30.0, actor: 'josheb', clip: 'Idle', loop: true, timeScale: 1.0 },
    { t: 31.0, actor: 'josheb', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.5, fade: 0.2 },
    { t: 31.4, actor: 'trio1', clip: 'Run_With_Sword', loop: true, timeScale: 1.25, fade: 0.2 },
    { t: 32.4, actor: 'josheb', clip: 'Bayonet_Stab', loop: false, timeScale: 1.6, fade: 0.12 },
    { t: 32.9, actor: 'trio1', clip: 'Standing_Block_React_Large', loop: false, timeScale: 1.2, fade: 0.06 },
    { t: 33.6, actor: 'josheb', clip: 'Blocking', loop: false, timeScale: 1.8, fade: 0.1 },
    { t: 34.2, actor: 'josheb', clip: 'Center_Block', loop: false, timeScale: 1.9, fade: 0.1 },
    { t: 34.8, actor: 'josheb', clip: 'Great_Sword_Slash', loop: false, timeScale: 1.7, fade: 0.1 },
    { t: 35.3, actor: 'trio2', clip: 'Getting_Hit_Backwards', loop: false, timeScale: 1.15, fade: 0.06 },
    { t: 36.0, actor: 'josheb', clip: 'Jumping_Over_Into_Combat', loop: false, timeScale: 1.3, fade: 0.12 },
    { t: 37.0, actor: 'josheb', clip: 'Two_Hand_Sword_Combo', loop: false, timeScale: 1.4, fade: 0.12 },
  ],
  events: [
    ev(31.2, 'sparks', [-2.2, 1.5, -3.4], { count: 24, power: 1.0 }),
    ev(32.5, 'sparks', [-1.9, 1.25, -4.3], { count: 30, power: 1.2 }),
    ev(32.55, 'blood', [-1.9, 1.3, -4.3], { count: 20 }),
    ev(34.3, 'arrowVolley', [-0.8, 3.2, -14.0], { count: 26, toward: [0, 1.3, -5.0], gap: 0.9 }),
    ev(35.35, 'dust', [1.6, 0.4, -6.2], { count: 40, power: 1.3 }),
    ev(36.2, 'dust', [0.1, 0.35, -4.0], { count: 52, power: 1.5, ring: true }),
    ev(36.25, 'shake', [0, 0.7, -4.0], { amp: 1.0 }),
    ev(37.1, 'sparks', [0.2, 1.35, -6.4], { count: 36, power: 1.3 }),
  ],
  note: 'Spear against the Philistine line: arrow hail deflected, then thrusts, sweeps and a vault.',
  crowd: 1,
});

shot(38, 45, 'Josheb scatters the front rank', {
  cam: [
    { t: 38.0, pos: [0.90, 1.35, -2.60], look: [0.0, 1.25, -5.2], fov: 48 },
    { t: 41.0, pos: [-2.30, 0.85, -3.40], look: [0.0, 1.15, -5.6], fov: 42 },
    { t: 45.0, pos: [2.90, 3.30, -3.00], look: [0.0, 1.10, -7.0], fov: 38 },
  ],
  cast: {
    josheb: { pos: [-0.2, -5.2], yaw: Math.PI, move: [[38, [-0.2, -5.2, Math.PI]], [40.5, [0.4, -4.4, Math.PI]], [43, [-0.3, -6.2, Math.PI]], [45, [0.2, -5.6, Math.PI]]] },
    trio1: { pos: [-0.9, -8.4], yaw: 0.2, move: [[38.6, [-0.9, -8.4, 0.2]], [41.2, [-1.4, -6.2, 0.5]], [43.4, [-2.2, -8.8, 0.9]]] },
    trio2: { pos: [1.6, -6.4], yaw: 0.9, move: [[39.4, [1.6, -6.4, 0.9]], [42.0, [1.0, -4.8, 1.4]], [44.6, [1.4, -7.2, 1.1]]] },
    trio3: { pos: [-3.4, -6.8], yaw: 0.4, move: [[40.2, [-3.4, -6.8, 0.4]], [42.6, [-2.6, -5.4, 0.9]], [45, [-3.0, -7.6, 0.5]]] },
  },
  cues: [
    { t: 38.2, actor: 'josheb', clip: 'Two_Hand_Sword_Combo', loop: false, timeScale: 1.35, fade: 0.15 },
    { t: 39.0, actor: 'trio1', clip: 'Standing_Block_Start', loop: false, timeScale: 1.2, fade: 0.1 },
    { t: 39.6, actor: 'josheb', clip: 'Great_Sword_Slash', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 40.4, actor: 'trio2', clip: 'sword_block', loop: false, timeScale: 1.25, fade: 0.1 },
    { t: 41.2, actor: 'josheb', clip: 'Great_Sword_Kick', loop: false, timeScale: 1.4, fade: 0.1 },
    { t: 41.7, actor: 'trio2', clip: 'Getting_Hit_Backwards', loop: false, timeScale: 1.2, fade: 0.06 },
    { t: 42.4, actor: 'josheb', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.55, fade: 0.12 },
    { t: 43.0, actor: 'trio3', clip: 'Hit_To_Body', loop: false, timeScale: 1.1, fade: 0.06 },
    { t: 43.6, actor: 'trio3', clip: 'Dying', loop: false, timeScale: 0.9, fade: 0.2 },
    { t: 44.2, actor: 'josheb', clip: 'Great_Sword_Idle', loop: true, timeScale: 1.0, fade: 0.3 },
  ],
  events: [
    ev(39.7, 'sparks', [-0.9, 1.35, -6.6], { count: 28, power: 1.2 }),
    ev(41.3, 'dust', [0.6, 0.5, -5.4], { count: 34, power: 1.2 }),
    ev(41.75, 'blood', [1.0, 1.4, -5.2], { count: 22 }),
    ev(42.6, 'sparks', [-0.4, 1.5, -6.0], { count: 46, power: 1.6 }),
    ev(42.65, 'shake', [0, 1.2, -5.6], { amp: 1.2 }),
    ev(43.1, 'blood', [-2.6, 1.2, -6.0], { count: 24 }),
    ev(44.0, 'dust', [0, 0.25, -6.0], { count: 30, power: 0.9, ambient: true }),
  ],
  note: 'Wide crane out: the front rank breaks and runs.',
  crowd: 1,
});

shot(45, 53, 'Eleazar: the sword bound to his hand', {
  cam: [
    { t: 45.0, pos: [-1.90, 1.45, 3.40], look: [-4.4, 1.20, -2.2], fov: 42 },
    { t: 48.5, pos: [-6.10, 1.20, 1.80], look: [-4.2, 1.25, -3.0], fov: 46 },
    { t: 53.0, pos: [-3.40, 1.05, -0.40], look: [-4.6, 1.20, -2.4], fov: 50 },
  ],
  cast: {
    eleazar: { pos: [-4.6, -2.6], yaw: 1.35, move: [[45, [-4.6, -2.6, 1.35]], [48, [-4.4, -2.2, 1.6]], [51, [-4.8, -3.0, 1.2]], [53, [-4.5, -2.4, 1.5]]] },
    elite1: { pos: [-2.6, -1.4], yaw: -2.0, move: [[45.6, [-2.6, -1.4, -2.0]], [47.2, [-3.6, -1.8, -2.3]], [48.6, [-4.1, -3.2, -2.6]], [50, [-6.0, -4.4, -2.2]]] },
    elite2: { pos: [-6.8, -0.6], yaw: -1.4, move: [[46.4, [-6.8, -0.6, -1.4]], [48.0, [-5.8, -1.4, -1.8]], [49.4, [-5.0, -2.6, -2.0]], [51, [-6.4, -5.2, -1.6]]] },
    trio1: { pos: [-5.2, -6.6], yaw: 1.1 },
  },
  cues: [
    { t: 45.0, actor: 'eleazar', clip: 'Idle', loop: true, timeScale: 0.85 },
    { t: 46.0, actor: 'eleazar', clip: 'Draw_Sword_1', loop: false, timeScale: 0.95, fade: 0.2 },
    { t: 46.6, actor: 'elite1', clip: 'Run_With_Sword', loop: true, timeScale: 1.2, fade: 0.2 },
    { t: 47.4, actor: 'eleazar', clip: 'Block', loop: false, timeScale: 1.35, fade: 0.1 },
    { t: 47.8, actor: 'elite1', clip: 'Stable_Sword_Outward_Slash', loop: false, timeScale: 1.2, fade: 0.1 },
    { t: 48.4, actor: 'eleazar', clip: 'Center_Block', loop: false, timeScale: 1.45, fade: 0.08 },
    { t: 49.0, actor: 'elite2', clip: 'sword_attack', loop: false, timeScale: 1.3, fade: 0.12 },
    { t: 49.8, actor: 'eleazar', clip: 'sword_block', loop: false, timeScale: 1.5, fade: 0.08 },
    { t: 50.4, actor: 'eleazar', clip: 'Stable_Sword_Inward_Slash', loop: false, timeScale: 1.35, fade: 0.1 },
    { t: 50.9, actor: 'elite1', clip: 'hit_chest', loop: false, timeScale: 1.15, fade: 0.06 },
    { t: 51.4, actor: 'eleazar', clip: 'Two_Hand_Sword_Combo', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 52.2, actor: 'elite2', clip: 'Getting_Hit_Backwards', loop: false, timeScale: 1.2, fade: 0.08 },
    { t: 52.8, actor: 'eleazar', clip: 'Idle', loop: true, timeScale: 1.25, fade: 0.25 },
  ],
  events: [
    ev(47.5, 'sparks', [-3.9, 1.30, -2.1], { count: 26, power: 1.1 }),
    ev(48.5, 'sparks', [-4.9, 1.35, -2.3], { count: 30, power: 1.2 }),
    ev(49.9, 'sparks', [-5.2, 1.25, -2.2], { count: 34, power: 1.3 }),
    ev(50.5, 'sparks', [-5.0, 1.15, -2.6], { count: 44, power: 1.5 }),
    ev(50.55, 'shake', [-5.0, 1.1, -2.6], { amp: 1.0 }),
    ev(50.95, 'blood', [-4.4, 1.20, -2.4], { count: 22 }),
    ev(52.25, 'blood', [-5.8, 1.30, -2.6], { count: 20 }),
  ],
  note: 'Exhausted defensive parries that redirect momentum into counters.',
  crowd: 1,
});

shot(53, 60, 'Eleazar: aerial dodges inside the battalion', {
  cam: [
    { t: 53.0, pos: [-3.40, 1.05, -0.40], look: [-4.6, 1.20, -2.4], fov: 50 },
    { t: 55.4, pos: [-7.20, 2.10, -3.20], look: [-4.5, 1.30, -2.8], fov: 44, roll: 1.4 },
    { t: 57.6, pos: [-1.80, 1.30, -4.80], look: [-4.6, 1.25, -2.6], fov: 46, roll: -1.1 },
    { t: 60.0, pos: [1.90, 2.40, 1.60], look: [-1.6, 1.20, -2.6], fov: 40 },
  ],
  cast: {
    eleazar: { pos: [-4.5, -2.4], yaw: 1.5, move: [[53, [-4.5, -2.4, 1.5]], [55.2, [-3.4, -3.6, 2.1]], [57.4, [-5.6, -3.0, 1.0]], [60, [-4.2, -2.0, 1.6]]] },
    elite1: { pos: [-6.0, -4.4], yaw: -2.2, move: [[54.0, [-6.0, -4.4, -2.2]], [56.0, [-5.0, -3.4, -2.6]], [58, [-6.4, -3.0, -2.0]]] },
    elite2: { pos: [-6.4, -5.2], yaw: -1.6, move: [[54.6, [-6.4, -5.2, -1.6]], [56.6, [-4.6, -4.4, -2.2]], [58.6, [-5.4, -5.6, -1.4]]] },
    trio1: { pos: [-5.2, -6.6], yaw: 1.1, move: [[55.4, [-5.2, -6.6, 1.1]], [57.6, [-4.2, -5.4, 1.4]], [60, [-5.0, -6.9, 1.0]]] },
  },
  cues: [
    { t: 53.2, actor: 'eleazar', clip: 'Two_Hand_Sword_Combo', loop: false, timeScale: 1.45, fade: 0.15 },
    { t: 54.2, actor: 'eleazar', clip: 'Aerial_Evade', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 54.7, actor: 'trio1', clip: 'Stable_Sword_Outward_Slash', loop: false, timeScale: 1.3, fade: 0.1 },
    { t: 55.4, actor: 'eleazar', clip: 'Stable_Sword_Outward_Slash', loop: false, timeScale: 1.4, fade: 0.1 },
    { t: 56.0, actor: 'eleazar', clip: 'Standing_Dodge_Left', loop: false, timeScale: 1.6, fade: 0.1 },
    { t: 56.6, actor: 'trio1', clip: 'hit_chest', loop: false, timeScale: 1.2, fade: 0.06 },
    { t: 57.2, actor: 'eleazar', clip: 'roll', loop: false, timeScale: 1.4, fade: 0.1 },
    { t: 58.0, actor: 'eleazar', clip: 'sword_attack', loop: false, timeScale: 1.5, fade: 0.1 },
    { t: 58.5, actor: 'elite2', clip: 'hit_chest', loop: false, timeScale: 1.15, fade: 0.06 },
    { t: 59.2, actor: 'eleazar', clip: 'Idle', loop: true, timeScale: 1.3, fade: 0.3 },
  ],
  events: [
    ev(53.4, 'sparks', [-4.0, 1.30, -3.0], { count: 30, power: 1.2 }),
    ev(54.4, 'dust', [-3.4, 0.4, -3.6], { count: 26, power: 1.0 }),
    ev(55.5, 'sparks', [-3.6, 1.20, -4.0], { count: 40, power: 1.5 }),
    ev(55.55, 'shake', [-3.6, 1.1, -4.0], { amp: 1.1 }),
    ev(56.7, 'blood', [-4.0, 1.25, -4.2], { count: 24 }),
    ev(57.3, 'dust', [-5.4, 0.45, -3.4], { count: 34, power: 1.2 }),
    ev(58.6, 'blood', [-4.8, 1.30, -4.6], { count: 20 }),
    ev(59.0, 'splash', [-4.4, 0.2, -3.2], { count: 18, power: 0.6 }),
  ],
  note: 'Wushu-style aerial evades with counters inside the encircling battalion.',
  crowd: 1,
});

shot(60, 70, 'Shammah at the lentil field', {
  cam: [
    { t: 60.0, pos: [1.90, 2.40, 1.60], look: [-1.6, 1.20, -2.6], fov: 40 },
    { t: 63.0, pos: [2.60, 1.30, 0.40], look: [-6.0, 1.20, 2.8], fov: 44 },
    { t: 66.0, pos: [-3.60, 1.05, 4.60], look: [-7.4, 1.25, 1.8], fov: 48 },
    { t: 70.0, pos: [-6.90, 1.60, 5.40], look: [-8.2, 1.30, 1.4], fov: 46 },
  ],
  cast: {
    shammah: { pos: [-8.0, 1.6], yaw: 1.75, move: [[60, [-8.0, 1.6, 1.75]], [63.4, [-7.6, 2.0, 1.9]], [67, [-8.1, 1.4, 1.7]], [70, [-7.9, 1.8, 1.8]]] },
    elite3: { pos: [-5.6, 3.6], yaw: -1.5, move: [[61.4, [-5.6, 3.6, -1.5]], [63.6, [-6.9, 2.8, -1.7]], [65.4, [-7.9, 3.4, -1.5]], [67.6, [-6.6, 4.6, -1.3]]] },
    elite4: { pos: [-10.4, 3.0], yaw: -1.9, move: [[62.8, [-10.4, 3.0, -1.9]], [65.0, [-8.9, 2.4, -1.8]], [67.0, [-8.2, 3.2, -1.7]], [69.4, [-9.4, 4.2, -1.6]]] },
    trio2: { pos: [-6.4, -0.6], yaw: -1.2, move: [[64.2, [-6.4, -0.6, -1.2]], [66.4, [-7.6, 0.6, -1.5]], [69, [-8.6, 1.2, -1.6]]] },
  },
  cues: [
    { t: 60.0, actor: 'shammah', clip: 'Great_Sword_Idle', loop: true, timeScale: 1.05, fade: 0.3 },
    { t: 61.6, actor: 'elite3', clip: 'Run_With_Sword', loop: true, timeScale: 1.2, fade: 0.2 },
    { t: 62.6, actor: 'shammah', clip: 'Great_Sword_Attack', loop: false, timeScale: 1.25, fade: 0.15 },
    { t: 63.1, actor: 'elite3', clip: 'Standing_Block_React_Large', loop: false, timeScale: 1.15, fade: 0.06 },
    { t: 64.0, actor: 'shammah', clip: 'Great_Sword_High_Spin_Attack', loop: false, timeScale: 1.35, fade: 0.1 },
    { t: 64.6, actor: 'elite3', clip: 'Big_Side_Hit', loop: false, timeScale: 1.1, fade: 0.06 },
    { t: 65.4, actor: 'shammah', clip: 'Two_Hand_Sword_Combo', loop: false, timeScale: 1.4, fade: 0.1 },
    { t: 66.0, actor: 'elite4', clip: 'sword_block', loop: false, timeScale: 1.2, fade: 0.1 },
    { t: 66.8, actor: 'shammah', clip: 'Great_Sword_Kick', loop: false, timeScale: 1.4, fade: 0.1 },
    { t: 67.3, actor: 'elite4', clip: 'Getting_Hit_Backwards', loop: false, timeScale: 1.15, fade: 0.06 },
    { t: 68.2, actor: 'shammah', clip: 'Great_Sword_Impact', loop: false, timeScale: 1.3, fade: 0.1 },
    { t: 68.8, actor: 'trio2', clip: 'Sword_And_Shield_Death', loop: false, timeScale: 1.0, fade: 0.12 },
    { t: 69.4, actor: 'shammah', clip: 'Great_Sword_Idle', loop: true, timeScale: 1.1, fade: 0.3 },
  ],
  events: [
    ev(62.7, 'sparks', [-7.3, 1.45, 2.4], { count: 34, power: 1.4 }),
    ev(62.75, 'shake', [-7.3, 1.4, 2.4], { amp: 1.2 }),
    ev(64.1, 'sparks', [-6.9, 1.55, 2.6], { count: 46, power: 1.7 }),
    ev(64.65, 'blood', [-6.8, 1.25, 2.9], { count: 26 }),
    ev(65.5, 'shieldShatter', [-8.4, 1.30, 2.2], { count: 60 }),
    ev(65.55, 'shake', [-8.4, 1.2, 2.2], { amp: 1.4 }),
    ev(66.9, 'dust', [-8.0, 0.35, 2.8], { count: 44, power: 1.4, ring: true }),
    ev(67.35, 'blood', [-7.9, 1.35, 3.4], { count: 22 }),
    ev(68.3, 'mud', [-6.2, 0.20, 1.2], { count: 40, power: 1.6 }),
    ev(68.35, 'shake', [-6.2, 0.8, 1.2], { amp: 1.3 }),
    ev(68.9, 'dust', [-7.0, 0.30, 0.4], { count: 30, power: 1.0, ambient: true }),
  ],
  note: 'Planted feet, soil deformation, armour-breaking two-handed strikes and a shield shatter.',
  crowd: 1,
});
