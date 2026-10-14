import { continueRender, delayRender, staticFile } from "remotion";

/**
 * Load the locally-bundled font set via the FontFace API.
 *
 * Why not an @font-face block in CSS? Remotion bundles with webpack, which
 * tries to resolve `url("/fonts/x.woff2")` as a *module import* and fails.
 * staticFile() resolves against /public and hands back a real URL instead.
 *
 * delayRender/continueRender keeps the renderer from capturing a frame before
 * the fonts are ready — otherwise early frames silently fall back to a
 * system serif and the first second of your video looks wrong.
 */
type Face = { family: string; file: string; weight: string };

export const FONT_FACES: Face[] = [
  { family: "Cinzel", file: "cinzel-400.woff2", weight: "400" },
  { family: "Cinzel", file: "cinzel-700.woff2", weight: "700" },
  { family: "Cormorant Garamond", file: "cormorant-400.woff2", weight: "400" },
  { family: "Cormorant Garamond", file: "cormorant-700.woff2", weight: "700" },
  { family: "Inter", file: "inter-400.woff2", weight: "400" },
  { family: "Inter", file: "inter-500.woff2", weight: "500" },
  { family: "Inter", file: "inter-600.woff2", weight: "600" },
  { family: "Inter", file: "inter-700.woff2", weight: "700" },
  { family: "Space Grotesk", file: "sg-400.woff2", weight: "400" },
  { family: "Space Grotesk", file: "sg-700.woff2", weight: "700" },
  { family: "JetBrains Mono", file: "mono-400.woff2", weight: "400" },
  { family: "JetBrains Mono", file: "mono-700.woff2", weight: "700" },
];

export const loadFonts = (): void => {
  if (typeof document === "undefined") return;
  const handle = delayRender("Loading local fonts");
  // lib.dom omits FontFaceSet.add in some TypeScript releases, though browsers implement it.
  const fontSet = document.fonts as FontFaceSet & { add: (face: FontFace) => void };
  const jobs = FONT_FACES.map(({ family, file, weight }) => {
    const face = new FontFace(
      family,
      `url(${staticFile(`fonts/${file}`)}) format("woff2")`,
      { weight },
    );
    return face.load().then((loaded) => {
      fontSet.add(loaded);
    });
  });
  Promise.all(jobs)
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle)); // never deadlock a render on a font
};
