# Remotion agent skills, plugins & templates — installation and anatomy

## 1. `remotion-dev/skills` (★5,232)

Root: `README.md` · `package.json` · `scripts/` · `skills/` · `tsconfig.json`

```text
remotion-best-practices    remotion-captions      remotion-create       remotion-docs
remotion-interactivity     remotion-maps          remotion-markup       remotion-multimedia
remotion-render            remotion-saas          remotion-studio       remotion-upgrade
```

**Packaged as software**, not loose docs: a `package.json` and a `scripts/` folder mean the skill bundle can be built, versioned and released. This repo's `packages/cli/scripts/gen-skills-manifest.ts` + `skills-manifest.json` follow the same discipline (content-hashed manifest per skill).

All 12 are already mirrored in this repo's Tier 4 skill catalog. The forensic delta is **how upstream expects agents to install them**, which is what the plugin repos encode.

## 2. The five agent-plugin repos

| Repo | ★ | Host | Notes |
|---|---|---|---|
| `claude-code-plugin` | 50 | Claude Code | Largest adoption |
| `codex-plugin` | 26 | OpenAI Codex | Pairs with GPT-6.1 Sol as the driver model |
| `cursor-plugin` | 3 | Cursor | IDE-native |
| `kimi-code-plugin` | 2 | Kimi Code | Third-party model host |
| `agent-plugin` | 3 | **Portable** | "Portable Remotion Agent Plugin for compatible coding agents" |

In this repo, the equivalent glue lives at `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`, `.claude/`, `.codex/`, `.agents/` — with `.agents/skills/` and `.claude/skills/` kept byte-identical via symlinks and enforced by `scripts/check-skill-mirror.mjs`.

**Recommendation:** when adopting a new agent host, read `remotion-dev/agent-plugin` first — it is upstream's own portable contract, and matching it avoids re-inventing install conventions.

## 3. Prompt→motion-graphics: the official SaaS blueprint

`template-prompt-to-motion-graphics-saas` ★275 is upstream's own answer to "prompt in → motion graphics out". Anatomy to mine:

```text
prompt intake            → structured brief (what/where/how long/tone)
generation layer         → LLM writes Remotion JSX in a sandboxed project
validation layer         → typecheck + composition listing before render
render layer             → server/queue render → MP4 URL
billing/quota layer      → SaaS gating
```

This repo's equivalent is the agent-facing pipeline: `bin/ai-video` (doctor/verify/skills/presets/compositions) + the doctrine skills + seam gates. The difference: this repo adds **numeric gates** (seam gate, lint 0/0, 4-shot QC) that a generic SaaS template does not.

## 4. Template anatomy worth copying

| Template | ★ | The one thing to steal |
|---|---|---|
| `template-tiktok` | 288 | Whisper.cpp caption timing: transcribe locally, never pay for ASR |
| `template-audiogram` | 273 | Waveform-as-design: audio drives the composition |
| `template-code-hike` | 220 | Tokenisation-aware code animation (highlight *tokens*, not lines) |
| `template-prompt-to-video` | 154 | Story→images→VO loop with an image model in the middle |
| `template-three` | 113 | Minimal R3F wiring that does not fight Remotion's frame clock |
| `template-overlay` | 19 | Render **alpha overlays** for an NLE instead of full frames |
| `template-render-server` | 14 | The simplest self-hostable HTTP render service |
| `template-still` | 48 | Stills as a first-class output (thumbnails, QC gates) |
| `template-skia` | 25 | GPU vector drawing when CSS/Canvas is not enough |
| `template-next-*` | 126/62/53 | App-router delivery patterns for programmatic video apps |

### The overlay pattern (underrated)

```bash
# Render transparent overlay for Premiere/Resolve/AE
npx remotion render src/index.ts TitleCard out/overlay.mov --codec=prores --prores-profile=4444
```

Clients who will not leave their NLE still get deterministic motion graphics. Offer this before offering a full render — it removes the biggest adoption objection.

## 5. Anatomy of a well-behaved composition (house rules from this repo)

```tsx
// 1. Frame-driven only — no wall-clock animation
const frame = useCurrentFrame();
const { fps, durationInFrames } = useVideoConfig();

// 2. Seeded randomness (never Math.random in shipped comps)
const rnd = seededRandom(seed);

// 3. Interpolation with explicit extrapolation
const x = interpolate(frame, [0, 30], [0, 100], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});

// 4. Deterministic props via zod schema (composition-level contract)
export const schema = z.object({ title: z.string(), accent: z.string() });
```

Plugins/skills that violate determinism (wall-clock timers, unseeded noise, CDN fetches at render time) are the most common cause of "it looked fine in Studio and wrong in the render" — this repo's offline-first `toolkit/vendor/` rule exists precisely to prevent that.

## 6. Install & verify checklist

- [ ] `npx remotion compositions src/index.ts` lists **all 10** registered compositions
- [ ] Plugin/skill installed for the host actually in use (Claude Code / Codex / Cursor / portable)
- [ ] `remotion` and every `@remotion/*` package on the **same exact version**
- [ ] No CDN dependency at render time (`toolkit/vendor/` only)
- [ ] A 4-shot QC still set renders before every delivery
- [ ] Any new upstream template copied in is re-skinned to house doctrine (Vector Law, seam stamps)
