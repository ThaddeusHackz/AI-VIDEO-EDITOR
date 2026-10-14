// Dump an FBX's hierarchy/bones/morphs without a DOM: node scripts/inspect-fbx.mjs file.fbx
import fs from "node:fs";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
const file = process.argv[2];
const manager = new THREE.LoadingManager();
const dummy = { setPath() { return this; }, setCrossOrigin() { return this; }, load: (url) => { console.log("TEXURL", url); const t = new THREE.Texture(); t.name = url; return t; } };
manager.addHandler(/.*/i, dummy);
const loader = new FBXLoader(manager);
const buf = fs.readFileSync(file);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const scene = loader.parse(ab, "");
const box = new THREE.Box3().setFromObject(scene);
console.log("bbox", box.min.toArray().map(v=>v.toFixed(1)), box.max.toArray().map(v=>v.toFixed(1)));
const walk = (o, d) => {
  const t = o.isBone ? "Bone" : o.isSkinnedMesh ? "SkinnedMesh" : o.isMesh ? "Mesh" : o.type;
  let extra = "";
  if (o.isMesh) {
    const g = o.geometry; extra = ` tris=${(g.index ? g.index.count : g.attributes.position.count)/3|0} mats=${Array.isArray(o.material)?o.material.map(m=>m.name).join("|"):o.material.name}`;
    if (o.morphTargetDictionary) extra += ` morphs=${Object.keys(o.morphTargetDictionary).length}`;
  }
  if (o.isBone) { const p = new THREE.Vector3(); o.getWorldPosition(p); extra = ` @${p.toArray().map(v=>v.toFixed(0)).join(",")}`; }
  if (d < 40) console.log("  ".repeat(d) + t + " " + o.name + extra);
  o.children.forEach(c => walk(c, d + 1));
};
walk(scene, 0);
scene.traverse(o => { if (o.isMesh && o.morphTargetDictionary) console.log("MORPHS", o.name, Object.keys(o.morphTargetDictionary).join(", ")); });
scene.traverse(o => { if (o.isMesh) { const mats = Array.isArray(o.material)?o.material:[o.material]; mats.forEach(m => console.log("MAT", o.name, m.name, m.type, "map", m.map?.name ?? m.map?.image?.src ?? (m.map?"yes":"no"), "nrm", !!m.normalMap, "spec", !!m.specularMap, "alpha", !!m.alphaMap, "transparent", m.transparent)); }});
