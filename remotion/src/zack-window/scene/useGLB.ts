import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

const cache = new Map<string, Promise<GLTF>>();

const load = (url: string) => {
  let p = cache.get(url);
  if (!p) {
    const loader = new GLTFLoader();
    p = loader.loadAsync(url);
    cache.set(url, p);
  }
  return p;
};

/** Load a GLB once per page, blocking the Remotion frame until it is ready. */
export const useGLB = (url: string): GLTF | null => {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  useEffect(() => {
    const handle = delayRender(`Loading ${url}`, { timeoutInMilliseconds: 120000 });
    let alive = true;
    load(url)
      .then((g) => {
        if (!alive) return;
        g.scene.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.frustumCulled = false;
          }
        });
        setGltf(g);
        // Let React commit the model (and the consumer re-draw) before the frame is captured.
        setTimeout(() => continueRender(handle), 0);
      })
      .catch((e) => cancelRender(e));
    return () => {
      alive = false;
    };
  }, [url]);
  return gltf;
};
