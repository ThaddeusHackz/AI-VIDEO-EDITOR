import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { mulberry32 } from "../../engine/cameraRig";
import { CinemaStudio4Stage } from "../../engine/cinemaStudio4";
import { P } from "../data";

/**
 * Static film grain (one baked tile, never animated — animated grain halves what survives a platform re-encode,
 * see skills/opus-js-animations/references/delivery.md) plus a ≤4/255 dither that keeps the dark void from banding.
 */
function useGrainTile(): string {
  return useMemo(() => {
    if (typeof document === "undefined") return "";
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(size, size);
    const rand = mulberry32(424242);
    for (let i = 0; i < size * size; i++) {
      const v = 128 + (rand() + rand() + rand() - 1.5) * 90;
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL("image/png");
  }, []);
}

export const Grade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const grain = useGrainTile();
  return (
    <AbsoluteFill style={{ backgroundColor: P.void }}>
      <CinemaStudio4Stage palette="Teal & Orange" lighting="Auto" cameraBody="35mm Film" lens="Clean Sharp">
        <AbsoluteFill style={{ backgroundColor: P.void }}>{children}</AbsoluteFill>
      </CinemaStudio4Stage>
      {/* vignette — obsidian edges pull the eye to the action */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(2,2,5,0.62) 100%)",
        }}
      />
      {grain ? (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            backgroundImage: `url(${grain})`,
            backgroundRepeat: "repeat",
            opacity: 0.05,
            mixBlendMode: "overlay",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
