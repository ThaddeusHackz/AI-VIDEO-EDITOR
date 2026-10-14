import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

const cache = new Map<string, Promise<THREE.Group>>();

/**
 * Load an FBX (plus the textures it references) once per page. `textures` maps the
 * file names baked into the FBX (e.g. "m017_head_color.tga") to the URLs we actually serve.
 */
const load = (url: string, textures: Record<string, string>, extra: Record<string, string>) => {
  let p = cache.get(url);
  if (!p) {
    p = new Promise<THREE.Group>((resolve, reject) => {
      const manager = new THREE.LoadingManager();
      manager.setURLModifier((u) => {
        const base = u.split(/[\\/]/).pop() ?? u;
        return textures[base] ?? u;
      });
      // FBXLoader refuses .tga unless a handler is registered; our URL modifier swaps in PNG/JPG anyway
      const texLoader = new THREE.TextureLoader(manager);
      manager.addHandler(/\.tga$/i, texLoader);
      let group: THREE.Group | null = null;
      // extra maps the FBX does not reference (e.g. a hand-made roughness map) -> group.userData.textures
      const extras: Record<string, THREE.Texture> = {};
      for (const [key, href] of Object.entries(extra)) extras[key] = texLoader.load(href);
      manager.onLoad = () => {
        if (!group) return;
        group.userData.textures = extras;
        resolve(group);
      };
      manager.onError = (u) => reject(new Error(`Failed to load ${u}`));
      new FBXLoader(manager).load(url, (g) => {
        group = g;
      }, undefined, reject);
    });
    cache.set(url, p);
  }
  return p;
};

/** FBX + textures, blocking the Remotion frame until everything is ready. */
export const useFBX = (url: string, textures: Record<string, string>, extra: Record<string, string> = {}): THREE.Group | null => {
  const [group, setGroup] = useState<THREE.Group | null>(null);
  useEffect(() => {
    const handle = delayRender(`Loading ${url}`, { timeoutInMilliseconds: 180000 });
    let alive = true;
    load(url, textures, extra)
      .then((g) => {
        if (!alive) return;
        setGroup(g);
        // Let React commit the model (and the consumer re-draw) before the frame is captured.
        setTimeout(() => continueRender(handle), 0);
      })
      .catch((e) => cancelRender(e));
    return () => {
      alive = false;
    };
    // textures/extra are static tables
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  return group;
};
