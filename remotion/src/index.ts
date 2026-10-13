import { registerRoot } from "remotion";
import { loadFonts } from "./fonts";
import { RemotionRoot } from "./Root";

// Must run before registerRoot so no frame is captured with fallback fonts.
loadFonts();

registerRoot(RemotionRoot);
